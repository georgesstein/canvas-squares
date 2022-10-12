import * as I from './types'

export default class ConnectionArrowComponent {
  id: I.ConnectionArrowId
  from: I.ConnectionEnd
  to: I.ConnectionEnd

  constructor(p: { id: I.ConnectionArrowId; from: I.ConnectionEnd; to: I.ConnectionEnd }) {
    this.id = p.id
    this.from = p.from
    this.to = p.to
  }

  draw = (ctx: CanvasRenderingContext2D, color: string) => {
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.moveTo(this.from.socket.position.x, this.from.socket.position.y)
    ctx.lineTo(this.to.socket.position.x, this.to.socket.position.y)
    ctx.stroke()
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
