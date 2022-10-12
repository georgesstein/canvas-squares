import SquareComponent from './square'
import ConnectionArrowComponent from './arrow'

export type SquareId = string & { __idFor: 'Square' }
export type ConnectionArrowId = string & { __idFor: 'ConnectionArrow'}
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

export type ConnectionArrowDTO = {
  id: ConnectionArrowId
  from: {
    squareId: SquareId
    socketAlignment: SocketAlignment
  },
  to: {
    squareId: SquareId
    socketAlignment: SocketAlignment
  }
}

export type ConnectionEnd = {
    square: SquareComponent
    socket: Socket
}

export type SquaresBoardState = {
  selectedSquareId: SquareId | null
  squares: Map<SquareId, SquareComponent>
  arrows: Map<ConnectionArrowId, ConnectionArrowComponent>
}

export type LocalStorageState = {
  selectedSquareId: SquareId | null
  squares: SquareDTO[]
  arrows: ConnectionArrowDTO[]
}