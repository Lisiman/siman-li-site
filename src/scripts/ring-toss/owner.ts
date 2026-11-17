// The owner, in 3D: Siman's own figure (made from a photo, rigged in Mixamo), standing behind the stand. Until it
// has loaded, the greybox stands in. She waves you in; idles (shifting from one stance to another); talks when she
// says a line; points or thanks you when you pay; laughs at a run of misses, shrugs at a near one; cheers when you
// win (and shakes her head when it's her own controller); flinches when a ring hits her; bows when you're out.
// Each moment has a few clips to pick from, so she doesn't repeat herself. Files: public/play/no-cash-only/owner/,
// made from _source/owner/ (v4's model on v2's Mixamo skeleton; the clips from _source/owner/anims/).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { on } from './events';
import type { Owner } from './stall';
import { studioLit } from './studio';

const BASE = '/play/no-cash-only/owner/';
const HEIGHT = 1.62;        // metres, standing
const TURN = 0.35;          // turned a little toward the middle of the stall, and you
/** the model's head is toy-sized for a grown-up body: drawn this much smaller (the head bone, so it follows every move) */
const HEAD_SCALE = 1;
const HEAD_ABOVE_BONE = 0.09 * HEAD_SCALE;   // the head bone sits at the bottom of the head; its middle is this much higher

/** the moments she acts, the clips for each (named after the files in _source/owner/anims/), and how much each
 *  matters: a bigger one can cut a smaller one short, never the other way round (a flinch beats everything) */
const ACTS = {
  idle:   { rank: 0, clips: ['happy-idle', 'idle', 'happy-idle-1'] },
  // (not 'yawn': its hand over her mouth went into her face)
  // the moments she has nothing to do, each its own act so each has its own share of them (IDLES, below)
  bored:  { rank: 0.5, clips: ['bored'] },
  look:   { rank: 0.5, clips: ['looking-around'] },
  rap:    { rank: 0.5, clips: ['rapping'] },
  // dancing by herself while no one's throwing (Mixamo; all clear of the laptop by 5 cm or more)
  dance:  { rank: 0.5, clips: ['silly-dancing', 'silly-dancing-1', 'running-man'] },
  talk:   { rank: 1, clips: ['talking', 'talking-1', 'happy-hand-gesture'] },
  secret: { rank: 2, clips: ['telling-a-secret'] },   // offering you the ad: leaning in, as if no one else should hear
  nod:    { rank: 1.5, clips: ['sarcastic-head-nod', 'thoughtful-head-nod', 'lengthy-head-nod'] },
  near:   { rank: 1.5, clips: ['shrugging', 'disappointed'] },
  wave:   { rank: 2, clips: ['waving'] },
  pay:    { rank: 2, clips: ['pointing', 'agreeing'] },
  thanks: { rank: 2, clips: ['thankful'] },
  laugh:  { rank: 2, clips: ['laughing'] },
  bow:    { rank: 2, clips: ['quick-informal-bow'] },
  phone:  { rank: 0.5, clips: ['texting-while-standing'] },
  win:    { rank: 3, clips: ['cheering', 'clapping'] },
  streak: { rank: 3, clips: ['excited', 'victory'] },
  mine:   { rank: 3.5, clips: ['annoyed-head-shake'] },
  // and every hit knocks her head (BONK) as well. (Not 'reaction', fists up and doubled over: 15 cm through her
  // laptop; nor Mixamo's 'Zombie Reaction Hit', 7 cm. The head hits clear it by 5 cm or more: 'head-hit-1' ducks
  // low, behind it.)
  ouch:   { rank: 4, clips: ['hit-reaction', 'head-hit', 'head-hit-1', 'medium-hit-to-head'] },
} as const;
type Act = keyof typeof ACTS;
/** clips that reach forward into her laptop, made smaller (soften(): 1 as they are), just enough that her hands
 *  stop short of its screen (by 1.4 cm or more, every clip measured frame by frame in node). Bending the arm back
 *  out of the way instead (IK, tried) took the elbow 68° for 4 cm, and the arm looked broken. */
const SOFTER: Record<string, number> = { bored: 0.5, rapping: 0.6, talking: 0.75 };
/** the long clips, cut short (s), and the very short one played a few times over */
const HOLD: Record<string, number> = {
  'talking-1': 4.5, 'telling-a-secret': 8.6, 'texting-while-standing': 7, bored: 6, rapping: 4, 'looking-around': 5, laughing: 3.5,
  excited: 3, victory: 3.5, 'running-man': 8, agreeing: 3, disappointed: 3, thankful: 3,
};
const REPEAT: Record<string, number> = { waving: 5 };
/** swung like a pendulum, not played: the wave is half a second cut from a longer clip, so at its own pace it's
 *  frantic and its ends don't meet. Instead its time goes back and forth along it, slowing to a stop at each end
 *  and quickest in the middle, as a hand does. The value: seconds per sweep, one way. */
const SWING: Record<string, { sweep: number; from: number; to: number }> = {
  // seconds per sweep one way, and the stretch of the clip that is one clean sweep (the hand from one side to the
  // other: the clip itself waves one and a half times, so swinging through all of it stutters)
  waving: { sweep: 0.7, from: 0.365, to: 0.466 },   // (not from 0.333: the hand would cross her face)
};
/** her head turns to you, over whatever the clip is doing: how much (0–1), at most how far (rad), and the acts
 *  where she looks elsewhere on purpose (around, at her phone, down in a bow, away from a ring in the face) */
const LOOK = { weight: 0.85, max: 0.7, away: 0.25 };
const LOOKS_AWAY: Act[] = ['bored', 'look', 'rap', 'phone', 'bow', 'ouch', 'laugh'];
/** the knock when a ring hits her: her head ducks (rad) and tips to one side, then springs back, settling within
 *  `time` (s); the neck takes part of it, so it bends rather than pivots */
const BONK = { time: 0.75, dip: 0.3, tilt: 0.2, neck: 0.4 };
/** a different stance every so often while nothing's happening (s) */
const SHIFT = [7, 13];

export interface OwnerFigure {
  update(dt: number): void;
  /** he has started a line (stall.ts): he talks, unless he is busy with something bigger */
  talking(): void;
  /** the opening: she waves you over */
  greet(): void;
  /** she offers you the ad (main.ts): telling you a secret */
  secret(): void;
  /** dev: she dances now */
  dance(): void;
}

/** clips not in owner.glb, each a file of its own beside it, loaded once she's there: made from the Mixamo FBX in
 *  _source/owner/anims/ (same skeleton, same units: the tracks go straight on), cut to length and kept as plain
 *  numbers (times once, then each track's values) */
const EXTRA = ['telling-a-secret', 'head-hit', 'head-hit-1', 'medium-hit-to-head', 'silly-dancing', 'silly-dancing-1', 'running-man'];
async function extraClip(name: string): Promise<THREE.AnimationClip> {
  const d = await (await fetch(`${BASE}${name}.json`)).json() as { name: string; duration: number; times: number[]; tracks: { n: string; v: number[] }[] };
  const tracks = d.tracks.map((t) => (t.n.endsWith('.quaternion')
    ? new THREE.QuaternionKeyframeTrack(t.n, d.times, t.v)
    : new THREE.VectorKeyframeTrack(t.n, d.times, t.v)));
  return new THREE.AnimationClip(d.name, d.duration, tracks);
}

/** a clip's moves made smaller: every pose taken part of the way from its first one (k: 0 none, 1 all of it), so
 *  it starts and ends where it did, just less */
function soften(clip: THREE.AnimationClip, k: number, name: string): THREE.AnimationClip {
  const q0 = new THREE.Quaternion(), q = new THREE.Quaternion();
  const tracks = clip.tracks.map((t) => {
    const v = t.values.slice(), n = t.getValueSize();
    if (t instanceof THREE.QuaternionKeyframeTrack) {
      q0.fromArray(v, 0);
      for (let i = 4; i < v.length; i += 4) q.copy(q0).slerp(q.fromArray(v, i), k).toArray(v, i);
      return new THREE.QuaternionKeyframeTrack(t.name, t.times, v);
    }
    for (let i = n; i < v.length; i++) v[i] = v[i % n] + (v[i] - v[i % n]) * k;
    return new THREE.VectorKeyframeTrack(t.name, t.times, v);
  });
  return new THREE.AnimationClip(name, clip.duration, tracks);
}

export function loadOwner(scene: THREE.Scene, owner: Owner, placeholder: THREE.Object3D, eye?: THREE.Object3D): OwnerFigure {
  let mixer: THREE.AnimationMixer | null = null;
  const actions = new Map<string, THREE.AnimationAction>();
  let current: Act = 'idle';
  let currentAction: THREE.AnimationAction | null = null;
  let back = 0;   // seconds until she goes back to idle
  let shift = SHIFT[0];   // seconds until the next change of stance
  let head: THREE.Object3D | null = null;
  const headAt = new THREE.Vector3();
  const last = new Map<Act, string>();   // the clip each act played last time, so the next one differs
  let look = 0;   // how much she's looking at you now (eases toward the act's weight)
  const qHead = new THREE.Quaternion(), qParent = new THREE.Quaternion(), qTurn = new THREE.Quaternion();
  const fwd = new THREE.Vector3(), toEye = new THREE.Vector3(), eyeAt = new THREE.Vector3();
  let neckBone: THREE.Object3D | null = null;
  const bonk = { t: BONK.time, side: 1, size: 1 };
  const qBonk = new THREE.Quaternion(), eBonk = new THREE.Euler();
  let swing: { action: THREE.AnimationAction; phase: number; sweep: number; from: number; to: number } | null = null;

  /** one of the act's clips that has loaded, not the same as last time if there's a choice */
  const choose = (act: Act): THREE.AnimationAction | null => {
    const have = ACTS[act].clips.filter((c) => actions.has(c));
    if (!have.length) return null;
    const fresh = have.length > 1 ? have.filter((c) => c !== last.get(act)) : have;
    const name = fresh[Math.floor(Math.random() * fresh.length)];
    last.set(act, name);
    return actions.get(name)!;
  };
  const play = (act: Act): void => {
    if (!mixer) return;
    const a = choose(act);
    if (!a) return;
    const name = a.getClip().name;
    const once = act !== 'idle';
    const sweep = SWING[name];
    const length = HOLD[name] ?? (sweep ? sweep.sweep : a.getClip().duration) * (REPEAT[name] ?? 1);
    if (once && currentAction === a) { a.reset(); back = length; return; }
    a.reset();
    a.setLoop(once && !REPEAT[name] ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
    a.timeScale = sweep ? 0 : 1;   // a swung clip's time is set by hand, in update()
    swing = sweep ? { action: a, phase: 0, ...sweep } : null;
    if (swing) a.time = swing.from;
    a.clampWhenFinished = true;
    a.enabled = true;
    a.setEffectiveWeight(1);
    if (currentAction && currentAction !== a) a.crossFadeFrom(currentAction, 0.35, false);
    a.play();
    currentAction = a;
    current = act;
    back = once ? length - 0.3 : 0;
    shift = SHIFT[0] + Math.random() * (SHIFT[1] - SHIFT[0]);
  };
  const act = (a: Act): void => { if (ACTS[a].rank >= ACTS[current].rank || back <= 0) play(a); };

  // red neon from behind and to his left: it draws his outline against the dark street
  const rim = new THREE.SpotLight(0xff3a4a, 7, 4, 0.55, 0.7, 2);
  rim.position.set(owner.x - 0.7, 2.3, owner.z - 0.9);
  rim.target.position.set(owner.x, 1.3, owner.z);
  scene.add(rim, rim.target);
  // and a soft light on his face from in front, only just warm (warmer, with the bulbs, the skin went orange)
  const fill = new THREE.SpotLight(0xffeee4, 2.2, 5, 0.35, 0.9, 2);
  fill.position.set(owner.x + 1.2, 2.0, owner.z + 2.2);
  fill.target.position.set(owner.x, 1.45, owner.z);
  scene.add(fill, fill.target);

  const textures = new THREE.TextureLoader();
  const tex = (file: string, color = false): THREE.Texture => {
    const t = textures.load(BASE + file);
    if (color) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  };

  new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).load(BASE + 'owner.glb', (gltf) => {
    const root = gltf.scene;
    const skin = studioLit(new THREE.MeshStandardMaterial({
      map: tex('base.webp', true), normalMap: tex('normal.webp'), roughnessMap: tex('rough.webp'), roughness: 1, metalness: 0,
      normalScale: new THREE.Vector2(0.5, 0.5),   // the generated normals are noisy: at full strength the skin looks pitted
      side: THREE.DoubleSide,   // a few faces in the hair (by the clip) face inward; from the front they were a hole
    }), 0.55);
    root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        const m = o as THREE.Mesh;
        m.material = skin;
        m.castShadow = true;   // no shadows on himself: at this size the hair's shadow breaks his face into blotches
        m.frustumCulled = false;   // the skinned bounds don't follow the animation
      }
      if ((o as THREE.Bone).isBone && /Head$/.test(o.name)) head = o;
      if ((o as THREE.Bone).isBone && /Neck$/.test(o.name)) neckBone = o;
    });
    // start him idling, then measure him in that pose: the clips move the hips well away from where the bind pose
    // has them, so only the animated skeleton says where his feet really are
    mixer = new THREE.AnimationMixer(root);
    for (const clip of gltf.animations) {
      const k = SOFTER[clip.name];
      actions.set(clip.name, mixer.clipAction(k ? soften(clip, k, clip.name) : clip));
    }
    for (const name of EXTRA) void extraClip(name).then((c) => { if (mixer) actions.set(c.name, mixer.clipAction(c)); }).catch(() => { /* not loaded: she just talks */ });
    play('idle');
    mixer.update(0);
    // the right size, feet on the ground, where the greybox stood. Measured on the skeleton (the head, the toes,
    // the hips), since a skinned mesh's bounds don't follow its bones.
    const bone = (re: RegExp): THREE.Object3D | undefined => {
      let found: THREE.Object3D | undefined;
      root.traverse((o) => { if (!found && (o as THREE.Bone).isBone && re.test(o.name)) found = o; });
      return found;
    };
    // (the export keeps no bone at the top of the head, so: the head bone, at the top of the neck, stands at about
    // 88% of a person's height, measured from the toes)
    root.updateMatrixWorld(true);
    const at = (o: THREE.Object3D | undefined): THREE.Vector3 => (o ? o.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3());
    const neck = at(bone(/Head$/)), hips = at(bone(/Hips$/));
    const ground = Math.min(...[bone(/LeftToeBase$/), bone(/RightToeBase$/), bone(/LeftFoot$/), bone(/RightFoot$/)].filter(Boolean).map((b) => at(b).y));
    const s = (HEIGHT * 0.88) / (neck.y - ground);
    root.scale.setScalar(s);
    root.position.set(-hips.x * s, -ground * s, -hips.z * s);   // the hips over the middle of the spot, toes on the ground
    const spot = new THREE.Group();                               // turned about that middle, not the file's own origin
    spot.position.set(owner.x, owner.floor, owner.z);
    spot.rotation.y = TURN;
    spot.add(root);
    scene.add(spot);
    placeholder.visible = false;
  }, undefined, (e) => console.warn('owner model did not load; the greybox stays', e));

  on('owner', () => {
    bonk.t = 0;
    bonk.side = Math.random() < 0.5 ? -1 : 1;
    bonk.size = 0.75 + Math.random() * 0.5;
    act('ouch');
  });
  on('win', ({ prize, streak }) => act(prize.kind === 'controller' ? 'mine' : streak >= 3 ? 'streak' : 'win'));
  on('coin', ({ method }) => act(method === 'tap' ? 'thanks' : 'pay'));
  on('miss', ({ streak }) => { if (streak >= 3 && streak % 3 === 0) act('laugh'); else if (Math.random() < 0.4) act('nod'); });
  on('near', () => act('near'));
  /** what she does with a moment she has nothing to do: each act's share of them (they add up to 1) */
  const IDLES: [Act, number][] = [['bored', 0.25], ['phone', 0.25], ['dance', 0.2], ['rap', 0.2], ['look', 0.1]];
  on('idle', () => {
    let r = Math.random();
    act((IDLES.find(([, p]) => (r -= p) < 0) ?? IDLES[0])[0]);
  });
  on('empty', () => act('bow'));

  return {
    update(dt) {
      if (!mixer) return;
      if (swing && currentAction === swing.action) {
        swing.phase += dt * Math.PI / swing.sweep;
        swing.action.time = swing.from + (swing.to - swing.from) * (1 - Math.cos(swing.phase)) / 2;
      }
      mixer.update(dt);
      if (head) head.scale.setScalar(HEAD_SCALE);   // after the clips, in case they set it
      // and her head turned toward you: the clip's pose, then the turn from where her face points to where your eyes
      // are, part of the way and no further than LOOK.max (her face is the head bone's +Z)
      look += ((LOOKS_AWAY.includes(current) ? LOOK.away : LOOK.weight) - look) * Math.min(1, dt * 3);
      if (head && eye && head.parent) {
        head.parent.updateWorldMatrix(true, false);
        head.updateMatrixWorld();
        head.getWorldQuaternion(qHead);
        head.getWorldPosition(headAt);
        fwd.set(0, 0, 1).applyQuaternion(qHead);
        toEye.subVectors(eye.getWorldPosition(eyeAt), headAt).normalize();
        qTurn.setFromUnitVectors(fwd, toEye);
        const angle = 2 * Math.acos(Math.min(1, Math.abs(qTurn.w)));
        const k = look * (angle > LOOK.max ? LOOK.max / angle : 1);
        qTurn.slerp(new THREE.Quaternion(), 1 - k);
        head.parent.getWorldQuaternion(qParent);
        head.quaternion.copy(qParent.invert().multiply(qTurn.multiply(qHead)));
      }
      // the knock, over everything else: a quick duck, then a few smaller and smaller springs back
      if (head && bonk.t < BONK.time) {
        bonk.t += dt;
        const t = bonk.t;
        const f = Math.min(1, t / 0.05) * Math.exp(-6 * t) * Math.cos(13 * t) * bonk.size;
        // (the bones' +X is across her: a turn about it drops her face; about +Z, along her face, tips her head over)
        const at = (b: THREE.Object3D, k: number): void => {
          b.quaternion.multiply(qBonk.setFromEuler(eBonk.set(BONK.dip * f * k, 0, bonk.side * BONK.tilt * f * k)));
        };
        if (neckBone) at(neckBone, BONK.neck);
        at(head, neckBone ? 1 - BONK.neck : 1);
      }
      if (back > 0 && (back -= dt) <= 0) play('idle');
      else if (current === 'idle' && (shift -= dt) <= 0) play('idle');   // another stance
      // the rings and his terminal follow his head as he moves
      if (head) {
        head.getWorldPosition(headAt);
        owner.head.set(headAt.x, headAt.y + HEAD_ABOVE_BONE, headAt.z);
        owner.headY = owner.head.y;
        owner.headTop = owner.headY + owner.headR;
        owner.bodyTop = owner.headY - 0.2;
      }
    },
    talking() { act('talk'); },
    greet() { act('wave'); },
    secret() { act('secret'); },
    dance() { play('dance'); },
  };
}
