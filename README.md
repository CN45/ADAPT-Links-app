# ADAPT Links App

ADAPT Links is a GitHub Pages app for sharing curated AI resources with the ADAPT AI Team.

The site is intentionally simple:

- Link data lives in `src/data/links.json`.
- Coworkers view the published GitHub Pages site.
- Coworkers suggest links through a GitHub issue form.
- Trusted contributors can submit pull requests.

Expected GitHub repository: `CN45/ADAPT-Links-app`

Expected GitHub Pages URL: `https://cn45.github.io/ADAPT-Links-app/`

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Add A Link

Edit `src/data/links.json` and add a new object with:

- `title`
- `url`
- `description`
- `category`
- `tags`
- `addedBy`
- `dateAdded`
- `recommended`
- `status`

Then run:

```bash
npm run validate:links
```

## Deploy

The included GitHub Actions workflow publishes the app to GitHub Pages when changes are pushed to `main`.
