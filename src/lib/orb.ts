/* ============================================================
   SPACIER — procedural iridescent orb
   Glossy morphing form: simplex-noise vertex displacement,
   fresnel iridescence tinted to the acid accent, Unreal bloom.
   Cursor-aware (orients + bulges toward pointer), idle breath,
   click pulse. Recedes (but stays alive) when a scene is focused.

   Ported from the design bundle (project/orb.js). The prototype
   loaded Three r128 as globals + examples/js passes; here we use
   the `three` npm package with the ESM postprocessing modules.
   ============================================================ */
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

export interface OrbApi {
  setMouse(nx: number, ny: number): void;
  pulse(): void;
  nudge(): void;
  setAttention(v: number): void;
  setAccent(hex: string): void;
  setEnergy(v: number): void;
  /** home = centered hero; scenes = orb glides right & pans out (stays bright) */
  focusScene(on: boolean): void;
  setReduced(v: boolean): void;
  destroy(): void;
}

export function orbSupported(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext("webgl") || c.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

const VERT = /* glsl */ `
  varying vec3 vNormal; varying vec3 vView; varying float vDisp;
  uniform float uTime; uniform vec2 uMouse; uniform float uEnergy; uniform float uClick; uniform float uDim; uniform float uAttention;
  // Ashima simplex noise 3D
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x,289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
    vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+1.0*C.xxx; vec3 x2=x0-i2+2.0*C.xxx; vec3 x3=x0-1.0+3.0*C.xxx;
    i=mod(i,289.0);
    vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
    float n_=1.0/7.0; vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.0*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
    vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
    vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
    return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }
  void main(){
    vNormal = normalize(normalMatrix * normal);
    float t = uTime;
    float en = uEnergy * (1.0 - uDim*0.55);
    // layered noise morph
    float n1 = snoise(normal*1.5 + vec3(0.0, t*0.25, 0.0));
    float n2 = snoise(normal*3.1 + vec3(t*0.18, 0.0, t*0.12));
    float breathe = sin(t*0.9)*0.045;
    // directional bulge toward cursor — broader + stronger so it visibly
    // leans toward the pointer; amplified while the visitor is typing
    vec3 mdir = normalize(vec3(uMouse.x, uMouse.y, 0.6));
    float toward = max(dot(normalize(normal), mdir), 0.0);
    float bulge = pow(toward, 1.9) * (0.2 + uAttention*0.18);
    float disp = (n1*0.125 + n2*0.05 + breathe + bulge) * en + uClick*0.24*pow(toward,1.3);
    vDisp = disp;
    vec3 pos = position + normal * disp;
    vec4 mv = modelViewMatrix * vec4(pos,1.0);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec3 vNormal; varying vec3 vView; varying float vDisp;
  uniform vec3 uAccent; uniform float uTime; uniform float uDim; uniform float uClick; uniform float uAttention;
  // iq cosine palette
  vec3 pal(float t){
    vec3 a=vec3(0.18,0.18,0.20), b=vec3(0.32,0.30,0.34),
         c=vec3(1.0,1.0,1.0), d=vec3(0.0,0.18,0.42);
    return a + b*cos(6.28318*(c*t + d));
  }
  void main(){
    vec3 N=normalize(vNormal); vec3 V=normalize(vView);
    float fres = pow(1.0 - clamp(dot(N,V),0.0,1.0), 2.4);
    // iridescent body shifting with angle + displacement
    vec3 irid = pal(fres*0.85 + vDisp*1.4 + uTime*0.03);
    vec3 base = mix(vec3(0.02,0.02,0.025), irid*0.6, 0.55);
    // glossy spec highlight
    float spec = pow(max(dot(reflect(-V,N), normalize(vec3(0.4,0.7,0.6))),0.0), 24.0);
    // accent rim glow
    vec3 rim = uAccent * pow(fres,1.4) * (1.1 + uClick*1.5 + uAttention*1.0);
    vec3 col = base + rim + spec*vec3(0.9);
    col = mix(col, col*0.42, uDim);     // gentle recede on scenes (still alive)
    gl_FragColor = vec4(col, 1.0);
  }`;

export function createOrb(canvas: HTMLCanvasElement): OrbApi | null {
  if (typeof THREE === "undefined" || !orbSupported()) return null;

  const uniforms = {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uAccent: { value: new THREE.Color(0xccff00) },
    uEnergy: { value: 1.0 },
    uClick: { value: 0.0 },
    uDim: { value: 0.0 }, // 0 home … 1 dimmed (scene focus)
    uAttention: { value: 0.0 }, // 0 idle … 1 visitor is typing (heightened gaze)
  };

  let reduced = false;
  const mouseTarget = new THREE.Vector2(0, 0);
  let scaleTarget = 1.0,
    scaleCur = 1.0;
  let dimTarget = 0.0;
  let attentionTarget = 0.0;
  const posTarget = new THREE.Vector3(0, -0.82, 0); // home = centered-low
  const bloomBase = 0.82;

  let renderer: THREE.WebGLRenderer;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let composer: EffectComposer;
  let bloom: UnrealBloomPass;
  let group: THREE.Group;
  let clock: THREE.Clock;
  let raf = 0;

  function resize() {
    if (!renderer) return;
    const w = window.innerWidth,
      h = window.innerHeight;
    renderer.setSize(w, h);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function animate() {
    raf = requestAnimationFrame(animate);
    const dt = clock.getDelta();
    const ts = reduced ? 0.15 : 1.0;
    uniforms.uTime.value += dt * ts;
    // ease mouse — snappier so the cursor-tracking reads clearly
    uniforms.uMouse.value.x += (mouseTarget.x - uniforms.uMouse.value.x) * 0.14;
    uniforms.uMouse.value.y += (mouseTarget.y - uniforms.uMouse.value.y) * 0.14;
    // click decay
    uniforms.uClick.value += (0 - uniforms.uClick.value) * 0.06;
    // attention (typing) easing
    uniforms.uAttention.value += (attentionTarget - uniforms.uAttention.value) * 0.09;
    // dim + scale easing
    uniforms.uDim.value += (dimTarget - uniforms.uDim.value) * 0.05;
    scaleCur += (scaleTarget - scaleCur) * 0.06;
    group.scale.setScalar(scaleCur);
    // glide toward docked position (centered on home, right-docked on scenes)
    group.position.x += (posTarget.x - group.position.x) * 0.055;
    group.position.y += (posTarget.y - group.position.y) * 0.055;
    // orientation toward cursor (turns to face the pointer) + idle drift
    const tx = mouseTarget.y * 0.5,
      ty = mouseTarget.x * 0.72;
    group.rotation.x += (tx - group.rotation.x) * 0.09;
    group.rotation.y +=
      (ty + uniforms.uTime.value * (reduced ? 0.0 : 0.04) - group.rotation.y) * 0.09;
    if (bloom)
      bloom.strength = bloomBase * (1.0 - uniforms.uDim.value * 1.2) * uniforms.uEnergy.value;
    composer.render();
  }

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    renderer.setClearColor(0x0a0908, 1);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 5.3);

    group = new THREE.Group();
    group.position.y = -0.82;
    scene.add(group);

    const detail = window.innerWidth < 700 ? 4 : 5;
    const geo = new THREE.IcosahedronGeometry(1.0, detail);
    const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG });
    const mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);

    // post: bloom
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      bloomBase,
      0.6,
      0.72,
    );
    composer.addPass(bloom);

    clock = new THREE.Clock();
    resize();
    window.addEventListener("resize", resize);
    animate();
  } catch (e) {
    console.warn("orb init failed", e);
    return null;
  }

  return {
    setMouse(nx, ny) {
      mouseTarget.set(nx, ny);
    },
    pulse() {
      uniforms.uClick.value = 1.0;
    },
    nudge() {
      uniforms.uClick.value = Math.max(uniforms.uClick.value, 0.5);
    },
    setAttention(v) {
      attentionTarget = v;
    },
    setAccent(hex) {
      uniforms.uAccent.value = new THREE.Color(hex);
    },
    setEnergy(v) {
      uniforms.uEnergy.value = v;
    },
    focusScene(on) {
      if (on) {
        const wide = !!camera && camera.aspect > 1.05;
        posTarget.set(wide ? 1.95 : 0.0, wide ? -0.2 : -0.95, 0);
        scaleTarget = 0.7;
        dimTarget = 0.16;
      } else {
        posTarget.set(0, -0.82, 0);
        scaleTarget = 1.0;
        dimTarget = 0.0;
      }
    },
    setReduced(v) {
      reduced = v;
    },
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      renderer.dispose();
    },
  };
}
