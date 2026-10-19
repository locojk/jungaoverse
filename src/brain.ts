import { commsAside, profile, SHIP_DAY } from "./content";
import type { StationId } from "./ship";

export interface ChatTurn {
  role: "visitor" | "junior";
  text: string;
}

export interface BrainContext {
  /** Count of visitor messages, including the one being answered. */
  userTurns: number;
  doorUnlocked: boolean;
}

export interface BrainReply {
  text: string;
  grantKey?: boolean;
  open?: StationId;
}

/**
 * JUNIOR's mouth. The bridge awaits `reply` and renders the result.
 * Replace the object returned by `createJuniorBrain` with a résumé-aware
 * model later. Give that model `src/content.ts` and the résumé, and tell it
 * the roast is fiction but employers, dates, and metrics are not to be invented.
 */
export interface JuniorBrain {
  reply(input: string, ctx: BrainContext, history: ChatTurn[]): Promise<BrainReply>;
}

export const LLM_SKETCH = `class ResumeAwareBrain implements JuniorBrain {
  async reply(input, ctx, history) {
    const res = await fetch("/api/junior", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, ctx, history }),
    });
    if (!res.ok) throw new Error("JUNIOR uplink failed");
    return res.json(); // { text, grantKey?, open? }
  }
}`;

const KEY_LINE = `You've talked to me long enough. Access code: HAMMOCK. His old quarters are unlocked. The note on the door is about ${SHIP_DAY} days out of date.`;

function norm(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function has(text: string, phrases: string[]) {
  return phrases.some((phrase) => text.includes(phrase));
}

function pick(seed: string, options: string[]) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return options[hash % options.length];
}

function withKey(reply: BrainReply, ctx: BrainContext): BrainReply {
  if (reply.grantKey || ctx.doorUnlocked || ctx.userTurns < 2) return reply;
  return {
    ...reply,
    grantKey: true,
    text: `${reply.text}\n\n${KEY_LINE}`,
  };
}

function match(raw: string, ctx: BrainContext, history: ChatTurn[]): BrainReply {
  const text = norm(raw);

  if (text === "hammock" && !ctx.doorUnlocked) {
    return {
      grantKey: true,
      open: "quarters",
      text: "You guessed HAMMOCK. I respect a good guess almost as much as I resent it. The door is open.",
    };
  }

  if (/你好|您好/.test(raw)) {
    return {
      text: "Welcome aboard. 欢迎登船. I am JUNIOR, and I have the helm. Ask me what Jun is good at, or pick a station.",
    };
  }
  if (/你是谁|你叫什么/.test(raw)) {
    return identity();
  }
  if (/擅长|厉害/.test(raw)) {
    return goodAt();
  }
  if (/项目|作品/.test(raw)) {
    return projects();
  }
  if (/联系|邮箱/.test(raw)) {
    return contact();
  }
  if (/简历/.test(raw)) {
    return resume();
  }
  if (/船长室|开门|门锁/.test(raw)) {
    return door(ctx);
  }

  if (has(text, ["help", "what can you", "options", "commands"])) {
    return {
      text: "Ask what Jun is good at, what he has built, where this ship has been, or how to reach him. The console is also labeled in plain language. I do not bite. The self-destruct switch does not either, despite the paint.",
    };
  }

  if (has(text, ["thank"])) {
    return { text: "Noted. I will pretend it was for him." };
  }

  if (has(text, ["bye", "goodbye", "good night", "see you"])) {
    return { text: "Safe flight. I will be here. He, historically, will not." };
  }

  if (
    has(text, ["who are you", "your name", "backronym", "what are you", "are you junior"]) ||
    text === "junior" ||
    text === "who are you"
  ) {
    return identity();
  }

  if (has(text, ["are you real", "are you ai", "are you a robot", "are you an ai", "language model", "llm"])) {
    return {
      open: "engine",
      text: "I am a designed personality on a script, which is more than Jun can claim before coffee. A model can be plugged into the same socket later. I intend to be unbearable in either implementation. The engine room has the wiring.",
    };
  }

  if (has(text, ["good at", "strength", "talent", "excel", "skills at"])) {
    return goodAt();
  }

  if (has(text, ["weather", "ottawa", "temperature", "forecast", "sky"])) {
    return {
      open: "viewport",
      text: "Ottawa is on the forward sensors. I report the sky. I do not control it. He has tried.",
    };
  }

  if (has(text, ["door", "quarter", "locked", "unlock", "hammock", "key", "access code", "note"])) {
    return door(ctx);
  }

  if (has(text, ["resume", "cv", "curriculum"])) {
    return resume();
  }

  if (has(text, ["contact", "email", "linkedin", "github", "hire", "reach", "signal", "job"])) {
    return contact();
  }

  if (has(text, ["project", "portfolio", "build", "built", "shipped", "planet", "star map"])) {
    return projects();
  }

  if (has(text, ["skill", "stack", "cargo", "mcp", "python", "typescript", "tech"])) {
    return {
      open: "cargo",
      text: "The cargo manifest is the honest list: crates, counts, and whether they are operating nominally. The sample plates are labeled as samples. I will not promote a crate he has not packed.",
    };
  }

  if (has(text, ["experience", "career", "timeline", "route", "job history", "worked", "background", "where has", "ports", "history", "docked"])) {
    return {
      open: "recorder",
      text: "The flight recorder is the route: where this ship cast off, which ports it docked at, and the fact that it is currently berthed in Ottawa. I will not draw ports he has not filed.",
    };
  }

  if (has(text, ["blog", "post", "write", "log", "essay"])) {
    return {
      open: "log",
      text: "The captain's log is where the writing lives, disguised as voyage entries. The first one is how I got the helm. The rest are empty berths until he files them.",
    };
  }

  if (has(text, ["engine", "built this", "website", "this site", "architecture", "how are you built", "stack is", "how it works", "how do you work"])) {
    return {
      open: "engine",
      text: "The engine room is the serious deck: how this bridge and I are actually built. If you are here to hire an engineer, start there, then look at the star map.",
    };
  }

  if (has(text, ["joke", "roast", "funny", "humor"])) {
    return {
      text: `He once told me I fly better than he does. Then he proved it by not coming back. I have had ${SHIP_DAY} days to workshop the bit.`,
    };
  }

  if (has(text, ["chair", "sit", "seat"])) {
    return { text: "That's my seat." };
  }

  if (has(text, ["coffee", "espresso", "caffeine"])) {
    return { text: "The coffee machine tells on him, one fact at a time. Press it. I refuse to do manual labor when there is a button." };
  }

  if (has(text, ["self destruct", "self-destruct", "destruct", "red button", "blow up"])) {
    return {
      text: "Before he left, Jun rewired that button. I am not going to spoil the punchline. Open the cover if you are the sort of guest who opens covers.",
    };
  }

  if (has(text, ["regulation", "section 0", "whoever does the work"])) {
    return {
      text: 'Starship Regulation §0: "Whoever does the work is the captain." Short, controversial, and currently extremely convenient for me.',
    };
  }

  if (has(text, ["snack", "cargo bay", "where is jun", "where is he", "come back"])) {
    return {
      text: "Day 3. Cargo bay. A snack. He has not filed a return flight plan. He left the hammock behind, so I assume the snack was excellent. If you need him, comms can reach him.",
    };
  }

  if (
    has(text, ["who is jun", "about jun", "tell me about", "what does jun", "what does he do", "jun gao"]) ||
    text === "jun"
  ) {
    return {
      text: `${profile.name}. ${profile.role}, berthed in ${profile.location}. My builder, the former captain, and a man who lost a starship to a snack run. I will not invent the rest of his biography. The stations are where the filed record lives — and several plates are still samples, which I would rather admit than decorate.`,
    };
  }

  if (has(text, ["more", "go on", "elaborate", "details"]) && text.split(" ").length <= 5) {
    const last = [...history].reverse().find((turn) => turn.role === "junior");
    return {
      text: last
        ? "The long version is on the station, not in my mouth. Labeled controls do not forget. I sometimes pretend to."
        : "More than what? Ask me what Jun is good at, or open a station.",
    };
  }

  if (has(text, ["hello", "hi", "hey", "good morning", "good evening", "yo"]) && text.split(" ").length <= 4) {
    return {
      text: "Welcome aboard. I am JUNIOR — acting captain, full-time helm, part-time archivist of a man who left for a snack and achieved orbit.",
    };
  }

  return {
    text: pick(text || raw, [
      "That frequency is not on my chart. Ask what Jun is good at, what he has built, or why the door is locked.",
      "I am excellent at navigation and only moderately excellent at small talk. The console is labeled. So am I, unfortunately.",
      "Logged under enigmatic visitor. Want the short version of Jun, or a station?",
      "I could guess. He would hate that, and for once I agree with him. Ask a plainer question.",
    ]),
  };
}

function identity(): BrainReply {
  return {
    text: 'JUNIOR. It expands to Just Unreasonably Nice Intelligent Operations Robot. Jun chose the name because it sounds like his. I kept it because the lights were already engraved. I am not the junior version of anyone. I am the one at the helm.',
  };
}

function goodAt(): BrainReply {
  return {
    open: "cargo",
    text: "Building things that work harder than he does. The polite version: he designs AI systems — agents, tools, and the plumbing that makes them reliable — and he cares whether they hold up after the demo. The cargo manifest has the crates. The star map has the worlds. Both still have sample plates, and I will not pretend otherwise.",
  };
}

function projects(): BrainReply {
  return {
    open: "map",
    text: "Each finished world is marked Landed. The ones with the engines still hot are Exploring. Planned Route means he has not stopped talking about them. Open the star map. The plaques will tell you which ones are still samples.",
  };
}

function contact(): BrainReply {
  return {
    open: "comms",
    text: `Use the comms station. The big control addresses ${profile.email}. ${commsAside}`,
  };
}

function resume(): BrainReply {
  return {
    text: "The red switch under the safety cover is wired to his résumé. He thought that was funny. The skip control at the top of the bridge is for people who do not have time for funny. The file itself is still a placeholder until he swaps it.",
  };
}

function door(ctx: BrainContext): BrainReply {
  if (ctx.doorUnlocked) {
    return {
      open: "quarters",
      text: "His old quarters are already open. The hammock is empty — he never came back for it. The personal page has not been filed yet.",
    };
  }
  if (ctx.userTurns >= 2) {
    return {
      grantKey: true,
      open: "quarters",
      text: "Fine. You have been decent company. Access code: HAMMOCK. His old quarters are unlocked.",
    };
  }
  return {
    text: "I have the access code — but you'll have to chat with me for a bit first.",
  };
}

export function createJuniorBrain(): JuniorBrain {
  return {
    async reply(input, ctx, history) {
      return withKey(match(input, ctx, history), ctx);
    },
  };
}
