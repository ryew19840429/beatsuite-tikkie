import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";

// Import Icons
import iconScared from '../assets/icons/scared.png';
import iconFeelBetter from '../assets/icons/feel_better.png';
import iconBrave from '../assets/icons/brave.png';
import iconSad from '../assets/icons/sad.png';
import iconWorry from '../assets/icons/worry.png';
import iconTired from '../assets/icons/tired.png';
import iconNervous from '../assets/icons/nervous.png';
import iconHappy from '../assets/icons/happy.png';

const SYMPTOMS = {
    anxiety: {
        label: "Scared",
        bpm: 70,
        prompt: "Generate a gentle lullaby in a Major (Ionian) or Pentatonic scale to create a sense of safety. Set tempo to 60–80 BPM with a steady, rocking rhythm and low, controlled volume. Feature warm, acoustic instruments like harp, celesta, or soft piano. Avoid dissonance or sudden loud noises; create a 'musical blanket' of security.",
        lampIntensity: 0.5,
        lampHue: 35,
        color: '#E0BBE4', // Pastel Purple
        icon: iconScared
    },
    painRelief: {
        label: "Ouchie",
        bpm: 60,
        prompt: "Create soothing instrumental music in Mixolydian or Major mode to induce a dreamy, floating quality. Use a slow tempo (60 BPM) with constant, low dynamics and no percussion. Incorporate long, sustained notes (pad textures) to mimic deep sleep or ocean waves, helping the child drift away from pain.",
        lampIntensity: 0.0,
        lampHue: 0,
        color: '#957DAD', // Pastel Violet
        icon: iconFeelBetter
    },
    painTolerance: {
        label: "Check-up",
        bpm: 110,
        prompt: "Generate an engaging musical story that modulates between keys to keep the child cognitively distracted. Shift styles from a slow intro to an upbeat march and back. Use varied rhythms and playful instruments like xylophone, flute, or pizzicato strings to occupy attention during the procedure.",
        lampIntensity: 1.0,
        lampHue: 45,
        color: '#D291BC', // Pastel Pink
        icon: iconBrave
    },
    depression: {
        label: "Sad",
        bpm: 105,
        prompt: "Generate bright, energetic pop music in a Major (Ionian) key to evoke feelings of happiness and triumph. Use a moderate tempo (100-110 BPM) with a bouncy, syncopated rhythm. Incorporate heroic orchestration (brass, drums) or a 'Disney-style' feel to stimulate emotional expression and joy.",
        lampIntensity: 3.0,
        lampHue: 210,
        color: '#FEC8D8', // Pastel Rose
        icon: iconSad
    },
    stress: {
        label: "Worry",
        bpm: 65,
        prompt: "Create simple, meditative music at 60–70 BPM using a Pentatonic scale to ensure zero tension or dissonance. Combine nature sounds (gentle rain or stream) with a simple, repetitive melody on a wooden flute or soft synth to help entrain the child's breathing and lower heart rate.",
        lampIntensity: 1.5,
        lampHue: 55,
        color: '#FFDFD3', // Pastel Peach
        icon: iconWorry
    },
    fatigue: {
        label: "Tired",
        bpm: 120,
        prompt: "Generate motivating dance music in Major (Ionian) or Dorian mode for a fun, groovy feel. Set tempo to 120 BPM with a strong, driving beat and bright dynamics. Use percussive textures (shakers, claps) and a 'call and response' structure to encourage physical movement and active play.",
        lampIntensity: 3.0,
        lampHue: 220,
        color: '#F0E68C', // Khaki/Yellow
        icon: iconTired
    },
    distress: {
        label: "Nervous",
        bpm: 110,
        prompt: "Generate a confident, rhythmic track in Major key with a strong pulse to provide predictability. Use a steady marching beat with clear structure (verse/chorus). Instruments: Snare drum, brass, and piano to empower the child and provide a sense of control.",
        lampIntensity: 1.0,
        lampHue: 40,
        color: '#ADD8E6', // Light Blue
        icon: iconNervous
    },
    normal: {
        label: "Happy",
        bpm: 90,
        prompt: "Generate balanced, pleasant background music in a Major key. Moderate tempo (90 BPM) with a steady rhythm. Use a mix of acoustic and electronic instruments for a modern, neutral feel suitable for everyday activity.",
        lampIntensity: 2.0,
        lampHue: 50,
        color: '#98FB98', // Pale Green
        icon: iconHappy
    }
};

const MusicGenerator = ({ setLampIntensity, setLampHue, setIsClockRunning, activeSymptom, setActiveSymptom }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [status, setStatus] = useState('Ready');

    const audioContextRef = useRef(null);
    const sessionRef = useRef(null);
    const nextStartTimeRef = useRef(0);
    const clientRef = useRef(null);

    const stopMusic = () => {
        if (sessionRef.current) {
            try {
                sessionRef.current.stop();
            } catch (e) {
                console.warn("Error stopping session:", e);
            }
            sessionRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        setIsPlaying(false);
        setStatus('Stopped');
    };

    useEffect(() => {
        // Initialize GoogleGenAI client
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (apiKey) {
            clientRef.current = new GoogleGenAI({ apiKey, apiVersion: "v1alpha" });
        } else {
            setStatus('Error: VITE_GEMINI_API_KEY not found');
        }

        return () => {
            stopMusic();
        };
    }, []);

    const updateSession = async (symptomKey, shouldReset = false) => {
        if (!sessionRef.current) return;
        const symptom = SYMPTOMS[symptomKey];

        try {
            // Update Prompts
            await sessionRef.current.setWeightedPrompts({
                weightedPrompts: [{ text: symptom.prompt, weight: 1.0 }]
            });

            // Update Config (Tempo)
            await sessionRef.current.setMusicGenerationConfig({
                musicGenerationConfig: {
                    bpm: symptom.bpm,
                    temperature: 1.0,
                }
            });


            if (shouldReset) {
                // Note: resetContext() is synchronous in some versions or async in others? 
                // The d.ts said "resetContext(): void", implying sync.
                // But let's wrap in try/catch just in case.
                sessionRef.current.resetContext();
            }

        } catch (error) {
            console.error("Error updating session:", error);
        }
    };

    const handleSymptomClick = (key) => {
        setActiveSymptom(key);
    };

    const playAudioChunk = (base64Data) => {
        if (!audioContextRef.current) return;

        const binaryString = window.atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // PCM16 to Float32
        const int16Data = new Int16Array(bytes.buffer);
        const float32Data = new Float32Array(int16Data.length);
        for (let i = 0; i < int16Data.length; i++) {
            float32Data[i] = int16Data[i] / 32768.0;
        }

        const buffer = audioContextRef.current.createBuffer(1, float32Data.length, 44100);
        buffer.copyToChannel(float32Data, 0);

        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);

        const now = audioContextRef.current.currentTime;
        // Schedule next chunk
        const startTime = Math.max(now, nextStartTimeRef.current);
        source.start(startTime);
        nextStartTimeRef.current = startTime + buffer.duration;
    };

    const startMusic = async (initialSymptomKey = activeSymptom) => {
        if (isPlaying && sessionRef.current) return; // Already playing

        if (!clientRef.current) {
            alert("API Key missing");
            return;
        }

        try {
            setStatus('Connecting...');
            setStatus('Connecting...');
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 44100 });
            nextStartTimeRef.current = audioContextRef.current.currentTime + 0.1;

            sessionRef.current = await clientRef.current.live.music.connect({
                model: "models/lyria-realtime-exp",
                callbacks: {
                    onmessage: (message) => {
                        if (message.serverContent?.audioChunks) {
                            for (const chunk of message.serverContent.audioChunks) {
                                playAudioChunk(chunk.data);
                            }
                        }
                    },
                    onerror: (error) => {
                        console.error("Session error:", error);
                        setStatus('Error: ' + error.message);
                        setIsPlaying(false);
                    },
                    onclose: (event) => {
                        console.log("Session closed", event);
                        setStatus('Stopped');
                        setIsPlaying(false);
                    },
                },
            });

            setStatus('Playing');
            setIsPlaying(true);

            // Initial setup
            await updateSession(initialSymptomKey);

            await sessionRef.current.play();

        } catch (error) {
            console.error("Connection failed:", error);
            setStatus('Connection Failed: ' + error.message);
            setIsPlaying(false);
        }
    };

    const isInitialMount = useRef(true);

    useEffect(() => {
        // Skip the effect on initial mount
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const key = activeSymptom;
        if (!key) return;

        if (key === 'normal') {
            stopMusic();
            if (setIsClockRunning) setIsClockRunning(true);
            return;
        }

        // For other symptoms: Stop clock to avoid lighting conflict
        if (setIsClockRunning) setIsClockRunning(false);

        // Set Lighting
        const symptom = SYMPTOMS[key];
        if (symptom) {
            if (setLampIntensity) setLampIntensity(symptom.lampIntensity);
            if (setLampHue) setLampHue(symptom.lampHue);
        }

        if (isPlaying) {
            stopMusic();
            // Small delay to ensure cleanup
            setTimeout(() => {
                startMusic(key);
            }, 500);
        } else {
            startMusic(key);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSymptom]);

    return (
        <div style={{
            padding: '24px',
            background: 'var(--color-surface)',
            color: 'var(--color-text-main)',
            borderRadius: '32px',
            boxSizing: 'border-box',
            width: '360px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            border: '4px solid white',
            fontFamily: "'Comic Sans MS', 'Chalkboard SE', sans-serif"
        }}>
            <h2 style={{
                margin: '0 0 24px 0',
                fontSize: '1.5rem',
                fontWeight: 800,
                color: 'var(--color-primary)',
                textAlign: 'center',
                textShadow: '1px 1px 0px rgba(0,0,0,0.1)'
            }}>
                How are you feeling?
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                {Object.entries(SYMPTOMS)
                    .filter(([key]) => key !== 'painTolerance') // Hide Check-up
                    .map(([key, data]) => (
                        <button
                            key={key}
                            onClick={() => handleSymptomClick(key)}
                            style={{
                                padding: '8px',
                                background: data.color,
                                color: '#333', // Dark text for contrast on pastel
                                border: activeSymptom === key ? '4px solid #fff' : '4px solid white',
                                borderRadius: '20px',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                fontWeight: 700,
                                textAlign: 'center',
                                transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Bouncy transition
                                boxShadow: activeSymptom === key
                                    ? '0 6px 0 rgba(0,0,0,0.15), 0 8px 8px rgba(0,0,0,0.1)'
                                    : '0 3px 0 rgba(0,0,0,0.1)',
                                transform: activeSymptom === key ? 'translateY(2px)' : 'translateY(0)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                height: '85px',
                                gridColumn: key === 'normal' ? 'span 3' : 'auto'
                            }}
                        >
                            <img src={data.icon} alt={data.label} style={{ width: '36px', height: '36px', objectFit: 'contain', borderRadius: '50%' }} />
                            <span>{data.label}</span>
                        </button>
                    ))}
            </div>

            {activeSymptom !== 'normal' && isPlaying && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                        onClick={() => {
                            stopMusic();
                            setActiveSymptom('normal');
                            if (setIsClockRunning) setIsClockRunning(true);
                        }}
                        style={{
                            padding: '12px 24px',
                            background: '#FF8080',
                            color: 'white',
                            border: '3px solid white',
                            borderRadius: '50px',
                            cursor: 'pointer',
                            fontWeight: '800',
                            fontSize: '1rem',
                            flex: 1,
                            boxShadow: '0 4px 0 rgba(0,0,0,0.1)',
                            transition: 'transform 0.2s',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}
                    >
                        Stop Music
                    </button>
                </div>
            )}
            <div style={{ marginTop: '16px', fontSize: '0.8rem', color: '#888', textAlign: 'center', fontWeight: 600 }}>
                Status: {status}
            </div>
        </div>
    );
};

export default MusicGenerator;
