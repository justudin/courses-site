import React, { useState, useEffect, useRef } from 'react';
import { XMLParser } from 'fast-xml-parser';
import styles from './styles.module.css';
import Link from '@docusaurus/Link'
import backgroundVideo from '../../assets/background.mp4';
import backgroundPoster from '../../assets/background.webp';

// The target RSS feed URL
const XML_URL = `${typeof window !== 'undefined' ? window.location.origin : ''}/updates/rss.xml`;

function RecentUpdates() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);

  // The source video is a large decorative loop (~20MB). Loading/playing it
  // is deferred until this panel actually scrolls into view, so it never
  // contributes to initial page weight/LCP — matching the Hero3D lazy-mount
  // pattern used elsewhere on this page.
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) {
      return undefined;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return undefined;
    }

    if (typeof IntersectionObserver === 'undefined') {
      videoEl.src = backgroundVideo;
      videoEl.play().catch(() => {});
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!videoEl.src) {
              videoEl.src = backgroundVideo;
            }
            videoEl.play().catch(() => {});
          } else {
            videoEl.pause();
          }
        });
      },
      {threshold: 0.2},
    );
    observer.observe(videoEl);

    return () => observer.disconnect();
  }, [loading]);

  useEffect(() => {
    fetch(XML_URL)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then(xmlText => {
        const parser = new XMLParser();
        const parsedData = parser.parse(xmlText);

        // --- Crucial step: Extracting the items array ---
        // RSS structure is typically rss -> channel -> item[].
        const allItems = parsedData?.rss?.channel?.item || [];
        
        // 1. Get the 5 latest posts using .slice(0, 5)
        const firstFivePosts = allItems.slice(0, 5);
        
        setPosts(firstFivePosts);
      })
      .catch(e => {
        console.error('Error fetching or parsing XML:', e);
        setError(`Failed to fetch or parse: ${e.message}`);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <p className={styles.feedback}>Loading latest updates...</p>;
  if (error) return <p className={styles.error}>Error: {error}</p>;

  return (
    <section className={styles.features} id="recentupdated">
      <div className="container">
        <p className={styles.kicker}>Newsroom</p>
        <h1 className="text--center">Latest Updates</h1>
        <p className="text--center"><em>Latest five updates from AINTLab below — <Link to="/updates">view all updates here.</Link></em></p>
        <div className="row">
        <div className="col col--7">
        <div className={`${styles.updatesPanel} reveal`}>
        
          {posts.length === 0 ? (
            <p className="text--left">No recent posts found.</p>
          ) : (
            <ul className={styles.updatesList}>
              {posts.map((item, index) => (
                <li key={index}>
                  <Link to={item.link}>
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>

          )}
          </div>
        </div>
        <div className="col col--5">
        <div className={`${styles.videoPanel} reveal`}>
        <video
          ref={videoRef}
          poster={backgroundPoster}
          loop
          muted
          playsInline
          preload="none"
          aria-hidden="true"
          className={styles.featureSvg}
        />
        </div>
        </div>
        </div>
        
      </div>
    </section>
  );
}

export default RecentUpdates;