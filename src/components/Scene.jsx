import React, { useState, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, MathUtils, RepeatWrapping } from 'three';
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

const CloudLamp = React.memo(function CloudLamp({ position, targetHue, offset = 0, targetIntensity = 1 }) {
  const groupRef = useRef();
  const lightRef = useRef();
  const bulbRef = useRef();

  // Refs for interpolation state
  const currentHue = useRef(targetHue);
  const currentIntensity = useRef(targetIntensity);

  useFrame((state, delta) => {
    // 1. Gentle floating animation
    if (groupRef.current) {
      groupRef.current.position.y = 4.5 + Math.sin(state.clock.elapsedTime + offset) * 0.1;
    }

    // 2. Smooth Lighting Transition (Preserved Logic)
    const lerpSpeed = delta * 1.5;
    currentHue.current = MathUtils.lerp(currentHue.current, targetHue, lerpSpeed);
    currentIntensity.current = MathUtils.lerp(currentIntensity.current, targetIntensity, lerpSpeed);

    // Apply to Light
    if (lightRef.current) {
      lightRef.current.color.setHSL(currentHue.current / 360, 1, 0.5);
      lightRef.current.intensity = currentIntensity.current * 4; // Reduced to 50% of previous (was 8)
    }

    // Apply to Bulb Material (The Cloud itself)
    if (bulbRef.current) {
      const color = new Color().setHSL(currentHue.current / 360, 1, 0.8); // Slightly lighter for the cloud
      bulbRef.current.color.lerp(color, 0.1);
      bulbRef.current.emissive.copy(color);
      bulbRef.current.emissiveIntensity = currentIntensity.current * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={[position[0], 4.5, position[2]]}>
      {/* Cord */}
      <Cylinder args={[0.01, 0.01, 2, 6]} position={[0, -1, 0]}>
        <meshStandardMaterial color="white" />
      </Cylinder>

      {/* Cloud Shape (Cluster of spheres) */}
      <group position={[0, -2, 0]}>
        <Sphere args={[0.3, 16, 16]} position={[0, 0, 0]}>
          <meshStandardMaterial ref={bulbRef} color="white" roughness={0.4} />
        </Sphere>
        <Sphere args={[0.25, 16, 16]} position={[0.25, 0.1, 0.1]}>
          <meshStandardMaterial color="white" roughness={0.4} />
        </Sphere>
        <Sphere args={[0.25, 16, 16]} position={[-0.25, 0.05, -0.1]}>
          <meshStandardMaterial color="white" roughness={0.4} />
        </Sphere>
        <Sphere args={[0.2, 16, 16]} position={[0.1, -0.1, 0.2]}>
          <meshStandardMaterial color="white" roughness={0.4} />
        </Sphere>
        <Sphere args={[0.2, 16, 16]} position={[-0.1, 0.15, -0.2]}>
          <meshStandardMaterial color="white" roughness={0.4} />
        </Sphere>
      </group>

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
      tableLightRef.current.intensity = intensity * 5; // Reduced multiplier (was 10)
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
      wallLightRef.current.intensity = intensity * 5; // Reduced multiplier (was 10)
    }
    if (wallSconceRef.current) {
      wallSconceRef.current.material.emissive.copy(color);
      wallSconceRef.current.material.emissiveIntensity = intensity * 0.25;
    }
  });

  // Calculate light intensity based on brightness prop (0 to 1)
  const ambientIntensity = 0; // Fixed ambient
  const mainLightIntensity = 0.75; // Reduced main light base (was 1.5)
  // const lampColor = `hsl(${lampHue}, 100%, 70%)`; // Removed in favor of interpolation

  // Load Textures
  const rightWallTexture = useTexture('/wallpaper_right.png');
  rightWallTexture.wrapS = rightWallTexture.wrapT = RepeatWrapping;
  rightWallTexture.repeat.set(1, 1); // Adjust scale if needed

  // Memoize materials to avoid recreation on every render
  const floorMaterial = useMemo(() => ({ color: "#E0C39C", roughness: 0.6 }), []); // Light Oak
  const backWallMaterial = useMemo(() => ({ color: "#4FACFE", roughness: 1 }), []); // Bright Blue
  const leftWallMaterial = useMemo(() => ({ color: "#4FACFE", roughness: 1 }), []); // Bright Blue
  // Right Wall now uses the texture
  const rightWallMaterial = useMemo(() => ({ map: rightWallTexture, roughness: 1 }), [rightWallTexture]);
  const ceilingMaterial = useMemo(() => ({ color: "#F0F2F5", roughness: 1 }), []); // White/Light Grey

  // Furniture Materials
  const woodMaterial = useMemo(() => ({ color: "#F5DEB3", roughness: 0.5 }), []); // Light Wood
  const fabricMaterial = useMemo(() => ({ color: "#FF6B6B", roughness: 0.8 }), []); // Red Fabric
  const yellowMaterial = useMemo(() => ({ color: "#FFD93D", roughness: 0.4 }), []); // Bright Yellow
  const blueMaterial = useMemo(() => ({ color: "#4D96FF", roughness: 0.4 }), []); // Bright Blue
  const greenMaterial = useMemo(() => ({ color: "#6BCB77", roughness: 0.4 }), []); // Bright Green
  const whiteMaterial = useMemo(() => ({ color: "#FFFFFF", roughness: 0.5 }), []);

  // Bed Materials
  const bedFrameMaterial = useMemo(() => ({ color: "#FFFFFF", roughness: 0.5 }), []); // White Wood
  const bedMattressMaterial = useMemo(() => ({ color: "#F0F0F0", roughness: 0.8 }), []);
  const bedSheetMaterial = useMemo(() => ({ color: "#FF9F43", roughness: 0.8 }), []); // Orange/Yellow Sheet
  const bedPillowMaterial = useMemo(() => ({ color: "#FFFFFF", roughness: 0.9 }), []);

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
        intensity={8} // Reduced from 15
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

        {/* Cloud Lamps */}
        <CloudLamp position={[-1.5, 0, -3]} targetHue={lampHue} offset={0} targetIntensity={lampIntensity} />
        <CloudLamp position={[0, 0, -3]} targetHue={lampHue} offset={1} targetIntensity={lampIntensity} />
        <CloudLamp position={[1.5, 0, -3]} targetHue={lampHue} offset={2} targetIntensity={lampIntensity} />

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

          {/* Rug */}
          <group position={[0, 0.01, 1]}>
            <Cylinder args={[2.5, 2.5, 0.02, 32]} receiveShadow>
              <meshStandardMaterial color="#FFD93D" />
            </Cylinder>
            <Cylinder args={[2, 2, 0.03, 32]} receiveShadow>
              <meshStandardMaterial color="#FF6B6B" />
            </Cylinder>
            <Cylinder args={[1.5, 1.5, 0.04, 32]} receiveShadow>
              <meshStandardMaterial color="#4D96FF" />
            </Cylinder>
          </group>

          {/* House Frame Bed */}
          <Furniture initialPosition={[0, 0, 0]} name="Bed" setHoveredFurniture={setHoveredFurniture} setIsDragging={setIsDragging}>
            <group rotation={[0, Math.PI, 0]}>
              {/* Mattress */}
              <Box args={[2.2, 0.3, 1.2]} position={[0, 0.15, 0]} castShadow receiveShadow>
                <meshStandardMaterial {...bedMattressMaterial} />
              </Box>
              {/* Sheet */}
              <Box args={[2.22, 0.2, 1.22]} position={[0, 0.1, 0]} castShadow receiveShadow>
                <meshStandardMaterial {...bedSheetMaterial} />
              </Box>
              {/* Pillow */}
              <Box args={[0.5, 0.15, 0.8]} position={[-0.7, 0.35, 0]} rotation={[0, 0, 0.1]} castShadow receiveShadow>
                <meshStandardMaterial {...bedPillowMaterial} />
              </Box>

              {/* House Frame */}
              <group position={[0, 0, 0]}>
                {/* Posts */}
                <Box args={[0.05, 1.5, 0.05]} position={[-1.05, 0.75, 0.55]} castShadow><meshStandardMaterial {...bedFrameMaterial} /></Box>
                <Box args={[0.05, 1.5, 0.05]} position={[-1.05, 0.75, -0.55]} castShadow><meshStandardMaterial {...bedFrameMaterial} /></Box>
                <Box args={[0.05, 1.5, 0.05]} position={[1.05, 0.75, 0.55]} castShadow><meshStandardMaterial {...bedFrameMaterial} /></Box>
                <Box args={[0.05, 1.5, 0.05]} position={[1.05, 0.75, -0.55]} castShadow><meshStandardMaterial {...bedFrameMaterial} /></Box>

                {/* Top Beams */}
                <Box args={[2.1, 0.05, 0.05]} position={[0, 1.5, 0.55]} castShadow><meshStandardMaterial {...bedFrameMaterial} /></Box>
                <Box args={[2.1, 0.05, 0.05]} position={[0, 1.5, -0.55]} castShadow><meshStandardMaterial {...bedFrameMaterial} /></Box>

                {/* Roof */}
                <Box args={[0.05, 1.1, 0.05]} position={[-1.05, 1.9, 0]} rotation={[Math.PI / 4, 0, 0]} castShadow><meshStandardMaterial {...bedFrameMaterial} /></Box>
                <Box args={[0.05, 1.1, 0.05]} position={[-1.05, 1.9, 0]} rotation={[-Math.PI / 4, 0, 0]} castShadow><meshStandardMaterial {...bedFrameMaterial} /></Box>
                <Box args={[0.05, 1.1, 0.05]} position={[1.05, 1.9, 0]} rotation={[Math.PI / 4, 0, 0]} castShadow><meshStandardMaterial {...bedFrameMaterial} /></Box>
                <Box args={[0.05, 1.1, 0.05]} position={[1.05, 1.9, 0]} rotation={[-Math.PI / 4, 0, 0]} castShadow><meshStandardMaterial {...bedFrameMaterial} /></Box>

                {/* Roof Top Beam */}
                <Box args={[2.2, 0.05, 0.05]} position={[0, 2.3, 0]} castShadow><meshStandardMaterial {...bedFrameMaterial} /></Box>
              </group>
            </group>
          </Furniture>

          {/* Teepee Tent (Replaces Chair) */}
          <Furniture initialPosition={[-2.5, 0, 2]} name="Teepee" setHoveredFurniture={setHoveredFurniture} setIsDragging={setIsDragging}>
            <group rotation={[0, 0.5, 0]}>
              {/* Poles */}
              <Cylinder args={[0.04, 0.06, 2.5, 8]} position={[0.5, 1.2, 0.5]} rotation={[0, 0, -0.2]} castShadow><meshStandardMaterial {...woodMaterial} /></Cylinder>
              <Cylinder args={[0.04, 0.06, 2.5, 8]} position={[-0.5, 1.2, 0.5]} rotation={[0, 0, 0.2]} castShadow><meshStandardMaterial {...woodMaterial} /></Cylinder>
              <Cylinder args={[0.04, 0.06, 2.5, 8]} position={[0, 1.2, -0.6]} rotation={[0.2, 0, 0]} castShadow><meshStandardMaterial {...woodMaterial} /></Cylinder>

              {/* Fabric Cover */}
              <Cylinder args={[0.1, 1, 1.8, 32, 1, true]} position={[0, 0.9, 0]} castShadow receiveShadow>
                <meshStandardMaterial {...fabricMaterial} side={2} />
              </Cylinder>

              {/* Floor Cushion */}
              <Cylinder args={[0.9, 0.9, 0.1, 32]} position={[0, 0.05, 0]} receiveShadow>
                <meshStandardMaterial {...yellowMaterial} />
              </Cylinder>
            </group>
          </Furniture>

          {/* Toy Blocks (Replaces Ottoman) */}
          <Furniture initialPosition={[-1.5, 0.15, 3]} name="Blocks" setHoveredFurniture={setHoveredFurniture} setIsDragging={setIsDragging}>
            <group>
              <Box args={[0.3, 0.3, 0.3]} position={[0, 0, 0]} rotation={[0, 0.2, 0]} castShadow><meshStandardMaterial {...blueMaterial} /></Box>
              <Box args={[0.3, 0.3, 0.3]} position={[0.2, 0.3, 0.1]} rotation={[0.1, 0.1, 0.1]} castShadow><meshStandardMaterial {...yellowMaterial} /></Box>
              <Box args={[0.3, 0.3, 0.3]} position={[-0.2, 0, 0.4]} rotation={[0, -0.2, 0]} castShadow><meshStandardMaterial {...greenMaterial} /></Box>
            </group>
          </Furniture>

          {/* Low Cabinet / Toy Storage (Replaces TV Stand) */}
          <Furniture initialPosition={[0, 0.4, -4.5]} name="Toy Storage" setHoveredFurniture={setHoveredFurniture} setIsDragging={setIsDragging}>
            <group>
              <Box args={[4, 0.8, 0.8]} castShadow receiveShadow>
                <meshStandardMaterial {...whiteMaterial} />
              </Box>
              {/* Drawers */}
              <Box args={[0.8, 0.6, 0.05]} position={[-1.2, 0, 0.4]}><meshStandardMaterial {...blueMaterial} /></Box>
              <Box args={[0.8, 0.6, 0.05]} position={[0, 0, 0.4]}><meshStandardMaterial {...yellowMaterial} /></Box>
              <Box args={[0.8, 0.6, 0.05]} position={[1.2, 0, 0.4]}><meshStandardMaterial {...fabricMaterial} /></Box>
            </group>
          </Furniture>
        </group>
      </Selection>
    </>
  );
}
