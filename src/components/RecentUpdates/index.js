import React, { useEffect, useRef } from 'react';
import { usePluginData } from '@docusaurus/useGlobalData';
import styles from './styles.module.css';
import Link from '@docusaurus/Link'

const LogoMark = require('@site/static/img/favicon.svg').default;

const EMBER_COUNT = 44;

function makeEmber(rand, width, height, seedY) {
  const r = 1.2 + rand() * 2.6;
  return {
    x: rand() * width,
    // seedY spreads the initial field across the panel; respawns start below.
    y: seedY ? rand() * height : height + r * 6 + rand() * 40,
    r,
    speed: 14 + rand() * 30, // px/s upward
    sway: 6 + rand() * 16,
    phase: rand() * Math.PI * 2,
    hue: 196 + rand() * 22,
    alpha: 0.35 + rand() * 0.5,
  };
}

function drawScene(ctx, width, height, embers, t) {
  // Deep navy field with a soft "furnace" glow at the base — the embers'
  // source. Matches the hero/backdrop palette.
  const base = ctx.createLinearGradient(0, 0, 0, height);
  base.addColorStop(0, '#04101f');
  base.addColorStop(0.62, '#082140');
  base.addColorStop(1, '#0d3161');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  const furnace = ctx.createRadialGradient(
    width / 2, height + 40, 10,
    width / 2, height + 40, height * 0.85,
  );
  furnace.addColorStop(0, 'rgba(64, 150, 240, 0.34)');
  furnace.addColorStop(0.5, 'rgba(38, 105, 190, 0.12)');
  furnace.addColorStop(1, 'rgba(38, 105, 190, 0)');
  ctx.fillStyle = furnace;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const e of embers) {
    const x = e.x + Math.sin(t * 0.8 + e.phase) * e.sway;
    // Embers fade out as they rise toward the top third.
    const lift = 1 - Math.max(0, Math.min(1, e.y / height));
    const fade = lift > 0.7 ? Math.max(0, 1 - (lift - 0.7) / 0.3) : 1;
    const a = e.alpha * fade;
    if (a <= 0.01) continue;
    const glow = ctx.createRadialGradient(x, e.y, 0, x, e.y, e.r * 6);
    glow.addColorStop(0, `hsla(${e.hue}, 92%, 78%, ${a})`);
    glow.addColorStop(0.3, `hsla(${e.hue}, 88%, 62%, ${a * 0.45})`);
    glow.addColorStop(1, `hsla(${e.hue}, 88%, 62%, 0)`);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, e.y, e.r * 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function RecentUpdates() {
  // Latest posts are baked in at build time by plugins/blog-plugin.js,
  // so there is no runtime fetch/parse step (previously this hit the RSS feed).
  const { recentPosts = [] } = usePluginData('docusaurus-plugin-content-blog');
  const canvasRef = useRef(null);
  const panelRef = useRef(null);

  // Lightweight generated "blue embers" animation (replaces the old ~20MB
  // decorative video): runs only while the panel is in view, honors
  // prefers-reduced-motion with a single static frame, and defers resize
  // work to rAF so the ResizeObserver never loops.
  useEffect(() => {
    const canvas = canvasRef.current;
    const panel = panelRef.current;
    if (!canvas || !panel) {
      return undefined;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return undefined;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rand = Math.random;
    let width = 0;
    let height = 0;
    let embers = [];
    let running = false;
    let inView = typeof IntersectionObserver === 'undefined';
    let frameId = null;
    let last = 0;

    function sizeCanvas() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = panel.clientWidth;
      height = panel.clientHeight;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (embers.length === 0) {
        embers = Array.from({length: EMBER_COUNT}, () => makeEmber(rand, width, height, true));
      }
      drawScene(ctx, width, height, embers, performance.now() / 1000);
    }

    function tick(now) {
      if (!running) {
        return;
      }
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      for (let i = 0; i < embers.length; i++) {
        const e = embers[i];
        e.y -= e.speed * dt;
        if (e.y < -e.r * 6) {
          embers[i] = makeEmber(rand, width, height, false);
        }
      }
      drawScene(ctx, width, height, embers, now / 1000);
      frameId = requestAnimationFrame(tick);
    }

    function syncRunning() {
      const shouldRun = inView && !prefersReducedMotion;
      if (shouldRun && !running) {
        running = true;
        last = performance.now();
        frameId = requestAnimationFrame(tick);
      } else if (!shouldRun && running) {
        running = false;
        if (frameId !== null) cancelAnimationFrame(frameId);
      }
    }

    sizeCanvas();
    syncRunning();

    let resizeObserver = null;
    let resizeRaf = 0;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        cancelAnimationFrame(resizeRaf);
        resizeRaf = requestAnimationFrame(sizeCanvas);
      });
      resizeObserver.observe(panel);
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
        {threshold: 0.2},
      );
      intersectionObserver.observe(panel);
    }

    return () => {
      running = false;
      if (frameId !== null) cancelAnimationFrame(frameId);
      cancelAnimationFrame(resizeRaf);
      if (resizeObserver) resizeObserver.disconnect();
      if (intersectionObserver) intersectionObserver.disconnect();
    };
  }, []);

  return (
    <section className={styles.features} id="recentupdated">
      <div className="container">
        <p className={styles.kicker}>Newsroom</p>
        <h1 className="text--center">Latest updates.</h1>
        <p className="text--center"><em>Fresh from the lab — <Link to="/updates">view all updates</Link>.</em></p>
        <div className="row">
        <div className="col col--7">
        <div className={`${styles.updatesPanel} reveal`}>

          {recentPosts.length === 0 ? (
            <p className="text--left">No recent posts found.</p>
          ) : (
            <ul className={styles.updatesList}>
              {recentPosts.map((post) => (
                <li key={post.permalink}>
                  <Link to={post.permalink}>
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>

          )}
          </div>
        </div>
        <div className="col col--5">
        <div ref={panelRef} className={`${styles.videoPanel} ${styles.pulsePanel} reveal`}>
          <canvas ref={canvasRef} className={styles.pulseCanvas} aria-hidden="true" />
          <LogoMark className={styles.pulseLogo} aria-hidden="true" />
        </div>
        </div>
        </div>

      </div>
    </section>
  );
}

export default RecentUpdates;
