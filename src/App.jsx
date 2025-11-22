import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './components/Scene';
import { Overlay } from './components/Overlay';
import { ChatInterface } from './components/ChatInterface';
import MusicGenerator from './components/MusicGenerator';

import CircadianClock from './components/CircadianClock';

function App() {
  const [lampIntensity, setLampIntensity] = useState(1);
  const [lampHue, setLampHue] = useState(30); // Default warm orange
  const [hoveredFurniture, setHoveredFurniture] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isClockRunning, setIsClockRunning] = useState(true);
  const [time, setTime] = useState(7 * 60); // Start at 7:00 AM

  return (
    <>
      <MusicGenerator
        setLampIntensity={setLampIntensity}
        setLampHue={setLampHue}
        setIsClockRunning={setIsClockRunning}
      />
      <CircadianClock
        setLampIntensity={setLampIntensity}
        setLampHue={setLampHue}
        isRunning={isClockRunning}
        setIsRunning={setIsClockRunning}
        time={time}
        setTime={setTime}
      />
      <Canvas
        shadows
        camera={{ position: [0, 2, 8], fov: 50 }}
        style={{ background: '#050505' }}
      >
        <Suspense fallback={null}>
          <Scene
            lampIntensity={lampIntensity}
            lampHue={lampHue}
            setHoveredFurniture={setHoveredFurniture}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
            time={time}
          />
        </Suspense>
      </Canvas>

      <Overlay
        lampIntensity={lampIntensity}
        setLampIntensity={setLampIntensity}
        lampHue={lampHue}
        setLampHue={setLampHue}
        hoveredFurniture={hoveredFurniture}
      />

      <ChatInterface
        setLampIntensity={setLampIntensity}
        setLampHue={setLampHue}
      />
    </>
  );
}

export default App;
