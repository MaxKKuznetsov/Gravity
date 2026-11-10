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
