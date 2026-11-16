// The one way the parts of the game talk to each other. The game says what happened (a coin, a throw, a miss…);
// the owner's lines, the payment moment, sounds and the dev log all listen. Nothing listens to anything else.
import type { Prize } from './prizes';

export interface GameEvents {
  /** paid for rings: how, and whether this player has now paid both ways */
  coin: { rings: number; method: 'cash' | 'tap'; both: boolean };
  throw: { left: number; count: number; aim: number; power: number };
  miss: { streak: number };
  near: { prize: Prize; gap: number; streak: number };
  clink: { prize: Prize };
  /** last: it was the last prize not yet found (her line for that is the 'complete' one, not this) */
  win: { prize: Prize; streak: number; last?: boolean };
  streak: { count: number };
  owner: { count: number };
  /** say: she says something about it this time (not every time she fidgets) */
  idle: { seconds: number; rings: number; paid: boolean; say: boolean };
  empty: { wins: number };   // prizes won this round
  /** a new round paid for, and the places left empty filled: how many, how many of them never seen before, and
   *  whether every prize has now been found */
  restock: { count: number; unseen: number; all: boolean };
  /** the last prize not yet found has just been won: every one of them found */
  complete: { total: number };
  /** a prize found, and now only this many (3 or fewer) left to find: closing time, bigger rings (main.ts) */
  closing: { left: number };
  ask: { id: string };
}
export type GameEvent = keyof GameEvents;

type Handler<K extends GameEvent> = (payload: GameEvents[K]) => void;
type AnyHandler = <K extends GameEvent>(name: K, payload: GameEvents[K]) => void;

const handlers = new Map<GameEvent, Set<(payload: never) => void>>();
const anyHandlers = new Set<AnyHandler>();

export function on<K extends GameEvent>(name: K, handler: Handler<K>): () => void {
  let set = handlers.get(name);
  if (!set) handlers.set(name, (set = new Set()));
  set.add(handler as (payload: never) => void);
  return () => set.delete(handler as (payload: never) => void);
}

/** every event, with its name (the dev log) */
export function onAny(handler: AnyHandler): () => void {
  anyHandlers.add(handler);
  return () => anyHandlers.delete(handler);
}

export function emit<K extends GameEvent>(name: K, payload: GameEvents[K]): void {
  handlers.get(name)?.forEach((h) => (h as Handler<K>)(payload));
  anyHandlers.forEach((h) => h(name, payload));
}
