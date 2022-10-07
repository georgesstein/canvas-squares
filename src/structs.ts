import * as I from './types'
import { Struct, string, object, number, array, nullable } from 'superstruct'

const squareId = (): Struct<I.SquareId, null> => string() as any

export const Square: Struct<I.SquareDTO> = object({
  id: squareId(),
  position: object({
    x: number(),
    y: number(),
  }),
  size: number()
})

export const LocalStorageState: Struct<I.LocalStorageState> = object({
  selectedSquareId: nullable(squareId()),
  squares: array(Square),
})
