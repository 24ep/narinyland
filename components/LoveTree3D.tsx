"use client";

import * as React from 'react';
import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Float, Stars, Sparkles, ContactShadows } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { Emotion } from '../types';

interface LoveTree3DProps {
  anniversaryDate: string;
  treeStyle?: string;
  petEmotion: Emotion;
  petMessage: string;
  level: number;
  daysPerTree: number;
  daysPerFlower?: number;
  flowerType?: string;
  mixedFlowers?: string[];
  leaves: number;
  points: number;
  onAddLeaf: () => void;
  skyMode?: string;
  showQRCode?: boolean;
  petType?: string;
  pets?: Array<{ id: string; type: string; name?: string }>;
  graphicsQuality?: 'low' | 'medium' | 'high';
}

const THEMES: Record<string, any> = {
  oak: {
    trunk: '#8B4513',
    leaves: ['#4ade80', '#22c55e', '#16a34a', '#15803d'],
    bg: '#f0fdf4',
    ground: '#86efac',
    particle: '#22c55e'
  },
  sakura: {
    trunk: '#5D4037',
    leaves: ['#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899'],
    bg: '#fff1f2',
    ground: '#fce7f3',
    particle: '#f472b6'
  },
  neon: {
    trunk: '#4c1d95',
    leaves: ['#22d3ee', '#818cf8', '#c084fc', '#e879f9'],
    bg: '#0f172a',
    ground: '#1e1b4b',
    particle: '#c084fc'
  },
  frozen: {
    trunk: '#475569',
    leaves: ['#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8'],
    bg: '#f0f9ff',
    ground: '#e0f2fe',
    particle: '#38bdf8'
  },
  golden: {
    trunk: '#78350f',
    leaves: ['#fcd34d', '#fbbf24', '#f59e0b', '#d97706'],
    bg: '#fffbeb',
    ground: '#fde68a',
    particle: '#f59e0b'
  },
  midnight: {
    trunk: '#2d3436',
    leaves: ['#a29bfe', '#6c5ce7', '#fd79a8', '#e84393'],
    bg: '#1e1e2e',
    ground: '#2d2b55',
    particle: '#fd79a8'
  }
};

// ─── COMPONENTS ──────────────────────────────────────────────────────

// Individual Leaf with fluttering animation
const Leaf = ({ position, scale, color, offset, windFactor = 1, quality = 'medium' }: { position: [number, number, number], scale: number, color: string, offset: number, windFactor?: number, quality?: string }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current && quality !== 'low') { // Disable leaf animation on low
      const t = state.clock.getElapsedTime();
      // Fluttering effect influenced by windFactor
      meshRef.current.rotation.x = Math.sin(t * windFactor + offset) * (0.15 * windFactor);
      meshRef.current.rotation.z = Math.cos(t * 0.8 * windFactor + offset) * (0.2 * windFactor);
      // Subtle float
      meshRef.current.position.y = position[1] + Math.sin(t * 0.5 * windFactor + offset) * (0.05 * windFactor);
    }
  });

  const segs = quality === 'low' ? 4 : quality === 'medium' ? 6 : 8;

  return (
    <mesh ref={meshRef} position={position} scale={[scale, scale * 0.4, scale * 0.7]} castShadow={quality !== 'low'} receiveShadow={quality !== 'low'}>
      <sphereGeometry args={[0.6, segs, segs]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

// Ambient Falling Leaf
const FallingLeaf = ({ theme }: { theme: any }) => {
    const ref = useRef<THREE.Group>(null);
    const { position, rotation, speed, color, drift } = useMemo(() => {
        const r = Math.random();
        return {
            position: [
                (Math.random() - 0.5) * 6,
                4 + Math.random() * 6,
                (Math.random() - 0.5) * 6
            ] as [number, number, number],
            rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI] as [number, number, number],
            speed: 0.015 + Math.random() * 0.025,
            drift: 0.01 + Math.random() * 0.02,
            color: theme.leaves[Math.floor(Math.random() * theme.leaves.length)]
        };
    }, [theme]);

    useFrame((state) => {
        if (!ref.current) return;
        const t = state.clock.getElapsedTime();
        ref.current.position.y -= speed;
        // Swaying as it falls
        ref.current.position.x += Math.sin(t + position[0]) * drift;
        ref.current.position.z += Math.cos(t * 0.5 + position[2]) * drift;
        
        ref.current.rotation.x += 0.02;
        ref.current.rotation.y += 0.01;
        
        // Reset leaf when it hits ground
        if (ref.current.position.y < 0) {
            ref.current.position.y = 8 + Math.random() * 4;
            ref.current.position.x = (Math.random() - 0.5) * 6;
            ref.current.position.z = (Math.random() - 0.5) * 6;
        }
    });

    return (
        <group ref={ref} position={position} rotation={rotation}>
             <mesh scale={[0.15, 0.04, 0.12]}>
                <sphereGeometry args={[1, 6, 6]} />
                <meshStandardMaterial color={color} transparent opacity={0.8} />
            </mesh>
        </group>
    );
};

// Structural Tree Branch with attached leaves
const Branch = ({ position, rotation, scale, color, theme, leafCount, windFactor, quality = 'medium' }: { 
    position: [number, number, number], 
    rotation: [number, number, number], 
    scale: [number, number, number], 
    color: string,
    theme: any,
    leafCount: number,
    windFactor: number,
    quality?: string
}) => {
    // Generate leaves relative to the branch's local coordinate system (the tip)
    const branchLeaves = useMemo(() => {
        const pos = [];
        // Reduce leaf count for low quality
        const effectiveCount = quality === 'low' ? Math.floor(leafCount * 0.6) : leafCount;
        
        for(let i=0; i<effectiveCount; i++) {
            // Sine-hash for stability within the branch
            const sin1 = Math.sin(i * 123.456 + position[0]) * 10000;
            const r1 = sin1 - Math.floor(sin1);
            const sin2 = Math.sin(i * 789.012 + position[1]) * 10000;
            const r2 = sin2 - Math.floor(sin2);
            const sin3 = Math.sin(i * 456.789 + position[2]) * 10000;
            const r3 = sin3 - Math.floor(sin3);

            // Cluster leaves around the end of the branch [0, 0.6, 0]
            const spread = 0.5 + r1 * 0.3;
            const theta = r2 * Math.PI * 2;
            const phi = r3 * Math.PI;
            
            // Local coordinates relative to branch center
            const lx = Math.sin(phi) * Math.cos(theta) * spread;
            const ly = 0.5 + Math.cos(phi) * spread; // Centered near the top of the branch
            const lz = Math.sin(phi) * Math.sin(theta) * spread;

            pos.push({
                position: [lx, ly, lz] as [number, number, number],
                scale: 0.3 + r1 * 0.4,
                color: theme.leaves[Math.floor(r2 * theme.leaves.length)],
                offset: r3 * Math.PI * 2
            });
        }
        return pos;
    }, [leafCount, theme, position, quality]);

    return (
        <group position={position} rotation={rotation}>
            {/* Main Branch segment */}
            <mesh scale={scale} castShadow receiveShadow>
                <cylinderGeometry args={[0.04, 0.1, 1.2, 8]} />
                <meshStandardMaterial color={color} />
            </mesh>
            {/* Twigs */}
            <mesh position={[0, 0.4, 0.05]} rotation={[0.4, 0, 0.2]} scale={[0.5, 0.6, 0.5]} castShadow={quality !== 'low'}>
                <cylinderGeometry args={[0.02, 0.04, 0.5, 6]} />
                <meshStandardMaterial color={color} />
            </mesh>
            
            {/* Attached Leaves */}
            {branchLeaves.map((leaf, i) => (
                <Leaf 
                    key={i} 
                    position={leaf.position} 
                    scale={leaf.scale} 
                    color={leaf.color} 
                    offset={leaf.offset}
                    windFactor={windFactor}
                    quality={quality}
                />
            ))}
        </group>
    );
};

// Particle explosion when adding a leaf
const LeafExplosion = ({ count = 20, color = "#4ade80" }) => {
  const group = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (group.current) {
        group.current.children.forEach((child: any) => {
            child.position.add(child.userData.velocity);
            child.userData.velocity.y -= delta * 0.5; // Gravity
            child.scale.multiplyScalar(0.95); // Shrink
            child.rotation.x += child.userData.spin.x;
            child.rotation.y += child.userData.spin.y;
            child.rotation.z += child.userData.spin.z;
        });
    }
  });

  const particles = useMemo(() => {
      return Array.from({ length: count }).map(() => ({
          position: [0, 2, 0] as [number, number, number],
          velocity: [
              (Math.random() - 0.5) * 0.2,
              Math.random() * 0.2 + 0.1,
              (Math.random() - 0.5) * 0.2
          ] as [number, number, number],
          spin: {
            x: (Math.random() - 0.5) * 0.2,
            y: (Math.random() - 0.5) * 0.2,
            z: (Math.random() - 0.5) * 0.2
          },
          scale: Math.random() * 0.3 + 0.1,
          color: color
      }));
  }, [count, color]);

  return (
    <group ref={group}>
        {particles.map((p, i) => (
            <mesh key={i} position={p.position} userData={{ velocity: new THREE.Vector3(...p.velocity), spin: p.spin }}>
                <sphereGeometry args={[p.scale, 8, 8]} />
                <meshStandardMaterial color={p.color} emissive={p.color} emissiveIntensity={0.5} transparent opacity={0.8} />
            </mesh>
        ))}
    </group>
  );
};

const Tree = ({ theme, scale = 1, leafCount, windFactor = 1, branchCount = 6, quality = 'medium', shake = false }: { theme: any; scale?: number; leafCount: number; windFactor?: number; branchCount?: number; quality?: string; shake?: boolean }) => {
  const group = useRef<THREE.Group>(null);
  const [pulse, setPulse] = useState(1);
  const prevLeafCount = useRef(leafCount);

  // Generate Stable Branch Structure
  const branches = useMemo(() => {
    const base = [
      { pos: [0.3, 1.8, 0] as [number, number, number], rot: [0, 0, -Math.PI / 3.5] as [number, number, number], scl: [1, 1.5, 1] as [number, number, number] },
      { pos: [-0.3, 2.0, 0] as [number, number, number], rot: [0, 0, Math.PI / 3.5] as [number, number, number], scl: [0.8, 1.3, 0.8] as [number, number, number] },
      { pos: [0, 2.2, 0.3] as [number, number, number], rot: [-Math.PI / 3.5, 0, 0] as [number, number, number], scl: [0.7, 1.2, 0.7] as [number, number, number] },
      { pos: [0, 1.9, -0.3] as [number, number, number], rot: [Math.PI / 3.5, 0, 0] as [number, number, number], scl: [0.7, 1.2, 0.7] as [number, number, number] },
      { pos: [0.2, 2.4, 0.2] as [number, number, number], rot: [-Math.PI / 6, 0, -Math.PI / 6] as [number, number, number], scl: [0.5, 1.0, 0.5] as [number, number, number] },
      { pos: [-0.2, 2.5, -0.2] as [number, number, number], rot: [Math.PI / 6, 0, Math.PI / 6] as [number, number, number], scl: [0.5, 1.0, 0.5] as [number, number, number] },
    ];

    // Procedurally generate extra branches if needed
    if (branchCount > 6) {
        for (let i = 6; i < branchCount; i++) {
            const h = 2.0 + Math.random() * 1.5; // Height 2.0 - 3.5
            const angle = Math.random() * Math.PI * 2;
            const r = 0.2 + Math.random() * 0.3;
            base.push({
                pos: [Math.cos(angle) * r, h, Math.sin(angle) * r] as [number, number, number],
                rot: [(Math.random() - 0.5) * 1, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 1] as [number, number, number],
                scl: [0.4 + Math.random() * 0.4, 0.8 + Math.random() * 0.6, 0.4 + Math.random() * 0.4] as [number, number, number]
            });
        }
    }
    return base.slice(0, branchCount);
  }, [branchCount]);

  // Trigger pulse animation when leafCount increases
  React.useEffect(() => {
    if (leafCount > prevLeafCount.current) {
        setPulse(1.5); // Initial jump
        prevLeafCount.current = leafCount;
    }
  }, [leafCount]);
  
  // Calculate individual branch leaf counts
  // Distribute leaves across branches
  const leavesPerBranch = Math.floor(Math.min(leafCount, 2000) / branches.length);
  const extraLeaves = Math.min(leafCount, 2000) % branches.length;

  // Gentle swaying animation + Growth pulse lerp
  useFrame(({ clock }) => {
    if (group.current) {
        // Wind sway
        let rotZ = Math.sin(clock.elapsedTime * 0.4 * windFactor) * (0.015 * windFactor);
        let rotX = Math.cos(clock.elapsedTime * 0.3 * windFactor) * (0.015 * windFactor);

        // Shake effect
        if (shake) {
            rotZ += Math.sin(clock.elapsedTime * 40) * 0.08;
            rotX += Math.cos(clock.elapsedTime * 45) * 0.08;
        }

        group.current.rotation.z = rotZ;
        group.current.rotation.x = rotX;
        
        // Pulse lerp back to 1 - Elastic bounce
        if (pulse > 1 || pulse < 1) { // generic check, though we sett to 1.5
             // Simple spring-like effect 
             const delta = (1 - pulse) * 0.1;
             setPulse(p => {
                 const next = p + delta;
                 return Math.abs(1 - next) < 0.001 ? 1 : next;
             });
             group.current.scale.setScalar(scale * pulse);
        } else {
             // ensure we stick to target scale
             if (group.current.scale.x !== scale) group.current.scale.setScalar(scale);
        }
    }
  });

  return (
    <group ref={group} scale={scale}>
      {/* Organic Trunk with Roots */}
      <group>
        {/* Main Trunk Segments for Gnarled Look */}
        {[
          { y: 0.4, s: [0.35, 0.8, 0.35], r: [0, 0, 0.05] },
          { y: 1.1, s: [0.28, 0.8, 0.28], r: [0.05, 0, -0.05] },
          { y: 1.7, s: [0.22, 0.8, 0.22], r: [-0.05, 0, 0.02] },
          // Extra trunk height for mature trees
          ...(branchCount > 8 ? [{ y: 2.3, s: [0.18, 0.8, 0.18], r: [0, 0.1, -0.02] }] : [])
        ].map((seg, i) => (
          <mesh key={i} position={[0, seg.y, 0]} rotation={seg.r as [number, number, number]} castShadow receiveShadow>
            <cylinderGeometry args={[seg.s[0]*0.8, seg.s[0], seg.s[1], 8]} />
            <meshStandardMaterial color={theme.trunk} roughness={1} />
          </mesh>
        ))}

        {/* Spreading Roots */}
        {[0, 1, 2, 3, 4].map((i) => {
          const angle = (i / 5) * Math.PI * 2;
          return (
            <mesh 
              key={`root-${i}`} 
              position={[Math.cos(angle) * 0.2, 0.05, Math.sin(angle) * 0.2]} 
              rotation={[Math.PI / 2.2, 0, angle]}
            >
              <capsuleGeometry args={[0.08, 0.4, 4, 8]} />
              <meshStandardMaterial color={theme.trunk} roughness={1} />
            </mesh>
          );
        })}
      </group>

      {/* Foliage Core (Adds depth and hides branch intersections) */}
      <mesh position={[0, 2.8, 0]} scale={[2.5, 2.0, 2.5]}>
          <icosahedronGeometry args={[1, 2]} />
          <meshStandardMaterial 
            color={theme.leaves[0]} 
            transparent 
            opacity={0.4} 
            emissive={theme.leaves[0]} 
            emissiveIntensity={0.2}
            flatShading 
          />
      </mesh>

      {/* Branches */}
      <group>
          {branches.map((br, i) => (
              <Branch 
                key={i} 
                position={br.pos} 
                rotation={br.rot} 
                scale={br.scl} 
                color={theme.trunk} 
                theme={theme}
                leafCount={leavesPerBranch + (i < extraLeaves ? 1 : 0)}
                windFactor={windFactor}
                quality={quality}
              />
          ))}
      </group>
    </group>
  );
};

const Pet3D = React.forwardRef<THREE.Group, { emotion: Emotion; theme: any; petType?: string; startPos?: [number, number, number]; otherPets?: Array<{ ref: React.RefObject<THREE.Group | null>, type: string }> }>(({ emotion, theme, petType = 'cat', startPos = [2, 0, 2], otherPets = [] }, externalRef) => {
  const innerRef = useRef<THREE.Group>(null);
  // Use the external ref if provided, otherwise the internal one
  const ref = (externalRef as React.RefObject<THREE.Group>) || innerRef;
  const coreRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const legRefs = [useRef<THREE.Group>(null), useRef<THREE.Group>(null), useRef<THREE.Group>(null), useRef<THREE.Group>(null)];
  const [active, setActive] = useState(false);
  
  const colors = useMemo(() => {
    switch(petType) {
      case 'cat': return { primary: "#555", secondary: "#fff", nose: "#ff99ad" }; // Grey/White cat
      case 'dog': return { primary: "#e69138", secondary: "#fff", nose: "#222" }; // Shiba dog
      case 'rabbit': return { primary: "#fff", secondary: "#f9a8d4", nose: "#f472b6" }; // White rabbit
      case 'panda': return { primary: "#ffffff", secondary: "#000000", nose: "#000" }; // Black/White panda
      case 'fox': return { primary: "#f97316", secondary: "#fff", nose: "#222" }; // Fox orange
      default: return { primary: "#e69138", secondary: "#fff", nose: "#222" };
    }
  }, [petType]);

  const [activity, setActivity] = useState<'walk' | 'sit' | 'lie' | 'idle' | 'play'>('idle');
  const activityTimer = useRef(0);
  const targetPos = useRef(new THREE.Vector3(2, 0, 2));

  // Jump Physics State
  const isJumping = useRef(false);
  const jumpVelocity = useRef(0);
  const jumpHeight = useRef(0);
  const spinSpeed = useRef(0);

  useFrame((state, delta) => {
    if (ref.current && coreRef.current) {
        const t = state.clock.getElapsedTime();
        activityTimer.current -= delta;

        // 1. Natural Cycle State Machine
        if (activityTimer.current <= 0) {
            if (emotion === 'sleeping') {
                setActivity('lie');
                activityTimer.current = 10;
            } else {
                const states: typeof activity[] = ['walk', 'idle', 'sit', 'lie', 'play'];
                const weights = [0.4, 0.2, 0.1, 0.1, 0.2];
                const rand = Math.random();
                let acc = 0;
                for(let i=0; i<states.length; i++) {
                    acc += weights[i];
                    if (rand < acc) {
                        setActivity(states[i]);
                        break;
                    }
                }
                activityTimer.current = 4 + Math.random() * 6;
            }
            
            if (activity === 'walk' || activity === 'play') {
                const angle = Math.random() * Math.PI * 2;
                const dist = activity === 'play' ? 1.0 + Math.random() * 2.0 : 1.5 + Math.random() * 4.5;
                
                // If playing, try to pick a point near a companion
                let finalTarget = new THREE.Vector3(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
                if (activity === 'play' && otherPets.length > 0) {
                    const companion = otherPets[Math.floor(Math.random() * otherPets.length)];
                    if (companion.ref.current) {
                        const companionPos = companion.ref.current.position;
                        finalTarget.set(companionPos.x + (Math.random() - 0.5) * 2, 0, companionPos.z + (Math.random() - 0.5) * 2);
                    }
                }
                targetPos.current.copy(finalTarget);
            }
        }

        const head = coreRef.current.children[2] as THREE.Group;
        
        // 2. Natural Animation Procedural Lerping
        let targetY = 0;
        let targetBodyRot = 0;
        let legRotX = [0, 0, 0, 0]; 
        let legRotZ = [0, 0, 0, 0];

        switch(activity) {
            case 'walk':
                ref.current.position.lerp(targetPos.current, 0.02);
                const dir = targetPos.current.clone().sub(ref.current.position).normalize();
                if (dir.lengthSq() > 0.001) {
                    const targetQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
                    ref.current.quaternion.slerp(targetQuat, 0.1);
                }
                targetY = Math.abs(Math.sin(t * 10)) * 0.1;
                legRotX = [
                    Math.sin(t * 12) * 0.6,
                    Math.sin(t * 12 + Math.PI) * 0.6,
                    Math.sin(t * 12 + Math.PI) * 0.6,
                    Math.sin(t * 12) * 0.6
                ];
                if (head) head.rotation.x = Math.sin(t * 10) * 0.05;
                break;

            case 'sit':
                targetY = -0.15;
                targetBodyRot = -Math.PI / 10;
                legRotX = [0, 0, -1.2, -1.2];
                if (head) {
                    head.rotation.x = -0.1 + Math.sin(t * 0.5) * 0.2;
                    head.rotation.y = Math.sin(t * 0.3) * 0.4;
                }
                break;

            case 'lie':
                targetY = -0.3;
                targetBodyRot = 0;
                legRotX = [-Math.PI / 2.2, -Math.PI / 2.2, -Math.PI / 2.2, -Math.PI / 2.2];
                if (head) {
                    head.rotation.x = 0.2;
                    head.rotation.y = Math.sin(t * 0.2) * 0.1;
                }
                break;

            case 'play':
                ref.current.position.lerp(targetPos.current, 0.04); // Move faster when playing
                const pDir = targetPos.current.clone().sub(ref.current.position).normalize();
                if (pDir.lengthSq() > 0.001) {
                    const tQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), pDir);
                    ref.current.quaternion.slerp(tQuat, 0.2);
                }
                targetY = 0.2 + Math.abs(Math.sin(t * 15)) * 0.4; // Jump higher
                legRotX = [
                    Math.sin(t * 20) * 0.8,
                    Math.sin(t * 20 + Math.PI) * 0.8,
                    Math.sin(t * 20 + Math.PI) * 0.8,
                    Math.sin(t * 20) * 0.8
                ];
                if (head) head.rotation.z = Math.sin(t * 10) * 0.2; // Wiggle head
                break;

            default: 
                targetY = Math.sin(t * 2) * 0.02;
                if (head) {
                    head.rotation.x = Math.sin(t * 1) * 0.1;
                    head.rotation.y = Math.sin(t * 0.5) * 0.3;
                }
                break;
        }

        coreRef.current.position.y = THREE.MathUtils.lerp(coreRef.current.position.y, targetY, 0.1);
        coreRef.current.rotation.x = THREE.MathUtils.lerp(coreRef.current.rotation.x, targetBodyRot, 0.1);
        
        if (headRef.current) {
            let headX = 0;
            let headY = 0;
            if (activity === 'walk') {
               headX = Math.sin(t * 10) * 0.1;
            } else {
               const cameraPos = state.camera.position.clone();
               const localLook = headRef.current.parent!.worldToLocal(cameraPos);
               headY = Math.atan2(localLook.x, localLook.z);
               headX = -Math.atan2(localLook.y, Math.sqrt(localLook.x * localLook.x + localLook.z * localLook.z));
               headY = THREE.MathUtils.clamp(headY, -Math.PI / 2.5, Math.PI / 2.5);
               headX = THREE.MathUtils.clamp(headX, -Math.PI / 4, Math.PI / 6);
               headY += Math.sin(t * 0.5) * 0.1;
               headX += Math.cos(t * 0.3) * 0.05;
            }
            headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, headX, 0.1);
            headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, headY, 0.1);
        }

        legRefs.forEach((leg, i) => {
            if (leg.current) {
                leg.current.rotation.x = THREE.MathUtils.lerp(leg.current.rotation.x, legRotX[i], 0.1);
                leg.current.rotation.z = THREE.MathUtils.lerp(leg.current.rotation.z, legRotZ[i], 0.1);
            }
        });

        if (tailRef.current) {
            const wagSpeed = (activity === 'walk' || emotion === 'excited') ? 15 : 2;
            tailRef.current.rotation.z = (Math.PI / 8) + Math.sin(t * wagSpeed) * 0.2;
        }

        // Jump Physics Custom Animation overrides everything else
        if (isJumping.current) {
            jumpVelocity.current -= delta * 15; // Gravity
            jumpHeight.current += jumpVelocity.current * delta;
            
            // Spin while jumping
            if (coreRef.current) {
                coreRef.current.rotation.y += spinSpeed.current * delta;
            }

            if (jumpHeight.current <= 0) {
                jumpHeight.current = 0;
                isJumping.current = false;
                // Landing wobble
                ref.current.scale.set(1.2, 0.8, 1.2);
            }
            // Apply Jump Height to Core
            if (coreRef.current) {
                coreRef.current.position.y = Math.max(0, coreRef.current.position.y + jumpHeight.current);
            }
        }

        // Elastic recovery from landing squash
        ref.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }
  });

  const handlePetClick = (e: any) => {
    e.stopPropagation();
    
    if (!isJumping.current) {
        isJumping.current = true;
        jumpVelocity.current = 6.0; // Initial jump force
        spinSpeed.current = Math.random() > 0.5 ? 10 : -10; // Random spin direction
        
        // Squash before jump
        ref.current.scale.set(1.2, 0.8, 1.2);
        
        setActive(true);
        setTimeout(() => setActive(false), 500);
    }
  };

  return (
    <group ref={ref} position={startPos} onClick={handlePetClick}>
        <group ref={coreRef}>
            {/* Body */}
            <mesh position={[0, 0.45, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <capsuleGeometry args={[0.25, 0.45, 4, 8]} />
                <meshStandardMaterial color={petType === 'panda' ? colors.primary : colors.primary} />
            </mesh>
            {/* Underbelly Patch */}
            <mesh position={[0, 0.38, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
                <capsuleGeometry args={[0.2, 0.4, 4, 8]} />
                <meshStandardMaterial color={petType === 'panda' ? colors.secondary : colors.secondary} transparent opacity={petType === 'panda' ? 1 : 0.6} />
            </mesh>

            {/* Head */}
            <group ref={headRef} position={[0, 0.7, 0.35]}>
                <mesh castShadow>
                    <sphereGeometry args={[0.28, 16, 16]} />
                    <meshStandardMaterial color={colors.primary} />
                </mesh>
                
                {/* Face Patch */}
                <mesh position={[0, -0.05, 0.1]} scale={[1, 0.8, 1]}>
                    <sphereGeometry args={[0.22, 12, 12]} />
                    <meshStandardMaterial color={colors.secondary} />
                </mesh>
                
                {/* Snout */}
                <group position={[0, -0.05, 0.25]}>
                    <mesh castShadow>
                        <boxGeometry args={[petType === 'rabbit' ? 0.1 : 0.15, 0.12, 0.15]} />
                        <meshStandardMaterial color={colors.secondary} />
                    </mesh>
                    <mesh position={[0, 0.04, 0.08]}>
                        <sphereGeometry args={[petType === 'rabbit' ? 0.02 : 0.03, 8, 8]} />
                        <meshStandardMaterial color={colors.nose} />
                    </mesh>
                </group>

                {/* Eyes */}
                <mesh position={[0.12, 0.08, 0.2]}>
                    <sphereGeometry args={[0.035, 8, 8]} />
                    <meshStandardMaterial color="#111" />
                </mesh>
                <mesh position={[-0.12, 0.08, 0.2]}>
                    <sphereGeometry args={[0.035, 8, 8]} />
                    <meshStandardMaterial color="#111" />
                </mesh>

                {/* Ears */}
                {petType === 'rabbit' ? (
                  <>
                    <mesh position={[0.1, 0.4, 0]} rotation={[0.1, 0, 0]}>
                        <capsuleGeometry args={[0.05, 0.4, 4, 8]} />
                        <meshStandardMaterial color={colors.primary} />
                    </mesh>
                    <mesh position={[-0.1, 0.4, 0]} rotation={[0.1, 0, 0]}>
                        <capsuleGeometry args={[0.05, 0.4, 4, 8]} />
                        <meshStandardMaterial color={colors.primary} />
                    </mesh>
                  </>
                ) : petType === 'panda' ? (
                  <>
                    <mesh position={[0.2, 0.25, 0.1]} rotation={[0, 0, 0]}>
                        <sphereGeometry args={[0.1, 8, 8]} />
                        <meshStandardMaterial color={colors.secondary} />
                    </mesh>
                    <mesh position={[-0.2, 0.25, 0.1]} rotation={[0, 0, 0]}>
                        <sphereGeometry args={[0.1, 8, 8]} />
                        <meshStandardMaterial color={colors.secondary} />
                    </mesh>
                  </>
                ) : (
                  <>
                    <mesh position={[0.18, 0.22, 0.1]} rotation={[0.2, 0, -0.3]}>
                        <coneGeometry args={[0.08, 0.2, 4]} />
                        <meshStandardMaterial color={colors.primary} />
                    </mesh>
                    <mesh position={[-0.18, 0.22, 0.1]} rotation={[0.2, 0, 0.3]}>
                        <coneGeometry args={[0.08, 0.2, 4]} />
                        <meshStandardMaterial color={colors.primary} />
                    </mesh>
                  </>
                )}
            </group>

            {/* Tail */}
            <group ref={tailRef} position={[0, 0.6, -0.45]} rotation={[-0.5, 0, 0]}>
                {petType === 'rabbit' ? (
                   <mesh castShadow>
                      <sphereGeometry args={[0.1, 8, 8]} />
                      <meshStandardMaterial color={colors.primary} />
                   </mesh>
                ) : petType === 'fox' ? (
                   <mesh castShadow rotation={[Math.PI/2, 0, 0]} position={[0, -0.2, -0.2]}>
                      <capsuleGeometry args={[0.12, 0.4, 4, 8]} />
                      <meshStandardMaterial color={colors.primary} />
                   </mesh>
                ) : (
                    <mesh castShadow>
                        <torusGeometry args={[0.12, 0.05, 8, 16, Math.PI * 1.5]} />
                        <meshStandardMaterial color={colors.primary} />
                    </mesh>
                )}
                <mesh position={[0, 0.1, 0]}>
                    <sphereGeometry args={[0.07, 8, 8]} />
                    <meshStandardMaterial color={colors.secondary} />
                </mesh>
            </group>

            {/* Legs */}
            {[
                { p: [0.15, 0.25, 0.2], r: legRefs[0] }, 
                { p: [-0.15, 0.25, 0.2], r: legRefs[1] }, 
                { p: [0.15, 0.25, -0.2], r: legRefs[2] }, 
                { p: [-0.15, 0.25, -0.2], r: legRefs[3] }  
            ].map((leg, i) => (
                <group key={i} position={leg.p as [number, number, number]} ref={leg.r} scale={petType === 'panda' ? [1.2, 1, 1.2] : [1, 1, 1]}>
                    <mesh position={[0, -0.15, 0]} castShadow>
                        <boxGeometry args={[0.08, 0.3, 0.08]} />
                        <meshStandardMaterial color={(petType === 'panda') ? colors.secondary : colors.primary} />
                    </mesh>
                    <mesh position={[0, -0.3, 0.02]}>
                        <boxGeometry args={[0.09, 0.05, 0.12]} />
                        <meshStandardMaterial color={colors.secondary} />
                    </mesh>
                </group>
            ))}
        </group>

        {/* Emotion Particles */}
        {(emotion === 'excited' || emotion === 'playing' || active) && (
             <Float speed={5} rotationIntensity={0} floatIntensity={0.5}>
                 <Text position={[0, 1.8, 0]} fontSize={0.5} outlineWidth={0.02} outlineColor="#ffffff">
                    {emotion === 'excited' ? '❤️' : '🎵'}
                 </Text>
             </Float>
        )}
        {emotion === 'sleeping' && (
             <Float speed={2} rotationIntensity={0} floatIntensity={0.3}>
                 <Text position={[0.5, 1.5, 0]} fontSize={0.4} color="#818cf8">Zzz</Text>
             </Float>
        )}
    </group>
  );
});

const Flower = ({ type, position, scale = 1, windFactor = 1, quality = 'medium' }: { type: string, position: [number, number, number], scale?: number, windFactor?: number, quality?: string }) => {
    const groupRef = useRef<THREE.Group>(null);
    const stemColor = "#15803d";
    const seed = useMemo(() => Math.random() * Math.PI * 2, []);
    
    useFrame((state) => {
        if (groupRef.current) {
            const t = state.clock.getElapsedTime();
            // Organic swaying in the wind - disable on low
            if (quality !== 'low') {
                groupRef.current.rotation.x = Math.sin(t * 1.5 * windFactor + seed) * (0.1 * windFactor);
                groupRef.current.rotation.z = Math.cos(t * 1.2 * windFactor + seed) * (0.05 * windFactor);
            }
        }
    });
    
    return (
        <group position={position} scale={scale} ref={groupRef}>
            {/* Stem */}
            <mesh position={[0, 0.2, 0]} castShadow>
                <cylinderGeometry args={[0.015, 0.025, 0.4]} />
                <meshStandardMaterial color={stemColor} />
            </mesh>

            {/* Bloom */}
            <group position={[0, 0.4, 0]}>
                {type === 'sunflower' && (
                    <group>
                        {[
                            { pos: [0, 0, 0], s: 1, rotY: 0 },
                            { pos: [0.1, -0.05, 0.08], s: 0.7, rotY: 1 },
                            { pos: [-0.08, -0.02, -0.05], s: 0.85, rotY: 2.5 }
                        ].map((sf, k) => (
                            <group key={k} position={sf.pos as [number, number, number]} scale={sf.s} rotation={[0, sf.rotY, 0]}>
                                 <group position={[0, -0.2, 0]}>
                                     {/* Tall Stem */}
                                     <mesh position={[0, 0.35, 0]}>
                                         <cylinderGeometry args={[0.02, 0.03, 0.7, 8]} />
                                         <meshStandardMaterial color={stemColor} />
                                     </mesh>
                                     
                                     {/* Large Leaves */}
                                     <mesh position={[0.08, 0.2, 0]} rotation={[0, 0, -0.5]}>
                                         <sphereGeometry args={[0.08, 8, 4]} scale={[1.5, 0.2, 1]} />
                                         <meshStandardMaterial color={stemColor} side={THREE.DoubleSide} />
                                     </mesh>
                                     <mesh position={[-0.08, 0.4, 0]} rotation={[0, 0, 0.5]}>
                                         <sphereGeometry args={[0.08, 8, 4]} scale={[1.5, 0.2, 1]} />
                                         <meshStandardMaterial color={stemColor} side={THREE.DoubleSide} />
                                     </mesh>

                                     {/* Flower Head */}
                                     <group position={[0, 0.65, 0.05]} rotation={[0.4, 0, 0]}>
                                        <mesh position={[0, 0, -0.02]} rotation={[Math.PI/2, 0, 0]}>
                                            <cylinderGeometry args={[0.03, 0.02, 0.05, 8]} />
                                            <meshStandardMaterial color={stemColor} />
                                        </mesh>
                                        
                                        {/* Petals */}
                                        {Array.from({ length: 16 }).map((_, i) => (
                                            <mesh key={i} rotation={[0, 0, (i / 16) * Math.PI * 2]} position={[0, 0, 0]}>
                                                <mesh position={[0.18, 0, 0]}>
                                                    <sphereGeometry args={[0.1, 8, 4]} scale={[1.8, 0.4, 1]} />
                                                    <meshStandardMaterial color="#fbbf24" emissive="#d97706" emissiveIntensity={0.2} />
                                                </mesh>
                                            </mesh>
                                        ))}
                                        {/* Center */}
                                        <mesh position={[0, 0, 0.03]}>
                                            <circleGeometry args={[0.14, 24]} />
                                            <meshStandardMaterial color="#451a03" roughness={1} />
                                        </mesh>
                                        {/* Seeds Detail */}
                                        <mesh position={[0, 0, 0.035]}>
                                            <ringGeometry args={[0, 0.12, 16]} /> 
                                            <meshStandardMaterial color="#78350f" wireframe opacity={0.3} transparent />
                                        </mesh>
                                     </group>
                                 </group>
                            </group>
                        ))}
                    </group>
                )}
                {type === 'tulip' && (
                    <group>
                        {[
                            { pos: [0, 0, 0], s: 1, r: [0, 0, 0] },
                            { pos: [0.06, -0.02, 0.06], s: 0.85, r: [0.1, 2, 0.1] },
                            { pos: [-0.06, -0.01, -0.05], s: 0.9, r: [-0.1, 4, -0.1] }
                        ].map((tData, k) => (
                            <group key={k} position={tData.pos as [number, number, number]} scale={tData.s} rotation={tData.r as [number, number, number]}>
                                 <group position={[0, 0.1, 0]}>
                                     {/* Stem Base */}
                                     <mesh position={[0, -0.1, 0]}>
                                         <cylinderGeometry args={[0.04, 0.03, 0.25, 8]} />
                                         <meshStandardMaterial color={stemColor} />
                                     </mesh>

                                     {/* Flower Head */}
                                     <group position={[0, 0.12, 0]}>
                                        {/* Tulip Cup */}
                                        <group scale={[1, 1, 1]}>
                                            {/* Main Cup */}
                                            <mesh position={[0, 0.08, 0]}>
                                                <cylinderGeometry args={[0.04, 0.07, 0.12, 8, 1, true]} />
                                                <meshStandardMaterial color="#be123c" side={THREE.DoubleSide} />
                                            </mesh>
                                            {/* Petals */}
                                            {[0, 1, 2].map((i) => (
                                                <mesh 
                                                    key={i} 
                                                    rotation={[0.1, i * (Math.PI * 2 / 3), 0]} 
                                                    position={[Math.sin(i * (Math.PI * 2 / 3)) * 0.03, 0.1, Math.cos(i * (Math.PI * 2 / 3)) * 0.03]}
                                                >
                                                    <sphereGeometry args={[0.045, 8, 16, 0, Math.PI * 2, 0, Math.PI/2]} />
                                                    <meshStandardMaterial color="#f43f5e" emissive="#be123c" emissiveIntensity={0.1} side={THREE.DoubleSide} />
                                                </mesh>
                                            ))}
                                        </group>
                                     </group>

                                     {/* Long Leaves */}
                                     <group position={[0, -0.15, 0]}>
                                          <mesh rotation={[0.4, 0, 0]} position={[0, 0.12, 0.06]}>
                                              <cylinderGeometry args={[0.01, 0.03, 0.4, 4]} />
                                              <meshStandardMaterial color={stemColor} />
                                          </mesh>
                                          <mesh rotation={[0.5, Math.PI, 0]} position={[0, 0.1, -0.06]} scale={0.85}>
                                              <cylinderGeometry args={[0.01, 0.03, 0.4, 4]} />
                                              <meshStandardMaterial color={stemColor} />
                                          </mesh>
                                     </group>
                                </group>
                            </group>
                        ))}
                    </group>
                )}
                {type === 'rose' && (
                     <group>
                        {[
                            { pos: [0, 0, 0], s: 0.8, c: "#be123c" },
                            { pos: [0.08, -0.05, 0.05], s: 0.6, c: "#9f1239" },
                            { pos: [-0.07, -0.08, -0.06], s: 0.7, c: "#e11d48" }
                        ].map((rData, k) => (
                            <group key={k} position={rData.pos as [number, number, number]} scale={rData.s} rotation={[Math.random()*0.5, Math.random()*Math.PI, Math.random()*0.5]}>
                                <mesh castShadow position={[0, 0.1, 0]}>
                                    <torusKnotGeometry args={[0.08, 0.03, 64, 8, 2, 3]} />
                                    <meshStandardMaterial color={rData.c} roughness={0.3} emissive={rData.c} emissiveIntensity={0.2} />
                                </mesh>
                                {/* Leaves */}
                                <group position={[0, -0.05, 0]}>
                                     <mesh rotation={[0.5, 0, 0]} position={[0, 0, 0.06]}>
                                         <coneGeometry args={[0.04, 0.15, 3]} />
                                         <meshStandardMaterial color={stemColor} />
                                     </mesh>
                                      <mesh rotation={[0.5, Math.PI, 0]} position={[0, -0.02, -0.06]}>
                                         <coneGeometry args={[0.04, 0.15, 3]} />
                                         <meshStandardMaterial color={stemColor} />
                                     </mesh>
                                </group>
                            </group>
                        ))}
                    </group>
                )}
                {type === 'cherry' && (
                    <group>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <mesh key={i} rotation={[0, (i / 5) * Math.PI * 2, 0.5]} position={[0, 0, 0]}>
                                <sphereGeometry args={[0.1, 8, 8]} scale={[1.2, 0.4, 1]} />
                                <meshStandardMaterial color="#fbcfe8" transparent opacity={0.9} />
                            </mesh>
                        ))}
                        <mesh>
                            <sphereGeometry args={[0.04, 8, 8]} />
                            <meshStandardMaterial color="#f472b6" />
                        </mesh>
                    </group>
                )}
                {type === 'lavender' && (
                    <group>
                        {[
                            { x: 0, z: 0, h: 1 }, 
                            { x: 0.05, z: 0.05, h: 0.8 },
                            { x: -0.05, z: 0.05, h: 0.9 },
                            { x: 0.05, z: -0.05, h: 0.85 },
                            { x: -0.05, z: -0.05, h: 0.75 }
                        ].map((pos, k) => (
                            <group key={k} position={[pos.x, 0, pos.z]} scale={[1, pos.h, 1]} rotation={[Math.random()*0.2, 0, Math.random()*0.2]}>
                                {/* Stem */}
                                <mesh position={[0, 0, 0]}>
                                    <cylinderGeometry args={[0.005, 0.005, 0.4, 4]} />
                                    <meshStandardMaterial color="#4ade80" />
                                </mesh>
                                {/* Buds */}
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <mesh key={i} position={[0, 0.1 + i * 0.04, 0]}>
                                        <sphereGeometry args={[0.025 - i * 0.002, 6, 6]} />
                                        <meshStandardMaterial color="#a78bfa" emissive="#7c3aed" emissiveIntensity={0.3} />
                                    </mesh>
                                ))}
                            </group>
                        ))}
                    </group>
                )}
                {type === 'cactus' && (
                    <group>
                        <mesh position={[0, 0.1, 0]}>
                            <cylinderGeometry args={[0.12, 0.12, 0.3, 8]} />
                            <meshStandardMaterial color="#166534" flatShading />
                        </mesh>
                        {/* Spikes */}
                        {Array.from({ length: 12 }).map((_, i) => (
                             <mesh key={i} position={[Math.cos(i) * 0.12, 0.1 + (i % 3) * 0.05, Math.sin(i) * 0.12]} rotation={[0, 0, Math.PI / 2]}>
                                <coneGeometry args={[0.005, 0.04, 3]} />
                                <meshStandardMaterial color="white" />
                             </mesh>
                        ))}
                    </group>
                )}
                {type === 'heart' && (
                    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                        <group scale={0.4} rotation={[0, 0, Math.PI]}>
                            <mesh position={[0.1, 0, 0]}>
                                <sphereGeometry args={[0.15, 16, 16]} />
                                <meshStandardMaterial color="#f43f5e" emissive="#fb7185" emissiveIntensity={0.5} />
                            </mesh>
                            <mesh position={[-0.1, 0, 0]}>
                                <sphereGeometry args={[0.15, 16, 16]} />
                                <meshStandardMaterial color="#f43f5e" emissive="#fb7185" emissiveIntensity={0.5} />
                            </mesh>
                            <mesh position={[0, -0.15, 0]} rotation={[Math.PI, 0, 0]}>
                                <coneGeometry args={[0.26, 0.4, 16]} />
                                <meshStandardMaterial color="#f43f5e" emissive="#fb7185" emissiveIntensity={0.5} />
                            </mesh>
                        </group>
                    </Float>
                )}
                {!['sunflower', 'tulip', 'rose', 'cherry', 'lavender', 'cactus', 'heart'].includes(type) && (
                    <mesh>
                        <torusGeometry args={[0.1, 0.05, 16, 32]} />
                        <meshStandardMaterial color="hotpink" emissive="hotpink" emissiveIntensity={0.5} />
                    </mesh>
                )}
            </group>
        </group>
    );
};

const Grass = ({ position, windFactor = 1 }: { position: [number, number, number], windFactor?: number }) => {
    const groupRef = useRef<THREE.Group>(null);
    const seed = useMemo(() => Math.random() * 100, []);
    
    useFrame((state) => {
        if (groupRef.current) {
            const t = state.clock.getElapsedTime();
            groupRef.current.rotation.x = Math.sin(t * 1 + seed) * (0.05 * windFactor);
            groupRef.current.rotation.z = Math.cos(t * 0.8 + seed) * (0.05 * windFactor);
        }
    });

    return (
        <group position={position} ref={groupRef}>
            {/* Clump of blades */}
            {Array.from({ length: 7 }).map((_, i) => {
                const angle = (i / 7) * Math.PI * 2 + seed;
                const r = 0.05 + Math.random() * 0.05;
                const h = 0.3 + Math.random() * 0.2;
                return (
                    <mesh 
                        key={i} 
                        position={[Math.cos(angle)*r, h/2, Math.sin(angle)*r]} 
                        rotation={[Math.random()*0.2, angle, Math.random()*0.2]}
                        castShadow
                    >
                        <coneGeometry args={[0.015, h, 3]} />
                        <meshStandardMaterial color={i % 2 === 0 ? "#4ade80" : "#22c55e"} />
                    </mesh>
                )
            })}
        </group>
    );
};

const Bird = () => {
    const ref = useRef<THREE.Group>(null);
    const speed = useMemo(() => 0.4 + Math.random() * 0.4, []);
    const radius = useMemo(() => 6 + Math.random() * 4, []);
    const yOffset = useMemo(() => 6 + Math.random() * 2, []);
    const startPhase = useMemo(() => Math.random() * Math.PI * 2, []);

    useFrame(({ clock }) => {
        if (!ref.current) return;
        const t = clock.elapsedTime * speed + startPhase;
        ref.current.position.x = Math.cos(t) * radius;
        ref.current.position.z = Math.sin(t) * radius;
        ref.current.position.y = yOffset + Math.sin(t * 3) * 0.6;
        ref.current.rotation.y = -t + Math.PI / 2;
        ref.current.rotation.z = Math.sin(t * 2) * 0.2; // Bank into turns
        
        // Wing flap
        const wingL = ref.current.children[0] as THREE.Mesh;
        const wingR = ref.current.children[1] as THREE.Mesh;
        if (wingL && wingR) {
            wingL.rotation.z = Math.sin(clock.elapsedTime * 12) * 0.7;
            wingR.rotation.z = -Math.sin(clock.elapsedTime * 12) * 0.7;
        }
    });

    return (
        <group ref={ref}>
            {/* Wings with better shape */}
            <mesh position={[-0.15, 0, 0]}>
                <boxGeometry args={[0.3, 0.01, 0.15]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh position={[0.15, 0, 0]}>
                <boxGeometry args={[0.3, 0.01, 0.15]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
            <group>
                <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
                    <capsuleGeometry args={[0.06, 0.15, 4, 8]} />
                    <meshStandardMaterial color="#475569" />
                </mesh>
                {/* Beak */}
                <mesh position={[0, 0, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
                    <coneGeometry args={[0.02, 0.08, 4]} />
                    <meshStandardMaterial color="#f59e0b" />
                </mesh>
            </group>
        </group>
    );
};

const Butterfly = ({ flowers }: { flowers: any[] }) => {
    const ref = useRef<THREE.Group>(null);
    const [activity, setActivity] = useState<'flutter' | 'hover' | 'zip' | 'land'>('flutter');
    const timer = useRef(0);
    const targetPos = useRef(new THREE.Vector3());
    const color = useMemo(() => ['#f472b6', '#60a5fa', '#fbbf24', '#a78bfa', '#2dd4bf'][Math.floor(Math.random() * 5)], []);
    const basePos = useMemo(() => [(Math.random() - 0.5) * 10, 2 + Math.random() * 2, (Math.random() - 0.5) * 10], []);

    useFrame((state, delta) => {
        if (!ref.current) return;
        const t = state.clock.elapsedTime;
        timer.current -= delta;

        // 1. Behavior State Machine
        if (timer.current <= 0) {
            const choices: typeof activity[] = ['flutter', 'hover', 'zip', 'land'];
            const newActivity = choices[Math.floor(Math.random() * choices.length)];
            setActivity(newActivity);
            timer.current = 3 + Math.random() * 4;
            
            if (newActivity === 'land' && flowers.length > 0) {
                // Land on a specific flower
                const flower = flowers[Math.floor(Math.random() * flowers.length)];
                targetPos.current.set(flower.x, 0.45, flower.z); // Sit on top of flower bloom
            } else {
                // New random air target
                targetPos.current.set(
                    (Math.random() - 0.5) * 8,
                    1 + Math.random() * 2,
                    (Math.random() - 0.5) * 8
                );
            }
        }

        // 2. Movement Logic
        const moveSpeed = activity === 'zip' ? 0.08 : (activity === 'land' ? 0.04 : (activity === 'hover' ? 0.01 : 0.03));
        ref.current.position.lerp(targetPos.current, moveSpeed);
        
        // Add organic jitter (stopped when landed)
        if (activity !== 'land' || ref.current.position.distanceTo(targetPos.current) > 0.1) {
            ref.current.position.y += Math.sin(t * 10) * 0.015;
        }

        // 3. Orientation
        const dir = targetPos.current.clone().sub(ref.current.position).normalize();
        if (dir.lengthSq() > 0.001) {
            const targetQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
            ref.current.quaternion.slerp(targetQuat, 0.05);
        }
        
        // Bank based on movement
        ref.current.rotation.z = Math.sin(t * 5) * 0.2;

        // 4. Wing Flap Logic
        const wingFL = ref.current.children[0] as THREE.Group; // Front Wing L
        const wingFR = ref.current.children[1] as THREE.Group; // Front Wing R
        const wingBL = ref.current.children[2] as THREE.Group; // Back Wing L
        const wingBR = ref.current.children[3] as THREE.Group; // Back Wing R

        if (wingFL && wingFR && wingBL && wingBR) {
            const isLanded = activity === 'land' && ref.current.position.distanceTo(targetPos.current) < 0.2;
            const flapSpeed = isLanded ? 1 : (activity === 'zip' ? 30 : (activity === 'hover' ? 12 : 20));
            const flapAngle = isLanded ? 0.2 : (activity === 'hover' ? 0.6 : 1.2);
            
            const wingAngle = Math.sin(t * flapSpeed) * flapAngle;
            wingFL.rotation.y = wingAngle;
            wingFR.rotation.y = -wingAngle;
            wingBL.rotation.y = wingAngle * 0.8; // Back wings follow with less range
            wingBR.rotation.y = -wingAngle * 0.8;
        }
    });

    return (
        <group ref={ref} position={basePos as [number, number, number]}>
            {/* Front Wings */}
            <group position={[-0.02, 0, 0.05]}>
                <mesh rotation={[0, 0, 0.2]}>
                    <planeGeometry args={[0.15, 0.2]} />
                    <meshStandardMaterial color={color} transparent opacity={0.95} side={THREE.DoubleSide} />
                </mesh>
            </group>
            <group position={[0.02, 0, 0.05]}>
                <mesh rotation={[0, 0, -0.2]}>
                    <planeGeometry args={[0.15, 0.2]} />
                    <meshStandardMaterial color={color} transparent opacity={0.95} side={THREE.DoubleSide} />
                </mesh>
            </group>
            
            {/* Back Wings */}
            <group position={[-0.02, 0, -0.05]}>
                <mesh rotation={[0, 0, 0.5]}>
                    <planeGeometry args={[0.12, 0.12]} />
                    <meshStandardMaterial color={color} transparent opacity={0.8} side={THREE.DoubleSide} />
                </mesh>
            </group>
            <group position={[0.02, 0, -0.05]}>
                <mesh rotation={[0, 0, -0.5]}>
                    <planeGeometry args={[0.12, 0.12]} />
                    <meshStandardMaterial color={color} transparent opacity={0.8} side={THREE.DoubleSide} />
                </mesh>
            </group>

            {/* Body */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <capsuleGeometry args={[0.015, 0.15, 4, 8]} />
                <meshStandardMaterial color="#222" />
            </mesh>
            
            {/* Antennae */}
            <mesh position={[0.02, 0.02, 0.08]} rotation={[-0.3, 0.2, 0]}>
                <cylinderGeometry args={[0.002, 0.002, 0.1]} />
                <meshStandardMaterial color="#111" />
            </mesh>
            <mesh position={[-0.02, 0.02, 0.08]} rotation={[-0.3, -0.2, 0]}>
                <cylinderGeometry args={[0.002, 0.002, 0.1]} />
                <meshStandardMaterial color="#111" />
            </mesh>
            
            {/* Trail during zip */}
            {activity === 'zip' && <Sparkles count={5} scale={0.5} size={1} speed={2} color={color} />}
        </group>
    );
};

const FloatingText = ({ text, position, color = "#22c55e", onComplete }: { text: string, position: [number, number, number], color?: string, onComplete?: () => void }) => {
    const textRef = useRef<THREE.Group>(null);
    const [opacity, setOpacity] = useState(1);
    
    useFrame((state, delta) => {
        if (textRef.current) {
            textRef.current.position.y += delta * 1.5; // Float up
            setOpacity(prev => Math.max(0, prev - delta * 0.8)); // Fade out
            if (opacity <= 0 && onComplete) {
                onComplete();
            }
        }
    });

    if (opacity <= 0) return null;

    return (
        <group ref={textRef} position={position}>
            <Float speed={5} rotationIntensity={0.2} floatIntensity={0.2}>
               <Text
                 color={color}
                 fontSize={0.8}
                 maxWidth={200}
                 lineHeight={1}
                 letterSpacing={0.02}
                 textAlign="center"
                 font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
                 anchorX="center"
                 anchorY="middle"
                 outlineWidth={0.05}
                 outlineColor="#ffffff"
                 fillOpacity={opacity}
                 outlineOpacity={opacity}
               >
                 {text}
               </Text>
            </Float>
        </group>
    );
};

const GardenProp = ({ position, type }: { position: [number, number, number], type: 'rock' | 'fence' }) => {
    return (
        <group position={position}>
            {type === 'rock' && (
                <group>
                    {/* Main Rock Body */}
                    <mesh position={[0, 0.2, 0]} rotation={[0.5, 0.2, 0]} castShadow>
                        <dodecahedronGeometry args={[0.4, 0]} />
                        <meshStandardMaterial color="#64748b" flatShading />
                    </mesh>
                    {/* Small Attached Rock */}
                    <mesh position={[0.3, 0.1, 0.2]} scale={0.6} rotation={[0, 0.5, 0.8]} castShadow>
                        <dodecahedronGeometry args={[0.3, 0]} />
                        <meshStandardMaterial color="#94a3b8" flatShading />
                    </mesh>
                    {/* Moss Patches */}
                    <mesh position={[0, 0.35, 0.1]} rotation={[-0.5, 0, 0]} scale={[0.4, 0.1, 0.3]}>
                        <sphereGeometry args={[1, 8, 8]} />
                        <meshStandardMaterial color="#166534" roughness={1} />
                    </mesh>
                    <mesh position={[0.2, 0.2, 0.3]} scale={[0.2, 0.05, 0.2]}>
                        <sphereGeometry args={[1, 8, 8]} />
                        <meshStandardMaterial color="#3f6212" roughness={1} />
                    </mesh>
                </group>
            )}
            {type === 'fence' && (
                <group>
                    {/* Horizontal Rails */}
                    <mesh position={[0, 0.25, 0]} castShadow>
                        <boxGeometry args={[1.2, 0.04, 0.04]} />
                        <meshStandardMaterial color="#78350f" />
                    </mesh>
                    <mesh position={[0, 0.45, 0]} castShadow>
                        <boxGeometry args={[1.2, 0.04, 0.04]} />
                        <meshStandardMaterial color="#78350f" />
                    </mesh>
                    {/* Vertical Pickets */}
                    {[-0.45, -0.15, 0.15, 0.45].map((x, i) => (
                        <mesh key={i} position={[x, 0.3, 0]} castShadow>
                             <boxGeometry args={[0.1, 0.6, 0.03]} />
                             <meshStandardMaterial color="#d4a373" />
                             {/* Tapered Top */}
                             <mesh position={[0, 0.32, 0]} rotation={[0, 0, Math.PI / 4]}>
                                 <boxGeometry args={[0.07, 0.07, 0.03]} />
                                 <meshStandardMaterial color="#d4a373" />
                             </mesh>
                        </mesh>
                    ))}
                </group>
            )}
        </group>
    );
};

const Pond = () => {
    const meshRef = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (meshRef.current) {
            const t = state.clock.getElapsedTime();
            // Simple ripple effect by moving texture offset or scale
            meshRef.current.scale.setScalar(1 + Math.sin(t * 0.5) * 0.02);
        }
    });

    return (
        <group position={[6, -0.05, -6]} rotation={[-Math.PI / 2, 0, 0]}>
            {/* Water surface */}
            <mesh ref={meshRef}>
                <circleGeometry args={[3, 32]} />
                <meshStandardMaterial 
                    color="#3b82f6" 
                    transparent 
                    opacity={0.6} 
                    roughness={0.1} 
                    metalness={0.8}
                    emissive="#1d4ed8"
                    emissiveIntensity={0.2}
                />
            </mesh>
            {/* Pond edge/sand */}
            <mesh position={[0, 0, -0.01]}>
                <circleGeometry args={[3.2, 32]} />
                <meshStandardMaterial color="#d4a373" />
            </mesh>
            {/* Reeds */}
            {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i / 12) * Math.PI * 2;
                return (
                    <mesh 
                        key={i} 
                        position={[Math.cos(angle) * 2.8, Math.sin(angle) * 2.8, 0.2]} 
                        rotation={[Math.PI / 2, 0, 0]}
                    >
                        <cylinderGeometry args={[0.02, 0.01, 0.8, 4]} />
                        <meshStandardMaterial color="#166534" />
                    </mesh>
                );
            })}
        </group>
    );
};

const Fireflies = ({ count = 20 }: { count?: number }) => {
    return (
        <group>
            {Array.from({ length: count }).map((_, i) => {
                const seed = Math.random() * Math.PI * 2;
                const speed = 0.2 + Math.random() * 0.3;
                const radius = 4 + Math.random() * 6;
                const yBase = 1 + Math.random() * 3;

                return (
                    <Float 
                        key={i} 
                        speed={speed * 5} 
                        rotationIntensity={2} 
                        floatIntensity={2}
                        position={[
                            Math.sin(seed) * radius,
                            yBase,
                            Math.cos(seed) * radius
                        ]}
                    >
                        <mesh>
                            <sphereGeometry args={[0.03, 8, 8]} />
                            <meshStandardMaterial 
                                color="#fef08a" 
                                emissive="#fef08a" 
                                emissiveIntensity={2} 
                                transparent 
                                opacity={0.8} 
                            />
                        </mesh>
                    </Float>
                );
            })}
        </group>
    );
};

const FallingPetals = ({ count = 50, theme }: { count?: number, theme: any }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      position: [
        (Math.random() - 0.5) * 20,
        Math.random() * 10 + 5,
        (Math.random() - 0.5) * 20
      ],
      rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0],
      speed: Math.random() * 0.02 + 0.01,
      wobble: Math.random() * 0.1
    }));
  }, [count]);

  useFrame((state) => {
    if (!meshRef.current) return;
    particles.forEach((p, i) => {
      p.position[1] -= p.speed;
      p.position[0] += Math.sin(state.clock.elapsedTime + i) * p.wobble;
      p.rotation[0] += 0.01;
      p.rotation[1] += 0.01;

      if (p.position[1] < -0.1) {
        p.position[1] = 10;
        p.position[0] = (Math.random() - 0.5) * 20;
        p.position[2] = (Math.random() - 0.5) * 20;
      }

      dummy.position.set(p.position[0], p.position[1], p.position[2]);
      dummy.rotation.set(p.rotation[0], p.rotation[1], 0);
      dummy.scale.set(0.6, 0.6, 0.6);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <planeGeometry args={[0.1, 0.1]} />
      <meshStandardMaterial color={theme.leaves[0]} side={THREE.DoubleSide} transparent opacity={0.8} />
    </instancedMesh>
  );
};


const StonePath = () => {
    return (
        <group>
            {[
                { x: 0, z: 1.5 }, { x: 0.2, z: 2.2 }, { x: 0.5, z: 2.9 }, 
                { x: 1.0, z: 3.5 }, { x: 1.6, z: 4.1 }, { x: 2.4, z: 4.6 }
            ].map((p, i) => (
                <mesh 
                    key={i} 
                    position={[p.x, -0.08, p.z]} 
                    rotation={[-Math.PI / 2, 0, Math.random()]}
                    receiveShadow
                >
                    <circleGeometry args={[0.3 + Math.random() * 0.1, 8]} />
                    <meshStandardMaterial color="#94a3b8" roughness={1} />
                </mesh>
            ))}
        </group>
    );
};

const LoveTree3D: React.FC<LoveTree3DProps> = ({ 
    anniversaryDate, treeStyle = 'oak', petEmotion, petMessage, level,
     leaves, points, onAddLeaf, daysPerFlower = 7, flowerType = 'sunflower',
     mixedFlowers = ['sunflower', 'tulip', 'rose', 'cherry', 'lavender', 'heart'],
     skyMode = 'follow_timezone', showQRCode = false, petType = 'cat',
     pets = [],
     graphicsQuality = 'medium'
 }) => {
   const theme = THEMES[treeStyle] || THEMES['oak'];
   const [isQRUploadOpen, setIsQRUploadOpen] = useState(false);
   const [showExplosion, setShowExplosion] = useState(false);
   const [shakeTree, setShakeTree] = useState(false);
   const [floatingTexts, setFloatingTexts] = useState<Array<{ id: number; text: string; position: [number, number, number]; color: string }>>([]);
   const prevLeafCount = useRef(leaves);

   // Trigger explosion and floating text logic
   React.useEffect(() => {
     if (leaves > prevLeafCount.current) {
        setShowExplosion(true);
        const t = setTimeout(() => setShowExplosion(false), 2000);
        
        // Add floating text
        const id = Date.now();
        const randomX = (Math.random() - 0.5) * 3;
        const randomZ = (Math.random() - 0.5) * 3;
        const height = 4 + Math.random() * 2;
        
        setFloatingTexts(prev => [
            ...prev, 
            { id, text: "+1 🍃", position: [randomX, height, randomZ], color: theme.leaves[1] }
        ]);

        // Cleanup text after 2 seconds
        setTimeout(() => {
            setFloatingTexts(prev => prev.filter(item => item.id !== id));
        }, 2000);

        prevLeafCount.current = leaves;
        return () => clearTimeout(t);
     }
     prevLeafCount.current = leaves;
   }, [leaves, theme]);

   // Calculate Growth Stage
   const { growthScale, branchCount } = useMemo(() => {
      let scale = 1;
      let branchCount = 6;
      
      if (leaves < 50) {
          // Stage 1: Sapling
          const progress = Math.max(0, leaves / 50);
          scale = 0.8 + (progress * 0.2); // 0.8 -> 1.0
          branchCount = 6;
      } else if (leaves < 100) {
          // Stage 2: Young Tree
          const progress = (leaves - 50) / 50;
          scale = 1.0 + (progress * 0.2); // 1.0 -> 1.2
          branchCount = 6 + Math.floor(progress * 4); // 6 -> 10
      } else {
          // Stage 3: Mature Tree
          // Capping at 1000 for max growth effect, though leaves can go higher
          const progress = Math.min((leaves - 100) / 900, 1);
          scale = 1.2 + (progress * 0.8); // 1.2 -> 2.0
          branchCount = 10 + Math.floor(progress * 10); // 10 -> 20
      }
      return { growthScale: scale, branchCount };
  }, [leaves]);

  // Calculate Days Together
  const daysTogether = useMemo(() => {
    const start = new Date(anniversaryDate);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }, [anniversaryDate]);

  // Calculate Flower Count
  const flowerCount = Math.floor(daysTogether / daysPerFlower);

  // Generate Stable Flower Positions & Types with organic distribution
  const flowerPositions = useMemo(() => {
    const pos = [];
    const count = Math.min(flowerCount, 150); 
    const activeFlowers = (mixedFlowers && mixedFlowers.length > 0) 
      ? mixedFlowers 
      : ['sunflower', 'tulip', 'rose', 'cherry', 'lavender', 'heart'];

    for(let i=0; i<count; i++) {
        // Deterministic pseudo-random based on index
        const sin1 = Math.sin(i * 123.456) * 10000;
        const r1 = sin1 - Math.floor(sin1);
        const sin2 = Math.sin(i * 789.012) * 10000;
        const r2 = sin2 - Math.floor(sin2);
        const sin3 = Math.sin(i * 456.789) * 10000;
        const r3 = sin3 - Math.floor(sin3);

        // Phyllotaxis base with high "jitter" for natural look
        const angle = i * 137.5 + (r1 - 0.5) * 45; 
        const radius = 2.8 + Math.sqrt(i) * 0.7 + (r2 - 0.5) * 1.8;
        
        const x = Math.cos(angle * Math.PI / 180) * radius;
        const z = Math.sin(angle * Math.PI / 180) * radius;
        
        // Random scale variation
        const s = 0.7 + r3 * 0.6;
        
        // Determinstic type
        const t = flowerType === 'mixed' ? activeFlowers[Math.floor(r1 * activeFlowers.length)] : flowerType;
        
        pos.push({ x, z, type: t, scale: s });
    }
    return pos;
  }, [flowerCount, flowerType, mixedFlowers]);
  
  // Generate Grass Positions
  const grassPositions = useMemo(() => {
    const pos = [];
    for(let i=0; i<30; i++) {
        const radius = 3 + Math.random() * 10;
        const angle = Math.random() * Math.PI * 2;
        pos.push({ 
            x: Math.cos(angle) * radius, 
            z: Math.sin(angle) * radius 
        });
    }
    return pos;
  }, []);

  // Dynamic Sky based on Time
  const hour = useMemo(() => {
    if (skyMode === 'noon') return 12;
    if (skyMode === 'night') return 23;
    return new Date().getHours();
  }, [skyMode]);
  
  // Calculate Wind Factor based on Emotion
  const windFactor = useMemo(() => {
      switch(petEmotion) {
          case 'excited':
          case 'playing': return 2.2;
          case 'happy': return 1.0;
          case 'waiting':
          case 'thinking': return 0.7;
          case 'sleeping': return 0.3;
          case 'neutral': return 1.0;
          default: return 1.0;
      }
  }, [petEmotion]);

  const getSkyColor = () => {
      if (['neon', 'midnight'].includes(treeStyle)) return theme.bg; // Keep theme for dark styles
      if (hour >= 6 && hour < 17) return '#87CEEB'; // Day
      if (hour >= 17 && hour < 20) return '#FF7F50'; // Sunset
      return '#0f172a'; // Night
  };
  const skyColor = getSkyColor();

  return (
    <div className="fixed inset-0 -z-10 bg-black">
      {/* 3D Scene */}
      <Canvas shadows camera={{ position: [0, 6, 14], fov: 50 }}>
         <color attach="background" args={[skyColor]} />
         
         <ambientLight intensity={hour >= 19 || hour < 6 ? 0.3 : 0.8} />
         <directionalLight 
            position={[5, 10, 5]} 
            intensity={hour >= 19 || hour < 6 ? 0.5 : 1.2} 
            castShadow 
            shadow-mapSize={[2048, 2048]} 
         />
         <fog attach="fog" args={[skyColor, 5, 30]} />
         
         {(hour >= 19 || hour < 6 || ['neon', 'midnight'].includes(treeStyle)) && <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />}
         <Sparkles count={80} scale={15} size={3} speed={0.5} opacity={0.4} color={theme.particle} />
         
         {/* Extra Magic Particles for Happy Emotions */}
         {(petEmotion === 'excited' || petEmotion === 'playing') && (
             <Sparkles count={100} scale={8} size={6} speed={2} color="#fcd34d" noise={1} />
         )}

         <OrbitControls 
            makeDefault
            enablePan={true} 
            enableDamping={true}
            dampingFactor={0.05}
            minPolarAngle={0} 
            maxPolarAngle={Math.PI / 2.1} 
            maxDistance={20} 
            minDistance={4} 
         />

         {/* Ground */}
         <group position={[0, -0.1, 0]}>
             <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <circleGeometry args={[25, 64]} />
                <meshStandardMaterial color={theme.ground} roughness={1} />
             </mesh>
             {/* Terrain Variations (Low Hills) */}
             {Array.from({ length: 15 }).map((_, i) => {
                 const angle = (i / 15) * Math.PI * 2;
                 const dist = 10 + Math.random() * 10;
                 return (
                     <mesh key={i} position={[Math.cos(angle)*dist, -1.2, Math.sin(angle)*dist]} scale={[1, 0.3, 1]}>
                         <sphereGeometry args={[5, 16, 8]} />
                         <meshStandardMaterial color={theme.ground} roughness={1} />
                     </mesh>
                 )
             })}
         </group>

         {/* Tree */}
         <group onClick={() => {
             setShakeTree(true);
            setTimeout(() => setShakeTree(false), 500);
         }}>
             <Tree theme={theme} scale={growthScale} leafCount={leaves} windFactor={windFactor} branchCount={branchCount} quality={graphicsQuality} shake={shakeTree} />
         </group>
         
          {/* Leaf Explosion */}
          {showExplosion && <LeafExplosion count={30} color={theme.particle} />}

          {/* Floating Texts */}
          {floatingTexts.map(ft => (
             <FloatingText key={ft.id} text={ft.text} position={ft.position} color={ft.color} />
          ))}

          {/* Pets */}
          {(!pets || pets.length === 0) ? (
            <Pet3D emotion={petEmotion} theme={theme} petType={petType} startPos={[2, 0, 2]} />
         ) : (() => {
           const petRefs = pets.map(() => React.createRef<THREE.Group | null>());
           return pets.map((pet, i) => {
             // Scatter pets around the tree in a circle initially
             const angle = (i / pets.length) * Math.PI * 2;
             const radius = 2.5 + (i * 0.5);
             const x = Math.cos(angle) * radius;
             const z = Math.sin(angle) * radius;
             
             // Filter out self for social awareness
             const companions = pets
                .map((p, idx) => ({ ref: petRefs[idx], type: p.type }))
                .filter((_, idx) => idx !== i);

             return (
               <Pet3D 
                 ref={petRefs[i]}
                 key={pet.id} 
                 emotion={petEmotion} 
                 theme={theme} 
                 petType={pet.type} 
                 startPos={[x, 0, z]} 
                 otherPets={companions}
               />
             );
           });
         })()}

          {/* Garden Props */}
          <group>
             {/* Dynamic Flowers */}
             {flowerPositions.map((pos, i) => (
                <Flower 
                    key={i} 
                    position={[pos.x, 0, pos.z]} 
                    type={pos.type} 
                    scale={pos.scale} 
                    windFactor={windFactor} 
                    quality={graphicsQuality}
                />
             ))}

             {/* Wild Grass */}
             {grassPositions.map((pos, i) => (
                <Grass key={i} position={[pos.x, 0, pos.z]} windFactor={windFactor} />
             ))}

             {/* Butterflies */}
             <Butterfly flowers={flowerPositions} />
             <Butterfly flowers={flowerPositions} />
             <Butterfly flowers={flowerPositions} />

             {/* Ambient Falling Leaves */}
             {Array.from({ length: 10 }).map((_, i) => (
                 <FallingLeaf key={i} theme={theme} />
             ))}

             {/* Birds in the sky */}
             <Bird />
             <Bird />

             <GardenProp position={[-3, 0, 3]} type="rock" />
             <GardenProp position={[-4, 0, -3]} type="fence" />
             <GardenProp position={[-3.2, 0, -3]} type="fence" />
              
              <Pond />
              <Pond />
              <FallingPetals theme={theme} count={60} />
              <Fireflies />
              <StonePath />
           </group>

         <ContactShadows scale={30} blur={2.5} far={4} opacity={0.4} />

      </Canvas>
      
      <AnimatePresence>
        {showQRCode && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="fixed bottom-6 left-6 z-[70] hidden md:flex flex-col items-center gap-2 group"
          >
             <div 
               className="bg-white/80 backdrop-blur-xl p-3 rounded-[2rem] shadow-2xl border border-white/50 cursor-pointer hover:scale-105 transition-transform relative overflow-hidden active:scale-95"
               onClick={() => setIsQRUploadOpen(true)}
             >
                <img 
                  src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://example.com/upload&color=ec4899" 
                  alt="Upload QR" 
                  className="w-24 h-24 rounded-2xl"
                />
                <div className="absolute inset-0 bg-pink-500/0 group-hover:bg-pink-500/5 transition-colors flex items-center justify-center">
                   <i className="fas fa-expand text-pink-500 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                </div>
             </div>
             <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-lg border border-pink-100 flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                </span>
                <p className="text-[9px] font-black text-pink-500 uppercase tracking-widest leading-none">Scan to Upload 📱</p>
             </div>
          </motion.div>
        )}

        {isQRUploadOpen && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6"
             onClick={() => setIsQRUploadOpen(false)}
           >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
              >
                 <div className="p-8 text-center space-y-4">
                    <div className="w-20 h-20 bg-pink-100 rounded-[2rem] flex items-center justify-center text-pink-500 text-3xl mx-auto mb-2">
                       <i className="fas fa-mobile-alt"></i>
                    </div>
                    <h2 className="text-2xl font-black text-gray-800 tracking-tight">Mobile Memory Upload</h2>
                    <p className="text-sm text-gray-400 font-medium">Scanning this QR code on your phone opens a mobile-optimized upload page to instantly add memories to your garden!</p>
                    
                    <div className="bg-gray-50 p-6 rounded-[2.5rem] border-2 border-dashed border-gray-100 mt-6 group hover:border-pink-200 transition-all cursor-pointer" onClick={() => setIsQRUploadOpen(false)}>
                       <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-pink-500 shadow-sm mx-auto mb-3 transition-colors">
                          <i className="fas fa-cloud-upload-alt"></i>
                       </div>
                       <p className="text-xs font-bold text-gray-500 group-hover:text-pink-500">Demo: Simulate a mobile file select</p>
                    </div>

                    <button 
                      onClick={() => setIsQRUploadOpen(false)}
                      className="w-full bg-gray-100 text-gray-500 font-black py-4 rounded-3xl mt-4 hover:bg-gray-200 transition-all uppercase tracking-widest text-xs"
                    >
                       Close Preview
                    </button>
                 </div>
                 <div className="bg-pink-500 p-1"></div>
              </motion.div>
           </motion.div>
        )}
      </AnimatePresence>
      
 

    </div>
  );
};

export default LoveTree3D;
