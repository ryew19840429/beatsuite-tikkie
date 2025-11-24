import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './components/Scene';
import { Overlay } from './components/Overlay';

import MusicGenerator from './components/MusicGenerator';

import CircadianClock from './components/CircadianClock';
import SymptomExplanation from './components/SymptomExplanation';
import NurseVoiceChat from './components/NurseVoiceChat';

function App() {
  const [lampIntensity, setLampIntensity] = useState(1);
  const [lampHue, setLampHue] = useState(30); // Default warm orange
  const [hoveredFurniture, setHoveredFurniture] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isClockRunning, setIsClockRunning] = useState(true);
  const [time, setTime] = useState(7 * 60); // Start at 7:00 AM
  const [activeSymptom, setActiveSymptom] = useState('normal');

  return (
    <>

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

      {/* Left side: Nurse AI and Overlay */}
      <div style={{
        position: 'absolute',
        top: '30px',
        left: '30px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        zIndex: 1000,
        alignItems: 'flex-start'
      }}>
        <NurseVoiceChat setActiveSymptom={setActiveSymptom} />

        <Overlay
          lampIntensity={lampIntensity}
          setLampIntensity={setLampIntensity}
          lampHue={lampHue}
          setLampHue={setLampHue}
          hoveredFurniture={hoveredFurniture}
        />
      </div>

      {/* Right side: Music Generator and Symptom Explanation */}
      <div style={{
        position: 'absolute',
        top: '30px',
        right: '30px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        zIndex: 1000,
        alignItems: 'flex-end'
      }}>
        <MusicGenerator
          setLampIntensity={setLampIntensity}
          setLampHue={setLampHue}
          setIsClockRunning={setIsClockRunning}
          activeSymptom={activeSymptom}
          setActiveSymptom={setActiveSymptom}
        />

        <SymptomExplanation activeSymptom={activeSymptom} />
      </div>
    </>
  );
}

export default App;
