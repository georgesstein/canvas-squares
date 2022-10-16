import * as I from './types'

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

export function drawLine(ctx: CanvasRenderingContext2D, p: { from: I.Position; to: I.Position }) {
  ctx.beginPath()
  ctx.strokeStyle = '#000'
  ctx.moveTo(p.from.x, p.from.y)
  ctx.lineTo(p.to.x, p.to.y)
  ctx.stroke()
}

export function drawArrowhead(ctx: CanvasRenderingContext2D, p: { from: I.Position; to: I.Position }) {
  const diffX = p.to.x - p.from.x
  const diffY = p.to.y - p.from.y

  ctx.beginPath()
  ctx.moveTo(p.from.x + 0.5 * diffY, p.from.y - 0.5 * diffX)
  ctx.lineTo(p.from.x - 0.5 * diffY, p.from.y + 0.5 * diffX)
  ctx.lineTo(p.to.x, p.to.y)
  ctx.closePath()
  ctx.fill()
}
