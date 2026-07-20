import React, {useCallback, useEffect, useRef, useState} from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const INTRO_SEEN_KEY = 'aintlab.introSeen.v1';

/**
 * Full-screen cinematic first-visit intro (voiceover + particle morph
 * timeline), shown before Hero3D's forge intro. The parent (HomepageHeader)
 * decides whether it plays at all; this component only handles the audio
 * gate, the canvas, captions and the skip affordance.
 *
 * Because browsers block un-gestured audio, the show starts behind an
 * "Enter" gate. `onDone` fires when the timeline finishes — the seen-flag is
 * written first, so the Hero3D the parent mounts during the fade-out goes
 * straight to the idle hero (the intro ends with the audio; no forge scenes
 * follow). `onSkip` fires when the visitor opts out (seen-flag also written).
 */
export default function CinematicIntro({audioSrc, fading, onDone, onSkip}) {
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const handleRef = useRef(null);
  const rootRef = useRef(null);
  const auraRef = useRef(null);
  const gyroCleanupRef = useRef(null);
  const hotspotRef = useRef(null);
  const scrubberRef = useRef(null);
  const progressFillRef = useRef(null);
  const durationRef = useRef(20);
  const [stage, setStage] = useState('gate');         // 'gate' | 'running'
  // Caption streamed from the scene's voice-synced track as {text, wordIdx};
  // wordIdx karaoke-highlights spoken words (scene.js CAPTIONS timings).
  const [caption, setCaption] = useState(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    let cancelled = false;
    const dpr = () => {
      const isMobile = window.matchMedia('(max-width: 768px)').matches;
      return Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.75);
    };
    const quality = {
      particleCount:
        window.matchMedia('(max-width: 768px)').matches ||
        (navigator.hardwareConcurrency || 4) < 4
          ? 4500
          : 12000,
    };

    // Optional personalization for shared invite links: ?to=Alex sculpts a
    // "Welcome, Alex" line into the final wordmark. Sanitized to plain text.
    let greeting = null;
    try {
      const to = new URLSearchParams(window.location.search).get('to');
      if (to) greeting = to.replace(/[^\p{L}\p{N} .,'’-]/gu, '').trim().slice(0, 24) || null;
    } catch (err) {
      greeting = null;
    }

    import(/* webpackChunkName: "cinematic-intro" */ './scene').then(({createCinematicScene}) => {
      if (cancelled || !canvasRef.current) {
        return;
      }
      const handle = createCinematicScene(canvasRef.current, {
        quality,
        greeting,
        onCaption: (text, wordIdx, emphasis) =>
          setCaption(text ? {text, wordIdx, emphasis: emphasis || []} : null),
        // Live timeline position drives the scrubber fill (via ref, no re-render).
        onProgress: (t, dur) => {
          durationRef.current = dur;
          const fill = progressFillRef.current;
          if (fill) fill.style.width = `${Math.min(100, (t / dur) * 100)}%`;
        },
        // Hovered globe hub: move + label a DOM chip directly (no re-render).
        onHotspot: (hs) => {
          const label = hotspotRef.current;
          if (!label) return;
          if (hs) {
            if (label.textContent !== hs.name) label.textContent = hs.name;
            label.style.left = `${hs.x * 100}%`;
            label.style.top = `${hs.y * 100}%`;
            label.style.opacity = '1';
          } else {
            label.style.opacity = '0';
          }
        },
        onEnded: () => {
          // The show IS the whole intro now — mark it seen so the Hero3D that
          // mounts during the handoff goes straight to its idle hero instead
          // of playing the forge scenes on top of an already-told story.
          try {
            window.localStorage.setItem(INTRO_SEEN_KEY, '1');
          } catch (err) {
            // Best effort.
          }
          if (onDoneRef.current) onDoneRef.current();
        },
      });
      handleRef.current = handle;
      handle.resize(window.innerWidth, window.innerHeight, dpr());
      // Tuning hook while the timeline is being tweaked (harmless in prod):
      // window.__aintlabIntroSeek(12) jumps the show to t=12s.
      window.__aintlabIntroSeek = (t) => handle.seek(t);
    });

    const onResize = () => {
      if (handleRef.current) {
        handleRef.current.resize(window.innerWidth, window.innerHeight, dpr());
      }
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelled = true;
      window.removeEventListener('resize', onResize);
      delete window.__aintlabIntroSeek;
      if (gyroCleanupRef.current) {
        gyroCleanupRef.current();
        gyroCleanupRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (handleRef.current) {
        handleRef.current.dispose();
        handleRef.current = null;
      }
    };
  }, []);

  // Feed the scene a smoothed pointer position (NDC) and move the cursor aura.
  const emitPointer = useCallback((clientX, clientY, active) => {
    const root = rootRef.current;
    if (!root) return;
    const r = root.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const nx = ((clientX - r.left) / r.width) * 2 - 1;
    const ny = -(((clientY - r.top) / r.height) * 2 - 1);
    if (handleRef.current) {
      handleRef.current.setPointer(nx, ny, active);
    }
    const aura = auraRef.current;
    if (aura) {
      aura.style.transform = `translate(${clientX - r.left}px, ${clientY - r.top}px)`;
      aura.style.opacity = active ? '1' : '0';
    }
    return {nx, ny};
  }, []);

  const onPointerMove = useCallback((e) => emitPointer(e.clientX, e.clientY, true), [emitPointer]);

  const onPointerDown = useCallback(
    (e) => {
      const p = emitPointer(e.clientX, e.clientY, true);
      if (p && handleRef.current) {
        handleRef.current.pulse(p.nx, p.ny);          // shockwave from the tap
      }
    },
    [emitPointer],
  );

  const onPointerLeave = useCallback(() => {
    if (handleRef.current) {
      handleRef.current.setPointer(0, 0, false);
    }
    if (auraRef.current) {
      auraRef.current.style.opacity = '0';
    }
  }, []);

  // Scrubber: click/drag the timeline to jump through beats (seeks audio too).
  // stopPropagation keeps these gestures from also firing the field ripple.
  const seekFromEvent = useCallback((e) => {
    const el = scrubberRef.current;
    if (!el || !handleRef.current) return;
    const r = el.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    handleRef.current.seek(frac * (durationRef.current || 20));
  }, []);

  const onScrubDown = useCallback(
    (e) => {
      e.stopPropagation();
      if (e.currentTarget.setPointerCapture) {
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
      }
      seekFromEvent(e);
    },
    [seekFromEvent],
  );

  const onScrubMove = useCallback(
    (e) => {
      if (e.buttons !== 1) return;
      e.stopPropagation();
      seekFromEvent(e);
    },
    [seekFromEvent],
  );

  // On phones the "Enter" tap is our one user gesture — the moment iOS lets us
  // ask for motion access, so device tilt can drive the same pointer field.
  const enableTilt = useCallback(() => {
    if (gyroCleanupRef.current || typeof window === 'undefined') return;
    const onOrient = (e) => {
      if (e.gamma == null || e.beta == null || !handleRef.current) return;
      const nx = Math.max(-1, Math.min(1, e.gamma / 40));         // left/right tilt
      const ny = Math.max(-1, Math.min(1, (e.beta - 90) / 40));   // front/back tilt
      handleRef.current.setPointer(nx, -ny, true);
    };
    const DOE = window.DeviceOrientationEvent;
    const attach = () => {
      window.addEventListener('deviceorientation', onOrient);
      gyroCleanupRef.current = () => window.removeEventListener('deviceorientation', onOrient);
    };
    if (DOE && typeof DOE.requestPermission === 'function') {
      DOE.requestPermission().then((s) => { if (s === 'granted') attach(); }).catch(() => {});
    } else if (DOE) {
      attach();
    }
  }, []);

  // Fade the soundtrack alongside the visual fade-out.
  useEffect(() => {
    if (!fading || !audioRef.current) {
      return undefined;
    }
    const audio = audioRef.current;
    const fade = window.setInterval(() => {
      audio.volume = Math.max(0, audio.volume - 0.08);
      if (audio.volume <= 0.01) {
        audio.pause();
        window.clearInterval(fade);
      }
    }, 80);
    return () => window.clearInterval(fade);
  }, [fading]);

  const begin = useCallback(() => {
    setStage('running');
    enableTilt();
    const audio = audioRef.current;
    if (audio) {
      audio.play().catch(() => {
        // Playback refused or the file failed to decode — the scene's wall
        // clock drives the timeline instead, so the show still runs.
      });
    }
    if (handleRef.current) {
      handleRef.current.start(audio);
    }
  }, [enableTilt]);

  const skip = useCallback(() => {
    try {
      window.localStorage.setItem(INTRO_SEEN_KEY, '1');
    } catch (err) {
      // Best effort.
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (onSkip) onSkip();
  }, [onSkip]);

  return (
    <div
      ref={rootRef}
      className={clsx(styles.root, fading && styles.rootFading)}
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
      onPointerLeave={onPointerLeave}>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <audio ref={audioRef} src={audioSrc} preload="auto" />

      {stage === 'running' && !fading && (
        <div ref={auraRef} className={styles.aura} aria-hidden="true" />
      )}

      {stage === 'running' && !fading && (
        <div ref={hotspotRef} className={styles.hotspot} aria-hidden="true" />
      )}

      {stage === 'gate' && (
        <div className={styles.gate}>
          <p className={styles.gateEyebrow}>An intro experience</p>
          <p className={styles.gateTitle}>
            <span className={styles.gateTitleIn}>A</span>pplied{' '}
            <span className={styles.gateTitleIn}>IN</span>telligence Lab
          </p>
          <p className={styles.gateNote}>Twenty seconds, best with sound on — move to touch the light.</p>
          <button type="button" className={styles.enterButton} onClick={begin} autoFocus>
            Enter
          </button>
          <button type="button" className={styles.gateSkip} onClick={skip}>
            Skip intro →
          </button>
        </div>
      )}

      {stage === 'running' && !fading && (
        <button type="button" className={styles.skipButton} onClick={skip}>
          Skip intro
        </button>
      )}

      <div className={styles.caption} aria-live="polite">
        {stage === 'running' && caption && (
          <p key={caption.text} className={styles.captionLine}>
            {caption.text.split(' ').map((w, i) => (
              <span
                key={i}
                className={clsx(
                  styles.capWord,
                  i < caption.wordIdx && styles.capWordOn,
                  caption.emphasis.includes(i) && styles.capWordKey,
                )}>
                {w}{' '}
              </span>
            ))}
          </p>
        )}
      </div>

      {stage === 'running' && !fading && (
        <div
          ref={scrubberRef}
          className={styles.scrubber}
          onPointerDown={onScrubDown}
          onPointerMove={onScrubMove}
          role="slider"
          aria-label="Scrub intro"
          aria-valuemin={0}
          aria-valuemax={100}
          tabIndex={-1}>
          <div ref={progressFillRef} className={styles.scrubberFill} />
        </div>
      )}
    </div>
  );
}
