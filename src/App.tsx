import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createJuniorBrain, type BrainReply, type ChatTurn } from "./brain";
import { consoleOrder, facts, fill, junior, quarters, shipDay, site } from "./content";
import { DestructJunior, Intro } from "./Intro";
import { Keypad } from "./Keypad";
import { PanelDialog } from "./Panels";
import {
  BoarderCounter,
  bridgeMap,
  DestructSwitch,
  Hotspot,
  Moon,
  Orb,
  Planet,
  ShipClock,
  StickyNote,
} from "./scene";
import { Starfield } from "./Starfield";
import { loadShip, persistShip, prefersReducedMotion, resetShip, type ShipSave, type StationId } from "./ship";

interface UiMessage {
  id: string;
  role: "visitor" | "junior";
  text: string;
  open?: StationId;
}

let messageSerial = 0;
function uid() {
  messageSerial += 1;
  return `m${messageSerial}`;
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

function randomOf<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

const IDLE_MS = 25_000;
const MAX_IDLE_LINES = 4;
const ORB_COOLDOWN_MS = 12_000;
const ORIGIN_GAP_MS = 1_600;
const TYPE_MS = 22;

/** Reveals JUNIOR's newest line one character at a time, like a game dialogue box. */
function TypeLine({ text, onTick, onDone }: { text: string; onTick: () => void; onDone: () => void }) {
  const [count, setCount] = useState(() => (prefersReducedMotion() ? text.length : 0));
  const done = count >= text.length;

  useEffect(() => {
    if (done) {
      onDone();
      return;
    }
    const id = window.setTimeout(() => setCount((current) => current + 1), TYPE_MS);
    onTick();
    return () => window.clearTimeout(id);
  }, [count, done]);

  return (
    <>
      {text.slice(0, count)}
      {!done && <i className="caret" aria-hidden="true" />}
    </>
  );
}

export function App() {
  const boot = useState(() => loadShip())[0];
  const [save, setSave] = useState<ShipSave>(boot);
  const saveRef = useRef(save);
  const [introOpen, setIntroOpen] = useState(() => !boot.originSeen);
  const [station, setStation] = useState<StationId | null>(null);
  const [coverOpen, setCoverOpen] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [keypadOpen, setKeypadOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [ticket, setTicket] = useState<string | null>(null);
  const [seatLine, setSeatLine] = useState<{ text: string; at: "captain" | "left" | "right" } | null>(null);
  const [doorShake, setDoorShake] = useState(false);
  const [asked, setAsked] = useState<string[]>([]);
  const [orbMood, setOrbMood] = useState(0);
  const [messages, setMessages] = useState<UiMessage[]>(() =>
    boot.originSeen ? [{ id: uid(), role: "junior", text: randomOf(junior.welcomeBack) }] : [],
  );
  const [typingId, setTypingId] = useState<string | null>(() => messages[0]?.id ?? null);

  const brain = useRef(createJuniorBrain());
  const sending = useRef(false);
  const factBag = useRef<string[]>([]);
  const idleBag = useRef<string[]>([]);
  const chairStep = useRef(0);
  const crewStep = useRef(0);
  const orbClicks = useRef(0);
  const orbTimer = useRef(0);
  const originQueue = useRef<string[]>(boot.originSeen ? [] : [...junior.origin]);
  const originTimer = useRef(0);
  const lastActivity = useRef(Date.now());
  const idleCount = useRef(0);
  const busy = useRef(false);
  const panRef = useRef<HTMLDivElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const ticketTimer = useRef(0);
  const seatTimer = useRef(0);
  const shakeTimer = useRef(0);

  const covered = introOpen || station !== null || countdown !== null || resumeOpen || keypadOpen;
  const visitorTurns = messages.filter((message) => message.role === "visitor").length;
  busy.current = covered || pending || typingId !== null || originQueue.current.length > 0;
  const orders = [
    { label: "Talk to JUNIOR", done: save.talked },
    { label: "Get into his quarters", done: save.doorUnlocked },
    { label: "Find the big red button", done: save.destructed },
  ];

  useLayoutEffect(() => {
    const pan = panRef.current;
    if (!pan) return;
    const center = () => {
      pan.scrollLeft = (pan.scrollWidth - pan.clientWidth) / 2;
      pan.scrollTop = (pan.scrollHeight - pan.clientHeight) / 2;
    };
    center();
    window.addEventListener("resize", center);
    return () => window.removeEventListener("resize", center);
  }, []);

  useEffect(() => {
    scrollTranscript();
  }, [messages, pending, expanded]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (resumeOpen) setResumeOpen(false);
      else if (keypadOpen) setKeypadOpen(false);
      else if (station) setStation(null);
      else if (introOpen) board("bridge");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    const wake = () => {
      lastActivity.current = Date.now();
      idleCount.current = 0;
    };
    const events = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
    events.forEach((name) => window.addEventListener(name, wake, { passive: true }));
    const id = window.setInterval(() => {
      if (busy.current || idleCount.current >= MAX_IDLE_LINES) return;
      if (Date.now() - lastActivity.current < IDLE_MS) return;
      if (idleBag.current.length === 0) idleBag.current = shuffle([...junior.idle, ...junior.hints]);
      idleCount.current += 1;
      say(idleBag.current.pop() ?? junior.idle[0]);
    }, 3000);
    return () => {
      events.forEach((name) => window.removeEventListener(name, wake));
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const id = window.setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => {
      setCountdown(null);
      setResumeOpen(true);
      applySave((prev) => ({ ...prev, destructed: true }));
    }, 900);
    return () => window.clearTimeout(id);
  }, [countdown]);

  useEffect(
    () => () => {
      [originTimer, orbTimer, ticketTimer, seatTimer, shakeTimer].forEach((timer) => window.clearTimeout(timer.current));
    },
    [],
  );

  function scrollTranscript() {
    const box = transcriptRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }

  function pushJunior(text: string, open?: StationId) {
    const id = uid();
    lastActivity.current = Date.now();
    setMessages((current) => [...current, { id, role: "junior", text: fill(text), open }]);
    setTypingId(id);
  }

  function stopOrigin() {
    if (originQueue.current.length === 0) return;
    originQueue.current = [];
    window.clearTimeout(originTimer.current);
    applySave((prev) => ({ ...prev, originSeen: true }));
  }

  /** JUNIOR reacts to the visitor. Interrupts the origin story if it is still playing. */
  function say(text: string, open?: StationId) {
    stopOrigin();
    pushJunior(text, open);
  }

  function onLineTyped() {
    setTypingId(null);
    window.clearTimeout(originTimer.current);
    if (originQueue.current.length === 0) return;
    originTimer.current = window.setTimeout(() => {
      const next = originQueue.current.shift();
      if (next === undefined) return;
      pushJunior(next);
      if (originQueue.current.length === 0) applySave((prev) => ({ ...prev, originSeen: true }));
    }, ORIGIN_GAP_MS);
  }

  /** Leaves the intro screen and starts the Captain's Log in the dialogue box. */
  function board(dest: "bridge" | "chat") {
    setIntroOpen(false);
    const first = originQueue.current.shift();
    if (first !== undefined) pushJunior(first);
    if (dest === "chat") window.setTimeout(focusChat, 60);
  }

  function replayIntro() {
    resetShip();
    window.location.reload();
  }

  function applySave(patch: (prev: ShipSave) => ShipSave) {
    const prev = saveRef.current;
    let next = patch(prev);
    if (next === prev) return;
    let cheer = false;
    if (next.talked && next.doorUnlocked && next.destructed && !next.tourAck) {
      next = { ...next, tourAck: true };
      cheer = true;
    }
    saveRef.current = next;
    persistShip(next);
    setSave(next);
    if (cheer) window.setTimeout(() => say(junior.tourComplete), 1200);
  }

  function openStation(id: StationId) {
    setStation(id);
    applySave((prev) => (prev.visited.includes(id) ? prev : { ...prev, visited: [...prev.visited, id] }));
  }

  function focusChat() {
    const behavior = prefersReducedMotion() ? "auto" : "smooth";
    document.getElementById("junior-chat")?.scrollIntoView({ behavior, block: "nearest" });
    document.getElementById("junior-input")?.focus({ preventScroll: true });
  }

  async function send(text: string) {
    const trimmed = text.trim().slice(0, 500);
    if (!trimmed || sending.current) return;
    sending.current = true;
    stopOrigin();
    const history: ChatTurn[] = messages.map(({ role, text: prior }) => ({ role, text: prior }));
    const ctx = {
      userTurns: visitorTurns + 1,
      codeGiven: saveRef.current.codeGiven,
      doorUnlocked: saveRef.current.doorUnlocked,
    };
    setMessages((current) => [...current, { id: uid(), role: "visitor", text: trimmed }]);
    setDraft("");
    setPending(true);
    try {
      const reply: BrainReply = await brain.current.reply(trimmed, ctx, history);
      pushJunior(reply.text, reply.open);
      applySave((prev) => ({ ...prev, talked: true, codeGiven: prev.codeGiven || Boolean(reply.revealsCode) }));
    } catch {
      pushJunior(junior.error);
    } finally {
      sending.current = false;
      setPending(false);
    }
  }

  function ask(prompt: string) {
    setAsked((current) => [...current, prompt]);
    void send(prompt);
  }

  function onDoor() {
    if (saveRef.current.doorUnlocked) {
      openStation("quarters");
      return;
    }
    setDoorShake(true);
    window.clearTimeout(shakeTimer.current);
    shakeTimer.current = window.setTimeout(() => setDoorShake(false), 480);
    setStation(null);
    setKeypadOpen(true);
  }

  function unlockDoor() {
    setKeypadOpen(false);
    applySave((prev) => ({ ...prev, codeGiven: true, doorUnlocked: true }));
    openStation("quarters");
    say(junior.door.granted);
  }

  function askForCode() {
    setKeypadOpen(false);
    const last = messages[messages.length - 1];
    if (last?.text !== junior.door.locked) say(junior.door.locked);
    focusChat();
  }

  function onCoffee() {
    if (factBag.current.length === 0) factBag.current = shuffle(facts);
    const fact = factBag.current.pop() ?? facts[0];
    setTicket(fact);
    window.clearTimeout(ticketTimer.current);
    ticketTimer.current = window.setTimeout(() => setTicket(null), 7000);
    say(fact);
  }

  function showSeat(text: string, at: "captain" | "left" | "right") {
    setSeatLine({ text, at });
    window.clearTimeout(seatTimer.current);
    seatTimer.current = window.setTimeout(() => setSeatLine(null), 3200);
    say(text);
  }

  function onCaptainChair() {
    const line = junior.captainChair[Math.min(chairStep.current, junior.captainChair.length - 1)];
    chairStep.current += 1;
    showSeat(line, "captain");
  }

  function onCrewChair(side: "left" | "right") {
    const line = junior.crewChairs[crewStep.current % junior.crewChairs.length];
    crewStep.current += 1;
    showSeat(line, side);
  }

  function onOrb() {
    const step = orbClicks.current;
    orbClicks.current += 1;
    setOrbMood(orbClicks.current);
    window.clearTimeout(orbTimer.current);
    orbTimer.current = window.setTimeout(() => {
      orbClicks.current = 0;
      setOrbMood(0);
    }, ORB_COOLDOWN_MS);
    say(junior.orbClicks[Math.min(step, junior.orbClicks.length - 1)]);
  }

  function pressBoom() {
    setCoverOpen(false);
    stopOrigin();
    setCountdown(junior.destruct.countdownFrom);
  }

  const prompts = junior.prompts.filter((prompt) => !asked.includes(prompt)).slice(0, 2);
  const seatBox =
    seatLine?.at === "left" ? bridgeMap.crewLeft : seatLine?.at === "right" ? bridgeMap.crewRight : bridgeMap.captainChair;
  const latestJunior = [...messages].reverse().find((message) => message.role === "junior");
  const label = (id: StationId) => site.stations[id].label;

  return (
    <>
      <h1 className="sr-only">The Jungaoverse — {site.name}'s spaceship bridge</h1>
      <div className={countdown !== null ? "stage quake" : "stage"} inert={covered ? true : undefined}>
        <div className="pan" ref={panRef}>
          <div className="scene">
            <Starfield />
            <Moon />
            <div className="planet-anchor">
              <Planet />
            </div>
            <Hotspot
              box={{ l: 0, t: 0, w: 100, h: 27 }}
              label={label("viewport")}
              align="center"
              className="glass"
              onClick={() => openStation("viewport")}
            />
            <img className="bridge-art" src="/art/bridge.png" alt="" draggable={false} />

            <BoarderCounter number={site.boarderNumber} onClick={() => say(fill(junior.boarder, { n: site.boarderNumber }))} />

            <Hotspot box={bridgeMap.hoard} label={label("hoard")} onClick={() => openStation("hoard")} />
            <Hotspot box={bridgeMap.radio} label={label("radio")} onClick={() => openStation("radio")}>
              <span className="radio-eq" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </Hotspot>
            <Hotspot box={bridgeMap.story} label={label("story")} align="center" onClick={() => openStation("story")} />
            <Hotspot box={bridgeMap.blackbox} label={label("blackbox")} align="end" onClick={() => openStation("blackbox")} />

            <Hotspot
              box={bridgeMap.quarters}
              label={label("quarters")}
              className={`door ${doorShake ? "shake" : ""} ${save.doorUnlocked ? "unlocked" : "locked"}`}
              ariaLabel={
                save.doorUnlocked
                  ? "Captain's quarters, unlocked"
                  : "Captain's quarters, locked. A note on the door: do not disturb, currently slacking off."
              }
              onClick={onDoor}
            >
              <span className="lamp" aria-hidden="true" />
              <StickyNote />
            </Hotspot>
            <Hotspot box={bridgeMap.lab} label={label("lab")} align="end" onClick={() => openStation("lab")} />

            <Hotspot box={bridgeMap.coffee} className="coffee" ariaLabel="Coffee machine" onClick={onCoffee}>
              <img className="coffee-art" src="/art/coffee.png" alt="" draggable={false} />
              <span className="steam" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </Hotspot>
            <Hotspot box={bridgeMap.log} label={label("log")} tag="bottom" onClick={() => openStation("log")} />
            <Hotspot
              box={bridgeMap.galaxy}
              label={label("galaxy")}
              tag="bottom"
              align="center"
              onClick={() => openStation("galaxy")}
            />
            <Hotspot
              box={bridgeMap.guestbook}
              label={label("guestbook")}
              tag="bottom"
              align="end"
              onClick={() => openStation("guestbook")}
            />

            <Hotspot box={bridgeMap.captainChair} className="chair" ariaLabel="Captain's chair" onClick={onCaptainChair} />
            <Hotspot box={bridgeMap.crewLeft} className="chair" ariaLabel="Crew chair" onClick={() => onCrewChair("left")} />
            <Hotspot box={bridgeMap.crewRight} className="chair" ariaLabel="Crew chair" onClick={() => onCrewChair("right")} />

            <div className="destruct-table">
              <div className="table-top">
                <DestructSwitch open={coverOpen} onToggle={() => setCoverOpen((open) => !open)} onPress={pressBoom} />
              </div>
              <div className="table-front" aria-hidden="true">
                <span className="tag-red">DO NOT PRESS</span>
              </div>
              <div className="table-foot" aria-hidden="true" />
            </div>

            <Orb speaking={typingId !== null || pending} mood={orbMood} onClick={onOrb} />

            {ticket && (
              <div className="ticket">
                <button
                  type="button"
                  className="ticket-close"
                  aria-label="Close fun fact"
                  onClick={() => {
                    window.clearTimeout(ticketTimer.current);
                    setTicket(null);
                  }}
                >
                  ✕
                </button>
                <b>COFFEE · FUN FACT</b>
                {ticket}
              </div>
            )}
            {seatLine && (
              <div className="seat-line" style={{ left: `${seatBox.l + seatBox.w / 2}%`, top: `${seatBox.t - 2}%` }}>
                {seatLine.text}
              </div>
            )}
          </div>
        </div>

        <header className="hud-top">
          <div className="brand">
            <strong>JUNGAOVERSE</strong>
            <span>
              BRIDGE · DECK 01
              <span className="clock">
                {" "}
                · <ShipClock port={site.homePort} />
              </span>
            </span>
          </div>
        </header>

        <p className="pan-hint" aria-hidden="true">
          ← swipe any direction to look around the bridge →
        </p>

        <section className={expanded ? "dialog expanded" : "dialog"} id="junior-chat" aria-label="JUNIOR">
          <div className="dialog-head">
            <strong>JUNIOR</strong>
            <span className="rank">ACTING CAPTAIN · LOG DAY {shipDay}</span>
            <ol className="orders" aria-label="Orders">
              {orders.map((order) => (
                <li key={order.label} className={order.done ? "done" : ""} title={order.label}>
                  <span className="sr-only">
                    {order.label}: {order.done ? "done" : "not yet"}
                  </span>
                </li>
              ))}
            </ol>
            <button type="button" className="expand" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
              {expanded ? "Collapse" : "History"}
            </button>
          </div>
          <div className="transcript" ref={transcriptRef}>
            {messages.map((message) => (
              <div key={message.id} className={`line ${message.role}`}>
                {message.role === "visitor" && <span className="who">YOU ›</span>}
                <p>
                  {message.id === typingId ? (
                    <TypeLine text={message.text} onTick={scrollTranscript} onDone={onLineTyped} />
                  ) : (
                    message.text
                  )}
                </p>
                {message.open && message.id !== typingId && (
                  <button
                    type="button"
                    className="linkish"
                    onClick={() =>
                      message.open === "quarters" && !save.doorUnlocked ? onDoor() : openStation(message.open as StationId)
                    }
                  >
                    {message.open === "quarters" && !save.doorUnlocked
                      ? "▶ Go to the door keypad"
                      : `▶ Open ${site.stations[message.open].title}`}
                  </button>
                )}
              </div>
            ))}
            {pending && (
              <div className="line junior typing" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            )}
          </div>
          <form
            className="chat-row"
            onSubmit={(event) => {
              event.preventDefault();
              void send(draft);
            }}
          >
            {prompts.map((prompt) => (
              <button key={prompt} type="button" className="chip" onClick={() => ask(prompt)}>
                ▶ {prompt}
              </button>
            ))}
            <label className="sr-only" htmlFor="junior-input">
              Message JUNIOR
            </label>
            <input
              id="junior-input"
              value={draft}
              maxLength={500}
              autoComplete="off"
              placeholder="Ask JUNIOR anything…"
              onChange={(event) => setDraft(event.target.value)}
            />
            <button type="submit" className="transmit" disabled={pending || draft.trim() === ""}>
              TRANSMIT
            </button>
          </form>
        </section>

        <nav className="console" aria-label="Bridge stations">
          {consoleOrder.map((id) => (
            <button
              key={id}
              type="button"
              className={save.visited.includes(id) ? "station seen" : "station"}
              onClick={() => openStation(id)}
            >
              <strong>{site.stations[id].label}</strong>
              <small>{site.stations[id].blurb}</small>
            </button>
          ))}
        </nav>
      </div>

      <div className="sr-only" aria-live="polite">
        {latestJunior && latestJunior.id !== typingId ? latestJunior.text : ""}
      </div>

      {countdown !== null && (
        <div className="alarm" role="alert">
          <p>{junior.destruct.alarm}</p>
          <b>{countdown > 0 ? countdown : "0"}</b>
        </div>
      )}

      {introOpen && <Intro onBoard={() => board("bridge")} onTalk={() => board("chat")} />}

      {keypadOpen && (
        <Keypad
          codeGiven={save.codeGiven}
          onUnlock={unlockDoor}
          onAskJunior={askForCode}
          onClose={() => setKeypadOpen(false)}
        />
      )}

      {resumeOpen && (
        <DestructJunior
          onDownload={() => {
            setResumeOpen(false);
            say(junior.destruct.delivered);
          }}
          onClose={() => setResumeOpen(false)}
        />
      )}

      {station && (
        <PanelDialog
          key={station}
          station={station}
          onClose={() => setStation(null)}
          onSneakOut={() => {
            setStation(null);
            say(quarters.junior.sneakOut);
          }}
          onReplayIntro={replayIntro}
          onGuestbookSubmit={() => say(junior.guestbookReply)}
        />
      )}
    </>
  );
}
