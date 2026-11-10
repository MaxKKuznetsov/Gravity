import { describe, expect, it } from 'vitest';
import { seededRandom } from '../src/core/random';
import { Vec2 } from '../src/core/Vec2';
import { Meteor } from '../src/entities/meteor';
import {
  DEFAULT_FRAGMENT_PARAMS,
  centerOfMass,
  keepFragments,
  splitMeteor,
  totalMass,
  totalMomentum,
} from '../src/game/fragmentation';

describe('splitMeteor', () => {
  const meteor = new Meteor(new Vec2(120, -80), new Vec2(35, 70), 6);

  it('на 2–3 осколка, масса делится без остатка', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const parts = splitMeteor(meteor, seededRandom(seed));
      expect(parts.length).toBeGreaterThanOrEqual(2);
      expect(parts.length).toBeLessThanOrEqual(3);
      expect(totalMass(parts)).toBeCloseTo(meteor.mass, 9);
    }
  });

  it('встречаются и 2, и 3 осколка', () => {
    const counts = new Set<number>();
    for (let seed = 1; seed <= 50; seed++) {
      counts.add(splitMeteor(meteor, seededRandom(seed)).length);
    }
    expect([...counts].sort()).toEqual([2, 3]);
  });

  it('импульс и центр масс сохраняются', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const parts = splitMeteor(meteor, seededRandom(seed));
      const p = totalMomentum(parts);
      expect(p.equals(meteor.velocity.scale(meteor.mass), 1e-9)).toBe(true);
      expect(centerOfMass(parts).equals(meteor.position, 1e-9)).toBe(true);
    }
  });

  it('осколки разлетаются в разные стороны', () => {
    const parts = splitMeteor(meteor, seededRandom(5));
    for (const part of parts) {
      const relative = part.velocity.sub(meteor.velocity);
      expect(relative.length()).toBeGreaterThan(1);
    }
    // Каждый осколок меньше исходного
    for (const part of parts) expect(part.radius).toBeLessThan(meteor.radius);
  });

  it('осколки легче minMass рассыпаются в пыль', () => {
    const small = new Meteor(Vec2.ZERO, Vec2.ZERO, 1.5);
    const parts = splitMeteor(small, seededRandom(2), {
      ...DEFAULT_FRAGMENT_PARAMS,
      minCount: 2,
      maxCount: 2,
    });
    // 1,5 на две части: каждая меньше 1
    expect(keepFragments(parts, 1)).toHaveLength(0);
    expect(keepFragments(parts, 0.1)).toHaveLength(2);
  });
});
