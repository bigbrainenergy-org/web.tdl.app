import { autoContrastTextColor } from './color-utils'

export class Logger {
  private prefix
  private bgColor
  constructor(prefix: string, bgColor?: string) {
    this.bgColor = bgColor ?? Logger.randomColor()
    this.prefix = [
      `%c[ ${prefix} ]`,
      `background: ${this.bgColor}; color: ${autoContrastTextColor(this.bgColor)}; padding: 2px 6px; border-radius: 3px;`
    ]
  }
  static randomColor() {
    const hue = Math.floor(Math.random() * 360)
    return `hsl(${hue}, 70%, 50%)`
  }
  public log(...args: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    console.log(...this.prefix, ...args)
  }
  public warn(...args: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    console.warn(...this.prefix, ...args)
  }
  public debug(...args: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    console.debug(...this.prefix, ...args)
  }
  public error(...args: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    console.error(...this.prefix, ...args)
  }
  public trace(...args: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    console.trace(...this.prefix, ...args)
  }
  public assert(value: boolean, ...args: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    console.assert(value, ...this.prefix, ...args)
  }
}

const computedDebugLog = new Logger('Computed Debug')
export function debugComputed(
  options: { debug: boolean; verbose: boolean } = {
    debug: false,
    verbose: false
  }
) {
  return {
    // if verbose is enabled, this might log hundreds of thousands of things to console.
    onTrack: options.verbose
      ? (event: unknown) => {
          computedDebugLog.log('Tracked:', event)
          if (options.debug) debugger // This will pause execution in the debugger
          computedDebugLog.trace('onTrack')
        }
      : undefined,
    onTrigger(event: unknown) {
      computedDebugLog.log('Triggered:', event)
      if (options.debug) debugger // This will pause execution in the debugger
      computedDebugLog.trace('onTrigger')
    }
  }
}