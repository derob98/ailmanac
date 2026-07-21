/**
 * GLSL for the hero "Almanac Field".
 *
 * All animation happens in the VERTEX shader — the CPU only writes a handful of
 * uniforms per frame, never per-particle data. That is what lets ~7k points run
 * at 60fps on a laptop and stay cool on a phone.
 *
 * The flow() lattice is carried over from the previous ink hero: two sin/cos
 * terms, no textures, no noise lookups. Cheap and organic enough at this scale.
 */

/**
 * PRECISION: every stage declares `highp` explicitly.
 *
 * GLSL ES defaults float to highp in the vertex stage but leaves it UNDEFINED
 * in the fragment stage, so declaring `mediump` only in the fragment shader
 * gives a uniform that appears in both (uScroll) two different precisions —
 * and the program then fails to LINK. three.js logs the validate error but
 * keeps drawing with the broken program, at which point gl_PointSize is
 * undefined and the driver saturates it to its maximum (511px here), painting
 * huge blocks over the headline. Keep these declarations in sync.
 */
export const fieldVertex = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2  uPointer;    // world-space, already eased on the CPU
  uniform float uStrength;   // 0..1 — rises on pointer move, decays when idle
  uniform float uSize;
  uniform float uScroll;     // 0..1 — hero scrolled out of view (shared stage)

  attribute float aSeed;
  attribute float aSize;
  attribute float aTint;     // 0 = field particle, 1 = warm "verified" spark

  varying float vTint;
  varying float vDepth;      // 0 = near camera, 1 = far — drives fog + colour

  vec2 flow(vec2 p, float t) {
    float a = sin(p.x * 1.7 + t) + cos(p.y * 1.5 - t * 0.8);
    float b = cos(p.x * 1.3 - t * 0.6) + sin(p.y * 1.9 + t);
    return vec2(a, b);
  }

  void main() {
    vec3 pos = position;

    // Organic drift along the flow field. Each point has its own phase so the
    // field never pulses in unison.
    vec2 f = flow(pos.xy * 0.42, uTime * 0.16 + aSeed * 6.2831);
    pos.xy += f * 0.16;
    pos.z  += sin(uTime * 0.35 + aSeed * 10.0) * 0.12;

    // Pointer interaction: push away from the cursor, plus a little tangential
    // swirl so the field curls rather than just parting. Falls off smoothly.
    vec2 toP = pos.xy - uPointer;
    float d = length(toP);
    float infl = smoothstep(2.6, 0.0, d) * uStrength;
    vec2 dir = d > 0.0001 ? toP / d : vec2(0.0, 1.0);
    vec2 tang = vec2(-dir.y, dir.x);
    pos.xy += dir * infl * 0.55 + tang * infl * 0.30;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    // Depth 0..1 across the slab, for fog and colour ramp.
    vDepth = clamp((-mv.z - 3.0) / 6.0, 0.0, 1.0);
    vTint = aTint;

    // Perspective size attenuation; sparks read larger. Shrinks as the hero
    // scrolls away so the field recedes instead of just fading flat.
    //
    // Both guards matter: the max() stops a particle that drifts onto the
    // camera plane from dividing by ~0 (which yields an Inf point size that
    // the driver clamps to its maximum — a huge sprite parked over the
    // headline), and the clamp caps the sprite no matter what the maths does.
    // Nothing in this scene should ever paint a 500px blob across the LCP text.
    float scrollScale = 1.0 - uScroll * 0.35;
    float depthDist = max(-mv.z, 0.75);
    gl_PointSize = clamp(
      uSize * aSize * (1.0 + aTint * 0.8) * scrollScale / depthDist,
      1.0,
      42.0
    );
  }
`;

export const fieldFragment = /* glsl */ `
  precision highp float;   // must match fieldVertex — see the note above

  uniform vec3  uColNear;   // indigo
  uniform vec3  uColFar;    // violet
  uniform vec3  uColSpark;  // amber
  uniform float uIntensity;
  uniform float uScroll;    // shared with the vertex stage

  varying float vTint;
  varying float vDepth;

  void main() {
    // Soft round sprite. Sparks get a wider, softer falloff so they read as a
    // halo — this is what stands in for a bloom pass (which would cost a whole
    // extra render target for one visual cue).
    vec2 d = gl_PointCoord - vec2(0.5);
    float r = dot(d, d);
    float core = smoothstep(0.25, 0.0, r);
    float halo = smoothstep(0.25, 0.02, r);
    float alpha = mix(core, halo, vTint);

    vec3 col = mix(uColNear, uColFar, vDepth);
    col = mix(col, uColSpark, vTint);

    // Depth fog: far particles dissolve toward the background instead of
    // stacking up into a bright wall (additive blending has no depth sorting).
    float fog = 1.0 - vDepth * 0.75;

    gl_FragColor = vec4(col, alpha * fog * uIntensity * (1.0 - uScroll * 0.85));
  }
`;

/**
 * Constellation lines — a self-drawing pass keyed to uDraw so the network
 * "writes itself" once on mount rather than popping in fully formed.
 */
export const lineVertex = /* glsl */ `
  precision highp float;

  attribute float aOrder;   // 0..1 position along the draw order
  varying float vOrder;     // shared varying — precision must match the fragment
  void main() {
    vOrder = aOrder;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const lineFragment = /* glsl */ `
  precision highp float;   // must match lineVertex
  uniform vec3  uColor;
  uniform float uDraw;      // 0..1 reveal progress
  uniform float uOpacity;
  varying float vOrder;
  void main() {
    float on = smoothstep(uDraw - 0.08, uDraw, 1.0 - vOrder);
    gl_FragColor = vec4(uColor, on * uOpacity);
  }
`;
