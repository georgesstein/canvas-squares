import * as I from './types'
import { Struct, string, object, number, array, nullable, boolean, union, literal } from 'superstruct'

const squareId = (): Struct<I.SquareId, null> => string() as any

export const Square: Struct<I.SquareDTO> = object({
  id: squareId(),
  position: object({
    x: number(),
    y: number(),
  }),
  size: number(),
  sockets: object({
    top: boolean(),
    right: boolean(),
    bottom: boolean(),
    left: boolean(),
  }),
})

const connectionArrowId = (): Struct<I.ConnectionArrowId, null> => string() as any
const socket: Struct<I.SocketAlignment> = union([literal('top'), literal('right'), literal('bottom'), literal('left')])

export const ConnectionArrow: Struct<I.ConnectionArrowDTO> = object({
  id: connectionArrowId(),
  from: object({
    squareId: squareId(),
    socketAlignment: socket,
  }),
  to: object({
    squareId: squareId(),
    socketAlignment: socket,
  }),
})

export const LocalStorageState: Struct<I.LocalStorageState> = object({
  selectedSquareId: nullable(squareId()),
  squares: array(Square),
  arrows: array(ConnectionArrow)
})
