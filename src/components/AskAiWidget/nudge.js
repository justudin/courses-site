import React, {useCallback, useEffect, useRef, useState} from 'react';

/**
 * A one-off nudge pointing at the floating Ask AINBot bubble, for visitors who
 * would never think to click it.
 *
 * Deliberately quiet about it:
 *  - never during the first-visit cinematic (the bubble itself is already
 *    gated below it — see styles.css),
 *  - once per session, and never again once dismissed,
 *  - it leaves on its own, and gets out of the way the moment the chat opens.
 */
const DISMISSED_KEY = 'aintlab.askAiNudge.v1';
const SEEN_KEY = 'aintlab.askAiNudge.seen';
const BUTTON_SELECTOR = 'button.DocSearch-SidepanelButton';
const PANEL_SELECTOR = '.DocSearch-Sidepanel-Container';

const SHOW_DELAY_MS = 6000;
const AUTO_HIDE_MS = 11000;
const LEAVE_MS = 280;

function isDismissed() {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === '1';
  } catch (err) {
    return false;
  }
}

function isSeenThisSession() {
  try {
    return window.sessionStorage.getItem(SEEN_KEY) === '1';
  } catch (err) {
    return false;
  }
}

function remember(storage, key) {
  try {
    window[storage].setItem(key, '1');
  } catch (err) {
    // Storage can be unavailable (private mode, blocked cookies). The nudge
    // simply reverts to showing again next time — never a hard failure.
  }
}

// Matches the gating the pre-paint head script and HomepageHeader use.
function introPlaying() {
  const root = document.documentElement;
  return (
    root.classList.contains('intro-pending') ||
    root.classList.contains('intro-running') ||
    root.hasAttribute('data-intro-pending')
  );
}

// The panel is in the DOM from mount and slid off-screen; the container is
// what carries the open state. Note the class on the inner <aside>
// ('new-conversation' / 'conversation') is the current SCREEN, not
// open-vs-closed, and is set even while the panel is hidden.
function panelIsOpen() {
  const container = document.querySelector(PANEL_SELECTOR);
  return Boolean(container) && container.classList.contains('is-open');
}

export default function AskAiNudge() {
  const [phase, setPhase] = useState('idle'); // idle | shown | leaving | done
  const timers = useRef([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  const close = useCallback(
    (permanent) => {
      clearTimers();
      if (permanent) {
        remember('localStorage', DISMISSED_KEY);
      }
      setPhase((current) => (current === 'shown' ? 'leaving' : 'done'));
      timers.current.push(window.setTimeout(() => setPhase('done'), LEAVE_MS));
    },
    [clearTimers],
  );

  const openChat = useCallback(() => {
    const button = document.querySelector(BUTTON_SELECTOR);
    if (button) {
      button.click();
    }
    close(true);
  }, [close]);

  // Wait for the bubble to exist and the intro to be over, then show once.
  useEffect(() => {
    if (isDismissed() || isSeenThisSession()) {
      setPhase('done');
      return undefined;
    }

    let cancelled = false;
    let armed = false;

    const tick = () => {
      if (cancelled || armed) {
        return;
      }
      if (!document.querySelector(BUTTON_SELECTOR) || introPlaying() || panelIsOpen()) {
        return;
      }
      armed = true;
      window.clearInterval(poll);
      timers.current.push(
        window.setTimeout(() => {
          if (cancelled || panelIsOpen()) {
            return;
          }
          remember('sessionStorage', SEEN_KEY);
          setPhase('shown');
        }, SHOW_DELAY_MS),
      );
    };

    const poll = window.setInterval(tick, 400);
    tick();

    return () => {
      cancelled = true;
      window.clearInterval(poll);
      clearTimers();
    };
  }, [clearTimers]);

  // Once visible: leave on its own, and step aside if the chat opens by any
  // route (bubble click, Ctrl/Cmd+I, the navbar search's Ask AI tab).
  useEffect(() => {
    if (phase !== 'shown') {
      return undefined;
    }

    timers.current.push(window.setTimeout(() => close(false), AUTO_HIDE_MS));

    const container = document.querySelector(PANEL_SELECTOR);
    if (!container) {
      return undefined;
    }
    const observer = new MutationObserver(() => {
      if (panelIsOpen()) {
        close(true);
      }
    });
    observer.observe(container, {attributes: true, attributeFilter: ['class']});
    return () => observer.disconnect();
  }, [phase, close]);

  if (phase !== 'shown' && phase !== 'leaving') {
    return null;
  }

  return (
    <div className="askai-nudge" data-leaving={phase === 'leaving' ? '' : undefined}>
      <span className="askai-nudge-float">
        <button type="button" className="askai-nudge-body" onClick={openChat}>
          Looking for something? I am here to help!
        </button>
        <button
          type="button"
          className="askai-nudge-close"
          onClick={() => close(true)}
          aria-label="Dismiss this tip">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </span>
    </div>
  );
}
