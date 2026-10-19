import { junior, type JuniorResponse } from "./content";
import type { StationId } from "./ship";

export interface ChatTurn {
  role: "visitor" | "junior";
  text: string;
}

export interface BrainContext {
  /** Count of visitor messages, including the one being answered. */
  userTurns: number;
  codeGiven: boolean;
  doorUnlocked: boolean;
}

export interface BrainReply {
  text: string;
  /** The visitor now knows the door code. Only the keypad opens the door. */
  revealsCode?: boolean;
  open?: StationId;
}

/**
 * JUNIOR's mouth. The bridge awaits `reply` and renders whatever comes back,
 * so an LLM-backed brain can replace `createJuniorBrain` without touching the UI.
 * Give that model `src/data/junior.json` as its personality sheet.
 */
export interface JuniorBrain {
  reply(input: string, ctx: BrainContext, history: ChatTurn[]): Promise<BrainReply>;
}

/** Visitor turns needed before JUNIOR hands over the door code. */
const TURNS_FOR_KEY = 2;

function norm(input: string) {
  return input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matches(text: string, rule: JuniorResponse) {
  if (rule.maxWords && text.split(" ").length > rule.maxWords) return false;
  return rule.keywords.some((keyword) => {
    const key = norm(keyword);
    if (!/^[a-z0-9 ]+$/.test(key)) return text.includes(key);
    return new RegExp(`(^| )${key}(s|es|ing|ed)?( |$)`).test(text);
  });
}

function pick(seed: string, options: string[]) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return options[hash % options.length];
}

const DOOR_CODE = norm(junior.door.code);
const DOOR_WORDS = new RegExp(`\\b(door|quarters?|locked|unlock|keypad|code|note|${DOOR_CODE})\\b`);

function doorReply(ctx: BrainContext): BrainReply {
  if (ctx.doorUnlocked) return { text: junior.door.alreadyOpen, open: "quarters" };
  if (ctx.codeGiven) return { text: junior.door.remind, open: "quarters" };
  if (ctx.userTurns >= TURNS_FOR_KEY) return { text: junior.door.unlock, revealsCode: true, open: "quarters" };
  return { text: junior.door.stillLocked };
}

function match(raw: string, ctx: BrainContext): BrainReply {
  const text = norm(raw);

  if (text === DOOR_CODE && !ctx.doorUnlocked) {
    return { text: junior.door.guessed, revealsCode: true, open: "quarters" };
  }
  if (DOOR_WORDS.test(text)) {
    return doorReply(ctx);
  }

  const rule = junior.responses.find((candidate) => matches(text, candidate));
  if (rule) return { text: rule.reply, open: rule.open };

  return { text: pick(text || raw, [...junior.fallbacks, ...junior.hints]) };
}

function withKey(reply: BrainReply, ctx: BrainContext): BrainReply {
  if (reply.revealsCode || ctx.codeGiven || ctx.doorUnlocked || ctx.userTurns < TURNS_FOR_KEY) return reply;
  return { ...reply, revealsCode: true, text: `${reply.text}\n\n${junior.door.unlock}` };
}

export function createJuniorBrain(): JuniorBrain {
  return {
    async reply(input, ctx) {
      return withKey(match(input, ctx), ctx);
    },
  };
}
