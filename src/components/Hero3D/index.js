import React, {useEffect, useRef} from 'react';
import styles from './styles.module.css';

const LogoMark = require('@site/static/img/favicon.svg').default;

const INTRO_SEEN_KEY = 'aintlab.introSeen.v1';

function getSiteTheme() {
  if (typeof document === 'undefined') {
    return 'light';
  }
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

/**
 * Homepage hero background: a fallback gradient/poster/static logo layer that
 * is always rendered (SSR-safe, instant paint), overlaid by a three.js canvas
 * that is only ever mounted client-side, and only when the visitor hasn't
 * asked for reduced motion and their browser supports WebGL. three.js itself
 * is loaded via a dynamic import so it never enters the main bundle and never
 * loads on any page other than the homepage.
 *
 * First visit only (per INTRO_SEEN_KEY in localStorage), the scene plays the
 * "forging of the mark" intro. Phase names are relayed to the page through
 * onIntroPhase so the caption overlay stays in sync, and introApiRef.current
 * gets a {skip} handle for the Skip button. The intro is marked seen once it
 * completes (or is skipped), so an abandoned intro replays next time.
 */
/**
 * suppressIntro: when true, the forge intro never plays regardless of the
 * seen-flag — used while the page hasn't yet decided whether the cinematic
 * intro (CinematicIntro) runs first. It is read once on mount; the page
 * remounts Hero3D (conditional render) when the decision changes.
 */
export default function Hero3D({posterSrc, alt, onIntroPhase, introApiRef, suppressIntro = false}) {
  const hostRef = useRef(null);
  const canvasRef = useRef(null);
  // Keep the latest callback reachable from the one-shot mount effect.
  const onIntroPhaseRef = useRef(onIntroPhase);
  onIntroPhaseRef.current = onIntroPhase;

  useEffect(() => {
    // Whenever the intro is NOT going to play, say so ('none') — the page uses
    // this to clear the pre-paint html.intro-pending state (set by the inline
    // head script in docusaurus.config.js) instead of leaving the site veiled.
    const declineIntro = () => {
      if (onIntroPhaseRef.current) {
        onIntroPhaseRef.current('none');
      }
    };

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      declineIntro();
      return undefined;
    }

    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) {
      declineIntro();
      return undefined;
    }

    let handle = null;
    let cancelled = false;
    let isInViewport = typeof IntersectionObserver === 'undefined';
    let isTabVisible = document.visibilityState !== 'hidden';

    function syncRunning() {
      if (!handle) {
        return;
      }
      if (isInViewport && isTabVisible) {
        handle.start();
      } else {
        handle.stop();
      }
    }

    function computeQuality() {
      const isMobile = window.matchMedia('(max-width: 768px)').matches;
      const isLowPower = (navigator.hardwareConcurrency || 4) < 4;
      const isLowTier = isMobile || isLowPower;
      return {
        particleCount: isLowTier ? 18 : 70,
        dpr: Math.min(window.devicePixelRatio || 1, isLowTier ? 1.5 : 2),
      };
    }

    // First visit (per localStorage) gets the logo-creation intro. Storage
    // access can throw (privacy modes); treat that as "already seen".
    let playIntro = false;
    try {
      playIntro = !suppressIntro && window.localStorage.getItem(INTRO_SEEN_KEY) !== '1';
    } catch (err) {
      playIntro = false;
    }

    const relayIntroPhase = (phase) => {
      if (phase === 'done') {
        try {
          window.localStorage.setItem(INTRO_SEEN_KEY, '1');
        } catch (err) {
          // Best effort — the intro simply replays next visit.
        }
      }
      if (onIntroPhaseRef.current) {
        onIntroPhaseRef.current(phase);
      }
    };

    if (playIntro) {
      // Tell the page immediately (before the async chunk resolves) so it can
      // veil the hero copy instead of flashing it for a few frames.
      relayIntroPhase('pending');
    } else {
      declineIntro();
    }

    import(/* webpackChunkName: "hero3d" */ './scene').then(({createHeroScene}) => {
      if (cancelled || !canvasRef.current) {
        return;
      }
      handle = createHeroScene(canvasRef.current, {
        theme: getSiteTheme(),
        quality: computeQuality(),
        intro: playIntro,
        onIntroPhase: playIntro ? relayIntroPhase : undefined,
      });
      if (introApiRef) {
        introApiRef.current = {
          skip() {
            if (handle) {
              handle.skipIntro();
            }
          },
        };
      }
      const host = hostRef.current;
      if (host) {
        handle.resize(host.clientWidth, host.clientHeight, computeQuality().dpr);
      }
      syncRunning();
      canvasRef.current.classList.add(styles.canvasReady);
    });

    const host = hostRef.current;
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
    const onWindowResize = () => {
      if (handle && host) {
        handle.resize(host.clientWidth, host.clientHeight, computeQuality().dpr);
      }
    };
    let resizeRaf = 0;
    if (typeof ResizeObserver !== 'undefined' && host) {
      // Resizing the renderer synchronously inside the observer callback can
      // change layout in the same frame, which the browser reports as
      // "ResizeObserver loop completed with undelivered notifications" —
      // defer the work to the next animation frame to break the loop.
      resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) {
          return;
        }
        const {width, height} = entry.contentRect;
        cancelAnimationFrame(resizeRaf);
        resizeRaf = requestAnimationFrame(() => {
          if (handle) {
            handle.resize(width, height, computeQuality().dpr);
          }
        });
      });
      resizeObserver.observe(host);
    } else {
      window.addEventListener('resize', onWindowResize);
    }

    const themeObserver = new MutationObserver(() => {
      if (handle) {
        handle.setTheme(getSiteTheme());
      }
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    // Subtle pointer-parallax tilt + cursor-reactive particle network —
    // mouse/trackpad only (no touch, where there's no hover concept and this
    // would just be inert).
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
    const toNdc = (event) => {
      const rect = host.getBoundingClientRect();
      return {
        nx: ((event.clientX - rect.left) / rect.width) * 2 - 1,
        ny: ((event.clientY - rect.top) / rect.height) * 2 - 1,
      };
    };
    const onPointerMove = (event) => {
      if (!handle || !host) {
        return;
      }
      const {nx, ny} = toNdc(event);
      handle.setPointer(nx, ny, true);
    };
    const onPointerLeave = () => {
      if (handle) {
        handle.setPointer(0, 0, false);
      }
    };
    if (hasFinePointer && host) {
      host.addEventListener('pointermove', onPointerMove);
      host.addEventListener('pointerleave', onPointerLeave);
    }

    // Click/tap ripple through the network — works for touch too (a tap
    // "pings" the network even on devices without hover), since it's a
    // discrete one-shot interaction rather than a continuous hover effect.
    const onClick = (event) => {
      if (!handle || !host) {
        return;
      }
      const {nx, ny} = toNdc(event);
      handle.click(nx, ny);
    };
    if (host) {
      host.addEventListener('click', onClick);
    }

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('resize', onWindowResize);
      if (hasFinePointer && host) {
        host.removeEventListener('pointermove', onPointerMove);
        host.removeEventListener('pointerleave', onPointerLeave);
      }
      if (host) {
        host.removeEventListener('click', onClick);
      }
      if (intersectionObserver) {
        intersectionObserver.disconnect();
      }
      cancelAnimationFrame(resizeRaf);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      themeObserver.disconnect();
      if (handle) {
        handle.dispose();
      }
    };
  }, []);

  const fallbackStyle = {
    backgroundImage: posterSrc
      ? `linear-gradient(160deg, rgba(6, 22, 43, 0.6) 0%, rgba(11, 42, 82, 0.4) 55%, rgba(18, 58, 114, 0.22) 100%), url(${posterSrc})`
      : 'linear-gradient(160deg, #04101f 0%, #0b2a52 55%, #123a72 100%)',
  };

  return (
    <div ref={hostRef} className={styles.heroCanvasHost}>
      <div className={styles.heroFallback} style={fallbackStyle}>
        <LogoMark className={styles.fallbackLogo} width={200} height={200} role="img" aria-label={alt} />
      </div>
      <canvas ref={canvasRef} className={styles.heroCanvas} aria-hidden="true" />
    </div>
  );
}
