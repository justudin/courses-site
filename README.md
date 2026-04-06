<div align="center">

# 📚 Courses Site

**Learning together with Muhammad Syafrudin**

A modern course catalog and teaching portfolio built with [Docusaurus 3](https://docusaurus.io/) — featuring course materials, student reviews, project showcases, and auto-generated credits.

[![Live Site](https://img.shields.io/badge/Live-courses.muhammadsyafrudin.com-0e59a9?style=for-the-badge&logo=google-chrome&logoColor=white)](https://courses.muhammadsyafrudin.com)
[![Docusaurus](https://img.shields.io/badge/Docusaurus-3.9.2-3ecc5f?style=for-the-badge&logo=docusaurus&logoColor=white)](https://docusaurus.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![Node](https://img.shields.io/badge/Node-%3E%3D18.0-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)

</div>

---

## Overview

| Metric | Value |
|--------|-------|
| **Courses** | 9 across Big Data, ML, Programming, Database, Mathematics |
| **Institutions** | Sejong University (2022–present) · Dongguk University (2019–2021) |
| **Level** | 7 undergraduate · 2 graduate |
| **Student reviews** | 500+ collected across semesters |
| **Average evaluation** | 4.6+ / 5.0 |

## Features

- **Course Catalog** — browsable course pages with syllabi, semester offerings, and evaluation data since 2019
- **Student Reviews** — searchable, filterable collection of student feedback (Korean & English)
- **Project Showcase** — gallery of real-world student projects
- **Teaching Stats** — animated statistics auto-calculated from course data
- **Auto-generated Credits** — dependency acknowledgements built from `package.json` at build time
- **Back to Top** — floating scroll-to-top button on every page
- **Running Text Marquee** — animated section dividers matching the research site style
- **Dark Mode** — full dark-mode support across all pages and components
- **Responsive** — mobile-first design with adaptive layouts

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Docusaurus 3.9.2 |
| UI | React 18, CSS Modules |
| Styling | Custom design system (Sora font, gradient cards, dark mode) |
| Build | Node.js ≥ 18, Webpack |
| Container | Docker (development & production) |
| Hosting | Static deployment |

## Project Structure

```
courses-site/
├── docs/                          # Course content (Markdown)
│   ├── index.md                   # Course catalog landing
│   ├── big-data-processing/
│   ├── database-design-analysis/
│   ├── industrial-programming/
│   ├── intro-to-big-data/
│   ├── intro-to-deep-learning/
│   ├── linear-algebra/
│   ├── linear-algebra-programming/
│   ├── topics-in-machine-learning/
│   └── web-programming/
├── src/
│   ├── components/                # React components
│   │   ├── BackToTop/             # Floating scroll-to-top button
│   │   ├── CallToAction/          # CTA section with link cards
│   │   ├── HeroSlider/            # Hero banner with video background
│   │   ├── HomepageFeatures/      # "Why Choose Us" feature cards
│   │   ├── RunningText/           # Animated marquee text strips
│   │   ├── StudentReviews/        # Review carousel
│   │   └── TeachingStats/         # Animated stat counters
│   ├── css/custom.css             # Global theme styles
│   ├── data/                      # Data files (reviews, stats, credits)
│   ├── pages/                     # Standalone pages (About, Reviews, Showcase, Credits)
│   └── theme/Root.js              # Theme wrapper (BackToTop on all pages)
├── scripts/
│   └── generate-credits-page.js   # Auto-generates credits.json at build time
├── static/img/                    # Static assets
├── docusaurus.config.js           # Docusaurus configuration
├── sidebars.js                    # Sidebar structure
├── Dockerfile                     # Docker setup (dev & prod)
└── package.json
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18.0
- npm (included with Node.js)

### Installation

```bash
git clone https://github.com/justudin/courses-site.git
cd courses-site
npm install
```

### Development

```bash
npm start
```

Opens a local dev server at `http://localhost:3000` with hot reload.

### Production Build

```bash
npm run build
```

Static files are generated in the `build/` directory. Preview locally:

```bash
npm run serve
```

## Docker

### Development

```bash
docker build --target development -t courses:dev .
docker run -p 3000:3000 courses:dev
```

### Production

```bash
docker build -t courses:latest .
docker run --rm -p 3000:80 courses:latest
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start dev server (generates credits first) |
| `npm run build` | Production build (generates credits first) |
| `npm run serve` | Serve production build locally |
| `npm run generate-credits` | Regenerate `src/data/credits.json` from dependencies |
| `npm run clear` | Clear Docusaurus cache |
| `npm run swizzle` | Swizzle a Docusaurus theme component |

## Adding a New Course

1. Create a folder under `docs/` (e.g., `docs/new-course/`)
2. Add a `_category_.json` with the category label and position
3. Add semester markdown files (e.g., `spring-2026.md`) with course content
4. Update `src/data/teachingStats.js` with enrollment and evaluation data

## License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

*"The beautiful thing about learning is that no one can take it away from you."* — B.B. King

**[courses.muhammadsyafrudin.com](https://courses.muhammadsyafrudin.com)** · **[research.muhammadsyafrudin.com](https://research.muhammadsyafrudin.com)**

</div>
