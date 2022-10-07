import cuid from 'cuid'
import SquareComponent from './square'

import * as utils from './utils'

import * as I from './types'

type Options = {
  canvasSize: { width: number; height: number }
  canvasOutlineStyle: string
  squareSize: number
  squareBorderWidth: number
  defaultSquareStrokeColor: string
  selectedSquareStrokeColor: string
  resizeStepOfMouseWheel: number
}

const DEFAULT_OPTIONS: Options = {
  canvasSize: { width: 500, height: 500 },
  canvasOutlineStyle: '1px dashed #000',
  squareSize: 50,
  squareBorderWidth: 2,
  defaultSquareStrokeColor: 'black',
  selectedSquareStrokeColor: 'red',
  resizeStepOfMouseWheel: 4,
}

export default class SquaresBoard {
  private state: I.SquaresBoardState

  private rootEl: HTMLElement
  private canvasEl: HTMLCanvasElement
  private options: Options
  private ctx: CanvasRenderingContext2D

  private stateSubscribers: Set<(state: I.SquaresBoardState) => void> = new Set()

  constructor(
    rootEl: HTMLElement,
    initialState: I.LocalStorageState = { selectedSquareId: null, squares: [] },
    options: Options = DEFAULT_OPTIONS,
  ) {
    this.options = options

    const squares: Map<I.SquareId, SquareComponent> = new Map()

    initialState.squares.forEach((x) => squares.set(x.id, new SquareComponent(x)))

    this.state = { ...initialState, squares }

    this.rootEl = rootEl
    this.canvasEl = document.createElement('canvas')

    const canvasContext = this.canvasEl.getContext('2d')

    if (canvasContext === null) throw Error('Could not find canvasEl 2d context')

    this.ctx = canvasContext

    this.mount()
  }

  subscribeOnStateChange = (callback: (state: I.SquaresBoardState) => void) => this.stateSubscribers.add(callback)
  unsubscribeOnStateChange = (callback: (state: I.SquaresBoardState) => void) => this.stateSubscribers.delete(callback)

  private publishStateChange = () => this.stateSubscribers.forEach((callback) => callback(this.state))

  private addEventListeners = () => {
    // create square
    this.canvasEl.addEventListener('dblclick', (e) => {
      const cursorPosition = { x: e.offsetX, y: e.offsetY }
      const matchSquare = this.findSquareByPosition(cursorPosition)

      if (matchSquare) return

      this.addSquare(cursorPosition)
    })

    // resize selected square
    this.canvasEl.addEventListener('wheel', (e) => {
      if (this.state.selectedSquareId === null) return

      const matchSquare = this.findSquareByPosition({ x: e.offsetX, y: e.offsetY })

      if (matchSquare === null) return
      if (matchSquare.square.id !== this.state.selectedSquareId) return

      const isIncrement = e.deltaY > 0

      this.resizeSquare({
        square: matchSquare.square,
        by: isIncrement ? this.options.resizeStepOfMouseWheel : this.options.resizeStepOfMouseWheel * -1,
      })
    })

    // delete square
    // select square
    this.canvasEl.addEventListener('mousedown', (e) => {
      const isRightButtonClick = e.buttons === 2
      const isLeftButtonClick = e.buttons === 1
      const cursorPosition = { x: e.offsetX, y: e.offsetY }
      const squareMatch = this.findSquareByPosition(cursorPosition)

      if (squareMatch === null) {
        this.unselectSquare()
        return null
      }

      if (isRightButtonClick) this.removeSquare(squareMatch.square.id)
      if (isLeftButtonClick) this.selectSquare(squareMatch.square.id)
    })
  }

  private mount = () => {
    this.canvasEl.setAttribute('width', this.options.canvasSize.width.toString())
    this.canvasEl.setAttribute('height', this.options.canvasSize.height.toString())
    this.canvasEl.style.outline = this.options.canvasOutlineStyle

    this.canvasEl.oncontextmenu = () => false

    this.rootEl.append(this.canvasEl)

    this.clear()
    this.render()
    this.addEventListeners()
  }

  private addSquare = (position: { x: number; y: number }) => {
    const square = new SquareComponent({
      id: cuid() as I.SquareId,
      position: position,
      size: this.options.squareSize,
    })

    this.state.squares.set(square.id, square)
    this.render()
  }

  private selectSquare = (squareId: I.SquareId) => {
    this.state.selectedSquareId = squareId
    this.render()
  }

  private unselectSquare = () => {
    this.state.selectedSquareId = null
    this.render()
  }

  private removeSquare = (squareId: I.SquareId) => {
    if (this.state.selectedSquareId === squareId) {
      this.unselectSquare()
    }

    this.state.squares.delete(squareId)
    this.render()
  }

  private resizeSquare = (p: { square: SquareComponent; by: number }) => {
    const updatedSize = p.square.size + p.by

    // add min and max values to options
    TODO: if (updatedSize <= 30 || updatedSize >= 150) return
    if (this.canvasEl) p.square.size = updatedSize

    this.render()
  }

  private findSquareByPosition = (p: { x: number; y: number }): { square: SquareComponent } | null => {
    const squares = [...this.state.squares.values()]

    for (let i = squares.length - 1; i >= 0; i--) {
      const square = squares[i]

      const isClickWithinSquareArea = utils.getIsPointWithinSquareArea({
        point: { ...p },
        square: { x: square.position.x, y: square.position.y, size: square.size },
      })

      if (isClickWithinSquareArea === false) continue

      return { square }
    }

    return null
  }

  private drawSquare = (position: { x: number; y: number }, borderColor: string, size: number) => {
    this.ctx.lineWidth = this.options.squareBorderWidth
    this.ctx.strokeStyle = borderColor

    const isLineWidthEvenValue = this.options.squareBorderWidth % 2 === 0

    this.ctx.strokeRect(
      isLineWidthEvenValue ? position.x : position.x + 0.5,
      isLineWidthEvenValue ? position.y : position.y + 0.5,
      size,
      size,
    )
  }

  private clear = () => {
    this.ctx.clearRect(0, 0, this.options.canvasSize.width, this.options.canvasSize.height)
  }

  private render = () => {
    window.requestAnimationFrame(() => {
      this.clear()

      this.state.squares.forEach((square) => {
        this.drawSquare(
          square.position,
          square.id === this.state.selectedSquareId
            ? this.options.selectedSquareStrokeColor
            : this.options.defaultSquareStrokeColor,
          square.size,
        )
      })

      this.publishStateChange()
    })
  }
}
