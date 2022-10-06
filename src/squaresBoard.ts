type Options = {
  canvasSize: { width: number; height: number }
  canvasOutlineStyle: string
  squareSize: number
  squareBorderWidth: number
}

const DEFAULT_OPTIONS: Options = {
  canvasSize: { width: 500, height: 500 },
  canvasOutlineStyle: '1px dashed #000',
  squareSize: 50,
  squareBorderWidth: 1,
}

export default class SquaresBoard {
  private rootEl: HTMLElement
  private canvasEl: HTMLCanvasElement
  private options: Options
  private ctx: CanvasRenderingContext2D

  constructor(rootEl: HTMLElement, options: Options = DEFAULT_OPTIONS) {
    this.options = options
    this.rootEl = rootEl
    this.canvasEl = document.createElement('canvas')

    const canvasContext = this.canvasEl.getContext('2d')

    if (canvasContext === null) throw Error('Could not find canvasEl 2d context')

    this.ctx = canvasContext

    this.mount()
  }

  private mount = () => {
    this.canvasEl.setAttribute('width', this.options.canvasSize.width.toString())
    this.canvasEl.setAttribute('height', this.options.canvasSize.height.toString())
    this.canvasEl.style.outline = this.options.canvasOutlineStyle

    this.rootEl.append(this.canvasEl)
  }
}
