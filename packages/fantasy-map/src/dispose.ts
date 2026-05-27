export interface FantasyMapDisposeRegistry {
  add: (cleanup: () => void) => void
  dispose: () => void
}

export function createFantasyMapDisposeRegistry(): FantasyMapDisposeRegistry {
  let disposed = false
  const cleanups: Array<() => void> = []

  return {
    add(cleanup: () => void): void {
      if (disposed) {
        cleanup()
        return
      }

      cleanups.push(cleanup)
    },
    dispose(): void {
      if (disposed)
        return

      disposed = true
      cleanups.splice(0).reverse().forEach(cleanup => cleanup())
    },
  }
}
