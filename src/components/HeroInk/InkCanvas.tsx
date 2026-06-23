import React, {useMemo, useRef, useState} from 'react';
import {Canvas, useFrame} from '@react-three/fiber';
import * as THREE from 'three';

/* ──────────────────────────────────────────────────────────────────────────
 * Brand palette (mirrors src/css/custom.css — DO NOT introduce new colors).
 * Indigo base, violet body, amber tail; additive blending makes these *glow*
 * on the dark (#0c0e14) canvas and reads as brand, not decoration.
 * ──────────────────────────────────────────────────────────────────────── */
const C_INDIGO = new THREE.Color('#4f46e5');
const C_VIOLET = new THREE.Color('#7c3aed');
const C_AMBER = new THREE.Color('#f59e0b');

const INK_COUNT = 1500; // ~1.5k points — strictly lighter than the old hero.
const NODE_COUNT = 14; // constellation nodes behind the headline.

/* ── Environment probes (client-only; this module is never imported in SSR) ── */
function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
function isCoarsePointer(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(pointer: coarse)').matches
  );
}
function isSaveData(): boolean {
  // navigator.connection is non-standard; guard defensively.
  const nav = typeof navigator !== 'undefined' ? (navigator as any) : undefined;
  return Boolean(nav && nav.connection && nav.connection.saveData);
}
function isMobileWidth(): boolean {
  return typeof window !== 'undefined' && window.innerWidth < 997;
}

/**
 * Can this engine actually clip an HTML box to an inline SVG <mask> referenced
 * by fragment (`mask-image: url(#id)`)?
 *
 * CRITICAL: `CSS.supports('mask-image','url(#x)')` returns TRUE in Blink/WebKit
 * too, even though those engines do NOT render the cross-reference (the ink
 * would paint as a FULL unclipped additive square over the LCP headline — a
 * contrast/seizure hazard). The cross-reference is only reliable in Gecko, so
 * we feature-DETECT the engine and default to false everywhere else, shipping
 * the bounded soft-glow fallback. (When in doubt, no large additive field.)
 */
function supportsHtmlSvgMask(): boolean {
  if (typeof window === 'undefined' || typeof CSS === 'undefined' || !CSS.supports) {
    return false;
  }
  // Gecko exposes -moz-* support and renders fragment masks on HTML boxes.
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isGecko = /\bGecko\/\d/.test(ua) && /\bFirefox\//.test(ua);
  return (
    isGecko &&
    (CSS.supports('mask-image', 'url(#x)') ||
      CSS.supports('-webkit-mask-image', 'url(#x)'))
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Ink flow-field — instanced points on a cheap sin/cos field.
 * Custom ShaderMaterial: additive, depthWrite off, vertexColors lerp
 * violet→amber by particle lifetime, z-attenuated gl_PointSize.
 * Pointer eases the field origin (lerp 0.06) so the ink "breathes".
 * ──────────────────────────────────────────────────────────────────────── */
const inkVertex = /* glsl */ `
  uniform float uTime;
  uniform vec2 uOrigin;
  uniform float uSize;
  attribute float aSeed;
  varying float vLife;

  // 2D pseudo-noise via sin/cos lattice — no textures, very cheap.
  vec2 flow(vec2 p, float t) {
    float a = sin(p.x * 1.7 + t) + cos(p.y * 1.5 - t * 0.8);
    float b = cos(p.x * 1.3 - t * 0.6) + sin(p.y * 1.9 + t);
    return vec2(a, b);
  }

  void main() {
    // Each point loops through a normalized lifetime [0,1).
    float life = fract(aSeed + uTime * (0.05 + aSeed * 0.05));
    vLife = life;

    vec3 pos = position;
    vec2 f = flow(pos.xy * 1.2 + uOrigin, uTime * 0.5 + aSeed * 6.2831);
    // Drift along the field, fanning outward over the lifetime.
    pos.xy += f * (0.06 + life * 0.10);
    pos.xy += (uOrigin - pos.xy) * 0.04; // gentle pull toward eased origin
    pos.z += sin(uTime * 0.6 + aSeed * 10.0) * 0.04;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    // z-attenuated, fades in/out at the ends of the lifetime.
    float fade = smoothstep(0.0, 0.15, life) * smoothstep(1.0, 0.7, life);
    gl_PointSize = uSize * (0.35 + 0.65 * fade) * (1.0 / -mv.z);
  }
`;

const inkFragment = /* glsl */ `
  precision mediump float;
  uniform vec3 uColA; // violet
  uniform vec3 uColB; // amber
  uniform float uIntensity;
  varying float vLife;

  void main() {
    // Soft round sprite.
    vec2 d = gl_PointCoord - vec2(0.5);
    float r = dot(d, d);
    float alpha = smoothstep(0.25, 0.0, r);
    // Color rides the lifetime: violet body → warm amber tail.
    vec3 col = mix(uColA, uColB, smoothstep(0.55, 1.0, vLife));
    float ends = smoothstep(0.0, 0.18, vLife) * smoothstep(1.0, 0.72, vLife);
    gl_FragColor = vec4(col, alpha * ends * uIntensity);
  }
`;

function InkField({reduce, intensity}: {reduce: boolean; intensity: number}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const origin = useRef(new THREE.Vector2(0, 0));
  const target = useRef(new THREE.Vector2(0, 0));

  const {positions, seeds} = useMemo(() => {
    const pos = new Float32Array(INK_COUNT * 3);
    const sd = new Float32Array(INK_COUNT);
    for (let i = 0; i < INK_COUNT; i++) {
      // Seed within a tight glyph-ish box; the SVG mask does the hard clipping.
      pos[i * 3 + 0] = (Math.random() - 0.5) * 2.4;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
      sd[i] = Math.random();
    }
    return {positions: pos, seeds: sd};
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: {value: 0},
      uOrigin: {value: new THREE.Vector2(0, 0)},
      uSize: {value: 26},
      uIntensity: {value: intensity},
      uColA: {value: C_VIOLET.clone()},
      uColB: {value: C_AMBER.clone()},
    }),
    [intensity],
  );

  useFrame((state, delta) => {
    const mat = matRef.current;
    if (!mat) return;
    const u = mat.uniforms;
    if (reduce) {
      // Static twin: one settled frame, no advancing time (frameloop=demand).
      u.uTime.value = 1.2;
      u.uOrigin.value.set(0, 0);
      return;
    }
    u.uTime.value += Math.min(delta, 0.05);
    // Ease field origin toward the pointer for the "breathing" parallax.
    target.current.set(state.pointer.x * 0.6, state.pointer.y * 0.4);
    origin.current.lerp(target.current, 0.06);
    u.uOrigin.value.copy(origin.current);
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={inkVertex}
        fragmentShader={inkFragment}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Constellation lines — a single additive LineSegments buffer that draws
 * itself in. `uDraw` (0→1) gates how much of each segment is revealed;
 * here it eases up on mount.
 * ──────────────────────────────────────────────────────────────────────── */
const lineVertex = /* glsl */ `
  uniform float uDraw;
  attribute float aProgress; // 0 at segment start, 1 at segment end
  varying float vReveal;
  void main() {
    vReveal = step(aProgress, uDraw);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const lineFragment = /* glsl */ `
  precision mediump float;
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vReveal;
  void main() {
    if (vReveal < 0.5) discard;
    gl_FragColor = vec4(uColor, uOpacity);
  }
`;

function Constellation({reduce}: {reduce: boolean}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const {geometry, uniforms} = useMemo(() => {
    // Scatter nodes across a wide, shallow field behind the headline.
    const nodes: THREE.Vector3[] = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 7.5,
          (Math.random() - 0.5) * 3.6,
          (Math.random() - 0.5) * 1.2,
        ),
      );
    }
    // Connect each node to its 2 nearest neighbors → sparse, elegant web.
    const segPos: number[] = [];
    const segProg: number[] = [];
    nodes.forEach((a, i) => {
      const dists = nodes
        .map((b, j) => ({j, d: a.distanceTo(b)}))
        .filter((x) => x.j !== i)
        .sort((x, y) => x.d - y.d)
        .slice(0, 2);
      dists.forEach(({j}) => {
        const b = nodes[j];
        const prog = Math.min(a.length(), b.length()) / 4.5; // draw order
        segPos.push(a.x, a.y, a.z, b.x, b.y, b.z);
        segProg.push(prog, prog);
      });
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(segPos, 3),
    );
    geo.setAttribute(
      'aProgress',
      new THREE.Float32BufferAttribute(segProg, 1),
    );
    const u = {
      uDraw: {value: reduce ? 0.7 : 0},
      uColor: {value: C_INDIGO.clone().lerp(C_VIOLET, 0.5)},
      uOpacity: {value: 0.32},
    };
    return {geometry: geo, uniforms: u};
  }, [reduce]);

  useFrame((_, delta) => {
    const mat = matRef.current;
    if (!mat || reduce) return;
    // Self-draw to ~0.7, then hold.
    const u = mat.uniforms.uDraw;
    u.value += (0.7 - u.value) * Math.min(delta * 1.4, 0.1);
  });

  return (
    <lineSegments geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={lineVertex}
        fragmentShader={lineFragment}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * InkCanvas — full-viewport accent. Lives inside .canvasWrap (absolute inset:0,
 * pointer-events:none).
 *
 * Layering strategy:
 *   • The constellation-line layer (behind the headline) is the PRIMARY WebGL
 *     accent and ships on every webgl-capable engine — one Canvas, one frame
 *     loop.
 *   • The glyph-clipped ink flow-field is an ENHANCEMENT that only mounts when
 *     the engine can actually clip an HTML box to the inline SVG <mask>
 *     (Gecko/Firefox today) AND on desktop. Everywhere else we ship the bounded
 *     `.ail-ink-glow` div so no large unclipped additive field can ever cover
 *     the LCP headline. This also means at most ONE always-on Canvas runs on
 *     the overwhelming majority of clients (and on ALL mobile clients).
 *
 * Reduced-motion / coarse-pointer / save-data → no Canvas at all, just the
 * soft-glow div (calm static twin).
 *
 * DPR is set ONLY declaratively via the <Canvas dpr> prop ([1,1.5] desktop /
 * [1,1] mobile); we intentionally do NOT also setDpr imperatively, which would
 * re-allocate the drawing buffer right after first paint (LCP-sensitive).
 * ──────────────────────────────────────────────────────────────────────── */
export default function InkCanvas(): React.ReactNode {
  const reduce = prefersReducedMotion();
  const coarse = isCoarsePointer();
  const saveData = isSaveData();
  const mobile = isMobileWidth();

  // Gate WebGL off for low-power / accessibility / coarse contexts.
  const webgl = !reduce && !coarse && !saveData;
  // The glyph ink is a desktop-only enhancement, and ONLY on engines that truly
  // render the HTML→inline-SVG mask cross-reference (else: bounded glow).
  const [maskOk] = useState<boolean>(() => supportsHtmlSvgMask());
  const inkEnabled = webgl && maskOk && !mobile;

  // Stable mask id (client-only module → no SSR/client id divergence).
  const maskId = useMemo(
    () => `ail-ink-mask-${Math.random().toString(36).slice(2, 8)}`,
    [],
  );

  const glow = <div className="ail-ink-glow" aria-hidden="true" />;

  if (!webgl) {
    return (
      <>
        {glow}
        <InkGlowStyles />
      </>
    );
  }

  return (
    <>
      <InkGlowStyles />

      {/* Layer 1 — constellation lines, full field, behind the headline.
          The single always-on Canvas on the vast majority of clients. */}
      <div className="ail-ink-lines" aria-hidden="true">
        <Canvas
          dpr={mobile ? [1, 1] : [1, 1.5]}
          camera={{position: [0, 0, 6], fov: 50}}
          gl={{antialias: true, alpha: true, powerPreference: 'high-performance'}}
          frameloop={reduce ? 'demand' : 'always'}
          style={{pointerEvents: 'none'}}>
          <Constellation reduce={reduce} />
        </Canvas>
      </div>

      {/* Layer 2 — ink flow-field clipped to the "AI" glyph. Mounts ONLY where
          the mask cross-reference is verified to render (Gecko) and on desktop;
          everywhere else the bounded glow stands in. */}
      {inkEnabled ? (
        <>
          {/* SVG glyph mask: the ink Canvas is clipped to the letters "AI". */}
          <svg
            width="0"
            height="0"
            aria-hidden="true"
            style={{position: 'absolute'}}
            focusable="false">
            <defs>
              <mask id={maskId} maskContentUnits="objectBoundingBox">
                <rect x="0" y="0" width="1" height="1" fill="black" />
                <text
                  x="0.5"
                  y="0.62"
                  textAnchor="middle"
                  fontFamily="'Space Grotesk', sans-serif"
                  fontWeight={800}
                  fontSize="0.7"
                  fill="white">
                  AI
                </text>
              </mask>
            </defs>
          </svg>
          <div
            className="ail-ink-glyph"
            aria-hidden="true"
            style={{
              WebkitMaskImage: `url(#${maskId})`,
              maskImage: `url(#${maskId})`,
            }}>
            <Canvas
              dpr={[1, 1.5]}
              camera={{position: [0, 0, 4.2], fov: 45}}
              gl={{antialias: false, alpha: true, powerPreference: 'high-performance'}}
              frameloop={reduce ? 'demand' : 'always'}
              style={{pointerEvents: 'none'}}>
              <InkField reduce={reduce} intensity={0.95} />
            </Canvas>
          </div>
        </>
      ) : (
        glow
      )}
    </>
  );
}

/* Co-located, token-driven styles for the WebGL layers + glow fallback.
 * Injected once; uses only existing brand tokens. Light mode lowers additive
 * intensity; dark mode lets the glow sing. */
function InkGlowStyles(): React.ReactNode {
  return (
    <style>{`
      .ail-ink-lines,
      .ail-ink-glyph {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }
      .ail-ink-glyph {
        /* Concentrate the masked ink over the wordmark band. */
        top: 38%;
        height: 26%;
        opacity: 0.9;
      }
      .ail-ink-lines { opacity: 0.55; }
      [data-theme='dark'] .ail-ink-lines { opacity: 0.8; }
      [data-theme='dark'] .ail-ink-glyph { opacity: 1; }

      /* Soft violet→amber glow used as the calm static / no-mask fallback. */
      .ail-ink-glow {
        position: absolute;
        left: 50%;
        top: 44%;
        width: clamp(180px, 30vw, 420px);
        height: clamp(120px, 18vw, 240px);
        transform: translate(-50%, -50%);
        pointer-events: none;
        border-radius: 999px;
        background:
          radial-gradient(60% 60% at 40% 45%, color-mix(in srgb, var(--ail-violet) 55%, transparent), transparent 70%),
          radial-gradient(55% 55% at 65% 60%, color-mix(in srgb, var(--ail-accent) 38%, transparent), transparent 72%);
        filter: blur(26px);
        opacity: 0.5;
      }
      [data-theme='dark'] .ail-ink-glow { opacity: 0.7; }
    `}</style>
  );
}
