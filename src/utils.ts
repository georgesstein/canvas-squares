export function getIsPointWithinSquareArea(p: {
  point: { x: number; y: number }
  square: { x: number; y: number; size: number }
}): boolean {
  const x = p.point.x > p.square.x && p.point.x < p.square.x + p.square.size
  const y = p.point.y > p.square.y && p.point.y < p.square.y + p.square.size

  return x && y
}

export function clamp(num: number, min: number, max: number) {
  return Math.min(Math.max(num, min), max)
}
