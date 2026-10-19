import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { formatShipTime } from "./ship";

/** Hotspot boxes in percent of the bridge artwork (public/art/bridge.png, 16:9). */
export interface Box {
  l: number;
  t: number;
  w: number;
  h: number;
}

export const bridgeMap = {
  quarters: { l: 0.6, t: 45.5, w: 8.6, h: 32 },
  lab: { l: 91, t: 45.5, w: 8.5, h: 32 },
  hoard: { l: 4.6, t: 31.5, w: 19.6, h: 9.6 },
  blackbox: { l: 75.2, t: 31.5, w: 20, h: 10.4 },
  radio: { l: 29.2, t: 30.8, w: 8.6, h: 6 },
  story: { l: 45.4, t: 30.8, w: 9.2, h: 6 },
  log: { l: 11, t: 59, w: 20, h: 10 },
  galaxy: { l: 32.4, t: 56, w: 35.4, h: 8 },
  guestbook: { l: 68.6, t: 57, w: 20, h: 11 },
  coffee: { l: 19.53, t: 48.06, w: 5.47, h: 11.39 },
  boarder: { l: 43, t: 26, w: 14, h: 3.6 },
  captainChair: { l: 45.6, t: 70.8, w: 8.8, h: 27.5 },
  crewLeft: { l: 18, t: 75, w: 10.5, h: 25 },
  crewRight: { l: 70.5, t: 75, w: 10.5, h: 25 },
} satisfies Record<string, Box>;

export function boxStyle(box: Box): CSSProperties {
  return { left: `${box.l}%`, top: `${box.t}%`, width: `${box.w}%`, height: `${box.h}%` };
}

/** A clickable object on the bridge. Without a `label` it is an unmarked easter egg. */
export function Hotspot({
  box,
  label,
  tag = "top",
  align = "start",
  className = "",
  ariaLabel,
  onClick,
  children,
}: {
  box: Box;
  label?: string;
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
      className={`hotspot ${label ? "" : "secret"} ${className}`}
      style={boxStyle(box)}
      aria-label={ariaLabel ?? label}
      onClick={onClick}
    >
      {label && (
        <span className={`tag tag-${tag} tag-${align}`} aria-hidden="true">
          {label}
        </span>
      )}
      {children}
    </button>
  );
}

export function ShipClock({ port }: { port: string }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <time dateTime={now.toISOString()}>
      {formatShipTime(now)} {port.toUpperCase()}
    </time>
  );
}

export function Planet() {
  return (
    <>
      <span className="ring back" aria-hidden="true" />
      <div className="planet" aria-hidden="true">
        <div className="surface" />
        <div className="clouds" />
        <div className="night" />
        <div className="atmo" />
      </div>
      <span className="ring front" aria-hidden="true" />
    </>
  );
}

export function Moon() {
  return <div className="moon" aria-hidden="true" />;
}

export function Orb({ speaking, mood, onClick }: { speaking: boolean; mood: number; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`orb ${speaking ? "speaking" : ""} ${mood >= 4 ? "annoyed" : ""}`}
      onClick={onClick}
      aria-label="JUNIOR, acting captain"
    >
      <span className="orb-beam" aria-hidden="true" />
      <span className="orb-core" aria-hidden="true">
        <i className="swirl s1" />
        <i className="swirl s2" />
        <i className="wave w1" />
        <i className="wave w2" />
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
    </span>
  );
}

export function BoarderCounter({ number, onClick }: { number: number; onClick: () => void }) {
  return (
    <button
      type="button"
      className="boarder"
      style={boxStyle(bridgeMap.boarder)}
      aria-label={`Boarding counter. You are boarder number ${number}.`}
      onClick={onClick}
    >
      <span>BOARDER</span>
      <b>#{String(number).padStart(6, "0")}</b>
    </button>
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
      <button type="button" className="boom" disabled={!open} aria-label="Big red button" onClick={onPress} />
      <button
        type="button"
        className={open ? "lid open" : "lid"}
        aria-expanded={open}
        aria-label={open ? "Safety cover open" : "Safety cover"}
        onClick={onToggle}
      />
    </div>
  );
}
