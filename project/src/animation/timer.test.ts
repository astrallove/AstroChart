import Timer from './timer'

describe('Timer', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      return setTimeout(() => cb(Date.now()), 16) as unknown as number
    })
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation((id: number) => {
      clearTimeout(id)
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
    jest.useRealTimers()
  })

  describe('constructor', () => {
    test('should throw if callback is not a function', () => {
      expect(() => new Timer(null as any, false)).toThrow("param 'callback' has to be a function.")
    })

    test('should throw if callback is a string', () => {
      expect(() => new Timer('not a function' as any, false)).toThrow()
    })

    test('should accept a valid callback', () => {
      const timer = new Timer(jest.fn(), false)
      expect(timer).toBeDefined()
    })

    test('should store debug flag', () => {
      const timer = new Timer(jest.fn(), true)
      expect(timer.debug).toBe(true)
    })
  })

  describe('start', () => {
    test('should invoke callback', () => {
      const cb = jest.fn()
      const timer = new Timer(cb, false)
      timer.start()
      expect(cb).toHaveBeenCalled()
    })

    test('should not start twice if already running', () => {
      const cb = jest.fn()
      const timer = new Timer(cb, false)
      timer.start()
      const callCount = cb.mock.calls.length
      timer.start()
      // Should not have been called again by a second start
      expect(cb.mock.calls.length).toBe(callCount)
    })
  })

  describe('stop', () => {
    test('should stop a running timer', () => {
      const cb = jest.fn()
      const timer = new Timer(cb, false)
      timer.start()
      expect(timer.isRunning()).toBe(true)
      timer.stop()
      expect(timer.isRunning()).toBe(false)
    })

    test('should not throw when stopping a non-running timer', () => {
      const timer = new Timer(jest.fn(), false)
      expect(() => timer.stop()).not.toThrow()
    })
  })

  describe('isRunning', () => {
    test('should return false before start', () => {
      const timer = new Timer(jest.fn(), false)
      expect(timer.isRunning()).toBe(false)
    })

    test('should return true after start', () => {
      const timer = new Timer(jest.fn(), false)
      timer.start()
      expect(timer.isRunning()).toBe(true)
    })

    test('should return false after stop', () => {
      const timer = new Timer(jest.fn(), false)
      timer.start()
      timer.stop()
      expect(timer.isRunning()).toBe(false)
    })
  })

  describe('tick', () => {
    test('should call callback with delta time', () => {
      const cb = jest.fn()
      const timer = new Timer(cb, false)
      timer.start()
      // The callback receives the delta time as a parameter
      expect(cb).toHaveBeenCalledWith(expect.any(Number))
    })
  })
})
