import React, {useEffect, useRef} from 'react';
import Link from '@docusaurus/Link';
import collaborations from '@site/src/data/collaborations.json';
import styles from './styles.module.css';

/**
 * Lightweight 2D teaser of the collaboration network for the homepage:
 * the same NASA-derived land dots and DOI-derived country data as the
 * /networks globe, drawn flat on a 2D canvas with animated pulses running
 * from Seoul to each partner country. The whole panel links to /networks.
 *
 * Only countries with at least `minWorks` co-authored works are drawn, so
 * the small map stays legible. No three.js here — plain canvas 2D, land
 * dots lazy-loaded on first view, animation paused off-screen and skipped
 * entirely under prefers-reduced-motion.
 */

// Crop empty polar bands so the small map spends its pixels on land.
const LAT_MAX = 84;
const LAT_MIN = -58;
const MAP_ASPECT = (LAT_MAX - LAT_MIN) / 360; // height / width

const LAND_COLOR = 'rgba(85, 152, 221, 0.75)';
const ARC_COLOR = 'rgba(127, 216, 255, 0.4)';
const PULSE_COLOR = '#bfe8ff';
const MARKER_COLOR = '#7fd8ff';

export default function CollabMap2D({minWorks = 4}) {
  const hostRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return undefined;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const countries = collaborations.countries.filter((c) => c.works >= minWorks);
    const home = collaborations.home;
    const maxWorks = Math.max(...countries.map((c) => c.works), 1);

    let landDots = null;
    let frameId = null;
    let running = false;
    let inView = typeof IntersectionObserver === 'undefined';
    let cancelled = false;

    const ctx = canvas.getContext('2d');

    const project = (lat, lng, w, h) => [
      ((lng + 180) / 360) * w,
      ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * h,
    ];

    // Shift a target longitude by ±360° so the arc takes the shorter way;
    // wrapped arcs are stroked twice (offset by one map width) so the part
    // that leaves one edge re-enters on the other.
    const shortestLng = (fromLng, toLng) => {
      let lng = toLng;
      if (lng - fromLng > 180) lng -= 360;
      if (lng - fromLng < -180) lng += 360;
      return lng;
    };

    function draw(t) {
      const w = canvas.width;
      const h = canvas.height;
      if (w === 0 || h === 0) return;
      ctx.clearRect(0, 0, w, h);

      // Land dots
      if (landDots) {
        ctx.fillStyle = LAND_COLOR;
        const r = Math.max(0.7, w * 0.0014);
        for (let i = 0; i < landDots.length; i += 4) {
          const lat = landDots[i];
          if (lat > LAT_MAX || lat < LAT_MIN) continue;
          const [x, y] = project(lat, landDots[i + 1], w, h);
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const [hx, hy] = project(home.lat, home.lng, w, h);

      // Arcs + traveling pulses
      countries.forEach((country, index) => {
        const lng = shortestLng(home.lng, country.lng);
        const [cx, cy] = project(country.lat, lng, w, h);
        const mx = (hx + cx) / 2;
        const lift = Math.min(Math.abs(cx - hx) * 0.22 + 12, h * 0.3);
        const my = Math.min(hy, cy) - lift;

        const offsets = [0];
        if (cx < 0) offsets.push(w);
        if (cx > w) offsets.push(-w);

        offsets.forEach((offset) => {
          ctx.strokeStyle = ARC_COLOR;
          ctx.lineWidth = Math.max(0.8, w * 0.0009);
          ctx.beginPath();
          ctx.moveTo(hx + offset, hy);
          ctx.quadraticCurveTo(mx + offset, my, cx + offset, cy);
          ctx.stroke();
        });

        // Marker sized by works
        const mr = (2.2 + Math.sqrt(country.works / maxWorks) * 4.5) * (w / 700);
        offsets.forEach((offset) => {
          const x = cx + offset;
          if (x < -10 || x > w + 10) return;
          ctx.fillStyle = MARKER_COLOR;
          ctx.globalAlpha = 0.35;
          ctx.beginPath();
          ctx.arc(x, cy, mr * 1.9, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.arc(x, cy, mr, 0, Math.PI * 2);
          ctx.fill();
        });

        // Pulse traveling along the curve
        if (!prefersReducedMotion) {
          const speed = 0.1 + (country.works / maxWorks) * 0.08;
          const p = (t * speed + index * 0.37) % 1;
          const q = 1 - p;
          const px = q * q * hx + 2 * q * p * mx + p * p * cx;
          const py = q * q * hy + 2 * q * p * my + p * p * cy;
          offsets.forEach((offset) => {
            const x = px + offset;
            if (x < -10 || x > w + 10) return;
            ctx.fillStyle = PULSE_COLOR;
            ctx.globalAlpha = 0.9;
            ctx.beginPath();
            ctx.arc(x, py, Math.max(1.4, w * 0.0022), 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
          });
        }
      });

      // Seoul beacon: bright core + breathing ring
      ctx.fillStyle = '#eaf6ff';
      ctx.beginPath();
      ctx.arc(hx, hy, Math.max(2.4, w * 0.004), 0, Math.PI * 2);
      ctx.fill();
      const ringP = prefersReducedMotion ? 0.4 : (t % 2.2) / 2.2;
      ctx.strokeStyle = `rgba(127, 216, 255, ${0.85 * (1 - ringP)})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(hx, hy, Math.max(3, w * 0.005) + ringP * w * 0.02, 0, Math.PI * 2);
      ctx.stroke();
    }

    function tick(nowMs) {
      draw(nowMs / 1000);
      if (running) {
        frameId = requestAnimationFrame(tick);
      }
    }

    function syncRunning() {
      const shouldRun = inView && !prefersReducedMotion && Boolean(landDots);
      if (shouldRun && !running) {
        running = true;
        frameId = requestAnimationFrame(tick);
      } else if (!shouldRun && running) {
        running = false;
        if (frameId !== null) cancelAnimationFrame(frameId);
      }
    }

    function resizeCanvas() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = host.clientWidth;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(width * MAP_ASPECT * dpr);
      draw(performance.now() / 1000);
    }

    // The land-dot JSON (~65KB) loads lazily so it never weighs down the
    // homepage's initial bundle. landdots.json is [lat, lng, lat, lng, ...];
    // the small map samples every other dot (stride 4 in draw()).
    import(/* webpackChunkName: "landdots" */ '@site/src/data/landdots.json').then((mod) => {
      if (cancelled) return;
      landDots = mod.default || mod;
      resizeCanvas();
      syncRunning();
    });

    resizeCanvas();

    let resizeObserver = null;
    let resizeRaf = 0;
    if (typeof ResizeObserver !== 'undefined') {
      // resizeCanvas() mutates layout, which would re-trigger the observer in
      // the same frame ("ResizeObserver loop completed with undelivered
      // notifications") — defer to the next animation frame instead.
      resizeObserver = new ResizeObserver(() => {
        cancelAnimationFrame(resizeRaf);
        resizeRaf = requestAnimationFrame(() => {
          if (!cancelled) resizeCanvas();
        });
      });
      resizeObserver.observe(host);
    }

    let intersectionObserver = null;
    if (typeof IntersectionObserver !== 'undefined') {
      intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            inView = entry.isIntersecting;
            syncRunning();
          });
        },
        {threshold: 0.15},
      );
      intersectionObserver.observe(host);
    }

    return () => {
      cancelled = true;
      running = false;
      if (frameId !== null) cancelAnimationFrame(frameId);
      cancelAnimationFrame(resizeRaf);
      if (resizeObserver) resizeObserver.disconnect();
      if (intersectionObserver) intersectionObserver.disconnect();
    };
  }, [minWorks]);

  const shown = collaborations.countries.filter((c) => c.works >= minWorks).length;

  return (
    <Link
      to="/networks"
      className={styles.mapLink}
      aria-label={`Collaboration map: ${shown} countries with ${minWorks}+ co-authored works — open the full interactive network`}>
      <span ref={hostRef} className={styles.mapHost}>
        <canvas ref={canvasRef} className={styles.mapCanvas} aria-hidden="true" />
        <span className={styles.mapCta}>Explore the live 3D network →</span>
      </span>
    </Link>
  );
}
