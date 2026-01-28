# Immich Daily Carousel

Insert a carousel of Immich photos (and optionally videos) for the date in your daily note title.

## Features

- Command: **Insert Immich carousel**
- Markdown code block renderer: `immich-carousel`
- Optional auto-insert into daily notes via a template placeholder
- Click thumbnails to open in Immich
- Open the day view in Immich from the carousel header

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Build the plugin:
   ```bash
   npm run build
   ```
3. In Obsidian, enable the plugin and open **Settings → Community plugins → Immich Daily Carousel**.
4. Configure:
   - **Immich base URL**
   - **Immich API key**

## Usage

### Command

Open a daily note and run **Insert Immich carousel** from the command palette.

### Template placeholder (recommended)

Add the placeholder token to your daily note template:

```
{{immich-carousel}}
```

When a new daily note is created/opened, the plugin replaces the placeholder with the carousel block.

### Manual code block

````markdown
```immich-carousel
```
````

Optional `date:` override inside the block:

````markdown
```immich-carousel
date: 2026-01-28
```
````

## Notes

- Daily note titles must include a date or match the format configured in settings.
- The plugin fetches thumbnails from your Immich instance using your API key.
- You can customize Immich web links in settings if your web UI uses a different URL pattern.

## Development

- `npm run dev` — watch mode
- `npm run build` — production build
- `npm run lint` — lint

## Manual install

Copy `main.js`, `manifest.json`, and `styles.css` into:

```
<Vault>/.obsidian/plugins/obsidian-sample-plugin/
```

Rename the plugin folder and update `manifest.json` if you want a different plugin ID.
