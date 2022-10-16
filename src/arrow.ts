import * as I from './types'
import * as utils from './utils'

export default class ConnectionArrowComponent {
  id: I.ConnectionArrowId
  from: I.ConnectionEnd
  to: I.ConnectionEnd

  constructor(p: { id: I.ConnectionArrowId; from: I.ConnectionEnd; to: I.ConnectionEnd }) {
    this.id = p.id
    this.from = p.from
    this.to = p.to
  }

  draw = (ctx: CanvasRenderingContext2D, p: { socketRadius: number; borderWidth: number; color: string }) => {
    const spacing = p.socketRadius + p.borderWidth + 1
    ctx.strokeStyle = p.color

    const from = { x: this.from.socket.position.x, y: this.from.socket.position.y }
    const to = { x: this.to.socket.position.x, y: this.to.socket.position.y }

    const diff = {
      x: Math.abs(to.x - from.x),
      y: Math.abs(to.y - from.y),
    }

    if (diff.x > diff.y) {
      const halfwayX = (from.x + to.x) / 2

      utils.drawLine(ctx, {
        from: { x: from.x > to.x ? from.x - spacing : from.x + spacing, y: from.y },
        to: { x: halfwayX, y: from.y },
      })
      utils.drawLine(ctx, { from: { x: halfwayX, y: from.y }, to: { x: halfwayX, y: to.y } })
      utils.drawLine(ctx, {
        from: { x: halfwayX, y: to.y },
        to: { x: to.x > from.x ? to.x - spacing : to.x + spacing, y: to.y },
      })

      // draw arrowhead
      if (from.x > to.x) {
        utils.drawArrowhead(ctx, {
          from: { x: to.x + 10 + spacing, y: to.y },
          to: { x: to.x + spacing, y: to.y },
        })
      } else {
        utils.drawArrowhead(ctx, {
          from: { x: to.x - 10 - spacing, y: to.y },
          to: { x: to.x - spacing, y: to.y },
        })
      }
    } else {
      const halfwayY = (from.y + to.y) / 2

      utils.drawLine(ctx, {
        from: { x: from.x, y: from.y > to.y ? from.y - spacing : from.y + spacing },
        to: { x: from.x, y: halfwayY },
      })
      utils.drawLine(ctx, { from: { x: from.x, y: halfwayY }, to: { x: to.x, y: halfwayY } })
      utils.drawLine(ctx, {
        from: { x: to.x, y: halfwayY },
        to: { x: to.x, y: to.y > from.y ? to.y - spacing : to.y + spacing },
      })

      // draw arrowhead
      if (from.y > to.y) {
        utils.drawArrowhead(ctx, {
          from: { x: to.x, y: to.y + 10 + spacing },
          to: { x: to.x, y: to.y + spacing },
        })
      } else {
        utils.drawArrowhead(ctx, {
          from: { x: to.x, y: to.y - 10 - spacing },
          to: { x: to.x, y: to.y - spacing },
        })
      }
    }
  }

  toJSON = (): I.ConnectionArrowDTO => {
    return {
      id: this.id,
      from: {
        squareId: this.from.square.id,
        socketAlignment: this.from.socket.alignment,
      },
      to: {
        squareId: this.to.square.id,
        socketAlignment: this.to.socket.alignment,
      },
    }
  }
}
