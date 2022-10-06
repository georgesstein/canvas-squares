import SquaresBoard from './squaresBoard'

const ROOT_EL_ID = 'root'
const rootEl = document.getElementById(ROOT_EL_ID)

if (rootEl === null) {
  throw Error(`Could not find root element with id: ${ROOT_EL_ID}`)
}

new SquaresBoard(rootEl)