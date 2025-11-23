import React, { useState, useEffect } from 'react';

const CircadianClock = ({ setLampIntensity, setLampHue, isRunning, setIsRunning, time, setTime }) => {
  // const [time, setTime] = useState(7 * 60); // Lifted to App.jsx
  // const [isRunning, setIsRunning] = useState(true); // Lifted to App.jsx
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
    updateLights(time);
  }, [time]);

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
      position: 'absolute',
      bottom: '30px',
      left: '30px',
      width: '220px',
      boxSizing: 'border-box',
      background: 'rgba(20, 20, 20, 0.9)',
      color: 'white',
      padding: '20px',
      borderRadius: '24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '15px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      zIndex: 100,
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
    }}>
      {/* Analog Clock Face */}
      <div style={{
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        background: 'white',
        position: 'relative',
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2)',
        border: '4px solid #333'
      }}>
        {/* Clock Markers */}
        {[...Array(12)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '2px',
            height: '10px',
            background: '#333',
            transform: `translate(-50%, -50%) rotate(${i * 30}deg) translate(0, -50px)`
          }} />
        ))}

        {/* Hour Hand */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '4px',
          height: '35px',
          background: '#000',
          borderRadius: '2px',
          transformOrigin: 'bottom center',
          transform: `translate(-50%, -100%) rotate(${hourRotation}deg)`
        }} />

        {/* Minute Hand */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '2px',
          height: '45px',
          background: '#555',
          borderRadius: '1px',
          transformOrigin: 'bottom center',
          transform: `translate(-50%, -100%) rotate(${minuteRotation}deg)`
        }} />

        {/* Center Dot */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '8px',
          height: '8px',
          background: '#e74c3c',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)'
        }} />
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1rem', fontWeight: '600', color: '#fff' }}>
          {getPhaseLabel(time).main}
        </div>
        <div style={{ fontSize: '0.8rem', color: '#ccc', marginTop: '2px' }}>
          {getPhaseLabel(time).sub}
        </div>
        <div style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '4px' }}>
          {Math.floor(time / 60) % 12 === 0 ? 12 : Math.floor(time / 60) % 12}:{String(time % 60).padStart(2, '0')} {time >= 720 ? 'PM' : 'AM'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
        <button
          onClick={() => setIsRunning(!isRunning)}
          style={{
            background: isRunning ? '#ff4444' : '#44ff44',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isRunning ? 'white' : 'black',
            fontSize: '1.2rem',
            transition: 'transform 0.1s'
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <span style={{ paddingLeft: isRunning ? '0' : '4px' }}>{isRunning ? '⏸' : '▶'}</span>
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: '#888', marginBottom: '2px' }}>SPEED</span>
          <input
            type="range"
            min="1"
            max="100"
            value={speed}
            onChange={(e) => setSpeed(parseInt(e.target.value))}
            style={{ width: '80px', accentColor: '#667eea' }}
            title="Simulation Speed"
          />
        </div>
      </div>
    </div>
  );
};

export default CircadianClock;
