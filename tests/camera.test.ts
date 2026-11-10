import { describe, expect, it } from 'vitest';
import { Vec2 } from '../src/core/Vec2';
import { Camera } from '../src/render/camera';

describe('Camera', () => {
  it('центр экрана соответствует центру камеры в мире', () => {
    const cam = new Camera(new Vec2(100, 50), 800, 600);
    expect(cam.screenToWorld(new Vec2(400, 300))).toEqual(new Vec2(100, 50));
    expect(cam.screenToWorld(new Vec2(0, 0))).toEqual(new Vec2(-300, -250));
  });

  it('worldToScreen обратна screenToWorld', () => {
    const cam = new Camera(new Vec2(-20, 7), 1024, 768);
    const p = new Vec2(123, -45);
    expect(cam.worldToScreen(cam.screenToWorld(p)).equals(p)).toBe(true);
  });
});
