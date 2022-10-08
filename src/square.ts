import * as I from './types'

export default class SquareComponent {
  id: I.SquareId
  position: I.Position
  size: number

  constructor(square: I.SquareDTO) {
    this.id = square.id
    this.position = square.position
    this.size = square.size
  }

  draw = (
    ctx: CanvasRenderingContext2D,
    options: {
      position: I.Position
      size: number
      borderColor: string
      squareBorderWidth: number
    },
  ) => {
    ctx.lineWidth = options.squareBorderWidth
    ctx.strokeStyle = options.borderColor

    const isLineWidthEvenValue = options.squareBorderWidth % 2 === 0

    ctx.strokeRect(
      isLineWidthEvenValue ? options.position.x : options.position.x + 0.5,
      isLineWidthEvenValue ? options.position.y : options.position.y + 0.5,
      options.size,
      options.size,
    )
  }
}
