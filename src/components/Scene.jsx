import React, { useState, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, MathUtils } from 'three';
import { Box, Plane, Sphere, Cylinder, SoftShadows, OrbitControls } from '@react-three/drei';
import { Selection, Select, EffectComposer, Outline } from '@react-three/postprocessing';
import { Draggable } from './Draggable';

const Furniture = React.memo(function Furniture({ children, initialPosition, name, setHoveredFurniture, setIsDragging }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Draggable initialPosition={initialPosition} setIsDragging={setIsDragging}>
      <Select enabled={hovered}>
        <group
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true); setHoveredFurniture(name); }}
          onPointerOut={(e) => { e.stopPropagation(); setHovered(false); setHoveredFurniture(null); }}
        >
          {children}
        </group>
      </Select>
    </Draggable>
  );
});

const HangingLamp = React.memo(function HangingLamp({ position, targetHue, offset = 0, targetIntensity = 1 }) {
  const groupRef = useRef();
  const lightRef = useRef();
  const bulbRef = useRef();

  // Refs for interpolation state
  const currentHue = useRef(targetHue);
  const currentIntensity = useRef(targetIntensity);

  useFrame((state, delta) => {
    // 1. Pendulum animation removed
    if (groupRef.current) {
      groupRef.current.rotation.z = MathUtils.lerp(groupRef.current.rotation.z, 0, delta * 5);
    }

    // 2. Smooth Lighting Transition
    // Interpolate values (Speed factor 1.5 gives approx 3s settling time)
    const lerpSpeed = delta * 1.5;
    currentHue.current = MathUtils.lerp(currentHue.current, targetHue, lerpSpeed);
    currentIntensity.current = MathUtils.lerp(currentIntensity.current, targetIntensity, lerpSpeed);
    // console.log("HangingLamp Intensity:", currentIntensity.current, "Target:", targetIntensity);

    // Apply to Light
    if (lightRef.current) {
      lightRef.current.intensity = 40 * currentIntensity.current;
      const color = new Color().setHSL(currentHue.current / 360, 1, 0.7);
      lightRef.current.color.copy(color);
    }

    // Apply to Bulb Material
    if (bulbRef.current) {
      const color = new Color().setHSL(currentHue.current / 360, 1, 0.7);
      bulbRef.current.material.emissive.copy(color);
      bulbRef.current.material.emissiveIntensity = currentIntensity.current * 0.5;
    }
  });

  return (
    <group ref={groupRef} position={[position[0], 4.5, position[2]]}>
      <Cylinder args={[0.02, 0.02, 2, 6]} position={[0, -1, 0]}>
        <meshStandardMaterial color="black" />
      </Cylinder>

      <Sphere ref={bulbRef} args={[0.15, 8, 8]} position={[0, -2, 0]} castShadow={false}>
        <meshStandardMaterial color="white" />
      </Sphere>

      <pointLight
        ref={lightRef}
        position={[0, -2.2, 0]}
        distance={0}
        castShadow
        shadow-mapSize={[64, 64]}
        shadow-normalBias={0.04}
        shadow-bias={-0.0001}
      />
    </group>
  );
});

export function Scene({ lampIntensity, lampHue, setHoveredFurniture, isDragging, setIsDragging }) {
  // Static lights refs
  const tableLightRef = useRef();
  const wallLightRef = useRef();
  const wallSconceRef = useRef();

  // Interpolation state for static lights
  const currentHue = useRef(lampHue);
  const currentIntensity = useRef(lampIntensity);

  useFrame((state, delta) => {
    const lerpSpeed = delta * 1.5;
    currentHue.current = MathUtils.lerp(currentHue.current, lampHue, lerpSpeed);
    currentIntensity.current = MathUtils.lerp(currentIntensity.current, lampIntensity, lerpSpeed);

    const color = new Color().setHSL(currentHue.current / 360, 1, 0.7);
    const intensity = currentIntensity.current;
    // console.log("Scene Intensity:", intensity, "Target:", lampIntensity);

    // Update Table Lamp
    if (tableLightRef.current) {
      // Table lamp is warmer/different usually, but let's sync it for now or keep it separate?
      // Original code: intensity={mainLightIntensity * 0.8}, color="#ffccaa"
      // Let's make it respond to the circadian rhythm too but maybe keep a warmer tint?
      // For simplicity and requested effect, let's sync it to the main vibe but maybe slightly warmer.
      // Actually user said "light settings", implying all lights.
      tableLightRef.current.color.copy(color);
      tableLightRef.current.intensity = intensity * 20; // Scaled intensity
      // Wait, original table lamp was: intensity={mainLightIntensity * 0.8} where mainLightIntensity = brightness * 30
      // It didn't use lampIntensity.
      // BUT the user wants "light transition" for the circadian clock.
      // The circadian clock sets `lampIntensity` and `lampHue`.
      // So we SHOULD apply these to the static lights too if we want the whole room to change.
      // Let's apply the hue to the table lamp but keep its intensity tied to brightness (or mix them).
      // Let's stick to the requested "lamp settings" which usually means the hanging lamps, but for a room effect,
      // the wall light definitely needs to change. The table lamp might be independent?
      // Looking at original code: Wall light used `lampColor` and `lampIntensity`. Table lamp used static color.
      // I will update Wall Light to use interpolated values.
      // I will leave Table Lamp as is (static warm) unless it looks weird, or maybe just update its intensity?
      // Let's update Wall Light first.
    }

    // Update Wall Light
    if (wallLightRef.current) {
      wallLightRef.current.color.copy(color);
      wallLightRef.current.intensity = 40 * intensity;
    }
    if (wallSconceRef.current) {
      wallSconceRef.current.material.emissive.copy(color);
      wallSconceRef.current.material.emissiveIntensity = intensity * 0.5;
    }
  });

  // Calculate light intensity based on brightness prop (0 to 1)
  const ambientIntensity = 0; // Fixed ambient
  const mainLightIntensity = 1.5; // Fixed main light base
  // const lampColor = `hsl(${lampHue}, 100%, 70%)`; // Removed in favor of interpolation

  // Memoize materials to avoid recreation on every render
  const floorMaterial = useMemo(() => ({ color: "#333", roughness: 0.8 }), []);
  const backWallMaterial = useMemo(() => ({ color: "#554444", roughness: 1 }), []);
  const leftWallMaterial = useMemo(() => ({ color: "#222", roughness: 1 }), []);
  const rightWallMaterial = useMemo(() => ({ color: "#333", roughness: 1 }), []);
  const ceilingMaterial = useMemo(() => ({ color: "#444", roughness: 1 }), []);
  const sofaMaterial = useMemo(() => ({ color: "#885555", roughness: 0.2 }), []);
  const tableMaterial = useMemo(() => ({ color: "#222", roughness: 0.2 }), []);
  const chairMaterial = useMemo(() => ({ color: "#555566", roughness: 0.2 }), []);
  const ottomanMaterial = useMemo(() => ({ color: "#665555", roughness: 0.2 }), []);
  const tvStandMaterial = useMemo(() => ({ color: "#111", roughness: 0.2 }), []);

  return (
    <>
      {/* <SoftShadows size={25} samples={4} focus={0} /> */}
      <OrbitControls enabled={!isDragging} enablePan={false} minDistance={5} maxDistance={15} />

      {/* Ambient Light for base visibility */}
      <ambientLight intensity={ambientIntensity} />

      {/* Table Lamp - Keeping static warm for contrast, but could animate if needed */}
      <pointLight
        ref={tableLightRef}
        position={[-2, 1, -1]}
        intensity={40 * 0.8} // Fixed intensity
        color="#ffccaa"
        distance={5}
        decay={2}
        castShadow
        shadow-mapSize={[128, 128]}
        shadow-normalBias={0.04}
        shadow-bias={-0.0001}
      />

      <Selection>
        <EffectComposer autoClear={false} multisampling={0}>
          <Outline edgeStrength={10} width={1000} visibleEdgeColor="white" hiddenEdgeColor="white" />
        </EffectComposer>

        {/* Hanging Lamps */}
        <HangingLamp position={[-1.5, 0, -3]} targetHue={lampHue} offset={0} targetIntensity={lampIntensity} />
        <HangingLamp position={[0, 0, -3]} targetHue={lampHue} offset={1} targetIntensity={lampIntensity} />
        <HangingLamp position={[1.5, 0, -3]} targetHue={lampHue} offset={2} targetIntensity={lampIntensity} />

        {/* Wall Light on Left Wall */}
        <group position={[-4.95, 2, 0]}>
          <Cylinder ref={wallSconceRef} args={[0.3, 0.3, 0.1, 16]} rotation={[0, 0, Math.PI / 2]} castShadow={false}>
            <meshStandardMaterial color="white" />
          </Cylinder>
          {/* Wall light source */}
          <pointLight
            ref={wallLightRef}
            position={[0, 0, 0]}
            distance={0}
          />
        </group>

        {/* Room Structure */}
        <group position={[0, -1.5, 0]}>
          {/* Floor */}
          <Plane
            args={[10, 10]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
          >
            <meshStandardMaterial {...floorMaterial} />
          </Plane>

          {/* Back Wall */}
          <Plane
            args={[10, 6]}
            position={[0, 3, -5]}
            receiveShadow
          >
            <meshStandardMaterial {...backWallMaterial} />
          </Plane>

          {/* Left Wall (Window side) */}
          <Plane
            args={[10, 6]}
            position={[-5, 3, 0]}
            rotation={[0, Math.PI / 2, 0]}
            receiveShadow
          >
            <meshStandardMaterial {...leftWallMaterial} />
          </Plane>

          {/* Right Wall */}
          <Plane
            args={[10, 6]}
            position={[5, 3, 0]}
            rotation={[0, -Math.PI / 2, 0]}
            receiveShadow
          >
            <meshStandardMaterial {...rightWallMaterial} />
          </Plane>

          {/* Ceiling */}
          <Plane
            args={[10, 10]}
            position={[0, 6, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            receiveShadow
          >
            <meshStandardMaterial {...ceilingMaterial} />
          </Plane>
        </group>

        {/* Furniture Placeholders */}
        <group position={[0, -1.5, 0]}>
          {/* Sofa */}
          <Furniture initialPosition={[2, 0.4, 3]} name="Sofa" setHoveredFurniture={setHoveredFurniture} setIsDragging={setIsDragging}>
            <Box args={[3, 0.8, 1.2]} castShadow receiveShadow>
              <meshStandardMaterial {...sofaMaterial} />
            </Box>
          </Furniture>

          {/* Coffee Table */}
          <Furniture initialPosition={[-0.5, 0.2, 2]} name="Coffee Table" setHoveredFurniture={setHoveredFurniture} setIsDragging={setIsDragging}>
            <Box args={[1.5, 0.4, 1]} castShadow receiveShadow>
              <meshStandardMaterial {...tableMaterial} />
            </Box>
          </Furniture>

          {/* Chair */}
          <Furniture initialPosition={[-2.5, 0.4, 0]} name="Chair" setHoveredFurniture={setHoveredFurniture} setIsDragging={setIsDragging}>
            <Box args={[1, 0.8, 1]} rotation={[0, 0.5, 0]} castShadow receiveShadow>
              <meshStandardMaterial {...chairMaterial} />
            </Box>
          </Furniture>

          {/* Ottoman */}
          <Furniture initialPosition={[-2.2, 0.25, 1.5]} name="Ottoman" setHoveredFurniture={setHoveredFurniture} setIsDragging={setIsDragging}>
            <Box args={[0.8, 0.5, 0.8]} rotation={[0, 0.2, 0]} castShadow receiveShadow>
              <meshStandardMaterial {...ottomanMaterial} />
            </Box>
          </Furniture>

          {/* TV Stand / Cabinet */}
          <Furniture initialPosition={[0, 0.3, -4]} name="TV Stand" setHoveredFurniture={setHoveredFurniture} setIsDragging={setIsDragging}>
            <Box args={[6, 0.6, 0.8]} castShadow receiveShadow>
              <meshStandardMaterial {...tvStandMaterial} />
            </Box>
          </Furniture>
        </group>
      </Selection>
    </>
  );
}
