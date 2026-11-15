// A soft studio light for the toys and the owner only: the reflections a product photograph has (a big soft box
// above, bright walls round about), so glazes and plastic shine instead of mirroring the dark street. The street
// itself keeps its own dark night (scene.ts); this is set as each of their materials' own environment.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

let env: THREE.Texture | null = null;

export function makeStudio(renderer: THREE.WebGLRenderer): void {
  const pmrem = new THREE.PMREMGenerator(renderer);
  env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
}

/** give a material the studio light */
export function studioLit<M extends THREE.MeshStandardMaterial>(m: M, strength: number): M {
  if (env) { m.envMap = env; m.envMapIntensity = strength; }
  return m;
}
