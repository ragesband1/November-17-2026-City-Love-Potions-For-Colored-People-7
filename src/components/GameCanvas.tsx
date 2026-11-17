import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import {
  ActiveRunSnapshot,
  BombShockwave,
  Building,
  CityNPC,
  FloatingNotice,
  GameState,
  HudSnapshot,
  Particle,
  PotionCounts,
  PotionDrop,
  Room,
  SenseType,
  Vehicle,
} from '../types/game';
import {
  PARK_RECT,
  RAIL_Y,
  ROAD_RECTS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  createCityBuildings,
  createCityVehicles,
  createInitialNPCs,
  createInitialPotions,
  pointInAnyRoom,
  spawnPotionDrop,
  spawnSingleNPC,
} from '../engine/cityGenerator';
import {
  SENSE_BY_ID,
  SENSE_POTIONS,
  getTierForLevel,
} from '../engine/levelConfig';
import { EMPTY_POTIONS } from '../utils/storage';
import { soundEngine } from '../utils/audio';

export interface GameCanvasHandle {
  selectSense: (sense: SenseType) => void;
  toggleRoomSeal: () => void;
}

interface GameCanvasProps {
  runId: number;
  playerName: string;
  gameState: GameState;
  initialRun: ActiveRunSnapshot | null;
  onHudUpdate: (hud: HudSnapshot) => void;
  onSaveProgress: (
    snapshot: ActiveRunSnapshot,
    potionsDelta?: number,
    friendsDelta?: number
  ) => void;
  onGameOver: (payload: {
    reason: string;
    score: number;
    levelReached: number;
    friendsMade: number;
    potionsCollected: PotionCounts;
  }) => void;
  onVictory: (payload: {
    score: number;
    levelReached: number;
    friendsMade: number;
    potionsCollected: PotionCounts;
  }) => void;
}

interface SimState {
  player: {
    x: number;
    y: number;
    radius: number;
    facingX: number;
    facingY: number;
    sprinting: boolean;
  };
  camera: { x: number; y: number };
  level: number;
  score: number;
  hp: number;
  maxHp: number;
  potions: PotionCounts;
  potionsCollectedTotal: PotionCounts;
  selectedSense: SenseType | null;
  friendsThisLevel: number;
  friendsThisTier: number;
  totalFriendsRun: number;
  tierTimeRemaining: number;
  buildings: Building[];
  npcs: CityNPC[];
  potionDrops: PotionDrop[];
  vehicles: Vehicle[];
  shockwaves: BombShockwave[];
  notices: FloatingNotice[];
  particles: Particle[];
  activeInteractionNpcId: string | null;
  ended: boolean;
  levelBannerTimer: number;
  levelBannerText: string;
  lastHudSync: number;
  mouseScreenX: number;
  mouseScreenY: number;
  mouseInside: boolean;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

export const GameCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(
  (
    {
      runId,
      playerName,
      gameState,
      initialRun,
      onHudUpdate,
      onSaveProgress,
      onGameOver,
      onVictory,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const simRef = useRef<SimState | null>(null);
    const keysRef = useRef<Set<string>>(new Set());
    const gameStateRef = useRef<GameState>(gameState);
    const playerNameRef = useRef<string>(playerName);

    gameStateRef.current = gameState;
    playerNameRef.current = playerName;

    const pushNotice = (
      sim: SimState,
      x: number,
      y: number,
      text: string,
      color: string
    ) => {
      sim.notices.push({
        id: `nt_${Math.random().toString(36).slice(2, 9)}`,
        x,
        y,
        text,
        color,
        life: 2.1,
        maxLife: 2.1,
      });
    };

    const spawnBurst = (
      sim: SimState,
      x: number,
      y: number,
      color: string,
      count = 14
    ) => {
      for (let i = 0; i < count; i++) {
        const ang = (Math.PI * 2 * i) / count + Math.random() * 0.3;
        const spd = 45 + Math.random() * 95;
        sim.particles.push({
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          color,
          size: 2.5 + Math.random() * 2.5,
          life: 0.55 + Math.random() * 0.25,
          maxLife: 0.8,
        });
      }
    };

    const emitSnapshot = (
      sim: SimState,
      potionsDelta = 0,
      friendsDelta = 0
    ) => {
      const tier = getTierForLevel(sim.level);
      const snap: ActiveRunSnapshot = {
        playerName: playerNameRef.current,
        level: sim.level,
        score: sim.score,
        hp: sim.hp,
        maxHp: sim.maxHp,
        potions: { ...sim.potions },
        potionsCollectedTotal: { ...sim.potionsCollectedTotal },
        friendsThisLevel: sim.friendsThisLevel,
        friendsThisTier: sim.friendsThisTier,
        totalFriendsRun: sim.totalFriendsRun,
        tierTimeRemaining: sim.tierTimeRemaining,
        currentTier: tier.tier,
        selectedSense: sim.selectedSense,
        updatedAt: Date.now(),
      };
      onSaveProgress(snap, potionsDelta, friendsDelta);
    };

    const emitHud = (sim: SimState) => {
      const tier = getTierForLevel(sim.level);
      const room = pointInAnyRoom(sim.player.x, sim.player.y, sim.buildings);
      let occupantCount = 0;
      if (room) {
        for (const n of sim.npcs) {
          if (
            n.x >= room.x &&
            n.x <= room.x + room.w &&
            n.y >= room.y &&
            n.y <= room.y + room.h
          ) {
            occupantCount++;
          }
        }
      }
      const follower = sim.npcs.find((n) => n.followingPlayer && !n.befriended);
      const activeNpc = sim.activeInteractionNpcId
        ? sim.npcs.find((n) => n.id === sim.activeInteractionNpcId)
        : undefined;
      const sparking = sim.npcs.some((n) => n.detectiveState === 'sparking');

      onHudUpdate({
        level: sim.level,
        tier,
        score: sim.score,
        hp: sim.hp,
        maxHp: sim.maxHp,
        potions: { ...sim.potions },
        potionsCollectedTotal: { ...sim.potionsCollectedTotal },
        selectedSense: sim.selectedSense,
        friendsThisLevel: sim.friendsThisLevel,
        friendsNeededThisLevel: tier.friendsPerLevel,
        friendsThisTier: sim.friendsThisTier,
        totalFriendsRun: sim.totalFriendsRun,
        tierTimeRemaining: sim.tierTimeRemaining,
        isSprinting: sim.player.sprinting,
        currentRoom: room
          ? {
              label: room.label,
              buildingType: room.buildingType,
              sealed: room.sealed,
              occupantCount,
            }
          : null,
        followingFriendName: follower ? follower.name : null,
        activeInteraction:
          activeNpc && sim.selectedSense
            ? {
                npcName: activeNpc.name,
                sense: sim.selectedSense,
                progress: activeNpc.interactionProgress,
              }
            : null,
        detectiveWarningActive: sparking,
        privacyWarning: null,
      });
    };

    const triggerGameOver = (sim: SimState, reason: string) => {
      if (sim.ended) return;
      sim.ended = true;
      soundEngine.playGameOver();
      onGameOver({
        reason,
        score: sim.score,
        levelReached: sim.level,
        friendsMade: sim.totalFriendsRun,
        potionsCollected: { ...sim.potionsCollectedTotal },
      });
    };

    const toggleCurrentRoomSeal = () => {
      const sim = simRef.current;
      if (!sim || sim.ended || gameStateRef.current !== 'PLAYING') return;
      const room = pointInAnyRoom(sim.player.x, sim.player.y, sim.buildings);
      if (!room) {
        pushNotice(
          sim,
          sim.player.x,
          sim.player.y - 26,
          'Step inside a House, Hotel, Motel, or Apt first',
          '#FBBF24'
        );
        return;
      }
      room.sealed = !room.sealed;
      soundEngine.playRoomToggle(room.sealed);
      pushNotice(
        sim,
        sim.player.x,
        sim.player.y - 28,
        room.sealed
          ? 'Doors, Windows & Ceiling Closed!'
          : 'Room Opened',
        room.sealed ? '#34D399' : '#FBBF24'
      );
      emitHud(sim);
    };

    useImperativeHandle(ref, () => ({
      selectSense: (sense: SenseType) => {
        const sim = simRef.current;
        if (!sim) return;
        sim.selectedSense = sense;
        emitHud(sim);
      },
      toggleRoomSeal: () => {
        toggleCurrentRoomSeal();
      },
    }));

    // Initialize or reset simulation when runId changes
    useEffect(() => {
      const startLevel = initialRun?.level ?? 1;
      const tier = getTierForLevel(startLevel);
      const buildings = createCityBuildings();
      const npcs = createInitialNPCs(tier, buildings);
      const potionDrops = createInitialPotions(26, buildings);
      const vehicles = createCityVehicles();

      const sim: SimState = {
        player: {
          x: 760,
          y: 740, // Magnolia Park Plaza
          radius: 15,
          facingX: 0,
          facingY: 1,
          sprinting: false,
        },
        camera: { x: 0, y: 0 },
        level: startLevel,
        score: initialRun?.score ?? 0,
        hp: initialRun?.hp ?? 100,
        maxHp: initialRun?.maxHp ?? 100,
        potions: initialRun?.potions
          ? { ...initialRun.potions }
          : { touch: 1, smell: 1, taste: 1, sight: 1, hearing: 1 },
        potionsCollectedTotal: initialRun?.potionsCollectedTotal
          ? { ...initialRun.potionsCollectedTotal }
          : { ...EMPTY_POTIONS },
        selectedSense: initialRun?.selectedSense ?? 'touch',
        friendsThisLevel: initialRun?.friendsThisLevel ?? 0,
        friendsThisTier: initialRun?.friendsThisTier ?? 0,
        totalFriendsRun: initialRun?.totalFriendsRun ?? 0,
        tierTimeRemaining: initialRun?.tierTimeRemaining ?? tier.timerSeconds,
        buildings,
        npcs,
        potionDrops,
        vehicles,
        shockwaves: [],
        notices: [],
        particles: [],
        activeInteractionNpcId: null,
        ended: false,
        levelBannerTimer: 2.6,
        levelBannerText: `Level ${startLevel} · ${tier.name}`,
        lastHudSync: 0,
        mouseScreenX: 0,
        mouseScreenY: 0,
        mouseInside: false,
      };

      simRef.current = sim;
      emitHud(sim);
      // Save immediately on run start
      emitSnapshot(sim, 0, 0);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [runId]);

    // Keyboard listeners
    useEffect(() => {
      const onKeyDown = (e: KeyboardEvent) => {
        if (
          document.activeElement &&
          ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)
        ) {
          return;
        }
        keysRef.current.add(e.key);
        if (
          ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(
            e.key
          )
        ) {
          e.preventDefault();
        }

        const sim = simRef.current;
        if (!sim || gameStateRef.current !== 'PLAYING' || sim.ended) return;

        if (e.key === 'e' || e.key === 'E' || e.key === ' ') {
          toggleCurrentRoomSeal();
        } else if (e.key >= '1' && e.key <= '5') {
          const idx = Number(e.key) - 1;
          const sense = SENSE_POTIONS[idx]?.id;
          if (sense) {
            sim.selectedSense = sense;
            emitHud(sim);
          }
        }
      };

      const onKeyUp = (e: KeyboardEvent) => {
        keysRef.current.delete(e.key);
      };

      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      return () => {
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Mouse aim & click handler on Canvas
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const onMouseMove = (e: MouseEvent) => {
        const sim = simRef.current;
        if (!sim) return;
        const rect = canvas.getBoundingClientRect();
        sim.mouseScreenX = e.clientX - rect.left;
        sim.mouseScreenY = e.clientY - rect.top;
        sim.mouseInside = true;
      };

      const onMouseLeave = () => {
        if (simRef.current) simRef.current.mouseInside = false;
      };

      const onMouseDown = (e: MouseEvent) => {
        const sim = simRef.current;
        if (!sim || sim.ended || gameStateRef.current !== 'PLAYING') return;

        const rect = canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const wx = sx + sim.camera.x;
        const wy = sy + sim.camera.y;

        // 1. Check if clicking a glowing potion drop
        let clickedPotionIdx = -1;
        let bestPotDist = 34;
        for (let i = 0; i < sim.potionDrops.length; i++) {
          const d = dist(wx, wy, sim.potionDrops[i].x, sim.potionDrops[i].y);
          if (d < bestPotDist) {
            bestPotDist = d;
            clickedPotionIdx = i;
          }
        }

        if (clickedPotionIdx !== -1) {
          const drop = sim.potionDrops[clickedPotionIdx];
          const meta = SENSE_BY_ID[drop.sense];
          sim.potionDrops.splice(clickedPotionIdx, 1);
          sim.potionDrops.push(spawnPotionDrop(sim.buildings));

          sim.potions[drop.sense] += 1;
          sim.potionsCollectedTotal[drop.sense] += 1;
          sim.hp = Math.min(sim.maxHp, sim.hp + 15);
          sim.score += 25;
          if (!sim.selectedSense || sim.potions[sim.selectedSense] === 0) {
            sim.selectedSense = drop.sense;
          }

          soundEngine.playPotionCollect();
          spawnBurst(sim, drop.x, drop.y, meta.color, 16);
          pushNotice(
            sim,
            drop.x,
            drop.y - 16,
            `+${meta.label} Potion (+15 HP · +25)`,
            meta.color
          );
          emitSnapshot(sim, 1, 0);
          emitHud(sim);
          return;
        }

        // 2. Check if clicking a Room's Door toggle directly
        for (const b of sim.buildings) {
          for (const r of b.rooms) {
            const doorCenterX = r.doorX + r.doorW / 2;
            const doorCenterY = r.doorY + 4;
            if (dist(wx, wy, doorCenterX, doorCenterY) < 36) {
              const playerRoom = pointInAnyRoom(
                sim.player.x,
                sim.player.y,
                sim.buildings
              );
              if (playerRoom && playerRoom.id === r.id) {
                toggleCurrentRoomSeal();
                return;
              }
            }
          }
        }

        // 3. Check if clicking an NPC
        let clickedNpc: CityNPC | null = null;
        let bestNpcDist = 34;
        for (const npc of sim.npcs) {
          const d = dist(wx, wy, npc.x, npc.y);
          if (d < bestNpcDist) {
            bestNpcDist = d;
            clickedNpc = npc;
          }
        }

        if (!clickedNpc) return;

        // Handle Detective click -> triggers spark warning
        if (clickedNpc.kind === 'detective') {
          if (clickedNpc.detectiveState === 'idle') {
            clickedNpc.detectiveState = 'sparking';
            clickedNpc.sparkTimer = 2.0;
            clickedNpc.bombX = clickedNpc.x;
            clickedNpc.bombY = clickedNpc.y;
            soundEngine.playSparkWarning();
            pushNotice(
              sim,
              clickedNpc.x,
              clickedNpc.y - 28,
              'DETECTIVE TRAP! SHIFT TO SPRINT!',
              '#FB923C'
            );
          }
          return;
        }

        // Handle Monogamous or Marriage-Seeker click -> Immediate conflict & penalty
        if (
          clickedNpc.kind === 'monogamous' ||
          clickedNpc.kind === 'marriage_seeker'
        ) {
          sim.hp = Math.max(0, sim.hp - 25);
          sim.score = Math.max(0, sim.score - 100);
          soundEngine.playConflictPenalty();
          spawnBurst(sim, clickedNpc.x, clickedNpc.y, '#F43F5E', 14);
          pushNotice(
            sim,
            clickedNpc.x,
            clickedNpc.y - 26,
            clickedNpc.seekingMarriage
              ? 'Marriage Ring! Off-Limits (-25 HP · -100)'
              : 'Monogamous! Conflict (-25 HP · -100)',
            '#FB7185'
          );
          emitSnapshot(sim, 0, 0);
          emitHud(sim);
          if (sim.hp <= 0) {
            triggerGameOver(
              sim,
              'Your health reached zero after relationship conflicts.'
            );
          }
          return;
        }

        // Handle Eligible Polyamorous Single
        if (clickedNpc.befriended) {
          pushNotice(
            sim,
            clickedNpc.x,
            clickedNpc.y - 22,
            `${clickedNpc.name} is already your friend!`,
            '#34D399'
          );
          return;
        }

        // Ensure a valid potion with count > 0 is selected
        let activeSense = sim.selectedSense;
        if (!activeSense || sim.potions[activeSense] <= 0) {
          const fallback = SENSE_POTIONS.find((p) => sim.potions[p.id] > 0);
          if (!fallback) {
            pushNotice(
              sim,
              sim.player.x,
              sim.player.y - 28,
              'No potions left! Click glowing potions on the map.',
              '#FBBF24'
            );
            return;
          }
          activeSense = fallback.id;
          sim.selectedSense = activeSense;
        }

        const playerRoom = pointInAnyRoom(
          sim.player.x,
          sim.player.y,
          sim.buildings
        );
        const npcRoom = pointInAnyRoom(
          clickedNpc.x,
          clickedNpc.y,
          sim.buildings
        );

        const bothInSameRoom =
          playerRoom !== null &&
          npcRoom !== null &&
          playerRoom.id === npcRoom.id;

        if (bothInSameRoom && playerRoom!.sealed) {
          // Check if anyone else is inside the sealed room
          const othersInside = sim.npcs.filter(
            (other) =>
              other.id !== clickedNpc!.id &&
              other.x >= playerRoom!.x &&
              other.x <= playerRoom!.x + playerRoom!.w &&
              other.y >= playerRoom!.y &&
              other.y <= playerRoom!.y + playerRoom!.h
          );

          if (othersInside.length > 0) {
            // Another character witnessed the private interaction -> 911!
            pushNotice(
              sim,
              othersInside[0].x,
              othersInside[0].y - 30,
              '911! WITNESS IN ROOM!',
              '#EF4444'
            );
            triggerGameOver(
              sim,
              `${othersInside[0].name} was inside the room and called 911! Your secret was exposed.`
            );
            return;
          }

          // Safe private interaction! Move closer if needed and begin
          if (dist(sim.player.x, sim.player.y, clickedNpc.x, clickedNpc.y) > 95) {
            clickedNpc.followingPlayer = true;
            pushNotice(
              sim,
              clickedNpc.x,
              clickedNpc.y - 24,
              `${clickedNpc.name} is coming closer...`,
              '#34D399'
            );
          }
          sim.activeInteractionNpcId = clickedNpc.id;
          emitHud(sim);
          return;
        }

        // Not in a sealed private room yet:
        // First click invites them to follow you one at a time
        if (!clickedNpc.followingPlayer) {
          for (const other of sim.npcs) {
            other.followingPlayer = false;
          }
          clickedNpc.followingPlayer = true;
          sim.activeInteractionNpcId = null;
          pushNotice(
            sim,
            clickedNpc.x,
            clickedNpc.y - 26,
            `Invited ${clickedNpc.name}! Enter a building & press E to close doors.`,
            '#34D399'
          );
          emitHud(sim);
          return;
        }

        // Already following, yet player clicked again to force interaction in public/unsealed room!
        // Check if any witness can see!
        const witness = sim.npcs.find((other) => {
          if (other.id === clickedNpc!.id) return false;
          const otherRoom = pointInAnyRoom(other.x, other.y, sim.buildings);
          if (otherRoom && otherRoom.sealed && otherRoom.id !== playerRoom?.id) {
            return false;
          }
          return (
            dist(other.x, other.y, clickedNpc!.x, clickedNpc!.y) < 340 ||
            dist(other.x, other.y, sim.player.x, sim.player.y) < 340
          );
        });

        if (witness) {
          pushNotice(
            sim,
            witness.x,
            witness.y - 30,
            '911! SECRET EXPOSED!',
            '#EF4444'
          );
          triggerGameOver(
            sim,
            `${witness.name} witnessed your interaction in ${
              playerRoom ? 'an open room' : 'public'
            } and called 911!`
          );
          return;
        }

        pushNotice(
          sim,
          sim.player.x,
          sim.player.y - 28,
          playerRoom
            ? 'Press E to close doors, windows & ceiling first!'
            : 'Walk inside a House, Hotel, Motel, or Apt first!',
          '#FBBF24'
        );
      };

      canvas.addEventListener('mousemove', onMouseMove);
      canvas.addEventListener('mouseleave', onMouseLeave);
      canvas.addEventListener('mousedown', onMouseDown);
      return () => {
        canvas.removeEventListener('mousemove', onMouseMove);
        canvas.removeEventListener('mouseleave', onMouseLeave);
        canvas.removeEventListener('mousedown', onMouseDown);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Main simulation & rendering loop
    useEffect(() => {
      let rafId = 0;
      let lastTime = performance.now();

      const resolveBuildingCollisions = (
        ent: { x: number; y: number; radius: number },
        buildings: Building[],
        isPlayer: boolean,
        isFollower: boolean
      ) => {
        const wallThick = 8;
        for (const b of buildings) {
          for (const r of b.rooms) {
            // Fast bounding check
            if (
              ent.x + ent.radius < r.x - 12 ||
              ent.x - ent.radius > r.x + r.w + 12 ||
              ent.y + ent.radius < r.y - 12 ||
              ent.y - ent.radius > r.y + r.h + 12
            ) {
              continue;
            }

            // Room interior & doorway permeability
            const inDoorX =
              ent.x >= r.doorX + 6 && ent.x <= r.doorX + r.doorW - 6;
            const doorAllowed = !r.sealed || isFollower;

            // Define 4 wall segments around room (leaving doorway gap if open)
            const segments: Array<{
              x: number;
              y: number;
              w: number;
              h: number;
            }> = [];

            // Top wall
            if (r.doorSide === 'top' && doorAllowed) {
              segments.push({
                x: r.x,
                y: r.y - wallThick / 2,
                w: r.doorX - r.x,
                h: wallThick,
              });
              segments.push({
                x: r.doorX + r.doorW,
                y: r.y - wallThick / 2,
                w: r.x + r.w - (r.doorX + r.doorW),
                h: wallThick,
              });
            } else {
              segments.push({
                x: r.x,
                y: r.y - wallThick / 2,
                w: r.w,
                h: wallThick,
              });
            }

            // Bottom wall
            if (r.doorSide === 'bottom' && doorAllowed) {
              segments.push({
                x: r.x,
                y: r.y + r.h - wallThick / 2,
                w: r.doorX - r.x,
                h: wallThick,
              });
              segments.push({
                x: r.doorX + r.doorW,
                y: r.y + r.h - wallThick / 2,
                w: r.x + r.w - (r.doorX + r.doorW),
                h: wallThick,
              });
            } else {
              segments.push({
                x: r.x,
                y: r.y + r.h - wallThick / 2,
                w: r.w,
                h: wallThick,
              });
            }

            // Left & Right walls
            segments.push({
              x: r.x - wallThick / 2,
              y: r.y,
              w: wallThick,
              h: r.h,
            });
            segments.push({
              x: r.x + r.w - wallThick / 2,
              y: r.y,
              w: wallThick,
              h: r.h,
            });

            void inDoorX;
            void isPlayer;

            for (const seg of segments) {
              if (seg.w <= 0 || seg.h <= 0) continue;
              const closestX = clamp(ent.x, seg.x, seg.x + seg.w);
              const closestY = clamp(ent.y, seg.y, seg.y + seg.h);
              const dx = ent.x - closestX;
              const dy = ent.y - closestY;
              const dSq = dx * dx + dy * dy;
              if (dSq < ent.radius * ent.radius) {
                const d = Math.sqrt(dSq) || 0.001;
                const overlap = ent.radius - d;
                ent.x += (dx / d) * overlap;
                ent.y += (dy / d) * overlap;
              }
            }
          }
        }
      };

      const stepSimulation = (sim: SimState, dt: number) => {
        if (sim.ended) return;
        const tier = getTierForLevel(sim.level);

        // Tier Countdown Timer
        sim.tierTimeRemaining = Math.max(0, sim.tierTimeRemaining - dt);
        if (sim.tierTimeRemaining <= 0) {
          triggerGameOver(
            sim,
            `Time expired in Tier ${tier.tier} (${tier.name}).`
          );
          return;
        }

        if (sim.levelBannerTimer > 0) {
          sim.levelBannerTimer = Math.max(0, sim.levelBannerTimer - dt);
        }

        // Player Movement (Arrow keys + optional WASD)
        const keys = keysRef.current;
        let mx = 0;
        let my = 0;
        if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) mx -= 1;
        if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) mx += 1;
        if (keys.has('ArrowUp') || keys.has('w') || keys.has('W')) my -= 1;
        if (keys.has('ArrowDown') || keys.has('s') || keys.has('S')) my += 1;

        sim.player.sprinting = keys.has('Shift');
        const speed = sim.player.sprinting ? 320 : 195;

        if (mx !== 0 || my !== 0) {
          const len = Math.hypot(mx, my);
          mx /= len;
          my /= len;
          sim.player.facingX = mx;
          sim.player.facingY = my;
          sim.player.x += mx * speed * dt;
          sim.player.y += my * speed * dt;
          if (sim.player.sprinting && Math.random() < 0.35) {
            sim.particles.push({
              x: sim.player.x - mx * 12,
              y: sim.player.y - my * 12,
              vx: (Math.random() - 0.5) * 20,
              vy: (Math.random() - 0.5) * 20,
              color: 'rgba(244, 241, 234, 0.45)',
              size: 2.2,
              life: 0.25,
              maxLife: 0.25,
            });
          }
        }

        sim.player.x = clamp(sim.player.x, 32, WORLD_WIDTH - 32);
        sim.player.y = clamp(sim.player.y, 32, WORLD_HEIGHT - 32);
        resolveBuildingCollisions(sim.player, sim.buildings, true, false);

        // Update Vehicles & Passenger Arrivals
        for (const v of sim.vehicles) {
          v.x += v.vx * dt;
          v.y += v.vy * dt;

          if (v.x > WORLD_WIDTH + 240) v.x = -240;
          if (v.x < -260) v.x = WORLD_WIDTH + 220;
          if (v.y > WORLD_HEIGHT + 220) v.y = -220;
          if (v.y < -220) v.y = WORLD_HEIGHT + 200;

          v.dropoffCooldown -= dt;
          if (v.dropoffCooldown <= 0) {
            v.dropoffCooldown = 8 + Math.random() * 10;
            const targetNpcCount = Math.round(32 * tier.patrolDensity);
            if (
              sim.npcs.length < targetNpcCount + 4 &&
              v.x > 160 &&
              v.x < WORLD_WIDTH - 160 &&
              v.y > 160 &&
              v.y < WORLD_HEIGHT - 220
            ) {
              const dropX = clamp(v.x + v.w / 2, 120, WORLD_WIDTH - 120);
              const dropY = clamp(v.y + v.h + 24, 120, WORLD_HEIGHT - 220);
              if (!pointInAnyRoom(dropX, dropY, sim.buildings)) {
                const kindRoll = Math.random();
                const kind =
                  kindRoll < 0.4
                    ? 'poly_phone'
                    : kindRoll < 0.78
                    ? 'poly_single'
                    : 'monogamous';
                sim.npcs.push(
                  spawnSingleNPC(tier, sim.buildings, kind, {
                    x: dropX,
                    y: dropY,
                    arrivedVia: v.kind,
                  })
                );
              }
            }
          }
        }

        // Ensure minimum eligible polyamorous singles on map
        const activeEligible = sim.npcs.filter(
          (n) =>
            (n.kind === 'poly_single' || n.kind === 'poly_phone') &&
            !n.befriended
        ).length;
        if (activeEligible < 12) {
          sim.npcs.push(
            spawnSingleNPC(
              tier,
              sim.buildings,
              Math.random() < 0.4 ? 'poly_phone' : 'poly_single'
            )
          );
        }

        // Update NPCs
        const playerRoom = pointInAnyRoom(
          sim.player.x,
          sim.player.y,
          sim.buildings
        );

        for (let i = sim.npcs.length - 1; i >= 0; i--) {
          const npc = sim.npcs[i];

          // Detective trap logic (Levels 26+)
          if (npc.kind === 'detective') {
            const dToPlayer = dist(npc.x, npc.y, sim.player.x, sim.player.y);
            if (
              npc.detectiveState === 'idle' &&
              dToPlayer < 130 &&
              !playerRoom?.sealed
            ) {
              npc.detectiveState = 'sparking';
              npc.sparkTimer = 2.0;
              npc.bombX = npc.x;
              npc.bombY = npc.y;
              soundEngine.playSparkWarning();
              pushNotice(
                sim,
                npc.x,
                npc.y - 26,
                '2s SPARK! PRESS SHIFT TO SPRINT!',
                '#FB923C'
              );
            } else if (npc.detectiveState === 'sparking') {
              npc.sparkTimer -= dt;
              if (npc.sparkTimer <= 0) {
                npc.detectiveState = 'detonated';
                sim.shockwaves.push({
                  id: `sw_${Math.random()}`,
                  x: npc.bombX,
                  y: npc.bombY,
                  radius: 10,
                  maxRadius: 145,
                  alpha: 1,
                });
                const blastDist = dist(
                  sim.player.x,
                  sim.player.y,
                  npc.bombX,
                  npc.bombY
                );
                if (blastDist <= 145 && !playerRoom?.sealed) {
                  triggerGameOver(
                    sim,
                    'Caught by a disguised detective’s invisible bomb! Your secret was revealed.'
                  );
                  return;
                } else {
                  sim.score += 50;
                  pushNotice(
                    sim,
                    sim.player.x,
                    sim.player.y - 26,
                    'Escaped Detective Bomb! +50',
                    '#34D399'
                  );
                  // Respawn detective elsewhere
                  sim.npcs.splice(i, 1);
                  sim.npcs.push(spawnSingleNPC(tier, sim.buildings, 'detective'));
                  continue;
                }
              }
            }
          }

          // Active private friendship interaction progression
          if (sim.activeInteractionNpcId === npc.id) {
            const npcRoom = pointInAnyRoom(npc.x, npc.y, sim.buildings);
            const safePrivate =
              playerRoom &&
              npcRoom &&
              playerRoom.id === npcRoom.id &&
              playerRoom.sealed;

            if (!safePrivate) {
              sim.activeInteractionNpcId = null;
              npc.interactionProgress = 0;
            } else {
              // Verify still no witness inside room
              const witnessInside = sim.npcs.find(
                (other) =>
                  other.id !== npc.id &&
                  other.x >= playerRoom!.x &&
                  other.x <= playerRoom!.x + playerRoom!.w &&
                  other.y >= playerRoom!.y &&
                  other.y <= playerRoom!.y + playerRoom!.h
              );
              if (witnessInside) {
                triggerGameOver(
                  sim,
                  `${witnessInside.name} witnessed your interaction inside the room and called 911!`
                );
                return;
              }

              npc.interactionProgress += dt / 0.8;
              if (npc.interactionProgress >= 1) {
                // Completed consensual friendship!
                const sense = sim.selectedSense ?? 'touch';
                if (sim.potions[sense] > 0) {
                  sim.potions[sense] -= 1;
                }
                npc.befriended = true;
                npc.followingPlayer = false;
                npc.interactionProgress = 1;
                sim.activeInteractionNpcId = null;

                const isBonus = npc.hasPhone;
                const pts = isBonus ? 250 : 100;
                sim.score += pts;
                sim.friendsThisLevel += 1;
                sim.friendsThisTier += 1;
                sim.totalFriendsRun += 1;

                soundEngine.playFriendSuccess(isBonus);
                spawnBurst(
                  sim,
                  npc.x,
                  npc.y,
                  isBonus ? '#FBBF24' : '#34D399',
                  18
                );
                pushNotice(
                  sim,
                  npc.x,
                  npc.y - 28,
                  isBonus
                    ? `Dating App Bonus! +${pts} pts`
                    : `New Friend ${npc.name}! +${pts} pts`,
                  isBonus ? '#FBBF24' : '#34D399'
                );

                // Remove befriended NPC smoothly & spawn fresh NPC on street
                sim.npcs.splice(i, 1);
                sim.npcs.push(
                  spawnSingleNPC(
                    tier,
                    sim.buildings,
                    Math.random() < 0.4 ? 'poly_phone' : 'poly_single'
                  )
                );

                // Check Level Up / Victory
                if (sim.friendsThisLevel >= tier.friendsPerLevel) {
                  if (sim.level >= 100) {
                    emitSnapshot(sim, 0, 1);
                    sim.ended = true;
                    soundEngine.playLevelUp();
                    onVictory({
                      score: sim.score,
                      levelReached: 100,
                      friendsMade: sim.totalFriendsRun,
                      potionsCollected: { ...sim.potionsCollectedTotal },
                    });
                    return;
                  }

                  const prevTier = tier.tier;
                  sim.level += 1;
                  sim.friendsThisLevel = 0;
                  sim.score += 300;
                  const nextTier = getTierForLevel(sim.level);
                  if (nextTier.tier !== prevTier) {
                    sim.friendsThisTier = 0;
                    sim.tierTimeRemaining = nextTier.timerSeconds;
                    // Refresh city NPCs with new tier difficulty (detectives at Lv 26+)
                    sim.npcs = createInitialNPCs(nextTier, sim.buildings);
                  }
                  soundEngine.playLevelUp();
                  sim.levelBannerTimer = 2.8;
                  sim.levelBannerText = `Level ${sim.level} · ${nextTier.name}`;
                  pushNotice(
                    sim,
                    sim.player.x,
                    sim.player.y - 40,
                    `Level ${sim.level} Unlocked! (+300)`,
                    '#FBBF24'
                  );
                }

                emitSnapshot(sim, 0, 1);
                emitHud(sim);
                continue;
              }
            }
          }

          // NPC Movement
          if (npc.followingPlayer && !npc.befriended) {
            // Follow closely behind player, able to enter doorways
            const targetDist = dist(npc.x, npc.y, sim.player.x, sim.player.y);
            if (targetDist > 34) {
              const ang = Math.atan2(
                sim.player.y - npc.y,
                sim.player.x - npc.x
              );
              const followSpd = sim.player.sprinting ? 295 : 195;
              npc.x += Math.cos(ang) * followSpd * dt;
              npc.y += Math.sin(ang) * followSpd * dt;
            }
            resolveBuildingCollisions(npc, sim.buildings, false, true);
          } else if (npc.detectiveState !== 'sparking') {
            npc.wanderTimer -= dt;
            if (
              npc.wanderTimer <= 0 ||
              dist(npc.x, npc.y, npc.targetX, npc.targetY) < 20
            ) {
              npc.wanderTimer = 2 + Math.random() * 4;
              npc.targetX = clamp(
                npc.x + (Math.random() - 0.5) * 420,
                80,
                WORLD_WIDTH - 80
              );
              npc.targetY = clamp(
                npc.y + (Math.random() - 0.5) * 420,
                80,
                WORLD_HEIGHT - 160
              );
            }
            const ang = Math.atan2(npc.targetY - npc.y, npc.targetX - npc.x);
            const walkSpd = 46 * tier.npcSpeedMultiplier;
            npc.x += Math.cos(ang) * walkSpd * dt;
            npc.y += Math.sin(ang) * walkSpd * dt;
            npc.x = clamp(npc.x, 40, WORLD_WIDTH - 40);
            npc.y = clamp(npc.y, 40, WORLD_HEIGHT - 40);
            resolveBuildingCollisions(npc, sim.buildings, false, false);
          }
        }

        // Update Potion Drop pulses
        for (const p of sim.potionDrops) {
          p.pulsePhase += dt * 3.4;
        }

        // Update Shockwaves
        for (let i = sim.shockwaves.length - 1; i >= 0; i--) {
          const sw = sim.shockwaves[i];
          sw.radius += 420 * dt;
          sw.alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);
          if (sw.radius >= sw.maxRadius) sim.shockwaves.splice(i, 1);
        }

        // Update Particles
        for (let i = sim.particles.length - 1; i >= 0; i--) {
          const pt = sim.particles[i];
          pt.x += pt.vx * dt;
          pt.y += pt.vy * dt;
          pt.life -= dt;
          if (pt.life <= 0) sim.particles.splice(i, 1);
        }

        // Update Floating Notices
        for (let i = sim.notices.length - 1; i >= 0; i--) {
          const nt = sim.notices[i];
          nt.y -= 22 * dt;
          nt.life -= dt;
          if (nt.life <= 0) sim.notices.splice(i, 1);
        }
      };

      const drawCharacter = (
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        skin: string,
        hair: string,
        hairStyle: CityNPC['hairStyle'],
        outfit: string,
        opts?: {
          isPlayer?: boolean;
          hasPhone?: boolean;
          hasRing?: boolean;
          isSparking?: boolean;
          sparkTimer?: number;
          following?: boolean;
          progress?: number;
          pulseTime?: number;
        }
      ) => {
        ctx.save();
        ctx.translate(x, y);

        // Ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.beginPath();
        ctx.ellipse(0, 12, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        if (opts?.isPlayer) {
          ctx.strokeStyle = '#FBBF24';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.arc(0, 0, 19, 0, Math.PI * 2);
          ctx.stroke();
        } else if (opts?.following) {
          ctx.strokeStyle = '#34D399';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.arc(0, 0, 20, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Sparking Detective Trap Visual (2s warning)
        if (opts?.isSparking) {
          const t = opts.pulseTime ?? 0;
          const r = 24 + Math.sin(t * 28) * 5;
          ctx.strokeStyle = '#FB923C';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, 145, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Body / Outfit
        ctx.fillStyle = outfit;
        ctx.beginPath();
        ctx.roundRect(-10, -2, 20, 15, 6);
        ctx.fill();

        // Head
        ctx.fillStyle = skin;
        ctx.beginPath();
        ctx.arc(0, -6, 9, 0, Math.PI * 2);
        ctx.fill();

        // Hair style
        ctx.fillStyle = hair;
        if (hairStyle === 'afro') {
          ctx.beginPath();
          ctx.arc(0, -9, 11.5, 0, Math.PI * 2);
          ctx.fill();
          // Re-draw lower face
          ctx.fillStyle = skin;
          ctx.beginPath();
          ctx.arc(0, -5, 7.5, 0, Math.PI);
          ctx.fill();
        } else if (hairStyle === 'bun') {
          ctx.beginPath();
          ctx.arc(0, -9, 9, Math.PI, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(0, -17, 5, 0, Math.PI * 2);
          ctx.fill();
        } else if (hairStyle === 'braids' || hairStyle === 'locs') {
          ctx.beginPath();
          ctx.arc(0, -9, 9.5, Math.PI * 0.9, Math.PI * 2.1);
          ctx.fill();
          ctx.fillRect(-10, -8, 3, 13);
          ctx.fillRect(7, -8, 3, 13);
        } else {
          ctx.beginPath();
          ctx.arc(0, -8.5, 9.2, Math.PI * 0.9, Math.PI * 2.1);
          ctx.fill();
        }

        // Glowing Dating-App Phone Signal
        if (opts?.hasPhone) {
          const glow = 0.7 + 0.3 * Math.sin((opts.pulseTime ?? 0) * 6);
          ctx.fillStyle = '#1E293B';
          ctx.fillRect(9, -2, 6, 9);
          ctx.fillStyle = `rgba(251, 191, 36, ${glow})`;
          ctx.fillRect(10, -1, 4, 7);
          ctx.strokeStyle = `rgba(251, 191, 36, ${glow * 0.65})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(12, 2, 7, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Ring / Commitment Indicator
        if (opts?.hasRing) {
          ctx.strokeStyle = '#F8FAFC';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(-11, 5, 3.2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#38BDF8';
          ctx.beginPath();
          ctx.arc(-11, 1.5, 2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Interaction progress ring
        if (opts?.progress && opts.progress > 0) {
          ctx.strokeStyle = '#34D399';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(
            0,
            0,
            24,
            -Math.PI / 2,
            -Math.PI / 2 + Math.PI * 2 * opts.progress
          );
          ctx.stroke();
        }

        ctx.restore();
      };

      const drawVehicle = (ctx: CanvasRenderingContext2D, v: Vehicle) => {
        ctx.save();
        if (v.kind === 'plane') {
          // Ground shadow
          ctx.fillStyle = 'rgba(0,0,0,0.22)';
          ctx.beginPath();
          ctx.ellipse(v.x + 48, v.y + 56, 36, 14, 0.25, 0, Math.PI * 2);
          ctx.fill();

          ctx.translate(v.x, v.y);
          ctx.rotate(Math.atan2(v.vy, v.vx));
          ctx.fillStyle = v.color;
          // Wings
          ctx.beginPath();
          ctx.moveTo(-6, -34);
          ctx.lineTo(12, 0);
          ctx.lineTo(-6, 34);
          ctx.lineTo(-16, 34);
          ctx.lineTo(-4, 0);
          ctx.lineTo(-16, -34);
          ctx.closePath();
          ctx.fill();
          // Fuselage
          ctx.beginPath();
          ctx.ellipse(0, 0, 34, 8, 0, 0, Math.PI * 2);
          ctx.fill();
          // Tail
          ctx.fillStyle = '#D96B43';
          ctx.fillRect(-34, -12, 8, 24);
          ctx.restore();
          return;
        }

        ctx.translate(v.x, v.y);
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.32)';
        ctx.fillRect(4, 5, v.w, v.h);

        if (v.kind === 'train') {
          // 3 connected train cars
          const carW = 68;
          for (let c = 0; c < 3; c++) {
            const cx = c * (carW + 6);
            ctx.fillStyle = v.color;
            ctx.beginPath();
            ctx.roundRect(cx, 0, carW, v.h, 6);
            ctx.fill();
            ctx.fillStyle = '#FDE68A';
            for (let w = 0; w < 4; w++) {
              ctx.fillRect(cx + 8 + w * 14, 7, 9, 8);
              ctx.fillRect(cx + 8 + w * 14, v.h - 15, 9, 8);
            }
          }
          ctx.restore();
          return;
        }

        // Road vehicles
        ctx.fillStyle = v.color;
        ctx.beginPath();
        ctx.roundRect(0, 0, v.w, v.h, v.kind === 'tricycle' ? 8 : 6);
        ctx.fill();

        // Windshield
        ctx.fillStyle = '#1E293B';
        if (v.w > v.h) {
          const frontX = v.vx >= 0 ? v.w - 16 : 6;
          ctx.fillRect(frontX, 5, 10, v.h - 10);
        } else {
          const frontY = v.vy >= 0 ? v.h - 16 : 6;
          ctx.fillRect(5, frontY, v.w - 10, 10);
        }

        // Distinct markers (Taxi sign, Bus stripes, Label)
        if (v.kind === 'taxi') {
          ctx.fillStyle = '#111827';
          ctx.fillRect(v.w / 2 - 7, v.h / 2 - 4, 14, 8);
        } else if (v.kind === 'bus') {
          ctx.fillStyle = '#FEF3C7';
          ctx.fillRect(6, 4, v.w - 12, 4);
        }

        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = '600 9px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(v.kind.toUpperCase(), v.w / 2, -5);
        ctx.restore();
      };

      const renderScene = (sim: SimState, nowSec: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const cw = canvas.clientWidth;
        const ch = canvas.clientHeight;
        if (canvas.width !== Math.floor(cw * dpr) || canvas.height !== Math.floor(ch * dpr)) {
          canvas.width = Math.floor(cw * dpr);
          canvas.height = Math.floor(ch * dpr);
        }

        ctx.save();
        ctx.scale(dpr, dpr);

        // Smooth camera centering
        const targetCamX = clamp(
          sim.player.x - cw / 2,
          0,
          Math.max(0, WORLD_WIDTH - cw)
        );
        const targetCamY = clamp(
          sim.player.y - ch / 2,
          0,
          Math.max(0, WORLD_HEIGHT - ch)
        );
        sim.camera.x += (targetCamX - sim.camera.x) * 0.16;
        sim.camera.y += (targetCamY - sim.camera.y) * 0.16;

        ctx.translate(-sim.camera.x, -sim.camera.y);

        // 1. Base Urban Ground (Warm twilight slate sidewalk blocks)
        ctx.fillStyle = '#2B313B';
        ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

        // Subtle urban tile grid
        ctx.strokeStyle = 'rgba(255,255,255,0.035)';
        ctx.lineWidth = 1;
        for (let gx = 0; gx <= WORLD_WIDTH; gx += 120) {
          ctx.beginPath();
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, WORLD_HEIGHT);
          ctx.stroke();
        }
        for (let gy = 0; gy <= WORLD_HEIGHT; gy += 120) {
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.lineTo(WORLD_WIDTH, gy);
          ctx.stroke();
        }

        // 2. Magnolia Public Park
        ctx.fillStyle = '#234F3E';
        ctx.beginPath();
        ctx.roundRect(PARK_RECT.x, PARK_RECT.y, PARK_RECT.w, PARK_RECT.h, 18);
        ctx.fill();
        ctx.strokeStyle = '#3C7A60';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Park walking paths & fountain
        ctx.fillStyle = '#C9BBA3';
        ctx.fillRect(PARK_RECT.x + 20, PARK_RECT.y + PARK_RECT.h / 2 - 12, PARK_RECT.w - 40, 24);
        ctx.fillRect(PARK_RECT.x + PARK_RECT.w / 2 - 12, PARK_RECT.y + 20, 24, PARK_RECT.h - 40);
        ctx.fillStyle = '#4B9AC4';
        ctx.beginPath();
        ctx.arc(
          PARK_RECT.x + PARK_RECT.w / 2,
          PARK_RECT.y + PARK_RECT.h / 2,
          28,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.strokeStyle = '#E5DEC9';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.fillStyle = 'rgba(244, 241, 234, 0.72)';
        ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          'Magnolia Public Park',
          PARK_RECT.x + PARK_RECT.w / 2,
          PARK_RECT.y + 24
        );

        // 3. Paved Avenues & Lane Stripes
        for (const rd of ROAD_RECTS) {
          ctx.fillStyle = '#1B1F26';
          ctx.fillRect(rd.x, rd.y, rd.w, rd.h);

          ctx.strokeStyle = '#EAB308';
          ctx.lineWidth = 2;
          ctx.setLineDash([18, 16]);
          ctx.beginPath();
          if (rd.dir === 'h') {
            ctx.moveTo(rd.x, rd.y + rd.h / 2);
            ctx.lineTo(rd.x + rd.w, rd.y + rd.h / 2);
          } else {
            ctx.moveTo(rd.x + rd.w / 2, rd.y);
            ctx.lineTo(rd.x + rd.w / 2, rd.y + rd.h);
          }
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // 4. Railway Track (South Avenue)
        ctx.fillStyle = '#202328';
        ctx.fillRect(0, RAIL_Y - 26, WORLD_WIDTH, 52);
        ctx.fillStyle = '#5C4636';
        for (let tx = 0; tx < WORLD_WIDTH; tx += 26) {
          ctx.fillRect(tx, RAIL_Y - 20, 8, 40);
        }
        ctx.fillStyle = '#94A3B8';
        ctx.fillRect(0, RAIL_Y - 14, WORLD_WIDTH, 3);
        ctx.fillRect(0, RAIL_Y + 11, WORLD_WIDTH, 3);

        // 5. Buildings & Private Enclosed Rooms
        for (const b of sim.buildings) {
          // Sidewalk apron
          ctx.fillStyle = '#3B424E';
          ctx.beginPath();
          ctx.roundRect(b.x - 16, b.y - 16, b.w + 32, b.h + 32, 12);
          ctx.fill();

          for (const r of b.rooms) {
            // Room interior floor
            ctx.fillStyle = r.floorColor;
            ctx.fillRect(r.x, r.y, r.w, r.h);

            // Cozy interior rug & table
            ctx.fillStyle = 'rgba(139, 90, 43, 0.14)';
            ctx.beginPath();
            ctx.roundRect(r.x + 28, r.y + 34, r.w - 56, r.h - 68, 8);
            ctx.fill();

            ctx.fillStyle = '#8B5A2B';
            ctx.beginPath();
            ctx.arc(r.x + r.w / 2, r.y + r.h / 2, 14, 0, Math.PI * 2);
            ctx.fill();

            // Walls
            ctx.strokeStyle = r.wallColor;
            ctx.lineWidth = 8;
            ctx.strokeRect(r.x, r.y, r.w, r.h);

            // Doorway cut or closed door
            if (!r.sealed) {
              ctx.fillStyle = r.floorColor;
              ctx.fillRect(r.doorX, r.doorY - 2, r.doorW, 12);
              // Open door leaf indicator
              ctx.fillStyle = '#D97706';
              ctx.fillRect(r.doorX, r.doorY - 14, 5, 18);
            } else {
              // Locked closed door
              ctx.fillStyle = '#F59E0B';
              ctx.fillRect(r.doorX, r.doorY - 1, r.doorW, 10);
            }

            // Windows (bright glass when open, shuttered when sealed)
            for (const win of r.windows) {
              ctx.fillStyle = r.sealed ? '#334155' : '#7DD3FC';
              ctx.fillRect(win.x, win.y, win.w, win.h);
            }

            // Sealed Ceiling Canopy Overlay (keeps interiors private)
            if (r.sealed) {
              ctx.fillStyle = 'rgba(20, 17, 24, 0.56)';
              ctx.fillRect(r.x + 4, r.y + 4, r.w - 8, r.h - 8);
              ctx.fillStyle = '#34D399';
              ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText(
                'PRIVATE · SEALED',
                r.x + r.w / 2,
                r.y + 20
              );
            }
          }

          // Building Header Sign
          ctx.fillStyle = '#14171C';
          ctx.beginPath();
          ctx.roundRect(b.x + 12, b.y - 34, Math.min(b.w - 24, 210), 22, 6);
          ctx.fill();
          ctx.fillStyle = '#F4F1EA';
          ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(b.name, b.x + 20, b.y - 19);
        }

        // 6. Glowing Sense Love Potions
        for (const pot of sim.potionDrops) {
          const meta = SENSE_BY_ID[pot.sense];
          const pulse = 1 + 0.16 * Math.sin(pot.pulsePhase);
          ctx.save();
          ctx.translate(pot.x, pot.y);

          // Glow aura
          const grad = ctx.createRadialGradient(0, 0, 3, 0, 0, 24 * pulse);
          grad.addColorStop(0, meta.glow);
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, 24 * pulse, 0, Math.PI * 2);
          ctx.fill();

          // Bottle silhouette
          ctx.fillStyle = meta.color;
          ctx.beginPath();
          ctx.arc(0, 3, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(-3.5, -10, 7, 7);
          ctx.fillStyle = '#FDE68A';
          ctx.fillRect(-4.5, -12, 9, 3);

          // Label
          ctx.fillStyle = '#F4F1EA';
          ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(meta.label, 0, 22);
          ctx.restore();
        }

        // 7. Ground Vehicles (all except plane)
        for (const v of sim.vehicles) {
          if (v.kind !== 'plane') drawVehicle(ctx, v);
        }

        // 8. Bomb Shockwaves
        for (const sw of sim.shockwaves) {
          ctx.strokeStyle = `rgba(249, 115, 22, ${sw.alpha})`;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
          ctx.stroke();
        }

        // 9. City NPCs
        const mouseWx = sim.mouseScreenX + sim.camera.x;
        const mouseWy = sim.mouseScreenY + sim.camera.y;
        let hoveredNpc: CityNPC | null = null;
        let hoveredPot: PotionDrop | null = null;

        if (sim.mouseInside) {
          for (const pot of sim.potionDrops) {
            if (dist(mouseWx, mouseWy, pot.x, pot.y) < 30) {
              hoveredPot = pot;
              break;
            }
          }
          if (!hoveredPot) {
            for (const npc of sim.npcs) {
              if (dist(mouseWx, mouseWy, npc.x, npc.y) < 28) {
                hoveredNpc = npc;
                break;
              }
            }
          }
        }

        for (const npc of sim.npcs) {
          const isHovered = hoveredNpc?.id === npc.id;
          const nearPlayer = dist(npc.x, npc.y, sim.player.x, sim.player.y) < 175;

          drawCharacter(
            ctx,
            npc.x,
            npc.y,
            npc.skinTone,
            npc.hairColor,
            npc.hairStyle,
            npc.outfitColor,
            {
              hasPhone: npc.hasPhone,
              hasRing: npc.hasRing,
              isSparking: npc.detectiveState === 'sparking',
              sparkTimer: npc.sparkTimer,
              following: npc.followingPlayer,
              progress: npc.interactionProgress,
              pulseTime: nowSec,
            }
          );

          // Signal tag when hovered or nearby
          if (isHovered || nearPlayer || npc.detectiveState === 'sparking') {
            let tag = '';
            let tagColor = '#E2E8F0';
            if (npc.detectiveState === 'sparking') {
              tag = `SPARK ${npc.sparkTimer.toFixed(1)}s · SHIFT!`;
              tagColor = '#FB923C';
            } else if (npc.kind === 'poly_phone') {
              tag = `${npc.name} · POLY · APP +BONUS`;
              tagColor = '#FBBF24';
            } else if (npc.kind === 'poly_single') {
              tag = `${npc.name} · POLY · SINGLE`;
              tagColor = '#34D399';
            } else if (npc.kind === 'marriage_seeker') {
              tag = `${npc.name} · RING (OFF-LIMITS)`;
              tagColor = '#FB7185';
            } else {
              tag = `${npc.name} · MONO`;
              tagColor = '#FDA4AF';
            }

            ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
            const tw = ctx.measureText(tag).width + 12;
            ctx.fillStyle = 'rgba(15, 18, 22, 0.86)';
            ctx.beginPath();
            ctx.roundRect(npc.x - tw / 2, npc.y - 36, tw, 16, 4);
            ctx.fill();
            ctx.fillStyle = tagColor;
            ctx.textAlign = 'center';
            ctx.fillText(tag, npc.x, npc.y - 25);
          }
        }

        // 10. Player Character
        drawCharacter(
          ctx,
          sim.player.x,
          sim.player.y,
          '#7D4E32',
          '#181412',
          'locs',
          '#D97706',
          { isPlayer: true, pulseTime: nowSec }
        );

        // Room Seal Hint right above Player when inside an open room
        const playerRoom = pointInAnyRoom(
          sim.player.x,
          sim.player.y,
          sim.buildings
        );
        if (playerRoom && !playerRoom.sealed) {
          ctx.fillStyle = 'rgba(15, 18, 22, 0.88)';
          ctx.beginPath();
          ctx.roundRect(sim.player.x - 95, sim.player.y - 44, 190, 18, 5);
          ctx.fill();
          ctx.fillStyle = '#FBBF24';
          ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Press E to Close Doors & Windows', sim.player.x, sim.player.y - 32);
        }

        // 11. Overhead Planes
        for (const v of sim.vehicles) {
          if (v.kind === 'plane') drawVehicle(ctx, v);
        }

        // 12. Particles & Floating Notices
        for (const pt of sim.particles) {
          ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
          ctx.fillStyle = pt.color;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        for (const nt of sim.notices) {
          ctx.globalAlpha = Math.min(1, nt.life / 0.5);
          ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
          const tw = ctx.measureText(nt.text).width + 16;
          ctx.fillStyle = 'rgba(14, 16, 20, 0.88)';
          ctx.beginPath();
          ctx.roundRect(nt.x - tw / 2, nt.y - 16, tw, 22, 6);
          ctx.fill();
          ctx.fillStyle = nt.color;
          ctx.textAlign = 'center';
          ctx.fillText(nt.text, nt.x, nt.y - 1);
        }
        ctx.globalAlpha = 1;

        // Hover cursor highlight on Potion
        if (hoveredPot) {
          ctx.strokeStyle = '#FDE68A';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(hoveredPot.x, hoveredPot.y, 18, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Level-up / Tier Banner (brief non-blocking toast inside top center of canvas)
        if (sim.levelBannerTimer > 0) {
          ctx.restore();
          ctx.save();
          ctx.scale(dpr, dpr);
          ctx.globalAlpha = Math.min(1, sim.levelBannerTimer);
          const bannerW = 340;
          ctx.fillStyle = 'rgba(18, 21, 26, 0.92)';
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(cw / 2 - bannerW / 2, 18, bannerW, 38, 10);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#FBBF24';
          ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(sim.levelBannerText, cw / 2, 42);
        }

        ctx.restore();
      };

      const loop = (now: number) => {
        const dt = Math.min(0.05, (now - lastTime) / 1000);
        lastTime = now;

        const sim = simRef.current;
        if (sim) {
          if (gameStateRef.current === 'PLAYING' && !sim.ended) {
            stepSimulation(sim, dt);
            if (now - sim.lastHudSync > 120) {
              sim.lastHudSync = now;
              emitHud(sim);
            }
          }
          renderScene(sim, now / 1000);
        }

        rafId = window.requestAnimationFrame(loop);
      };

      rafId = window.requestAnimationFrame(loop);
      return () => window.cancelAnimationFrame(rafId);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [runId]);

    return (
      <div className="relative flex-1 w-full h-full overflow-hidden bg-[#1D2229]">
        <canvas
          ref={canvasRef}
          className="block w-full h-full cursor-crosshair select-none"
        />
      </div>
    );
  }
);

GameCanvas.displayName = 'GameCanvas';
