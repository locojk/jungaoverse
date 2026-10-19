# Jungaoverse

The personal site of Jun Gao, AI engineer in Ottawa. It's built as a spaceship bridge. JUNIOR (Just Unreasonably Nice Intelligent Operations Robot) runs the ship, because Jun went to the cargo bay for a snack and never came back.

Live at [jungaoverse.com](https://jungaoverse.com/).

## What's aboard

Each station on the bridge is one section of the site:

| Station          | Contains        |
| ---------------- | --------------- |
| Captain's Log    | Writing         |
| Star Map         | Projects        |
| Cargo Manifest   | Skills          |
| Flight Recorder  | Experience      |
| Comms Station    | Contact         |
| Engine Room      | How it's built  |
| Forward Viewport | Live Ottawa weather |
| Old Quarters     | Personal page. It unlocks after the visitor talks to JUNIOR. |

If you just want the résumé, open the recruiter dossier. It shows the same facts without the story, and `public/resume.pdf` is there to download.

## Stack

- React 19 + TypeScript
- Vite 6
- Canvas starfield
- [Open-Meteo](https://open-meteo.com/) for weather (no API key needed)
- No accounts, no tracking. Visitor progress is saved in `localStorage` under the key `jungaoverse.v1`.

## Getting started

```bash
npm install
npm run dev       # start the dev server
npm run build     # type-check, then build to dist/
npm run preview   # serve the production build locally
```

## Project layout

```
public/            static assets (favicon, art, resume.pdf)
src/
  main.tsx         entry point
  App.tsx          the bridge: chat, stations, ship state
  content.ts       all biography and copy (the single source of truth)
  brain.ts         JUNIOR's dialogue (the JuniorBrain interface plus the scripted brain)
  Intro.tsx        opening sequence
  Panels.tsx       station panels and the recruiter dossier
  scene.tsx        bridge scene pieces (hotspots, planets, clock, notes)
  Starfield.tsx    animated starfield background
  ship.ts          station IDs and the save/load logic
  useWeather.ts    Ottawa weather hook
  styles.css       styles
```

## Editing content

Every piece of visitor-facing text lives in `src/content.ts`: the profile, logs, projects, skills, route, and JUNIOR's lines. The bridge and the dossier both read from that file. Entries marked `sample` are placeholders, and the site labels them as samples. Replace them with real details, then swap out `public/resume.pdf`.

## Swapping JUNIOR's brain

The bridge never writes dialogue itself. It calls `JuniorBrain.reply()` from `src/brain.ts`. The current brain is scripted, so the site works offline and JUNIOR stays in character. To connect a language model, write another `JuniorBrain` implementation (see `LLM_SKETCH` in `brain.ts`) and return it from `createJuniorBrain`. Keep the existing rule: the jokes are fiction, but the model must never invent employers, dates, or metrics.
