import React, {useEffect, useRef, useState} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

/**
 * Custom 404: a dark full-width stage where three.js particles assemble into
 * a "404" glyph — the cursor scatters them, a click pulses through the field.
 * three.js loads via dynamic import so it only ships on this route.
 * Reduced motion / no WebGL / SSR get a static gradient "404" instead.
 */
export default function NotFoundContent({className}) {
  const hostRef = useRef(null);
  const canvasRef = useRef(null);
  // Static "404" shows until (and unless) the scene takes over — so there is
  // never an empty stage, and non-WebGL/reduced-motion visitors keep it.
  const [sceneReady, setSceneReady] = useState(false);

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
    let resizeRaf = 0;
    let resizeObserver = null;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const isLowPower = (navigator.hardwareConcurrency || 4) < 4;

    import(/* webpackChunkName: "notfound-scene" */ './scene').then(({createLostScene}) => {
      if (cancelled || !canvasRef.current || !hostRef.current) {
        return;
      }
      const host = hostRef.current;
      handle = createLostScene(canvasRef.current, host, {
        particleCount: isMobile || isLowPower ? 1500 : 2600,
        dpr: isMobile || isLowPower ? 1.5 : 2,
      });
      handle.resize(host.clientWidth, host.clientHeight, window.devicePixelRatio);
      handle.start();
      setSceneReady(true);

      if (typeof ResizeObserver !== 'undefined') {
        // Defer to rAF so resizing inside the observer callback never loops.
        resizeObserver = new ResizeObserver(() => {
          cancelAnimationFrame(resizeRaf);
          resizeRaf = requestAnimationFrame(() => {
            if (handle) {
              handle.resize(host.clientWidth, host.clientHeight, window.devicePixelRatio);
            }
          });
        });
        resizeObserver.observe(host);
      }
    });

    const onVisibility = () => {
      if (!handle) return;
      if (document.visibilityState === 'hidden') {
        handle.stop();
      } else {
        handle.start();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      cancelAnimationFrame(resizeRaf);
      if (resizeObserver) resizeObserver.disconnect();
      if (handle) handle.dispose();
    };
  }, []);

  return (
    <main className={clsx(styles.stageWrap, className)}>
      <div ref={hostRef} className={styles.stage}>
        <canvas
          ref={canvasRef}
          className={clsx(styles.canvas, sceneReady && styles.canvasReady)}
          aria-hidden="true"
        />
        <span
          className={clsx(styles.fallbackGlyph, sceneReady && styles.fallbackGlyphHidden)}
          aria-hidden="true"
        >
          404
        </span>
        <div className={styles.content}>
          <p className={styles.eyebrow}>404 · Off the map</p>
          <h1 className={styles.title}>This page drifted off the map.</h1>
          <p className={styles.lead}>
            The address may have changed, or the spark you followed has moved on.
          </p>
          <div className={styles.actions}>
            <Link className="button button--secondary" to="/">
              Back to home
            </Link>
            <Link className="button white-btn" to="/updates">
              Explore updates
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
