import * as I from './types'

export default class SquareComponent {
  id: I.SquareId
  position: I.Position
  size: number
  
  constructor(
    square: I.SquareDTO
  ) {
    this.id = square.id
    this.position = square.position
    this.size = square.size
  }
}