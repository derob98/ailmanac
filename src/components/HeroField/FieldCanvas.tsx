/**
 * The Almanac Field — client-only WebGL hero.
 *
 * One <points> cloud drifting on a flow field, depth-fogged, with sparse warm
 * "spark" particles and a self-drawing constellation woven through it. An
 * almanac was originally a star chart, so the star-field reading is the brand,
 * not decoration.
 *
 * Deliberate choices:
 * - ONE Canvas for every engine. The previous hero shipped its best effect only
 *   on Gecko (an HTML→SVG mask cross-reference Blink/WebKit silently ignore),
 *   so most visitors saw a flat CSS glow. Nothing here is engine-specific.
 * - All motion lives in the vertex shader; per frame the CPU writes ~4 uniforms.
 * - Pointer comes from a window listener, NOT R3F's state.pointer: the canvas
 *   wrapper is `pointer-events: none` (so the hero text stays selectable), which
 *   means R3F never receives pointer events and its built-in tracking is dead.
 *   That was already silently broken in the old hero.
 * - Rendering stops when the hero leaves the viewport or the tab is hidden.
 */

import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Canvas, useFrame, useThree} from '@react-three/fiber';
import * as THREE from 'three';

import {
  fieldVertex,
  fieldFragment,
  lineVertex,
  lineFragment,
} from './shaders';

/* ── capability probes ─────────────────────────────────────────────── */

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function isCoarsePointer(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches
  );
}

function isSaveData(): boolean {
  const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
  return Boolean(nav && nav.connection && nav.connection.saveData);
}

/** Small-memory devices get the mobile budget even on a wide screen. */
function isLowPower(): boolean {
  const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
  const mem = nav && typeof nav.deviceMemory === 'number' ? nav.deviceMemory : 8;
  const narrow =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(max-width: 996px)').matches;
  return mem <= 4 || narrow;
}

/** Does this browser give us a WebGL context at all? */
function hasWebGL(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const c = document.createElement('canvas');
    return Boolean(
      c.getContext('webgl2') ||
        c.getContext('webgl') ||
        c.getContext('experimental-webgl'),
    );
  } catch {
    return false;
  }
}

/* ── brand palette, read from CSS so themes stay in one place ──────── */

/**
 * Fixed, saturated mid-tones — deliberately NOT the theme's own colour tokens.
 *
 * Under additive blending, overlapping sprites SUM. Feeding it the dark theme's
 * --ifm-color-primary-light (a pale #a5b4fc-family tint) made every cluster
 * saturate straight to white, painting bright blocks over the headline. Mid-600
 * brand hues stay recognisably indigo/violet even where dozens of points pile
 * up, and the amber only ever reads as a warm spark.
 */
const BRAND = {
  near: '#4f46e5', // indigo 600
  far: '#7c3aed', // violet 600
  spark: '#f59e0b', // amber
} as const;

function readBrandColors(): {near: THREE.Color; far: THREE.Color; spark: THREE.Color} {
  return {
    near: new THREE.Color(BRAND.near),
    far: new THREE.Color(BRAND.far),
    spark: new THREE.Color(BRAND.spark),
  };
}

/* ── the particle field ────────────────────────────────────────────── */

function Field({count, reduce}: {count: number; reduce: boolean}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const pointerTarget = useRef(new THREE.Vector2(0, 0));
  const pointerEased = useRef(new THREE.Vector2(0, 0));
  const strength = useRef(0);
  const lastMove = useRef(0);
  const {viewport} = useThree();

  // Geometry is built once. Math.random() is fine here: this module is
  // client-only (BrowserOnly + require), so there is no SSR pass to diverge
  // from — nothing about the point cloud is ever server-rendered.
  const geo = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const sizes = new Float32Array(count);
    const tints = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = -Math.random() * 4 + 1;
      seeds[i] = Math.random();
      // Weighted toward small so a few large points carry the composition.
      sizes[i] = 0.35 + Math.pow(Math.random(), 2.2) * 1.5;
      tints[i] = Math.random() < 0.07 ? 1 : 0;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    g.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    g.setAttribute('aTint', new THREE.BufferAttribute(tints, 1));
    return g;
  }, [count]);

  useEffect(() => () => geo.dispose(), [geo]);

  const uniforms = useMemo(() => {
    const c = readBrandColors();
    return {
      uTime: {value: 0},
      uPointer: {value: new THREE.Vector2(0, 0)},
      uStrength: {value: 0},
      uSize: {value: 34},
      uScroll: {value: 0},
      uColNear: {value: c.near},
      uColFar: {value: c.far},
      uColSpark: {value: c.spark},
      // Low, because additive blending accumulates: the field should read as a
      // faint depth wash behind the type, never compete with it for contrast.
      uIntensity: {value: 0.42},
    };
  }, []);

  // Pointer tracking on window — see the file header for why not state.pointer.
  useEffect(() => {
    if (reduce || isCoarsePointer()) return undefined;
    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -((e.clientY / window.innerHeight) * 2 - 1);
      pointerTarget.current.set((nx * viewport.width) / 2, (ny * viewport.height) / 2);
      lastMove.current = performance.now();
    };
    window.addEventListener('pointermove', onMove, {passive: true});
    return () => window.removeEventListener('pointermove', onMove);
  }, [reduce, viewport.width, viewport.height]);

  useFrame((state, delta) => {
    const m = matRef.current;
    if (!m) return;
    const u = m.uniforms;

    if (reduce) {
      // One settled frame: a still starfield, no drift, no pointer.
      u.uTime.value = 12;
      u.uStrength.value = 0;
      return;
    }

    u.uTime.value += Math.min(delta, 0.05);

    // Ease the pointer and let its influence decay when the cursor rests, so
    // the field relaxes instead of holding a dent.
    const idle = (performance.now() - lastMove.current) / 1000;
    const want = idle > 1.6 ? 0 : 1;
    strength.current += (want - strength.current) * 0.04;
    pointerEased.current.lerp(pointerTarget.current, 0.06);
    u.uPointer.value.copy(pointerEased.current);
    u.uStrength.value = strength.current;

    // Recede as the hero scrolls away. Reading scrollY in the frame loop avoids
    // a scroll listener entirely.
    const h = window.innerHeight || 1;
    u.uScroll.value = Math.min(window.scrollY / h, 1);
  });

  return (
    <points geometry={geo} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        args={[
          {
            uniforms,
            vertexShader: fieldVertex,
            fragmentShader: fieldFragment,
            transparent: true,
            depthWrite: false,
            depthTest: false,
            blending: THREE.AdditiveBlending,
          },
        ]}
      />
    </points>
  );
}

/* ── constellation ─────────────────────────────────────────────────── */

function Constellation({reduce}: {reduce: boolean}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const geo = useMemo(() => {
    const NODES = 18;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < NODES; i++) {
      pts.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 9,
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 1.5,
        ),
      );
    }
    // Link each node to its two nearest neighbours — enough to read as a
    // network without turning into a mesh.
    const verts: number[] = [];
    const orders: number[] = [];
    pts.forEach((p, i) => {
      const near = pts
        .map((q, j) => ({j, d: p.distanceTo(q)}))
        .filter((x) => x.j !== i)
        .sort((a, b) => a.d - b.d)
        .slice(0, 2);
      near.forEach(({j}) => {
        const q = pts[j];
        verts.push(p.x, p.y, p.z, q.x, q.y, q.z);
        const o = i / NODES;
        orders.push(o, o);
      });
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    g.setAttribute('aOrder', new THREE.Float32BufferAttribute(orders, 1));
    return g;
  }, []);

  useEffect(() => () => geo.dispose(), [geo]);

  const uniforms = useMemo(
    () => ({
      uColor: {value: readBrandColors().near},
      uDraw: {value: reduce ? 1 : 0},
      uOpacity: {value: 0.26},
    }),
    [reduce],
  );

  useFrame((_, delta) => {
    const m = matRef.current;
    if (!m || reduce) return;
    if (m.uniforms.uDraw.value < 1) {
      m.uniforms.uDraw.value = Math.min(1, m.uniforms.uDraw.value + delta * 0.35);
    }
  });

  return (
    <lineSegments geometry={geo} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        args={[
          {
            uniforms,
            vertexShader: lineVertex,
            fragmentShader: lineFragment,
            transparent: true,
            depthWrite: false,
            depthTest: false,
            blending: THREE.AdditiveBlending,
          },
        ]}
      />
    </lineSegments>
  );
}

/* ── canvas shell ──────────────────────────────────────────────────── */

export default function FieldCanvas(): React.ReactNode {
  const reduce = prefersReducedMotion();
  const lowPower = isLowPower();
  const hostRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);

  // saveData or no WebGL → render nothing; the CSS mesh + aurora behind this
  // layer are a complete backdrop on their own.
  const [enabled] = useState(() => !isSaveData() && hasWebGL());

  // Stop rendering when the hero is off-screen or the tab is hidden. Without
  // this a 7k-point loop keeps burning battery while someone reads the docs
  // three screens down.
  useEffect(() => {
    if (!enabled) return undefined;
    const el = hostRef.current;
    if (!el) return undefined;

    const io = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      {rootMargin: '96px'},
    );
    io.observe(el);

    const onVis = () => setActive(!document.hidden && true);
    document.addEventListener('visibilitychange', onVis);

    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [enabled]);

  if (!enabled) return null;

  const count = lowPower ? 2200 : 7000;

  return (
    <div ref={hostRef} style={{position: 'absolute', inset: 0}} aria-hidden="true">
      <Canvas
        dpr={lowPower ? [1, 1.25] : [1, 1.75]}
        camera={{position: [0, 0, 6], fov: 55}}
        gl={{
          antialias: false, // points are soft sprites; MSAA buys nothing here
          alpha: true,
          depth: false,
          stencil: false,
          powerPreference: 'high-performance',
        }}
        frameloop={reduce || !active ? 'demand' : 'always'}
        style={{pointerEvents: 'none'}}>
        <Field count={count} reduce={reduce} />
        <Constellation reduce={reduce} />
      </Canvas>
    </div>
  );
}
