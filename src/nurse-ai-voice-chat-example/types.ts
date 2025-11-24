export enum StressLevel {
  NEUTRAL = 'Neutral',
  CALM = 'Calm',
  STRESSED = 'Stressed',
  ANXIOUS = 'Anxious',
  HAPPY = 'Happy',
  UNKNOWN = 'Analyzing...'
}

export interface AudioConfig {
  sampleRate: number;
}