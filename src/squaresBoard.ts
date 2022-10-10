import cuid from 'cuid'
import SquareComponent from './square'

import * as utils from './utils'

import * as I from './types'

type Options = Readonly<{
  canvasSize: { width: number; height: number }
  canvasOutlineStyle: string
  squareSize: number
  minSquareSize: number
  maxSquareSize: number
  squareBorderWidth: number
  defaultSquareStrokeColor: string
  selectedSquareStrokeColor: string
  resizeStepOfMouseWheel: number
  socketRadius: number
}>

export const DEFAULT_OPTIONS: Options = {
  canvasSize: { width: 500, height: 500 },
  canvasOutlineStyle: '1px dashed #000',
  squareSize: 50,
  minSquareSize: 30,
  maxSquareSize: 150,
  squareBorderWidth: 2,
  defaultSquareStrokeColor: 'black',
  selectedSquareStrokeColor: 'red',
  resizeStepOfMouseWheel: 4,
  socketRadius: 5,
}

export default class SquaresBoard {
  private state: I.SquaresBoardState

  private rootEl: HTMLElement
  private canvasEl: HTMLCanvasElement
  private options: Options
  private ctx: CanvasRenderingContext2D

  private stateSubscribers: Set<(state: I.SquaresBoardState) => void> = new Set()
  private onSquareDrag: null | ((e: MouseEvent) => void) = null

  constructor(
    rootEl: HTMLElement,
    initialState: I.LocalStorageState = { selectedSquareId: null, squares: [] },
    options: Options = DEFAULT_OPTIONS,
  ) {
    this.options = options

    const squares: Map<I.SquareId, SquareComponent> = new Map()

    initialState.squares.forEach((square) =>
      squares.set(
        square.id,
        new SquareComponent(square, {
          socketRadius: this.options.socketRadius,
          borderWidth: this.options.squareBorderWidth,
          canvasSize: this.options.canvasSize,
        }),
      ),
    )

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

    // select square
    // delete square
    this.canvasEl.addEventListener('mousedown', (e) => {
      const isLeftButtonClick = e.buttons === 1
      const isRightButtonClick = e.buttons === 2
      const cursorPosition = { x: e.offsetX, y: e.offsetY }
      const squareMatch = this.findSquareByPosition(cursorPosition)

      if (squareMatch === null) {
        this.unselectSquare()
        return null
      }

      const foundSocket = squareMatch.foundSocket

      if (foundSocket) {
        if (isLeftButtonClick) {
          foundSocket.enabled = true
          return this.render()
        }

        if (isRightButtonClick) {
          if (foundSocket.enabled === true) {
            foundSocket.enabled = false
            return this.render()
          }
        }
      }

      if (isLeftButtonClick) this.selectSquare(squareMatch.square.id)
      if (isRightButtonClick) this.removeSquare(squareMatch.square.id)

      this.squareDraggingStart({ square: squareMatch.square, initialCursorPosition: { x: e.x, y: e.y } })
    })

    // resize selected square
    this.canvasEl.addEventListener('wheel', (e) => {
      if (this.state.selectedSquareId === null) return

      const matchSquare = this.findSquareByPosition({ x: e.offsetX, y: e.offsetY, shouldBeSelected: true })

      if (matchSquare === null) return
      if (matchSquare.square.id !== this.state.selectedSquareId) return

      const isIncrement = e.deltaY > 0

      this.resizeSquare({
        square: matchSquare.square,
        by: isIncrement ? this.options.resizeStepOfMouseWheel : this.options.resizeStepOfMouseWheel * -1,
        squarePosition: matchSquare.square.position,
      })
    })
  }

  // drag and drop square
  private squareDraggingStart = (p: { square: SquareComponent; initialCursorPosition: { x: number; y: number } }) => {
    const initialSquarePosition = { ...p.square.position }

    this.onSquareDrag = (e) => {
      const changedCursorPosition = { x: e.x, y: e.y }

      const diff = {
        x: changedCursorPosition.x - p.initialCursorPosition.x,
        y: changedCursorPosition.y - p.initialCursorPosition.y,
      }

      const updatedX = initialSquarePosition.x + diff.x
      const updatedY = initialSquarePosition.y + diff.y

      p.square.position = p.square.updatePosition({
        square: p.square,
        size: p.square.size,
        position: { x: updatedX, y: updatedY },
        socketRadius: this.options.socketRadius,
      })

      this.render()
    }

    document.addEventListener('mousemove', this.onSquareDrag)
    document.addEventListener('mouseup', this.squareDraggingEnd)
  }

  private squareDraggingEnd = () => {
    document.removeEventListener('mouseup', this.squareDraggingEnd)

    if (this.onSquareDrag === null) return

    document.removeEventListener('mousemove', this.onSquareDrag)
    this.onSquareDrag = null
  }

  private addSquare = (position: { x: number; y: number }) => {
    const square = new SquareComponent(
      {
        id: cuid() as I.SquareId,
        position: position,
        size: this.options.squareSize,
        sockets: {
          top: false,
          right: false,
          bottom: false,
          left: false,
        },
      },
      {
        socketRadius: this.options.socketRadius,
        borderWidth: this.options.squareBorderWidth,
        canvasSize: this.options.canvasSize,
      },
    )

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

  private resizeSquare = (p: { square: SquareComponent; by: number; squarePosition: { x: number; y: number } }) => {
    const updatedSize = p.square.size + p.by

    if (updatedSize <= this.options.minSquareSize || updatedSize >= this.options.maxSquareSize) return

    p.square.position = p.square.updatePosition({
      square: p.square,
      size: updatedSize,
      position: p.square.position,
      socketRadius: this.options.socketRadius,
    })

    p.square.size = updatedSize

    this.render()
  }

  private findSquareByPosition = (p: {
    x: number
    y: number
    shouldBeSelected?: boolean
  }): { square: SquareComponent; foundSocket?: I.Socket } | null => {
    const squares = [...this.state.squares.values()]

    if (p.shouldBeSelected && this.state.selectedSquareId === null) return null

    for (let i = squares.length - 1; i >= 0; i--) {
      const square = squares[i]

      for (const key in square.sockets) {
        const alignmentKey = key as I.SocketAlignment
        const socket = square.sockets[alignmentKey] as I.Socket
        const socketPosition = socket.position
        const radius = this.options.socketRadius

        const isSocketClicked = utils.getIsPointWithinSquareArea({
          point: { ...p },
          square: { x: socketPosition.x - radius, y: socketPosition.y - radius, size: radius * 2 },
        })

        if (isSocketClicked) {
          return { square, foundSocket: socket }
        }
      }

      const isClickWithinSquareArea = utils.getIsPointWithinSquareArea({
        point: { ...p },
        square: { x: square.position.x, y: square.position.y, size: square.size },
      })

      if (isClickWithinSquareArea === false) continue

      return { square }
    }

    return null
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

  private clear = () => {
    this.ctx.clearRect(0, 0, this.options.canvasSize.width, this.options.canvasSize.height)
  }

  private render = () => {
    window.requestAnimationFrame(() => {
      this.clear()

      this.state.squares.forEach((square) => {
        square.draw(this.ctx, {
          position: square.position,
          size: square.size,
          squareBorderWidth: this.options.squareBorderWidth,
          initialStrokeColor:
            square.id === this.state.selectedSquareId
              ? this.options.selectedSquareStrokeColor
              : this.options.defaultSquareStrokeColor,
          isSquareSelected: square.id === this.state.selectedSquareId,
          selectedStrokeColor: this.options.selectedSquareStrokeColor,
        })
      })

      this.publishStateChange()
    })
  }
}
