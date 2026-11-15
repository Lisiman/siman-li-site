// The world around the game: a Chinatown street at night, the stall's frame, its lights, and the sign that gives
// the piece its name. Nothing here takes part in the game; it is all to be looked at. Only what the camera can see
// is built: from where you stand, the street shows at either side of the stall, up to about 2.4 m.
import * as THREE from 'three';

export const NIGHT = 0x0a0f1e;

// fonts the canvas draws with: on a Mac (where the piece is shown) these are all there; elsewhere the next one down
const SIGN_FONT = '"Futura", "Avenir Next Condensed", "Arial Black", sans-serif';
const HANZI_FONT = '"PingFang TC", "Songti TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif';

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}
function texture(c: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
/** a flat light: brighter than white, so the bloom catches it, and not darkened by the tone mapping */
function glowing(map: THREE.Texture, strength: number): THREE.MeshBasicMaterial {
  const m = new THREE.MeshBasicMaterial({ map, transparent: true, toneMapped: false, depthWrite: false, fog: false });
  m.color.setScalar(strength);
  return m;
}
/** text drawn as neon tube: a wide soft glow, the coloured tube, and its hot white core */
function neonText(g: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, width: number): void {
  g.lineJoin = g.lineCap = 'round';
  g.shadowColor = color;
  g.shadowBlur = width * 2.5;
  g.strokeStyle = color;
  g.lineWidth = width;
  g.strokeText(text, x, y);
  g.shadowBlur = 0;
  g.strokeStyle = '#fff6ee';
  g.lineWidth = width * 0.35;
  g.strokeText(text, x, y);
}
const rand = (() => { let s = 7; return (): number => ((s = (s * 16807) % 2147483647) / 2147483647); })();   // the same street every time

// --- the sign ------------------------------------------------------------------------------------------------
const SCRIPT_FONT = '"Marker Felt", "Chalkboard SE", "Segoe Print", cursive';   // a round hand, thick enough to read as neon

/** The stall's old cloth banner, CASH ONLY 只收現金, tied between the back posts; and in front of it, put up
 *  later, two neon signs: a red NO and, squeezed in between, a jade "more". Read together: No [more] Cash Only. */
function buildSign(scene: THREE.Scene): { neon: THREE.MeshBasicMaterial; more: THREE.MeshBasicMaterial; glow: THREE.PointLight; moreGlow: THREE.PointLight } {
  const W = 2.7, H = 0.7, Y = 1.98, Z = -4.9;   // (a tenth smaller each way than it was: the neon below scales with it, K)
  const K = 0.9;   // (low enough to show in full under the LUCKY 88 sign)
  // the banner: red cloth, faded, yellow letters
  const [c, g] = canvas(1792, 466);
  g.fillStyle = '#a8231d';
  g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 1400; i++) {   // the weave, and where the sun has got at it
    g.fillStyle = `rgba(${rand() < 0.5 ? '255,220,200' : '40,0,0'}, ${0.02 + rand() * 0.05})`;
    g.fillRect(rand() * c.width, rand() * c.height, 2 + rand() * 30, 1 + rand() * 3);
  }
  const fade = g.createLinearGradient(0, 0, 0, c.height);
  fade.addColorStop(0, 'rgba(255,230,200,0.10)');
  fade.addColorStop(1, 'rgba(0,0,0,0.12)');
  g.fillStyle = fade;
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#f2c14e';
  g.textBaseline = 'alphabetic';
  g.textAlign = 'center';
  g.font = `900 220px ${SIGN_FONT}`;
  const cash = 'CASH ONLY';
  const cx = c.width * 0.68;
  const fit = Math.min(1, (c.width * 0.56) / g.measureText(cash).width);
  g.save();
  g.translate(cx, c.height * 0.6);
  g.scale(fit, 1);
  g.fillText(cash, 0, 0);
  g.restore();
  g.font = `700 92px ${HANZI_FONT}`;
  const zh = '只  收  現  金';
  g.fillText(zh, cx, c.height * 0.9);
  // and in front of it, added later by hand in black marker, a little crooked: 不 (not only cash)
  const zhLeft = cx - g.measureText(zh).width / 2;
  g.save();
  g.translate(zhLeft - 78, c.height * 0.9 - 4);
  g.rotate(-0.08);
  g.font = `400 112px "HanziPen TC", "Xingkai TC", "Kaiti TC", "STKaiti", ${HANZI_FONT}`;
  g.fillStyle = g.strokeStyle = '#16120f';
  g.lineWidth = 9; g.lineJoin = g.lineCap = 'round';   // a fat marker, not a pen
  g.shadowColor = 'rgba(0,0,0,0.25)'; g.shadowBlur = 2;
  g.strokeText('不', 0, 0);
  g.fillText('不', 0, 0);
  g.restore();
  const tex = texture(c);

  // the cloth hangs from its corners: the top edge sags between the ties, and it falls in soft folds
  const geo = new THREE.PlaneGeometry(W, H, 48, 10);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    const u = x / (W / 2), v = (y + H / 2) / H;   // -1…1 across, 0…1 up
    const sag = 0.035 * (1 - u * u);
    pos.setY(i, y - sag * v + sag * 0.4 * (1 - v));
    pos.setZ(i, Math.sin(x * 8.5) * 0.012 + Math.sin(x * 21 + 1) * 0.005 + (1 - u * u) * 0.01);
  }
  geo.computeVertexNormals();
  const banner = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, side: THREE.DoubleSide }));
  banner.position.set(0, Y, Z);
  banner.receiveShadow = true;
  scene.add(banner);
  // the ties: a short cord from each corner to the post beside it
  const cord = new THREE.MeshStandardMaterial({ color: 0xd8cfb8, roughness: 0.9 });
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    const from = new THREE.Vector3(sx * W / 2, Y + sy * H / 2 * (sy > 0 ? 1 : 0.95), Z);
    const to = new THREE.Vector3(sx * 1.95, from.y + 0.03 * sy, Z - 0.01);
    const len = from.distanceTo(to);
    const tie = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, len, 5), cord);
    tie.position.copy(from).add(to).multiplyScalar(0.5);
    tie.rotation.z = Math.PI / 2;
    scene.add(tie);
  }

  // a neon sign: the glowing tube drawn on a transparent plane (no mounting rails: they showed as dark bars)

  // NO, in red, over the left of the banner
  const [nc, ng] = canvas(640, 400);
  ng.font = `700 300px ${SIGN_FONT}`;
  ng.textAlign = 'center';
  ng.textBaseline = 'middle';
  neonText(ng, 'NO', 320, 210, '#ff2d3a', 22);
  const neon = glowing(texture(nc), 1.35);   // bright enough to be neon, not so bright the tube burns out white: you read the letters
  const no = new THREE.Mesh(new THREE.PlaneGeometry(0.9 * K, 0.56 * K), neon);
  no.position.set(-1.05 * K, Y + 0.1 * K, Z + 0.07);
  scene.add(no);
  const glow = new THREE.PointLight(0xff3040, 1.8, 4, 2);   // (less: at 3 it washed the banner pink)
  glow.position.set(-1.0 * K, Y, Z + 0.45);
  scene.add(glow);

  // "more", in jade script, squeezed in between NO and CASH, a little crooked: clearly added last
  const [mc, mg] = canvas(640, 300);
  mg.font = `400 170px ${SCRIPT_FONT}`;
  mg.textAlign = 'center';
  mg.textBaseline = 'middle';
  neonText(mg, 'more', 320, 150, '#2fe0a0', 13);
  const more = glowing(texture(mc), 1.0);   // likewise: the script stays legible
  const moreSign = new THREE.Mesh(new THREE.PlaneGeometry(1.1 * K, 0.52 * K), more);
  moreSign.position.set(-0.6 * K, Y - 0.17 * K, Z + 0.1);
  moreSign.rotation.z = 0.16;
  scene.add(moreSign);
  // (no light of its own: every light costs on every pixel, and the NO's red glow is enough for that corner)
  const moreGlow = new THREE.PointLight(0x2fe0a0, 0, 0.1);
  return { neon, more, glow, moreGlow };
}

/** TAP & PLAY 88, as an old Chinatown theatre sign: a dark-red panel edged in green neon, topped by a little
 *  pagoda roof in green neon with a spire, the words in red neon and a lucky 88 in gold */
function buildHanzi(scene: THREE.Scene): { mat: THREE.MeshBasicMaterial; light: THREE.PointLight } {
  const W = 420, H = 1360, top = 250, bottom = H - 70;
  const K = 2;   // drawn at twice the size, so the tubes stay crisp
  const [c, g] = canvas(W * K, H * K);
  g.scale(K, K);
  const green = '#2fd36a', red = '#ff3d2e', gold = '#ffad24';
  /** the core of a tube: its own colour, run toward white (not white: then every colour reads pastel) */
  const core = (col: string): string => {
    const n = parseInt(col.slice(1), 16);
    const mix = (v: number): number => Math.round(v + (255 - v) * 0.6);
    return `rgb(${mix(n >> 16)}, ${mix((n >> 8) & 255)}, ${mix(n & 255)})`;
  };
  /** a tube: a tight glow, the tube in its colour, and its bright core */
  const tube = (draw: () => void, col: string, width: number, text = false): void => {
    g.lineJoin = g.lineCap = 'round';
    g.shadowColor = col; g.shadowBlur = width * 2.6 * K; g.strokeStyle = col; g.lineWidth = width;
    if (text) draw(); else { g.beginPath(); draw(); g.stroke(); }
    g.shadowBlur = 0;
    if (text) draw(); else { g.beginPath(); draw(); g.stroke(); }
    g.strokeStyle = core(col); g.lineWidth = width * 0.38;
    if (text) draw(); else { g.beginPath(); draw(); g.stroke(); }
  };
  // the spire
  g.strokeStyle = '#8a8f99'; g.lineWidth = 6;
  g.beginPath(); g.moveTo(W / 2, 8); g.lineTo(W / 2, 112); g.stroke();
  g.fillStyle = '#8a8f99'; g.beginPath(); g.arc(W / 2, 12, 10, 0, Math.PI * 2); g.fill();
  // the panel: near black, a little green in it
  g.fillStyle = '#0a140e';
  g.beginPath(); g.roundRect(40, top, W - 80, bottom - top, 64); g.fill();
  // the roof: a finial; from its foot, the roof line sweeps out and down (concave, as a pagoda's does) to the
  // eave tips, which hook up; under it the eave runs straight across
  tube(() => {
    g.moveTo(W / 2, 108); g.lineTo(W / 2 - 34, 156); g.lineTo(W / 2 + 34, 156); g.closePath();
    g.moveTo(W / 2 - 34, 156); g.quadraticCurveTo(W / 2 - 110, 196, 18, 172);
    g.moveTo(W / 2 + 34, 156); g.quadraticCurveTo(W / 2 + 110, 196, W - 18, 172);
    g.moveTo(18, 172); g.quadraticCurveTo(26, 212, 70, 214); g.lineTo(W - 70, 214); g.quadraticCurveTo(W - 26, 212, W - 18, 172);
  }, green, 10);
  // the border: one fat tube, a thin one just inside it, and a loop at the foot
  tube(() => { g.roundRect(48, top + 8, W - 96, bottom - top - 16, 58); }, green, 13);
  tube(() => { g.roundRect(68, top + 28, W - 136, bottom - top - 56, 42); }, green, 4);
  tube(() => { g.moveTo(W / 2 - 64, bottom + 8); g.quadraticCurveTo(W / 2, bottom + 64, W / 2 + 64, bottom + 8); }, green, 10);
  // TAP & PLAY, in fat red tube
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const FACE = '"Avenir Next Condensed", "Futura", "Arial Narrow", sans-serif';
  const word = (t: string, y: number, size: number): void => {
    g.font = `500 ${size}px ${FACE}`;
    tube(() => g.strokeText(t, W / 2, y), red, 8, true);
  };
  word('TAP', top + 168, 156);
  word('&', top + 330, 140);
  word('PLAY', top + 490, 156);
  // 88: each eight two rings, crossed, each ring left open where the other passes over it, like bent tube
  const Y8 = top + 790;
  const ring = (x: number, y: number, r: number, gapAt: number): void => {
    tube(() => { g.arc(x, y, r, gapAt + 0.32, gapAt + Math.PI * 2 - 0.32); }, gold, 9);
  };
  for (const cx of [W / 2 - 58, W / 2 + 58]) {
    ring(cx + 8, Y8 - 48, 42, Math.PI * 0.62);    // the top ring, open toward the bottom one
    ring(cx - 4, Y8 + 46, 52, -Math.PI * 0.42);   // the bottom ring, open toward the top one
  }
  tube(() => {   // sparks: three off each top corner, two off the bottom left
    const ray = (x: number, y: number, a: number, l: number): void => { g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); };
    ray(W / 2 - 132, Y8 - 104, -2.2, 28); ray(W / 2 - 146, Y8 - 74, -2.75, 26); ray(W / 2 - 112, Y8 - 126, -1.75, 24);
    ray(W / 2 + 132, Y8 - 104, -0.94, 28); ray(W / 2 + 146, Y8 - 74, -0.39, 26); ray(W / 2 + 112, Y8 - 126, -1.39, 24);
    ray(W / 2 - 134, Y8 + 112, 2.4, 26); ray(W / 2 - 118, Y8 + 132, 2.0, 22);
  }, gold, 6);
  tube(() => { g.moveTo(W - 108, top + 92); g.lineTo(W - 96, top + 72); g.moveTo(W - 100, top + 110); g.lineTo(W - 80, top + 100); }, gold, 5);   // a glint by TAP
  const mat = glowing(texture(c), 1.9);   // bright enough to bloom; the tinted cores keep the colours from washing out
  mat.alphaTest = 0.05;
  mat.depthWrite = true;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5 * H / W), mat);
  sign.position.set(1.72, 1.5, -2.25);
  scene.add(sign);
  const glow = new THREE.PointLight(0xff5040, 3, 3, 2);   // one light for the sign (red, from the characters)
  glow.position.set(1.6, 1.6, -2.0);
  scene.add(glow);
  return { mat, light: glow };
}

// --- the stall -----------------------------------------------------------------------------------------------
function buildStall(scene: THREE.Scene): void {
  // the back: a dark red curtain, in folds
  const [c, g] = canvas(512, 64);
  for (let x = 0; x < 512; x++) {
    const f = 0.55 + 0.45 * Math.sin(x / 512 * Math.PI * 2 * 14) ** 2;
    g.fillStyle = `rgb(${Math.round(70 * f)}, ${Math.round(16 * f)}, ${Math.round(20 * f)})`;
    g.fillRect(x, 0, 1, 64);
  }
  const curtain = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.4), new THREE.MeshStandardMaterial({ map: texture(c), roughness: 0.95 }));
  curtain.position.set(0, 1.7, -4.96);
  curtain.receiveShadow = true;
  scene.add(curtain);

  // the frame: red-painted steel, worn
  const steel = new THREE.MeshStandardMaterial({ color: 0x7a2018, roughness: 0.55, metalness: 0.4 });
  for (const x of [-1.95, 1.95]) for (const z of [-1.7, -4.9]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.07, 2.7, 0.07), steel);
    post.position.set(x, 1.35, z);
    post.castShadow = true;
    scene.add(post);
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.08, 0.08), steel);
  beam.position.set(0, 2.66, -1.7);
  scene.add(beam);

  // the stall's name: a hanging sign, an old shop's (a picture: _source/signs/lucky88.png, its black keyed out to
  // transparent, the neon's glow kept as soft alpha). A cloud-shaped plaque in a red frame with an orange neon tube,
  // rivets, a little wear, hung on two copper straps. LUCKY 88, opened this year and already pretending to be old.
  {
    const W = 1.26, ASPECT = 1932 / 688;   // metres wide; the picture's shape
    const map = new THREE.TextureLoader().load('/play/no-cash-only/lucky88.webp');
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;
    const mat = new THREE.MeshBasicMaterial({ map, transparent: true, toneMapped: false, depthWrite: false, fog: false });
    mat.color.setScalar(1.15);   // lit from inside, and the neon bright enough to bloom
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(W, W / ASPECT), mat);
    sign.position.set(0, 2.19, -1.34);   // its arch a little under the top of the view (2.4 m up, here)
    sign.renderOrder = 2;
    scene.add(sign);
    // the picture's two straps stop at its top edge: they go on up, past the top of the view, to the frame
    const top = sign.position.y + W / ASPECT / 2;
    const copper = new THREE.MeshBasicMaterial({ color: 0x8a3216, toneMapped: false, fog: false });   // the picture's own copper, lit as it is, so they match
    for (const u of [0.2257, 0.7812]) {   // where the straps are, across the picture (measured off it)
      const strap = new THREE.Mesh(new THREE.PlaneGeometry(W * 33 / 1932, 0.6), copper);   // as wide as the picture's: 33 px
      strap.position.set((u - 0.5) * W, top + 0.3 - 0.002, -1.3405);
      scene.add(strap);
    }
    const halo = new THREE.PointLight(0xff8a3a, 0.7, 2.0, 2);   // its light on the awning and banner
    halo.position.set(0, 2.3, -1.15);
    scene.add(halo);
  }

  // a striped awning over the front of the stall, red and cream, with a scalloped edge: it frames the top of
  // the view (from where you stand, the top of the view is about 2.1 m up at the stall's front)
  {
    const [ac, ag] = canvas(1024, 160);
    const stripes = 22;
    for (let i = 0; i < stripes; i++) {
      ag.fillStyle = i % 2 ? '#efe4cc' : '#b8231d';
      ag.fillRect((i * 1024) / stripes, 0, 1024 / stripes + 1, 160);
    }
    // the scallops: each stripe ends in a half circle
    ag.globalCompositeOperation = 'destination-out';
    ag.fillRect(0, 120, 1024, 40);
    ag.globalCompositeOperation = 'destination-over';
    ag.globalCompositeOperation = 'source-over';
    const w = 1024 / stripes;
    for (let i = 0; i < stripes; i++) {
      ag.fillStyle = i % 2 ? '#efe4cc' : '#b8231d';
      ag.beginPath();
      ag.arc(i * w + w / 2, 120, w / 2, 0, Math.PI);
      ag.fill();
    }
    const tex = texture(ac);
    const valance = new THREE.Mesh(new THREE.PlaneGeometry(4.3, 0.3), new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.5, roughness: 0.8, side: THREE.DoubleSide }));
    valance.position.set(0, 2.42, -1.42);
    scene.add(valance);
    // the canopy itself, sloping back up from the valance
    const [cc, cg] = canvas(1024, 32);
    for (let i = 0; i < stripes; i++) { cg.fillStyle = i % 2 ? '#d9cdb2' : '#9c1c17'; cg.fillRect((i * 1024) / stripes, 0, 1024 / stripes + 1, 32); }
    const canopy = new THREE.Mesh(new THREE.PlaneGeometry(4.3, 1.4), new THREE.MeshStandardMaterial({ map: texture(cc), roughness: 0.85, side: THREE.DoubleSide }));
    canopy.rotation.x = Math.PI / 2 - 0.32;
    canopy.position.set(0, 2.77, -2.08);
    scene.add(canopy);
  }

  // red lanterns at the front corners (off for now: with the neon signs, too much)
  const LANTERNS = false;
  const lanternMat = new THREE.MeshStandardMaterial({ color: 0xc8261e, emissive: 0xff3a1a, emissiveIntensity: 0.9, roughness: 0.6 });
  const capMat = new THREE.MeshStandardMaterial({ color: 0x6a5420, roughness: 0.3, metalness: 0.8 });
  for (const x of LANTERNS ? [-1.85, 1.85] : []) {
    const l = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 16), lanternMat);
    body.scale.y = 0.8;
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 16), capMat);
    top.position.y = 0.13;
    const bottom = top.clone();
    bottom.position.y = -0.13;
    l.add(body, top, bottom);
    l.position.set(x, 2.02, -1.78);
    l.userData.sway = x;
    l.name = 'lantern';
    scene.add(l);
  }
}

/** a paper lantern by the owner, as a Chinatown shop hangs at its door: a ribbed barrel of warm-lit paper with
 *  李記 down it in red, dark lids top and bottom, hung on a cord. It glows and sways a little. */
function buildPaperLantern(scene: THREE.Scene, at: THREE.Vector3): void {
  const H = 0.24, R = 0.115;   // small, and nearly round
  // the paper: warm, brighter in the middle, a rib every few cm, the name down the front (twice round, so it
  // faces you whichever way it turns)
  const [c, g] = canvas(1024, 512);
  const warm = g.createLinearGradient(0, 0, 0, 512);
  warm.addColorStop(0, '#d98a4a'); warm.addColorStop(0.5, '#ffe2b0'); warm.addColorStop(1, '#d98a4a');
  g.fillStyle = warm; g.fillRect(0, 0, 1024, 512);
  g.strokeStyle = 'rgba(150,70,30,0.45)'; g.lineWidth = 3;
  for (let y = 16; y < 512; y += 22) { g.beginPath(); g.moveTo(0, y); g.lineTo(1024, y); g.stroke(); }
  g.strokeStyle = 'rgba(160,40,20,0.5)'; g.lineWidth = 5;
  for (let x = 0; x < 1024; x += 128) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 512); g.stroke(); }   // the red ribs down it
  g.fillStyle = '#8e1209';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `900 150px ${HANZI_FONT}`;
  // the paper goes once round (2 pi R) across the canvas but only H down it: squeeze the characters across by as
  // much, so on the lantern they're square, not stretched wide
  const kx = (1024 / (2 * Math.PI * R)) / (512 / H);
  for (const u of [0.25, 0.75]) {
    g.save(); g.translate(u * 1024, 0); g.scale(kx, 1);
    g.fillText('李', 0, 170); g.fillText('記', 0, 350);
    g.restore();
  }
  const map = texture(c);
  // the barrel: a lathe, round at both ends
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24, y = (t - 0.5) * H;
    pts.push(new THREE.Vector2(R * (0.45 + 0.55 * Math.sqrt(Math.sin(t * Math.PI))), y));   // full in the middle, quick to round off
  }
  const paper = new THREE.MeshStandardMaterial({ map, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: 0.45, roughness: 0.9, side: THREE.DoubleSide });   // (lit from inside, but not so it blows out)
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 48), paper);
  const wood = new THREE.MeshStandardMaterial({ color: 0x3a2116, roughness: 0.6, metalness: 0.2 });
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.66, R * 0.66, 0.035, 32), wood);
  lid.position.y = H / 2 + 0.012;
  const foot = lid.clone();
  foot.position.y = -H / 2 - 0.012;
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.3, 6), new THREE.MeshStandardMaterial({ color: 0x2a1a12 }));
  cord.position.y = H / 2 + 0.17;
  const l = new THREE.Group();
  l.add(body, lid, foot, cord);
  l.position.copy(at);
  l.rotation.y = -Math.PI / 2 + 0.12;   // the name toward you
  l.name = 'lantern';
  l.userData.sway = 0.7;
  scene.add(l);
  const light = new THREE.PointLight(0xffb070, 0.9, 2.0, 2);   // warm light on her and the stand
  light.position.copy(at);   // inside it: lights the street round it, not its own paper
  scene.add(light);
}

/** strings of bare bulbs across the stall, front to back, each sagging a little; and the light they give */
function buildBulbs(scene: THREE.Scene): { strings: THREE.MeshBasicMaterial[][]; light: THREE.PointLight } {
  // each bulb its own material, so they can come on one at a time in the opening (a string, left to right)
  const strings: THREE.MeshBasicMaterial[][] = [];
  const wire = new THREE.MeshBasicMaterial({ color: 0x111111 });
  const geo = new THREE.SphereGeometry(0.038, 14, 10);
  // the front string just under the awning, in view; two more further in, above the frame, for their light
  for (const [z, y, s] of [[-1.5, 2.24, 0.04], [-3.0, 2.8, 0.14], [-4.3, 2.95, 0.14]]) {
    const pts: THREE.Vector3[] = [], row: THREE.MeshBasicMaterial[] = [];
    strings.push(row);
    for (let i = 0; i <= 13; i++) {
      const x = -1.95 + i * 0.3, sag = Math.sin((i / 13) * Math.PI) * s;
      pts.push(new THREE.Vector3(x, y - sag, z));
      if (i > 0 && i < 13) {
        const bulb = new THREE.MeshBasicMaterial({ toneMapped: false, fog: false });
        bulb.color.copy(BULB_ON);
        row.push(bulb);
        const b = new THREE.Mesh(geo, bulb);
        b.position.set(x, y - sag - 0.05, z);
        scene.add(b);
      }
    }
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.004, 4), wire));
  }
  // the light the bulbs give, as one warm light over the middle of the stall (the display spot does the rest)
  const p = new THREE.PointLight(0xffb066, 5, 7, 1.6);
  p.position.set(0, 2.25, -2.6);
  scene.add(p);
  return { strings, light: p };
}
const BULB_ON = new THREE.Color(0xffc27a).multiplyScalar(3.2);

// --- the street ----------------------------------------------------------------------------------------------
/** made-up shops (no real names): the shop signs along the street */
const SHOPS: { zh: string; en: string; color: string }[] = [
  { zh: '李記燒臘', en: 'LEE KEE BBQ', color: '#ff4a3a' },
  { zh: '思曼茶行', en: 'SIMAN TEA CO.', color: '#2fe0a0' },
  { zh: '曼記麵家', en: 'NOODLES', color: '#ffb347' },
  { zh: '金福餅家', en: 'BAKERY', color: '#ff5fa2' },
];

/** a row of old tenements along one side of the street, as on Mott St: four buildings, each its own brick or
 *  paint, a shop on the ground floor (lit, or shuttered for the night) under a painted fascia, two floors of
 *  windows above (some lit warm, one with a TV on, most dark), sills and ledges, a cornice on top, and iron fire
 *  escapes and air conditioners hung off the front. Only the windows give light. */
function buildFronts(scene: THREE.Scene, side: -1 | 1): void {
  const L = 12, H = 8, BAY = 3;
  const [c, g] = canvas(2048, 1365);       // the colour
  const [ec, eg] = canvas(2048, 1365);     // what glows: the lit glass only
  const pm = c.width / L;                  // px a metre
  const X = (u: number): number => u * pm, Y = (m: number): number => c.height - m * pm;   // metres along, up
  eg.fillStyle = '#000'; eg.fillRect(0, 0, ec.width, ec.height);
  const lit: [number, number, number, number][] = [];   // glass that gives light: copied, as drawn, to the glow map
  const WALLS = ['#5a2a22', '#3d3a3e', '#6b5a48', '#4a2622', '#2f3b3a', '#5c3a2c'];
  const FASCIA = ['#1f6b4a', '#8e1e18', '#1c2b52', '#b98a2a', '#2a2a2a'];
  const NAMES = ['永興', '華記', '新世界', '大利', '同昌', '福滿'];
  /** a window at (u, m), w by h metres: lit warm, a TV's blue, or dark with the street in it */
  const pane = (u: number, m: number, w: number, h: number, kind: number): void => {
    const x = X(u), y = Y(m + h), pw = w * pm, ph = h * pm;
    g.fillStyle = '#d8d0c0'; g.fillRect(x - 5, y - 5, pw + 10, ph + 10);   // the frame, painted
    g.fillStyle = '#9a8e7a'; g.fillRect(x - 8, Y(m) + 2, pw + 16, 8);       // the sill
    if (kind < 0.45) {
      const warm = g.createLinearGradient(x, y, x, y + ph);
      warm.addColorStop(0, '#ffcf8a'); warm.addColorStop(1, '#c47a3a');
      g.fillStyle = warm; g.fillRect(x, y, pw, ph);
      g.fillStyle = 'rgba(120,40,20,0.55)';                                   // a curtain half drawn
      g.fillRect(kind < 0.2 ? x : x + pw * 0.55, y, pw * 0.45, ph);
      lit.push([x, y, pw, ph]);
    } else if (kind < 0.55) {
      g.fillStyle = '#6f9ed8'; g.fillRect(x, y, pw, ph);
      lit.push([x, y, pw, ph]);
    } else {
      const dark = g.createLinearGradient(x, y, x + pw, y + ph);
      dark.addColorStop(0, '#2a3346'); dark.addColorStop(1, '#0e1118');
      g.fillStyle = dark; g.fillRect(x, y, pw, ph);
    }
    g.fillStyle = '#d8d0c0';                                                  // the sashes
    g.fillRect(x, y + ph / 2 - 3, pw, 6);
    g.fillRect(x + pw / 2 - 2, y, 4, ph);
  };
  for (let b = 0; b < L / BAY; b++) {
    const u0 = b * BAY;
    // the wall: brick in its own colour, a little uneven
    g.fillStyle = WALLS[Math.floor(rand() * WALLS.length)];
    g.fillRect(X(u0), 0, X(BAY) + 1, c.height);
    for (let y = 0; y < c.height; y += 9) for (let x = X(u0) + ((y / 9) % 2 ? 0 : 10); x < X(u0 + BAY); x += 21) {
      g.fillStyle = `rgba(${rand() < 0.5 ? '0,0,0' : '255,220,190'},${0.04 + rand() * 0.08})`;
      g.fillRect(x, y, 19, 7);
    }
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(X(u0) - 2, 0, 4, c.height);   // where one building meets the next
    // the cornice, and a ledge at each floor
    g.fillStyle = '#2a2420'; g.fillRect(X(u0), Y(8), X(BAY), 0.35 * pm);
    g.fillStyle = 'rgba(0,0,0,0.4)';
    for (const m of [3.15, 5.55]) g.fillRect(X(u0), Y(m + 0.12), X(BAY), 0.12 * pm);
    // the shop: a fascia with its name, and a window lit from inside with shelves in it, or a roller shutter
    g.fillStyle = FASCIA[Math.floor(rand() * FASCIA.length)];
    g.fillRect(X(u0 + 0.15), Y(3.05), X(BAY - 0.3), 0.5 * pm);
    g.fillStyle = '#f2e6c8';
    g.font = `700 ${Math.round(0.36 * pm)}px ${HANZI_FONT}`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(NAMES[Math.floor(rand() * NAMES.length)], X(u0 + BAY / 2), Y(2.8));
    const sx = X(u0 + 0.3), sy = Y(2.45), sw = X(BAY - 0.6), sh = 2.25 * pm;
    if (b === (side < 0 ? 1 : 2)) {
      g.fillStyle = '#2a2d33'; g.fillRect(sx, sy, sw, sh);
      g.fillStyle = 'rgba(0,0,0,0.5)';
      for (let y = sy; y < sy + sh; y += 9) g.fillRect(sx, y, sw, 2);
      g.fillStyle = 'rgba(200,200,200,0.25)'; g.font = `700 ${Math.round(0.3 * pm)}px ${SIGN_FONT}`;
      g.fillText('CLOSED', sx + sw / 2, sy + sh * 0.5);
    } else {
      const warm = rand() < 0.9;   // nearly all warm: a cold-lit noodle shop looks shut
      const shop = g.createLinearGradient(0, sy, 0, sy + sh);
      shop.addColorStop(0, warm ? '#a87a4a' : '#5a7088');
      shop.addColorStop(1, warm ? '#2e170b' : '#111b27');
      g.fillStyle = shop; g.fillRect(sx, sy, sw, sh);
      lit.push([sx, sy, sw, sh]);
      // a noodle shop inside: menu cards along the top, roast ducks on a rail, steamers and bowls on the counter
      const DISHES = ['雲吞麵', '叉燒飯', '燒鴨', '牛腩麵', '炒河粉', '蝦餃', '燒賣', '白粥', '油條', '奶茶'];
      const top = sy + sh * 0.22, cards = 5, cw = sw / cards;
      for (let k = 0; k < cards; k++) {
        const x = sx + k * cw + 5;
        g.fillStyle = k % 2 ? '#e9dcb8' : '#f0d24a';
        g.fillRect(x, top, cw - 10, sh * 0.2);
        g.fillStyle = '#a3241a'; g.font = `700 ${Math.round(cw * 0.22)}px "Songti TC", "STSong", serif`;
        g.textAlign = 'center';
        g.fillText(DISHES[Math.floor(rand() * DISHES.length)], x + (cw - 10) / 2, top + sh * 0.09);
        g.fillStyle = '#222'; g.font = `600 ${Math.round(cw * 0.15)}px ${SIGN_FONT}`;
        g.fillText(`$${(6 + Math.floor(rand() * 9))}.${rand() < 0.5 ? '50' : '95'}`, x + (cw - 10) / 2, top + sh * 0.17);
      }
      const rail = top + sh * 0.27;
      g.fillStyle = '#3a2a1e'; g.fillRect(sx, rail, sw, 4);
      for (let x = sx + 18; x < sx + sw * 0.7; x += 26 + rand() * 14) {   // roast ducks, hung by the neck
        g.strokeStyle = '#3a2a1e'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(x, rail); g.lineTo(x, rail + 10); g.stroke();
        const duck = g.createRadialGradient(x - 3, rail + 26, 2, x, rail + 30, 18);
        duck.addColorStop(0, '#d8823a'); duck.addColorStop(1, '#6e2a0e');
        g.fillStyle = duck;
        g.beginPath(); g.ellipse(x, rail + 30, 9, 20, 0, 0, Math.PI * 2); g.fill();
      }
      const counter = sy + sh * 0.78;   // the counter, and on it steamer baskets and bowls
      g.fillStyle = '#4a2a18'; g.fillRect(sx, counter, sw, 7);
      for (let x = sx + 14; x < sx + sw - 20; x += 30 + rand() * 16) {
        if (rand() < 0.5) {
          for (let s = 0; s < 2; s++) { g.fillStyle = s ? '#c9a46a' : '#a8834e'; g.fillRect(x - 13, counter - 10 - s * 10, 26, 9); }
        } else {
          g.fillStyle = '#f2ece0';
          g.beginPath(); g.ellipse(x, counter - 6, 13, 7, 0, 0, Math.PI); g.fill();
          g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x - 1, counter - 26, 2, 14);   // steam
        }
      }
      g.fillStyle = '#1e1612';   // the frame: mullions, a transom, the door, a panel under the glass
      for (let x = sx; x <= sx + sw; x += sw / 4) g.fillRect(x - 4, sy, 8, sh);
      g.fillRect(sx, sy, sw, 8);
      g.fillRect(sx, sy + sh * 0.18, sw, 6);
      g.fillRect(sx, sy + sh - 0.45 * pm, sw * 0.75, 0.45 * pm);
      g.fillStyle = 'rgba(255,255,255,0.08)';   // the street, faintly, in the glass
      g.beginPath(); g.moveTo(sx, sy + sh * 0.2); g.lineTo(sx + sw * 0.35, sy + sh * 0.2); g.lineTo(sx + sw * 0.15, sy + sh); g.lineTo(sx, sy + sh); g.fill();
    }
    // two floors of windows, two to a floor
    for (const m of [3.8, 6.2]) for (const du of [0.5, 1.7]) pane(u0 + du, m, 0.8, 1.35, rand());
  }
  for (const [x, y, w, h] of lit) eg.drawImage(c, x, y, w, h, x, y, w, h);
  const map = texture(c);
  const front = new THREE.Mesh(new THREE.PlaneGeometry(L, H), new THREE.MeshStandardMaterial({
    map, bumpMap: map, bumpScale: 1.2, emissive: 0xffffff, emissiveMap: texture(ec), emissiveIntensity: 0.06, roughness: 0.85, color: 0x404040,   // the street stays dim, so the stall reads first
  }));
  front.rotation.y = -side * Math.PI / 2;
  front.position.set(side * 4.2, H / 2, -2.5 - L / 2);
  scene.add(front);

  // what hangs off the front: ledges and a cornice that stand out from it, fire escapes, air conditioners
  const zOf = (u: number): number => (side < 0 ? -2.5 - u : -14.5 + u);   // along the wall, to the street's z
  const xAt = (d: number): number => side * (4.2 - d);                      // d metres out from the wall
  const stone = new THREE.MeshStandardMaterial({ color: 0x161210, roughness: 0.8 });
  for (const [m, d, h] of [[8, 0.3, 0.3], [5.55, 0.1, 0.08], [3.15, 0.12, 0.1]] as const) {
    const ledge = new THREE.Mesh(new THREE.BoxGeometry(d * 2, h, L), stone);
    ledge.position.set(xAt(0), m, -2.5 - L / 2);
    scene.add(ledge);
  }
  const iron = new THREE.MeshStandardMaterial({ color: 0x1a1c20, roughness: 0.6, metalness: 0.6 });
  // a railing as one plane of bars (alpha cut), and a ladder the same way
  const bars = (w: number, rungs: boolean): THREE.MeshStandardMaterial => {
    const [bc, bg] = canvas(256, 128);
    bg.fillStyle = '#fff';
    bg.fillRect(0, 0, 256, 6); bg.fillRect(0, 122, 256, 6);
    if (rungs) { bg.fillRect(0, 0, 10, 128); bg.fillRect(246, 0, 10, 128); for (let y = 16; y < 128; y += 22) bg.fillRect(0, y, 256, 6); }
    else for (let x = 0; x < 256; x += 256 / Math.round(w / 0.12)) bg.fillRect(x, 0, 4, 128);
    const t = new THREE.CanvasTexture(bc);
    return new THREE.MeshStandardMaterial({ color: 0x1a1c20, alphaMap: t, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6, metalness: 0.6 });
  };
  const rail = bars(2.4, false), ladder = bars(0.45, true);
  const box = new THREE.MeshStandardMaterial({ color: 0x3a3c3a, roughness: 0.7, metalness: 0.3 });
  for (let b = 0; b < L / BAY; b++) {
    const u0 = b * BAY, zc = zOf(u0 + BAY / 2);
    if ((b + (side < 0 ? 0 : 1)) % 2 === 0) {   // every other building has a fire escape
      for (const m of [3.75, 6.15]) {
        const deck = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 2.5), iron);
        deck.position.set(xAt(0.7), m, zc);
        const front2 = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.9), rail);
        front2.rotation.y = Math.PI / 2;
        front2.position.set(xAt(1.4), m + 0.45, zc);
        scene.add(deck, front2);
        for (const e of [-1, 1]) {
          const end = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.9), rail);
          end.position.set(xAt(0.7), m + 0.45, zc + e * 1.25);
          scene.add(end);
        }
      }
      const step = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 2.6), ladder);   // the ladder between the two
      step.rotation.set(0, Math.PI / 2, side * 0.42);
      step.position.set(xAt(0.95), 4.95, zc + 0.5);
      scene.add(step);
    } else {   // air conditioners in the windows
      for (const [du, m] of [[0.9, 3.65], [2.1, 6.05]] as const) {
        const ac = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.36, 0.55), box);
        ac.position.set(xAt(0.22), m, zOf(u0 + du));
        scene.add(ac);
      }
    }
  }

  // over the windows: a green tiled eave on one side, striped awnings on the other
  if (side < 0) {
    const tile = new THREE.MeshStandardMaterial({ color: 0x0e3a27, roughness: 0.35, metalness: 0.2 });
    const eave = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 7), tile);
    eave.position.set(side * 3.98, 2.15, -6.5);
    eave.rotation.z = side * -0.35;
    scene.add(eave);
    const trim = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 7), new THREE.MeshStandardMaterial({ color: 0x6a5420, roughness: 0.3, metalness: 0.8 }));
    trim.position.set(side * 3.75, 2.05, -6.5);
    scene.add(trim);
  } else {
    const [ac, ag] = canvas(64, 8);
    for (let i = 0; i < 8; i++) { ag.fillStyle = i % 2 ? '#e9e2d0' : '#2f6e4e'; ag.fillRect(i * 8, 0, 8, 8); }
    const at = texture(ac);
    at.wrapS = THREE.RepeatWrapping;
    at.repeat.set(6, 1);
    const awning = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.9), new THREE.MeshStandardMaterial({ map: at, color: 0x555555, roughness: 0.8, side: THREE.DoubleSide }));
    awning.rotation.set(0, -Math.PI / 2, 0.5);
    awning.position.set(3.9, 2.15, -7);
    scene.add(awning);
  }

  // blade signs sticking out over the street, facing you
  for (let i = 0; i < 2; i++) {
    // on the right, the nearest is a picture too: three paper lanterns, 點心屋, on an iron bracket
    if (side > 0 && i === 0) {
      const w = 0.34, aspect = 932 / 302;   // further back down the street than it was, so a little bigger to hold its size
      const map = new THREE.TextureLoader().load('/play/no-cash-only/sign-dimsum.webp');
      map.colorSpace = THREE.SRGBColorSpace;
      map.anisotropy = 8;
      const mat = glowing(map, 0.62);   // dimmer than the left's, and in the night's haze: background, not a sign to read
      Object.assign(mat, { alphaTest: 0.05, depthWrite: true, fog: true });
      const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, w * aspect), mat);
      pic.position.set(2.95, 1.6, -4.6);
      scene.add(pic);
      continue;
    }
    // on the left, both signs are pictures (_source/signs/side-signs.png, the black keyed out): 李記麵屋 on a
    // bulb-lit frame nearest, and 思曼麵包房 in green and gold behind the owner
    if (side < 0) {
      const [file, w, aspect] = i === 0 ? ['sign-li', 0.42, 940 / 360] : ['sign-siman', 0.4, 889 / 315];
      const map = new THREE.TextureLoader().load(`/play/no-cash-only/${file}.webp`);
      map.colorSpace = THREE.SRGBColorSpace;
      map.anisotropy = 8;
      const mat = glowing(map, 1.05);
      Object.assign(mat, { alphaTest: 0.05, depthWrite: true });
      const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, w * aspect), mat);
      pic.position.set(i === 0 ? -3.6 : -3.7, i === 0 ? 1.6 : 1.55, i === 0 ? -5.2 : -8.6);
      scene.add(pic);
      continue;
    }
    const shop = SHOPS[(side < 0 ? 0 : 2) + i];
    // like the shop signs on Yaowarat Road: one lit box to each character, stacked, a crest on top
    const n = [...shop.zh].length, box = 150, gap = 10, crest = 110;
    const [sc, sg] = canvas(200, crest + n * (box + gap) + 60);
    sg.fillStyle = '#f2e7cf';
    sg.beginPath(); sg.moveTo(100, 10); sg.lineTo(150, crest - 20); sg.lineTo(50, crest - 20); sg.closePath(); sg.fill();
    sg.fillStyle = shop.color;
    sg.beginPath(); sg.arc(100, crest - 46, 16, 0, Math.PI * 2); sg.fill();
    sg.font = `700 104px ${HANZI_FONT}`;
    sg.textAlign = 'center';
    sg.textBaseline = 'middle';
    [...shop.zh].forEach((ch, k) => {
      const y = crest + k * (box + gap);
      sg.fillStyle = '#1f8a5a';
      sg.fillRect(18, y, 164, box);
      sg.fillStyle = '#f6ecd6';
      sg.fillRect(28, y + 10, 144, box - 20);
      sg.fillStyle = '#c4231c';
      sg.fillText(ch, 100, y + box / 2 + 4);
    });
    sg.font = `700 22px ${SIGN_FONT}`;
    sg.fillStyle = '#f6ecd6';
    sg.fillText(shop.en, 100, crest + n * (box + gap) + 28);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.36 * sc.height / sc.width), glowing(texture(sc), 1.15));
    Object.assign(sign.material, { alphaTest: 0.05, depthWrite: true });
    sign.position.set(side * (3.75 - i * 0.05), 1.55 - i * 0.1, -5.2 - i * 3.4);
    scene.add(sign);
  }
}

/** steam rising from the street, off to the left */
function buildSteam(scene: THREE.Scene): THREE.Sprite[] {
  const [c, g] = canvas(64, 64);
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,0.5)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
  const map = texture(c);
  const puffs: THREE.Sprite[] = [];
  for (let i = 0; i < 14; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map, color: 0xb8c4dd, transparent: true, depthWrite: false, opacity: 0 }));
    s.userData.phase = i / 14;
    scene.add(s);
    puffs.push(s);
  }
  return puffs;
}

/** a soft night for things to reflect: the bulbs above, the neon either side, the blue street beyond */
function buildEnvironment(renderer: THREE.WebGLRenderer, scene: THREE.Scene): void {
  const env = new THREE.Scene();
  env.background = new THREE.Color(NIGHT);
  const panel = (color: number, strength: number, w: number, h: number, pos: [number, number, number]): void => {
    const m = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
    m.color.set(color).multiplyScalar(strength);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
    p.position.set(...pos);
    p.lookAt(0, 0, 0);
    env.add(p);
  };
  panel(0xffb066, 6, 6, 0.4, [0, 4, -1]);    // the bulbs
  panel(0xff2d3a, 3, 1.5, 1, [-3, 1.5, -2]);  // red neon
  panel(0x2fe0a0, 2.5, 1, 1.5, [3, 1.5, -1]); // jade neon
  panel(0x3a5aa0, 1, 8, 3, [0, 1, 5]);       // the street behind you
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(env, 0.04).texture;
  scene.environmentIntensity = 0.55;
  pmrem.dispose();
}

// --- all of it ------------------------------------------------------------------------------------------------
export interface World {
  /** each frame: neon flicker, lanterns swaying, steam */
  update(t: number, dt: number): void;
  /** a ring knocked the TAP & PLAY sign: it stutters */
  jolt(): void;
  /** the opening: how far into it we are (s), from the moment you step in. The stall is dark, and its lights come on
   *  one after another (LIGHT_UP): the hanzi sign, the bulbs along each string, then the neon NO stutters on and the
   *  "more" is written in, and the whole street comes up. Past about 3 s it is all there. */
  title(t: number): void;
  /** the choosing: how far the stall's own lights are let down (0 none, 1 all the way the choosing takes them), so
   *  the two spotlights on the cash tin and the card reader (pay.ts) stand out */
  stage(k: number): void;
}

/** when each of the stall's lights comes on in the opening (s after you step in); main.ts plays their sounds then */
export const LIGHT_UP = {
  hanzi: 0.85,                          // the hanzi sign flickers on (for 0.3 s), as the black finishes going
  bulbs: [1.3, 2.05] as const,          // the front string, left to right; the ones further in just after
  neon: [2.15, 2.7] as const,           // the NO stutters on
  more: [2.8, 3.2] as const,            // the "more" is written in
  full: [1.2, 3.0] as const,            // the stall's own light (and the whole picture) comes up over this
};
/** each bulb's switchings in the opening, string by string (front first), 12 to a string: times (s) it goes on,
 *  off, on… Not in a row: each at its own moment in LIGHT_UP.bulbs, and about one in three catches badly, blinking
 *  off once or twice before it holds. The strings further in a little later. Always the same (seeded) */
export const BULB_SWITCHES: number[][][] = (() => {
  let seed = 88;
  const r = (): number => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const [b0, b1] = LIGHT_UP.bulbs;
  return [0, 1, 2].map((row) => Array.from({ length: 12 }, () => {
    const at = b0 + row * 0.15 + r() ** 0.8 * (b1 - b0);
    const times = [at];
    if (r() < 0.35) {   // a bad contact: off again, and back
      let t = at;
      for (let k = r() < 0.4 ? 2 : 1; k > 0; k--) { t += 0.04 + r() * 0.08; times.push(t); t += 0.05 + r() * 0.15; times.push(t); }
    }
    return times;
  }));
})();
const smooth = (a: number, b: number, t: number): number => { const k = Math.min(1, Math.max(0, (t - a) / (b - a))); return k * k * (3 - 2 * k); };

export function buildWorld(scene: THREE.Scene, renderer: THREE.WebGLRenderer): World {
  scene.background = new THREE.Color(NIGHT);
  scene.fog = new THREE.FogExp2(NIGHT, 0.05);
  buildEnvironment(renderer, scene);

  scene.add(new THREE.HemisphereLight(0x3a4f8a, 0x0a0a12, 0.55));
  // the bulbs, as one light that casts the shadows
  const key = new THREE.DirectionalLight(0xffc68a, 0.8);
  key.position.set(0.8, 5, -2);
  key.target.position.set(0, 0, -3.2);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);   // over a tight box round the stall
  Object.assign(key.shadow.camera, { left: -2.4, right: 2.4, top: 2.4, bottom: -2.4, near: 1, far: 9 });
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.02;   // no dark blotches where a curved surface shadows itself (faces, the plush)
  key.shadow.radius = 4;
  scene.add(key, key.target);
  // a display light over the prizes, like a shop window: warm white, soft-edged, from above and in front, so the
  // prizes stand out from the dark cloth
  const show = new THREE.SpotLight(0xfff0dc, 10, 7, 0.6, 0.6, 1.6);
  show.position.set(0, 3.3, -2.0);   // behind the LUCKY 88 lightbox, so it lights the prizes and not the sign
  show.target.position.set(0, 0.3, -3.3);
  scene.add(show, show.target);
  // cool light from the street behind you, on the faces of things
  const street = new THREE.DirectionalLight(0x6f8fd8, 0.5);
  street.position.set(-2, 2, 4);
  scene.add(street);

  // the street: wet asphalt
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: 0x15171d, roughness: 0.22, metalness: 0.1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.001;
  ground.receiveShadow = true;
  scene.add(ground);

  buildStall(scene);
  const bulbs = buildBulbs(scene);
  const BULB_LIGHT = bulbs.light.intensity, KEY = key.intensity, SHOW = show.intensity;
  const { neon, more, glow, moreGlow } = buildSign(scene);
  let titleT = 99;
  const { mat: hanzi, light: hanziGlow } = buildHanzi(scene);
  // buildPaperLantern(scene, new THREE.Vector3(-1.78, 1.95, -1.95));   // by the owner, on the far side of her from the stage (off for now, to see it without)
  const HANZI_LIGHT = hanziGlow.intensity;
  buildFronts(scene, -1);
  buildFronts(scene, 1);
  const steam = buildSteam(scene);
  const lanterns = scene.children.filter((o) => o.name === 'lantern');

  const NEON = neon.color.r, MORE = more.color.r, HANZI = hanzi.color.r;
  let flickerUntil = 0;
  // the TAP & PLAY sign is on a tired transformer: now and then a faint dip, and a real stutter when it's knocked
  let dipUntil = 0, joltUntil = 0, now = 0, staged = 0;
  return {
    title(t) { titleT = t; },
    jolt() { joltUntil = now + 0.45; },
    stage(k) { staged = k; },
    update(t, dt) {
      // the NO is an old tube: now and then it stutters
      if (t > flickerUntil && Math.random() < dt * 0.25) flickerUntil = t + 0.35 + Math.random() * 0.4;
      const on = t > flickerUntil || Math.sin(t * 90) > 0.2;
      // the opening (LIGHT_UP): dark, then the NO stutters on, then the "more" is written in
      const [n0, n1] = LIGHT_UP.neon, [m0, m1] = LIGHT_UP.more;
      const lit = titleT >= n1 ? 1 : titleT < n0 ? 0 : (Math.sin(titleT * 70) > 0.1 && Math.sin(titleT * 23) > -0.6 ? 1 : 0);
      neon.color.setScalar((on ? NEON : NEON * 0.12) * lit);
      glow.intensity = 1.8 * lit;
      const moreLit = titleT >= m1 ? 1 : titleT < m0 ? 0 : (Math.sin(titleT * 55 + 1) > 0 ? 1 : 0);
      more.color.setScalar(MORE * moreLit);
      moreGlow.intensity = 1.2 * moreLit;
      now = t;
      if (t > dipUntil + 2 && Math.random() < dt * 0.12) dipUntil = t + 0.08 + Math.random() * 0.18;
      let level = 0.96 + Math.sin(t * 2.1) * 0.03;
      if (t < dipUntil) level *= 0.82 + Math.random() * 0.1;                                  // brownout: very slight
      if (t < joltUntil) level *= Math.sin(t * 95) > 0.15 ? 1.05 : Math.random() < 0.5 ? 0.15 : 0.55;   // knocked: off-on-off
      // the hanzi sign: off, a quick stutter, on
      const h0 = LIGHT_UP.hanzi, hanziLit = titleT >= h0 + 0.3 ? 1 : titleT < h0 ? 0 : (Math.sin(titleT * 80) > 0.3 ? 0.9 : 0.1);
      hanzi.color.setScalar(HANZI * level * hanziLit);
      hanziGlow.intensity = HANZI_LIGHT * level * hanziLit;
      // the bulbs: each at its own moment, some blinking before they hold (BULB_SWITCHES), each with a little flash as
      // it takes. Their light, and the stall's, comes up with them
      const [b0] = LIGHT_UP.bulbs, hum = 0.97 + Math.sin(t * 13) * 0.015;
      let litBulbs = 0, all = 0;
      bulbs.strings.forEach((row, r) => row.forEach((m, i) => {
        const sw = BULB_SWITCHES[r]?.[i] ?? [b0];
        let n = 0; while (n < sw.length && sw[n] <= titleT) n++;
        const on = n % 2 === 1, since = n ? titleT - sw[n - 1] : -1;
        const k = !on ? 0.02 : since < 0.06 ? 1.6 : 1;   // off (a faint filament), a flash as it takes, then on
        m.color.copy(BULB_ON).multiplyScalar(k * hum);
        all++; if (on) litBulbs++;
      }));
      const [f0, f1] = LIGHT_UP.full, up = smooth(f0, f1, titleT);
      const down = 1 - 0.5 * staged;   // the choosing: the stall's own light let down by half
      bulbs.light.intensity = BULB_LIGHT * (litBulbs / all) * down;
      key.intensity = KEY * (0.1 + 0.9 * up) * down;
      show.intensity = SHOW * up * down;
      renderer.toneMappingExposure = 0.45 + 0.55 * up;   // the street comes up with it
      for (const l of lanterns) l.rotation.z = Math.sin(t * 1.1 + l.userData.sway) * 0.05;
      for (const s of steam) {
        const k = (t * 0.12 + s.userData.phase) % 1;
        s.position.set(-2.6 + Math.sin(k * 6 + s.userData.phase * 9) * 0.15, k * 2.2, -3.2 + Math.cos(k * 4) * 0.1);
        s.scale.setScalar(0.3 + k * 1.1);
        s.material.opacity = Math.sin(k * Math.PI) * 0.22;
      }
    },
  };
}
