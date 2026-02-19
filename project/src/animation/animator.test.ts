import Animator from './animator'
import Timer from './timer'
import type { Settings } from '../settings'
import default_settings from '../settings'

// Mock Timer to avoid real animation frames
jest.mock('./timer', () => {
  return jest.fn().mockImplementation((callback: (delta: number) => void) => {
    return {
      start: jest.fn(),
      stop: jest.fn(),
      callback,
    }
  })
})

function makeTransitMock(planets: Record<string, number[]> = { Sun: [45], Moon: [135] }) {
  const cusps = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]

  // Create a minimal paper mock
  const paperElementId = 'chart-astrology'
  const paper = {
    _paperElementId: paperElementId,
    root: {
      namespaceURI: 'http://www.w3.org/2000/svg',
      id: paperElementId,
    },
    line: jest.fn(() => {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      return el
    }),
    getSymbol: jest.fn(() => {
      return document.createElementNS('http://www.w3.org/2000/svg', 'g')
    }),
    text: jest.fn(() => {
      return document.createElementNS('http://www.w3.org/2000/svg', 'text')
    }),
  }

  return {
    data: {
      planets,
      cusps: [...cusps],
    },
    paper,
    cx: 400,
    cy: 400,
    drawPoints: jest.fn(),
  }
}

describe('Animator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    document.body.innerHTML = '<div id="chart-astrology"><g id="chart-astrology-transit-cusps"></g></div>'
  })

  describe('constructor', () => {
    test('should create animator with transit and settings', () => {
      const transit = makeTransitMock()
      const animator = new Animator(transit as any, default_settings)
      expect(animator).toBeDefined()
      expect(animator.isReverse).toBe(false)
      expect(animator.rotation).toBe(0)
    })

    test('should copy planet positions from transit data', () => {
      const planets = { Sun: [45], Moon: [135] }
      const transit = makeTransitMock(planets)
      const animator = new Animator(transit as any, default_settings)
      expect(animator.actualPlanetPos.Sun).toStrictEqual([45])
      expect(animator.actualPlanetPos.Moon).toStrictEqual([135])
    })

    test('should initialize timer with update callback', () => {
      const transit = makeTransitMock()
      const animator = new Animator(transit as any, default_settings)
      expect(Timer).toHaveBeenCalledWith(expect.any(Function), default_settings.DEBUG)
      expect(animator.timer).toBeDefined()
    })

    test('should set timeSinceLoopStart to 0', () => {
      const transit = makeTransitMock()
      const animator = new Animator(transit as any, default_settings)
      expect(animator.timeSinceLoopStart).toBe(0)
    })

    test('should set cuspsElement to null initially', () => {
      const transit = makeTransitMock()
      const animator = new Animator(transit as any, default_settings)
      expect(animator.cuspsElement).toBeNull()
    })
  })

  describe('animate', () => {
    test('should set data and duration', () => {
      const transit = makeTransitMock()
      const animator = new Animator(transit as any, default_settings)

      const targetData = {
        planets: { Sun: [90], Moon: [180] },
        cusps: [10, 40, 70, 100, 130, 160, 190, 220, 250, 280, 310, 340],
      }
      animator.animate(targetData, 2, false, jest.fn())

      expect(animator.data).toBe(targetData)
      expect(animator.duration).toBe(2000) // 2 seconds * 1000
      expect(animator.isReverse).toBe(false)
    })

    test('should default isReverse to false when not provided', () => {
      const transit = makeTransitMock()
      const animator = new Animator(transit as any, default_settings)

      const targetData = {
        planets: { Sun: [90] },
        cusps: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
      }
      animator.animate(targetData, 1, undefined as any, jest.fn())

      expect(animator.isReverse).toBe(false)
    })

    test('should reset rotation to 0', () => {
      const transit = makeTransitMock()
      const animator = new Animator(transit as any, default_settings)
      animator.rotation = 100

      const targetData = {
        planets: { Sun: [90] },
        cusps: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
      }
      animator.animate(targetData, 1, false, jest.fn())

      expect(animator.rotation).toBe(0)
    })

    test('should look up cuspsElement by ID', () => {
      const transit = makeTransitMock()
      const animator = new Animator(transit as any, default_settings)

      const targetData = {
        planets: { Sun: [90] },
        cusps: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
      }
      animator.animate(targetData, 1, false, jest.fn())

      expect(animator.cuspsElement).not.toBeNull()
    })

    test('should start the timer', () => {
      const transit = makeTransitMock()
      const animator = new Animator(transit as any, default_settings)

      const targetData = {
        planets: { Sun: [90] },
        cusps: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
      }
      animator.animate(targetData, 1, false, jest.fn())

      expect(animator.timer.start).toHaveBeenCalled()
    })

    test('should store callback', () => {
      const transit = makeTransitMock()
      const animator = new Animator(transit as any, default_settings)

      const cb = jest.fn()
      const targetData = {
        planets: { Sun: [90] },
        cusps: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
      }
      animator.animate(targetData, 1, false, cb)

      expect(animator.callback).toBe(cb)
    })

    test('should set isReverse to true when specified', () => {
      const transit = makeTransitMock()
      const animator = new Animator(transit as any, default_settings)

      const targetData = {
        planets: { Sun: [90] },
        cusps: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
      }
      animator.animate(targetData, 1, true, jest.fn())

      expect(animator.isReverse).toBe(true)
    })
  })

  describe('update', () => {
    test('should increment timeSinceLoopStart by deltaTime', () => {
      const transit = makeTransitMock()
      const animator = new Animator(transit as any, default_settings)

      // Set up data for updatePlanets/updateCusps
      animator.data = {
        planets: { Sun: [90] },
        cusps: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
      }
      animator.duration = 10000
      animator.cuspsElement = document.getElementById('chart-astrology-transit-cusps')

      animator.update(100)
      expect(animator.timeSinceLoopStart).toBe(100)
    })

    test('should default deltaTime to 1 if not provided', () => {
      const transit = makeTransitMock()
      const animator = new Animator(transit as any, default_settings)

      animator.data = {
        planets: { Sun: [90] },
        cusps: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
      }
      animator.duration = 10000
      animator.cuspsElement = document.getElementById('chart-astrology-transit-cusps')

      animator.update()
      expect(animator.timeSinceLoopStart).toBe(1)
    })

    test('should stop timer and call callback when duration exceeded', () => {
      const transit = makeTransitMock()
      const animator = new Animator(transit as any, default_settings)

      const cb = jest.fn()
      animator.callback = cb
      animator.duration = 100
      animator.timeSinceLoopStart = 90

      animator.update(20) // 90 + 20 = 110 >= 100

      expect(animator.timer.stop).toHaveBeenCalled()
      expect(cb).toHaveBeenCalled()
    })

    test('should stop timer but not throw when callback is not a function', () => {
      const transit = makeTransitMock()
      const animator = new Animator(transit as any, default_settings)

      animator.callback = null as any
      animator.duration = 100
      animator.timeSinceLoopStart = 90

      animator.update(20)

      expect(animator.timer.stop).toHaveBeenCalled()
    })

    test('should call updatePlanets and updateCusps when animation continues', () => {
      const transit = makeTransitMock()
      const animator = new Animator(transit as any, default_settings)

      animator.data = {
        planets: { Sun: [90] },
        cusps: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
      }
      animator.duration = 10000
      animator.cuspsElement = document.getElementById('chart-astrology-transit-cusps')

      // Spy on updatePlanets and updateCusps
      const updatePlanetsSpy = jest.spyOn(animator as any, 'updatePlanets')
      const updateCuspsSpy = jest.spyOn(animator as any, 'updateCusps')

      animator.update(100)

      expect(updatePlanetsSpy).toHaveBeenCalled()
      expect(updateCuspsSpy).toHaveBeenCalled()
    })
  })

  describe('updateCusps', () => {
    test('should update cusps element transform attribute', () => {
      const transit = makeTransitMock()
      const animator = new Animator(transit as any, default_settings)

      animator.data = {
        planets: { Sun: [90] },
        cusps: [10, 40, 70, 100, 130, 160, 190, 220, 250, 280, 310, 340],
      }
      animator.cuspsElement = document.getElementById('chart-astrology-transit-cusps')

      animator.updateCusps(5)

      const transform = animator.cuspsElement.getAttribute('transform')
      expect(transform).toContain('rotate')
    })

    test('should remove transform when expectedNumberOfLoops is 1', () => {
      const transit = makeTransitMock()
      const animator = new Animator(transit as any, default_settings)

      animator.data = {
        planets: { Sun: [90] },
        cusps: [10, 40, 70, 100, 130, 160, 190, 220, 250, 280, 310, 340],
      }
      animator.cuspsElement = document.getElementById('chart-astrology-transit-cusps')

      animator.updateCusps(1)

      expect(animator.cuspsElement.hasAttribute('transform')).toBe(false)
    })

    test('should handle negative targetCuspAngle by wrapping', () => {
      const transit = makeTransitMock({ Sun: [350] })
      // transit.data.cusps[0] is 0, target cusps[0] is 350
      const animator = new Animator(transit as any, default_settings)

      animator.data = {
        planets: { Sun: [90] },
        cusps: [350, 20, 50, 80, 110, 140, 170, 200, 230, 260, 290, 320],
      }
      animator.cuspsElement = document.getElementById('chart-astrology-transit-cusps')

      // Should not throw
      animator.updateCusps(5)
      const transform = animator.cuspsElement.getAttribute('transform')
      expect(transform).toContain('rotate')
    })

    test('should handle isReverse mode', () => {
      const transit = makeTransitMock()
      const animator = new Animator(transit as any, default_settings)
      animator.isReverse = true

      animator.data = {
        planets: { Sun: [90] },
        cusps: [10, 40, 70, 100, 130, 160, 190, 220, 250, 280, 310, 340],
      }
      animator.cuspsElement = document.getElementById('chart-astrology-transit-cusps')

      animator.updateCusps(5)

      const transform = animator.cuspsElement.getAttribute('transform')
      expect(transform).toContain('rotate')
    })

    test('should handle ANIMATION_CUSPS_ROTATION_SPEED > 0 in reverse mode', () => {
      const settings = { ...default_settings, ANIMATION_CUSPS_ROTATION_SPEED: 2 }
      const transit = makeTransitMock()
      const animator = new Animator(transit as any, settings)
      animator.isReverse = true

      animator.data = {
        planets: { Sun: [90] },
        cusps: [10, 40, 70, 100, 130, 160, 190, 220, 250, 280, 310, 340],
      }
      animator.cuspsElement = document.getElementById('chart-astrology-transit-cusps')

      animator.updateCusps(5)

      const transform = animator.cuspsElement.getAttribute('transform')
      expect(transform).toContain('rotate')
    })

    test('should handle ANIMATION_CUSPS_ROTATION_SPEED of 0', () => {
      const settings = { ...default_settings, ANIMATION_CUSPS_ROTATION_SPEED: 0 }
      const transit = makeTransitMock()
      const animator = new Animator(transit as any, settings)

      animator.data = {
        planets: { Sun: [90] },
        cusps: [10, 40, 70, 100, 130, 160, 190, 220, 250, 280, 310, 340],
      }
      animator.cuspsElement = document.getElementById('chart-astrology-transit-cusps')

      animator.updateCusps(5)

      const transform = animator.cuspsElement.getAttribute('transform')
      expect(transform).toContain('rotate')
    })
  })

  describe('updatePlanets', () => {
    test('should update planet positions and call drawPoints', () => {
      const transit = makeTransitMock({ Sun: [45] })
      const animator = new Animator(transit as any, default_settings)

      animator.data = {
        planets: { Sun: [90] },
        cusps: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
      }

      animator.updatePlanets(5)

      // actualPlanetPos should have been updated
      expect(animator.actualPlanetPos.Sun[0]).not.toBe(45) // Should have moved
      expect(transit.drawPoints).toHaveBeenCalledWith(animator.actualPlanetPos)
    })

    test('should handle retrograde planets', () => {
      const transit = makeTransitMock({ Saturn: [200, -1] })
      const animator = new Animator(transit as any, default_settings)

      animator.data = {
        planets: { Saturn: [180, -1] },
        cusps: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
      }

      animator.updatePlanets(5)

      expect(transit.drawPoints).toHaveBeenCalled()
    })

    test('should handle reverse mode', () => {
      const transit = makeTransitMock({ Sun: [45] })
      const animator = new Animator(transit as any, default_settings)
      animator.isReverse = true

      animator.data = {
        planets: { Sun: [90] },
        cusps: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
      }

      animator.updatePlanets(5)

      expect(transit.drawPoints).toHaveBeenCalled()
    })

    test('should handle reverse mode with retrograde planets', () => {
      const transit = makeTransitMock({ Saturn: [200, -1] })
      const animator = new Animator(transit as any, default_settings)
      animator.isReverse = true

      animator.data = {
        planets: { Saturn: [180, -1] },
        cusps: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
      }

      animator.updatePlanets(5)

      expect(transit.drawPoints).toHaveBeenCalled()
    })

    test('should handle negative newPos by wrapping around', () => {
      const transit = makeTransitMock({ Sun: [5] })
      const animator = new Animator(transit as any, default_settings)
      animator.isReverse = true

      animator.data = {
        planets: { Sun: [350] },
        cusps: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
      }

      animator.updatePlanets(1) // big increment in reverse

      // Position should wrap around to positive
      expect(animator.actualPlanetPos.Sun[0]).toBeGreaterThanOrEqual(0)
      expect(transit.drawPoints).toHaveBeenCalled()
    })

    test('should handle zero crossing in difference calculation', () => {
      const transit = makeTransitMock({ Sun: [350] })
      const animator = new Animator(transit as any, default_settings)

      animator.data = {
        planets: { Sun: [10] },
        cusps: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
      }

      animator.updatePlanets(5)

      expect(transit.drawPoints).toHaveBeenCalled()
    })
  })
})
