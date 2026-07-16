import React, {useEffect, useRef} from 'react';
import styles from './styles.module.css';

const LogoMark = require('@site/static/img/favicon.svg').default;

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
 */
export default function Hero3D({posterSrc, alt}) {
  const hostRef = useRef(null);
  const canvasRef = useRef(null);

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

    import(/* webpackChunkName: "hero3d" */ './scene').then(({createHeroScene}) => {
      if (cancelled || !canvasRef.current) {
        return;
      }
      handle = createHeroScene(canvasRef.current, {
        theme: getSiteTheme(),
        quality: computeQuality(),
      });
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
    if (typeof ResizeObserver !== 'undefined' && host) {
      resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry || !handle) {
          return;
        }
        const {width, height} = entry.contentRect;
        handle.resize(width, height, computeQuality().dpr);
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
