import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import styles from './styles.module.css';

/**
 * Interactive collaboration globe for /networks — responsive for mouse and
 * touch. Mirrors the Hero3D loading pattern: a static fallback renders
 * instantly (SSR-safe); three.js mounts client-side only via dynamic import.
 * Rendering pauses off-screen and in hidden tabs.
 *
 * Reading & interaction model:
 *  - desktop: hover highlights a node + tooltip card; click focuses the
 *    country and slides in a side panel with every institution
 *  - touch: tap (or the chip strip below the canvas — the primary mobile
 *    navigation) selects a country and opens a bottom sheet; horizontal
 *    one-finger drag rotates, two-finger pinch zooms, vertical swipes keep
 *    scrolling the page (touch-action: pan-y)
 *  - keyboard: the canvas host takes focus (arrows rotate); the chip strip
 *    tabs through every country, Enter opens its details
 *  - prefers-reduced-motion mounts the same globe without auto-rotation or
 *    pulses (renders on demand); no-WebGL falls back to the static map image
 *
 * `countries` come from src/data/collaborations.json (regenerated from
 * OpenAlex via `npm run generate:network`), pre-sorted by works descending —
 * chip order, label priority and card order all follow it automatically.
 */

// ISO 3166-1 alpha-2 code → flag emoji (regional indicator symbols).
function flagEmoji(code) {
  return String.fromCodePoint(...[...code.toUpperCase()].map((ch) => 0x1f1a5 + ch.charCodeAt(0)));
}

const TAP_SLOP_PX = 9;
const TAP_MS = 500;
const LABELED_COUNT = 8;

function CountUp({value, duration = 1400, run}) {
  const [shown, setShown] = useState(run ? 0 : value);
  useEffect(() => {
    if (!run) {
      setShown(value);
      return undefined;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / duration);
      setShown(Math.round(value * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, run]);
  return <>{shown}</>;
}

export default function CollabGlobe({home, countries, totals}) {
  const hostRef = useRef(null);
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const handleRef = useRef(null);
  const labelHostRef = useRef(null);
  const sheetCloseRef = useRef(null);
  const lastFocusRef = useRef(null);
  const tooltipRef = useRef(null);
  const tooltipPosRef = useRef({x: 0, y: 0});

  const [ready, setReady] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);
  const [statsRun, setStatsRun] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  const selectCountry = useCallback((index, {focus = true, from = null} = {}) => {
    lastFocusRef.current = from;
    setSelected(index);
    const handle = handleRef.current;
    if (handle && index !== null) {
      handle.setSelected(index);
      if (focus) handle.focusCountry(index);
    } else if (handle) {
      handle.setSelected(-1);
    }
  }, []);

  const dismiss = useCallback(() => {
    setSelected(null);
    if (handleRef.current) handleRef.current.setSelected(-1);
    if (lastFocusRef.current) {
      lastFocusRef.current.focus?.();
      lastFocusRef.current = null;
    }
  }, []);

  useEffect(() => {
    setIsTouch(window.matchMedia('(pointer: coarse)').matches);
    // No WebGL: the static map fallback inside the stage stays visible.
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) {
      return undefined;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lowTier =
      (window.devicePixelRatio || 1) >= 2.5 ||
      Math.min(window.innerWidth, window.innerHeight) < 480 ||
      (navigator.hardwareConcurrency || 4) < 4;

    let handle = null;
    let cancelled = false;
    let isInViewport = typeof IntersectionObserver === 'undefined';
    let isTabVisible = document.visibilityState !== 'hidden';
    const host = hostRef.current;
    const stage = stageRef.current;

    const syncRunning = () => {
      if (!handle) return;
      if (isInViewport && isTabVisible) {
        handle.start();
      } else {
        handle.stop();
      }
    };

    const dpr = () => Math.min(window.devicePixelRatio || 1, lowTier ? 1.5 : 2);

    import(/* webpackChunkName: "collabglobe" */ './globeScene').then(({createGlobeScene}) => {
      if (cancelled || !canvasRef.current) return;
      // Persistent labels are plain DOM nodes the scene positions directly
      // every frame — no per-frame React work.
      const labelEls = new Map();
      if (labelHostRef.current) {
        [...labelHostRef.current.children].forEach((el) => {
          labelEls.set(Number(el.dataset.index), el);
        });
      }
      handle = createGlobeScene(canvasRef.current, {
        home,
        countries,
        dpr: dpr(),
        reducedMotion,
        lowTier,
        labelEls,
        onHover: (index) => setHovered(index >= 0 ? index : null),
      });
      handleRef.current = handle;
      // Debug/tuning hook (harmless in prod): pick a country by NDC coords.
      window.__collabPick = (x, y) => handle.pick(x, y);
      if (stage) {
        handle.resize(stage.clientWidth, stage.clientHeight, dpr());
      }
      syncRunning();
      setReady(true);
    });

    let intersectionObserver = null;
    if (typeof IntersectionObserver !== 'undefined' && stage) {
      intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            isInViewport = entry.isIntersecting;
            if (entry.isIntersecting) setStatsRun(true);
            syncRunning();
          });
        },
        {threshold: 0.1},
      );
      intersectionObserver.observe(stage);
    }

    const onVisibilityChange = () => {
      isTabVisible = document.visibilityState !== 'hidden';
      syncRunning();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Container-based sizing: the renderer follows the stage element, not
    // the window. rAF-deferred to avoid ResizeObserver loop warnings.
    let resizeObserver = null;
    let resizeRaf = 0;
    if (typeof ResizeObserver !== 'undefined' && stage) {
      resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        const {width, height} = entry.contentRect;
        cancelAnimationFrame(resizeRaf);
        resizeRaf = requestAnimationFrame(() => {
          if (handle) handle.resize(width, height, dpr());
        });
      });
      resizeObserver.observe(stage);
    }

    // ---- Pointer gestures: drag / tap / pinch ------------------------------
    const pointers = new Map(); // pointerId → {x, y}
    let tapStart = null; // {x, y, t}
    let pinchDist = 0;

    const toLocal = (event) => {
      const rect = stage.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        ndcX: ((event.clientX - rect.left) / rect.width) * 2 - 1,
        ndcY: -(((event.clientY - rect.top) / rect.height) * 2 - 1),
      };
    };

    const onPointerDown = (event) => {
      if (!handle) return;
      pointers.set(event.pointerId, {x: event.clientX, y: event.clientY});
      stage.setPointerCapture?.(event.pointerId);
      if (pointers.size === 1) {
        tapStart = {x: event.clientX, y: event.clientY, t: performance.now()};
        handle.pointerDown();
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
        tapStart = null;
      }
    };

    const onPointerMove = (event) => {
      if (!handle) return;
      const prev = pointers.get(event.pointerId);
      if (prev) {
        prev.x = event.clientX;
        prev.y = event.clientY;
      }
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchDist > 0 && d > 0) handle.zoomBy(pinchDist / d);
        pinchDist = d;
        return;
      }
      const {x, y, ndcX, ndcY} = toLocal(event);
      tooltipPosRef.current = {x, y};
      if (tooltipRef.current) {
        tooltipRef.current.style.transform = `translate(${x + 14}px, ${y - 10}px)`;
      }
      if (tapStart && Math.hypot(event.clientX - tapStart.x, event.clientY - tapStart.y) > TAP_SLOP_PX) {
        tapStart = null;
      }
      handle.pointerMove(event.clientX, event.clientY, ndcX, ndcY, pointers.size === 1);
    };

    const endPointer = (event, allowTap) => {
      pointers.delete(event.pointerId);
      if (pointers.size < 2) pinchDist = 0;
      if (pointers.size === 0 && handle) {
        handle.pointerUp();
        if (allowTap && tapStart && performance.now() - tapStart.t < TAP_MS) {
          const {ndcX, ndcY} = toLocal(event);
          const hit = handle.pick(ndcX, ndcY);
          if (hit >= 0) {
            selectCountry(hit, {from: null});
          } else {
            dismiss();
          }
        }
        tapStart = null;
      }
    };
    const onPointerUp = (event) => endPointer(event, true);
    const onPointerCancel = (event) => endPointer(event, false);
    const onPointerLeave = () => {
      if (handle) {
        handle.pointerMove(0, 0, 2, 2, false); // park the hover ray offscreen
        setHovered(null);
      }
    };

    // Keyboard on the stage: arrows rotate/tilt, Escape dismisses.
    const onKeyDown = (event) => {
      if (!handle) return;
      const step = 0.14;
      if (event.key === 'ArrowLeft') {
        handle.nudge(step, 0);
        event.preventDefault();
      } else if (event.key === 'ArrowRight') {
        handle.nudge(-step, 0);
        event.preventDefault();
      } else if (event.key === 'ArrowUp') {
        handle.nudge(0, -step * 0.6);
        event.preventDefault();
      } else if (event.key === 'ArrowDown') {
        handle.nudge(0, step * 0.6);
        event.preventDefault();
      }
    };

    if (stage) {
      stage.addEventListener('pointerdown', onPointerDown);
      stage.addEventListener('pointermove', onPointerMove);
      stage.addEventListener('pointerup', onPointerUp);
      stage.addEventListener('pointercancel', onPointerCancel);
      stage.addEventListener('pointerleave', onPointerLeave);
      stage.addEventListener('keydown', onKeyDown);
    }

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (stage) {
        stage.removeEventListener('pointerdown', onPointerDown);
        stage.removeEventListener('pointermove', onPointerMove);
        stage.removeEventListener('pointerup', onPointerUp);
        stage.removeEventListener('pointercancel', onPointerCancel);
        stage.removeEventListener('pointerleave', onPointerLeave);
        stage.removeEventListener('keydown', onKeyDown);
      }
      if (intersectionObserver) intersectionObserver.disconnect();
      cancelAnimationFrame(resizeRaf);
      if (resizeObserver) resizeObserver.disconnect();
      if (handle) handle.dispose();
      handleRef.current = null;
      delete window.__collabPick;
    };
    // home/countries come from a static JSON import — stable for the page's life.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Focus management + Escape for the detail sheet/panel.
  useEffect(() => {
    if (selected === null) return undefined;
    sheetCloseRef.current?.focus();
    const onKey = (event) => {
      if (event.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, dismiss]);

  const hoveredCountry =
    hovered !== null && hovered !== selected && !isTouch ? countries[hovered] : null;
  const selectedCountry = selected !== null ? countries[selected] : null;

  const statItems = useMemo(
    () =>
      totals
        ? [
            {value: totals.countries, label: 'countries'},
            {value: totals.institutions, label: 'institutions'},
            {value: totals.resolved, label: 'works'},
          ]
        : [],
    [totals],
  );

  return (
    <div ref={hostRef} className={styles.globeHost}>
      <div
        ref={stageRef}
        className={styles.stage}
        tabIndex={0}
        role="application"
        aria-label="Interactive globe of Applied INtelligence Lab collaborations radiating from Seoul. Use arrow keys to rotate; pick countries from the list below the globe."
      >
        {/* Static fallback for no-JS / no-WebGL visitors. */}
        {!ready && (
          <img
            src="/team/collaboration_map.webp"
            alt="Applied INtelligence Lab collaboration map"
            className={styles.fallbackMap}
            loading="lazy"
          />
        )}
        <canvas
          ref={canvasRef}
          className={`${styles.globeCanvas} ${ready ? styles.globeCanvasReady : ''}`}
          aria-hidden="true"
        />

        {/* Persistent labels for the top countries; positioned by the scene. */}
        <div ref={labelHostRef} className={styles.labelLayer} aria-hidden="true">
          {countries.slice(0, Math.max(LABELED_COUNT, countries.length)).map((country, i) => (
            <span
              key={country.code}
              data-index={i}
              data-on="0"
              className={`${styles.nodeLabel} ${i === selected ? styles.nodeLabelActive : ''}`}
            >
              {country.name}
            </span>
          ))}
        </div>

        {/* Animated stats in the corner of the globe. */}
        {statItems.length > 0 && ready && (
          <div className={styles.statsOverlay} aria-hidden="true">
            {statItems.map((s, i) => (
              <span key={s.label}>
                {i > 0 && <em>·</em>}
                <strong>
                  <CountUp value={s.value} run={statsRun} />
                </strong>{' '}
                {s.label}
              </span>
            ))}
          </div>
        )}

        {/* Desktop hover tooltip card. */}
        {hoveredCountry && (
          <div
            ref={tooltipRef}
            className={styles.tooltip}
            style={{
              transform: `translate(${tooltipPosRef.current.x + 14}px, ${tooltipPosRef.current.y - 10}px)`,
            }}
          >
            <div className={styles.tooltipHead}>
              <span aria-hidden="true">{flagEmoji(hoveredCountry.code)}</span>
              <strong>{hoveredCountry.name}</strong>
              <em>
                {hoveredCountry.works} {hoveredCountry.works === 1 ? 'work' : 'works'}
              </em>
            </div>
            <ul>
              {hoveredCountry.institutions.slice(0, 3).map((inst) => (
                <li key={inst}>{inst}</li>
              ))}
            </ul>
            {hoveredCountry.institutions.length > 3 && (
              <span className={styles.tooltipMore}>
                +{hoveredCountry.institutions.length - 3} more — click to see all
              </span>
            )}
          </div>
        )}

        <p className={styles.hint} aria-hidden="true">
          {isTouch
            ? 'Swipe sideways to spin · pinch to zoom · tap a dot or a chip below'
            : 'Drag to rotate · hover for details · click a node to focus'}
        </p>
      </div>

      {/* Country chips: swipeable on mobile, tabbable everywhere — the
          primary navigation that never requires aiming at 3D nodes. */}
      <div className={styles.chipStrip} role="listbox" aria-label="Collaborating countries">
        {countries.map((country, i) => (
          <button
            key={country.code}
            type="button"
            role="option"
            aria-selected={i === selected}
            className={`${styles.chip} ${i === selected ? styles.chipActive : ''}`}
            onClick={(event) => {
              if (i === selected) {
                dismiss();
              } else {
                selectCountry(i, {from: event.currentTarget});
              }
            }}
          >
            <span aria-hidden="true">{flagEmoji(country.code)}</span>
            <span className={styles.chipName}>{country.name}</span>
            <span className={styles.chipWorks}>{country.works}</span>
          </button>
        ))}
      </div>

      {/* Detail view: side panel on wide screens, bottom sheet on mobile. */}
      {selectedCountry && (
        // Dismiss on pointerdown, NOT click: after a touch tap selects a
        // country, the browser fires a delayed compat mouse click at the same
        // spot — it would land on this freshly-mounted scrim and instantly
        // close the sheet (ghost click). Pointer events are never re-fired
        // for compat mouse events, so pointerdown is immune.
        <div className={styles.sheetScrim} onPointerDown={dismiss}>
          <aside
            className={styles.sheet}
            role="dialog"
            aria-label={`${selectedCountry.name} collaboration details`}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className={styles.sheetGrab} aria-hidden="true" />
            <div className={styles.sheetHead}>
              <span className={styles.sheetFlag} aria-hidden="true">
                {flagEmoji(selectedCountry.code)}
              </span>
              <div>
                <h3>{selectedCountry.name}</h3>
                <p>
                  {selectedCountry.works} co-authored{' '}
                  {selectedCountry.works === 1 ? 'work' : 'works'} ·{' '}
                  {selectedCountry.institutions.length}{' '}
                  {selectedCountry.institutions.length === 1 ? 'institution' : 'institutions'}
                </p>
              </div>
              <button
                ref={sheetCloseRef}
                type="button"
                className={styles.sheetClose}
                onClick={dismiss}
                aria-label="Close country details"
              >
                ×
              </button>
            </div>
            <ul className={styles.sheetList}>
              {selectedCountry.institutions.map((inst) => (
                <li key={inst}>{inst}</li>
              ))}
            </ul>
          </aside>
        </div>
      )}

    </div>
  );
}
