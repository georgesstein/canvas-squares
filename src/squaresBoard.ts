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
}

const DEFAULT_OPTIONS: Options = {
  canvasSize: { width: 500, height: 500 },
  canvasOutlineStyle: '1px dashed #000',
  squareSize: 50,
  squareBorderWidth: 1,
  defaultSquareStrokeColor: 'black',
  selectedSquareStrokeColor: 'red',
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
    this.canvasEl.addEventListener('dblclick', (e) => {
      const cursorPosition = { x: e.offsetX, y: e.offsetY }

      this.addSquare(cursorPosition)
    })

    this.canvasEl.addEventListener('mousedown', (e) => {
      const isRightButtonClick = e.button === 2
      const isLeftButtonClick = e.button === 0
      const cursorPosition = { x: e.offsetX, y: e.offsetY }
      const squareMatch = this.findSquareByPosition(cursorPosition)

      if (squareMatch === null) return null

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

  private removeSquare = (squareId: I.SquareId) => {
    this.state.squares.delete(squareId)
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

  private drawSquare = (position: { x: number; y: number }, borderColor: string) => {
    this.ctx.lineWidth = this.options.squareBorderWidth
    this.ctx.strokeStyle = borderColor
    this.ctx.strokeRect(position.x + 0.5, position.y + 0.5, this.options.squareSize, this.options.squareSize)
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
        )
      })

      this.publishStateChange()
    })
  }
}
