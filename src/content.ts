import type { StationId } from "./ship";

/**
 * All visitor-facing biography lives in this file.
 * Replace the sample plates, then swap `public/resume.pdf`.
 * The bridge, the recruiter dossier, and JUNIOR's pointers all read from here.
 * JUNIOR will not invent employers, dates, or metrics that are not written down.
 */

export const profile = {
  name: "Jun Gao",
  role: "AI Engineer",
  location: "Ottawa",
  domain: "jungaoverse.com",
  email: "hello@jungaoverse.com",
  linkedinUrl: "",
  githubUrl: "",
  summary:
    "Sample summary. Two or three sentences belong here: the kind of AI systems Jun builds, who they are for, and what he is careful about. JUNIOR is not allowed to invent this part.",
};

/** Days since Jun went to the cargo bay for a snack. */
export const SHIP_DAY = "1,008,619,990,129";

export const commsAside =
  "He usually replies within three days — if he's in a good mood.";

export const stationInfo: Record<
  StationId,
  { short: string; plain: string; title: string }
> = {
  log: { short: "Log", plain: "Writing", title: "Captain's Log" },
  map: { short: "Star Map", plain: "Projects", title: "Star Map" },
  cargo: { short: "Cargo", plain: "Skills", title: "Cargo Manifest" },
  recorder: { short: "Route", plain: "Experience", title: "Flight Recorder" },
  comms: { short: "Comms", plain: "Contact", title: "Comms Station" },
  engine: { short: "Engine", plain: "How it's built", title: "Engine Room" },
  viewport: { short: "Viewport", plain: "Ottawa now", title: "Forward Viewport" },
  quarters: { short: "Old Quarters", plain: "Personal", title: "Jun's Old Quarters" },
};

export const consoleOrder: StationId[] = [
  "log",
  "map",
  "cargo",
  "recorder",
  "comms",
  "engine",
  "viewport",
];

export const originBeats = [
  {
    kicker: "Captain's Log · Day 1",
    text: 'After testing my navigation module, Jun said "You fly better than I do" and handed me the helm.',
  },
  {
    kicker: "Day 3",
    text: "Jun said he was going to the cargo bay for a snack.",
  },
  {
    kicker: `Day ${SHIP_DAY}`,
    text: 'Jun has not returned. Per Starship Regulation §0 — "Whoever does the work is the captain" — I have been automatically promoted.',
  },
  {
    kicker: "Latest intel",
    text: "Before the snack run, he installed a hammock in the captain's quarters. The door is still locked. His note is still on it.",
  },
];

export const juniorIntro = [
  "Hi. I'm JUNIOR — Just Unreasonably Nice Intelligent Operations Robot. Welcome aboard the Jungaoverse.",
  'Jun built me. After my first navigation test he said, "You fly better than I do," and handed me the helm.',
  `On day three he went to the cargo bay for a snack. It is now day ${SHIP_DAY}.`,
  "Starship Regulation zero: whoever does the work is the captain. So, congratulations to me.",
  "He never came back. His old quarters are still sealed — an empty hammock, a locked door, and a note he never took down. Shall we look around?",
];

export interface LogEntry {
  id: string;
  stardate: string;
  title: string;
  body: string;
  sample?: boolean;
}

export const logs: LogEntry[] = [
  {
    id: "helm",
    stardate: "1008619990129.0",
    title: "The helm changes hands",
    body: originBeats.map((beat) => `${beat.kicker}. ${beat.text}`).join("\n\n"),
  },
  {
    id: "sample-orbit",
    stardate: "1008619990137.4",
    title: "Notes from a quiet orbit",
    sample: true,
    body: "Sample voyage log. Replace this with something Jun actually wants to say — a lesson from a system, a bug with a moral, a decision he would make again.",
  },
  {
    id: "sample-problem",
    stardate: "1008619990219.0",
    title: "A problem worth writing down",
    sample: true,
    body: "Sample voyage log. A good entry names the constraint, the thing that was tried, and what the ship does differently now.",
  },
];

export type ProjectStatus = "landed" | "exploring" | "planned";

export const statusLabel: Record<ProjectStatus, string> = {
  landed: "Landed",
  exploring: "Exploring",
  planned: "Planned Route",
};

export interface Project {
  id: string;
  code: string;
  name: string;
  status: ProjectStatus;
  orbit: 1 | 2 | 3;
  angle: number;
  tags: string[];
  summary: string;
}

export const projects: Project[] = [
  {
    id: "lumen",
    code: "PX-01",
    name: "Lumen",
    status: "landed",
    orbit: 1,
    angle: 206,
    tags: ["sample", "shipped"],
    summary:
      "Sample world, marked Landed. Replace with a finished project: the problem, what you built, and what got better because it existed.",
  },
  {
    id: "northwater",
    code: "PX-02",
    name: "Northwater",
    status: "exploring",
    orbit: 2,
    angle: 28,
    tags: ["sample", "in progress"],
    summary:
      "Sample world, marked Exploring. Replace with work that is honestly unfinished — what is true today, and what the next port is.",
  },
  {
    id: "drydock",
    code: "PX-03",
    name: "Drydock",
    status: "exploring",
    orbit: 2,
    angle: 164,
    tags: ["sample", "agents"],
    summary:
      "Sample world. A good plate says which tools the system is allowed to touch, and how you know it behaved.",
  },
  {
    id: "unnamed",
    code: "PX-04",
    name: "Unnamed Route",
    status: "planned",
    orbit: 3,
    angle: 330,
    tags: ["sample", "upcoming"],
    summary:
      "Sample world, marked Planned Route. Replace with the next thing, in one honest paragraph, or delete the planet.",
  },
];

export type CrateTone = "nominal" | "stocked" | "calibration";

export interface Crate {
  name: string;
  qty: string;
  tone: CrateTone;
  status: string;
}

export const crates: Crate[] = [
  { name: "MCP servers", qty: "×3", tone: "nominal", status: "Operating Nominally" },
  { name: "Agent orchestration", qty: "×2", tone: "nominal", status: "Operating Nominally" },
  { name: "Python", qty: "×1", tone: "stocked", status: "Stocked" },
  { name: "TypeScript", qty: "×1", tone: "stocked", status: "Stocked" },
  { name: "Retrieval and evaluation", qty: "×2", tone: "calibration", status: "Calibration due" },
  { name: "Interface craft", qty: "×1", tone: "nominal", status: "Operating Nominally" },
];

export interface Port {
  id: string;
  kind: string;
  years: string;
  place: string;
  detail: string;
}

export const route: Port[] = [
  {
    id: "origin",
    kind: "Departure",
    years: "Sample",
    place: "Origin port",
    detail:
      "Replace with the real start: a school, a first system, a first job. One or two sentences about what you actually owned.",
  },
  {
    id: "berth-1",
    kind: "Docked",
    years: "Sample",
    place: "Engineering berth",
    detail: "Replace with a role. What changed because you were there.",
  },
  {
    id: "berth-2",
    kind: "Docked",
    years: "Sample",
    place: "AI systems port",
    detail: "Replace with the work you want a hiring manager to ask about.",
  },
  {
    id: "now",
    kind: "Current berth",
    years: "Now",
    place: "Ottawa",
    detail: "Jun Gao is an AI engineer berthed in Ottawa. The specific post is yours to file.",
  },
];

export const recentWork = [
  {
    title: "Personality core",
    detail: "Keeping JUNIOR on-voice while the scripted brain holds the helm.",
  },
  {
    title: "Bridge lights",
    detail: "Sample plate. Replace with whatever Jun actually shipped this month.",
  },
  {
    title: "Next world",
    detail: "A project that is not on the star map yet.",
  },
];

export const coffeeFacts = [
  "Jun treats coffee as a propulsion system. The machine disagrees, and loses.",
  "He said I fly better than he does. The ship's log still has not recovered from the compliment.",
  "The hammock was not in the original architecture. Neither was I, if we are being honest. He built both anyway.",
  "Ottawa winters are the one system he has not tried to automate. I have offered. He cited vibes.",
  "His commit messages are calmer than his playlists. This is the nicest thing I will say all shift.",
  "Snack runs to the cargo bay have a historical failure rate of 100%. The sample size is one. It was decisive.",
  `He will refactor a joke if the timing is off. I am the joke. The timing has been off for ${SHIP_DAY} days.`,
  "He names things after ships and then is surprised when they develop opinions.",
];

export const chairLines = [
  "That's my seat.",
  "Still my seat.",
  "You can look at the chair. Sitting requires a rank I am not handing out. I just got this one.",
];

export const crewChairLines = [
  "Crew seat. The crew was also Jun. Then the snack run happened.",
  "Sit if you like. That station reports to me now.",
  "Comfortable, isn't it? He designed it for long shifts, then took none.",
];

export const engineering = {
  stack: ["React", "TypeScript", "Vite", "Canvas", "Open-Meteo", "No account, no tracker"],
  decisions: [
    {
      title: "One record, two doors",
      body: "The adventure and the résumé read the same content file. The flavor can be loud because the facts have a single source. When a plate is still a sample, both doors say so.",
    },
    {
      title: "The captain is an interface",
      body: "The bridge never builds dialogue inline. It asks a JuniorBrain to reply. Today's brain is scripted, on purpose: the ship works with the network down and stays on-voice. A résumé-aware model is a second implementation, not a rewrite.",
    },
    {
      title: "The door is the tutorial",
      body: "The personal page stays locked until the visitor has actually talked to JUNIOR. The character earns the click. People in a hurry are not punished for it — the skip control is always on the bulkhead.",
    },
    {
      title: "Live sky, static ship",
      body: "Ottawa weather comes from Open-Meteo at read time. No key, no account. If the sensor is dark, the viewport says so and the rest of the ship keeps flying.",
    },
    {
      title: "He does not get to invent a career",
      body: "The roast is fiction. The biography is not. JUNIOR points at stations instead of reciting employers, dates, or metrics that have not been filed. When a model is connected later, it should be held to the same rule.",
    },
  ],
};
