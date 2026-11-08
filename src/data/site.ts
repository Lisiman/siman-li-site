// Everything you might want to tweak about the homepage lives here.
export interface City { name: string; lat: number; lng: number; tz: string }
export interface SiteConfig {
  /** day 0 — "I've been Siman for N days" & "Painting No. N" (ms, UTC) */
  born: number;
  /** the ferry reaches the other shore at this age */
  lifespan: number;
  /** the painting never changes; this picks which one */
  seed: number;
  city: City;
  /** home: its sky, time and weather close the page (the About section) */
  home: City & { zh: string };
  weatherEveryMin: number;
}

export const SITE: SiteConfig = {
  born: Date.UTC(1993, 11, 25),
  lifespan: 100,
  seed: 12003,
  city: { name: 'New York', lat: 40.7128, lng: -74.006, tz: 'America/New_York' },
  home: { name: 'Shijiazhuang', zh: '石家庄', lat: 38.0428, lng: 114.5149, tz: 'Asia/Shanghai' },
  weatherEveryMin: 15,
};
