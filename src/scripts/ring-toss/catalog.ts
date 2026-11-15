// Every prize the stall can put out, numbered, each with its line: what's on the tag tied to it when you win it
// (main.ts), and the collection on the receipt at the end. What you've found lasts this visit only.
import type { Kind } from './prizes';

export interface Entry { kind: Kind; no: number; name: string; line: string }

const LIST: [Kind, string, string][] = [
  ['cat', 'Lucky cat', 'Waves you in. Now waves your card too.'],
  ['tatcat', 'Tattooed cat', 'Old school. New ink. Takes tap.'],
  ['dog', 'Lucky pup', 'Used to fetch your change. Not anymore.'],
  ['pup', 'Little pup', 'Small. Loyal. No minimum spend.'],
  ['panda', 'Panda', 'Black and white. Unlike the old rules.'],
  ['plush', 'Bao plush', 'Soft inside. Sold out by noon.'],
  ['dumpling', 'Dumpling buddy', 'Folded by hand. Paid for by phone.'],
  ['bokchoy', 'Jade cabbage', 'Green. Not that kind of green.'],
  ['mug', 'Tiger mug', 'Year of the Tiger. Era of the tap.'],
  ['beer', 'Lucky beer mug', 'Raise it to the last cash-only sign.'],
  ['controller', "The owner's controller", "She'll want that back."],
  ['lunchbox', 'Lunchbox', 'Mom packed it. Mom still prefers cash.'],
  ['soy', 'Soy sauce', 'Light, dark, or tap.'],
  ['jar', 'Chili oil', 'Still hot. Now takes tap.'],
  ['dragon', 'Jade dragon', "Guards the till. The till's empty now."],
  ['cooker', 'Rice cooker', 'Same rice. New rails.'],
  ['record', 'Record player', 'Plays the oldies. Pays the new way.'],
  ['ingot', 'Gold ingot', "Real gold. Still can't pay with it here."],
];

export const CATALOG: Entry[] = LIST.map(([kind, name, line], i) => ({ kind, no: i + 1, name, line }));
export const entry = (k: Kind): Entry | undefined => CATALOG.find((e) => e.kind === k);
export const no = (n: number): string => String(n).padStart(2, '0');

// what you've found: this visit only (a refresh starts the collection over). (It was kept in the browser once: that's
// cleared away.)
const found = new Set<Kind>();
try { localStorage.removeItem('rt-found'); } catch { /* nothing kept */ }

/** mark it found; true if it's the first time */
export function find(k: Kind): boolean {
  if (found.has(k)) return false;
  found.add(k);
  return true;
}
export const isFound = (k: Kind): boolean => found.has(k);
export const foundCount = (): number => CATALOG.filter((e) => found.has(e.kind)).length;
