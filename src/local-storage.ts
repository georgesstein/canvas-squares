import * as structs from './structs'
import * as I from './types'

export default abstract class CanvasSquaresLocalStorage {
  static STORAGE_PATH = 'CANVAS_SQUARES'

  static readState = (storageKey = CanvasSquaresLocalStorage.STORAGE_PATH): I.LocalStorageState | null => {
    const probableState = window.localStorage.getItem(storageKey)

    if (probableState === null) return null
    
    try {
      const parsedState: unknown = JSON.parse(probableState)
      structs.LocalStorageState.assert(parsedState)

      return parsedState
    } catch (e) {
      console.warn('Could not parse CanvasSquaresLocalStorage')
      window.localStorage.removeItem(CanvasSquaresLocalStorage.STORAGE_PATH)
    }
    
    return null
  }
  
  static writeState = (state: I.SquaresBoardState, storageKey = CanvasSquaresLocalStorage.STORAGE_PATH) => {
    const squares: I.LocalStorageState['squares'] = []

    state.squares.forEach((square) => {
      squares.push(square.toJSON())
    })

    const localStorageState: I.LocalStorageState = {
      selectedSquareId: state.selectedSquareId,
      squares,
      arrows: [...state.arrows.values()].map(x => x.toJSON())
    }

    const encoded = JSON.stringify(localStorageState)
    
    window.localStorage.setItem(storageKey, encoded)
  }
}
