import {
  METEOR_MAX_COUNT,
  METEOR_SPAWN_INTERVAL,
  WAVE_BASE_QUOTA,
  WAVE_MAX_COUNT_CAP,
  WAVE_QUOTA_GROWTH,
  WAVE_SPAWN_INTERVAL_MIN,
  WAVE_SPAWN_INTERVAL_STEP,
} from '../config';
import type { MeteorSpawnParams } from './meteorSpawner';

// Параметры сложности одной волны. Номер волны начинается с 1.
export interface WaveSettings {
  readonly wave: number;
  // Сколько метеоритов нужно выпустить с края поля за эту волну
  readonly spawnQuota: number;
  readonly maxCount: number;
  readonly spawnInterval: number;
}

// Настройки волны по её номеру. Тесты могут подставить свои base*.
export function waveSettings(
  wave: number,
  baseMaxCount = METEOR_MAX_COUNT,
  baseSpawnInterval = METEOR_SPAWN_INTERVAL,
  baseQuota = WAVE_BASE_QUOTA,
  quotaGrowth = WAVE_QUOTA_GROWTH,
): WaveSettings {
  const n = Math.max(1, Math.floor(wave));
  // Пол не выше базового интервала: иначе тесты с коротким spawnInterval
  // неожиданно замедлялись бы до WAVE_SPAWN_INTERVAL_MIN
  const intervalFloor = Math.min(WAVE_SPAWN_INTERVAL_MIN, baseSpawnInterval);
  return {
    wave: n,
    spawnQuota: baseQuota + (n - 1) * quotaGrowth,
    maxCount: Math.min(WAVE_MAX_COUNT_CAP, baseMaxCount + (n - 1)),
    spawnInterval: Math.max(intervalFloor, baseSpawnInterval - (n - 1) * WAVE_SPAWN_INTERVAL_STEP),
  };
}

// Параметры спавнера с учётом текущей волны (квота волн живёт отдельно)
export function meteorParamsForWave(
  wave: number,
  base: MeteorSpawnParams,
  baseQuota = WAVE_BASE_QUOTA,
  quotaGrowth = WAVE_QUOTA_GROWTH,
): MeteorSpawnParams {
  const settings = waveSettings(wave, base.maxCount, base.spawnInterval, baseQuota, quotaGrowth);
  return {
    ...base,
    maxCount: settings.maxCount,
    spawnInterval: settings.spawnInterval,
  };
}
