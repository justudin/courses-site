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
  components/     # Shared React components (PublicationsList, etc.)
  css/            # Global styles (custom.css)
  theme/          # Swizzled Docusaurus components (Root.js)
static/           # Static assets (images, icons)
blog/             # Updates / research posts (served at /updates)
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

---

## License

See [LICENSE](./LICENSE).
