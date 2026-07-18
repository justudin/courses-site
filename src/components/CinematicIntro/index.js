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
  const [stage, setStage] = useState('gate');         // 'gate' | 'running'
  // Caption text streamed from the scene's voice-synced caption track
  // (scene.js CAPTIONS — word timings measured from intro-sound.mpeg).
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

    import(/* webpackChunkName: "cinematic-intro" */ './scene').then(({createCinematicScene}) => {
      if (cancelled || !canvasRef.current) {
        return;
      }
      const handle = createCinematicScene(canvasRef.current, {
        quality,
        onCaption: (text) => setCaption(text),
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
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (handleRef.current) {
        handleRef.current.dispose();
        handleRef.current = null;
      }
    };
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
  }, []);

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
    <div className={clsx(styles.root, fading && styles.rootFading)}>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <audio ref={audioRef} src={audioSrc} preload="auto" />

      {stage === 'gate' && (
        <div className={styles.gate}>
          <p className={styles.gateEyebrow}>An intro experience</p>
          <p className={styles.gateTitle}>
            Applied <span className={styles.gateTitleIn}>IN</span>telligence Lab
          </p>
          <p className={styles.gateNote}>Twenty seconds. Best with sound on.</p>
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
          <p key={caption} className={styles.captionLine}>
            {caption}
          </p>
        )}
      </div>
    </div>
  );
}
