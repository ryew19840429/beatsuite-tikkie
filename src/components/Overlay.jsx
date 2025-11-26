import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Overlay({ brightness, setBrightness, isSwinging, setIsSwinging, lampIntensity, setLampIntensity, lampHue, setLampHue, hoveredFurniture }) {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        let rafId = null;
        let lastMousePos = { x: 0, y: 0 };

        const handleMouseMove = (e) => {
            lastMousePos = { x: e.clientX, y: e.clientY };

            if (!rafId) {
                rafId = requestAnimationFrame(() => {
                    setMousePos(lastMousePos);
                    rafId = null;
                });
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, []);
    return (
        <>
            <div
                style={{
                    width: '240px',
                    boxSizing: 'border-box',
                    pointerEvents: 'auto',
                    background: 'var(--color-surface)',
                    padding: '16px',
                    borderRadius: 'var(--radius-lg)',
                    border: '2px solid white',
                    boxShadow: 'var(--shadow-card)',
                    fontFamily: 'var(--font-family)'
                }}
            >

                <div className="control-group">
                    <label style={{ color: 'var(--color-text-secondary)', marginBottom: '6px', display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.5px' }}>
                        INTENSITY
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1rem' }}>💡</span>
                        <input
                            type="range"
                            min="0"
                            max="3"
                            step="0.1"
                            value={lampIntensity}
                            onChange={(e) => setLampIntensity(parseFloat(e.target.value))}
                            style={{
                                flex: 1,
                                accentColor: 'var(--color-primary)',
                                cursor: 'pointer',
                                width: '100%',
                                height: '4px',
                                borderRadius: '2px',
                                background: 'var(--color-background)'
                            }}
                        />
                        <span style={{ fontSize: '1rem' }}>🔥</span>
                    </div>
                </div>

                <div className="control-group" style={{ marginTop: '1rem' }}>
                    <label style={{ color: 'var(--color-text-secondary)', marginBottom: '6px', display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.5px' }}>
                        COLOR
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: `hsl(${lampHue}, 100%, 50%)`,
                            border: '2px solid white',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                            flexShrink: 0
                        }} />
                        <input
                            type="range"
                            min="0"
                            max="360"
                            value={lampHue}
                            onChange={(e) => setLampHue(parseFloat(e.target.value))}
                            style={{
                                flex: 1,
                                accentColor: 'var(--color-primary)',
                                cursor: 'pointer',
                                background: 'linear-gradient(to right, #FF8080, #FFB74D, #FFF176, #81C784, #4FC3F7, #7986CB, #BA68C8, #FF8080)',
                                appearance: 'none',
                                height: '6px',
                                borderRadius: '3px',
                                width: '100%'
                            }}
                        />
                    </div>
                </div>


            </div>

            {/* Tooltip */}
            {hoveredFurniture && (
                <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    style={{
                        position: 'fixed',
                        left: `${mousePos.x + 20}px`,
                        top: `${mousePos.y + 20}px`,
                        background: 'var(--color-surface)',
                        color: 'var(--color-text-main)',
                        padding: '10px 20px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        pointerEvents: 'none',
                        boxShadow: 'var(--shadow-soft)',
                        zIndex: 100,
                        whiteSpace: 'nowrap',
                        border: '2px solid white'
                    }}
                >
                    {hoveredFurniture}
                </motion.div>
            )}
        </>
    );
}
