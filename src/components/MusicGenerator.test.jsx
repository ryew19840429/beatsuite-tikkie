import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MusicGenerator from './MusicGenerator';

// Mock GoogleGenAI
vi.mock('@google/genai', () => {
    return {
        GoogleGenAI: class {
            constructor() {
                this.live = {
                    music: {
                        connect: vi.fn().mockResolvedValue({
                            setWeightedPrompts: vi.fn(),
                            setMusicGenerationConfig: vi.fn(),
                            resetContext: vi.fn(),
                            play: vi.fn(),
                            stop: vi.fn(),
                        })
                    }
                };
            }
        }
    };
});

// Mock window.AudioContext
window.AudioContext = class {
    constructor() {
        this.close = vi.fn();
        this.createBuffer = vi.fn();
        this.createBufferSource = vi.fn().mockReturnValue({
            connect: vi.fn(),
            start: vi.fn(),
            stop: vi.fn(),
        });
        this.currentTime = 0;
        this.destination = {};
    }
};

// Mock window.webkitAudioContext
window.webkitAudioContext = window.AudioContext;

describe('MusicGenerator Integration', () => {
    const mockSetLampIntensity = vi.fn();
    const mockSetLampHue = vi.fn();
    const mockSetIsClockRunning = vi.fn();
    const mockSetActiveSymptom = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should update lights and stop clock when a symptom is selected', async () => {
        const { rerender } = render(
            <MusicGenerator
                setLampIntensity={mockSetLampIntensity}
                setLampHue={mockSetLampHue}
                setIsClockRunning={mockSetIsClockRunning}
                activeSymptom="normal"
                setActiveSymptom={mockSetActiveSymptom}
            />
        );

        // Simulate clicking a symptom button (e.g., Anxiety)
        const anxietyButton = screen.getByText('Anxiety & Fear');
        fireEvent.click(anxietyButton);

        // Verify setActiveSymptom was called
        expect(mockSetActiveSymptom).toHaveBeenCalledWith('anxiety');

        // Rerender with the new symptom to simulate parent state update
        rerender(
            <MusicGenerator
                setLampIntensity={mockSetLampIntensity}
                setLampHue={mockSetLampHue}
                setIsClockRunning={mockSetIsClockRunning}
                activeSymptom="anxiety"
                setActiveSymptom={mockSetActiveSymptom}
            />
        );

        // Verify effects
        // 1. Clock should be stopped
        expect(mockSetIsClockRunning).toHaveBeenCalledWith(false);

        // 2. Lights should be updated (Anxiety: Intensity 0.5, Hue 35)
        expect(mockSetLampIntensity).toHaveBeenCalledWith(0.5);
        expect(mockSetLampHue).toHaveBeenCalledWith(35);
    });

    it('should stop music and restart clock when Normal mode is selected', async () => {
        // Start with an active symptom
        const { rerender } = render(
            <MusicGenerator
                setLampIntensity={mockSetLampIntensity}
                setLampHue={mockSetLampHue}
                setIsClockRunning={mockSetIsClockRunning}
                activeSymptom="anxiety"
                setActiveSymptom={mockSetActiveSymptom}
            />
        );

        // Clear mocks from initial render
        vi.clearAllMocks();

        // Simulate clicking Normal button
        const normalButton = screen.getByText('Normal / Relaxed');
        fireEvent.click(normalButton);

        expect(mockSetActiveSymptom).toHaveBeenCalledWith('normal');

        // Rerender with normal symptom
        rerender(
            <MusicGenerator
                setLampIntensity={mockSetLampIntensity}
                setLampHue={mockSetLampHue}
                setIsClockRunning={mockSetIsClockRunning}
                activeSymptom="normal"
                setActiveSymptom={mockSetActiveSymptom}
            />
        );

        // Verify effects
        // 1. Clock should be started
        expect(mockSetIsClockRunning).toHaveBeenCalledWith(true);
    });
});
