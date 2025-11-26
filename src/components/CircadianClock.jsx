import React, { useState, useEffect } from 'react';

const CircadianClock = ({ setLampIntensity, setLampHue, isRunning, setIsRunning, time, setTime }) => {
  const [speed, setSpeed] = useState(100); // Multiplier for speed

  useEffect(() => {
    let intervalId;
    if (isRunning) {
      intervalId = setInterval(() => {
        setTime(prevTime => {
          const newTime = (prevTime + 1) % 1440; // 1440 minutes in a day
          return newTime;
        });
      }, 1000 / speed); // Update rate based on speed
    }
    return () => clearInterval(intervalId);
  }, [isRunning, speed]);

  useEffect(() => {
    if (isRunning) {
      updateLights(time);
    }
  }, [time, isRunning]);

  const updateLights = (currentTime) => {
    const hour = currentTime / 60;

    if (hour >= 7 && hour < 12) {
      // Morning (7 AM - 12 PM): Intensity 3.0 (Cool White)
      if (setLampIntensity) setLampIntensity(3.0);
      if (setLampHue) setLampHue(210);
    } else if (hour >= 12 && hour < 17) {
      // Afternoon (12 PM - 5 PM): Intensity 2.0 (Natural White)
      if (setLampIntensity) setLampIntensity(2.0);
      if (setLampHue) setLampHue(50);
    } else if (hour >= 17 && hour < 20) {
      // Evening (5 PM - 8 PM): Intensity 1.0 (Warm Amber)
      if (setLampIntensity) setLampIntensity(1.0);
      if (setLampHue) setLampHue(30);
    } else {
      // Night (8 PM - 7 AM): Intensity 0.1 (Red)
      if (setLampIntensity) setLampIntensity(0.0);
      if (setLampHue) setLampHue(0);
    }
  };

  const getPhaseLabel = (minutes) => {
    const hour = minutes / 60;
    if (hour >= 7 && hour < 12) return { main: "Morning", sub: "(Acrophase)" };
    if (hour >= 12 && hour < 17) return { main: "Afternoon", sub: "(Interdaily Stability)" };
    if (hour >= 17 && hour < 20) return { main: "Evening", sub: "(Homeostatic Drive to Sleep)" };
    return { main: "Night", sub: "(Rest)" };
  };

  // Calculate rotations
  const minuteRotation = (time % 60) * 6; // 360deg / 60min = 6deg/min
  const hourRotation = (time % 720) * 0.5; // 360deg / 720min (12h) = 0.5deg/min

  return (
    <div style={{
      width: '240px',
      boxSizing: 'border-box',
      background: 'var(--color-surface)',
      color: 'var(--color-text-main)',
      padding: '16px',
      borderRadius: 'var(--radius-lg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px',
      border: '2px solid white',
      zIndex: 100,
      boxShadow: 'var(--shadow-card)',
      fontFamily: 'var(--font-family)'
    }}>
      {/* Analog Clock Face */}
      <div style={{
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        background: 'white',
        position: 'relative',
        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.05)',
        border: '4px solid var(--color-background)'
      }}>
        {/* Clock Markers */}
        {[...Array(12)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '3px',
            height: '8px',
            background: 'var(--color-text-secondary)',
            borderRadius: '2px',
            transform: `translate(-50%, -50%) rotate(${i * 30}deg) translate(0, -42px)`
          }} />
        ))}

        {/* Hour Hand */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '5px',
          height: '28px',
          background: 'var(--color-text-main)',
          borderRadius: '3px',
          transformOrigin: 'bottom center',
          transform: `translate(-50%, -100%) rotate(${hourRotation}deg)`,
          zIndex: 2
        }} />

        {/* Minute Hand */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '3px',
          height: '38px',
          background: 'var(--color-primary)',
          borderRadius: '2px',
          transformOrigin: 'bottom center',
          transform: `translate(-50%, -100%) rotate(${minuteRotation}deg)`,
          zIndex: 1
        }} />

        {/* Center Dot */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '10px',
          height: '10px',
          background: 'var(--color-secondary)',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 3,
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
        }} />
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--color-primary)' }}>
          {getPhaseLabel(time).main}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '2px', fontWeight: 500 }}>
          {getPhaseLabel(time).sub}
        </div>
        <div style={{
          fontSize: '1.2rem',
          color: 'var(--color-text-main)',
          marginTop: '6px',
          fontFamily: 'monospace',
          fontWeight: 700,
          background: 'var(--color-background)',
          padding: '4px 10px',
          borderRadius: '6px'
        }}>
          {Math.floor(time / 60) % 12 === 0 ? 12 : Math.floor(time / 60) % 12}:{String(time % 60).padStart(2, '0')} {time >= 720 ? 'PM' : 'AM'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', width: '100%', justifyContent: 'center' }}>
        <button
          onClick={() => setIsRunning(!isRunning)}
          style={{
            background: isRunning ? '#FF8080' : 'var(--color-primary)',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '1rem',
            transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: isRunning ? '0 4px 12px rgba(255, 128, 128, 0.4)' : 'var(--shadow-soft)'
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <span style={{ paddingLeft: isRunning ? '0' : '4px' }}>{isRunning ? '⏸' : '▶'}</span>
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', marginBottom: '4px', fontWeight: 700, letterSpacing: '0.5px' }}>SPEED</span>
          <input
            type="range"
            min="1"
            max="100"
            value={speed}
            onChange={(e) => setSpeed(parseInt(e.target.value))}
            style={{
              width: '100%',
              accentColor: 'var(--color-primary)',
              cursor: 'pointer',
              height: '4px',
              borderRadius: '2px',
              background: 'var(--color-background)'
            }}
            title="Simulation Speed"
          />
        </div>
      </div>
    </div>
  );
};

export default CircadianClock;
