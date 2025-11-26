import React from 'react';

const EXPLANATIONS = {
    anxiety: {
        title: "Anxiety & Fear",
        lighting: "Goal: Safety & Calm. The text links anxiety and sleep disruption. A dim, warm light creates a \"protected period\" that minimizes stimulation to the hippocampus, reducing physiological arousal without total darkness.",
        sound: "Generate a gentle lullaby in a Major (Ionian) or Pentatonic scale to create a sense of safety. Set tempo to 60–80 BPM with a steady, rocking rhythm and low, controlled volume. Feature warm, acoustic instruments like harp, celesta, or soft piano. Avoid dissonance or sudden loud noises; create a 'musical blanket' of security."
    },
    painRelief: {
        title: "Pain Relief",
        lighting: "Goal: Melatonin Production. The document notes melatonin has \"potent anti-inflammatory properties\" which can reduce side effects and pain. Melatonin is only produced in darkness; red light interferes least with this process.",
        sound: "Create soothing instrumental music in Mixolydian or Major mode to induce a dreamy, floating quality. Use a slow tempo (60 BPM) with constant, low dynamics and no percussion. Incorporate long, sustained notes (pad textures) to mimic deep sleep or ocean waves, helping the child drift away from pain."
    },
    painTolerance: {
        title: "Pain Tolerance",
        lighting: "Goal: Comfort. While \"Relief\" seeks biological sedation (darkness), \"Tolerance\" often implies coping while awake. A moderate warm light provides a comforting environment that isn't harsh, helping maintain \"Interdaily Stability\" without overstimulation.",
        sound: "Generate an engaging musical story that modulates between keys to keep the child cognitively distracted. Shift styles from a slow intro to an upbeat march and back. Use varied rhythms and playful instruments like xylophone, flute, or pizzicato strings to occupy attention during the procedure."
    },
    depression: {
        title: "Depression / Withdrawal",
        lighting: "Goal: Mood Lift. The text explicitly links depression with fatigue and cites \"Bright light therapy\" as a standard intervention to treat these clustered symptoms by boosting the circadian amplitude.",
        sound: "Generate bright, energetic pop music in a Major (Ionian) key to evoke feelings of happiness and triumph. Use a moderate tempo (100-110 BPM) with a bouncy, syncopated rhythm. Incorporate heroic orchestration (brass, drums) or a 'Disney-style' feel to stimulate emotional expression and joy."
    },
    stress: {
        title: "Physiological Stress",
        lighting: "Goal: Biological Regulation. \"Physiological Stress\" in the text is linked to circadian dysregulation. A natural, mid-range light helps \"fine-tune\" the body's clock (Zeitgeber) to synchronize with the solar day, reducing internal stress.",
        sound: "Create simple, meditative music at 60–70 BPM using a Pentatonic scale to ensure zero tension or dissonance. Combine nature sounds (gentle rain or stream) with a simple, repetitive melody on a wooden flute or soft synth to help entrain the child's breathing and lower heart rate."
    },
    fatigue: {
        title: "Fatigue",
        lighting: "Goal: Alertness. The study explicitly states that high fatigue is associated with dysregulated rhythms and recommends \"exposure to natural light\" (or bright artificial substitutes) to consolidate wakefulness and reduce daytime sleepiness.",
        sound: "Generate motivating dance music in Major (Ionian) or Dorian mode for a fun, groovy feel. Set tempo to 120 BPM with a strong, driving beat and bright dynamics. Use percussive textures (shakers, claps) and a 'call and response' structure to encourage physical movement and active play."
    },
    distress: {
        title: "Procedure Distress",
        lighting: "Goal: Soothing Environment. Similar to anxiety, distress is reduced by minimizing harsh sensory inputs. A soft white light allows for necessary visibility for the procedure while avoiding the jarring effects of bright hospital lighting.",
        sound: "Generate a confident, rhythmic track in Major key with a strong pulse to provide predictability. Use a steady marching beat with clear structure (verse/chorus). Instruments: Snare drum, brass, and piano to empower the child and provide a sense of control."
    },
    normal: {
        title: "Normal / Relaxed",
        lighting: "Standard lighting configuration to mimic the robust circadian rhythm.",
        sound: "No specific sound configuration."
    }
};

const SymptomExplanation = ({ activeSymptom }) => {
    const data = EXPLANATIONS[activeSymptom];

    if (!data) return null;

    return (
        <div style={{
            width: '320px', // Matched to MusicGenerator
            background: 'var(--color-surface)',
            color: 'var(--color-text-main)',
            padding: '16px',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-card)',
            border: '2px solid white',
            boxSizing: 'border-box',
            fontFamily: 'var(--font-family)'
        }}>
            <h3 style={{
                margin: '0 0 12px 0',
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--color-primary)',
                borderBottom: '2px solid var(--color-background)',
                paddingBottom: '8px'
            }}>
                {data.title}
            </h3>

            <div style={{ marginBottom: '16px' }}>
                <strong style={{ color: '#FFB74D', display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: 700 }}>
                    Lighting Configuration
                </strong>
                <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: '1.4', color: 'var(--color-text-secondary)' }}>
                    {data.lighting}
                </p>
            </div>

            <div>
                <strong style={{ color: '#4FC3F7', display: 'block', marginBottom: '4px', fontSize: '0.8rem', fontWeight: 700 }}>
                    AI Music Generator
                </strong>
                <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: '1.4', color: 'var(--color-text-secondary)' }}>
                    {data.sound}
                </p>
            </div>
        </div>
    );
};

export default SymptomExplanation;
