import React from 'react';
import styles from './styles.module.css';

// width/height are each logo's actual source pixel dimensions — passed
// through as img attributes (not just CSS) so the browser can reserve the
// correct aspect ratio before the image loads, avoiding layout shift.
const LOGOS = [
  { src: '/img/logos/ms.png', alt: 'MS', width: 136, height: 136 },
  { src: '/img/logos/sejong.png', alt: 'Sejong', width: 101, height: 93 },
  { src: '/img/logos/unair.png', alt: 'UNAIR', width: 400, height: 387 },
  { src: '/img/logos/binus.png', alt: 'BINUS', width: 70, height: 61 },
  { src: '/img/logos/ugm.png', alt: 'UGM', width: 400, height: 389 },
  { src: '/img/logos/tidar.png', alt: 'Tidar', width: 369, height: 369 },
  { src: '/img/logos/skku.png', alt: 'SKKU', width: 400, height: 263 },
  { src: '/img/logos/knu.png', alt: 'KNU', width: 400, height: 150 },
  { src: '/img/logos/curtin.png', alt: 'Curtin', width: 351, height: 366 },
  { src: '/img/logos/ubd.png', alt: 'UBD', width: 67, height: 83 },
  { src: '/img/logos/undip.png', alt: 'UNDIP', width: 400, height: 388 },
  { src: '/img/logos/dongguk.png', alt: 'Dongguk', width: 123, height: 120 },
  { src: '/img/logos/karabuk.png', alt: 'Karabuk', width: 123, height: 104 },
  { src: '/img/logos/itu.png', alt: 'ITU', width: 337, height: 228 },
  { src: '/img/logos/isu.png', alt: 'ISU', width: 400, height: 308 },
  { src: '/img/logos/gscwu.png', alt: 'GSCWU', width: 225, height: 225 },
  { src: '/img/logos/hitec.png', alt: 'HITEC', width: 250, height: 250 },
  { src: '/img/logos/uinsuka.png', alt: 'UINSUKA', width: 400, height: 392 },
  { src: '/img/logos/bnu.png', alt: 'BNU', width: 400, height: 400 },
  { src: '/img/logos/ntust.png', alt: 'NTUST', width: 316, height: 316 },
  { src: '/img/logos/kfueit.png', alt: 'kfueit', width: 200, height: 200 },
  { src: '/img/logos/brin.png', alt: 'BRIN', width: 101, height: 97 },
  { src: '/img/logos/aintlab.png', alt: 'AINTLab', width: 100, height: 100 },
];

export default function LogoSlider() {
  return (
    <div className={styles.wrapper}>
     <p className={styles.kicker}>Network</p>
     <h1 className="text--center">Our Collaborators</h1>
             <p className="text--center"><em>Collaborated on: joint publications, projects, visiting programs, etc.</em></p>
      <div className={styles.logos}>
        {/* First set of logos */}
        <div className={styles.logosSlide}>
          {LOGOS.map((logo, index) => (
            <img key={index} src={logo.src} alt={logo.alt} width={logo.width} height={logo.height} loading="lazy" decoding="async" />
          ))}
        </div>

        {/* Duplicate set for the infinite loop effect */}
        <div className={styles.logosSlide} aria-hidden="true">
          {LOGOS.map((logo, index) => (
            <img key={`dup-${index}`} src={logo.src} alt="" width={logo.width} height={logo.height} loading="lazy" decoding="async" />
          ))}
        </div>
      </div>
    </div>
  );
}
