import React, {useRef} from 'react';
import {Canvas, useFrame} from '@react-three/fiber';
import {Float, Icosahedron, MeshDistortMaterial, Sparkles} from '@react-three/drei';
import type {Group} from 'three';

/**
 * The "knowledge core": a slowly-distorting indigo crystal wrapped in two
 * particle fields. Reacts subtly to the pointer for depth. Client-only — this
 * module is never imported during Docusaurus SSR (see ./index.tsx BrowserOnly).
 */
function KnowledgeCore({reduce}: {reduce: boolean}) {
  const group = useRef<Group>(null);

  useFrame((state) => {
    if (reduce || !group.current) return;
    // Ease the group toward the pointer for a parallax tilt.
    const px = state.pointer.x;
    const py = state.pointer.y;
    group.current.rotation.y += (px * 0.45 - group.current.rotation.y) * 0.04;
    group.current.rotation.x += (-py * 0.32 - group.current.rotation.x) * 0.04;
  });

  return (
    <group ref={group} position={[0, 0.5, 0]}>
      <Float speed={reduce ? 0 : 1.4} rotationIntensity={reduce ? 0 : 0.5} floatIntensity={reduce ? 0 : 1.1}>
        <Icosahedron args={[1.05, 16]}>
          <MeshDistortMaterial
            color="#8b93f8"
            emissive="#6366f1"
            emissiveIntensity={0.62}
            roughness={0.18}
            metalness={0.45}
            distort={reduce ? 0.18 : 0.38}
            speed={reduce ? 0 : 1.7}
            transparent
            opacity={0.95}
          />
        </Icosahedron>
      </Float>
      <Sparkles count={70} scale={7} size={2.4} speed={reduce ? 0 : 0.35} color="#a5b4fc" opacity={0.7} />
      <Sparkles count={28} scale={5} size={3.2} speed={reduce ? 0 : 0.25} color="#fcd34d" opacity={0.5} />
    </group>
  );
}

export default function HeroCanvas(): React.ReactNode {
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{position: [0, 0, 5.8], fov: 45}}
      gl={{antialias: true, alpha: true, powerPreference: 'high-performance'}}
      frameloop={reduce ? 'demand' : 'always'}
      style={{pointerEvents: 'none'}}>
      <ambientLight intensity={1.0} />
      <pointLight position={[4, 3, 5]} intensity={95} color="#818cf8" decay={2} />
      <pointLight position={[-5, -2, 3]} intensity={60} color="#f59e0b" decay={2} />
      <pointLight position={[0, 1, 6]} intensity={45} color="#c7d2fe" decay={2} />
      <KnowledgeCore reduce={reduce} />
    </Canvas>
  );
}
