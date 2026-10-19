import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { formatShipTime, type StationId } from "./ship";

/** Hotspot boxes in percent of the bridge artwork (public/art/bridge.png, 16:9). */
export interface Box {
  l: number;
  t: number;
  w: number;
  h: number;
}

export const bridgeMap: Record<Exclude<StationId, "viewport">, Box> & {
  coffee: Box;
  captainChair: Box;
  crewLeft: Box;
  crewRight: Box;
} = {
  cargo: { l: 4.6, t: 31.5, w: 19.6, h: 9.6 },
  recorder: { l: 75.2, t: 31.5, w: 20, h: 10.4 },
  log: { l: 11, t: 60.5, w: 20, h: 9 },
  map: { l: 32.4, t: 56, w: 35.4, h: 8 },
  comms: { l: 68.6, t: 57, w: 20, h: 11 },
  engine: { l: 91, t: 45.5, w: 8.5, h: 32 },
  quarters: { l: 0.6, t: 45.5, w: 8.6, h: 32 },
  coffee: { l: 12.6, t: 50, w: 6, h: 10 },
  captainChair: { l: 45.6, t: 70.8, w: 8.8, h: 27.5 },
  crewLeft: { l: 18, t: 75, w: 10.5, h: 25 },
  crewRight: { l: 70.5, t: 75, w: 10.5, h: 25 },
};

function boxStyle(box: Box): CSSProperties {
  return { left: `${box.l}%`, top: `${box.t}%`, width: `${box.w}%`, height: `${box.h}%` };
}

export function Hotspot({
  box,
  label,
  sub,
  seen = false,
  tag = "top",
  align = "start",
  className = "",
  ariaLabel,
  onClick,
  children,
}: {
  box: Box;
  label?: string;
  sub?: string;
  seen?: boolean;
  tag?: "top" | "bottom";
  align?: "start" | "center" | "end";
  className?: string;
  ariaLabel?: string;
  onClick: () => void;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`hotspot ${seen ? "seen" : ""} ${className}`}
      style={boxStyle(box)}
      aria-label={ariaLabel ?? (sub ? `${label}, ${sub}` : label)}
      onClick={onClick}
    >
      {label && (
        <span className={`tag tag-${tag} tag-${align}`} aria-hidden="true">
          <b>{label}</b>
          {sub && <span> · {sub}</span>}
        </span>
      )}
      {children}
    </button>
  );
}

export function ShipClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return <time dateTime={now.toISOString()}>{formatShipTime(now)} OTTAWA</time>;
}

export function Planet() {
  return (
    <div className="planet" aria-hidden="true">
      <div className="surface" />
      <div className="clouds" />
      <div className="night" />
      <div className="atmo" />
    </div>
  );
}

export function Moon() {
  return <div className="moon" aria-hidden="true" />;
}

export function Orb({ speaking, onClick }: { speaking: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={speaking ? "orb speaking" : "orb"}
      onClick={onClick}
      aria-label="JUNIOR, acting captain. Talk to him."
    >
      <span className="orb-beam" aria-hidden="true" />
      <span className="orb-core" aria-hidden="true">
        <i className="swirl s1" />
        <i className="swirl s2" />
        <i className="shine" />
      </span>
    </button>
  );
}

export function StickyNote() {
  return (
    <span className="note" aria-hidden="true">
      DO NOT DISTURB
      <em>(currently slacking off)</em>
      <small>— Jun</small>
    </span>
  );
}

export function DestructSwitch({
  open,
  onToggle,
  onPress,
}: {
  open: boolean;
  onToggle: () => void;
  onPress: () => void;
}) {
  return (
    <div className="destruct">
      <button
        type="button"
        className="boom"
        disabled={!open}
        aria-label="Self-destruct"
        onClick={onPress}
      />
      <button
        type="button"
        className={open ? "lid open" : "lid"}
        aria-expanded={open}
        aria-label={open ? "Safety cover open" : "Open the self-destruct safety cover"}
        onClick={onToggle}
      />
    </div>
  );
}
