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
// Предел скорости, пикс/с. Ставим с запасом, чтобы на этапе 3 он не мешал
// орбитам; 0 или Infinity — без ограничения
export const SHIP_MAX_SPEED = 600;
// Начальный угол: нос смотрит вверх (ось Y направлена вниз)
export const SHIP_START_ANGLE = -Math.PI / 2;
// Размер корпуса: расстояние от центра до носа, пикс
export const SHIP_SIZE = 14;
export const SHIP_COLOR = '#d8e2ff';
export const SHIP_FLAME_COLOR = '#ffb347';
export const SHIP_FLAME_CORE_COLOR = '#fff3c4';
// Стрелка у края экрана, когда корабль улетел за его пределы
export const OFFSCREEN_MARKER_COLOR = '#ffb347';
export const OFFSCREEN_MARKER_MARGIN = 24;
