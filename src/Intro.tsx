import { useEffect, useRef, useState } from "react";
import { fill, junior } from "./content";
import { downloadResume, prefersReducedMotion } from "./ship";

const juniorIntro = junior.intro.map((line) => fill(line));

function useTypewriter(text: string, skip: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (skip || prefersReducedMotion()) {
      setCount(text.length);
      return;
    }
    setCount(0);
    const id = window.setInterval(() => {
      setCount((current) => {
        if (current >= text.length) {
          window.clearInterval(id);
          return current;
        }
        return current + 1;
      });
    }, 28);
    return () => window.clearInterval(id);
  }, [text, skip]);
  return { shown: text.slice(0, count), done: count >= text.length };
}

const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;

const MALE = /\b(Andrew|Brian|Guy|Ryan|Christopher|Eric|Davis|Roger|Steffan|Thomas|Daniel|Evan|Nathan|Tom|Aaron|Arthur|Oliver|Rishi|Gordon|Lee|Male)\b/i;
const NATURAL = /Natural|Neural|Online|Premium|Enhanced/i;
/** macOS novelty voices and the old robotic ones. "Junior" is one of them, sadly. */
const NOVELTY = /\b(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Deranged|Fred|Good News|Hysterical|Jester|Junior|Organ|Pipe Organ|Ralph|Superstar|Trinoids|Whisper|Wobble|Zarvox|Grandpa|Grandma|Eddy|Reed|Rocko|Sandy|Shelley|Flo)\b/i;

function scoreVoice(voice: SpeechSynthesisVoice) {
  if (!voice.lang.toLowerCase().startsWith("en") || NOVELTY.test(voice.name)) return -1;
  let score = 0;
  if (MALE.test(voice.name)) score += 10;
  if (NATURAL.test(voice.name)) score += 6;
  if (/Google UK English Male/i.test(voice.name)) score += 4;
  if (/en-(GB|US)/i.test(voice.lang)) score += 1;
  return score;
}

function pickVoice() {
  let best: SpeechSynthesisVoice | null = null;
  let bestScore = -1;
  for (const voice of window.speechSynthesis.getVoices()) {
    const score = scoreVoice(voice);
    if (score > bestScore) [best, bestScore] = [voice, score];
  }
  return best;
}

/** Browsers load voices lazily; the list is empty until `voiceschanged` fires. */
const voicesReady: Promise<void> = !canSpeak
  ? Promise.resolve()
  : new Promise((resolve) => {
      if (window.speechSynthesis.getVoices().length > 0) return resolve();
      window.speechSynthesis.addEventListener("voiceschanged", () => resolve(), { once: true });
      window.setTimeout(resolve, 1500);
    });

function speak(text: string, onEnd: () => void) {
  const synth = window.speechSynthesis;
  synth.cancel();
  let cancelled = false;
  void voicesReady.then(() => {
    if (cancelled) return;
    const utterance = new SpeechSynthesisUtterance(text.replace(/\s*—\s*/g, ", "));
    const voice = pickVoice();
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
    synth.speak(utterance);
  });
  return () => {
    cancelled = true;
  };
}

/** Siri-style layered sine waves; amplitude eases toward `active`. */
function VoiceWave({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduced = prefersReducedMotion();
    const waves = [
      { color: "rgba(77, 123, 255, 0.9)", freq: 1.6, speed: 0.045, amp: 1 },
      { color: "rgba(255, 79, 216, 0.85)", freq: 2.3, speed: -0.06, amp: 0.8 },
      { color: "rgba(43, 255, 180, 0.8)", freq: 3.1, speed: 0.075, amp: 0.6 },
      { color: "rgba(255, 255, 255, 0.9)", freq: 2, speed: 0.05, amp: 0.45 },
    ];
    let level = 0.1;
    let phase = 0;
    let frame = 0;

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== Math.floor(width * dpr)) {
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const target = activeRef.current ? 1 : 0.08;
      level += (target - level) * 0.08;
      phase += 1;
      const mid = height / 2;
      ctx.globalCompositeOperation = "lighter";
      for (const wave of waves) {
        ctx.beginPath();
        for (let x = 0; x <= width; x += 2) {
          const t = x / width;
          const envelope = Math.pow(Math.sin(Math.PI * t), 2.2);
          const jitter = activeRef.current ? 0.75 + 0.25 * Math.sin(phase * 0.13 + wave.freq) : 1;
          const y =
            mid +
            Math.sin(t * Math.PI * 2 * wave.freq + phase * wave.speed) * envelope * mid * 0.85 * level * wave.amp * jitter;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = wave.color;
        ctx.lineWidth = 2;
        ctx.shadowColor = wave.color;
        ctx.shadowBlur = 8;
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
      if (!reduced) frame = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(frame);
  }, []);

  return <canvas ref={ref} className="voice-wave" aria-hidden="true" />;
}

function TalkingOrb({ talking }: { talking: boolean }) {
  return (
    <>
      <div className={talking ? "intro-orb speaking" : "intro-orb"} aria-hidden="true">
        <span className="orb-core">
          <i className="swirl s1" />
          <i className="swirl s2" />
          <i className="shine" />
        </span>
      </div>
      <VoiceWave active={talking} />
      <p className="intro-name">
        JUNIOR <span>· acting captain</span>
      </p>
    </>
  );
}

export function DestructJunior({ onDownload, onClose }: { onDownload: () => void; onClose: () => void }) {
  const typed = useTypewriter(junior.destruct.redirect, false);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      previous?.focus?.();
    };
  }, []);

  function download() {
    downloadResume();
    onDownload();
  }

  return (
    <div
      className="overlay intro-overlay destruct-overlay"
      role="alertdialog"
      aria-modal="true"
      aria-label="JUNIOR explains the self-destruct button"
      onClick={onClose}
    >
      <div className="junior-intro" onClick={(event) => event.stopPropagation()}>
        <p className="destruct-alert" aria-hidden="true">
          ⚠ SELF-DESTRUCT ARMED ⚠
        </p>
        <TalkingOrb talking={!typed.done} />
        <p className="caption" aria-live="polite">
          {typed.shown}
          {!typed.done && <i className="caret" aria-hidden="true" />}
        </p>
        <div className="intro-actions">
          <button type="button" className="download-resume" onClick={download} autoFocus>
            ⬇ Download résumé
          </button>
          <button type="button" className="chip" onClick={onClose}>
            Back to the bridge
          </button>
        </div>
      </div>
    </div>
  );
}

export function Intro({ onBoard, onTalk }: { onBoard: () => void; onTalk: () => void }) {
  const [index, setIndex] = useState(0);
  const [skip, setSkip] = useState(false);
  const [done, setDone] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [voicing, setVoicing] = useState(false);
  const line = juniorIntro[index];
  const typed = useTypewriter(line, skip || done);
  const talking = !done && (!typed.done || voicing);

  useEffect(() => {
    if (!voiceOn || done || !canSpeak) return;
    setVoicing(true);
    return speak(line, () => setVoicing(false));
  }, [voiceOn, line, done]);

  useEffect(
    () => () => {
      if (canSpeak) window.speechSynthesis.cancel();
    },
    [],
  );

  function next() {
    if (!typed.done) {
      setSkip(true);
      return;
    }
    if (index < juniorIntro.length - 1) {
      setSkip(false);
      setIndex((current) => current + 1);
      return;
    }
    finish();
  }

  function finish() {
    if (canSpeak) window.speechSynthesis.cancel();
    setVoicing(false);
    setDone(true);
  }

  function toggleVoice() {
    if (voiceOn && canSpeak) window.speechSynthesis.cancel();
    setVoicing(false);
    setVoiceOn((value) => !value);
  }

  return (
    <div className="overlay intro-overlay" role="dialog" aria-modal="true" aria-label="JUNIOR introduces himself">
      <div className="junior-intro">
        <TalkingOrb talking={talking} />

        {done ? (
          <>
            <p className="caption" aria-live="polite">
              Pick a heading.
            </p>
            <div className="intro-choices">
              <button type="button" className="intro-choice" onClick={onBoard}>
                <strong>Walk the bridge</strong>
                <small>Touch anything. Except my chair.</small>
              </button>
              <button type="button" className="intro-choice" onClick={onTalk}>
                <strong>Talk to me</strong>
                <small>I have the access code.</small>
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="caption" aria-live="polite" onClick={next}>
              {typed.shown}
              {!typed.done && <i className="caret" aria-hidden="true" />}
            </p>
            <div className="intro-dots" aria-hidden="true">
              {juniorIntro.map((_, dot) => (
                <i key={dot} className={dot <= index ? "on" : ""} />
              ))}
            </div>
            <div className="intro-actions">
              <button type="button" className="transmit" onClick={next}>
                {!typed.done ? "Finish the line" : index === juniorIntro.length - 1 ? "Let's go" : "Continue"}
              </button>
              {canSpeak && (
                <button type="button" className="chip" aria-pressed={voiceOn} onClick={toggleVoice}>
                  {voiceOn ? "Voice on" : "Hear his voice"}
                </button>
              )}
              <button type="button" className="chip" onClick={finish}>
                Skip intro
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
