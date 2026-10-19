import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createJuniorBrain, type BrainReply, type ChatTurn } from "./brain";
import {
  chairLines,
  coffeeFacts,
  consoleOrder,
  crewChairLines,
  profile,
  recentWork,
  SHIP_DAY,
  stationInfo,
} from "./content";
import { DestructJunior, Intro } from "./Intro";
import { Dossier, PanelDialog } from "./Panels";
import {
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
import {
  loadShip,
  persistShip,
  prefersReducedMotion,
  type ShipSave,
  type StationId,
} from "./ship";
import { useOttawaWeather } from "./useWeather";

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

function shuffle(items: string[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

const TOUR_LINE =
  "Orders complete. You have the embarrassing history and the engine room. If you still need the former captain, send a signal from comms. Wherever he is, it reaches him.";

const PROMPTS = ["What does Jun build?", "Where is Jun?", "What is Jun good at?", "Who are you?"];

const DOOR_LINE = "I have the access code — but you'll have to chat with me for a bit first.";

export function App() {
  const boot = useState(() => loadShip())[0];
  const [save, setSave] = useState<ShipSave>(boot);
  const saveRef = useRef(save);
  const [introOpen, setIntroOpen] = useState(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.has("dossier")) return false;
    if (query.has("replay")) return true;
    return !boot.introDone;
  });
  const [dossierOpen, setDossierOpen] = useState(
    () => new URLSearchParams(window.location.search).has("dossier"),
  );
  const [station, setStation] = useState<StationId | null>(null);
  const [confirmDestruct, setConfirmDestruct] = useState(false);
  const [coverOpen, setCoverOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [ticket, setTicket] = useState<string | null>(null);
  const [seatLine, setSeatLine] = useState<{ text: string; at: "captain" | "left" | "right" } | null>(null);
  const [doorShake, setDoorShake] = useState(false);
  const [alarmKey, setAlarmKey] = useState(0);
  const [asked, setAsked] = useState<string[]>([]);
  const [messages, setMessages] = useState<UiMessage[]>(() => [
    {
      id: "hello",
      role: "junior",
      text: boot.introDone
        ? "You're back. He isn't. Touch anything — except my chair."
        : 'Welcome aboard. Jun said "you fly better than I do," went to the cargo bay for a snack, and never came back. So now I run the ship. Touch anything — except my chair.',
    },
  ]);

  const brain = useRef(createJuniorBrain());
  const sending = useRef(false);
  const factBag = useRef<string[]>([]);
  const chairStep = useRef(0);
  const crewStep = useRef(0);
  const panRef = useRef<HTMLDivElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const ticketTimer = useRef(0);
  const seatTimer = useRef(0);
  const shakeTimer = useRef(0);

  const weather = useOttawaWeather();
  const covered = introOpen || station !== null || dossierOpen || confirmDestruct;
  const visitorTurns = messages.filter((message) => message.role === "visitor").length;
  const orders = [
    { label: "Speak with JUNIOR", done: save.talked },
    { label: "Unlock his old quarters", done: save.doorUnlocked },
    { label: "Inspect the engine room", done: save.visited.includes("engine") },
  ];

  useLayoutEffect(() => {
    const pan = panRef.current;
    if (!pan) return;
    const center = () => {
      pan.scrollLeft = (pan.scrollWidth - pan.clientWidth) / 2;
    };
    center();
    window.addEventListener("resize", center);
    return () => window.removeEventListener("resize", center);
  }, []);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.role !== "junior") return;
    setSpeaking(true);
    const delay = prefersReducedMotion() ? 0 : Math.min(2400, 600 + last.text.length * 10);
    const id = window.setTimeout(() => setSpeaking(false), delay);
    return () => window.clearTimeout(id);
  }, [messages]);

  useEffect(() => {
    const box = transcriptRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [messages, pending, expanded]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (confirmDestruct) {
        setConfirmDestruct(false);
        return;
      }
      if (station) {
        setStation(null);
        return;
      }
      if (dossierOpen) {
        setDossierOpen(false);
        return;
      }
      if (introOpen) board("bridge");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function pushJunior(text: string, open?: StationId) {
    setMessages((current) => [...current, { id: uid(), role: "junior", text, open }]);
  }

  function applySave(patch: (prev: ShipSave) => ShipSave) {
    const prev = saveRef.current;
    let next = patch(prev);
    if (next === prev) return;
    let cheer = false;
    const complete = next.talked && next.doorUnlocked && next.visited.includes("engine");
    if (complete && !next.tourAck) {
      next = { ...next, tourAck: true };
      cheer = true;
    }
    saveRef.current = next;
    persistShip(next);
    setSave(next);
    if (cheer) pushJunior(TOUR_LINE);
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

  function board(dest: "bridge" | "chat" | "dossier") {
    setIntroOpen(false);
    applySave((prev) => ({ ...prev, introDone: true }));
    if (dest === "dossier") setDossierOpen(true);
    if (dest === "chat") window.setTimeout(focusChat, 60);
  }

  async function send(text: string) {
    const trimmed = text.trim().slice(0, 500);
    if (!trimmed || sending.current) return;
    sending.current = true;
    const history: ChatTurn[] = messages.map(({ role, text: prior }) => ({ role, text: prior }));
    const ctx = {
      userTurns: visitorTurns + 1,
      doorUnlocked: saveRef.current.doorUnlocked,
    };
    setMessages((current) => [...current, { id: uid(), role: "visitor", text: trimmed }]);
    setDraft("");
    setPending(true);
    try {
      const reply: BrainReply = await brain.current.reply(trimmed, ctx, history);
      pushJunior(reply.text, reply.open);
      applySave((prev) => ({
        ...prev,
        talked: true,
        doorUnlocked: prev.doorUnlocked || Boolean(reply.grantKey),
      }));
    } catch {
      pushJunior("My uplink coughed. Ask me again — the scripted half of me is still at the helm.");
      applySave((prev) => ({ ...prev, talked: true }));
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
    setMessages((current) => {
      const last = current[current.length - 1];
      if (last?.role === "junior" && last.text === DOOR_LINE) return current;
      return [...current, { id: uid(), role: "junior", text: DOOR_LINE }];
    });
    focusChat();
  }

  function onCoffee() {
    if (factBag.current.length === 0) factBag.current = shuffle(coffeeFacts);
    const fact = factBag.current.pop() ?? coffeeFacts[0];
    setTicket(fact);
    window.clearTimeout(ticketTimer.current);
    ticketTimer.current = window.setTimeout(() => setTicket(null), 7000);
    pushJunior(fact);
  }

  function showSeat(text: string, at: "captain" | "left" | "right") {
    setSeatLine({ text, at });
    window.clearTimeout(seatTimer.current);
    seatTimer.current = window.setTimeout(() => setSeatLine(null), 3200);
    pushJunior(text);
  }

  function onCaptainChair() {
    const line = chairLines[Math.min(chairStep.current, chairLines.length - 1)];
    chairStep.current += 1;
    showSeat(line, "captain");
  }

  function onCrewChair(side: "left" | "right") {
    const line = crewChairLines[crewStep.current % crewChairLines.length];
    crewStep.current += 1;
    showSeat(line, side);
  }

  function pressBoom() {
    setCoverOpen(false);
    setAlarmKey((value) => value + 1);
    setConfirmDestruct(true);
  }

  function resumeDownloaded() {
    setConfirmDestruct(false);
    pushJunior("Résumé delivered. The ship is still in one piece. You're welcome.");
  }

  const sky =
    weather.status === "live"
      ? `Ottawa · ${Math.round(weather.tempC ?? 0)}°C · ${weather.label}`
      : weather.status === "loading"
        ? "Ottawa · reading the sky"
        : "Ottawa · sensors offline";

  const latestJunior = [...messages].reverse().find((message) => message.role === "junior");
  const prompts = PROMPTS.filter((prompt) => !asked.includes(prompt)).slice(0, 2);
  const seen = (id: StationId) => save.visited.includes(id);
  const seatBox =
    seatLine?.at === "left" ? bridgeMap.crewLeft : seatLine?.at === "right" ? bridgeMap.crewRight : bridgeMap.captainChair;

  return (
    <>
      <h1 className="sr-only">{profile.name}, AI engineer — the Jungaoverse</h1>
      <div className="stage" inert={covered ? true : undefined}>
        <div className="pan" ref={panRef}>
          <div className="scene">
            <Starfield />
            <Moon />
            <div className="planet-anchor">
              <Planet />
            </div>
            <button
              type="button"
              className="glass-hit"
              aria-label="Forward window. Open live status."
              onClick={() => openStation("viewport")}
            />
            <img className="bridge-art" src="/art/bridge.png" alt="" draggable={false} />

            <Hotspot
              box={bridgeMap.cargo}
              label="CARGO MANIFEST"
              sub="skills"
              seen={seen("cargo")}
              onClick={() => openStation("cargo")}
            />
            <Hotspot
              box={bridgeMap.recorder}
              label="FLIGHT RECORDER"
              sub="timeline"
              align="end"
              seen={seen("recorder")}
              onClick={() => openStation("recorder")}
            />
            <Hotspot
              box={bridgeMap.quarters}
              label="JUN'S OLD QUARTERS"
              sub={save.doorUnlocked ? "open" : "locked"}
              className={`door ${doorShake ? "shake" : ""} ${save.doorUnlocked ? "unlocked" : "locked"}`}
              seen={save.doorUnlocked}
              ariaLabel={
                save.doorUnlocked
                  ? "Jun's old quarters, unlocked"
                  : "Jun's old quarters, locked. His old note on the door: do not disturb, currently slacking off."
              }
              onClick={onDoor}
            >
              <span className="lamp" aria-hidden="true" />
              <StickyNote />
              {save.doorUnlocked && (
                <span className="stamp" aria-hidden="true">
                  OPEN
                </span>
              )}
            </Hotspot>
            <Hotspot
              box={bridgeMap.engine}
              label="ENGINE ROOM"
              sub="how it's built"
              align="end"
              seen={seen("engine")}
              onClick={() => openStation("engine")}
            />
            <Hotspot
              box={bridgeMap.coffee}
              label="COFFEE"
              className="coffee"
              ariaLabel="Coffee machine. Dispense a fact about Jun."
              onClick={onCoffee}
            >
              <span className="steam" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </Hotspot>
            <Hotspot
              box={bridgeMap.log}
              label="CAPTAIN'S LOG"
              sub="posts"
              tag="bottom"
              seen={seen("log")}
              onClick={() => openStation("log")}
            />
            <Hotspot
              box={bridgeMap.map}
              label="STAR MAP"
              sub="projects"
              tag="bottom"
              align="center"
              seen={seen("map")}
              onClick={() => openStation("map")}
            />
            <Hotspot
              box={bridgeMap.comms}
              label="COMMS"
              sub="signal the former captain"
              tag="bottom"
              align="end"
              seen={seen("comms")}
              onClick={() => openStation("comms")}
            />
            <Hotspot
              box={bridgeMap.captainChair}
              className="chair"
              ariaLabel="Captain's chair"
              onClick={onCaptainChair}
            />
            <Hotspot box={bridgeMap.crewLeft} className="chair" ariaLabel="Crew chair" onClick={() => onCrewChair("left")} />
            <Hotspot
              box={bridgeMap.crewRight}
              className="chair"
              ariaLabel="Crew chair"
              onClick={() => onCrewChair("right")}
            />

            <div className="destruct-table">
              <div className="table-top">
                <DestructSwitch
                  open={coverOpen}
                  onToggle={() => setCoverOpen((open) => !open)}
                  onPress={pressBoom}
                />
              </div>
              <div className="table-front" aria-hidden="true">
                <span className="tag-red">SELF-DESTRUCT</span>
                <span className="warn-note">
                  NEVER TOUCH!!!!!!
                  <small>seriously. — Jun</small>
                </span>
              </div>
              <div className="table-foot" aria-hidden="true" />
            </div>

            <Orb speaking={speaking || pending} onClick={focusChat} />

            {ticket && (
              <div className="ticket">
                <b>COFFEE · FACT</b>
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
              <span className="clock"> · <ShipClock /></span>
            </span>
          </div>
          <button type="button" className="skip" onClick={() => setDossierOpen(true)}>
            Skip the adventure — view résumé →
          </button>
        </header>

        <button type="button" className="live-box" onClick={() => openStation("viewport")}>
          <span className="live-head">
            <i />
            VIEWPORT · LIVE
          </span>
          <strong>{sky}</strong>
          <span>Former captain: {recentWork[0]?.title ?? "slacking off"}</span>
        </button>

        <p className="pan-hint" aria-hidden="true">
          ← swipe to look around the bridge →
        </p>

        <section className={expanded ? "dialog expanded" : "dialog"} id="junior-chat" aria-label="JUNIOR">
          <div className="dialog-head">
            <strong>JUNIOR</strong>
            <span className="rank">
              ACTING CAPTAIN · LOG DAY {SHIP_DAY}
            </span>
            <ol className="orders" aria-label="Orders">
              {orders.map((order) => (
                <li key={order.label} className={order.done ? "done" : ""} title={order.label}>
                  <span className="sr-only">
                    {order.label}: {order.done ? "done" : "not yet"}
                  </span>
                </li>
              ))}
            </ol>
            <button
              type="button"
              className="expand"
              aria-expanded={expanded}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? "Collapse" : "History"}
            </button>
          </div>
          <div className="transcript" ref={transcriptRef}>
            {messages.map((message) => (
              <div key={message.id} className={`line ${message.role}`}>
                {message.role === "visitor" && <span className="who">YOU ›</span>}
                <p>{message.text}</p>
                {message.open && (message.open !== "quarters" || save.doorUnlocked) && (
                  <button type="button" className="linkish" onClick={() => openStation(message.open as StationId)}>
                    ▶ Open {stationInfo[message.open].title}
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
              className={seen(id) ? "station seen" : "station"}
              onClick={() => openStation(id)}
            >
              <strong>{stationInfo[id].short}</strong>
              <small>{stationInfo[id].plain}</small>
            </button>
          ))}
        </nav>
      </div>

      <div className="sr-only" aria-live="polite">
        {latestJunior?.text}
      </div>

      {alarmKey > 0 && <div key={alarmKey} className="alarm" />}

      {introOpen && <Intro onBoard={() => board("bridge")} onTalk={() => board("chat")} onDossier={() => board("dossier")} />}
      {station && (
        <PanelDialog
          key={station}
          station={station}
          weather={weather}
          onClose={() => setStation(null)}
          onReplay={() => {
            setStation(null);
            setIntroOpen(true);
          }}
        />
      )}
      {dossierOpen && <Dossier onClose={() => setDossierOpen(false)} />}
      {confirmDestruct && (
        <DestructJunior onDownload={resumeDownloaded} onClose={() => setConfirmDestruct(false)} />
      )}
    </>
  );
}
