import { useEffect, useRef, useState, type FormEvent } from "react";
import { fill, junior } from "./content";

type Status = "idle" | "denied" | "granted";

const CODE = junior.door.code.toUpperCase();
const clean = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, CODE.length);

export function Keypad({
  codeGiven,
  onUnlock,
  onAskJunior,
  onClose,
}: {
  codeGiven: boolean;
  onUnlock: () => void;
  onAskJunior: () => void;
  onClose: () => void;
}) {
  const [entry, setEntry] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [line, setLine] = useState(fill(codeGiven ? junior.door.keypadKnown : junior.door.locked));
  const inputRef = useRef<HTMLInputElement>(null);
  const unlockTimer = useRef(0);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(unlockTimer.current);
      document.body.style.overflow = prevOverflow;
      previous?.focus?.();
    };
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "granted" || !entry) return;
    if (entry === CODE) {
      setStatus("granted");
      setLine(fill(junior.door.granted));
      unlockTimer.current = window.setTimeout(onUnlock, 1100);
      return;
    }
    setStatus("denied");
    setLine(fill(codeGiven ? junior.door.wrongKnown : junior.door.wrongLocked));
    setEntry("");
    inputRef.current?.focus();
  }

  const readout = status === "granted" ? "ACCESS GRANTED" : status === "denied" ? "ACCESS DENIED" : "ENTER ACCESS CODE";

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="keypad-title" onClick={onClose}>
      <form className={`keypad ${status}`} onSubmit={submit} onClick={(event) => event.stopPropagation()}>
        <header className="keypad-head">
          <span className="keypad-lamp" aria-hidden="true" />
          <h2 id="keypad-title">Captain's Quarters</h2>
          <span className="keypad-state">{status === "granted" ? "UNLOCKED" : "LOCKED"}</span>
        </header>

        <p className="keypad-readout" role="status">
          {readout}
        </p>

        <label className="lcd" onClick={() => inputRef.current?.focus()}>
          <span className="sr-only">Access code, {CODE.length} characters</span>
          {Array.from({ length: CODE.length }, (_, index) => (
            <span key={index} className={index === entry.length && status !== "granted" ? "cell next" : "cell"} aria-hidden="true">
              {entry[index] ?? ""}
            </span>
          ))}
          <input
            ref={inputRef}
            value={entry}
            onChange={(event) => {
              setEntry(clean(event.target.value));
              if (status === "denied") setStatus("idle");
            }}
            maxLength={CODE.length}
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            disabled={status === "granted"}
          />
        </label>

        <div className="keypad-actions">
          <button type="submit" className="transmit" disabled={status === "granted" || !entry}>
            Enter
          </button>
          <button
            type="button"
            className="chip"
            disabled={status === "granted" || !entry}
            onClick={() => {
              setEntry("");
              inputRef.current?.focus();
            }}
          >
            Clear
          </button>
        </div>

        <blockquote className="junior-says" aria-live="polite">
          {line}
          <footer>JUNIOR</footer>
        </blockquote>

        <div className="keypad-foot">
          {!codeGiven && (
            <button type="button" className="linkish" onClick={onAskJunior}>
              ▶ Ask JUNIOR for the code
            </button>
          )}
          <button type="button" className="linkish" onClick={onClose}>
            Step away from the door
          </button>
        </div>
      </form>
    </div>
  );
}
