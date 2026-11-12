// Shapes of what the painting generator returns. painting.ts implements PaintingAPI.

/** Colour tokens; each maps to a CSS variable, e.g. 'mid' → var(--mid). */
export type Tone = 'ink' | 'mid' | 'lt' | 'sink' | 'smid' | 'slt';

export interface Stroke { d: string; c: Tone | 'bg'; w: number; o: number; t?: number; /** filled wash instead of a line: gradient kind */ fill?: 'down' | 'band' | 'blob'; /** a paper-coloured fill that hides what lies behind */ bg?: boolean; /** snow on the rocks: shown only in heavy snow */ snow?: boolean }
export interface Layer { depth: number; paths: Stroke[] }
export interface TreeStrokes { /** trunk & branches */ d: string; /** leaf marks */ l: string; /** paper inside the trunk & branches (hides what lies behind) */ f?: string; /** the sides of the trunk & thick branches (part of d) */ e?: string; /** the rest of d: bark marks, twigs, roots */ o?: string; r: number; /** canopy wash (style.wash) */ w?: string }
export interface ReedStrokes { d: string; r: number }
export type Point = [x: number, y: number];

/** Where things are, in painting coordinates (viewBox 1800 × 720). */
export interface Geo {
  /** top of the water */ w0: number;
  /** right edge / top of the near rock bank */ rkx: number; rky: number;
  /** the near rocks' skyline, sampled every 6 units: [x, top y]; below it is rock, not water */ rocks: [number, number][];
  /** the little rocks out in the river: each its top outline and its waterline */ islets: { top: [number, number][]; by: number }[];
  /** scale factor of the composition */ k: number;
  /** ferry route: start (near shore) and end (far landing) */ S: Point; E: Point;
  bud: Point; /** the ground under the little Buddha */ budG: number; /** the top of the main mountain */ peakY: number;
}

export interface Landscape {
  layers: Layer[];
  stats: string;
  trees: TreeStrokes[];
  reeds: ReedStrokes[];
  /** the saddle beyond the mountains: the other shore */
  far: { x: number; y: number };
  geo: Geo;
}

export interface PaintingStyle { wash?: boolean; round?: boolean; grove?: boolean; hills?: boolean }
export interface BuildOptions { W: number; H: number; vertical: boolean; ink: Tone; mid: Tone; light: Tone; style?: PaintingStyle;
  /** mountain form (default 'round') */ form?: 'peak' | 'round' | 'mesa' | 'ranges';
  /** what stands on the far shore (default 'pagoda') */ temple?: 'pagoda' | 'hall' | 'pavilion' | 'hill';
  /** near-bank rocks (default 'boulder') */ rock?: 'boulder' | 'stack' | 'ledge' | 'scatter' }

export interface SkyBody { /** radians above horizon */ alt: number; /** radians from south, + toward west */ az: number }
export interface SkyState { sun: SkyBody; moon: SkyBody; /** lit fraction */ frac: number; /** 0 new · 0.5 full · 1 new */ phase: number }

export type WeatherKind = 'clear' | 'cloudy' | 'rain' | 'snow' | 'fog';
export interface FogBand { y: number; h: number; o: number }
/** an outline cloud: its path, its left/right extent, and a speed factor for drifting */
export interface Cloud { d: string; x0: number; x1: number; k: number }
export interface WeatherMarks { wx: Stroke[]; fog: FogBand[]; clouds: Cloud[]; /** opacity for the painting under weather */ dim: number }

export interface PaintingAPI {
  /** Sun & moon at a moment (ms since epoch), over New York unless a latitude / longitude (degrees, east +) is given. */
  astro(ms: number, lat?: number, lng?: number): SkyState;
  /** Rain / snow / cloud / fog marks, slanted by wind (mph). */
  weather(kind: WeatherKind, seed: number, mph?: number): WeatherMarks;
  /** The landscape. Same seed → same painting. */
  build(seed: number, o: BuildOptions): Landscape;
  /** A quiet shore for the end of the page (uses the --s* tones). */
  buildNight(seed: number): { shore: Stroke[] };
}
