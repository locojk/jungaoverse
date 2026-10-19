import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  blackbox,
  fill,
  guestbook,
  hoard,
  junior,
  lab,
  logs,
  planets,
  quarters,
  radio,
  site,
  story,
  viewport,
  type Planet,
} from "./content";
import type { StationId } from "./ship";

export function PanelDialog({
  station,
  onClose,
  onSneakOut,
  onReplayIntro,
  onGuestbookSubmit,
}: {
  station: StationId;
  onClose: () => void;
  onSneakOut: () => void;
  onReplayIntro: () => void;
  onGuestbookSubmit: () => void;
}) {
  const sneaky = station === "quarters";
  const info = site.stations[station];
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      previous?.focus?.();
    };
  }, []);

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="panel-title" onClick={onClose}>
      <div className={`sheet sheet-${station}`} onClick={(event) => event.stopPropagation()}>
        <header className="sheet-head">
          <div>
            <p className="eyebrow">{info.blurb}</p>
            <h2 id="panel-title">{info.title}</h2>
          </div>
          <button type="button" className="close" ref={closeRef} onClick={sneaky ? onSneakOut : onClose}>
            {sneaky ? "Sneak out" : "Close"}
          </button>
        </header>
        <div className="sheet-body">
          {station === "quarters" && <QuartersPanel onSneakOut={onSneakOut} />}
          {station === "log" && <LogPanel onReplayIntro={onReplayIntro} />}
          {station === "hoard" && <HoardPanel />}
          {station === "galaxy" && <GalaxyPanel />}
          {station === "blackbox" && <BlackBoxPanel />}
          {station === "guestbook" && <GuestbookPanel onSubmit={onGuestbookSubmit} />}
          {station === "lab" && <LabPanel />}
          {station === "story" && <StoryPanel />}
          {station === "radio" && <RadioPanel />}
          {station === "viewport" && <ViewportPanel />}
        </div>
      </div>
    </div>
  );
}

function QuartersPanel({ onSneakOut }: { onSneakOut: () => void }) {
  const [line, setLine] = useState({ id: 0, text: fill(quarters.junior.idle) });
  const comment = (text: string) => setLine((current) => ({ id: current.id + 1, text }));

  return (
    <div className="quarters">
      <div className="q-hammock">
        <button type="button" className="hammock" onClick={() => comment(fill(quarters.junior.hammock))}>
          <span className="sr-only">Inspect the hammock</span>
          <span className="hammock-swing" aria-hidden="true">
            <span className="rope left" />
            <span className="rope right" />
            <span className="sling">
              <span className="dent" />
            </span>
          </span>
          <span className="snack" aria-hidden="true" />
          <span className="floor" aria-hidden="true" />
        </button>
      </div>

      <MissingPoster />

      <div className="q-signoff door-inside">
        <p className="handwritten">{quarters.signoff}</p>
        <button type="button" className="transmit" onClick={onSneakOut}>
          Sneak out
        </button>
      </div>

      <p className="q-junior" role="status" aria-live="polite">
        <span>JUNIOR</span>
        <q key={line.id}>{line.text}</q>
      </p>
    </div>
  );
}

function MissingPoster() {
  const { poster } = quarters;
  return (
    <section className="q-poster poster" aria-labelledby="missing-title">
      <span className="tape" aria-hidden="true" />
      <span className="rainbow-patch" title="Crew insignia" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </span>
      <h3 id="missing-title">{poster.header}</h3>
      <figure className="mugshot">
        {poster.photo ? <img src={poster.photo} alt="Jun" /> : <Doodle />}
        <figcaption>{poster.photoCaption}</figcaption>
      </figure>
      <dl className="poster-fields">
        {poster.fields.map((field) => (
          <div key={field.label}>
            <dt>{field.label}</dt>
            <dd>{field.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Doodle() {
  return (
    <svg className="doodle" viewBox="0 0 120 120" role="img" aria-label="Doodle of a stick figure with a question mark">
      <path d="M58 22c-17 1-27 14-25 29 2 14 14 22 27 21 15-1 25-12 24-27-1-14-12-24-26-23z" />
      <path d="M50 44l1 3M66 43l0 4M51 58c5 3 10 3 15-1" />
      <path d="M59 72l1 22M60 80l-15 9M60 80l16 7M60 94l-11 18M60 94l13 17" />
      <path d="M92 18c3-6 13-6 14 1 1 6-7 7-8 14M98 42v1" className="qmark" />
    </svg>
  );
}

function LogPanel({ onReplayIntro }: { onReplayIntro: () => void }) {
  return (
    <div className="stack">
      {logs.map((entry) => (
        <article key={`${entry.stardate}-${entry.title}`} className="entry">
          <p className="eyebrow">Stardate {entry.stardate}</p>
          <h3>{entry.title}</h3>
          <p className="preserve">{entry.body}</p>
        </article>
      ))}
      <button type="button" className="quiet" onClick={onReplayIntro}>
        Replay JUNIOR's introduction
      </button>
    </div>
  );
}

function HoardPanel() {
  return (
    <div className="crates">
      {hoard.map((shelf) => (
        <section key={shelf.id} className={`crate crate-${shelf.id}`}>
          <p className="crate-label">{shelf.title}</p>
          <ul>
            {shelf.items.map((item) => (
              <li key={item.name}>
                <strong>{item.name}</strong>
                <span>{item.note}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function GalaxyPanel() {
  const [selected, setSelected] = useState(planets[0]?.id ?? "");
  const world = planets.find((planet) => planet.id === selected) ?? planets[0];
  if (!world) return <p className="note-line">No planets charted yet.</p>;
  return (
    <div className="stack">
      <StarChart selected={world} onSelect={setSelected} />
      <div className="choice-row">
        {planets.map((planet) => (
          <button
            key={planet.id}
            type="button"
            className={planet.id === world.id ? "choice on" : "choice"}
            onClick={() => setSelected(planet.id)}
          >
            <i className="dot" style={{ background: planet.color }} />
            {planet.name}
          </button>
        ))}
      </div>
      <article className="entry">
        <p className="eyebrow">{world.kind}</p>
        <h3>{world.name}</h3>
        <p>{world.text}</p>
        {world.photos.length > 0 && (
          <div className="photos">
            {world.photos.map((src, index) =>
              src ? (
                <img key={src} src={src} alt={`${world.name}, photo ${index + 1}`} loading="lazy" />
              ) : (
                <div key={index} className="photo-slot">
                  photo
                </div>
              ),
            )}
          </div>
        )}
      </article>
    </div>
  );
}

function StarChart({ selected, onSelect }: { selected: Planet; onSelect: (id: string) => void }) {
  const orbits: Record<Planet["orbit"], [number, number]> = {
    1: [148, 78],
    2: [228, 118],
    3: [308, 158],
  };
  return (
    <svg className="star-chart" viewBox="0 0 720 400" role="img" aria-label="Map of Jun's interests as planets">
      {Object.values(orbits).map(([rx, ry]) => (
        <ellipse key={rx} cx="360" cy="200" rx={rx} ry={ry} className="orbit" />
      ))}
      <circle cx="360" cy="200" r="13" fill="#ffd27a" />
      <text x="360" y="232" textAnchor="middle">
        JUN
      </text>
      {planets.map((planet) => {
        const [rx, ry] = orbits[planet.orbit];
        const angle = (planet.angle * Math.PI) / 180;
        const x = 360 + rx * Math.cos(angle);
        const y = 200 + ry * Math.sin(angle);
        const active = planet.id === selected.id;
        return (
          <g key={planet.id} className="world" onClick={() => onSelect(planet.id)}>
            {active && <circle cx={x} cy={y} r="20" className="world-ring" />}
            <circle cx={x} cy={y} r="11" fill={planet.color} />
            <text x={x} y={y + 28} textAnchor="middle">
              {planet.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function BlackBoxPanel() {
  return (
    <div className="stack blackbox">
      <p className="note-line">Flight data recorder. Contents may be embarrassing.</p>
      <h3>Incidents</h3>
      {blackbox.moments.map((moment) => (
        <article key={moment.title} className="entry">
          <strong>{moment.title}</strong>
          <p>{moment.text}</p>
        </article>
      ))}
      <h3>Most ridiculous things Jun has said</h3>
      {blackbox.ridiculous.map((item) => (
        <blockquote key={item.quote} className="recording">
          <p>{item.quote}</p>
          <footer>{item.context}</footer>
        </blockquote>
      ))}
      <h3>Quotes</h3>
      {blackbox.quotes.map((item) => (
        <blockquote key={item.quote} className="recording">
          <p>{item.quote}</p>
          <footer>— {item.by}</footer>
        </blockquote>
      ))}
    </div>
  );
}

function GuestbookPanel({ onSubmit }: { onSubmit: () => void }) {
  const [sent, setSent] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
    onSubmit();
  }

  return (
    <div className="stack guestbook">
      <ul className="messages">
        {guestbook.map((entry) => (
          <li key={`${entry.name}-${entry.date}`}>
            <p className="eyebrow">
              {entry.name} · {entry.date}
            </p>
            <p>{entry.message}</p>
          </li>
        ))}
      </ul>
      <form className="sign" onSubmit={submit}>
        <h3>Leave a message</h3>
        <label>
          <span>Name</span>
          <input name="name" maxLength={40} autoComplete="off" placeholder="Space traveler" />
        </label>
        <label>
          <span>Message</span>
          <textarea name="message" maxLength={280} rows={3} placeholder="Say hi to the crew…" />
        </label>
        <button type="submit" className="transmit">
          Transmit
        </button>
        {sent && (
          <blockquote className="junior-says" role="status">
            {junior.guestbookReply}
            <footer>JUNIOR</footer>
          </blockquote>
        )}
      </form>
    </div>
  );
}

function LabPanel() {
  return (
    <div className="lab-grid">
      {lab.map((item) => (
        <article key={item.name} className={item.status === "Exploded" ? "lab-item exploded" : "lab-item"}>
          <span className={`lab-tag tag-${item.status.toLowerCase().replace(/\s+/g, "-")}`}>{item.status}</span>
          <h3>{item.name}</h3>
          <p>{item.text}</p>
          {item.link && (
            <a href={item.link} target="_blank" rel="noreferrer">
              Try it →
            </a>
          )}
        </article>
      ))}
    </div>
  );
}

function StoryPanel() {
  const [nodeId, setNodeId] = useState(story.start);
  const node = story.nodes[nodeId] ?? story.nodes[story.start];
  return (
    <div className="stack story">
      <p className="eyebrow">{story.title}</p>
      <p className="story-text">{node.text}</p>
      <div className="story-choices">
        {node.choices.map((choice) => (
          <button key={choice.label} type="button" className="chip" onClick={() => setNodeId(choice.to)}>
            ▶ {choice.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function RadioPanel() {
  return (
    <div className="radio">
      <div className="eq" aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => (
          <i key={index} style={{ animationDelay: `${(index * 137) % 900}ms` }} />
        ))}
      </div>
      <p className="eyebrow">Now playing · on repeat</p>
      <h3>{radio.title}</h3>
      <p className="artist">{radio.artist}</p>
      <p className="note-line">Played {radio.plays} times this week. JUNIOR has stopped counting. JUNIOR has not stopped counting.</p>
      <p>{radio.note}</p>
      {radio.link && (
        <a href={radio.link} target="_blank" rel="noreferrer">
          Listen →
        </a>
      )}
    </div>
  );
}

function ViewportPanel() {
  const rows = [
    ["Weather", viewport.weather],
    ["Jun is", viewport.upTo],
    ["Mood", viewport.mood],
    ["Listening", viewport.listening],
  ];
  return (
    <div className="stack">
      <p className="eyebrow">Home port · {site.homePort}</p>
      <dl className="status-grid">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
