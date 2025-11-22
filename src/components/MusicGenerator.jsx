import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";

const SYMPTOMS = {
    anxiety: {
        label: "Anxiety & Fear",
        bpm: 70,
        prompt: "Generate a gentle lullaby in a Major (Ionian) or Pentatonic scale to create a sense of safety. Set tempo to 60–80 BPM with a steady, rocking rhythm and low, controlled volume. Feature warm, acoustic instruments like harp, celesta, or soft piano. Avoid dissonance or sudden loud noises; create a 'musical blanket' of security.",
        lampIntensity: 0.5,
        lampHue: 35
    },
    painRelief: {
        label: "Pain Relief",
        bpm: 60,
        prompt: "Create soothing instrumental music in Mixolydian or Major mode to induce a dreamy, floating quality. Use a slow tempo (60 BPM) with constant, low dynamics and no percussion. Incorporate long, sustained notes (pad textures) to mimic deep sleep or ocean waves, helping the child drift away from pain.",
        lampIntensity: 0.0,
        lampHue: 0
    },
    painTolerance: {
        label: "Pain Tolerance",
        bpm: 110,
        prompt: "Generate an engaging musical story that modulates between keys to keep the child cognitively distracted. Shift styles from a slow intro to an upbeat march and back. Use varied rhythms and playful instruments like xylophone, flute, or pizzicato strings to occupy attention during the procedure.",
        lampIntensity: 1.0,
        lampHue: 45
    },
    depression: {
        label: "Depression / Withdrawal",
        bpm: 105,
        prompt: "Generate bright, energetic pop music in a Major (Ionian) key to evoke feelings of happiness and triumph. Use a moderate tempo (100-110 BPM) with a bouncy, syncopated rhythm. Incorporate heroic orchestration (brass, drums) or a 'Disney-style' feel to stimulate emotional expression and joy.",
        lampIntensity: 3.0,
        lampHue: 210
    },
    stress: {
        label: "Physiological Stress",
        bpm: 65,
        prompt: "Create simple, meditative music at 60–70 BPM using a Pentatonic scale to ensure zero tension or dissonance. Combine nature sounds (gentle rain or stream) with a simple, repetitive melody on a wooden flute or soft synth to help entrain the child's breathing and lower heart rate.",
        lampIntensity: 1.5,
        lampHue: 55
    },
    fatigue: {
        label: "Fatigue",
        bpm: 120,
        prompt: "Generate motivating dance music in Major (Ionian) or Dorian mode for a fun, groovy feel. Set tempo to 120 BPM with a strong, driving beat and bright dynamics. Use percussive textures (shakers, claps) and a 'call and response' structure to encourage physical movement and active play.",
        lampIntensity: 3.0,
        lampHue: 220
    },
    distress: {
        label: "Procedure Distress",
        bpm: 110,
        prompt: "Generate a confident, rhythmic track in Major key with a strong pulse to provide predictability. Use a steady marching beat with clear structure (verse/chorus). Instruments: Snare drum, brass, and piano to empower the child and provide a sense of control.",
        lampIntensity: 1.0,
        lampHue: 40
    },
    normal: {
        label: "Normal / Relaxed",
        bpm: 90,
        prompt: "Generate balanced, pleasant background music in a Major key. Moderate tempo (90 BPM) with a steady rhythm. Use a mix of acoustic and electronic instruments for a modern, neutral feel suitable for everyday activity.",
        lampIntensity: 2.0,
        lampHue: 50
    }
};

const MusicGenerator = ({ setLampIntensity, setLampHue }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [status, setStatus] = useState('Ready');
    const [activeSymptom, setActiveSymptom] = useState('normal'); // Default

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
            console.log("Updating prompt for:", symptom.label);
            await sessionRef.current.setWeightedPrompts({
                weightedPrompts: [{ text: symptom.prompt, weight: 1.0 }]
            });
            console.log("Prompts updated");

            // Update Config (Tempo)
            await sessionRef.current.setMusicGenerationConfig({
                musicGenerationConfig: {
                    bpm: symptom.bpm,
                    temperature: 1.0,
                }
            });
            console.log("Config updated");

            if (shouldReset) {
                console.log("Resetting context...");
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

        // Set Lighting
        const symptom = SYMPTOMS[key];
        if (setLampIntensity) setLampIntensity(symptom.lampIntensity);
        if (setLampHue) setLampHue(symptom.lampHue);

        if (isPlaying) {
            console.log("Restarting session for new symptom...");
            stopMusic();
            // Small delay to ensure cleanup
            setTimeout(() => {
                startMusic(key);
            }, 500);
        } else {
            startMusic(key);
        }
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
            console.log("Initializing AudioContext...");
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 44100 });
            nextStartTimeRef.current = audioContextRef.current.currentTime + 0.1;

            console.log("Connecting to Gemini...");
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
            console.log("Connected. Session:", sessionRef.current);

            setStatus('Playing');
            setIsPlaying(true);

            // Initial setup
            console.log("Setting initial parameters for:", SYMPTOMS[initialSymptomKey].label);
            await updateSession(initialSymptomKey);

            console.log("Starting playback...");
            await sessionRef.current.play();
            console.log("Playback started");

        } catch (error) {
            console.error("Connection failed:", error);
            setStatus('Connection Failed: ' + error.message);
            setIsPlaying(false);
        }
    };

    return (
        <div style={{
            padding: '20px',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            borderRadius: '12px',
            width: '320px',
            position: 'absolute',
            top: '30px',
            right: '30px',
            zIndex: 1000,
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)'
        }}>
            <h2 style={{ margin: '0 0 15px 0', fontSize: '1.2rem' }}>Lyra Music Gen</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                {Object.entries(SYMPTOMS).map(([key, data]) => (
                    <button
                        key={key}
                        onClick={() => handleSymptomClick(key)}
                        style={{
                            padding: '10px',
                            background: activeSymptom === key ? '#44aaff' : 'rgba(255,255,255,0.1)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            textAlign: 'center',
                            transition: 'background 0.2s'
                        }}
                    >
                        {data.label}
                    </button>
                ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                    onClick={() => isPlaying ? stopMusic() : startMusic(activeSymptom)}
                    style={{
                        padding: '10px 16px',
                        background: isPlaying ? '#ff4444' : '#44ff44',
                        color: isPlaying ? 'white' : 'black',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        flex: 1
                    }}
                >
                    {isPlaying ? 'Stop' : 'Start Generation'}
                </button>
            </div>
            <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#aaa', textAlign: 'center' }}>
                Status: {status}
            </div>
        </div>
    );
};

export default MusicGenerator;
