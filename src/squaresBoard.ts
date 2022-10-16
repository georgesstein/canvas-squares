import cuid from 'cuid'
import SquareComponent from './square'
import ConnectionArrowComponent from './arrow'

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
  squareBorderWidth: 1,
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
    initialState: I.LocalStorageState = { selectedSquareId: null, squares: [], arrows: [] },
    options: Options = DEFAULT_OPTIONS,
  ) {
    this.options = options

    const squares: Map<I.SquareId, SquareComponent> = new Map()
    const arrows: Map<I.ConnectionArrowId, ConnectionArrowComponent> = new Map()

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

    initialState.arrows.forEach((arrow) => {
      const squareFrom = squares.get(arrow.from.squareId)
      const squareTo = squares.get(arrow.to.squareId)

      if (!squareFrom || !squareTo) {
        console.warn('Inconsistent state, could not find required square in state by id')
        return
      }

      arrows.set(
        arrow.id,
        new ConnectionArrowComponent({
          id: arrow.id,
          from: {
            square: squareFrom,
            socket: squareFrom.sockets[arrow.from.socketAlignment],
          },
          to: {
            square: squareTo,
            socket: squareTo.sockets[arrow.to.socketAlignment],
          },
        }),
      )
    })

    this.state = { ...initialState, squares, arrows }

    this.rootEl = rootEl
    this.canvasEl = document.createElement('canvas')

    const canvasContext = this.canvasEl.getContext('2d')

    if (canvasContext === null) throw Error('Could not find canvasEl 2d context')

    this.ctx = canvasContext
    this.canvasEl.style.cursor = 'pointer'

    this.mount()
  }

  subscribeOnStateChange = (callback: (state: I.SquaresBoardState) => void) => this.stateSubscribers.add(callback)
  unsubscribeOnStateChange = (callback: (state: I.SquaresBoardState) => void) => this.stateSubscribers.delete(callback)

  private publishStateChange = () => this.stateSubscribers.forEach((callback) => callback(this.state))

  private onConnectionArrowDrag: null | {
    square: SquareComponent
    fromSocket: I.Socket
    mouseMoveEventListener: (e: MouseEvent) => void
  } = null

  private addEventListeners = () => {
    // create square
    this.canvasEl.addEventListener('dblclick', (e) => {
      const cursorPosition = { x: e.offsetX, y: e.offsetY }
      const matchSquare = this.findSquareByPosition(cursorPosition)

      if (matchSquare) return

      this.addSquare(cursorPosition)
    })

    // select/unselect/remove square
    this.canvasEl.addEventListener('mousedown', (e) => {
      const isLeftButtonClick = e.buttons === 1
      const isRightButtonClick = e.buttons === 2
      const cursorPosition = { x: e.offsetX, y: e.offsetY }
      const squareMatch = this.findSquareByPosition(cursorPosition)
      const clickTimestamp: number = Date.now()

      if (
        (isLeftButtonClick && this.onConnectionArrowDrag && !squareMatch) ||
        (isRightButtonClick && this.onConnectionArrowDrag && !squareMatch)
      ) {
        this.canvasEl.removeEventListener('mousemove', this.onConnectionArrowDrag.mouseMoveEventListener)
        this.onConnectionArrowDrag = null
      }

      if (squareMatch === null) {
        this.unselectSquare()
        this.render()
        return null
      }

      if (squareMatch.square.id !== this.state.selectedSquareId) {
        this.unselectSquare()
        this.render()
      }

      const foundSocket = squareMatch.foundSocket

      if (isRightButtonClick && !foundSocket) {
        this.removeSquare(squareMatch.square.id)
      }

      // enable socket or disable socket and arrows on it (if exist)
      if (foundSocket && squareMatch.square.id === this.state.selectedSquareId) {
        if (isLeftButtonClick) {
          foundSocket.enabled = true
          return this.render()
        }

        if (isRightButtonClick) {
          if (foundSocket.enabled === true) {
            const arrows = [...this.state.arrows.values()]

            arrows.map((x) => {
              if (x.from.socket === foundSocket || x.to.socket === foundSocket) {
                this.removeArrow(x.id)
              }
            })

            foundSocket.enabled = false

            return this.render()
          }
        }
      }

      // connection arrow dragging
      if (foundSocket) {
        if (isLeftButtonClick) {
          if (foundSocket.enabled) {
            if (this.onConnectionArrowDrag) {
              const from = { square: this.onConnectionArrowDrag.square, socket: this.onConnectionArrowDrag.fromSocket }
              const to = { square: squareMatch.square, socket: foundSocket }

              if (from.socket === to.socket) return

              this.addArrow(from, to)

              this.canvasEl.removeEventListener('mousemove', this.onConnectionArrowDrag.mouseMoveEventListener)
              this.onConnectionArrowDrag = null

              this.render()
              return
            }

            this.onConnectionArrowDrag = {
              square: squareMatch.square,
              fromSocket: foundSocket,
              mouseMoveEventListener: (e) => {
                const cursorPosition = {
                  x: e.offsetX,
                  y: e.offsetY,
                }
                const socketPosition = foundSocket.position

                this.render(() => {
                  utils.drawLine(this.ctx, {
                    from: socketPosition,
                    to: cursorPosition,
                  })
                })
              },
            }

            this.canvasEl.addEventListener('mousemove', this.onConnectionArrowDrag.mouseMoveEventListener)
          }
        }
      }

      if (foundSocket) return

      this.canvasEl.addEventListener('mouseup', () => {
        const mouseUpTimestamp = Date.now()

        if (mouseUpTimestamp - clickTimestamp < 200) {
          if (isLeftButtonClick && !foundSocket) this.selectSquare(squareMatch.square.id)
        }
      })

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

  private addArrow = (from: I.ConnectionEnd, to: I.ConnectionEnd) => {
    const arrow = new ConnectionArrowComponent({ id: cuid() as I.ConnectionArrowId, from, to })
    this.state.arrows.set(arrow.id, arrow)
    this.render()
  }

  private removeArrow = (arrow: I.ConnectionArrowId) => {
    this.state.arrows.delete(arrow)
    this.render()
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
    const arrows = [...this.state.arrows.values()]

    arrows.map((x) => {
      if (x.from.square.id === squareId || x.to.square.id === squareId) {
        this.removeArrow(x.id)
      }
    })

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

  private render = (callback?: () => void) => {
    window.requestAnimationFrame(() => {
      this.clear()

      this.state.arrows.forEach((arrow) => {
        arrow.draw(this.ctx, {
          socketRadius: this.options.socketRadius,
          borderWidth: this.options.squareBorderWidth,
          color: this.options.defaultSquareStrokeColor,
        })
      })

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
        })
      })

      if (callback) callback()

      this.publishStateChange()
    })
  }
}
