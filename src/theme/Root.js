import React, {useEffect, useState} from 'react';
import AskAiWidget from '@site/src/components/AskAiWidget';

const BackToTopIcon = require('@site/static/img/favicon.svg').default;

export default function Root({children}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const adjustLayoutColumns = () => {
      const rows = document.querySelectorAll('main .row');

      rows.forEach((row) => {
        const contentCol = row.querySelector(':scope > .col.col--10, :scope > .col.col--9, :scope > .col.col--12, :scope > .col.col--8');
        if (!contentCol) {
          return;
        }

        // Limit behavior to page/blog layout rows only, not arbitrary content rows.
        const hasArticleAsDirectChild = contentCol.querySelector(':scope > article');
        if (!hasArticleAsDirectChild) {
          return;
        }

        const hasToc = Boolean(row.querySelector(':scope > .col.col--2 .tableOfContents_bqdL, :scope > .col.col--3 .tableOfContents_bqdL'));

        if (!hasToc) {
          contentCol.classList.remove('col--8', 'col--9', 'col--12');
          contentCol.classList.add('col--12');
        } else {
          contentCol.classList.remove('col--12');
          if (!contentCol.classList.contains('col--10') && !contentCol.classList.contains('col--9')) {
            contentCol.classList.add('col--10');
          }
        }
      });
    };

    const rafAdjust = () => {
      window.requestAnimationFrame(adjustLayoutColumns);
    };

    rafAdjust();

    const observer = new MutationObserver(rafAdjust);
    observer.observe(document.body, {childList: true, subtree: true});

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    let ticking = false;

    const updateScrollState = () => {
      const scrollY = window.scrollY;
      setIsVisible(scrollY > 320);

      const navbar = document.querySelector('.navbar');
      if (navbar) {
        navbar.classList.toggle('navbar--scrolled', scrollY > 8);
      }

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateScrollState);
      }
    };

    window.addEventListener('scroll', onScroll, {passive: true});
    window.addEventListener('resize', onScroll, {passive: true});
    updateScrollState();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  useEffect(() => {
    const revealedClass = 'reveal-visible';

    const revealAll = () => {
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add(revealedClass));
    };

    if (typeof IntersectionObserver === 'undefined') {
      revealAll();
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(revealedClass);
            obs.unobserve(entry.target);
          }
        });
      },
      {threshold: 0.15, rootMargin: '0px 0px -8% 0px'},
    );

    let scheduled = false;
    const observeNew = () => {
      scheduled = false;
      document.querySelectorAll(`.reveal:not(.${revealedClass})`).forEach((el) => {
        observer.observe(el);
      });
    };

    observeNew();

    const mutationObserver = new MutationObserver(() => {
      if (!scheduled) {
        scheduled = true;
        window.requestAnimationFrame(observeNew);
      }
    });
    mutationObserver.observe(document.body, {childList: true, subtree: true});

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  return (
    <>
      {children}
      <button
        type="button"
        className={`global-back-to-top ${isVisible ? 'is-visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Back to top"
        title="Back to top"
      >
        <BackToTopIcon className="global-back-to-top-icon" aria-hidden="true" />
      </button>
      <AskAiWidget />
    </>
  );
}
