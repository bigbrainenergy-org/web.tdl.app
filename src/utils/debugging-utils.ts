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
          console.log('Tracked:', event)
          if (options.debug) debugger // This will pause execution in the debugger
          console.trace('onTrack')
        }
      : undefined,
    onTrigger(event: unknown) {
      console.log('Triggered:', event)
      if (options.debug) debugger // This will pause execution in the debugger
      console.trace('onTrigger')
    }
  }
}
