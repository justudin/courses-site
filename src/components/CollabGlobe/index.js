import React, {useEffect, useRef, useState} from 'react';
import styles from './styles.module.css';

/**
 * Interactive collaboration globe for /networks. Mirrors the Hero3D loading
 * pattern: a static fallback renders instantly (SSR-safe); three.js mounts
 * client-side only, via dynamic import, and only when the visitor allows
 * motion and has WebGL. Rendering pauses off-screen and in hidden tabs.
 *
 * `countries` come from src/data/collaborations.json (see
 * scripts/generate-collaboration-network.js). Hovering a country marker
 * reports its index up through onHover for the tooltip.
 */
export default function CollabGlobe({home, countries}) {
  const hostRef = useRef(null);
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [hovered, setHovered] = useState(null);
  const tooltipPosRef = useRef({x: 0, y: 0});
  const tooltipRef = useRef(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return undefined;
    }
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) {
      return undefined;
    }

    let handle = null;
    let cancelled = false;
    let isInViewport = typeof IntersectionObserver === 'undefined';
    let isTabVisible = document.visibilityState !== 'hidden';
    const host = hostRef.current;

    const syncRunning = () => {
      if (!handle) return;
      if (isInViewport && isTabVisible) {
        handle.start();
      } else {
        handle.stop();
      }
    };

    const dpr = () => Math.min(window.devicePixelRatio || 1, 2);

    import(/* webpackChunkName: "collabglobe" */ './globeScene').then(({createGlobeScene}) => {
      if (cancelled || !canvasRef.current) return;
      handle = createGlobeScene(canvasRef.current, {
        home,
        countries,
        dpr: dpr(),
        onHover: (index) => {
          setHovered(index >= 0 ? index : null);
        },
      });
      if (host) {
        handle.resize(host.clientWidth, host.clientHeight, dpr());
      }
      syncRunning();
      setReady(true);
    });

    let intersectionObserver = null;
    if (typeof IntersectionObserver !== 'undefined' && host) {
      intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            isInViewport = entry.isIntersecting;
            syncRunning();
          });
        },
        {threshold: 0.1},
      );
      intersectionObserver.observe(host);
    }

    const onVisibilityChange = () => {
      isTabVisible = document.visibilityState !== 'hidden';
      syncRunning();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    let resizeObserver = null;
    let resizeRaf = 0;
    if (typeof ResizeObserver !== 'undefined' && host) {
      // Resizing the renderer synchronously inside the observer callback can
      // change layout in the same frame, which the browser reports as
      // "ResizeObserver loop completed with undelivered notifications" —
      // defer the work to the next animation frame to break the loop.
      resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        const {width, height} = entry.contentRect;
        cancelAnimationFrame(resizeRaf);
        resizeRaf = requestAnimationFrame(() => {
          if (handle) handle.resize(width, height, dpr());
        });
      });
      resizeObserver.observe(host);
    }

    const toLocal = (event) => {
      const rect = host.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        ndcX: ((event.clientX - rect.left) / rect.width) * 2 - 1,
        ndcY: -(((event.clientY - rect.top) / rect.height) * 2 - 1),
      };
    };
    const onPointerDown = (event) => {
      if (!handle) return;
      host.setPointerCapture?.(event.pointerId);
      handle.pointerDown(event.clientX);
    };
    const onPointerMove = (event) => {
      if (!handle) return;
      const {x, y, ndcX, ndcY} = toLocal(event);
      tooltipPosRef.current = {x, y};
      if (tooltipRef.current) {
        tooltipRef.current.style.transform = `translate(${x + 14}px, ${y - 10}px)`;
      }
      handle.pointerMove(event.clientX, event.clientY, ndcX, ndcY);
    };
    const onPointerUp = () => {
      if (handle) handle.pointerUp();
    };
    if (host) {
      host.addEventListener('pointerdown', onPointerDown);
      host.addEventListener('pointermove', onPointerMove);
      host.addEventListener('pointerup', onPointerUp);
      host.addEventListener('pointerleave', onPointerUp);
    }

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (host) {
        host.removeEventListener('pointerdown', onPointerDown);
        host.removeEventListener('pointermove', onPointerMove);
        host.removeEventListener('pointerup', onPointerUp);
        host.removeEventListener('pointerleave', onPointerUp);
      }
      if (intersectionObserver) intersectionObserver.disconnect();
      cancelAnimationFrame(resizeRaf);
      if (resizeObserver) resizeObserver.disconnect();
      if (handle) handle.dispose();
    };
    // home/countries come from a static JSON import — stable for the page's life.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hoveredCountry = hovered !== null ? countries[hovered] : null;

  return (
    <div ref={hostRef} className={styles.globeHost}>
      {/* Static fallback for no-JS / reduced-motion / no-WebGL visitors. */}
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
        aria-label="Interactive globe of Applied INtelligence Lab collaborations radiating from Seoul"
        role="img"
      />
      {hoveredCountry && (
        <div ref={tooltipRef} className={styles.tooltip} style={{transform: `translate(${tooltipPosRef.current.x + 14}px, ${tooltipPosRef.current.y - 10}px)`}}>
          <strong>{hoveredCountry.name}</strong>
          <span>
            {hoveredCountry.works} co-authored {hoveredCountry.works === 1 ? 'work' : 'works'} ·{' '}
            {hoveredCountry.institutions.length}{' '}
            {hoveredCountry.institutions.length === 1 ? 'institution' : 'institutions'}
          </span>
        </div>
      )}
      <p className={styles.hint} aria-hidden="true">
        Drag to rotate · hover a node for details
      </p>
    </div>
  );
}
