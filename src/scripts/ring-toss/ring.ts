// One ring in the air: a plain arc under gravity (no physics engine), so the throw is easy to tune.
// Each step it checks the prizes, the stools and the owner: round a prize = a ringer; touching one = a bounce.
import * as THREE from 'three';
import { STOOL_HALF, BACK_WALL, floorAt, risersAbove, type Slot } from './prizes';
import type { Owner } from './stall';
import type { Toss } from './input';

export const INNER = 0.19;               // inside radius: a prize must fit in this (was 0.165: too many fair throws didn't go round)
export const TUBE = 0.015;
export const MID = INNER + TUBE;         // the circle through the middle of the tube
export const OUTER = INNER + 2 * TUBE;
/** how much of a prize must be inside the ring's hole for the ring to drop over it (1 = all of it, as in a strict
 *  game; less, and a ring that lands with its rim on the top of a prize tips over it) */
const TIP = 0.4;
/** the same for the big prizes at the back: more of it must be inside (they were all of it, and with only about 5 cm to
 *  play with at that distance hardly anyone ever won one: now about 9 cm, still the hardest on the stall) */
const BIG_TIP = 0.7;
/** s after leaving the hand by which a ring must have come to rest (else it just drops and lies: step) */
const STUCK_AFTER = 5;

/** a little help for someone who keeps on playing: from the third round paid for, each round lets a ring be 1 cm
 *  further off and still go round (up to 4 cm). Unseen: the ring looks the same; it's only kinder about landing */
let LEEWAY = 0;
export function setRounds(rounds: number): void { LEEWAY = Math.min(0.04, Math.max(0, rounds - 2) * 0.01); }

/** bigger rings, for a while: the ad's reward (ad.ts: gold, wider by 12 cm inside, about 3× the odds) and the owner's
 *  at closing time (three prizes or fewer left to find: hers, red, wider by 8 cm, about 2.4×). Each is wider inside by
 *  extra (m), and looks it. The unseen rings he throws to work out your odds are as wide, so what his terminal says is
 *  still the game's own figure (the ×: odds.ts over the whole stall, tried out away from the page) */
export type Luck = 'ad' | 'closing';
export const BIG: Record<Luck, { extra: number; color: number; emissive: number }> = {
  ad: { extra: 0.12, color: 0xf2c14e, emissive: 0xb07a10 },
  closing: { extra: 0.08, color: 0xd8322a, emissive: 0x5a0c06 },
};
let LUCK: Luck | null = null;
/** the rings thrown from now on: bigger (which kind), or plain (null) */
export function setLuck(k: Luck | null): void { LUCK = k; }

const G = 9.8;
const ANGLE = 35 * Math.PI / 180;        // a lob, so it comes down onto the prizes rather than across them
const SPEED = [3.9, 8.6];                // m/s: the front row from about 15% power, the back row at about 70-80%, the wall above that
const BACK = BACK_WALL + OUTER;          // the stall's back wall, less the ring's own size
const MAX_YAW = 0.65;                    // radians either side: the front corners, and the owner at the far left
export const HAND = new THREE.Vector3(0, 0.92, 0.45);   // over the front of the counter, low in front of you: out of the way of the prizes
/** how far the ring in your hand moves to either side as you aim (m): it leaves from there, so where it looks to
 *  start is where it does */
export const HAND_SWAY = 0.45;

/** where a toss leaves the hand, and how fast which way (the ring's own start, and the aiming guide's: main.ts) */
export function launch(toss: Toss, pos: THREE.Vector3, vel: THREE.Vector3): void {
  const speed = SPEED[0] + toss.power * (SPEED[1] - SPEED[0]);
  const yaw = toss.aim * MAX_YAW;
  pos.copy(HAND);
  pos.x += toss.aim * HAND_SWAY;
  vel.set(Math.sin(yaw) * Math.cos(ANGLE) * speed, Math.sin(ANGLE) * speed, -Math.cos(yaw) * Math.cos(ANGLE) * speed);
}
export const GRAVITY = G;

/** the highest the stage comes anywhere under the ring: under its middle and four points round its rim, so the
 *  rim never sinks into a step */
function floorUnder(x: number, z: number): number {
  return Math.max(floorAt(x, z), floorAt(x + MID, z), floorAt(x - MID, z), floorAt(x, z + MID), floorAt(x, z - MID));
}   // over the counter, just in front of you

export type Result =
  | { kind: 'win'; slot: Slot }
  | { kind: 'miss'; near: { slot: Slot; gap: number } | null }
  | { kind: 'head' };

export interface Hooks {
  clink(slot: Slot): void;
  owner(): void;
  /** knocked the TAP & PLAY neon sign (to the right of the stage) */
  sign?(): void;
  done(ring: Ring, result: Result): void;
}

/** the TAP & PLAY sign, as a thin box the rings can knock against (scene.ts hangs it here: x, y its middle, z its face) */
const SIGN = { x: 1.72, y: 1.5, z: -2.25, w: 0.25, h: 0.8 };

const geometry = new THREE.TorusGeometry(MID, TUBE, 12, 48).rotateX(Math.PI / 2);   // lying flat
export const COLORS = [0xe8473b, 0x3fbf9a, 0xf2c14e, 0x5aa9e6];

export class Ring {
  /** null for a probe: a ring nobody sees, thrown only to find out where it would go (odds.ts) */
  readonly mesh: THREE.Mesh | null;
  readonly pos = new THREE.Vector3();
  readonly vel = new THREE.Vector3();
  state: 'fly' | 'slide' | 'settle' | 'rest' = 'fly';
  private hitSign = false;
  /** the height it slides on: the ground (null), or a stool top */
  floor = 0;
  on: Slot | null = null;
  target: Slot | null = null;
  private t = 0;
  private spin = 0;
  private wobble: number;
  private tilt = new THREE.Vector2();
  private hitOwner = false;
  private clinkAt = -1;
  private nudges = 0;
  /** s spent sliding (it gives up and lies still after a while) */
  private sliding = 0;
  /** times it came down on another ring and was knocked off it, rather than lie on it */
  private ringHops = 0;
  /** how much wider than a plain ring it is inside (a lucky ring: setLuck), fixed when it's thrown */
  readonly lucky = LUCK;
  readonly luck = LUCK ? BIG[LUCK].extra : 0;

  constructor(scene: THREE.Scene | null, toss: Toss, n: number) {
    const mat = this.lucky
      ? new THREE.MeshStandardMaterial({ color: BIG[this.lucky].color, roughness: 0.25, metalness: 0.5, emissive: BIG[this.lucky].emissive, emissiveIntensity: 0.6 })
      : new THREE.MeshStandardMaterial({ color: COLORS[n % COLORS.length], roughness: 0.35 });
    this.mesh = scene ? new THREE.Mesh(geometry, mat) : null;
    if (scene && this.mesh) {
      if (this.luck) this.mesh.scale.setScalar((MID + this.luck) / MID);
      this.mesh.castShadow = true;
      scene.add(this.mesh);
    }
    launch(toss, this.pos, this.vel);
    this.wobble = 0.08 + Math.random() * 0.08;
    this.place();
  }

  dispose(scene: THREE.Scene): void {
    if (!this.mesh) return;
    scene.remove(this.mesh);
    (this.mesh.material as THREE.Material).dispose();
  }

  /** others: the rings already lying still, which this one can land on or knock against */
  step(dt: number, slots: Slot[], owner: Owner, others: Ring[], hooks: Hooks): void {
    this.t += dt;
    // a time limit: a ring still not lying still STUCK_AFTER seconds after it left your hand (caught on an edge, wedged
    // between things, bouncing in a corner) just drops where it is and lies there, so the next ring is never kept waiting
    if (this.t > STUCK_AFTER && (this.state === 'fly' || this.state === 'slide')) { this.giveUp(slots, owner, hooks); this.place(); return; }
    if (this.state === 'fly') this.fly(dt, slots, owner, others, hooks);
    else if (this.state === 'slide') this.slide(dt, slots, owner, others, hooks);
    else if (this.state === 'settle') this.settle(dt, others, hooks);
    this.place();
  }

  private fly(dt: number, slots: Slot[], owner: Owner, others: Ring[], hooks: Hooks): void {
    const prevBottom = this.pos.y - TUBE;
    const px = this.pos.x, pz = this.pos.z;
    this.vel.y -= G * dt;
    this.pos.addScaledVector(this.vel, dt);
    const bottom = this.pos.y - TUBE;
    this.spin += 11 * dt;
    this.tilt.set(Math.sin(this.t * 7) * this.wobble, Math.cos(this.t * 5) * this.wobble * 0.6);
    // into the sign: it rattles (and flickers), the ring drops off it
    {
      const dx = Math.abs(this.pos.x - SIGN.x), dy = Math.abs(this.pos.y - SIGN.y), dz = this.pos.z - SIGN.z;
      if (dx < SIGN.w + OUTER && dy < SIGN.h && Math.abs(dz) < OUTER * 0.6 && !this.hitSign) {
        this.hitSign = true;
        if (this.mesh) hooks.sign?.();
        this.vel.z = Math.sign(pz - SIGN.z || 1) * Math.abs(this.vel.z) * 0.3;
        this.vel.x *= 0.4;
      }
    }
    if (this.pos.z < BACK) {   // off the back wall
      this.pos.z = BACK;
      this.vel.z = Math.abs(this.vel.z) * 0.25;
      this.vel.x *= 0.5;
    }
    // into the front (or a side) of a step, below its top: knocked back off it
    const f = floorUnder(this.pos.x, this.pos.z);
    if (bottom < f && prevBottom < f) {
      const front = floorUnder(px, this.pos.z) > bottom;   // the step is ahead of it, not beside it
      this.pos.x = px;
      this.pos.z = pz;
      if (front) this.vel.z = Math.abs(this.vel.z) * 0.3;
      else this.vel.x = -this.vel.x * 0.3;
      this.wobble = Math.min(0.5, this.wobble + 0.15);
    }

    // the owner: a ring that comes down on his head stays there; one that hits him bounces off (he speaks once)
    const dh = Math.hypot(this.pos.x - owner.x, this.pos.z - owner.z);
    if (!this.hitOwner) {
      if (prevBottom > owner.headTop && bottom <= owner.headTop && dh < OUTER) {
        this.hitOwner = true;
        hooks.owner();
        this.pos.set(owner.x + (this.pos.x - owner.x) * 0.3, owner.headY + owner.headR * 0.45, owner.z + (this.pos.z - owner.z) * 0.3);
        this.tilt.set(0.25, -0.1);
        this.state = 'rest';
        hooks.done(this, { kind: 'head' });
        return;
      }
    }
    const headHit = this.pos.distanceTo(owner.head) < owner.headR + MID * 0.6;
    const bodyHit = bottom < owner.bodyTop && bottom > owner.hipH - 0.2 && dh < owner.bodyR + OUTER;
    if (headHit || bodyHit) {
      if (!this.hitOwner) { this.hitOwner = true; hooks.owner(); }
      this.bounce(this.pos.x - owner.x, this.pos.z - owner.z);
    } else if (bottom < owner.hipH && dh < STOOL_HALF + OUTER) this.bounce(this.pos.x - owner.x, this.pos.z - owner.z, 0.15);

    // the rings already down: land on one, or knock against it
    for (const o of others) {
      const dx = this.pos.x - o.pos.x, dz = this.pos.z - o.pos.z;
      if (Math.hypot(dx, dz) >= 2 * OUTER) continue;
      const top = o.pos.y + TUBE;
      if (prevBottom > top && bottom <= top) {
        if (this.restOn(o, slots, owner, others, hooks)) return;
        continue;
      }
      if (bottom < top && this.pos.y + TUBE > o.pos.y - TUBE) this.bounce(dx, dz, 0.3);
    }

    for (const s of slots) {
      const dx = this.pos.x - s.x, dz = this.pos.z - s.z, d = Math.hypot(dx, dz);
      const p = s.prize;
      if (p && !s.claimed) {
        const top = s.stoolH + p.height;
        if (prevBottom > top && bottom <= top) {
          // right round it, or near enough that the rim catches the top and tips over it: a ringer
          if (d + p.footR * (p.strict ? BIG_TIP : TIP) <= INNER + LEEWAY + this.luck) {
            if (!this.mesh) { this.state = 'rest'; hooks.done(this, { kind: 'win', slot: s }); return; }   // a probe only reports it
            this.state = 'settle';
            this.target = s;
            s.claimed = true;
            return;
          }
          if (d < OUTER + p.footR) { this.bounce(dx, dz); this.clink(s, hooks); continue; }   // the rim lands on top of it
        } else if (bottom < top && bottom > s.stoolH - 0.005 && Math.abs(d - MID) < p.footR + TUBE) {
          this.bounce(dx, dz); this.clink(s, hooks); continue;                               // the rim knocks its side
        }
      }
      // the stool top: the ring lands on it if its middle is over the top
      if (prevBottom > s.stoolH && bottom <= s.stoolH && d < s.stoolR) {
        this.land(s);
        return;
      }
      // the stool's edge or legs: knocked back
      if (bottom < s.stoolH && d < s.stoolR + OUTER) this.bounce(dx, dz, 0.15);
    }
    const floor = floorUnder(this.pos.x, this.pos.z);
    if (bottom <= floor) this.land(null, floor);   // onto the stage, or the street
  }

  private land(on: Slot | null, floor = 0): void {
    this.on = on;
    this.floor = on ? on.stoolH : floor;
    this.pos.y = this.floor + TUBE;
    this.vel.y = 0;
    this.vel.x *= 0.25;
    this.vel.z *= 0.25;
    this.state = 'slide';
  }

  private slide(dt: number, slots: Slot[], owner: Owner, others: Ring[], hooks: Hooks): void {
    this.sliding += dt;
    const speed = Math.hypot(this.vel.x, this.vel.z);
    this.tilt.multiplyScalar(Math.max(0, 1 - 12 * dt));
    this.clearDrape();
    if (speed < 0.03) {
      // only settles where it touches nothing: else it slides on sideways, off whatever it is against
      // (and if it's still shuffling about after a few tries or a second and a half, it just lies where it is, a
      // little against whatever it's against: it used to nudge on for up to 200 tries, some 15 s of small twitching,
      // and the next ring waited for it)
      const hit = this.against(slots, owner, others);
      if (!hit || this.nudges > 8 || this.sliding > 1.5) { this.rest(slots, hooks); return; }
      // wedged (sideways keeps meeting something): a firmer push some other way
      if (++this.nudges > 3) {
        const th = Math.random() * Math.PI * 2;
        this.vel.set(Math.cos(th) * 0.6, 0, Math.sin(th) * 0.6);
        return;
      }
      const dx = this.pos.x - hit.x || (Math.random() - 0.5);
      this.vel.x = Math.sign(dx) * 0.35;
      this.vel.z = 0.05;
      return;
    }
    const k = Math.max(0, speed - 4 * dt) / speed;
    this.vel.x *= k;
    this.vel.z *= k;
    const px = this.pos.x, pz = this.pos.z;
    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.z * dt;
    if (this.pos.z < BACK) { this.pos.z = BACK; this.vel.z = 0; }   // stopped by the back wall
    if (!this.on) {
      const f = floorUnder(this.pos.x, this.pos.z);
      if (f > this.floor + 1e-4) { this.pos.x = px; this.pos.z = pz; this.vel.x = this.vel.z = 0; }   // against a step
      else if (f < this.floor - 1e-4) { this.state = 'fly'; this.vel.y = 0; return; }              // off the edge of one
    }
    this.spin += speed * 3 * dt;
    // nothing it slides into goes through it: it stops against it
    if (this.on) {
      const p = this.on.prize;
      if (p && !this.on.claimed) this.keepOff(this.on.x, this.on.z, MID + p.footR + TUBE, Math.abs(Math.hypot(this.pos.x - this.on.x, this.pos.z - this.on.z) - MID) < p.footR + TUBE);
    } else {
      for (const s of slots) this.keepOff(s.x, s.z, s.stoolR + OUTER);
      this.keepOff(owner.x, owner.z, STOOL_HALF + OUTER);
    }
    for (const o of others) if (Math.abs(o.pos.y - this.pos.y) < 2 * TUBE) this.keepOff(o.pos.x, o.pos.z, 2 * OUTER);
    if (this.on && Math.hypot(this.pos.x - this.on.x, this.pos.z - this.on.z) >= this.on.stoolR) {
      this.on = null;                                                                        // slid off the stool
      this.state = 'fly';
      this.vel.y = 0;
    }
  }

  /** if its middle is closer than min to (x, z) (or touching says so), move it out to min, no longer moving into it */
  private keepOff(x: number, z: number, min: number, touching?: boolean): void {
    const dx = this.pos.x - x, dz = this.pos.z - z;
    const d = Math.hypot(dx, dz);
    if (!(touching ?? d < min)) return;
    const nx = d > 1e-4 ? dx / d : 1, nz = d > 1e-4 ? dz / d : 0;
    this.pos.x = x + nx * min;
    this.pos.z = z + nz * min;
    const into = this.vel.x * nx + this.vel.z * nz;   // stopped going into it; still free to slide along or away
    if (into < 0) { this.vel.x -= into * nx; this.vel.z -= into * nz; }
  }

  /** came down on another ring. Rings lying across each other looked like they went through each other, so it is
   *  knocked off to lie beside it (it slides till it touches none: slide). Only if it keeps coming down on rings (a
   *  crowded spot, nowhere free nearby) does it lie on top, a little tipped; and if a stool or the owner is in the way
   *  there, it bounces off instead */
  private restOn(o: Ring, slots: Slot[], owner: Owner, others: Ring[], hooks: Hooks): boolean {
    if (this.ringHops++ < 4) { this.bounce(this.pos.x - o.pos.x, this.pos.z - o.pos.z, 0.3); return false; }
    let y = 0;
    for (const q of others) if (Math.hypot(this.pos.x - q.pos.x, this.pos.z - q.pos.z) < 2 * OUTER) y = Math.max(y, q.pos.y + 2 * TUBE);
    const blocked = slots.some((s) => y - TUBE < s.stoolH && Math.hypot(this.pos.x - s.x, this.pos.z - s.z) < s.stoolR + OUTER)
      || y - TUBE < owner.hipH && Math.hypot(this.pos.x - owner.x, this.pos.z - owner.z) < STOOL_HALF + OUTER
      || risersAbove(this.pos.x, y - TUBE).some((f) => this.pos.z < f + OUTER && this.pos.z > f - 0.6);   // in the drape
    if (blocked) { this.bounce(this.pos.x - o.pos.x, this.pos.z - o.pos.z, 0.3); return false; }
    this.pos.y = y;
    this.floor = y - TUBE;
    this.vel.set(0, 0, 0);
    this.rest(slots, hooks);
    const dx = this.pos.x - o.pos.x, dz = this.pos.z - o.pos.z, d = Math.hypot(dx, dz) || 1;
    this.tilt.set(-dz / d * 0.12, dx / d * 0.12);
    this.place();
    return true;
  }

  private settle(dt: number, others: Ring[], hooks: Hooks): void {
    const s = this.target!;
    // it comes down round the prize onto the stool, or onto a ring already lying there
    let floor = s.stoolH;
    for (const o of others) if (Math.hypot(this.pos.x - o.pos.x, this.pos.z - o.pos.z) < 2 * OUTER) floor = Math.max(floor, o.pos.y + TUBE);
    const k = Math.min(1, 10 * dt);
    this.pos.x += (s.x - this.pos.x) * k * 0.5;
    this.pos.z += (s.z - this.pos.z) * k * 0.5;
    this.pos.y = Math.max(floor + TUBE, this.pos.y - 1.6 * dt);
    this.tilt.multiplyScalar(1 - k);
    this.spin += 4 * dt;
    if (this.pos.y <= floor + TUBE) {
      this.state = 'rest';
      hooks.done(this, { kind: 'win', slot: s });
    }
  }

  /** what it would be lying against, if anything: a prize on its level, another ring, the owner's stand */
  private against(slots: Slot[], owner: Owner, others: Ring[]): { x: number } | null {
    for (const s of slots) {
      if (s.claimed || Math.abs(s.stoolH - this.floor) > 0.05) continue;
      const r = s.prize ? s.stoolR : 0;
      if (s.prize && Math.hypot(this.pos.x - s.x, this.pos.z - s.z) < r + OUTER - 1e-3) return s;
    }
    for (const o of others) if (Math.abs(o.pos.y - this.pos.y) < 2 * TUBE && Math.hypot(this.pos.x - o.pos.x, this.pos.z - o.pos.z) < 2 * OUTER - 1e-3) return o.pos;
    if (this.floor < owner.hipH && Math.hypot(this.pos.x - owner.x, this.pos.z - owner.z) < STOOL_HALF + OUTER - 1e-3) return owner;
    return null;
  }

  /** lying below a step: kept out of the cloth hanging down its face (the drape stands out from the step) */
  private clearDrape(): void {
    for (const front of risersAbove(this.pos.x, this.floor)) {
      const min = front + OUTER;
      if (this.pos.z < min && this.pos.z > front - 0.6) { this.pos.z = min; if (this.vel.z < 0) this.vel.z = 0; }
    }
  }

  /** stuck: straight down onto whatever is under it (out of the owner's stand, if it's in it), and still */
  private giveUp(slots: Slot[], owner: Owner, hooks: Hooks): void {
    const dh = Math.hypot(this.pos.x - owner.x, this.pos.z - owner.z);
    if (dh < STOOL_HALF + OUTER) {
      const nx = dh > 1e-4 ? (this.pos.x - owner.x) / dh : 1, nz = dh > 1e-4 ? (this.pos.z - owner.z) / dh : 0;
      this.pos.x = owner.x + nx * (STOOL_HALF + OUTER);
      this.pos.z = owner.z + nz * (STOOL_HALF + OUTER);
    }
    this.on = null;
    this.floor = floorUnder(this.pos.x, this.pos.z);
    this.pos.y = this.floor + TUBE;
    this.vel.set(0, 0, 0);
    this.rest(slots, hooks);
  }

  private rest(slots: Slot[], hooks: Hooks): void {

    this.state = 'rest';
    this.tilt.set((Math.random() - 0.5) * 0.04, (Math.random() - 0.5) * 0.04);
    let near: { slot: Slot; gap: number } | null = null;
    for (const s of slots) {
      if (!s.prize || s.claimed) continue;
      const gap = Math.hypot(this.pos.x - s.x, this.pos.z - s.z) + s.prize.footR - INNER;   // how far from fitting round it
      if (gap < 0.06 && (!near || gap < near.gap)) near = { slot: s, gap };
    }
    hooks.done(this, { kind: 'miss', near });
  }

  /** knocked away from a point (dx, dz from it to the ring) */
  private bounce(dx: number, dz: number, keep = 0.35): void {
    let d = Math.hypot(dx, dz);
    if (d < 1e-4) { dx = -this.vel.x; dz = -this.vel.z; d = Math.hypot(dx, dz) || 1; }
    const nx = dx / d, nz = dz / d;
    const dot = this.vel.x * nx + this.vel.z * nz;
    if (dot < 0) { this.vel.x -= 2 * dot * nx; this.vel.z -= 2 * dot * nz; }
    this.vel.x *= keep;
    this.vel.z *= keep;
    // always knocked off sideways at least a little: with no sideways speed it would hop on the spot for ever
    const away = this.vel.x * nx + this.vel.z * nz;
    if (away < 0.35) { this.vel.x += nx * (0.35 - away); this.vel.z += nz * (0.35 - away); }
    this.vel.y = Math.abs(this.vel.y) * 0.3 + 0.5;
    this.pos.x += nx * 0.015;
    this.pos.z += nz * 0.015;
    this.wobble = Math.min(0.5, this.wobble + 0.2);
  }

  private clink(s: Slot, hooks: Hooks): void {
    if (this.t - this.clinkAt < 0.2) return;
    this.clinkAt = this.t;
    hooks.clink(s);
  }

  private place(): void {
    if (!this.mesh) return;
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.set(this.tilt.x, this.spin, this.tilt.y);
  }
}
