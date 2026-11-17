import { SenseMeta, SenseType, TierConfig } from '../types/game';

export const SENSE_POTIONS: SenseMeta[] = [
  {
    id: 'touch',
    label: 'Touch',
    hotkey: '1',
    color: '#E1556F',
    glow: 'rgba(225, 85, 111, 0.45)',
    description: 'Warm Velvet Elixir — restores +15 HP and unlocks tactile charm.',
  },
  {
    id: 'smell',
    label: 'Smell',
    hotkey: '2',
    color: '#A76CE6',
    glow: 'rgba(167, 108, 230, 0.45)',
    description: 'Night Jasmine Mist — restores +15 HP and carries sweet allure.',
  },
  {
    id: 'taste',
    label: 'Taste',
    hotkey: '3',
    color: '#E59A2B',
    glow: 'rgba(229, 154, 43, 0.45)',
    description: 'Spiced Honey Nectar — restores +15 HP and sparks warm conversation.',
  },
  {
    id: 'sight',
    label: 'Sight',
    hotkey: '4',
    color: '#2FB57D',
    glow: 'rgba(47, 181, 125, 0.45)',
    description: 'Prism Gaze Tonic — restores +15 HP and reveals true aura clarity.',
  },
  {
    id: 'hearing',
    label: 'Hearing',
    hotkey: '5',
    color: '#3B9AE1',
    glow: 'rgba(59, 154, 225, 0.45)',
    description: 'Melodic Chime Draught — restores +15 HP and harmonizes consent.',
  },
];

export const SENSE_BY_ID: Record<SenseType, SenseMeta> = {
  touch: SENSE_POTIONS[0],
  smell: SENSE_POTIONS[1],
  taste: SENSE_POTIONS[2],
  sight: SENSE_POTIONS[3],
  hearing: SENSE_POTIONS[4],
};

export const TIER_CONFIGS: TierConfig[] = [
  {
    tier: 1,
    name: 'Neighborhood Beginnings',
    minLevel: 1,
    maxLevel: 25,
    timerSeconds: 15 * 60,
    friendsPerLevel: 10,
    tierGoal: 250,
    description: 'Basic stealth, sense potion collection, and private-room friendships.',
    hasDetectives: false,
    patrolDensity: 1.0,
    npcSpeedMultiplier: 1.0,
  },
  {
    tier: 2,
    name: 'Spark & Shadow District',
    minLevel: 26,
    maxLevel: 50,
    timerSeconds: 30 * 60,
    friendsPerLevel: 20,
    tierGoal: 500,
    description: 'Disguised detectives emit a 2-second spark before invisible bombs.',
    hasDetectives: true,
    patrolDensity: 1.25,
    npcSpeedMultiplier: 1.12,
  },
  {
    tier: 3,
    name: 'High-Rise Crossroads',
    minLevel: 51,
    maxLevel: 75,
    timerSeconds: 45 * 60,
    friendsPerLevel: 20,
    tierGoal: 500,
    description: 'More patrols, busier avenues, and tighter timing windows.',
    hasDetectives: true,
    patrolDensity: 1.55,
    npcSpeedMultiplier: 1.24,
  },
  {
    tier: 4,
    name: 'King Solomon Metropolis',
    minLevel: 76,
    maxLevel: 100,
    timerSeconds: 60 * 60,
    friendsPerLevel: 40,
    tierGoal: 1000,
    description: 'Maximum difficulty: complete the final 1,000-character friendship challenge.',
    hasDetectives: true,
    patrolDensity: 1.85,
    npcSpeedMultiplier: 1.38,
  },
];

export function getTierForLevel(level: number): TierConfig {
  const clamped = Math.max(1, Math.min(100, level));
  if (clamped <= 25) return TIER_CONFIGS[0];
  if (clamped <= 50) return TIER_CONFIGS[1];
  if (clamped <= 75) return TIER_CONFIGS[2];
  return TIER_CONFIGS[3];
}

export function formatTimer(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
