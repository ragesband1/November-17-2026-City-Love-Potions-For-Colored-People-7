export type SenseType = 'touch' | 'smell' | 'taste' | 'sight' | 'hearing';

export type GameState =
  | 'TITLE_MENU'
  | 'PLAYING'
  | 'PAUSED'
  | 'LEVEL_CLEAR'
  | 'GAME_OVER'
  | 'VICTORY';

export type BuildingType = 'house' | 'hotel' | 'motel' | 'apartment';

export type CharacterKind =
  | 'poly_single'
  | 'poly_phone'
  | 'monogamous'
  | 'marriage_seeker'
  | 'detective';

export type VehicleKind =
  | 'plane'
  | 'train'
  | 'bus'
  | 'suv'
  | 'jeep'
  | 'tricycle'
  | 'car'
  | 'taxi';

export type PotionCounts = Record<SenseType, number>;

export interface SenseMeta {
  id: SenseType;
  label: string;
  hotkey: string;
  color: string;
  glow: string;
  description: string;
}

export interface TierConfig {
  tier: 1 | 2 | 3 | 4;
  name: string;
  minLevel: number;
  maxLevel: number;
  timerSeconds: number;
  friendsPerLevel: number;
  tierGoal: number;
  description: string;
  hasDetectives: boolean;
  patrolDensity: number;
  npcSpeedMultiplier: number;
}

export interface Room {
  id: string;
  buildingId: string;
  buildingType: BuildingType;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  doorX: number;
  doorY: number;
  doorW: number;
  doorSide: 'top' | 'bottom' | 'left' | 'right';
  sealed: boolean; // true = doors, windows, and ceiling closed
  wallColor: string;
  floorColor: string;
  roofColor: string;
  windows: Array<{ x: number; y: number; w: number; h: number }>;
}

export interface Building {
  id: string;
  type: BuildingType;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rooms: Room[];
}

export interface CityNPC {
  id: string;
  name: string;
  kind: CharacterKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  skinTone: string;
  hairColor: string;
  hairStyle: 'afro' | 'braids' | 'locs' | 'bun' | 'curls' | 'bob';
  outfitColor: string;
  hasPhone: boolean;
  hasRing: boolean;
  seekingMarriage: boolean;
  followingPlayer: boolean;
  befriended: boolean;
  interactionProgress: number; // 0 to 1
  detectiveState: 'idle' | 'sparking' | 'detonated';
  sparkTimer: number; // counts down from 2.0s
  bombX: number;
  bombY: number;
  wanderTimer: number;
  targetX: number;
  targetY: number;
  arrivedVia?: VehicleKind;
}

export interface PotionDrop {
  id: string;
  sense: SenseType;
  x: number;
  y: number;
  pulsePhase: number;
}

export interface Vehicle {
  id: string;
  kind: VehicleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  color: string;
  dropoffCooldown: number;
}

export interface BombShockwave {
  id: string;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

export interface FloatingNotice {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface RunHistoryEntry {
  id: string;
  playerName: string;
  timestamp: number;
  score: number;
  levelReached: number;
  friendsMade: number;
  potionsCollected: number;
  outcome: 'VICTORY' | 'GAME_OVER';
  reason: string;
}

export interface ActiveRunSnapshot {
  playerName: string;
  level: number;
  score: number;
  hp: number;
  maxHp: number;
  potions: PotionCounts;
  potionsCollectedTotal: PotionCounts;
  friendsThisLevel: number;
  friendsThisTier: number;
  totalFriendsRun: number;
  tierTimeRemaining: number;
  currentTier: 1 | 2 | 3 | 4;
  selectedSense: SenseType | null;
  updatedAt: number;
}

export interface SavedProgress {
  playerName: string;
  highScore: number;
  bestLevel: number;
  totalPotionsEver: number;
  totalFriendsEver: number;
  history: RunHistoryEntry[];
  activeRun: ActiveRunSnapshot | null;
}

export interface HudSnapshot {
  level: number;
  tier: TierConfig;
  score: number;
  hp: number;
  maxHp: number;
  potions: PotionCounts;
  potionsCollectedTotal: PotionCounts;
  selectedSense: SenseType | null;
  friendsThisLevel: number;
  friendsNeededThisLevel: number;
  friendsThisTier: number;
  totalFriendsRun: number;
  tierTimeRemaining: number;
  isSprinting: boolean;
  currentRoom: {
    label: string;
    buildingType: BuildingType;
    sealed: boolean;
    occupantCount: number;
  } | null;
  followingFriendName: string | null;
  activeInteraction: {
    npcName: string;
    sense: SenseType;
    progress: number;
  } | null;
  detectiveWarningActive: boolean;
  privacyWarning: string | null;
}
