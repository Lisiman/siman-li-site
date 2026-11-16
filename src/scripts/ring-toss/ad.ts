// The ad. As in a phone game: miss five in a row and you're offered one, to watch for luckier rings. The ad is
// Siman, for hire (a 6 s film: She dreams it. She codes it. She somehow makes it work. She's available for hire!).
// Watched to the end, the reward is yours (the next AD_REWARD rings are lucky: ring.ts setLuck), whichever way you
// then close it. Closed before the end, no reward, and it may be offered again another round. Once watched, it's
// never offered again in this browser.
import { isMuted, streetLevel } from './sound';

/** how many lucky rings it's worth */
export const AD_REWARD = 5;
/** misses in a row before it's offered */
export const AD_AFTER = 5;
const KEY = 'rt-ad';

export function adWatched(): boolean {
  try { return localStorage.getItem(KEY) === 'watched'; } catch { return false; }
}

type State = 'off' | 'offer' | 'play' | 'done';

export function setupAd(reward: () => void): { offer(): void; isOpen(): boolean } {
  const root = document.getElementById('rt-ad')!;
  const video = root.querySelector<HTMLVideoElement>('.rt-ad-video')!;
  const count = root.querySelector<HTMLElement>('.rt-ad-count')!;
  let state: State = 'off';
  const set = (s: State): void => { state = s; root.dataset.state = s; };

  function close(): void {
    if (state === 'off') return;
    video.pause();
    set('off');
    streetLevel(1, 0.6);
  }

  function offer(): void {
    if (state !== 'off') return;
    video.preload = 'auto';   // it starts loading now, so it plays at once if they say yes
    set('offer');
    root.querySelector<HTMLButtonElement>('.rt-ad-watch')!.focus({ preventScroll: true });
  }

  // played from the click itself, so phones and iPads let it play with its sound
  root.querySelector('.rt-ad-watch')!.addEventListener('click', () => {
    set('play');
    count.textContent = 'Reward in 6';
    streetLevel(0.15, 0.3);   // the street hushed under it
    video.currentTime = 0;
    video.muted = isMuted();
    video.play().catch(() => { video.muted = true; void video.play().catch(() => {}); });
  });
  video.addEventListener('timeupdate', () => {
    if (state !== 'play' || !video.duration) return;
    count.textContent = `Reward in ${Math.max(1, Math.ceil(video.duration - video.currentTime))}`;
  });
  video.addEventListener('ended', () => {
    if (state !== 'play') return;
    set('done');
    count.textContent = '✓ Reward unlocked';
    try { localStorage.setItem(KEY, 'watched'); } catch { /* it may be offered again: fine */ }
    reward();
    root.querySelector<HTMLButtonElement>('.rt-ad-claim')!.focus({ preventScroll: true });
  });
  root.querySelector('.rt-ad-no')!.addEventListener('click', close);
  root.querySelector('.rt-ad-x')!.addEventListener('click', close);
  root.querySelector('.rt-ad-claim')!.addEventListener('click', close);
  root.addEventListener('click', (e) => { if (e.target === root && state !== 'play') close(); });   // outside the card
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && state !== 'off') close(); });
  // (it covers the canvas, so the stall, which listens only there, can't be played under it)

  return { offer, isOpen: () => state !== 'off' };
}
