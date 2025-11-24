import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality, Type } from '@google/genai';
import { createPcmBlob, decodeAudioData } from '../utils/audioUtils';

const detectSymptomFunction = {
    name: 'detectSymptom',
    description: 'Update the patient\'s detected symptom based on their voice and description.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            symptom: {
                type: Type.STRING,
                enum: [
                    'anxiety',
                    'painRelief',
                    'painTolerance',
                    'depression',
                    'stress',
                    'fatigue',
                    'distress',
                    'normal'
                ],
                description: 'The detected symptom of the patient.',
            },
        },
        required: ['symptom'],
    },
};

const NurseVoiceChat = ({ setActiveSymptom }) => {
    const [isActive, setIsActive] = useState(false);
    const [error, setError] = useState(null);

    // Audio Context Refs
    const inputAudioContextRef = useRef(null);
    const outputAudioContextRef = useRef(null);
    const scriptProcessorRef = useRef(null);
    const streamRef = useRef(null);
    const sourceRef = useRef(null);

    // Audio Playback Queue Refs
    const nextStartTimeRef = useRef(0);
    const scheduledSourcesRef = useRef(new Set());

    // Gemini Session Refs
    const sessionPromiseRef = useRef(null);

    // Initialize Audio Contexts
    const ensureAudioContexts = () => {
        if (!inputAudioContextRef.current) {
            inputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
        }
        if (!outputAudioContextRef.current) {
            outputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
        }
    };

    const stopAudio = useCallback(() => {
        // Stop microphone
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        // Disconnect script processor
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }

        // Stop all playing audio
        scheduledSourcesRef.current.forEach(source => {
            try { source.stop(); } catch (e) { }
        });
        scheduledSourcesRef.current.clear();
        nextStartTimeRef.current = 0;

        // Close input context to release mic lock
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close().then(() => {
                inputAudioContextRef.current = null;
            });
        }

        setIsActive(false);
    }, []);

    const startSession = async () => {
        setError(null);
        ensureAudioContexts();

        // Resume contexts if suspended (browser policy)
        if (inputAudioContextRef.current?.state === 'suspended') {
            await inputAudioContextRef.current.resume();
        }
        if (outputAudioContextRef.current?.state === 'suspended') {
            await outputAudioContextRef.current.resume();
        }

        try {
            // 1. Get Microphone Stream
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // 2. Initialize Gemini Client
            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY });

            // 3. Connect to Live API
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    systemInstruction: `You are a professional, compassionate, and observant nurse. 
          Your goal is to check in on the patient's well-being.
          IMMEDIATELY upon starting the conversation, say exactly: "Hi, I'm your nurse, how are you feeling today?" in a warm voice.
          As you listen to the user, analyze their voice tone and word choice.
          Use the 'detectSymptom' tool to update the dashboard if you detect one of the following symptoms: anxiety, painRelief, painTolerance, depression, stress, fatigue, distress, normal.
          Keep your responses concise, empathetic, and supportive.`,
                    tools: [{ functionDeclarations: [detectSymptomFunction] }],
                },
                callbacks: {
                    onopen: () => {
                        console.log("Gemini Live Session Opened");
                        setIsActive(true);

                        // Start Audio Capture Loop
                        if (!inputAudioContextRef.current || !streamRef.current) return;

                        const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
                        sourceRef.current = source;

                        // ScriptProcessor for raw PCM access (bufferSize, inputChannels, outputChannels)
                        const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = processor;

                        processor.onaudioprocess = (e) => {
                            const inputData = e.inputBuffer.getChannelData(0);

                            // Send to Gemini
                            const pcmBlob = createPcmBlob(inputData);
                            if (sessionPromiseRef.current) {
                                sessionPromiseRef.current.then(session => {
                                    session.sendRealtimeInput({ media: pcmBlob });
                                });
                            }
                        };

                        source.connect(processor);
                        processor.connect(inputAudioContextRef.current.destination);

                        // Send initial text trigger to make the model speak first
                        setTimeout(() => {
                            if (sessionPromiseRef.current) {
                                sessionPromiseRef.current.then(session => {
                                    // Send text trigger using sendClientContent
                                    session.sendClientContent({
                                        turns: [{ role: "user", parts: [{ text: "Start" }] }],
                                        turnComplete: true
                                    });
                                });
                            }
                        }, 500);
                    },
                    onmessage: async (message) => {
                        // Handle Tool Calls
                        if (message.toolCall) {
                            for (const fc of message.toolCall.functionCalls) {
                                if (fc.name === 'detectSymptom') {
                                    const symptom = fc.args.symptom;
                                    if (symptom) {
                                        setActiveSymptom(symptom);
                                    }
                                    // Send response back to acknowledge
                                    if (sessionPromiseRef.current) {
                                        sessionPromiseRef.current.then(session => {
                                            session.sendToolResponse({
                                                functionResponses: {
                                                    id: fc.id,
                                                    name: fc.name,
                                                    response: { result: "Symptom detected and updated" }
                                                }
                                            });
                                        });
                                    }
                                }
                            }
                        }

                        // Handle Audio Response
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContextRef.current) {
                            const ctx = outputAudioContextRef.current;
                            const audioBuffer = await decodeAudioData(base64Audio, ctx);

                            // Gapless Playback Logic
                            // If nextStartTime is in the past, reset it to current time to play immediately
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);

                            const source = ctx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(ctx.destination);

                            source.start(nextStartTimeRef.current);
                            scheduledSourcesRef.current.add(source);

                            source.onended = () => {
                                scheduledSourcesRef.current.delete(source);
                            };

                            // Increment time for next chunk
                            nextStartTimeRef.current += audioBuffer.duration;
                        }
                    },
                    onclose: () => {
                        console.log("Session Closed");
                        setIsActive(false);
                    },
                    onerror: (err) => {
                        console.error("Session Error", err);
                        setError("Connection failed.");
                        stopAudio();
                    }
                }
            });

            sessionPromiseRef.current = sessionPromise;

        } catch (e) {
            console.error(e);
            setError(e.message || "Failed to start audio session");
            stopAudio();
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopAudio();
            if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then(session => session.close());
            }
        };
    }, [stopAudio]);

    return (
        <div style={{
            width: '220px',
            background: 'rgba(20, 20, 20, 0.7)',
            color: 'white',
            padding: '20px',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxSizing: 'border-box',
            fontFamily: 'sans-serif',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '15px'
        }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', borderBottom: '1px solid #444', paddingBottom: '10px', width: '100%', textAlign: 'center' }}>
                Nurse AI
            </h3>

            <button
                onClick={isActive ? stopAudio : startSession}
                style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    border: 'none',
                    background: isActive ? '#ef4444' : '#3b82f6',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: isActive ? '0 0 15px rgba(239, 68, 68, 0.5)' : '0 0 15px rgba(59, 130, 246, 0.5)'
                }}
            >
                {isActive ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '30px', height: '30px' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '30px', height: '30px' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                    </svg>
                )}
            </button>

            <div style={{ textAlign: 'center', fontSize: '0.9rem', color: '#ccc' }}>
                {isActive ? 'Listening...' : 'Tap to talk to Nurse'}
            </div>

            {error && (
                <div style={{ color: '#ef4444', fontSize: '0.8rem', textAlign: 'center' }}>
                    {error}
                </div>
            )}
        </div>
    );
};

export default NurseVoiceChat;
