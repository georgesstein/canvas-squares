import SquareComponent from './square'

export type Position = {
  x: number
  y: number
}

export type SquareDTO = {
  id: SquareId
  position: Position
}

export type SquareId = string & { __idFor: 'Square' }

export type SquaresBoardState = {
  selectedSquareId: SquareId | null
  squares: Map<SquareId, SquareComponent>
}

export type LocalStorageState = {
  selectedSquareId: SquareId | null
  squares: SquareDTO[]
}