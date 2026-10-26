import { useEffect, useMemo, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle, RenderTarget, Texture } from 'ogl';

const SWELL_PRESETS = {
  swell: { scale: 1.5, speed: 0.6, direction: 250, chop: 0.55, stretch: 0, glint: 0.7, contrast: 1.25, perspective: 0.55, fog: 0.55 },
  tide: { scale: 1.3, speed: 0.5, direction: 262, chop: 0.2, stretch: 0.12, glint: 0.45, contrast: 1.1, perspective: 0.5, fog: 0.4 },
  storm: { scale: 0.55, speed: 1.6, direction: 236, chop: 1, stretch: 0.3, glint: 1.3, contrast: 1.8, perspective: 0.8, fog: 0.35 },
  signal: { scale: 0.85, speed: 1.2, direction: 180, chop: 0.6, stretch: 0.85, glint: 0.25, contrast: 1.2, perspective: 0, fog: 0 }
};
const FLUID_SIZE = 96, PRESSURE_STEPS = 16, SPLAT_FORCE = 6900, SPLASH_JETS = 3, PIXEL_BUDGET = 4.5e6;
const clamp = (v, mn, mx) => Math.min(Math.max(v, mn), mx);
const parseColor = (value, fallback) => {
  try {
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return fallback;
    ctx.fillStyle = '#000000'; ctx.fillStyle = value;
    const r = ctx.fillStyle;
    if (r.startsWith('#')) { const n = parseInt(r.slice(1), 16); return [((n >> 16) & 255)/255, ((n >> 8) & 255)/255, (n & 255)/255, 1]; }
    const p = r.match(/[\d.]+/g);
    if (!p || p.length < 3) return fallback;
    return [Number(p[0])/255, Number(p[1])/255, Number(p[2])/255, p[3] ? Number(p[3]) : 1];
  } catch { return fallback; }
};
const passVertex = `#version 300 es\nin vec2 position;\nvoid main() { gl_Position = vec4(position, 0.0, 1.0); }`;
const fluidVertex = `#version 300 es\nin vec2 position;\nuniform vec2 uTexel;\nout vec2 vUv, vL, vR, vT, vB;\nvoid main() { vUv = position * 0.5 + 0.5; vL = vUv - vec2(uTexel.x, 0.0); vR = vUv + vec2(uTexel.x, 0.0); vT = vUv + vec2(0.0, uTexel.y); vB = vUv - vec2(0.0, uTexel.y); gl_Position = vec4(position, 0.0, 1.0); }`;
const fluidHead = `#version 300 es\nprecision highp float;\nin vec2 vUv, vL, vR, vT, vB;\nout vec4 fragColor;`;
const splatFrag = `${fluidHead}\nuniform sampler2D uTarget;\nuniform float uAspect;\nuniform vec2 uPoint;\nuniform vec3 uValue;\nuniform float uRadius;\nvoid main() { vec2 o = vUv - uPoint; o.x *= uAspect; float f = exp(-dot(o,o)/uRadius); fragColor = vec4(texture(uTarget,vUv).xyz + uValue*f, 1.0); }`;
const curlFrag = `${fluidHead}\nuniform sampler2D uVelocity;\nvoid main() { float l=texture(uVelocity,vL).y, r=texture(uVelocity,vR).y, t=texture(uVelocity,vT).x, b=texture(uVelocity,vB).x; fragColor=vec4(0.5*(r-l-t+b),0,0,1); }`;
const vorticityFrag = `${fluidHead}\nuniform sampler2D uVelocity, uCurl;\nuniform float uSwirl, uDt;\nvoid main() { float l=texture(uCurl,vL).x, r=texture(uCurl,vR).x, t=texture(uCurl,vT).x, b=texture(uCurl,vB).x, m=texture(uCurl,vUv).x; vec2 f=0.5*vec2(abs(t)-abs(b),abs(r)-abs(l)); f=f/(length(f)+0.0001)*uSwirl*m; f.y=-f.y; vec2 v=texture(uVelocity,vUv).xy+f*uDt; fragColor=vec4(clamp(v,-1000.0,1000.0),0,1); }`;
const divergenceFrag = `${fluidHead}\nuniform sampler2D uVelocity;\nvoid main() { vec2 m=texture(uVelocity,vUv).xy; float l=vL.x<0.0?-m.x:texture(uVelocity,vL).x, r=vR.x>1.0?-m.x:texture(uVelocity,vR).x, t=vT.y>1.0?-m.y:texture(uVelocity,vT).y, b=vB.y<0.0?-m.y:texture(uVelocity,vB).y; fragColor=vec4(0.5*(r-l+t-b),0,0,1); }`;
const pressureFrag = `${fluidHead}\nuniform sampler2D uPressure, uDivergence;\nvoid main() { float l=texture(uPressure,vL).x, r=texture(uPressure,vR).x, t=texture(uPressure,vT).x, b=texture(uPressure,vB).x, d=texture(uDivergence,vUv).x; fragColor=vec4((l+r+t+b-d)*0.25,0,0,1); }`;
const projectFrag = `${fluidHead}\nuniform sampler2D uPressure, uVelocity;\nvoid main() { float l=texture(uPressure,vL).x, r=texture(uPressure,vR).x, t=texture(uPressure,vT).x, b=texture(uPressure,vB).x; vec2 v=texture(uVelocity,vUv).xy-vec2(r-l,t-b); fragColor=vec4(v,0,1); }`;
const advectFrag = `${fluidHead}\nuniform sampler2D uVelocity, uSource;\nuniform vec2 uTexel;\nuniform float uDt, uFade;\nvoid main() { vec2 f=vUv-uDt*texture(uVelocity,vUv).xy*uTexel; fragColor=texture(uSource,f)/(1.0+uFade*uDt); }`;
const scaleFrag = `${fluidHead}\nuniform sampler2D uSource;\nuniform float uValue;\nvoid main() { fragColor=texture(uSource,vUv)*uValue; }`;

const fieldFrag = `#version 300 es
precision highp float;
uniform vec2 uSize;
uniform vec4 uGrid;
uniform vec2 uOrigin, uSlat;
uniform float uTime, uScale, uDirection, uChop, uStretch, uGlint, uContrast, uPerspective, uFog, uIntro, uFluid, uInk, uLean;
uniform sampler2D tVelocity, tInk;
uniform vec2 uFluidTexel;
out vec4 fragColor;
const float TURN[4] = float[4](0.0, -0.95, 0.78, 1.62);
const float LENGTH[4] = float[4](2.6, 1.7, 1.12, 0.76);
const float HEIGHT[4] = float[4](1.0, 0.75, 0.5, 0.3);
const float SHIFT[4] = float[4](0.0, 2.3, 4.1, 1.1);
void main() {
  vec2 cell = floor(gl_FragCoord.xy);
  float row = uGrid.y - 1.0 - cell.y;
  vec2 center = uOrigin + vec2(cell.x, row) * uGrid.zw + uSlat * 0.5;
  float v = clamp(center.y / uSize.y, 0.0, 1.0);
  vec2 flow = vec2(0.0); float ink = 0.0;
  if (uFluid > 0.5) { vec2 fuv = clamp(vec2(center.x/uSize.x, 1.0-center.y/uSize.y), 0.0, 1.0); flow = texture(tVelocity, fuv).xy * uFluidTexel * uSize; ink = texture(tInk, fuv).x; }
  float horizon = mix(8.0, 0.5, uPerspective);
  float depth = (1.0 + horizon) / (v + horizon);
  vec2 world = vec2((center.x - uSize.x * 0.5) / uSize.y * depth, (depth - 1.0) * horizon * 2.2);
  world -= flow * 0.00018 * depth; world /= max(uScale, 0.05);
  float meander = 0.55 * sin(dot(world, vec2(0.23, 0.41)) * 0.9 + uTime * 0.13) + 0.3 * sin(dot(world, vec2(-0.37, 0.19)) * 1.4 - uTime * 0.09);
  float steep = uChop * 0.45, height = 0.0, total = 0.0;
  for (int i = 0; i < 4; i++) {
    float angle = uDirection + TURN[i]; vec2 heading = vec2(cos(angle), sin(angle));
    float k = 6.2831853 / LENGTH[i]; float omega = sqrt(9.81 * k) * 0.35;
    float theta = k * dot(world, heading) - omega * uTime + SHIFT[i] + meander * (0.6 + 0.3 * float(i));
    height += HEIGHT[i] * (cos(theta) + steep * cos(2.0 * theta)); total += HEIGHT[i] * (1.0 + steep);
  }
  float level = clamp(0.5 + 0.5 * height / (total * 0.85), 0.0, 1.0);
  float crest = smoothstep(0.6, 1.0, level); float glint = crest * crest * uGlint;
  float haze = mix(1.0, 1.0 - uFog, pow(1.0 - v, 1.4));
  float light = (pow(level, uContrast) + glint * 0.8) * haze;
  float glow = 1.0 - exp(-max(ink, 0.0) * uInk * 1.6);
  light = 1.0 - (1.0 - clamp(light, 0.0, 1.0)) * (1.0 - glow);
  float front = uIntro * 1.35; float reveal = 1.0 - smoothstep(front - 0.35, front, v);
  float sweep = exp(-pow((v - front + 0.22) / 0.07, 2.0)) * (1.0 - uIntro);
  light = (light + sweep * 0.8) * reveal; light = max(light, 0.045 * reveal);
  float span = mix(1.0 - uStretch, 1.0, level) + glow * 0.3;
  span = clamp(span, 0.08, 1.0) * mix(0.1, 1.0, reveal);
  float tint = clamp(max(glint * 1.4, glow * 0.9) + sweep, 0.0, 1.0);
  float lean = clamp(flow.x / 1400.0, -1.0, 1.0) * uLean * reveal;
  fragColor = vec4(clamp(light, 0.0, 1.0), span, tint, 0.5 + 0.5 * lean);
}`;

const slatFrag = `#version 300 es
precision highp float;
uniform sampler2D tField;
uniform vec2 uSize, uSlat, uOrigin;
uniform float uDpr, uRound, uTilt;
uniform vec4 uGrid, uBackground;
uniform vec3 uColor, uGlintColor;
out vec4 fragColor;
float pill(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
void main() {
  vec2 p = vec2(gl_FragCoord.x, uSize.y * uDpr - gl_FragCoord.y) / uDpr;
  vec2 local = p - uOrigin; vec2 cell = floor(local / uGrid.zw);
  vec4 background = vec4(uBackground.rgb * uBackground.a, uBackground.a);
  vec4 slat = vec4(0.0); int reach = uTilt > 0.0 ? 1 : 0;
  for (int dx = -1; dx <= 1; dx++) {
    if (abs(dx) > reach) continue;
    vec2 nb = cell + vec2(float(dx), 0.0);
    if (nb.x < 0.0 || nb.y < 0.0 || nb.x >= uGrid.x || nb.y >= uGrid.y) continue;
    vec4 field = texelFetch(tField, ivec2(int(nb.x), int(uGrid.y - 1.0 - nb.y)), 0);
    vec2 offset = local - nb * uGrid.zw - uSlat * 0.5;
    float angle = (field.a - 0.5) * 2.0 * uTilt; float c = cos(angle), s = sin(angle);
    vec2 turned = vec2(c*offset.x + s*offset.y, c*offset.y - s*offset.x);
    vec2 halfSize = vec2(uSlat.x * 0.5, uSlat.y * 0.5 * field.g);
    float radius = uRound * min(halfSize.x, halfSize.y);
    float alpha = clamp(0.5 - pill(turned, halfSize, radius) * uDpr, 0.0, 1.0) * field.r;
    if (alpha > slat.a) slat = vec4(mix(uColor, uGlintColor, field.b) * alpha, alpha);
  }
  fragColor = slat + background * (1.0 - slat.a);
}`;

const MicroSlats = ({
  preset = 'swell', color = '#A855F7', glintColor = '#ffffff', backgroundColor = '#000000',
  slatWidth = 10, slatHeight = 25, gap = 3, roundness = 0.75,
  scale, speed, direction, chop, stretch, glint, contrast, perspective, fog,
  interactive = true, cursorStrength = 1, cursorSize = 40,
  swirl = 0, trail = 1.4, lean = 0, intro = true, introDuration = 1.5, paused = false,
  className = '', style
}) => {
  const containerRef = useRef(null);
  const settingsRef = useRef(null);
  const wakeRef = useRef(null);
  const base = SWELL_PRESETS[preset] || SWELL_PRESETS.swell;
  const pick = (value, key) => (value === undefined || value === null ? base[key] : value);
  const colors = useMemo(() => ({
    color: parseColor(color, [0.66, 0.33, 0.97, 1]),
    glintColor: parseColor(glintColor, [1, 1, 1, 1]),
    backgroundColor: parseColor(backgroundColor, [0, 0, 0, 1])
  }), [color, glintColor, backgroundColor]);

  useEffect(() => {
    settingsRef.current = {
      ...colors, slatWidth, slatHeight, gap, roundness,
      scale: pick(scale, 'scale'), speed: pick(speed, 'speed'), direction: pick(direction, 'direction'),
      chop: pick(chop, 'chop'), stretch: pick(stretch, 'stretch'), glint: pick(glint, 'glint'),
      contrast: pick(contrast, 'contrast'), perspective: pick(perspective, 'perspective'), fog: pick(fog, 'fog'),
      interactive, cursorStrength, cursorSize, swirl, trail, lean, intro, introDuration, paused
    };
    wakeRef.current?.();
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const renderer = new Renderer({ alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
    const gl = renderer.gl;
    if (!renderer.isWebgl2) { gl.getExtension('WEBGL_lose_context')?.loseContext(); return undefined; }
    gl.clearColor(0, 0, 0, 0);
    const canvas = gl.canvas;
    canvas.style.display = 'block'; canvas.style.width = '100%'; canvas.style.height = '100%';
    canvas.setAttribute('aria-hidden', 'true');
    container.appendChild(canvas);
    const geometry = new Triangle(gl);
    const blank = new Texture(gl);
    const floatTargets = !!(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'));
    const dispose = t => { gl.deleteFramebuffer(t.buffer); gl.deleteTexture(t.texture.texture); };
    let fieldTarget = new RenderTarget(gl, { width: 1, height: 1, depth: false, minFilter: gl.NEAREST, magFilter: gl.NEAREST });
    const mkProgram = (vert, frag, uniforms) => new Program(gl, { vertex: vert, fragment: frag, uniforms, depthTest: false, depthWrite: false });
    const mkMesh = (vert, frag, uniforms) => new Mesh(gl, { geometry, program: mkProgram(vert, frag, uniforms) });
    const fluidTexel = { value: [1, 1] };
    const fluidPass = (frag, uniforms) => mkMesh(fluidVertex, frag, { uTexel: fluidTexel, ...uniforms });
    const fieldU = {
      uSize:{value:[1,1]}, uGrid:{value:[1,1,1,1]}, uOrigin:{value:[0,0]}, uSlat:{value:[1,1]},
      uTime:{value:0}, uScale:{value:1}, uDirection:{value:0}, uChop:{value:0.5}, uStretch:{value:0.3},
      uGlint:{value:1}, uContrast:{value:1}, uPerspective:{value:0.7}, uFog:{value:0.5}, uIntro:{value:0},
      tVelocity:{value:blank}, tInk:{value:blank}, uFluidTexel:{value:[1,1]}, uFluid:{value:0}, uInk:{value:1}, uLean:{value:0.5}
    };
    const fieldMesh = mkMesh(passVertex, fieldFrag, fieldU);
    const slatU = {
      tField:{value:fieldTarget.texture}, uSize:{value:[1,1]}, uDpr:{value:1}, uGrid:{value:[1,1,1,1]},
      uOrigin:{value:[0,0]}, uSlat:{value:[1,1]}, uRound:{value:1}, uTilt:{value:0},
      uColor:{value:[1,1,1]}, uGlintColor:{value:[1,1,1]}, uBackground:{value:[0,0,0,1]}
    };
    const slatMesh = mkMesh(passVertex, slatFrag, slatU);
    const splatPass = fluidPass(splatFrag, { uTarget:{value:blank}, uAspect:{value:1}, uPoint:{value:[0,0]}, uValue:{value:[0,0,0]}, uRadius:{value:0.01} });
    const curlPass = fluidPass(curlFrag, { uVelocity:{value:blank} });
    const vorticityPass = fluidPass(vorticityFrag, { uVelocity:{value:blank}, uCurl:{value:blank}, uSwirl:{value:20}, uDt:{value:0.016} });
    const divergencePass = fluidPass(divergenceFrag, { uVelocity:{value:blank} });
    const pressurePass = fluidPass(pressureFrag, { uPressure:{value:blank}, uDivergence:{value:blank} });
    const projectPass = fluidPass(projectFrag, { uPressure:{value:blank}, uVelocity:{value:blank} });
    const advectPass = fluidPass(advectFrag, { uVelocity:{value:blank}, uSource:{value:blank}, uDt:{value:0.016}, uFade:{value:1} });
    const scalePass = fluidPass(scaleFrag, { uSource:{value:blank}, uValue:{value:0} });
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let width=1, height=1, raf=0, last=performance.now(), time=0, introClock=0;
    let visible=true, alive=true, fluid=null, fluidUntil=0, fluidDirty=false, splashTurn=0;
    const splats=[], pointer={x:0,y:0,tracked:false};
    const run = (mesh, target) => renderer.render({ scene: mesh, target, clear: false });
    const floatTarget = (w, h) => new RenderTarget(gl, { width:w, height:h, depth:false, type:gl.HALF_FLOAT, format:gl.RGBA, internalFormat:gl.RGBA16F, minFilter:gl.LINEAR, magFilter:gl.LINEAR });
    const swapPair = (w, h) => { const o = { read: floatTarget(w,h), write: floatTarget(w,h), swap() { const n=this.read; this.read=this.write; this.write=n; } }; return o; };
    const disposeFluid = () => { if (!fluid) return; [fluid.velocity, fluid.ink, fluid.pressure].forEach(p => { dispose(p.read); dispose(p.write); }); dispose(fluid.divergence); dispose(fluid.curl); fluid=null; };
    const buildFluid = () => {
      if (!floatTargets) return;
      const asp = width/height;
      const w = Math.max(8, Math.round(asp >= 1 ? FLUID_SIZE*asp : FLUID_SIZE));
      const h = Math.max(8, Math.round(asp >= 1 ? FLUID_SIZE : FLUID_SIZE/asp));
      if (fluid && fluid.width===w && fluid.height===h) return;
      disposeFluid();
      fluid = { width:w, height:h, velocity:swapPair(w,h), ink:swapPair(w,h), pressure:swapPair(w,h), divergence:floatTarget(w,h), curl:floatTarget(w,h) };
      fluidTexel.value = [1/w, 1/h];
    };
    const resize = () => { width=Math.max(1,container.clientWidth); height=Math.max(1,container.clientHeight); renderer.dpr=Math.min(window.devicePixelRatio||1,2,Math.sqrt(PIXEL_BUDGET/(width*height))); renderer.setSize(width,height); buildFluid(); start(); };
    const layout = s => {
      const sw=clamp(s.slatWidth,1,64), sh=clamp(s.slatHeight,2,240), g=clamp(s.gap,0,64);
      const px=sw+g, py=sh+g;
      const cols=Math.min(2048,Math.ceil((width+g)/px)+1), rows=Math.min(2048,Math.ceil((height+g)/py)+1);
      const ox=(width-(cols*px-g))/2, oy=(height-(rows*py-g))/2;
      if (fieldTarget.width!==cols || fieldTarget.height!==rows) {
        dispose(fieldTarget);
        fieldTarget = new RenderTarget(gl, { width:cols, height:rows, depth:false, minFilter:gl.NEAREST, magFilter:gl.NEAREST });
        slatU.tField.value = fieldTarget.texture;
      }
      const tilt=Math.min(0.42, Math.asin(clamp((px*1.5-sw*0.5)/(sh*0.5),0,1)));
      return { slatW:sw, slatH:sh, tilt, grid:[cols,rows,px,py], origin:[ox,oy] };
    };
    const splat = (pair, point, value, radius) => { const u=splatPass.program.uniforms; u.uTarget.value=pair.read.texture; u.uAspect.value=width/height; u.uPoint.value=point; u.uValue.value=value; u.uRadius.value=radius; run(splatPass, pair.write); pair.swap(); };
    const stepFluid = (f, dt, s) => {
      if (s.swirl>0) { curlPass.program.uniforms.uVelocity.value=f.velocity.read.texture; run(curlPass, f.curl); const vo=vorticityPass.program.uniforms; vo.uVelocity.value=f.velocity.read.texture; vo.uCurl.value=f.curl.texture; vo.uSwirl.value=clamp(s.swirl,0,2)*40; vo.uDt.value=dt; run(vorticityPass,f.velocity.write); f.velocity.swap(); }
      divergencePass.program.uniforms.uVelocity.value=f.velocity.read.texture; run(divergencePass,f.divergence);
      scalePass.program.uniforms.uSource.value=f.pressure.read.texture; scalePass.program.uniforms.uValue.value=0.8; run(scalePass,f.pressure.write); f.pressure.swap();
      pressurePass.program.uniforms.uDivergence.value=f.divergence.texture;
      for (let i=0;i<PRESSURE_STEPS;i++) { pressurePass.program.uniforms.uPressure.value=f.pressure.read.texture; run(pressurePass,f.pressure.write); f.pressure.swap(); }
      projectPass.program.uniforms.uPressure.value=f.pressure.read.texture; projectPass.program.uniforms.uVelocity.value=f.velocity.read.texture; run(projectPass,f.velocity.write); f.velocity.swap();
      const fade=1/clamp(s.trail,0.1,10); const adv=advectPass.program.uniforms; adv.uDt.value=dt; adv.uVelocity.value=f.velocity.read.texture; adv.uSource.value=f.velocity.read.texture; adv.uFade.value=fade*1.4; run(advectPass,f.velocity.write); f.velocity.swap();
      adv.uVelocity.value=f.velocity.read.texture; adv.uSource.value=f.ink.read.texture; adv.uFade.value=fade; run(advectPass,f.ink.write); f.ink.swap();
    };
    const clearFluid = f => { scalePass.program.uniforms.uValue.value=0; [f.velocity,f.ink,f.pressure].forEach(p => { scalePass.program.uniforms.uSource.value=p.read.texture; run(scalePass,p.write); p.swap(); }); };
    const frame = now => {
      raf=0; if (!alive) return;
      const s=settingsRef.current; const dt=Math.min(0.05,Math.max(0,(now-last)/1000)); last=now; if (!s) return;
      if (!s.paused && !reducedMotion) time+=dt*s.speed;
      introClock=s.intro && !reducedMotion ? introClock+dt/Math.max(0.2,s.introDuration) : 1;
      const il=Math.min(introClock,1); const ie=il<0.5?4*il*il*il:1-Math.pow(-2*il+2,3)/2;
      if (fluid && splats.length) {
        const radius=Math.pow(clamp(s.cursorSize,4,600)/height,2)*0.35; const aspect=width/height;
        for (const [u,v,du,dv,turn] of splats) {
          if (turn===null) { splat(fluid.velocity,[u,v],[du*SPLAT_FORCE,dv*SPLAT_FORCE,0],radius); splat(fluid.ink,[u,v],[0.13,0,0],radius); continue; }
          const jet=radius*0.55, reach=Math.sqrt(jet*0.5)*1.9, push=SPLAT_FORCE*0.08;
          for (let i=0;i<SPLASH_JETS;i++) { const angle=turn+(i/SPLASH_JETS)*Math.PI*2; const dx=Math.cos(angle),dy=Math.sin(angle); const pt=[u+(dx*reach)/aspect,v+dy*reach]; const sp=[(dx-dy)*Math.SQRT1_2*push,(dy+dx)*Math.SQRT1_2*push,0]; splat(fluid.velocity,pt,sp,jet); splat(fluid.ink,pt,[0.75,0,0],jet); }
          splat(fluid.ink,[u,v],[0.45,0,0],radius);
        }
        splats.length=0; fluidDirty=true;
      }
      const fluidActive=fluid!==null && now<fluidUntil;
      if (fluid) { if (fluidActive) stepFluid(fluid,Math.min(Math.max(dt,1/240),1/30),s); else if (fluidDirty) { clearFluid(fluid); fluidDirty=false; } }
      const grid=layout(s);
      fieldU.uSize.value=[width,height]; fieldU.uGrid.value=grid.grid; fieldU.uOrigin.value=grid.origin; fieldU.uSlat.value=[grid.slatW,grid.slatH];
      fieldU.uTime.value=time; fieldU.uScale.value=s.scale; fieldU.uDirection.value=(s.direction*Math.PI)/180;
      fieldU.uChop.value=clamp(s.chop,0,1.5); fieldU.uStretch.value=clamp(s.stretch,0,0.95);
      fieldU.uGlint.value=Math.max(0,s.glint); fieldU.uContrast.value=clamp(s.contrast,0.2,4);
      fieldU.uPerspective.value=clamp(s.perspective,0,1); fieldU.uFog.value=clamp(s.fog,0,1);
      fieldU.uIntro.value=ie; fieldU.uFluid.value=fluidActive?1:0;
      fieldU.tVelocity.value=fluid?fluid.velocity.read.texture:blank; fieldU.tInk.value=fluid?fluid.ink.read.texture:blank;
      fieldU.uFluidTexel.value=fluidTexel.value; fieldU.uInk.value=clamp(s.cursorStrength,0,3); fieldU.uLean.value=clamp(s.lean,0,1);
      renderer.render({ scene: fieldMesh, target: fieldTarget });
      slatU.uSize.value=[width,height]; slatU.uDpr.value=renderer.dpr; slatU.uGrid.value=grid.grid; slatU.uOrigin.value=grid.origin; slatU.uSlat.value=[grid.slatW,grid.slatH];
      slatU.uRound.value=clamp(s.roundness,0,1); slatU.uTilt.value=fluidActive && s.lean>0?grid.tilt:0;
      slatU.uColor.value=s.color.slice(0,3); slatU.uGlintColor.value=s.glintColor.slice(0,3); slatU.uBackground.value=s.backgroundColor;
      renderer.render({ scene: slatMesh });
      const moving=(!s.paused && !reducedMotion && s.speed!==0)||introClock<1;
      if (visible && (moving||fluidActive||fluidDirty)) raf=requestAnimationFrame(frame);
    };
    const start = () => { if (raf||!visible||!alive) return; last=performance.now(); raf=requestAnimationFrame(frame); };
    const locate = e => { const rect=container.getBoundingClientRect(); const x=e.clientX-rect.left, y=e.clientY-rect.top, w=Math.max(1,rect.width), h=Math.max(1,rect.height); return {x,y,u:x/w,v:1-y/h,h,inside:x>=0&&y>=0&&x<=w&&y<=h}; };
    const queue = (u,v,du,dv,turn) => { if (splats.length>32) splats.shift(); splats.push([u,v,du,dv,turn]); const s=settingsRef.current; fluidUntil=performance.now()+Math.max(1.5,(s?s.trail:1.4)*5)*1000; start(); };
    const onPointerMove = e => { const s=settingsRef.current, spot=locate(e); if (!fluid||!s||!s.interactive||reducedMotion||!spot.inside) { pointer.tracked=false; return; } if (pointer.tracked&&(spot.x!==pointer.x||spot.y!==pointer.y)) queue(spot.u,spot.v,(spot.x-pointer.x)/spot.h,(pointer.y-spot.y)/spot.h,null); pointer.x=spot.x; pointer.y=spot.y; pointer.tracked=true; };
    const onPointerDown = e => { const s=settingsRef.current, spot=locate(e); if (!fluid||!s||!s.interactive||reducedMotion||!spot.inside) return; splashTurn+=2.39996; queue(spot.u,spot.v,0,0,splashTurn); };
    const onPointerLeave = () => { pointer.tracked=false; };
    const onPointerOut = e => { if (!e.relatedTarget) onPointerLeave(); };
    const onVisibility = () => { if (!document.hidden) start(); };
    window.addEventListener('pointermove', onPointerMove, {passive:true});
    window.addEventListener('pointerdown', onPointerDown, {passive:true});
    window.addEventListener('pointerout', onPointerOut, {passive:true});
    window.addEventListener('blur', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibility);
    const ro=new ResizeObserver(resize); ro.observe(container);
    const io=new IntersectionObserver(([e]) => { visible=e.isIntersecting; start(); }); io.observe(container);
    wakeRef.current=start; resize();
    return () => {
      alive=false; visible=false; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerout', onPointerOut);
      window.removeEventListener('blur', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      wakeRef.current=null; disposeFluid(); dispose(fieldTarget);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  }, []);

  return <div ref={containerRef} className={`relative h-full w-full overflow-hidden ${className}`.trim()} style={style} />;
};

export default MicroSlats;
