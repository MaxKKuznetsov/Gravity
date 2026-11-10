// Все настраиваемые константы игры

// Фиксированный шаг физики, секунды
export const DT = 1 / 120;

// Если вкладка была в фоне или кадр подвис, больше этого времени за один
// кадр не догоняем, иначе физика уйдёт в «спираль смерти»
export const MAX_FRAME_TIME = 0.25;

// Цвета
export const BACKGROUND_COLOR = '#05060a';
export const DEBUG_TEXT_COLOR = '#9fe870';
export const CROSSHAIR_COLOR = '#e0e6ff';
export const CROSSHAIR_FIRE_COLOR = '#ff6b4a';

// Корабль
// Ускорение от основного двигателя, пикс/с²
export const SHIP_THRUST = 220;
// Скорость поворота маневровыми двигателями, рад/с
export const SHIP_TURN_SPEED = 3.5;
// Предел скорости, пикс/с. Стоит с запасом: вторая космическая у поверхности
// планеты ≈ 410 пикс/с, так что орбитам он не мешает; 0 или Infinity — без
// ограничения
export const SHIP_MAX_SPEED = 600;
// Начальный угол: нос смотрит вверх (ось Y направлена вниз)
export const SHIP_START_ANGLE = -Math.PI / 2;
// Размер корпуса: расстояние от центра до носа, пикс
export const SHIP_SIZE = 14;
// Радиус корабля для столкновений, пикс (корпус — стрелка, берём чуть
// меньше SHIP_SIZE, чтобы задевание крылом не считалось ударом)
export const SHIP_COLLISION_RADIUS = 10;
// Где корабль появляется: на круговой орбите такого радиуса над планетой
// (по оси Y вверх), сразу со скоростью √(GM/r). 0 — без скорости
export const SHIP_START_ORBIT_RADIUS = 220;
// Через сколько секунд после взрыва появляется новый корабль
export const SHIP_RESPAWN_DELAY = 2;
export const SHIP_COLOR = '#d8e2ff';
export const SHIP_FLAME_COLOR = '#ffb347';
export const SHIP_FLAME_CORE_COLOR = '#fff3c4';
// Стрелка у края экрана, когда корабль улетел за его пределы
export const OFFSCREEN_MARKER_COLOR = '#ffb347';
export const OFFSCREEN_MARKER_MARGIN = 24;

// Планета (в центре мира, точка (0, 0))
// G·M планеты, пикс³/с². Подобрано под экран: на орбите r = 220 круговая
// скорость √(GM/r) ≈ 150 пикс/с, один оборот ≈ 9 с
export const PLANET_GM = 5_000_000;
export const PLANET_RADIUS = 60;
// rMin в формуле GM / max(r, rMin)²: не даёт ускорению улететь в
// бесконечность у центра. Корабль разбивается раньше, на поверхности,
// поэтому достаточно радиуса планеты
export const GRAVITY_MIN_RADIUS = PLANET_RADIUS;
export const PLANET_COLOR = '#3f7fbf';
export const PLANET_GLOW_COLOR = '#9cc8ff';

// Граница поля для корабля: круг вокруг планеты. За ним действует
// возвращающая «пружина» a = k · (r − R) к центру. Пока у камеры нет
// масштаба (он появится на этапе 7), круг подобран так, чтобы помещаться
// в экран ноутбука по высоте
export const FIELD_RADIUS = 400;
// Жёсткость пружины k, 1/с². При вылете на 100 пикс за край — 60 пикс/с²,
// это меньше тяги, так что выбраться за край можно, но далеко не улетишь
export const FIELD_RETURN_STIFFNESS = 0.6;
export const FIELD_BORDER_COLOR = 'rgba(255, 179, 71, 0.35)';
export const FIELD_WARNING_COLOR = '#ffb347';

// Пунктир предсказанной траектории (без учёта тяги)
// На сколько секунд вперёд считаем: чуть больше одного оборота на старте
export const TRAJECTORY_SECONDS = 10;
// Шаг предсказания, с. Крупнее DT ради скорости, точность для рисунка хватает
export const TRAJECTORY_STEP = 1 / 60;
export const TRAJECTORY_COLOR = 'rgba(159, 232, 112, 0.55)';
export const TRAJECTORY_IMPACT_COLOR = '#ff6b4a';

// Взрыв корабля
export const EXPLOSION_DURATION = 1.2;
export const EXPLOSION_RADIUS = 48;
export const EXPLOSION_COLOR = '#ffb347';

// Метеориты
// Сколько метеоритов одновременно в поле и как часто появляется новый, с
export const METEOR_MAX_COUNT = 2;
export const METEOR_SPAWN_INTERVAL = 1.5;
// Первый метеорит появляется через столько секунд после старта
export const METEOR_FIRST_SPAWN_DELAY = 1;
// Доля метеоритов на эллиптических орбитах, остальные летят по гиперболам
export const METEOR_ELLIPSE_FRACTION = 0.6;
// Масса в условных единицах. Радиус r = k · √m: площадь круга пропорциональна
// массе, как у плоских «блинов» одинаковой плотности
export const METEOR_MIN_MASS = 1;
export const METEOR_MAX_MASS = 9;
export const METEOR_RADIUS_PER_SQRT_MASS = 6;
// Эллипс: метеорит появляется в апоцентре на краю поля, перицентр выбирается
// случайно в этих пределах (пикс от центра планеты). Меньше радиуса планеты —
// такой метеорит в итоге упадёт на неё
export const METEOR_ELLIPSE_MIN_PERIAPSIS = 40;
export const METEOR_ELLIPSE_MAX_PERIAPSIS = 320;
// Гипербола: скорость в долях второй космической на краю поля
// (√(2GM/R) ≈ 158 пикс/с при R = 400) и отклонение направления от
// «прямо на планету», рад. Чем больше отклонение, тем дальше пролёт
export const METEOR_HYPERBOLA_MIN_SPEED_FACTOR = 1.05;
export const METEOR_HYPERBOLA_MAX_SPEED_FACTOR = 1.5;
export const METEOR_HYPERBOLA_MAX_AIM_OFFSET = 0.6;
// Вращение спрайта, рад/с (в обе стороны)
export const METEOR_MAX_SPIN = 1.5;
// Форма: неровный многоугольник из стольких вершин, каждая на расстоянии
// r · (1 ± ROUGHNESS) от центра
export const METEOR_SHAPE_VERTICES = 9;
export const METEOR_SHAPE_ROUGHNESS = 0.25;
export const METEOR_COLOR = '#8a7f72';
export const METEOR_EDGE_COLOR = '#c9bba8';
// Взрыв метеорита о планету: радиус кольца в долях радиуса метеорита
export const METEOR_EXPLOSION_SCALE = 2.2;
