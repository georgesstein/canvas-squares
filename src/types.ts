import SquareComponent from './square'

export type SquareId = string & { __idFor: 'Square' }
export type SocketAlignment = 'top' | 'right' | 'bottom' | 'left'

export type Position = {
  x: number
  y: number
}

export type SquareDTO = {
  id: SquareId
  position: Position
  size: number
  sockets: Record<SocketAlignment, boolean>
}

export type Socket = {
  position: Position
  alignment: SocketAlignment
  enabled: boolean
}

export type SquaresBoardState = {
  selectedSquareId: SquareId | null
  squares: Map<SquareId, SquareComponent>
}

export type LocalStorageState = {
  selectedSquareId: SquareId | null
  squares: SquareDTO[]
}