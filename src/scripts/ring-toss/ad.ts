// The ad. As in a phone game: miss five in a row and she offers you one in her terminal (main.ts), to watch for
// luckier rings; say yes and it plays at once. The ad is Siman, for hire (a 5 s film: She dreams it. She codes it.
// She somehow makes it work. She's available for hire!).
// Watched to the end, the reward is yours (the next AD_REWARD rings are lucky: ring.ts setLuck), whichever way you
// then close it. Closed before the end, no reward, and it may be offered again another round. Once watched, it's
// never offered again in this browser.
import { isMuted, streetLevel, audioContext } from './sound';

/** the ad's music (upbeat music.mp3, from Pixabay), the whole song, at the level it is in the film. The film has
 *  5 s of it from FROM (s into the song); when the film's over the song goes on from there through the page's own
 *  audio (not an <audio>: on a phone one started later than a tap may stay silent), easing down under the loop, round
 *  and round, till the ad is closed */
const MUSIC = '/play/no-cash-only/ad-music.mp3';
const FROM = 0.45;
let music: Promise<AudioBuffer> | null = null;
let song: { src: AudioBufferSourceNode; gain: GainNode } | null = null;

/** how many lucky rings it's worth */
export const AD_REWARD = 5;
/** misses in a row before it's offered */
export const AD_AFTER = 5;
const KEY = 'rt-ad';

export function adWatched(): boolean {
  try { return localStorage.getItem(KEY) === 'watched'; } catch { return false; }
}

type State = 'off' | 'play' | 'done';

/** reward: on watching it to the end; closed: when it's put away, and whether it was watched (the reward given) */
export function setupAd(reward: () => void, closed?: (watched: boolean) => void): { prepare(): void; play(): void; isOpen(): boolean } {
  const root = document.getElementById('rt-ad')!;
  const video = root.querySelector<HTMLVideoElement>('.rt-ad-video')!;
  const count = root.querySelector<HTMLElement>('.rt-ad-count')!;
  /** after it: the same film going round, silent, the titles all up. It goes there and back (ad-loop.mp4), and starts
   *  at LOOP_AT, on the very frame the ad ends on, so the change can't be seen */
  const loop = root.querySelector<HTMLVideoElement>('.rt-ad-loop')!;
  const LOOP_AT = 5;
  let state: State = 'off';
  const claim = root.querySelector<HTMLButtonElement>('.rt-ad-claim')!;
  const set = (s: State): void => { state = s; root.dataset.state = s; claim.disabled = s === 'play'; };

  function close(): void {
    if (state === 'off') return;
    // closed in its last moments ("Reward in 1", nearly over): that's watched, and the reward is yours all the same
    if (state === 'play' && video.duration && video.currentTime >= video.duration - 0.5) finish();
    video.pause();
    loop.pause();
    const ctx = audioContext();
    if (song && ctx) {   // faded out, not cut
      song.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
      song.src.stop(ctx.currentTime + 0.8);
    }
    song = null;
    loop.classList.remove('is-on');
    const watched = state === 'done';
    set('off');
    streetLevel(1, 0.6);
    closed?.(watched);
  }

  /** call from the click (or key) that said yes: phones and iPads let it play, with its sound, only then */
  function play(): void {
    if (state !== 'off') return;
    set('play');
    const ctx = audioContext();
    if (ctx && !music) music = fetch(MUSIC).then((r) => r.arrayBuffer()).then((b) => ctx.decodeAudioData(b));
    music?.catch(() => { music = null; });   // (didn't load: the loop is silent, and it's tried again next time)
    count.textContent = 'Reward in 5s';
    streetLevel(0.15, 0.3);   // the street hushed under it
    video.currentTime = 0;
    loop.classList.remove('is-on');
    // the loop waits, already on the frame the ad ends on, so at the end it's only shown and set going: no pause
    loop.preload = 'auto';
    if (loop.readyState >= 1) loop.currentTime = LOOP_AT;
    else loop.addEventListener('loadedmetadata', () => { loop.currentTime = LOOP_AT; }, { once: true });   // (Safari won't seek before)
    video.muted = isMuted();
    video.play().catch(() => { video.muted = true; void video.play().catch(() => {}); });
  }

  video.addEventListener('timeupdate', () => {
    if (state !== 'play' || !video.duration) return;
    count.textContent = `Reward in ${Math.max(1, Math.ceil(video.duration - video.currentTime))}s`;
  });
  /** watched to the end: the reward, and the loop with the music going on */
  function finish(): void {
    if (state !== 'play') return;
    set('done');
    count.textContent = '✓ Unlocked';
    loop.classList.add('is-on');
    void loop.play().catch(() => { /* it stays on that frame: fine */ });
    // and the music goes on from where the film's left it
    const ctx = audioContext(), at = video.duration;
    if (ctx && music && !isMuted()) {
      void music.then((buf) => {
        if (state !== 'done' || song) return;
        const gain = ctx.createGain();
        gain.connect(ctx.destination);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        src.connect(gain);
        src.start(0, (FROM + at) % buf.duration);
        gain.gain.setValueAtTime(1, ctx.currentTime + 0.5);
        gain.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 3.5);   // the film's over: it steps back, under the loop
        song = { src, gain };
      }).catch(() => { /* silent, then */ });
    }
    try { localStorage.setItem(KEY, 'watched'); } catch { /* it may be offered again: fine */ }
    reward();
    root.querySelector<HTMLButtonElement>('.rt-ad-claim')!.focus({ preventScroll: true });
  }
  video.addEventListener('ended', finish);
  root.querySelector('.rt-ad-x')!.addEventListener('click', close);
  root.querySelector('.rt-ad-claim')!.addEventListener('click', close);
  root.addEventListener('click', (e) => { if (e.target === root && state !== 'play') close(); });   // outside the card
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && state !== 'off') close(); });
  // (it covers the canvas, so the stall, which listens only there, can't be played under it)

  return {
    prepare: () => { video.preload = 'auto'; },   // offered: it starts loading, so it plays at once on yes
    play,
    isOpen: () => state !== 'off',
  };
}
