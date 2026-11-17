import {
  Building,
  BuildingType,
  CharacterKind,
  CityNPC,
  PotionDrop,
  Room,
  SenseType,
  TierConfig,
  Vehicle,
  VehicleKind,
} from '../types/game';

export const WORLD_WIDTH = 2400;
export const WORLD_HEIGHT = 1700;

export const SKIN_TONES = [
  '#4A2B1B',
  '#633B24',
  '#7D4E32',
  '#9A6443',
  '#B57D56',
  '#C9946B',
  '#D6A87C',
];

export const HAIR_COLORS = ['#181412', '#261C17', '#3B2820', '#4A2B1B'];
export const HAIR_STYLES: CityNPC['hairStyle'][] = [
  'afro',
  'braids',
  'locs',
  'bun',
  'curls',
  'bob',
];

export const OUTFIT_COLORS = [
  '#D96B43',
  '#E0A439',
  '#3A9679',
  '#457B9D',
  '#B55376',
  '#7B61B8',
  '#C74E56',
  '#2D8A8A',
];

const FIRST_NAMES = [
  'Maya',
  'Zuri',
  'Nia',
  'Aaliyah',
  'Amara',
  'Kendra',
  'Imani',
  'Sasha',
  'Tiana',
  'Brielle',
  'Kamila',
  'Simone',
  'Naomi',
  'Jada',
  'Layla',
  'Chloé',
  'Solana',
  'Yara',
  'Nadia',
  'Tessa',
  'Keisha',
  'Elena',
  'Gabriela',
  'Rihanna',
  'Anika',
  'Malia',
  'Celine',
  'Dalia',
  'Amina',
  'Esme',
];

const SENSES: SenseType[] = ['touch', 'smell', 'taste', 'sight', 'hearing'];

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function createCityBuildings(): Building[] {
  const specs: Array<{
    id: string;
    type: BuildingType;
    name: string;
    x: number;
    y: number;
    cols: number;
    rows: number;
    roomW: number;
    roomH: number;
    wallColor: string;
    floorColor: string;
    roofColor: string;
  }> = [
    {
      id: 'b_house_1',
      type: 'house',
      name: 'Cedar Terrace House',
      x: 150,
      y: 160,
      cols: 1,
      rows: 1,
      roomW: 210,
      roomH: 170,
      wallColor: '#B85D3B',
      floorColor: '#EADBC8',
      roofColor: '#6D3422',
    },
    {
      id: 'b_hotel_1',
      type: 'hotel',
      name: 'Rosewood Grand Hotel',
      x: 470,
      y: 140,
      cols: 3,
      rows: 1,
      roomW: 160,
      roomH: 185,
      wallColor: '#7A3E48',
      floorColor: '#EFE3D6',
      roofColor: '#4B222A',
    },
    {
      id: 'b_apt_1',
      type: 'apartment',
      name: 'Sienna Heights Apts',
      x: 1420,
      y: 140,
      cols: 2,
      rows: 2,
      roomW: 165,
      roomH: 145,
      wallColor: '#A16C45',
      floorColor: '#E8DFD1',
      roofColor: '#5B3B24',
    },
    {
      id: 'b_motel_1',
      type: 'motel',
      name: 'Palm Court Motel',
      x: 1880,
      y: 160,
      cols: 2,
      rows: 1,
      roomW: 170,
      roomH: 170,
      wallColor: '#3B7A75',
      floorColor: '#E5EAE6',
      roofColor: '#214D4A',
    },
    {
      id: 'b_house_2',
      type: 'house',
      name: 'Magnolia Cottage',
      x: 150,
      y: 670,
      cols: 1,
      rows: 1,
      roomW: 210,
      roomH: 170,
      wallColor: '#C27A3E',
      floorColor: '#EFE4D2',
      roofColor: '#74461E',
    },
    {
      id: 'b_apt_2',
      type: 'apartment',
      name: 'Veranda Court Flats',
      x: 1880,
      y: 660,
      cols: 2,
      rows: 1,
      roomW: 170,
      roomH: 175,
      wallColor: '#6D597A',
      floorColor: '#EAE4EE',
      roofColor: '#41324B',
    },
    {
      id: 'b_motel_2',
      type: 'motel',
      name: 'Sunset Strip Motel',
      x: 150,
      y: 1120,
      cols: 3,
      rows: 1,
      roomW: 160,
      roomH: 165,
      wallColor: '#3D6A8A',
      floorColor: '#E2E9EE',
      roofColor: '#213F54',
    },
    {
      id: 'b_hotel_2',
      type: 'hotel',
      name: 'Marigold Plaza Hotel',
      x: 1420,
      y: 1100,
      cols: 2,
      rows: 1,
      roomW: 180,
      roomH: 180,
      wallColor: '#8B5A2B',
      floorColor: '#F0E4D4',
      roofColor: '#523415',
    },
    {
      id: 'b_house_3',
      type: 'house',
      name: 'Jasmine Villa',
      x: 1920,
      y: 1120,
      cols: 1,
      rows: 1,
      roomW: 220,
      roomH: 170,
      wallColor: '#9E4B5A',
      floorColor: '#EFE0E2',
      roofColor: '#5D2630',
    },
  ];

  return specs.map((spec) => {
    const rooms: Room[] = [];
    for (let r = 0; r < spec.rows; r++) {
      for (let c = 0; c < spec.cols; c++) {
        const rx = spec.x + c * spec.roomW;
        const ry = spec.y + r * spec.roomH;
        const roomNum = r * spec.cols + c + 1;
        const doorW = 66;
        const doorSide: Room['doorSide'] =
          r === spec.rows - 1 ? 'bottom' : 'top';
        const doorX = rx + spec.roomW / 2 - doorW / 2;
        const doorY = doorSide === 'bottom' ? ry + spec.roomH - 8 : ry - 4;

        rooms.push({
          id: `${spec.id}_r${roomNum}`,
          buildingId: spec.id,
          buildingType: spec.type,
          label:
            spec.cols * spec.rows === 1
              ? spec.name
              : `${spec.name} · Rm ${roomNum}`,
          x: rx,
          y: ry,
          w: spec.roomW,
          h: spec.roomH,
          doorX,
          doorY,
          doorW,
          doorSide,
          sealed: false,
          wallColor: spec.wallColor,
          floorColor: spec.floorColor,
          roofColor: spec.roofColor,
          windows: [
            { x: rx + 22, y: ry - 4, w: 34, h: 8 },
            { x: rx + spec.roomW - 56, y: ry - 4, w: 34, h: 8 },
            { x: rx - 4, y: ry + spec.roomH / 2 - 18, w: 8, h: 36 },
            { x: rx + spec.roomW - 4, y: ry + spec.roomH / 2 - 18, w: 8, h: 36 },
          ],
        });
      }
    }

    return {
      id: spec.id,
      type: spec.type,
      name: spec.name,
      x: spec.x,
      y: spec.y,
      w: spec.cols * spec.roomW,
      h: spec.rows * spec.roomH,
      rooms,
    };
  });
}

// Road corridors (horizontal and vertical avenues)
export const ROAD_RECTS = [
  // Horizontal avenues
  { x: 0, y: 460, w: WORLD_WIDTH, h: 120, dir: 'h' as const },
  { x: 0, y: 940, w: WORLD_WIDTH, h: 120, dir: 'h' as const },
  // Vertical avenues
  { x: 1080, y: 0, w: 120, h: WORLD_HEIGHT, dir: 'v' as const },
  { x: 1720, y: 0, w: 120, h: WORLD_HEIGHT, dir: 'v' as const },
];

export const RAIL_Y = 1480;

export const PARK_RECT = {
  x: 520,
  y: 620,
  w: 480,
  h: 270,
  name: 'Magnolia Public Park',
};

export function pointInAnyRoom(
  x: number,
  y: number,
  buildings: Building[]
): Room | null {
  for (const b of buildings) {
    for (const r of b.rooms) {
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        return r;
      }
    }
  }
  return null;
}

export function spawnSingleNPC(
  tier: TierConfig,
  buildings: Building[],
  forcedKind?: CharacterKind,
  spawnPos?: { x: number; y: number; arrivedVia?: VehicleKind }
): CityNPC {
  let kind: CharacterKind = forcedKind ?? 'poly_single';
  if (!forcedKind) {
    const roll = Math.random();
    if (tier.hasDetectives && roll < 0.14) {
      kind = 'detective';
    } else if (roll < 0.34) {
      kind = 'monogamous';
    } else if (roll < 0.44) {
      kind = 'marriage_seeker';
    } else if (roll < 0.66) {
      kind = 'poly_phone';
    } else {
      kind = 'poly_single';
    }
  }

  let sx = spawnPos?.x ?? rand(140, WORLD_WIDTH - 140);
  let sy = spawnPos?.y ?? rand(140, WORLD_HEIGHT - 260);
  // Keep initial spawns out of sealed rooms
  if (!spawnPos) {
    let attempts = 0;
    while (pointInAnyRoom(sx, sy, buildings) && attempts < 10) {
      sx = rand(140, WORLD_WIDTH - 140);
      sy = rand(140, WORLD_HEIGHT - 260);
      attempts++;
    }
  }

  const speedBase = 48 * tier.npcSpeedMultiplier;
  const angle = rand(0, Math.PI * 2);

  return {
    id: `npc_${Math.random().toString(36).slice(2, 10)}`,
    name: pick(FIRST_NAMES),
    kind,
    x: sx,
    y: sy,
    vx: Math.cos(angle) * speedBase,
    vy: Math.sin(angle) * speedBase,
    radius: 15,
    skinTone: pick(SKIN_TONES),
    hairColor: pick(HAIR_COLORS),
    hairStyle: pick(HAIR_STYLES),
    outfitColor: pick(OUTFIT_COLORS),
    hasPhone: kind === 'poly_phone',
    hasRing: kind === 'monogamous' || kind === 'marriage_seeker',
    seekingMarriage: kind === 'marriage_seeker',
    followingPlayer: false,
    befriended: false,
    interactionProgress: 0,
    detectiveState: 'idle',
    sparkTimer: 2.0,
    bombX: sx,
    bombY: sy,
    wanderTimer: rand(1.5, 4.5),
    targetX: rand(140, WORLD_WIDTH - 140),
    targetY: rand(140, WORLD_HEIGHT - 260),
    arrivedVia: spawnPos?.arrivedVia,
  };
}

export function createInitialNPCs(
  tier: TierConfig,
  buildings: Building[]
): CityNPC[] {
  const baseCount = Math.round(32 * tier.patrolDensity);
  const npcs: CityNPC[] = [];
  // Ensure generous supply of eligible poly singles & phone bonus singles
  for (let i = 0; i < baseCount; i++) {
    let forced: CharacterKind | undefined;
    if (i < 10) forced = i % 3 === 0 ? 'poly_phone' : 'poly_single';
    else if (i < 16) forced = 'monogamous';
    else if (i < 19) forced = 'marriage_seeker';
    else if (tier.hasDetectives && i < 23) forced = 'detective';
    npcs.push(spawnSingleNPC(tier, buildings, forced));
  }
  return npcs;
}

export function spawnPotionDrop(buildings: Building[]): PotionDrop {
  let x = rand(120, WORLD_WIDTH - 120);
  let y = rand(120, WORLD_HEIGHT - 260);
  let tries = 0;
  while (pointInAnyRoom(x, y, buildings) && tries < 12) {
    x = rand(120, WORLD_WIDTH - 120);
    y = rand(120, WORLD_HEIGHT - 260);
    tries++;
  }
  return {
    id: `pot_${Math.random().toString(36).slice(2, 10)}`,
    sense: pick(SENSES),
    x,
    y,
    pulsePhase: rand(0, Math.PI * 2),
  };
}

export function createInitialPotions(
  count: number,
  buildings: Building[]
): PotionDrop[] {
  const list: PotionDrop[] = [];
  // Ensure at least 2 of every sense potion on map initially
  for (let i = 0; i < count; i++) {
    const drop = spawnPotionDrop(buildings);
    if (i < 10) {
      drop.sense = SENSES[i % SENSES.length];
    }
    list.push(drop);
  }
  return list;
}

export function createCityVehicles(): Vehicle[] {
  const specs: Array<{
    kind: VehicleKind;
    x: number;
    y: number;
    vx: number;
    vy: number;
    w: number;
    h: number;
    color: string;
  }> = [
    // Plane flying diagonally across sky
    {
      kind: 'plane',
      x: 200,
      y: 260,
      vx: 165,
      vy: 42,
      w: 84,
      h: 72,
      color: '#F4F1EA',
    },
    // City Train on south rail track
    {
      kind: 'train',
      x: 300,
      y: RAIL_Y - 22,
      vx: 195,
      vy: 0,
      w: 220,
      h: 44,
      color: '#C74E56',
    },
    // Bus on top horizontal avenue
    {
      kind: 'bus',
      x: 1800,
      y: 478,
      vx: -120,
      vy: 0,
      w: 112,
      h: 36,
      color: '#E0A439',
    },
    // Taxi on top horizontal avenue right lane
    {
      kind: 'taxi',
      x: 350,
      y: 530,
      vx: 155,
      vy: 0,
      w: 56,
      h: 30,
      color: '#F2C138',
    },
    // SUV on lower horizontal avenue
    {
      kind: 'suv',
      x: 600,
      y: 1010,
      vx: 140,
      vy: 0,
      w: 66,
      h: 34,
      color: '#3A6B7C',
    },
    // Jeep on lower horizontal avenue left lane
    {
      kind: 'jeep',
      x: 1950,
      y: 958,
      vx: -132,
      vy: 0,
      w: 60,
      h: 34,
      color: '#4F7748',
    },
    // Car on vertical avenue 1
    {
      kind: 'car',
      x: 1096,
      y: 300,
      vx: 0,
      vy: 145,
      w: 30,
      h: 54,
      color: '#B85D3B',
    },
    // Tricycle on vertical avenue 2
    {
      kind: 'tricycle',
      x: 1796,
      y: 1200,
      vx: 0,
      vy: -98,
      w: 26,
      h: 40,
      color: '#3A9679',
    },
  ];

  return specs.map((s, idx) => ({
    id: `veh_${idx}_${s.kind}`,
    ...s,
    dropoffCooldown: rand(4, 10),
  }));
}
