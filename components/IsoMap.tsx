
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MapControls, Environment, SoftShadows, Instance, Instances, Float, useTexture, Outlines, OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Grid, BuildingType, TileData } from '../types';
import { GRID_SIZE, BUILDINGS } from '../constants';

// --- Constants & Helpers ---
const WORLD_OFFSET = GRID_SIZE / 2 - 0.5;
const gridToWorld = (x: number, y: number) => [x - WORLD_OFFSET, 0, y - WORLD_OFFSET] as [number, number, number];

// Deterministic random based on coordinates
const getHash = (x: number, y: number) => Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
const getRandomRange = (min: number, max: number) => Math.random() * (max - min) + min;

// Shared Geometries
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const cylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 8);
const coneGeo = new THREE.ConeGeometry(1, 1, 4);
const sphereGeo = new THREE.SphereGeometry(1, 8, 8);

// --- New Animated Components (Cars, People, Clouds) ---

const Car = React.memo(({ axis, color, seed }: { axis: 'x' | 'z', color: string, seed: number }) => {
  const ref = useRef<THREE.Group>(null);
  const speed = 0.8 + (seed % 0.4); // Random speed
  const offset = seed * 10;
  
  // Determine car type based on seed
  // 0: Sedan, 1: Sports, 2: Truck, 3: Van
  const carType = Math.floor((seed * 100) % 4);

  useFrame(({ clock }) => {
    if (ref.current) {
      // Loop movement from -0.6 to 0.6 relative to tile center
      const t = clock.getElapsedTime() * speed + offset;
      const range = 1.2; 
      const rawPos = (t % range) - (range / 2);

      if (axis === 'x') {
        ref.current.position.x = rawPos;
        ref.current.rotation.y = 0;
      } else {
        ref.current.position.z = rawPos;
        ref.current.rotation.y = -Math.PI / 2;
      }
    }
  });

  const Wheel = ({ pos }: { pos: [number, number, number] }) => (
      <mesh position={pos}>
         <boxGeometry args={[0.08, 0.08, 0.03]} />
         <meshStandardMaterial color="#1f2937" />
      </mesh>
  );

  return (
    <group ref={ref} position={[0, 0.15, 0]}>
      {/* Variant 0: Sedan */}
      {carType === 0 && (
        <group>
            <mesh castShadow receiveShadow position={[0, 0.05, 0]}>
                <boxGeometry args={[0.32, 0.1, 0.14]} />
                <meshStandardMaterial color={color} roughness={0.4} metalness={0.5} />
            </mesh>
            <mesh castShadow position={[-0.02, 0.14, 0]}>
                <boxGeometry args={[0.16, 0.09, 0.12]} />
                <meshStandardMaterial color={color} roughness={0.4} metalness={0.5} />
            </mesh>
            {/* Windows */}
            <mesh position={[-0.02, 0.145, 0]}>
                <boxGeometry args={[0.165, 0.08, 0.125]} />
                <meshStandardMaterial color="#9ca3af" roughness={0.2} metalness={0.9} />
            </mesh>
        </group>
      )}

      {/* Variant 1: Sports Car */}
      {carType === 1 && (
        <group>
            {/* Low Body */}
            <mesh castShadow receiveShadow position={[0, 0.04, 0]}>
                <boxGeometry args={[0.34, 0.08, 0.15]} />
                <meshStandardMaterial color={color} roughness={0.2} metalness={0.8} />
            </mesh>
            {/* Cabin pushed back */}
            <mesh castShadow position={[-0.05, 0.11, 0]}>
                <boxGeometry args={[0.12, 0.07, 0.12]} />
                <meshStandardMaterial color="#1f2937" roughness={0.1} /> {/* Dark window tint */}
            </mesh>
            {/* Spoiler */}
            <mesh castShadow position={[-0.15, 0.1, 0]}>
                <boxGeometry args={[0.02, 0.08, 0.14]} />
                <meshStandardMaterial color={color} />
            </mesh>
        </group>
      )}

      {/* Variant 2: Pickup Truck */}
      {carType === 2 && (
        <group>
            {/* Bed/Chassis */}
            <mesh castShadow receiveShadow position={[0, 0.06, 0]}>
                <boxGeometry args={[0.34, 0.08, 0.14]} />
                <meshStandardMaterial color="#4b5563" />
            </mesh>
            {/* Cab */}
            <mesh castShadow position={[0.08, 0.12, 0]}>
                <boxGeometry args={[0.14, 0.12, 0.14]} />
                <meshStandardMaterial color={color} roughness={0.6} />
            </mesh>
            {/* Bed Walls */}
            <mesh position={[-0.1, 0.1, 0.065]}>
                <boxGeometry args={[0.18, 0.06, 0.01]} />
                <meshStandardMaterial color={color} />
            </mesh>
            <mesh position={[-0.1, 0.1, -0.065]}>
                <boxGeometry args={[0.18, 0.06, 0.01]} />
                <meshStandardMaterial color={color} />
            </mesh>
        </group>
      )}
      
      {/* Variant 3: Van */}
      {carType === 3 && (
        <group>
            <mesh castShadow receiveShadow position={[0, 0.1, 0]}>
                <boxGeometry args={[0.32, 0.18, 0.14]} />
                <meshStandardMaterial color={color} roughness={0.5} />
            </mesh>
             {/* Windshield */}
             <mesh position={[0.165, 0.12, 0]}>
                <boxGeometry args={[0.01, 0.08, 0.12]} />
                <meshStandardMaterial color="#9ca3af" />
            </mesh>
             {/* Side Detail */}
             <mesh position={[0, 0.1, 0.075]}>
                <boxGeometry args={[0.2, 0.01, 0.01]} />
                <meshStandardMaterial color="#1f2937" />
            </mesh>
             <mesh position={[0, 0.1, -0.075]}>
                <boxGeometry args={[0.2, 0.01, 0.01]} />
                <meshStandardMaterial color="#1f2937" />
            </mesh>
        </group>
      )}

      {/* Wheels (Shared) */}
      <Wheel pos={[0.09, 0.04, 0.07]} />
      <Wheel pos={[-0.09, 0.04, 0.07]} />
      <Wheel pos={[0.09, 0.04, -0.07]} />
      <Wheel pos={[-0.09, 0.04, -0.07]} />
    </group>
  );
});

const Person = React.memo(({ seed }: { seed: number }) => {
  const ref = useRef<THREE.Group>(null);
  const speed = 0.5 + (seed % 1) * 0.5;
  const radius = 0.2 + (seed % 0.1);
  const color = seed > 0.5 ? '#fca5a5' : '#93c5fd';
  const shirtColor = seed > 0.5 ? '#f87171' : '#60a5fa';

  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.getElapsedTime() * speed + seed * 10;
      // Walk in a small circle
      ref.current.position.x = Math.sin(t) * radius;
      ref.current.position.z = Math.cos(t) * radius;
      ref.current.rotation.y = -t; // Face direction of movement roughly
    }
  });

  return (
    <group ref={ref} position={[0, 0.05, 0]}>
      {/* Body */}
      <mesh castShadow position={[0, 0.1, 0]}>
        <boxGeometry args={[0.06, 0.12, 0.04]} />
        <meshStandardMaterial color={shirtColor} />
      </mesh>
      {/* Head */}
      <mesh castShadow position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.03, 4, 4]} />
        <meshStandardMaterial color="#fca5a5" />
      </mesh>
    </group>
  );
});

const Airplane = React.memo(() => {
  const ref = useRef<THREE.Group>(null);
  const cycleTime = 15; // seconds per take-off/land cycle

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (clock.getElapsedTime() % cycleTime) / cycleTime; // 0 to 1

    // Animation phases
    // 0.0 - 0.4: Landing (High far away -> runway start)
    // 0.4 - 0.5: Taxi/Stop on runway
    // 0.5 - 0.9: Takeoff (Runway -> High far away)
    // 0.9 - 1.0: Hidden/Reset

    if (t < 0.4) {
      // Landing
      const p = t / 0.4; // 0 to 1
      ref.current.visible = true;
      // Start at x=-10, y=6. End at x=0, y=0.2
      ref.current.position.x = THREE.MathUtils.lerp(-10, 0, p);
      ref.current.position.y = THREE.MathUtils.lerp(6, 0.2, p);
      ref.current.position.z = 0;
      ref.current.rotation.z = -0.1; // Nose down
      ref.current.rotation.y = 0;
    } else if (t < 0.5) {
      // Taxi
      const p = (t - 0.4) / 0.1;
      ref.current.visible = true;
      ref.current.position.x = THREE.MathUtils.lerp(0, 0.5, p);
      ref.current.position.y = 0.2;
      ref.current.rotation.z = 0;
    } else if (t < 0.9) {
      // Takeoff
      const p = (t - 0.5) / 0.4;
      ref.current.visible = true;
      // Start x=0.5, y=0.2. End x=12, y=8
      ref.current.position.x = THREE.MathUtils.lerp(0.5, 12, p);
      ref.current.position.y = THREE.MathUtils.lerp(0.2, 8, p); // Steep climb
      ref.current.rotation.z = 0.3; // Nose up
    } else {
      // Reset
      ref.current.visible = false;
    }
  });

  return (
    <group ref={ref}>
      {/* Fuselage */}
      <mesh castShadow position={[0, 0, 0]} rotation={[0, 0, -Math.PI/2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.6, 8]} />
        <meshStandardMaterial color="white" />
      </mesh>
      {/* Nose */}
      <mesh castShadow position={[0.3, 0, 0]} rotation={[0, 0, -Math.PI/2]}>
         <coneGeometry args={[0.08, 0.15, 8]} />
         <meshStandardMaterial color="white" />
      </mesh>
      {/* Wings */}
      <mesh castShadow position={[0.05, 0, 0]}>
         <boxGeometry args={[0.2, 0.02, 0.8]} />
         <meshStandardMaterial color="#94a3b8" />
      </mesh>
      {/* Tail Vertical */}
      <mesh castShadow position={[-0.25, 0.1, 0]}>
         <boxGeometry args={[0.15, 0.2, 0.02]} />
         <meshStandardMaterial color="#0ea5e9" />
      </mesh>
      {/* Tail Horizontal */}
      <mesh castShadow position={[-0.25, 0.05, 0]}>
         <boxGeometry args={[0.1, 0.02, 0.3]} />
         <meshStandardMaterial color="#94a3b8" />
      </mesh>
    </group>
  );
});

const Cloud = React.memo(({ position, scale, seed }: { position: [number, number, number], scale: number, seed: number }) => {
  const ref = useRef<THREE.Group>(null);
  const speed = 0.2 + (seed % 0.3);
  
  useFrame(({ clock }) => {
    if (ref.current) {
      // Drift along X axis
      ref.current.position.x += speed * 0.01;
      // Wrap around world
      if (ref.current.position.x > 25) {
        ref.current.position.x = -25;
      }
    }
  });

  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh castShadow position={[0, 0, 0]}>
        <sphereGeometry args={[0.6, 8, 8]} />
        <meshStandardMaterial color="white" transparent opacity={0.8} />
      </mesh>
      <mesh castShadow position={[0.5, 0.2, 0.3]}>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshStandardMaterial color="white" transparent opacity={0.8} />
      </mesh>
      <mesh castShadow position={[-0.5, 0.1, 0.2]}>
        <sphereGeometry args={[0.4, 8, 8]} />
        <meshStandardMaterial color="white" transparent opacity={0.8} />
      </mesh>
    </group>
  );
});

// --- Weather Systems ---

const Rain = () => {
  const count = 1000;
  const mesh = useRef<THREE.InstancedMesh>(null);
  
  // Memoize particles to avoid re-creation on every render
  const particles = useMemo(() => {
    const temp = [];
    for(let i=0; i<count; i++) {
      const x = (Math.random() - 0.5) * 40;
      const y = (Math.random() - 0.5) * 20 + 10;
      const z = (Math.random() - 0.5) * 40;
      temp.push({x,y,z});
    }
    return temp;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    if (!mesh.current) return;
    particles.forEach((p, i) => {
        p.y -= 0.4;
        if (p.y < 0) p.y = 20;
        dummy.position.set(p.x, p.y, p.z);
        dummy.scale.set(0.02, 0.4, 0.02);
        dummy.updateMatrix();
        mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <boxGeometry />
      <meshBasicMaterial color="#a5f3fc" transparent opacity={0.6} />
    </instancedMesh>
  )
}

const Snow = () => {
  const count = 500;
  const mesh = useRef<THREE.InstancedMesh>(null);
  
  // Memoize particles to avoid re-creation on every render
  const particles = useMemo(() => {
    const temp = [];
    for(let i=0; i<count; i++) {
      const x = (Math.random() - 0.5) * 40;
      const y = (Math.random() - 0.5) * 20 + 10;
      const z = (Math.random() - 0.5) * 40;
      const speed = 0.05 + Math.random() * 0.05;
      temp.push({x,y,z,speed});
    }
    return temp;
  }, []); // Empty dependency array ensures this runs once

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    if (!mesh.current) return;
    particles.forEach((p, i) => {
        p.y -= p.speed;
        p.x += Math.sin(Date.now() * 0.001 + i) * 0.01; // Drift
        if (p.y < 0) p.y = 20;
        dummy.position.set(p.x, p.y, p.z);
        dummy.scale.setScalar(0.08);
        dummy.updateMatrix();
        mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color="white" transparent opacity={0.8} />
    </instancedMesh>
  )
}

const WeatherSystem = () => {
  const [weather, setWeather] = useState<'sunny' | 'rain' | 'snow'>('sunny');
  const { scene } = useThree();

  useEffect(() => {
     // Cycle weather randomly
     const interval = setInterval(() => {
        const r = Math.random();
        if (r < 0.6) setWeather('sunny');
        else if (r < 0.8) setWeather('rain');
        else setWeather('snow');
     }, 20000); // Change every 20s
     return () => clearInterval(interval);
  }, []);

  // Update atmosphere based on weather
  useEffect(() => {
    if (weather === 'rain') {
       scene.fog = new THREE.FogExp2('#1e293b', 0.04);
       scene.background = new THREE.Color('#1e293b');
    } else if (weather === 'snow') {
       scene.fog = new THREE.FogExp2('#cbd5e1', 0.05);
       scene.background = new THREE.Color('#cbd5e1');
    } else {
       scene.fog = null;
       scene.background = null; // Let environment take over or default
    }
  }, [weather, scene]);

  return (
    <>
      {weather === 'rain' && <Rain />}
      {weather === 'snow' && <Snow />}
      {/* Adjust lighting based on weather */}
      <ambientLight intensity={weather === 'sunny' ? 0.7 : 0.3} />
      <directionalLight 
          position={[10, 20, 5]} 
          intensity={weather === 'sunny' ? 1.2 : 0.5} 
          castShadow 
          color={weather === 'sunny' ? '#fff' : (weather === 'rain' ? '#94a3b8' : '#e2e8f0')}
          shadow-mapSize={[1024, 1024]} 
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        >
          <orthographicCamera attach="shadow-camera" args={[-20, 20, 20, -20]} />
        </directionalLight>
    </>
  );
};

// --- Traffic Light Component ---

const TrafficLight = React.memo(() => {
  const [state, setState] = useState(0); // 0: NS Green, 1: NS Yellow, 2: EW Green, 3: EW Yellow
  const lastState = useRef(0);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() % 12; // 12s cycle
    // 0-5: NS Green (EW Red)
    // 5-6: NS Yellow (EW Red)
    // 6-11: EW Green (NS Red)
    // 11-12: EW Yellow (NS Red)

    let newState = 0;
    if (t < 5) newState = 0;
    else if (t < 6) newState = 1;
    else if (t < 11) newState = 2;
    else newState = 3;

    if (newState !== lastState.current) {
      lastState.current = newState;
      setState(newState);
    }
  });

  // Colors based on state
  // NS Face (Front/Back):
  // State 0: G, State 1: Y, State 2/3: R
  const getNSColor = (lightType: 'r'|'y'|'g') => {
    if (lightType === 'r') return (state === 2 || state === 3) ? '#ef4444' : '#374151';
    if (lightType === 'y') return (state === 1) ? '#eab308' : '#374151';
    if (lightType === 'g') return (state === 0) ? '#22c55e' : '#374151';
    return '#374151';
  }

  // EW Face (Left/Right):
  // State 2: G, State 3: Y, State 0/1: R
  const getEWColor = (lightType: 'r'|'y'|'g') => {
    if (lightType === 'r') return (state === 0 || state === 1) ? '#ef4444' : '#374151';
    if (lightType === 'y') return (state === 3) ? '#eab308' : '#374151';
    if (lightType === 'g') return (state === 2) ? '#22c55e' : '#374151';
    return '#374151';
  }

  // Helper for a light face
  const LightFace = ({ rotation, colors }: { rotation: [number, number, number], colors: string[] }) => (
     <group rotation={rotation} position={[0, 0, 0.16]}>
        <mesh position={[0, 0.15, 0]}>
           <circleGeometry args={[0.04]} />
           <meshBasicMaterial color={colors[0]} toneMapped={false} /> {/* Red */}
        </mesh>
        <mesh position={[0, 0, 0]}>
           <circleGeometry args={[0.04]} />
           <meshBasicMaterial color={colors[1]} toneMapped={false} /> {/* Yellow */}
        </mesh>
        <mesh position={[0, -0.15, 0]}>
           <circleGeometry args={[0.04]} />
           <meshBasicMaterial color={colors[2]} toneMapped={false} /> {/* Green */}
        </mesh>
     </group>
  );

  return (
    <group position={[0, 0, 0]}>
      {/* 4 Poles */}
      <mesh position={[-0.45, 0.5, -0.45]} castShadow>
         <cylinderGeometry args={[0.02, 0.02, 1]} />
         <meshStandardMaterial color="#4b5563" />
      </mesh>
      <mesh position={[0.45, 0.5, 0.45]} castShadow>
         <cylinderGeometry args={[0.02, 0.02, 1]} />
         <meshStandardMaterial color="#4b5563" />
      </mesh>
      <mesh position={[-0.45, 0.5, 0.45]} castShadow>
         <cylinderGeometry args={[0.02, 0.02, 1]} />
         <meshStandardMaterial color="#4b5563" />
      </mesh>
      <mesh position={[0.45, 0.5, -0.45]} castShadow>
         <cylinderGeometry args={[0.02, 0.02, 1]} />
         <meshStandardMaterial color="#4b5563" />
      </mesh>

      {/* Wires */}
      <mesh position={[0, 0.95, 0]} rotation={[0, Math.PI/4, 0]}>
         <boxGeometry args={[1.3, 0.01, 0.01]} />
         <meshStandardMaterial color="#1f2937" />
      </mesh>
       <mesh position={[0, 0.95, 0]} rotation={[0, -Math.PI/4, 0]}>
         <boxGeometry args={[1.3, 0.01, 0.01]} />
         <meshStandardMaterial color="#1f2937" />
      </mesh>

      {/* Center Box */}
      <group position={[0, 0.85, 0]}>
         <mesh castShadow>
            <boxGeometry args={[0.3, 0.4, 0.3]} />
            <meshStandardMaterial color="#fbbf24" /> {/* Yellow housing */}
         </mesh>
         
         {/* NS Faces (Z axis) */}
         <LightFace rotation={[0, 0, 0]} colors={[getNSColor('r'), getNSColor('y'), getNSColor('g')]} />
         <LightFace rotation={[0, Math.PI, 0]} colors={[getNSColor('r'), getNSColor('y'), getNSColor('g')]} />

         {/* EW Faces (X axis) */}
         <LightFace rotation={[0, Math.PI/2, 0]} colors={[getEWColor('r'), getEWColor('y'), getEWColor('g')]} />
         <LightFace rotation={[0, -Math.PI/2, 0]} colors={[getEWColor('r'), getEWColor('y'), getEWColor('g')]} />
      </group>
    </group>
  );
});

// --- Construction Visuals ---

const ConstructionSite = React.memo(({ timeLeft }: { timeLeft: number }) => {
  const craneRef = useRef<THREE.Group>(null);
  const loadGroupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (craneRef.current) {
      // Rotate crane
      craneRef.current.rotation.y = Math.sin(t * 0.5) * 0.6 + Math.PI/4;
    }
    if (loadGroupRef.current) {
      // Swing the load slightly
      loadGroupRef.current.rotation.z = Math.sin(t * 2) * 0.1;
      // Move load up and down slightly (hoisting effect)
      loadGroupRef.current.position.y = 0.9 + Math.sin(t * 1.5) * 0.05;
    }
    if (lightRef.current) {
      // Pulse light
      const scale = 1 + Math.sin(t * 10) * 0.3;
      lightRef.current.scale.setScalar(scale);
      (lightRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = scale * 1.5;
    }
  });

  const progress = Math.max(0.2, 1.0 - (timeLeft / 4)); // 0.2 to 1.0 based on completion

  return (
    <group position={[0, 0, 0]}>
      {/* Base / Foundation */}
      <mesh receiveShadow position={[0, 0.05, 0]}>
         <boxGeometry args={[0.9, 0.1, 0.9]} />
         <meshStandardMaterial color="#facc15" /> {/* Warning Yellow */}
      </mesh>
      
      {/* Stripes (simulated with small blocks) */}
      <mesh position={[0.4, 0.06, 0.4]} rotation={[0, Math.PI/4, 0]}>
         <boxGeometry args={[0.2, 0.11, 0.05]} />
         <meshStandardMaterial color="#1f2937" />
      </mesh>
      <mesh position={[-0.4, 0.06, -0.4]} rotation={[0, Math.PI/4, 0]}>
         <boxGeometry args={[0.2, 0.11, 0.05]} />
         <meshStandardMaterial color="#1f2937" />
      </mesh>

      {/* Steel Beams - Vertical */}
      <group>
        <mesh castShadow position={[-0.35, 0.3 * progress, -0.35]}>
           <boxGeometry args={[0.05, 0.6 * progress, 0.05]} />
           <meshStandardMaterial color="#9ca3af" />
        </mesh>
        <mesh castShadow position={[0.35, 0.3 * progress, -0.35]}>
           <boxGeometry args={[0.05, 0.6 * progress, 0.05]} />
           <meshStandardMaterial color="#9ca3af" />
        </mesh>
        <mesh castShadow position={[-0.35, 0.3 * progress, 0.35]}>
           <boxGeometry args={[0.05, 0.6 * progress, 0.05]} />
           <meshStandardMaterial color="#9ca3af" />
        </mesh>
        <mesh castShadow position={[0.35, 0.3 * progress, 0.35]}>
           <boxGeometry args={[0.05, 0.6 * progress, 0.05]} />
           <meshStandardMaterial color="#9ca3af" />
        </mesh>
      </group>

      {/* Cross beams appearing based on progress */}
      {progress > 0.4 && (
        <>
            <mesh position={[0, 0.6 * progress, -0.35]}>
                 <boxGeometry args={[0.75, 0.04, 0.04]} />
                 <meshStandardMaterial color="#ef4444" />
            </mesh>
            <mesh position={[0, 0.6 * progress, 0.35]}>
                 <boxGeometry args={[0.75, 0.04, 0.04]} />
                 <meshStandardMaterial color="#ef4444" />
            </mesh>
        </>
      )}

      {/* Animated Crane */}
      <group ref={craneRef} position={[0, 0.3 + (progress * 0.3), 0]} scale={0.5}>
         {/* Tower */}
         <mesh castShadow position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 1]} />
            <meshStandardMaterial color="#f59e0b" />
         </mesh>
         
         {/* Warning Light */}
         <mesh ref={lightRef} position={[0, 1.05, 0]}>
             <sphereGeometry args={[0.06, 8, 8]} />
             <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2} />
         </mesh>

         {/* Arm */}
         <mesh castShadow position={[0.3, 0.9, 0]} rotation={[0, 0, -Math.PI/2]}>
            <cylinderGeometry args={[0.03, 0.03, 0.8]} />
            <meshStandardMaterial color="#f59e0b" />
         </mesh>
         
         {/* Counterweight */}
         <mesh position={[-0.2, 0.9, 0]}>
            <boxGeometry args={[0.2, 0.15, 0.1]} />
            <meshStandardMaterial color="#4b5563" />
         </mesh>

         {/* Cable & Load */}
         <group ref={loadGroupRef} position={[0.6, 0.9, 0]}>
             {/* Cable */}
             <mesh position={[0, -0.25, 0]}>
                 <cylinderGeometry args={[0.005, 0.005, 0.5]} />
                 <meshStandardMaterial color="#374151" />
             </mesh>
             {/* Load (Crate) */}
             <mesh castShadow position={[0, -0.55, 0]}>
                 <boxGeometry args={[0.2, 0.2, 0.2]} />
                 <meshStandardMaterial color="#3b82f6" />
             </mesh>
         </group>
      </group>
    </group>
  );
});

// --- 1. Advanced Procedural Buildings ---

// FIX: Wrap component in React.memo to ensure TypeScript recognizes it as a component that accepts a 'key' prop.
const WindowBlock = React.memo(({ position, scale }: { position: [number, number, number], scale: [number, number, number] }) => (
  <mesh geometry={boxGeo} position={position} scale={scale}>
    <meshStandardMaterial color="#bfdbfe" emissive="#bfdbfe" emissiveIntensity={0.2} roughness={0.1} metalness={0.8} />
  </mesh>
));

const SmokeStack = ({ position }: { position: [number, number, number] }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.children.forEach((child, i) => {
        const cloud = child as THREE.Mesh;
        cloud.position.y += 0.01 + i * 0.005;
        cloud.scale.addScalar(0.005);
        
        const material = cloud.material as THREE.MeshStandardMaterial;
        if (material) {
          material.opacity -= 0.005;
          if (cloud.position.y > 1.5) {
            cloud.position.y = 0;
            cloud.scale.setScalar(0.1 + Math.random() * 0.1);
            material.opacity = 0.6;
          }
        }
      });
    }
  });

  return (
    <group position={position}>
      <mesh geometry={cylinderGeo} castShadow receiveShadow position={[0, 0.5, 0]} scale={[0.2, 1, 0.2]}>
        <meshStandardMaterial color="#4b5563" />
      </mesh>
      <group ref={ref} position={[0, 1, 0]}>
        {[0, 1, 2].map(i => (
          <mesh key={i} geometry={sphereGeo} position={[Math.random()*0.1, i*0.4, Math.random()*0.1]} scale={0.2}>
            <meshStandardMaterial color="#d1d5db" transparent opacity={0.6} flatShading />
          </mesh>
        ))}
      </group>
    </group>
  );
};

interface BuildingMeshProps {
  type: BuildingType;
  baseColor: string;
  x: number;
  y: number;
  opacity?: number;
  transparent?: boolean;
}

const ProceduralBuilding = React.memo(({ type, baseColor, x, y, opacity = 1, transparent = false }: BuildingMeshProps) => {
  const hash = getHash(x, y);
  const variant = Math.floor(hash * 100); // 0-99
  const rotation = Math.floor(hash * 4) * (Math.PI / 2);
  
  // Color variation
  const color = useMemo(() => {
    const c = new THREE.Color(baseColor);
    // Shift hue and lightness slightly based on hash
    c.offsetHSL(hash * 0.1 - 0.05, 0, hash * 0.2 - 0.1);
    return c;
  }, [baseColor, hash]);

  const mainMat = useMemo(() => new THREE.MeshStandardMaterial({ color, flatShading: true, opacity, transparent, roughness: 0.8 }), [color, opacity, transparent]);
  const accentMat = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.7), flatShading: true, opacity, transparent }), [color, opacity, transparent]);
  const roofMat = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.5).offsetHSL(0,0,-0.1), flatShading: true, opacity, transparent }), [color, opacity, transparent]);

  const commonProps = { castShadow: true, receiveShadow: true };

  // Buildings are built assuming y=0 is ground level within their group
  // Adjust vertical position to sit on top of ground tile (approx -0.3)
  const yOffset = -0.3;

  return (
    <group rotation={[0, rotation, 0]} position={[0, yOffset, 0]}>
      {(() => {
        switch (type) {
          case BuildingType.Residential:
            if (variant < 20) {
              // 1. Cozy Cottage
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.3, 0]} scale={[0.7, 0.6, 0.6]} />
                  <mesh {...commonProps} material={roofMat} geometry={coneGeo} position={[0, 0.75, 0]} scale={[0.6, 0.4, 0.6]} rotation={[0, Math.PI/4, 0]} />
                  <WindowBlock position={[0.2, 0.3, 0.31]} scale={[0.15, 0.2, 0.05]} />
                  <WindowBlock position={[-0.2, 0.3, 0.31]} scale={[0.15, 0.2, 0.05]} />
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0, 0.1, 0.32]} scale={[0.15, 0.2, 0.05]} />
                </>
              );
            } else if (variant < 40) {
              // 2. Modern Boxy
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[-0.1, 0.35, 0]} scale={[0.6, 0.7, 0.8]} />
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0.25, 0.25, 0.1]} scale={[0.4, 0.5, 0.6]} />
                  <WindowBlock position={[-0.1, 0.5, 0.41]} scale={[0.4, 0.2, 0.05]} />
                </>
              );
            } else if (variant < 60) {
              // 3. Townhouse
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.5, 0]} scale={[0.5, 1, 0.6]} />
                  <mesh {...commonProps} material={roofMat} geometry={boxGeo} position={[0, 1.05, 0]} scale={[0.55, 0.1, 0.65]} />
                  <WindowBlock position={[0, 0.7, 0.31]} scale={[0.3, 0.2, 0.05]} />
                  <WindowBlock position={[0, 0.3, 0.31]} scale={[0.3, 0.2, 0.05]} />
                </>
              );
            } else if (variant < 80) {
              // 4. Apartment Complex (Taller, denser)
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.75, 0]} scale={[0.8, 1.5, 0.8]} />
                  <mesh {...commonProps} material={roofMat} geometry={boxGeo} position={[0, 1.55, 0]} scale={[0.85, 0.1, 0.85]} />
                  {/* Rows of windows */}
                  <WindowBlock position={[0, 1.2, 0.41]} scale={[0.6, 0.2, 0.05]} />
                  <WindowBlock position={[0, 0.8, 0.41]} scale={[0.6, 0.2, 0.05]} />
                  <WindowBlock position={[0, 0.4, 0.41]} scale={[0.6, 0.2, 0.05]} />
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0, 0.15, 0.42]} scale={[0.2, 0.3, 0.05]} />
                </>
              );
            } else {
              // 5. Large Estate (L-shaped)
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[-0.1, 0.4, -0.1]} scale={[0.6, 0.8, 0.8]} />
                  <mesh {...commonProps} material={roofMat} geometry={coneGeo} position={[-0.1, 1.0, -0.1]} scale={[0.5, 0.4, 0.7]} rotation={[0, 0, 0]} />
                  {/* Wing */}
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0.3, 0.25, 0.1]} scale={[0.4, 0.5, 0.5]} />
                  <mesh {...commonProps} material={roofMat} geometry={boxGeo} position={[0.3, 0.55, 0.1]} scale={[0.45, 0.1, 0.55]} />
                  {/* Garage Door */}
                  <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#94a3b8'})} geometry={boxGeo} position={[0.3, 0.15, 0.36]} scale={[0.3, 0.3, 0.05]} />
                </>
              );
            }

          case BuildingType.Commercial:
            if (variant < 20) {
              // 1. High-rise
              const height = 1.5 + hash * 1.5;
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, height/2, 0]} scale={[0.7, height, 0.7]} />
                  {Array.from({ length: Math.floor(height * 3) }).map((_, i) => (
                    <WindowBlock key={i} position={[0, 0.2 + i * 0.3, 0]} scale={[0.72, 0.15, 0.72]} />
                  ))}
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0, height + 0.1, 0]} scale={[0.5, 0.2, 0.5]} />
                </>
              );
            } else if (variant < 40) {
              // 2. Shop
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.4, 0]} scale={[0.9, 0.8, 0.8]} />
                  <WindowBlock position={[0, 0.3, 0.41]} scale={[0.8, 0.4, 0.05]} />
                  <mesh {...commonProps} material={new THREE.MeshStandardMaterial({ color: hash > 0.5 ? '#ef4444' : '#3b82f6' })} geometry={boxGeo} position={[0, 0.55, 0.5]} scale={[0.9, 0.1, 0.2]} rotation={[Math.PI/6, 0, 0]} />
                </>
              );
            } else if (variant < 60) {
              // 3. Corner store
               return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[-0.2, 0.5, -0.2]} scale={[0.5, 1, 0.5]} />
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0.1, 0.3, 0.1]} scale={[0.7, 0.6, 0.7]} />
                  <WindowBlock position={[0.1, 0.3, 0.46]} scale={[0.6, 0.3, 0.05]} />
                  <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#9ca3af'})} geometry={boxGeo} position={[0.2, 0.65, 0.2]} scale={[0.2, 0.1, 0.2]} />
                </>
               )
            } else if (variant < 80) {
              // 4. Twin Towers (Office Complex)
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[-0.2, 0.8, 0]} scale={[0.3, 1.6, 0.6]} />
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0.2, 0.7, 0]} scale={[0.3, 1.4, 0.6]} />
                  {/* Connector Lobby */}
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0, 0.2, 0]} scale={[0.3, 0.4, 0.4]} />
                  <WindowBlock position={[-0.2, 1.2, 0.31]} scale={[0.2, 0.3, 0.05]} />
                  <WindowBlock position={[0.2, 1.0, 0.31]} scale={[0.2, 0.3, 0.05]} />
                  <WindowBlock position={[0, 0.2, 0.21]} scale={[0.2, 0.2, 0.05]} />
                </>
              );
            } else {
              // 5. Shopping Plaza (Mall)
              return (
                <>
                   <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.3, 0]} scale={[0.9, 0.6, 0.9]} />
                   {/* Skylights */}
                   <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#93c5fd', roughness: 0.1})} geometry={boxGeo} position={[0, 0.61, 0]} scale={[0.6, 0.05, 0.6]} />
                   {/* Entrance */}
                   <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0, 0.2, 0.46]} scale={[0.3, 0.3, 0.1]} />
                </>
              );
            }

          case BuildingType.Industrial:
            if (variant < 33) {
              // 1. Factory (Smokestack)
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.4, 0]} scale={[0.9, 0.8, 0.8]} />
                  <mesh {...commonProps} material={roofMat} geometry={boxGeo} position={[-0.2, 0.9, 0]} scale={[0.4, 0.2, 0.8]} rotation={[0,0,Math.PI/4]} />
                  <mesh {...commonProps} material={roofMat} geometry={boxGeo} position={[0.2, 0.9, 0]} scale={[0.4, 0.2, 0.8]} rotation={[0,0,Math.PI/4]} />
                  <SmokeStack position={[0.3, 0.4, 0.3]} />
                </>
              );
            } else if (variant < 66) {
              // 2. Warehouse
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[-0.2, 0.3, 0]} scale={[0.5, 0.6, 0.9]} />
                  <mesh {...commonProps} material={accentMat} geometry={cylinderGeo} position={[0.25, 0.4, -0.2]} scale={[0.2, 0.8, 0.2]} />
                  <mesh {...commonProps} material={accentMat} geometry={cylinderGeo} position={[0.25, 0.4, 0.25]} scale={[0.2, 0.8, 0.2]} />
                  <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#6b7280'})} geometry={boxGeo} position={[0.25, 0.7, 0]} scale={[0.05, 0.05, 0.5]} />
                </>
              );
            } else {
              // 3. Chemical Plant / Refinery
              return (
                <>
                   <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[-0.2, 0.25, 0]} scale={[0.4, 0.5, 0.8]} />
                   {/* Tanks */}
                   <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#94a3b8'})} geometry={cylinderGeo} position={[0.2, 0.3, -0.2]} scale={[0.25, 0.6, 0.25]} />
                   <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#94a3b8'})} geometry={cylinderGeo} position={[0.2, 0.3, 0.2]} scale={[0.25, 0.6, 0.25]} />
                   {/* Piping */}
                   <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#475569'})} geometry={cylinderGeo} position={[0.2, 0.5, 0]} scale={[0.1, 0.1, 0.5]} rotation={[Math.PI/2, 0, 0]} />
                   <SmokeStack position={[-0.2, 0.5, 0]} />
                </>
              );
            }

          case BuildingType.Restaurant:
             // Diner style
             return (
               <>
                 {/* Main Diner Body */}
                 <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.3, 0]} scale={[0.9, 0.6, 0.7]} />
                 {/* Roof Striped? Just solid for now */}
                 <mesh {...commonProps} material={new THREE.MeshStandardMaterial({ color: '#fca5a5' })} geometry={cylinderGeo} position={[0, 0.6, 0]} scale={[0.92, 0.1, 0.72]} />
                 {/* Sign */}
                 <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0, 0.8, 0.3]} scale={[0.6, 0.3, 0.05]} />
                 <WindowBlock position={[0, 0.3, 0.36]} scale={[0.8, 0.3, 0.05]} />
               </>
             );

          case BuildingType.Hotel:
             // Tall building with entrance canopy
             return (
               <>
                 <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 1, 0]} scale={[0.8, 2, 0.6]} />
                 {/* Windows grid */}
                 <WindowBlock position={[0, 1.6, 0.31]} scale={[0.6, 0.3, 0.05]} />
                 <WindowBlock position={[0, 1.1, 0.31]} scale={[0.6, 0.3, 0.05]} />
                 <WindowBlock position={[0, 0.6, 0.31]} scale={[0.6, 0.3, 0.05]} />
                 {/* Entrance canopy */}
                 <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0, 0.2, 0.4]} scale={[0.4, 0.05, 0.4]} />
                 <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#ef4444'})} geometry={boxGeo} position={[0, 0.1, 0.3]} scale={[0.05, 0.2, 0.05]} />
                 {/* Top Decor */}
                 <mesh {...commonProps} material={roofMat} geometry={coneGeo} position={[0, 2.2, 0]} scale={[0.6, 0.4, 0.6]} rotation={[0, Math.PI/4, 0]} />
               </>
             );

          case BuildingType.Hospital:
            return (
              <>
                 {/* Main Block */}
                 <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.5, 0]} scale={[0.9, 1, 0.8]} />
                 {/* Side Wing */}
                 <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0.3, 0.4, 0]} scale={[0.4, 0.6, 0.6]} />
                 
                 {/* Red Cross Symbol on Roof */}
                 <group position={[0, 1.01, 0]}>
                    <mesh material={new THREE.MeshStandardMaterial({color: '#ef4444'})} geometry={boxGeo} scale={[0.4, 0.1, 0.1]} />
                    <mesh material={new THREE.MeshStandardMaterial({color: '#ef4444'})} geometry={boxGeo} scale={[0.1, 0.1, 0.4]} />
                 </group>
                 
                 {/* Entrance Area */}
                 <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0, 0.2, 0.45]} scale={[0.5, 0.4, 0.1]} />
                 <WindowBlock position={[0, 0.6, 0.41]} scale={[0.4, 0.3, 0.05]} />
              </>
            );

          case BuildingType.Airport:
            return (
              <>
                {/* Ground Runway Strip */}
                <mesh receiveShadow position={[0, 0.05, 0]}>
                  <boxGeometry args={[1, 0.05, 0.4]} />
                  <meshStandardMaterial color="#334155" /> {/* Dark slate */}
                </mesh>
                {/* Runway markings */}
                <mesh position={[-0.3, 0.08, 0]} rotation={[-Math.PI/2, 0, 0]}>
                   <planeGeometry args={[0.2, 0.05]} />
                   <meshBasicMaterial color="white" />
                </mesh>
                <mesh position={[0.3, 0.08, 0]} rotation={[-Math.PI/2, 0, 0]}>
                   <planeGeometry args={[0.2, 0.05]} />
                   <meshBasicMaterial color="white" />
                </mesh>

                {/* Terminal Building */}
                <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.3, -0.3]} scale={[0.9, 0.5, 0.3]} />
                {/* Windows (Glass Facade) */}
                <mesh position={[0, 0.3, -0.14]} scale={[0.85, 0.4, 0.05]}>
                   <boxGeometry />
                   <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.8} />
                </mesh>

                {/* Control Tower */}
                <mesh {...commonProps} material={mainMat} geometry={cylinderGeo} position={[0.35, 0.6, -0.3]} scale={[0.1, 1.2, 0.1]} />
                <mesh {...commonProps} material={mainMat} geometry={cylinderGeo} position={[0.35, 1.25, -0.3]} scale={[0.15, 0.15, 0.15]} />
                <mesh position={[0.35, 1.25, -0.3]} scale={[0.16, 0.08, 0.16]}>
                    <cylinderGeometry />
                    <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.9} />
                </mesh>

                {/* Airplane Manager */}
                <Airplane />
              </>
            );

          case BuildingType.Park:
            // Trees and fountain
             return (
               <>
                  {/* Trees */}
                  {[0, 1, 2, 3].map(i => {
                    const angle = (i / 4) * Math.PI * 2;
                    const r = 0.3;
                    return (
                      <group key={i} position={[Math.cos(angle)*r, 0, Math.sin(angle)*r]}>
                        <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#8b5cf6'})} geometry={cylinderGeo} position={[0, 0.2, 0]} scale={[0.1, 0.4, 0.1]} />
                        <mesh {...commonProps} material={mainMat} geometry={coneGeo} position={[0, 0.5, 0]} scale={[0.25, 0.6, 0.25]} />
                      </group>
                    )
                  })}
                  {/* Fountain/Pond center */}
                  <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#3b82f6', roughness: 0.1})} geometry={cylinderGeo} position={[0, 0.1, 0]} scale={[0.4, 0.1, 0.4]} />
               </>
             );
             
          default: // Road or None
            return null;
        }
      })()}
    </group>
  );
});

interface IsoMapProps {
  grid: Grid;
  onTileClick: (x: number, y: number) => void;
  hoveredTool: BuildingType;
  population: number;
}

// Helper to check for road neighbors to orient cars
const isRoad = (grid: Grid, r: number, c: number) => {
   if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) return false;
   return grid[r][c].buildingType === BuildingType.Road;
};

const getRoadAxis = (grid: Grid, x: number, y: number): 'x' | 'z' => {
  // Vertical if top or bottom has road, and horizontal doesn't (or simple preference)
  const h = isRoad(grid, y, x-1) || isRoad(grid, y, x+1);
  const v = isRoad(grid, y-1, x) || isRoad(grid, y+1, x);
  if (v && !h) return 'z';
  return 'x';
};

const IsoMap: React.FC<IsoMapProps> = ({ grid, onTileClick, hoveredTool, population }) => {
  const controlsRef = useRef<any>(null);

  // Focus camera roughly on center
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
    }
  }, []);

  return (
    <div className="absolute inset-0 z-0">
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
        {/* Camera Setup */}
        <OrthographicCamera makeDefault position={[20, 20, 20]} zoom={20} near={-50} far={200} />
        <MapControls 
          ref={controlsRef} 
          enableRotate={false} 
          enableZoom={true} 
          minZoom={10} 
          maxZoom={50}
          screenSpacePanning={true}
        />

        {/* Global Weather System */}
        <WeatherSystem />

        <Environment preset="city" />

        {/* Clouds Layer */}
        <group position={[0, 8, 0]}>
           {[...Array(6)].map((_, i) => (
              <Cloud 
                key={i} 
                position={[getRandomRange(-15, 15), 0, getRandomRange(-15, 15)]} 
                scale={getRandomRange(1, 2)} 
                seed={i}
              />
           ))}
        </group>

        {/* World Content */}
        <group position={[0, -0.5, 0]}>
          {/* Ground Plane */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
            <planeGeometry args={[50, 50]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>

          {/* Grid Tiles */}
          {grid.map((row, y) =>
            row.map((tile, x) => {
              const [wx, wy, wz] = gridToWorld(x, y);
              const hash = getHash(x, y);

              // Detect intersections
              let isIntersection = false;
              if (tile.buildingType === BuildingType.Road) {
                 const neighbors = (isRoad(grid, y, x-1) ? 1 : 0) +
                                   (isRoad(grid, y, x+1) ? 1 : 0) +
                                   (isRoad(grid, y-1, x) ? 1 : 0) +
                                   (isRoad(grid, y+1, x) ? 1 : 0);
                 isIntersection = neighbors >= 3;
              }

              // Base Tile
              return (
                <group key={`${x}-${y}`} position={[wx, wy, wz]}>
                  {/* Interactive Base */}
                  <mesh 
                    receiveShadow 
                    castShadow // Roads cast shadows?
                    onClick={(e) => {
                      e.stopPropagation();
                      onTileClick(x, y);
                    }}
                    onPointerOver={(e) => {
                      e.stopPropagation();
                      document.body.style.cursor = 'pointer';
                    }}
                    onPointerOut={(e) => {
                      document.body.style.cursor = 'auto';
                    }}
                  >
                    <boxGeometry args={[1, 0.2, 1]} />
                    <meshStandardMaterial 
                      color={tile.buildingType === BuildingType.Road ? '#374151' : (tile.buildingType === BuildingType.None ? '#10b981' : '#059669')} // Dark gray for road, Green for ground
                    />
                  </mesh>
                  
                  {/* Road Content */}
                  {tile.buildingType === BuildingType.Road && (
                     <>
                        <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.11, 0]}>
                            <planeGeometry args={[0.8, 0.8]} />
                            <meshStandardMaterial color="#4b5563" />
                        </mesh>
                        
                        {/* Traffic Signals at Intersection */}
                        {isIntersection ? (
                           <TrafficLight />
                        ) : (
                           // Regular traffic only on straight roads to avoid clipping in lights
                           <>
                             {hash > 0.4 && (
                                <Car 
                                    axis={getRoadAxis(grid, x, y)} 
                                    seed={hash} 
                                    color={['#ef4444', '#3b82f6', '#eab308', '#22c55e', '#a855f7', '#ffffff', '#1f2937', '#94a3b8', '#fb923c', '#06b6d4'][Math.floor(hash * 10)]} 
                                />
                             )}
                           </>
                        )}
                        
                        {/* Pedestrian on sidewalk (sometimes) */}
                        {hash < 0.2 && <Person seed={hash} />}
                     </>
                  )}

                  {/* Building */}
                  {tile.buildingType !== BuildingType.None && tile.buildingType !== BuildingType.Road && (
                    <>
                        {tile.constructionTimeLeft && tile.constructionTimeLeft > 0 ? (
                           // Under Construction Visual
                           <ConstructionSite timeLeft={tile.constructionTimeLeft} />
                        ) : (
                           // Finished Building
                           <>
                              <ProceduralBuilding 
                                type={tile.buildingType} 
                                baseColor={BUILDINGS[tile.buildingType].color} 
                                x={x} 
                                y={y} 
                              />
                              {/* Pedestrians near buildings (only if built) */}
                              {hash > 0.7 && (tile.buildingType === BuildingType.Commercial || tile.buildingType === BuildingType.Park || tile.buildingType === BuildingType.Restaurant) && (
                                  <Person seed={hash * 2} />
                              )}
                           </>
                        )}
                    </>
                  )}
                </group>
              );
            })
          )}
        </group>
        
        <SoftShadows size={10} samples={8} />
      </Canvas>
    </div>
  );
};

export default React.memo(IsoMap);
