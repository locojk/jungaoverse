import { useEffect, useRef, useState } from "react";
import {
  commsAside,
  crates,
  engineering,
  logs,
  profile,
  projects,
  recentWork,
  route,
  stationInfo,
  statusLabel,
  type Project,
  type ProjectStatus,
} from "./content";
import { LLM_SKETCH } from "./brain";
import type { StationId } from "./ship";
import type { WeatherState } from "./useWeather";

function StatusPill({ status }: { status: ProjectStatus }) {
  return <span className={`pill status-${status}`}>{statusLabel[status]}</span>;
}

export function PanelDialog({
  station,
  weather,
  onClose,
  onReplay,
}: {
  station: StationId;
  weather: WeatherState;
  onClose: () => void;
  onReplay: () => void;
}) {
  const info = stationInfo[station];
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
      <div className="sheet" onClick={(event) => event.stopPropagation()}>
        <header className="sheet-head">
          <div>
            <p className="eyebrow">{info.plain}</p>
            <h2 id="panel-title">{info.title}</h2>
          </div>
          <button type="button" className="close" ref={closeRef} onClick={onClose}>
            Close
          </button>
        </header>
        <div className="sheet-body">
          {station === "log" && <LogPanel onReplay={onReplay} />}
          {station === "map" && <MapPanel />}
          {station === "cargo" && <CargoPanel />}
          {station === "recorder" && <RoutePanel />}
          {station === "comms" && <CommsPanel />}
          {station === "engine" && <EnginePanel />}
          {station === "viewport" && <ViewportPanel weather={weather} />}
          {station === "quarters" && <QuartersPanel />}
        </div>
      </div>
    </div>
  );
}

function LogPanel({ onReplay }: { onReplay: () => void }) {
  return (
    <div className="stack">
      <p className="note-line">The first entry is the ship's own story. Later entries are sample plates.</p>
      {logs.map((entry) => (
        <article key={entry.id} className="entry">
          <p className="eyebrow">
            Stardate {entry.stardate}
            {entry.sample ? " · Sample" : ""}
          </p>
          <h3>{entry.title}</h3>
          <p className="preserve">{entry.body}</p>
        </article>
      ))}
      <button type="button" className="quiet" onClick={onReplay}>
        Replay JUNIOR's introduction
      </button>
    </div>
  );
}

function MapPanel() {
  const [selected, setSelected] = useState(projects[0].id);
  const world = projects.find((project) => project.id === selected) ?? projects[0];
  return (
    <div className="stack">
      <p className="note-line">
        Landed is finished. Exploring is in progress. Planned Route has not left the dock. These worlds are sample plates.
      </p>
      <StarChart selected={world} onSelect={setSelected} />
      <div className="choice-row" role="list">
        {projects.map((project) => (
          <button
            key={project.id}
            type="button"
            className={project.id === world.id ? "choice on" : "choice"}
            onClick={() => setSelected(project.id)}
          >
            <strong>{project.name}</strong>
            <StatusPill status={project.status} />
          </button>
        ))}
      </div>
      <article className="entry">
        <p className="eyebrow">
          {world.code} · {world.name}
        </p>
        <h3>
          {world.name} <StatusPill status={world.status} />
        </h3>
        <p>{world.summary}</p>
        <p className="tags">{world.tags.join(" · ")}</p>
      </article>
    </div>
  );
}

function StarChart({ selected, onSelect }: { selected: Project; onSelect: (id: string) => void }) {
  const orbits: Record<Project["orbit"], [number, number]> = {
    1: [148, 78],
    2: [228, 118],
    3: [308, 158],
  };
  return (
    <svg className="star-chart" viewBox="0 0 720 400" role="img" aria-label="Star map of sample projects">
      <ellipse cx="360" cy="200" rx="148" ry="78" className="orbit" />
      <ellipse cx="360" cy="200" rx="228" ry="118" className="orbit" />
      <ellipse cx="360" cy="200" rx="308" ry="158" className="orbit" />
      <circle cx="360" cy="200" r="11" fill="#f4e3a4" />
      <text x="360" y="228" textAnchor="middle" className="chart-label">
        RIM
      </text>
      {projects.map((project) => {
        const [rx, ry] = orbits[project.orbit];
        const angle = (project.angle * Math.PI) / 180;
        const x = 360 + rx * Math.cos(angle);
        const y = 200 + ry * Math.sin(angle);
        const active = project.id === selected.id;
        return (
          <g key={project.id} className={`world world-${project.status}`} onClick={() => onSelect(project.id)}>
            {active && <circle cx={x} cy={y} r="18" className="world-ring" />}
            <circle cx={x} cy={y} r="9" />
            <text x={x} y={y + 24} textAnchor="middle">
              {project.code}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function CargoPanel() {
  return (
    <div className="stack">
      <p className="note-line">An illustrative manifest. Swap the crates for the real stack before launch.</p>
      <div className="table-wrap">
        <table>
          <caption className="sr-only">Skills and tools, styled as cargo</caption>
          <thead>
            <tr>
              <th>Crate</th>
              <th>Qty</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {crates.map((crate) => (
              <tr key={crate.name}>
                <td>{crate.name}</td>
                <td>{crate.qty}</td>
                <td>
                  <span className={`cargo-status tone-${crate.tone}`}>
                    <i />
                    {crate.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RoutePanel() {
  return (
    <div className="stack">
      <p className="note-line">The ship's route. Ports below are sample berths, except the current one: Ottawa.</p>
      <ol className="route">
        {route.map((stop) => (
          <li key={stop.id}>
            <span className="port" aria-hidden="true" />
            <div>
              <p className="eyebrow">
                {stop.kind} · {stop.years}
              </p>
              <h3>{stop.place}</h3>
              <p>{stop.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function CommsPanel() {
  return (
    <div className="stack">
      <a className="signal" href={`mailto:${profile.email}?subject=${encodeURIComponent("Signal from the Jungaoverse")}`}>
        Send a Signal to the Former Captain
      </a>
      <blockquote className="junior-says">
        {commsAside}
        <footer>JUNIOR</footer>
      </blockquote>
      <ul className="channels">
        <li>
          <span>Email</span>
          <a href={`mailto:${profile.email}`}>{profile.email}</a>
        </li>
        <li>
          <span>LinkedIn</span>
          {profile.linkedinUrl ? (
            <a href={profile.linkedinUrl} rel="noreferrer">
              Open channel
            </a>
          ) : (
            <em>Not filed yet</em>
          )}
        </li>
        <li>
          <span>GitHub</span>
          {profile.githubUrl ? (
            <a href={profile.githubUrl} rel="noreferrer">
              Open channel
            </a>
          ) : (
            <em>Not filed yet</em>
          )}
        </li>
      </ul>
      <p className="note-line">Placeholder channels. File the real ones in the ship's content record before launch.</p>
    </div>
  );
}

function EnginePanel() {
  return (
    <div className="stack">
      <p>
        This deck is the straight version. The bridge is a personal site for {profile.name}, {profile.role}, in{" "}
        {profile.location}. The fiction is the interface. The engineering is ordinary on purpose: a static client, one
        content record, and a captain you can replace without repainting the ship.
      </p>
      <div className="arch" aria-label="Architecture">
        <div className="arch-row">
          <div className="node">Visitor</div>
          <span className="arrow" aria-hidden="true">
            →
          </span>
          <div className="node">Bridge UI</div>
          <span className="arrow" aria-hidden="true">
            →
          </span>
          <div className="node">content.ts</div>
        </div>
        <div className="arch-row">
          <div className="node accent">JUNIOR brain</div>
          <span className="arrow" aria-hidden="true">
            →
          </span>
          <div className="node">Scripted brain</div>
          <span className="arrow" aria-hidden="true">
            →
          </span>
          <div className="node dim">LLM uplink, staged</div>
        </div>
        <div className="arch-row">
          <div className="node">Viewport</div>
          <span className="arrow" aria-hidden="true">
            →
          </span>
          <div className="node">Open-Meteo · Ottawa</div>
        </div>
      </div>
      <h3>Decisions</h3>
      <div className="stack tight">
        {engineering.decisions.map((decision) => (
          <article key={decision.title} className="entry">
            <h3>{decision.title}</h3>
            <p>{decision.body}</p>
          </article>
        ))}
      </div>
      <h3>What is actually running</h3>
      <ul className="pills">
        {engineering.stack.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p>
        No model is called at runtime. The personality is scripted so the ship works offline and stays in character.
        The scripted captain knows the shape of the ship, not the contents of every crate — he points, he does not
        recite a biography that has not been written. To connect a model, keep the UI and replace{" "}
        <code>createJuniorBrain()</code>.
      </p>
      <pre>
        <code>{LLM_SKETCH}</code>
      </pre>
      <p className="note-line">
        Local run: npm install, then npm run dev. Edit src/content.ts. Replace public/resume.pdf.
      </p>
    </div>
  );
}

function ViewportPanel({ weather }: { weather: WeatherState }) {
  return (
    <div className="stack">
      <div className="wx">
        {weather.status === "live" ? (
          <>
            <p className="temp">{Math.round(weather.tempC ?? 0)}°</p>
            <div>
              <h3>{weather.label}</h3>
              <p>
                Wind {weather.windKmh === undefined ? "—" : Math.round(weather.windKmh)} km/h · Ottawa, Earth
              </p>
            </div>
          </>
        ) : weather.status === "loading" ? (
          <p>Reading the Ottawa sky…</p>
        ) : (
          <div>
            <h3>Sensors offline</h3>
            <p>The viewport could not reach Open-Meteo. The rest of the ship is fine.</p>
          </div>
        )}
      </div>
      <h3>Recent work</h3>
      <div className="stack tight">
        {recentWork.map((item) => (
          <article key={item.title} className="entry">
            <h3>{item.title}</h3>
            <p>{item.detail}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function QuartersPanel() {
  return (
    <div className="quarters">
      <div className="hammock" aria-hidden="true">
        <span className="rope left" />
        <span className="rope right" />
        <span className="sling" />
        <span className="pillow" />
      </div>
      <p className="eyebrow">Personal</p>
      <h3>The door was the hard part.</h3>
      <p>The hammock is still here. Jun is not — he never came back from the snack run. His personal page has not been filed yet.</p>
      <div className="empty-slot">Personal content — not yet aboard.</div>
    </div>
  );
}

export function Dossier({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      previous?.focus?.();
    };
  }, []);

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="dossier-title" onClick={onClose}>
      <article className="dossier-sheet" onClick={(event) => event.stopPropagation()}>
        <p className="stamp-line">Declassified dossier</p>
        <div className="identity">
          <p className="eyebrow">
            {profile.role} · {profile.location}
          </p>
          <h2 id="dossier-title">{profile.name}</h2>
          <p>{profile.domain}</p>
        </div>
        <p className="sample-banner">
          Sample record. Posts, projects, skills, and the route are plates waiting for the real filing. The hammock
          story is the ship's fiction. The career is not invented to fill the gap.
        </p>
        <div className="paper-actions">
          <button type="button" className="paper-btn" onClick={onClose}>
            Return to the bridge
          </button>
          <a className="paper-btn ghost" href="/resume.pdf" download="Jun-Gao-Resume.pdf">
            Download résumé
          </a>
          <a className="paper-btn ghost" href={`mailto:${profile.email}`}>
            {profile.email}
          </a>
        </div>

        <h3>Summary</h3>
        <p>{profile.summary}</p>

        <h3>Projects</h3>
        {projects.map((project) => (
          <div key={project.id} className="doc-row">
            <div>
              <strong>{project.name}</strong>
              <p>{project.summary}</p>
            </div>
            <StatusPill status={project.status} />
          </div>
        ))}

        <h3>Experience</h3>
        {route.map((stop) => (
          <div key={stop.id} className="doc-row">
            <div>
              <strong>{stop.place}</strong>
              <p>{stop.detail}</p>
            </div>
            <span>{stop.years}</span>
          </div>
        ))}

        <h3>Skills</h3>
        <ul className="plain-list">
          {crates.map((crate) => (
            <li key={crate.name}>
              {crate.name} {crate.qty} — {crate.status}
            </li>
          ))}
        </ul>

        <h3>Writing</h3>
        {logs.map((entry) => (
          <div key={entry.id} className="doc-row">
            <div>
              <strong>{entry.title}</strong>
              <p>Stardate {entry.stardate}</p>
            </div>
          </div>
        ))}

        <h3>Contact</h3>
        <ul className="plain-list">
          <li>
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
          </li>
          <li>LinkedIn — {profile.linkedinUrl || "not filed yet"}</li>
          <li>GitHub — {profile.githubUrl || "not filed yet"}</li>
        </ul>
        <p className="aside">{commsAside}</p>
      </article>
    </div>
  );
}
