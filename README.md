# AINTLab Research Site

Official website of the **Applied INtelligence Lab (AINTLab)** at Sejong University, Seoul, Republic of Korea.  
Live at **[aintlab.com](https://aintlab.com)**.

AINTLab is a research group focused on artificial intelligence, machine learning, deep learning, IoT, and intelligent systems — with applications in smart manufacturing, agriculture, healthcare, and beyond.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Docusaurus 3](https://docusaurus.io/) (React) |
| Search | [docusaurus-lunr-search](https://github.com/praveenn77/docusaurus-lunr-search) |
| Styling | CSS Modules + global custom CSS |
| Content | MDX (Markdown + JSX) |
| Container | Docker (multi-stage: dev + production via Nginx) |

---

## Local Development

Requires **Node.js ≥ 18**.

```bash
npm install
npm start        # dev server at http://localhost:3000
```

To create a production build locally:

```bash
npm run build
npm run serve    # serves the built output at http://localhost:3000
```

---

## Docker

### Development

```bash
docker build --target development -t aintlab:dev .
docker run -p 3000:3000 aintlab:dev
```

> Stop the container before running a production build.

### Production

```bash
docker build -t aintlab:latest .
docker run --rm -p 3000:80 aintlab:latest
```

---

## Site Structure

```
src/
  pages/          # MDX pages (team, projects, publications, contact, alumni…)
    courses/      # Courses section pages (landing, about, reviews, showcase)
  components/     # Shared React components (PublicationsList, etc.)
    courses/      # Components used only by the courses section
  data/
    courses/      # Reviews, showcase projects, teaching stats
  css/            # Global styles (custom.css)
  theme/          # Swizzled Docusaurus components (Root.js)
static/           # Static assets (images, icons)
  courses/        # Courses assets, namespaced (welcome.mp4, images)
blog/             # Updates / research posts (served at /updates)
courses-docs/     # Course catalog (served at /courses/learn)
sidebarsCourses.js
docusaurus.config.js
```

---

## Key Pages

| Route | Description |
|---|---|
| `/` | Home |
| `/team` | Lab director, students, and research staff |
| `/projects` | Current and past research projects |
| `/publications` | Peer-reviewed journals, conferences, and books |
| `/updates` | Blog / research news |
| `/alumni` | Past lab members |
| `/contact` | Contact information and directions to Sejong University |
| `/courses` | Courses landing page |
| `/courses/learn` | Course catalog (own docs instance, see below) |
| `/courses/reviews` | Student reviews |
| `/courses/showcase` | Student project showcase |
| `/courses/about` | Teaching philosophy |

---

## Courses Section

The former `courses.muhammadsyafrudin.com` site was merged into this repo and is
served under `/courses`.

The course catalog is a **separate `@docusaurus/plugin-content-docs` instance**
(`id: 'courses'`, content in `courses-docs/`, sidebar in `sidebarsCourses.js`),
not a second sidebar on a shared instance. That keeps the catalog on its own
content root so it can be reorganised or versioned without touching the research
site. If it is ever versioned, its files will be `courses_versions.json`,
`courses_versioned_docs/`, and `courses_versioned_sidebars/`.

The classic preset's default `docs` instance stays disabled (`docs: false`), so
the courses instance is currently the only docs instance on the site.

Courses assets are namespaced under `static/courses/` because `favicon.png` and
the `undraw_*_learning.svg` files differ between the two original repos and would
otherwise silently overwrite the research site's copies.

`@docusaurus/plugin-client-redirects` maps the old subdomain paths (`/learn/*`,
`/reviews`, `/showcase`, `/about`) to their `/courses/…` equivalents, and points
`/courses/credits` at the single shared `/credits` page.

### Manual steps not handled by the build

- **DNS / hosting.** `CNAME` is now `ain.my.id`. Point that record at the host
  before deploying.
- **Subdomain 301.** Redirect `courses.muhammadsyafrudin.com/*` to
  `https://ain.my.id/courses/*` at the host level. The client-redirects plugin
  cannot map the old site's root (`/`), because that path is this site's own
  homepage.
- **Algolia.** The DocSearch crawler must be re-run for `/courses/*` to become
  searchable, and its allowed domains updated for `ain.my.id`.

---

## License

See [LICENSE](./LICENSE).
