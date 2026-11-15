// After the scene is drawn: the bulbs and neon bloom, then the tone, then a little film grain and a darker edge,
// like a photograph taken at night.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

const Grain = {
  uniforms: { tDiffuse: { value: null }, time: { value: 0 }, amount: { value: 0.03 }, vignette: { value: 0.35 } },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float time, amount, vignette;
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233)) + time) * 43758.5453); }
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      c.rgb += (hash(vUv * 1000.0) - 0.5) * amount;
      float d = distance(vUv, vec2(0.5));
      c.rgb *= 1.0 - vignette * smoothstep(0.35, 0.85, d);
      gl_FragColor = c;
    }`,
};

export interface Post {
  render(t: number): void;
  setSize(w: number, h: number): void;
}

export function makePost(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera): Post {
  // drawn with 4× multisampling: the renderer's own antialiasing doesn't reach a composer's render targets
  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.6, 0.55, 1.1);   // strength, radius, threshold: only the neon and bulbs, not a white glaze in the light
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const grain = new ShaderPass(Grain);
  composer.addPass(grain);
  return {
    render(t) {
      grain.uniforms.time.value = t % 100;
      composer.render();
    },
    setSize(w, h) {
      const pr = renderer.getPixelRatio();
      composer.setPixelRatio(pr);
      composer.setSize(w, h);
      bloom.setSize(Math.round((w * pr) / 2), Math.round((h * pr) / 2));   // a glow needs no detail: half size
    },
  };
}
