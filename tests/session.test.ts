import { describe, expect, it } from 'vitest';
import type { Controls } from '../src/core/input';
import { Vec2 } from '../src/core/Vec2';
import { DEFAULT_FRAGMENT_PARAMS } from '../src/game/fragmentation';
import { DEFAULT_METEOR_PARAMS } from '../src/game/meteorSpawner';
import {
  createSession,
  restartGame,
  startGame,
  stepSession,
  togglePause,
} from '../src/game/session';
import type { WorldParams } from '../src/game/world';

const idle: Controls = { turn: 0, thrust: false, fire: false, aimScreen: Vec2.ZERO };

const params: WorldParams = {
  fieldRadius: 1000,
  fieldStiffness: 0.6,
  startOrbitRadius: 220,
  respawnDelay: 0.1,
  meteors: { ...DEFAULT_METEOR_PARAMS, maxCount: 0 },
  fragments: DEFAULT_FRAGMENT_PARAMS,
  startingLives: 1,
  planetMaxHits: 25,
  scorePerMass: 100,
  waveBaseQuota: 0,
  waveQuotaGrowth: 0,
};

describe('GameSession', () => {
  it('стартует на титульном экране', () => {
    const session = createSession(params);
    expect(session.phase).toBe('title');
  });

  it('startGame переводит в playing и сбрасывает мир', () => {
    const session = createSession(params);
    session.world.score = 50;
    startGame(session);
    expect(session.phase).toBe('playing');
    expect(session.world.score).toBe(0);
    expect(session.world.lives).toBe(1);
  });

  it('пауза переключается только из playing', () => {
    const session = createSession(params);
    togglePause(session);
    expect(session.phase).toBe('title');
    startGame(session);
    togglePause(session);
    expect(session.phase).toBe('paused');
    togglePause(session);
    expect(session.phase).toBe('playing');
  });

  it('на паузе физика не идёт', () => {
    const session = createSession(params);
    startGame(session);
    togglePause(session);
    const ticks = session.world.ticks;
    stepSession(session, idle, Vec2.ZERO, 1 / 120);
    expect(session.world.ticks).toBe(ticks);
  });

  it('после последней жизни — gameover', () => {
    const session = createSession(params);
    startGame(session);
    if (session.world.ship) {
      session.world.ship.position = new Vec2(0, -69);
      session.world.ship.velocity = Vec2.ZERO;
    }
    // Два шага: сближение и столкновение
    stepSession(session, idle, Vec2.ZERO, 1 / 120);
    stepSession(session, idle, Vec2.ZERO, 1 / 120);
    expect(session.world.defeated).toBe(true);
    expect(session.world.defeatCause).toBe('ship');
    expect(session.phase).toBe('gameover');
  });

  it('restartGame начинает партию заново', () => {
    const session = createSession(params);
    startGame(session);
    session.world.score = 999;
    session.phase = 'gameover';
    restartGame(session);
    expect(session.phase).toBe('playing');
    expect(session.world.score).toBe(0);
    expect(session.world.ship).not.toBeNull();
  });
});
