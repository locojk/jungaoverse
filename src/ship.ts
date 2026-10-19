export const STATIONS = [
  "log",
  "map",
  "cargo",
  "recorder",
  "comms",
  "engine",
  "viewport",
  "quarters",
] as const;

export type StationId = (typeof STATIONS)[number];

export interface ShipSave {
  introDone: boolean;
  doorUnlocked: boolean;
  talked: boolean;
  tourAck: boolean;
  visited: StationId[];
}

const STORAGE_KEY = "jungaoverse.v1";

const blankSave = (): ShipSave => ({
  introDone: false,
  doorUnlocked: false,
  talked: false,
  tourAck: false,
  visited: [],
});

function isStation(value: unknown): value is StationId {
  return typeof value === "string" && (STATIONS as readonly string[]).includes(value);
}

export function loadShip(): ShipSave {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return blankSave();
    const data = JSON.parse(raw) as Partial<ShipSave>;
    return {
      introDone: Boolean(data.introDone),
      doorUnlocked: Boolean(data.doorUnlocked),
      talked: Boolean(data.talked),
      tourAck: Boolean(data.tourAck),
      visited: Array.isArray(data.visited) ? data.visited.filter(isStation) : [],
    };
  } catch {
    return blankSave();
  }
}

export function persistShip(save: ShipSave) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch {
    /* Private mode and full disks should not sink the ship. */
  }
}

export function formatShipTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "America/Toronto",
  }).format(date);
}

export function downloadResume() {
  const link = document.createElement("a");
  link.href = `${import.meta.env.BASE_URL}resume.pdf`;
  link.download = "Jun-Gao-Resume.pdf";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
