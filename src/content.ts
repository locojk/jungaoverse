/**
 * Typed doors into the editable content in `src/data/*.json`.
 * Edit the JSON, not this file. Everything here is placeholder until Jun fills it in.
 */
import siteJson from "./data/site.json";
import juniorJson from "./data/junior.json";
import factsJson from "./data/facts.json";
import quartersJson from "./data/quarters.json";
import logsJson from "./data/logs.json";
import hoardJson from "./data/hoard.json";
import planetsJson from "./data/planets.json";
import blackboxJson from "./data/blackbox.json";
import guestbookJson from "./data/guestbook.json";
import labJson from "./data/lab.json";
import storyJson from "./data/story.json";
import radioJson from "./data/radio.json";
import viewportJson from "./data/viewport.json";
import type { StationId } from "./ship";

export interface StationInfo {
  label: string;
  title: string;
  blurb: string;
}

export interface Site {
  name: string;
  domain: string;
  homePort: string;
  shipDay: number;
  boarderNumber: number;
  stations: Record<StationId, StationInfo>;
}

export interface JuniorResponse {
  keywords: string[];
  reply: string;
  open?: StationId;
  /** Only match when the visitor's message is this short (for greetings). */
  maxWords?: number;
}

export interface JuniorScript {
  /** Full-screen welcome on a first visit. `{day}` becomes the ship day. */
  intro: string[];
  origin: string[];
  welcomeBack: string[];
  prompts: string[];
  idle: string[];
  hints: string[];
  orbClicks: string[];
  captainChair: string[];
  crewChairs: string[];
  /** `{code}` in any door line becomes `code`. */
  door: {
    code: string;
    locked: string;
    stillLocked: string;
    unlock: string;
    guessed: string;
    remind: string;
    alreadyOpen: string;
    keypadKnown: string;
    wrongLocked: string;
    wrongKnown: string;
    granted: string;
  };
  destruct: { alarm: string; countdownFrom: number; redirect: string; delivered: string };
  boarder: string;
  guestbookReply: string;
  tourComplete: string;
  error: string;
  responses: JuniorResponse[];
  fallbacks: string[];
}

export interface QuartersField {
  label: string;
  value: string;
}

export interface Quarters {
  /** JUNIOR's lines inside the room. `{day}` is filled in. */
  junior: { idle: string; hammock: string; sneakOut: string };
  poster: {
    header: string;
    /** Image URL for the profile picture. Empty draws the doodle. */
    photo: string;
    photoCaption: string;
    fields: QuartersField[];
  };
  signoff: string;
}

export interface LogEntry {
  stardate: string;
  title: string;
  body: string;
}

export interface HoardShelf {
  id: string;
  title: string;
  items: { name: string; note: string }[];
}

export interface Planet {
  id: string;
  name: string;
  kind: string;
  color: string;
  orbit: 1 | 2 | 3;
  angle: number;
  text: string;
  /** Image URLs. An empty string renders an empty photo frame. */
  photos: string[];
}

export interface BlackBox {
  moments: { title: string; text: string }[];
  quotes: { quote: string; by: string }[];
  ridiculous: { quote: string; context: string }[];
}

export interface GuestbookEntry {
  name: string;
  date: string;
  message: string;
}

export type LabStatus = "Works" | "Kinda works" | "Exploded";

export interface LabItem {
  name: string;
  status: LabStatus;
  text: string;
  link: string;
}

export interface Story {
  title: string;
  start: string;
  nodes: Record<string, { text: string; choices: { label: string; to: string }[] }>;
}

export interface Radio {
  title: string;
  artist: string;
  plays: number;
  note: string;
  link: string;
}

export interface ViewportStatus {
  weather: string;
  upTo: string;
  mood: string;
  listening: string;
}

export const site = siteJson as Site;
export const junior = juniorJson as JuniorScript;
export const facts = factsJson as string[];
export const quarters = quartersJson as Quarters;
export const logs = logsJson as LogEntry[];
export const hoard = hoardJson as HoardShelf[];
export const planets = planetsJson as Planet[];
export const blackbox = blackboxJson as BlackBox;
export const guestbook = guestbookJson as GuestbookEntry[];
export const lab = labJson as LabItem[];
export const story = storyJson as Story;
export const radio = radioJson as Radio;
export const viewport = viewportJson as ViewportStatus;

/** Stations listed in the mobile console, in order. Easter eggs are deliberately absent. */
export const consoleOrder: StationId[] = [
  "log",
  "hoard",
  "galaxy",
  "blackbox",
  "guestbook",
  "lab",
  "story",
  "radio",
  "viewport",
];

/** Days since Jun went to the cargo bay, written with commas. */
export const shipDay = site.shipDay.toLocaleString("en-US");

/** Replaces `{key}` in a line. `{day}` is always the ship day and `{code}` the door code. */
export function fill(template: string, values: Record<string, string | number> = {}) {
  const all: Record<string, string | number> = { day: shipDay, code: junior.door.code, ...values };
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in all ? String(all[key]) : match));
}
