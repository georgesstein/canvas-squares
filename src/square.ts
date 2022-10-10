import * as utils from './utils'

import * as I from './types'

export default class SquareComponent {
  id: I.SquareId
  position: Readonly<I.Position>
  size: number
  sockets: Record<I.SocketAlignment, I.Socket>
  socketRadius: number
  borderWidth: number
  canvasSize: { width: number; height: number }

  constructor(
    square: I.SquareDTO,
    options: { socketRadius: number; borderWidth: number; canvasSize: { width: number; height: number } },
  ) {
    this.id = square.id
    this.position = square.position
    this.size = square.size
    this.socketRadius = options.socketRadius
    this.borderWidth = options.borderWidth
    this.canvasSize = options.canvasSize

    const socketPosition = SquareComponent.getSocketPositions(this.position, this.size, this.socketRadius)

    this.sockets = {
      top: { position: socketPosition.top, alignment: 'top', enabled: square.sockets.top },
      right: { position: socketPosition.right, alignment: 'right', enabled: square.sockets.right },
      bottom: { position: socketPosition.bottom, alignment: 'bottom', enabled: square.sockets.bottom },
      left: { position: socketPosition.left, alignment: 'left', enabled: square.sockets.left },
    }
  }

  draw = (
    ctx: CanvasRenderingContext2D,
    options: {
      position: I.Position
      size: number
      squareBorderWidth: number
      isSquareSelected: boolean
      initialStrokeColor: string
      selectedStrokeColor: string
    },
  ) => {
    ctx.lineWidth = options.squareBorderWidth
    ctx.strokeStyle = options.initialStrokeColor

    // we need to correct position in order to make lines precise (canvas specifics)
    // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Applying_styles_and_colors#a_linewidth_example

    const isLineWidthEvenValue = options.squareBorderWidth % 2 === 0

    ctx.strokeRect(
      isLineWidthEvenValue ? options.position.x : options.position.x + 0.5,
      isLineWidthEvenValue ? options.position.y : options.position.y + 0.5,
      options.size,
      options.size,
    )

    const socketPositions = SquareComponent.getSocketPositions(
      { x: options.position.x, y: options.position.y },
      options.size,
      this.socketRadius,
    )

    for (const key in this.sockets) {
      const socketAlignmentKey = key as I.SocketAlignment
      const socket = this.sockets[socketAlignmentKey]

      if (options.isSquareSelected || socket.enabled) {
        this.drawSocket(ctx, {
          position: socketPositions[socketAlignmentKey],
          socketRadius: this.socketRadius,
          shouldFill: socket.enabled,
          color: options.isSquareSelected ? options.selectedStrokeColor : options.initialStrokeColor,
        })
      }
    }
  }

  private drawSocket = (
    ctx: CanvasRenderingContext2D,
    options: { position: I.Position; socketRadius: number; shouldFill: boolean; color: string },
  ) => {
    ctx.beginPath()
    ctx.fillStyle = options.color
    ctx.arc(options.position.x, options.position.y, options.socketRadius, 0, Math.PI * 2)

    if (options.shouldFill) ctx.fill()

    ctx.stroke()
  }

  toJSON = (): I.SquareDTO => {
    return {
      id: this.id,
      position: this.position,
      size: this.size,
      sockets: {
        top: this.sockets.top.enabled,
        right: this.sockets.right.enabled,
        bottom: this.sockets.bottom.enabled,
        left: this.sockets.left.enabled,
      },
    }
  }
  static getSocketPositions = (
    squarePosition: I.Position,
    squareSize: number,
    socketRadius: number,
  ): Record<I.SocketAlignment, I.Position> => {
    return {
      top: { x: squarePosition.x + squareSize / 2, y: squarePosition.y - socketRadius },
      right: { x: squarePosition.x + squareSize + socketRadius, y: squarePosition.y + squareSize / 2 },
      bottom: { x: squarePosition.x + squareSize / 2, y: squarePosition.y + squareSize + socketRadius },
      left: { x: squarePosition.x - socketRadius, y: squarePosition.y + squareSize / 2 },
    }
  }

  updatePosition = (p: {
    square: SquareComponent
    position: { x: number; y: number }
    size: number
    socketRadius: number
  }) => {
    const updatedSocketPositions = SquareComponent.getSocketPositions(p.position, p.size, p.socketRadius)
    const socketAlignments = Object.keys(this.sockets) as Array<I.SocketAlignment>
    socketAlignments.forEach((x) => (this.sockets[x].position = updatedSocketPositions[x]))

    return this.adjustPositionToFitWithinCanvas({ ...p })
  }

  private adjustPositionToFitWithinCanvas = (p: {
    square: SquareComponent
    size: number
    position: { x: number; y: number }
    socketRadius: number
  }) => {
    const squareOuterBorder = this.borderWidth / 2
    const socketDiameter = p.socketRadius * 2

    const minX = squareOuterBorder + socketDiameter
    const minY = squareOuterBorder + socketDiameter

    const maxX = this.canvasSize.width - p.size - squareOuterBorder - socketDiameter
    const maxY = this.canvasSize.height - p.size - squareOuterBorder - socketDiameter

    return (p.square.position = {
      x: utils.clamp(p.position.x, minX, maxX),
      y: utils.clamp(p.position.y, minY, maxY),
    })
  }
}
