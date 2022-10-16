import SquaresBoard from './squaresBoard'
import CanvasSquaresLocalStorage from './local-storage'

const ROOT_EL_ID = 'root'
const rootEl = document.getElementById(ROOT_EL_ID)

if (rootEl === null) {
  throw Error(`Could not find root element with id: ${ROOT_EL_ID}`)
}

const initialState = CanvasSquaresLocalStorage.readState() || undefined

new SquaresBoard(rootEl, initialState).subscribeOnStateChange(CanvasSquaresLocalStorage.writeState)
