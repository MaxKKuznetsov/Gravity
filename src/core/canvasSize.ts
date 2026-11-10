// Размер canvas в CSS-пикселях и в реальных пикселях экрана.
export interface CanvasSize {
  readonly cssWidth: number;
  readonly cssHeight: number;
  readonly pixelWidth: number;
  readonly pixelHeight: number;
  readonly scale: number;
}

// На экранах с высокой плотностью (devicePixelRatio = 2 и т.п.) внутренний
// буфер canvas делаем больше CSS-размера, иначе картинка будет мыльной.
export function computeCanvasSize(
  cssWidth: number,
  cssHeight: number,
  devicePixelRatio: number,
): CanvasSize {
  // Некорректный или нулевой ratio считаем за 1
  const scale = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1;
  return {
    cssWidth,
    cssHeight,
    pixelWidth: Math.max(1, Math.round(cssWidth * scale)),
    pixelHeight: Math.max(1, Math.round(cssHeight * scale)),
    scale,
  };
}
