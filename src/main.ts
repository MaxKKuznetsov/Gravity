import { BACKGROUND_COLOR } from './config';
import { computeCanvasSize } from './core/canvasSize';
import { FpsMeter } from './core/fpsMeter';
import {
  InputState,
  KEY_CONFIRM,
  KEY_CONFIRM_ALT,
  KEY_DEBUG,
  KEY_ESCAPE,
  KEY_PAUSE,
  KEY_RESTART,
  attachInput,
} from './core/input';
import { startLoop } from './core/loop';
import { createSession, restartGame, startGame, stepSession, togglePause } from './game/session';
import { readiness } from './game/weapon';
import { predictShipTrajectory } from './game/world';
import { isOutsideField } from './physics/boundary';
import { Camera } from './render/camera';
import { drawDebugOverlay } from './render/debugOverlay';
import { drawHud } from './render/hud';
import { drawMeteor } from './render/meteorRenderer';
import { drawGameScreen } from './render/screens';
import { drawOffscreenMarker, drawShip } from './render/shipRenderer';
import { drawBullet, drawCrosshair } from './render/weaponRenderer';
import {
  drawExplosion,
  drawFieldBorder,
  drawFieldWarning,
  drawPlanet,
  drawTrajectory,
} from './render/worldRenderer';

const canvas = document.querySelector<HTMLCanvasElement>('#game');
if (!canvas) {
  throw new Error('Не найден <canvas id="game"> в index.html');
}

const ctx = canvas.getContext('2d');
if (!ctx) {
  throw new Error('Браузер не поддерживает Canvas 2D');
}

const camera = new Camera();
const input = new InputState();
const fps = new FpsMeter();
const session = createSession();
const defeatSound = new Audio(`${import.meta.env.BASE_URL}sounds/you_lose.mp3`);
defeatSound.volume = 0.75;
const planetDestroyedSound = new Audio(
  `${import.meta.env.BASE_URL}sounds/yadernyiy-vzryiv--apokalipsis.mp3`,
);
planetDestroyedSound.volume = 0.85;
const cannonSound = new Audio(`${import.meta.env.BASE_URL}sounds/impactwatersmall04.mp3`);
cannonSound.volume = 0.65;
const meteorExplosionSound = new Audio(`${import.meta.env.BASE_URL}sounds/explosionCrunch_002.mp3`);
meteorExplosionSound.volume = 0.7;
const planetImpactSound = new Audio(
  `${import.meta.env.BASE_URL}sounds/gigantskiy-vzryiv--zemletryasenie.mp3`,
);
planetImpactSound.volume = 0.75;
const shipExplosionSound = new Audio(`${import.meta.env.BASE_URL}sounds/explosionCrunch_003.mp3`);
shipExplosionSound.volume = 0.8;
const mainEngineSound = new Audio(`${import.meta.env.BASE_URL}sounds/spaceEngineLarge_003.mp3`);
mainEngineSound.loop = true;
mainEngineSound.volume = 0.45;
const maneuverEngineSound = new Audio(`${import.meta.env.BASE_URL}sounds/spaceEngineSmall_000.mp3`);
maneuverEngineSound.loop = true;
maneuverEngineSound.volume = 0.4;
const spaceAtmosphereSound = new Audio(
  `${import.meta.env.BASE_URL}sounds/atmosfera-kosmicheskogo-prostranstra.mp3`,
);
spaceAtmosphereSound.loop = true;
spaceAtmosphereSound.volume = 0.3;
const respawnSound = new Audio(`${import.meta.env.BASE_URL}sounds/atmosfera-respawn.mp3`);
respawnSound.volume = 0.65;
let previousPhase = session.phase;
let shipWasDestroyed = false;
let debugVisible = false;
let highScore = readHighScore();
let previousShots = 0;
let previousCrashes = 0;
let previousMeteorsShot = 0;
let previousPlanetImpacts = 0;
interface Star {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly alpha: number;
  readonly color: string;
}
let stars: Star[] = [];

function readHighScore(): number {
  try {
    return Number(window.localStorage.getItem('gravity-high-score')) || 0;
  } catch {
    return 0;
  }
}

function playSound(sound: HTMLAudioElement): void {
  sound.currentTime = 0;
  void sound.play().catch(() => {
    // Браузер может запретить воспроизведение звука.
  });
}

function updateEngineSound(sound: HTMLAudioElement, active: boolean): void {
  if (active && sound.paused) {
    sound.currentTime = 0;
    void sound.play().catch(() => {
      // Браузер может запретить воспроизведение звука.
    });
  } else if (!active && !sound.paused) {
    sound.pause();
    sound.currentTime = 0;
  }
}

function generateStarfield(): void {
  const count = Math.max(
    90,
    Math.min(260, Math.round((camera.viewWidth * camera.viewHeight) / 6500)),
  );
  const exclusionRadius = 60 * camera.zoom * 1.9 + 14;
  const centerX = camera.viewWidth / 2;
  const centerY = camera.viewHeight / 2;
  const generated: Star[] = [];
  let attempts = 0;
  while (generated.length < count && attempts < count * 30) {
    attempts += 1;
    const x = Math.random() * camera.viewWidth;
    const y = Math.random() * camera.viewHeight;
    if (Math.hypot(x - centerX, y - centerY) < exclusionRadius) continue;
    generated.push({
      x,
      y,
      radius: 0.8 + Math.random() * 1.5,
      alpha: 0.5 + Math.random() * 0.5,
      color: Math.random() < 0.16 ? '#9cc8ff' : '#e0e6ff',
    });
  }
  stars = generated;
}

function drawStarfield(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  const exclusionRadius = 60 * camera.zoom * 1.9 + 14;
  for (const star of stars) {
    if (Math.hypot(star.x - camera.viewWidth / 2, star.y - camera.viewHeight / 2) < exclusionRadius)
      continue;
    ctx.globalAlpha = star.alpha;
    ctx.fillStyle = star.color;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Подгоняем буфер canvas под окно
function resize(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
  const size = computeCanvasSize(window.innerWidth, window.innerHeight, window.devicePixelRatio);
  canvas.width = size.pixelWidth;
  canvas.height = size.pixelHeight;
  // Дальше рисуем в CSS-пикселях, масштаб под плотность экрана берёт на себя transform
  ctx.setTransform(size.scale, 0, 0, size.scale, 0, 0);
  camera.setViewSize(size.cssWidth, size.cssHeight);
  generateStarfield();
}

// Меню читаем раз за кадр (в render): иначе при нескольких шагах
// физики пауза переключилась бы туда-сюда
function handleMenuInput(): void {
  const confirm =
    input.wasPressed(KEY_CONFIRM) || input.wasPressed(KEY_CONFIRM_ALT) || input.clickCount > 0;
  const restart = input.wasPressed(KEY_RESTART) || confirm;

  if (session.phase === 'title' && confirm) {
    startGame(session);
    generateStarfield();
    previousShots = 0;
    previousCrashes = 0;
    previousMeteorsShot = 0;
    previousPlanetImpacts = 0;
    shipWasDestroyed = false;
    return;
  }
  if (session.phase === 'gameover' && restart) {
    restartGame(session);
    generateStarfield();
    previousShots = 0;
    previousCrashes = 0;
    previousMeteorsShot = 0;
    previousPlanetImpacts = 0;
    shipWasDestroyed = false;
    return;
  }
  if (input.wasPressed(KEY_PAUSE) || input.wasPressed(KEY_ESCAPE)) {
    togglePause(session);
  }
}

window.addEventListener('resize', () => resize(canvas, ctx));
canvas.addEventListener(
  'wheel',
  (event) => {
    event.preventDefault();
    camera.setZoom(camera.zoom * (event.deltaY < 0 ? 1.1 : 1 / 1.1));
  },
  { passive: false },
);
resize(canvas, ctx);
attachInput(input, canvas);

startLoop({
  update(dt) {
    if (session.phase !== 'playing') return;
    const controls = input.controls();
    stepSession(session, controls, camera.screenToWorld(controls.aimScreen), dt);
    input.consumeClicks();
  },
  render(frameTime) {
    fps.tick(frameTime);

    handleMenuInput();
    if (session.phase === 'gameover' && previousPhase !== 'gameover') {
      playSound(session.world.planetHits <= 0 ? planetDestroyedSound : defeatSound);
    }
    previousPhase = session.phase;
    const controls = input.controls();
    updateEngineSound(spaceAtmosphereSound, session.phase === 'playing');
    updateEngineSound(mainEngineSound, session.phase === 'playing' && controls.thrust);
    updateEngineSound(maneuverEngineSound, session.phase === 'playing' && controls.turn !== 0);
    if (input.wasPressed(KEY_DEBUG)) debugVisible = !debugVisible;
    // Клики на экранах меню: физика их не съела
    if (session.phase !== 'playing') input.consumeClicks();
    input.endFrame();

    const { world } = session;
    if (session.phase === 'gameover') {
      shipWasDestroyed = false;
    } else if (session.phase === 'playing') {
      if (world.ship === null) shipWasDestroyed = true;
      else if (shipWasDestroyed) {
        playSound(respawnSound);
        shipWasDestroyed = false;
      }
    }
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, camera.viewWidth, camera.viewHeight);
    drawStarfield(ctx);
    ctx.save();
    ctx.translate(camera.viewWidth / 2, camera.viewHeight / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.viewWidth / 2, -camera.viewHeight / 2);
    drawFieldBorder(ctx, world.planet, world.params.fieldRadius, camera);
    if (session.phase === 'playing' || session.phase === 'paused') {
      const trajectory = predictShipTrajectory(world);
      if (trajectory) drawTrajectory(ctx, trajectory, camera);
    }
    drawPlanet(ctx, world.planet, camera, {
      scars: world.planetScars,
      cracked: world.defeatCause === 'planet' || world.planetHits <= 0,
    });
    for (const meteor of world.meteors) drawMeteor(ctx, meteor, camera);
    for (const bullet of world.bullets) drawBullet(ctx, bullet, camera);
    for (const explosion of world.explosions) drawExplosion(ctx, explosion, camera);

    const ship = world.ship;
    if (ship) {
      drawShip(ctx, ship, camera, world.time);
      drawOffscreenMarker(ctx, ship, camera);
      if (
        session.phase === 'playing' &&
        isOutsideField(ship.position, world.planet.position, world.params.fieldRadius)
      ) {
        drawFieldWarning(ctx, camera, world.time);
      }
    }

    // Вспышка и разлетающиеся искры при столкновениях.
    for (const explosion of world.explosions) {
      const age = explosion.age;
      const origin = camera.worldToScreen(explosion.position);
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - age / 0.55);
      ctx.fillStyle = '#ffb347';
      for (let i = 0; i < 12; i += 1) {
        const angle = (i * Math.PI * 2) / 12 + age * 2;
        const distance = explosion.radius * (0.25 + age * 1.2) * (0.65 + (i % 3) * 0.18);
        ctx.fillRect(
          origin.x + Math.cos(angle) * distance,
          origin.y + Math.sin(angle) * distance,
          2,
          2,
        );
      }
      ctx.restore();
    }
    ctx.restore();

    if (world.score > highScore) {
      highScore = world.score;
      try {
        window.localStorage.setItem('gravity-high-score', String(highScore));
      } catch {
        /* storage may be disabled */
      }
    }
    if (world.stats.shotsFired > previousShots) {
      playSound(cannonSound);
    }
    if (world.stats.meteorsShot > previousMeteorsShot) playSound(meteorExplosionSound);
    if (world.stats.meteorImpacts > previousPlanetImpacts) playSound(planetImpactSound);
    if (world.stats.crashes > previousCrashes) playSound(shipExplosionSound);
    previousShots = world.stats.shotsFired;
    previousCrashes = world.stats.crashes;
    previousMeteorsShot = world.stats.meteorsShot;
    previousPlanetImpacts = world.stats.meteorImpacts;

    if (session.phase === 'playing' || session.phase === 'paused') {
      drawHud(ctx, world, camera, highScore);
    }
    if (session.phase === 'playing') {
      drawCrosshair(ctx, input.mouseScreen, readiness(world.weapon), input.isMouseDown);
    }
    drawGameScreen(ctx, session, camera);

    if (debugVisible) {
      drawDebugOverlay(ctx, {
        fps: fps.fps,
        world,
        keysDown: input.keysDown(),
        mouseScreen: input.mouseScreen,
      });
    }
  },
});
