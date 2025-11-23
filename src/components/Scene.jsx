import React, { useState, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, MathUtils } from 'three';
import { Box, Plane, Sphere, Cylinder, SoftShadows, OrbitControls, useTexture } from '@react-three/drei';
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
      lightRef.current.color.setHSL(currentHue.current / 360, 1, 0.5);
      lightRef.current.intensity = currentIntensity.current * 20; // Reduced multiplier (was 40)
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

const WindowView = React.memo(function WindowView({ time }) {
  const texture = useTexture('/garden_view.png');

  // Reset texture to 1:1
  texture.repeat.set(1, 1);
  texture.offset.set(0, 0);

  const meshRef = useRef();
  const lightRef = useRef();
  const pointLightRef = useRef();

  useFrame(() => {
    if (meshRef.current) {
      // Calculate sky/ambient color based on TIME, not lamp settings
      const hour = time / 60;

      let targetColor = new Color();
      let brightness = 1;

      if (hour >= 20 || hour < 7) {
        // Night (8 PM - 7 AM)
        targetColor.setHSL(0.6, 0.6, 0.4); // Moonlight Blue
        brightness = 0.8;
      } else if (hour >= 7 && hour < 17) {
        // Day (7 AM - 5 PM)
        targetColor.setHSL(0.6, 0.2, 0.9); // Bright White/Blue Sky
        brightness = 2.0;
      } else {
        // Evening (5 PM - 8 PM)
        targetColor.setHSL(0.08, 0.8, 0.6); // Sunset Orange
        brightness = 1.5;
      }

      // Texture brightness (keep it a bit lower than light source for realism)
      const textureColor = targetColor.clone().multiplyScalar(0.8);
      meshRef.current.color.lerp(textureColor, 0.05);
      meshRef.current.toneMapped = false;

      // Update RectAreaLight
      if (lightRef.current) {
        lightRef.current.color.lerp(targetColor, 0.05);
        lightRef.current.intensity = MathUtils.lerp(lightRef.current.intensity, brightness * 5, 0.05); // Reduced multiplier (was 10)
      }

      // Update PointLight (Fill light for the room)
      if (pointLightRef.current) {
        pointLightRef.current.color.lerp(targetColor, 0.05);
        pointLightRef.current.intensity = MathUtils.lerp(pointLightRef.current.intensity, brightness * 2, 0.05); // Reduced multiplier (was 5)
      }
    }
  });

  return (
    <group position={[0, 3, -5.1]}>
      <Plane args={[3, 3]}>
        <meshBasicMaterial ref={meshRef} map={texture} />
      </Plane>
      {/* Window Light Source (RectArea for reflections) */}
      <rectAreaLight
        ref={lightRef}
        width={3}
        height={3}
        position={[0, 0, 0.1]}
        rotation={[0, Math.PI, 0]}
      />
      {/* PointLight for general room illumination from window */}
      <pointLight
        ref={pointLightRef}
        position={[0, 0, 1]}
        distance={15}
        decay={2}
      />
    </group>
  );
});

export function Scene({ lampIntensity, lampHue, setHoveredFurniture, isDragging, setIsDragging, time }) {
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
      tableLightRef.current.intensity = intensity * 10; // Reduced multiplier (was 20)
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
      wallLightRef.current.intensity = intensity * 20; // Reduced multiplier (was 40)
    }
    if (wallSconceRef.current) {
      wallSconceRef.current.material.emissive.copy(color);
      wallSconceRef.current.material.emissiveIntensity = intensity * 0.5;
    }
  });

  // Calculate light intensity based on brightness prop (0 to 1)
  const ambientIntensity = 0; // Fixed ambient
  const mainLightIntensity = 0.75; // Reduced main light base (was 1.5)
  // const lampColor = `hsl(${lampHue}, 100%, 70%)`; // Removed in favor of interpolation

  // Memoize materials to avoid recreation on every render
  const floorMaterial = useMemo(() => ({ color: "#333", roughness: 0.8 }), []);
  const backWallMaterial = useMemo(() => ({ color: "#554444", roughness: 1 }), []);
  const leftWallMaterial = useMemo(() => ({ color: "#222", roughness: 1 }), []);
  const rightWallMaterial = useMemo(() => ({ color: "#333", roughness: 1 }), []);
  const ceilingMaterial = useMemo(() => ({ color: "#444", roughness: 1 }), []);
  const sofaMaterial = useMemo(() => ({ color: "#885555", roughness: 0.2 }), []);
  const tableMaterial = useMemo(() => ({ color: "#222", roughness: 0.2 }), []);
  const chairMaterial = useMemo(() => ({ color: "#222", roughness: 0.2 }), []); // Black box
  const ottomanMaterial = useMemo(() => ({ color: "#665555", roughness: 0.2 }), []);
  const tvStandMaterial = useMemo(() => ({ color: "#111", roughness: 0.2 }), []);

  // Bed Materials
  const bedOrangeMaterial = useMemo(() => ({ color: "#ff9f43", roughness: 0.5 }), []);
  const bedBlueMaterial = useMemo(() => ({ color: "#2e86de", roughness: 0.6 }), []);
  const bedLightBlueMaterial = useMemo(() => ({ color: "#54a0ff", roughness: 0.6 }), []);
  const bedMetalMaterial = useMemo(() => ({ color: "#bdc3c7", roughness: 0.3, metalness: 0.8 }), []);
  const bedWheelMaterial = useMemo(() => ({ color: "#2c3e50", roughness: 0.8 }), []);
  const bedPillowMaterial = useMemo(() => ({ color: "#ffffff", roughness: 0.9 }), []);
  const ivBagMaterial = useMemo(() => ({ color: "#9b59b6", roughness: 0.3, transparent: true, opacity: 0.8 }), []);

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

          {/* Back Wall (Split for Window) */}
          {/* Top */}
          <Plane args={[10, 1.5]} position={[0, 5.25, -5]} receiveShadow>
            <meshStandardMaterial {...backWallMaterial} />
          </Plane>
          {/* Bottom */}
          <Plane args={[10, 1.5]} position={[0, 0.75, -5]} receiveShadow>
            <meshStandardMaterial {...backWallMaterial} />
          </Plane>
          {/* Left */}
          <Plane args={[3.5, 3]} position={[-3.25, 3, -5]} receiveShadow>
            <meshStandardMaterial {...backWallMaterial} />
          </Plane>
          {/* Right */}
          <Plane args={[3.5, 3]} position={[3.25, 3, -5]} receiveShadow>
            <meshStandardMaterial {...backWallMaterial} />
          </Plane>

          {/* Window View */}
          <WindowView time={time} />

          {/* Window Frame */}
          <group position={[0, 3, -5]}>
            {/* Top Frame */}
            <Box args={[3.2, 0.1, 0.2]} position={[0, 1.55, 0]} castShadow>
              <meshStandardMaterial color="#333" />
            </Box>
            {/* Bottom Frame */}
            <Box args={[3.2, 0.1, 0.2]} position={[0, -1.55, 0]} castShadow>
              <meshStandardMaterial color="#333" />
            </Box>
            {/* Left Frame */}
            <Box args={[0.1, 3.2, 0.2]} position={[-1.55, 0, 0]} castShadow>
              <meshStandardMaterial color="#333" />
            </Box>
            {/* Right Frame */}
            <Box args={[0.1, 3.2, 0.2]} position={[1.55, 0, 0]} castShadow>
              <meshStandardMaterial color="#333" />
            </Box>
          </group>

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
          {/* Medical Bed (Detailed) */}
          <Furniture initialPosition={[0, 0, 0]} name="Bed" setHoveredFurniture={setHoveredFurniture} setIsDragging={setIsDragging}>
            <group rotation={[0, Math.PI, 0]}>
              {/* Legs & Wheels */}
              {[[-1, 1], [-1, -1], [1, 1], [1, -1]].map(([x, z], i) => (
                <group key={i} position={[x, 0.2, z * 0.5]}>
                  <Cylinder args={[0.05, 0.05, 0.4, 8]} position={[0, 0, 0]} castShadow receiveShadow>
                    <meshStandardMaterial {...bedMetalMaterial} />
                  </Cylinder>
                  <Cylinder args={[0.08, 0.08, 0.1, 16]} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.2, 0]} castShadow receiveShadow>
                    <meshStandardMaterial {...bedWheelMaterial} />
                  </Cylinder>
                </group>
              ))}

              {/* Main Frame */}
              <Box args={[2.2, 0.1, 1.2]} position={[0, 0.45, 0]} castShadow receiveShadow>
                <meshStandardMaterial {...bedMetalMaterial} />
              </Box>

              {/* Mattress */}
              <Box args={[2.1, 0.2, 1.1]} position={[0, 0.6, 0]} castShadow receiveShadow>
                <meshStandardMaterial {...bedBlueMaterial} />
              </Box>

              {/* Folded Sheet */}
              <Box args={[0.8, 0.22, 1.12]} position={[0.2, 0.6, 0]} castShadow receiveShadow>
                <meshStandardMaterial {...bedLightBlueMaterial} />
              </Box>

              {/* Pillow */}
              <Box args={[0.4, 0.15, 0.8]} position={[-0.8, 0.75, 0]} rotation={[0, 0, 0.1]} castShadow receiveShadow>
                <meshStandardMaterial {...bedPillowMaterial} />
              </Box>

              {/* Headboard */}
              <group position={[-1.1, 0.8, 0]}>
                <Box args={[0.1, 0.8, 1.2]} castShadow receiveShadow>
                  <meshStandardMaterial {...bedOrangeMaterial} />
                </Box>
                {/* Blue Panels */}
                <Box args={[0.12, 0.3, 0.3]} position={[0, 0.1, 0]} castShadow receiveShadow>
                  <meshStandardMaterial {...bedLightBlueMaterial} />
                </Box>
                <Box args={[0.12, 0.3, 0.3]} position={[0, 0.1, 0.35]} castShadow receiveShadow>
                  <meshStandardMaterial {...bedLightBlueMaterial} />
                </Box>
                <Box args={[0.12, 0.3, 0.3]} position={[0, 0.1, -0.35]} castShadow receiveShadow>
                  <meshStandardMaterial {...bedLightBlueMaterial} />
                </Box>
              </group>

              {/* Footboard */}
              <group position={[1.1, 0.6, 0]}>
                <Box args={[0.1, 0.6, 1.2]} castShadow receiveShadow>
                  <meshStandardMaterial {...bedOrangeMaterial} />
                </Box>
                {/* Blue Panels */}
                <Box args={[0.12, 0.2, 0.3]} position={[0, 0.1, 0]} castShadow receiveShadow>
                  <meshStandardMaterial {...bedLightBlueMaterial} />
                </Box>
                <Box args={[0.12, 0.2, 0.3]} position={[0, 0.1, 0.35]} castShadow receiveShadow>
                  <meshStandardMaterial {...bedLightBlueMaterial} />
                </Box>
                <Box args={[0.12, 0.2, 0.3]} position={[0, 0.1, -0.35]} castShadow receiveShadow>
                  <meshStandardMaterial {...bedLightBlueMaterial} />
                </Box>
              </group>

              {/* IV Stand */}
              <group position={[-1.1, 0, -0.7]}>
                <Cylinder args={[0.02, 0.02, 1.8, 8]} position={[0, 0.9, 0]} castShadow receiveShadow>
                  <meshStandardMaterial {...bedMetalMaterial} />
                </Cylinder>
                {/* IV Bag */}
                <Box args={[0.15, 0.2, 0.05]} position={[0, 1.7, 0.1]} castShadow receiveShadow>
                  <meshStandardMaterial {...ivBagMaterial} />
                </Box>
              </group>
            </group>
          </Furniture>

          {/* Coffee Table */}
          <Furniture initialPosition={[0, 0.2, 2.5]} name="Coffee Table" setHoveredFurniture={setHoveredFurniture} setIsDragging={setIsDragging}>
            <Box args={[1.5, 0.4, 1]} castShadow receiveShadow>
              <meshStandardMaterial {...tableMaterial} />
            </Box>
          </Furniture>

          {/* Chair */}
          <Furniture initialPosition={[-2.5, 0.4, 0.5]} name="Chair" setHoveredFurniture={setHoveredFurniture} setIsDragging={setIsDragging}>
            <Box args={[1, 0.8, 1]} rotation={[0, 0.5, 0]} castShadow receiveShadow>
              <meshStandardMaterial {...chairMaterial} />
            </Box>
          </Furniture>

          {/* Ottoman */}
          <Furniture initialPosition={[-2, 0.25, 2.5]} name="Ottoman" setHoveredFurniture={setHoveredFurniture} setIsDragging={setIsDragging}>
            <Box args={[0.8, 0.5, 0.8]} rotation={[0, 0.2, 0]} castShadow receiveShadow>
              <meshStandardMaterial {...ottomanMaterial} />
            </Box>
          </Furniture>

          {/* TV Stand / Cabinet */}
          <Furniture initialPosition={[0, 0.3, -4.5]} name="TV Stand" setHoveredFurniture={setHoveredFurniture} setIsDragging={setIsDragging}>
            <Box args={[6, 0.6, 0.8]} castShadow receiveShadow>
              <meshStandardMaterial {...tvStandMaterial} />
            </Box>
          </Furniture>
        </group>
      </Selection>
    </>
  );
}
