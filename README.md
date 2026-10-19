# Jungaoverse

Jun's casual, personal corner of the internet at [jungaoverse.com](https://jungaoverse.com/). It isn't a portfolio. It's a pixel-art spaceship bridge you explore by clicking things.

Jun went to the cargo bay for a snack on day 3 and never came back. The ship is now run by JUNIOR (Just Unreasonably Nice Intelligent Operations Robot), a chatty orb who likes roasting his former captain.

## Getting started

```bash
npm install
npm run dev       # start the dev server
npm run build     # type-check, then build to dist/
npm run preview   # serve the production build locally
```

The site is fully static. There is no backend, database, or API call. Visitor progress (door unlocked, origin story seen) is saved in `localStorage` under `jungaoverse.v2`.

On a first visit, JUNIOR introduces himself on a full-screen intro (with an optional read-aloud voice). After that, his Captain's Log origin story plays in the dialogue box.

## What's on the bridge

Most objects show a small label when you hover over them. Some are unlabeled easter eggs.

| Object | Where | What it opens |
| --- | --- | --- |
| Captain's Quarters | Locked door, left wall | Jun's abandoned room. Clicking the door opens a keypad; JUNIOR gives you the code after a little chat. The code is `door.code` in `junior.json`. |
| Captain's Log | Left side of the main desk | Random thoughts, filed by stardate |
| Hoard Bay | Overhead screens, left | What Jun is watching, reading, playing, and wants to buy |
| Interest Galaxy | Center of the main desk | Hobbies and side projects as planets |
| Black Box | Overhead screens, right | Embarrassing moments, quotes, ridiculous things Jun said |
| Visitor Logbook | Right side of the main desk | Guestbook (sample messages only, nothing is sent) |
| Lab | Hatch with a wheel, right wall | Toys, demos, and experiments tagged "Exploded" |
| Entertainment Terminal | Overhead screens, center | A playable, branching story chapter |
| Ship's Radio | Overhead screens, center-left | The song on repeat |
| Viewport | The window | Status at Byte Town Station: weather, what Jun's up to, mood, music |
| Coffee machine | End of the main desk | One random fun fact per click |
| Boarding counter | Plate above the window | "You are boarder #N" |

Easter eggs: the big red button under the safety cover, the captain's chair, the crew chairs, and poking JUNIOR repeatedly.

## Editing content

All content lives in JSON files in `src/data/`, so you can change it without touching code:

| File | Contents |
| --- | --- |
| `site.json` | Name, home port, ship day, boarder number, station names |
| `junior.json` | Everything JUNIOR says: intro screen (`{day}` becomes the ship day), origin story, idle lines, hints, click reactions, door lines, chat replies, fallbacks |
| `quarters.json` | Jun's self-introduction |
| `logs.json` | Captain's log entries |
| `hoard.json` | Hoard Bay shelves |
| `planets.json` | Interest Galaxy planets. Put image URLs in `photos`; an empty string shows an empty frame. |
| `blackbox.json` | Black Box records |
| `guestbook.json` | Sample guestbook messages |
| `lab.json` | Lab items. `status` is `Works`, `Kinda works`, or `Exploded`. |
| `story.json` | The story chapter, as nodes with choices that point to other nodes |
| `radio.json` | The song on repeat |
| `viewport.json` | Viewport status values |
| `facts.json` | Coffee machine fun facts |

`src/content.ts` defines the shape of each file, so `npm run build` catches typos in field names.

### Teaching JUNIOR new replies

Add an entry to `responses` in `junior.json`:

```json
{ "keywords": ["pizza"], "reply": "Jun's pizza opinions are classified.", "open": "blackbox" }
```

Keywords match whole words (plus simple plurals and "-ing" forms). The first matching rule wins, so put specific rules before general ones. `open` is optional; it adds a button that opens that station.

## Swapping in a real brain

The chat UI never writes replies itself. It calls `JuniorBrain.reply()` from `src/brain.ts`, which is scripted today (keyword matching plus fallbacks). To connect a language model, write another `JuniorBrain` that returns `{ text, grantKey?, open? }` and return it from `createJuniorBrain`. The UI doesn't need to change.

## Project layout

```
public/art/bridge.png   the bridge artwork (16:9)
src/
  data/*.json           all editable content
  content.ts            typed loader for the JSON
  brain.ts              JUNIOR's scripted brain
  App.tsx               the bridge: objects, chat, idle chatter, easter eggs
  scene.tsx             hotspot positions and scene pieces (planet, orb, counter, red button)
  Panels.tsx            the station panels
  Starfield.tsx         animated starfield
  ship.ts               station IDs and save/load
  styles.css            styles
```
