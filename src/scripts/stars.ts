// The real night sky over New York: the brightest stars (J2000 RA in hours, Dec in degrees, visual magnitude)
// and the lines of a few well-known constellations. Positions are computed for the moment and the place
// (same formulas as the sun and moon in painting.ts), so the stars rise, wheel and set as they really do.

export interface Star { name: string; ra: number; dec: number; mag: number }

export const STARS: Star[] = [
  // the brightest
  { name: 'Sirius', ra: 6.752, dec: -16.716, mag: -1.46 }, { name: 'Arcturus', ra: 14.261, dec: 19.182, mag: -0.05 },
  { name: 'Vega', ra: 18.616, dec: 38.784, mag: 0.03 }, { name: 'Capella', ra: 5.278, dec: 45.998, mag: 0.08 },
  { name: 'Rigel', ra: 5.242, dec: -8.202, mag: 0.13 }, { name: 'Procyon', ra: 7.655, dec: 5.225, mag: 0.34 },
  { name: 'Betelgeuse', ra: 5.919, dec: 7.407, mag: 0.5 }, { name: 'Altair', ra: 19.846, dec: 8.868, mag: 0.76 },
  { name: 'Aldebaran', ra: 4.599, dec: 16.509, mag: 0.86 }, { name: 'Antares', ra: 16.49, dec: -26.432, mag: 0.96 },
  { name: 'Spica', ra: 13.42, dec: -11.161, mag: 0.97 }, { name: 'Pollux', ra: 7.755, dec: 28.026, mag: 1.14 },
  { name: 'Fomalhaut', ra: 22.961, dec: -29.622, mag: 1.16 }, { name: 'Deneb', ra: 20.69, dec: 45.28, mag: 1.25 },
  { name: 'Regulus', ra: 10.14, dec: 11.967, mag: 1.35 }, { name: 'Adhara', ra: 6.977, dec: -28.972, mag: 1.5 },
  { name: 'Castor', ra: 7.577, dec: 31.888, mag: 1.58 }, { name: 'Shaula', ra: 17.56, dec: -37.104, mag: 1.62 },
  { name: 'Bellatrix', ra: 5.419, dec: 6.35, mag: 1.64 }, { name: 'Elnath', ra: 5.438, dec: 28.608, mag: 1.65 },
  { name: 'Alnilam', ra: 5.604, dec: -1.202, mag: 1.69 }, { name: 'Alnitak', ra: 5.679, dec: -1.943, mag: 1.77 },
  { name: 'Mintaka', ra: 5.533, dec: -0.299, mag: 2.23 }, { name: 'Saiph', ra: 5.796, dec: -9.67, mag: 2.06 },
  { name: 'Meissa', ra: 5.585, dec: 9.934, mag: 3.39 },
  // Big Dipper (北斗七星)
  { name: 'Dubhe', ra: 11.062, dec: 61.751, mag: 1.79 }, { name: 'Merak', ra: 11.031, dec: 56.382, mag: 2.37 },
  { name: 'Phecda', ra: 11.897, dec: 53.695, mag: 2.44 }, { name: 'Megrez', ra: 12.257, dec: 57.033, mag: 3.31 },
  { name: 'Alioth', ra: 12.9, dec: 55.96, mag: 1.77 }, { name: 'Mizar', ra: 13.399, dec: 54.925, mag: 2.23 },
  { name: 'Alkaid', ra: 13.792, dec: 49.313, mag: 1.86 },
  { name: 'Polaris', ra: 2.53, dec: 89.264, mag: 1.98 }, { name: 'Kochab', ra: 14.845, dec: 74.156, mag: 2.08 },
  // Cassiopeia
  { name: 'Caph', ra: 0.153, dec: 59.15, mag: 2.28 }, { name: 'Schedar', ra: 0.675, dec: 56.537, mag: 2.24 },
  { name: 'Gamma Cas', ra: 0.945, dec: 60.717, mag: 2.47 }, { name: 'Ruchbah', ra: 1.43, dec: 60.235, mag: 2.68 },
  { name: 'Segin', ra: 1.907, dec: 63.67, mag: 3.37 },
  // Perseus, Andromeda, Pegasus, Aries
  { name: 'Mirfak', ra: 3.405, dec: 49.861, mag: 1.79 }, { name: 'Algol', ra: 3.136, dec: 40.956, mag: 2.12 },
  { name: 'Alpheratz', ra: 0.14, dec: 29.091, mag: 2.06 }, { name: 'Mirach', ra: 1.163, dec: 35.621, mag: 2.05 },
  { name: 'Almach', ra: 2.065, dec: 42.33, mag: 2.1 }, { name: 'Hamal', ra: 2.12, dec: 23.462, mag: 2.0 },
  { name: 'Markab', ra: 23.079, dec: 15.205, mag: 2.49 }, { name: 'Scheat', ra: 23.063, dec: 28.083, mag: 2.42 },
  { name: 'Algenib', ra: 0.221, dec: 15.184, mag: 2.83 }, { name: 'Enif', ra: 21.736, dec: 9.875, mag: 2.38 },
  { name: 'Diphda', ra: 0.727, dec: -17.987, mag: 2.04 }, { name: 'Menkar', ra: 3.038, dec: 4.09, mag: 2.54 },
  { name: 'Alcyone', ra: 3.791, dec: 24.105, mag: 2.87 },   // the Pleiades
  // Leo, Hydra, Virgo, Corvus, Boötes
  { name: 'Denebola', ra: 11.818, dec: 14.572, mag: 2.14 }, { name: 'Algieba', ra: 10.333, dec: 19.842, mag: 2.08 },
  { name: 'Zosma', ra: 11.235, dec: 20.524, mag: 2.56 }, { name: 'Alphard', ra: 9.46, dec: -8.659, mag: 1.98 },
  { name: 'Porrima', ra: 12.694, dec: -1.449, mag: 2.74 }, { name: 'Vindemiatrix', ra: 13.036, dec: 10.959, mag: 2.83 },
  { name: 'Gienah Crv', ra: 12.263, dec: -17.542, mag: 2.59 }, { name: 'Kraz', ra: 12.573, dec: -23.397, mag: 2.65 },
  { name: 'Izar', ra: 14.75, dec: 27.074, mag: 2.37 }, { name: 'Cor Caroli', ra: 12.934, dec: 38.318, mag: 2.9 },
  // Scorpius, Sagittarius, Ophiuchus, Serpens, Libra, Hercules, Corona Borealis
  { name: 'Dschubba', ra: 16.006, dec: -22.622, mag: 2.29 }, { name: 'Sabik', ra: 17.173, dec: -15.725, mag: 2.43 },
  { name: 'Nunki', ra: 18.921, dec: -26.297, mag: 2.05 }, { name: 'Kaus Australis', ra: 18.403, dec: -34.385, mag: 1.85 },
  { name: 'Rasalhague', ra: 17.582, dec: 12.56, mag: 2.08 }, { name: 'Unukalhai', ra: 15.738, dec: 6.426, mag: 2.63 },
  { name: 'Zubeneschamali', ra: 15.283, dec: -9.383, mag: 2.61 }, { name: 'Kornephoros', ra: 16.504, dec: 21.49, mag: 2.77 },
  { name: 'Alphecca', ra: 15.578, dec: 26.715, mag: 2.23 },
  // Cygnus, Lyra, Aquila, Draco, Cepheus, Capricornus, Aquarius
  { name: 'Sadr', ra: 20.37, dec: 40.257, mag: 2.23 }, { name: 'Gienah Cyg', ra: 20.77, dec: 33.97, mag: 2.48 },
  { name: 'Delta Cyg', ra: 19.75, dec: 45.131, mag: 2.87 }, { name: 'Albireo', ra: 19.512, dec: 27.96, mag: 3.08 },
  { name: 'Tarazed', ra: 19.771, dec: 10.613, mag: 2.72 }, { name: 'Eltanin', ra: 17.943, dec: 51.489, mag: 2.23 },
  { name: 'Alderamin', ra: 21.31, dec: 62.585, mag: 2.45 }, { name: 'Deneb Algedi', ra: 21.784, dec: -16.127, mag: 2.85 },
  { name: 'Sadalsuud', ra: 21.526, dec: -5.571, mag: 2.9 },
  // Auriga, Gemini, Canis Major and Minor
  { name: 'Menkalinan', ra: 5.992, dec: 44.947, mag: 1.9 }, { name: 'Alhena', ra: 6.629, dec: 16.399, mag: 1.93 },
  { name: 'Mirzam', ra: 6.378, dec: -17.956, mag: 1.98 }, { name: 'Wezen', ra: 7.14, dec: -26.393, mag: 1.83 },
  { name: 'Aludra', ra: 7.402, dec: -29.303, mag: 2.45 }, { name: 'Gomeisa', ra: 7.452, dec: 8.289, mag: 2.89 },
];

/** constellation figures, as pairs of star names (drawn faint and dotted) */
export const LINES: [string, string][] = [
  // Big Dipper
  ['Dubhe', 'Merak'], ['Merak', 'Phecda'], ['Phecda', 'Megrez'], ['Megrez', 'Dubhe'], ['Megrez', 'Alioth'], ['Alioth', 'Mizar'], ['Mizar', 'Alkaid'],
  // Orion
  ['Betelgeuse', 'Meissa'], ['Meissa', 'Bellatrix'], ['Betelgeuse', 'Alnitak'], ['Bellatrix', 'Mintaka'], ['Mintaka', 'Alnilam'], ['Alnilam', 'Alnitak'], ['Alnitak', 'Saiph'], ['Mintaka', 'Rigel'],
  // Cassiopeia
  ['Caph', 'Schedar'], ['Schedar', 'Gamma Cas'], ['Gamma Cas', 'Ruchbah'], ['Ruchbah', 'Segin'],
  // Great Square of Pegasus
  ['Markab', 'Scheat'], ['Scheat', 'Alpheratz'], ['Alpheratz', 'Algenib'], ['Algenib', 'Markab'],
  // Cygnus (the Northern Cross)
  ['Deneb', 'Sadr'], ['Sadr', 'Albireo'], ['Gienah Cyg', 'Sadr'], ['Sadr', 'Delta Cyg'],
  // Leo
  ['Regulus', 'Algieba'], ['Algieba', 'Zosma'], ['Zosma', 'Denebola'], ['Denebola', 'Regulus'],
  // Gemini, Scorpius, Canis Major, Taurus
  ['Castor', 'Pollux'], ['Antares', 'Dschubba'], ['Antares', 'Shaula'], ['Sirius', 'Mirzam'], ['Sirius', 'Wezen'], ['Wezen', 'Adhara'], ['Wezen', 'Aludra'], ['Aldebaran', 'Elnath'],
];

/** altitude / azimuth (radians; azimuth from south, positive toward the west) of each star at a moment, from New York
 *  unless another place is given (latitude, longitude in degrees, east +) */
export function starPositions(ms: number, latDeg = 40.7128, lngDeg = -74.006): Map<string, { alt: number; az: number; mag: number }> {
  const rad = Math.PI / 180, lat = latDeg * rad, lw = rad * -lngDeg;
  const d = ms / 86400000 - 0.5 + 2440588 - 2451545;
  const st = rad * (280.16 + 360.9856235 * d) - lw;   // local sidereal angle
  const out = new Map<string, { alt: number; az: number; mag: number }>();
  for (const s of STARS) {
    const ra = s.ra * 15 * rad, dec = s.dec * rad, H = st - ra;
    const alt = Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(H));
    const az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat));
    out.set(s.name, { alt, az, mag: s.mag });
  }
  return out;
}
