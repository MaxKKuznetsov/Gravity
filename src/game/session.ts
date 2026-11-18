import type { Controls } from '../core/input';
import type { Random } from '../core/random';
import type { Vec2 } from '../core/Vec2';
import { Planet } from '../entities/planet';
import {
  type World,
  type WorldParams,
  DEFAULT_WORLD_PARAMS,
  createWorld,
  stepWorld,
} from './world';

// Состояние партии. Тип-объединение строк: значение — одна из четырёх
// фаз; опечатку вроде 'playng' TypeScript не пропустит. В Python это
// Literal['title', 'playing', 'paused', 'gameover'].
export type GamePhase = 'title' | 'playing' | 'paused' | 'gameover';

export interface GameSession {
  phase: GamePhase;
  world: World;
  readonly planet: Planet;
  readonly params: WorldParams;
  readonly random: Random;
}

export function createSession(
  params: WorldParams = DEFAULT_WORLD_PARAMS,
  random: Random = Math.random,
  planet: Planet = new Planet(),
): GameSession {
  return {
    phase: 'title',
    world: createWorld(planet, params, random),
    planet,
    params,
    random,
  };
}

// Новая партия с чистым миром
export function startGame(session: GameSession): void {
  session.world = createWorld(session.planet, session.params, session.random);
  session.phase = 'playing';
}

export function restartGame(session: GameSession): void {
  startGame(session);
}

// Пауза только во время игры; с title/gameover не переключается
export function togglePause(session: GameSession): void {
  if (session.phase === 'playing') session.phase = 'paused';
  else if (session.phase === 'paused') session.phase = 'playing';
}

// Физика крутится только в фазе playing
export function stepSession(
  session: GameSession,
  controls: Controls,
  aimWorld: Vec2,
  dt: number,
): void {
  if (session.phase !== 'playing') return;
  stepWorld(session.world, controls, aimWorld, dt);
  if (session.world.defeated) session.phase = 'gameover';
}
