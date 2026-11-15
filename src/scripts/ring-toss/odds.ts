// The owner's sales pitch, with real numbers: before you throw, he works out your chances. From where you are
// aiming, it throws unseen rings at every power the swing can give you (and a hair either side of your aim),
// on the stall as it is now (the prizes still there, the rings lying about), and counts the ringers.
import { Ring, type Hooks, type Result } from './ring';
import type { Slot } from './prizes';
import type { Owner } from './stall';

const POWERS = 32;
const SPREAD = [-0.04, 0, 0.04];   // nobody lets go exactly where they meant to
const DT = 1 / 240;   // the same small steps as the game, so the odds are the game's own

/** 0…1: the chance that letting go now, at some moment of the swing, rings a prize */
export function odds(aim: number, slots: Slot[], owner: Owner, others: Ring[]): number {
  const job = oddsJob(aim, slots, owner, others);
  let r = job.next();
  while (!r.done) r = job.next();
  return r.value;
}

/** The same, a little at a time: it pauses after each unseen ring, so the game can spread the work over a few
 *  frames (about 17 ms in all) instead of stopping for it. */
export function* oddsJob(aim: number, slots: Slot[], owner: Owner, others: Ring[]): Generator<void, number> {
  let hits = 0, n = 0;
  let result: Result | null = null;
  const hooks: Hooks = { clink() {}, owner() {}, done(_r, res) { result = res; } };
  for (let i = 0; i <= POWERS; i++) {
    for (const da of SPREAD) {
      const ring = new Ring(null, { aim: Math.max(-1, Math.min(1, aim + da)), power: i / POWERS }, 0);
      result = null;
      for (let k = 0; k < 900 && result === null; k++) ring.step(DT, slots, owner, others, hooks);
      n++;
      if ((result as Result | null)?.kind === 'win') hits++;
      yield;
    }
  }
  return hits / n;
}
