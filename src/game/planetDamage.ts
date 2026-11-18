import {
  METEOR_MEDIUM_MAX_MASS,
  METEOR_SMALL_MAX_MASS,
  PLANET_DAMAGE_LARGE,
  PLANET_DAMAGE_MEDIUM,
  PLANET_DAMAGE_SMALL,
} from '../config';

// Класс размера метеорита для урона планете
export type MeteorSizeClass = 'small' | 'medium' | 'large';

export function meteorSizeClass(mass: number): MeteorSizeClass {
  if (mass <= METEOR_SMALL_MAX_MASS) return 'small';
  if (mass <= METEOR_MEDIUM_MAX_MASS) return 'medium';
  return 'large';
}

// Урон планете при падении метеорита данной массы
export function planetDamageFromMass(mass: number): number {
  switch (meteorSizeClass(mass)) {
    case 'small':
      return PLANET_DAMAGE_SMALL;
    case 'medium':
      return PLANET_DAMAGE_MEDIUM;
    case 'large':
      return PLANET_DAMAGE_LARGE;
  }
}

// Относительный размер кляксы на поверхности (доля радиуса планеты)
export function scarRadiusFactor(mass: number): number {
  switch (meteorSizeClass(mass)) {
    case 'small':
      return 0.12;
    case 'medium':
      return 0.18;
    case 'large':
      return 0.26;
  }
}
