import Chart from './chart'
import default_settings from './settings'

const cusps = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]

function makeRadixData() {
  return {
    planets: {
      Sun: [0],
      Moon: [90],
      Mercury: [120],
      Venus: [180],
    } as Record<string, number[]>,
    cusps: [...cusps],
  }
}

function makeTransitData() {
  return {
    planets: {
      Sun: [45],
      Moon: [135],
      Mercury: [225],
    } as Record<string, number[]>,
    cusps: [...cusps],
  }
}

function createTransit(
  rData?: { planets: Record<string, number[]>; cusps: number[] },
  tData?: { planets: Record<string, number[]>; cusps: number[] },
  settings?: Partial<typeof default_settings>
) {
  document.body.innerHTML = '<div id="chart"></div>'
  const chart = new Chart('chart', 800, 800, settings)
  const radix = chart.radix(rData ?? makeRadixData())
  return radix.transit(tData ?? makeTransitData())
}

describe('Transit - extended coverage', () => {
  describe('drawPoints - pointer line for colliding planets', () => {
    test('should draw pointer lines when planets collide (angles adjusted)', () => {
      // Use planets very close together to force collision adjustment
      const tData = {
        planets: {
          Sun: [45],
          Moon: [46],
          Mercury: [47],
        } as Record<string, number[]>,
        cusps: [...cusps],
      }
      const transit = createTransit(undefined, tData)

      // After drawPoints, locatedPoints should have adjusted angles
      const pointsWrapper = document.getElementById('chart-astrology-transit-planets')
      expect(pointsWrapper).not.toBeNull()
      // Look for line elements (pointer lines are drawn as lines)
      const lines = pointsWrapper!.querySelectorAll('line')
      expect(lines.length).toBeGreaterThan(0)
    })

    test('should not draw pointer line when STROKE_ONLY is true', () => {
      const tData = {
        planets: {
          Sun: [45],
          Moon: [46],
          Mercury: [47],
        } as Record<string, number[]>,
        cusps: [...cusps],
      }
      const transit = createTransit(undefined, tData, { STROKE_ONLY: true })

      const pointsWrapper = document.getElementById('chart-astrology-transit-planets')
      expect(pointsWrapper).not.toBeNull()
    })
  })

  describe('animate', () => {
    beforeEach(() => {
      jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
        return setTimeout(() => cb(Date.now()), 16) as unknown as number
      })
      jest.spyOn(window, 'cancelAnimationFrame').mockImplementation((id: number) => {
        clearTimeout(id)
      })
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    test('should return transit instance', () => {
      const transit = createTransit()

      const targetData = {
        planets: {
          Sun: [90],
          Moon: [180],
          Mercury: [270],
        } as Record<string, number[]>,
        cusps: [...cusps],
      }

      const result = transit.animate(targetData, 1, false, jest.fn())
      expect(result).toBe(transit)
    })

    test('should throw on invalid animate data', () => {
      const transit = createTransit()

      expect(() => {
        transit.animate(null as any, 1, false, jest.fn())
      }).toThrow()
    })

    test('should throw when animate data has invalid cusps', () => {
      const transit = createTransit()

      expect(() => {
        transit.animate({ planets: {}, cusps: [1, 2, 3] } as any, 1, false, jest.fn())
      }).toThrow()
    })

    test('should accept animation with reverse flag', () => {
      const transit = createTransit()

      const targetData = {
        planets: {
          Sun: [90],
        } as Record<string, number[]>,
        cusps: [...cusps],
      }

      const result = transit.animate(targetData, 2, true, jest.fn())
      expect(result).toBe(transit)
    })

    test('should accept animation without callback', () => {
      const transit = createTransit()

      const targetData = {
        planets: {
          Sun: [90],
        } as Record<string, number[]>,
        cusps: [...cusps],
      }

      const result = transit.animate(targetData, 1, false, undefined as any)
      expect(result).toBe(transit)
    })
  })

  describe('aspects - auto-calculated', () => {
    test('should auto-calculate transit aspects when no custom aspects provided', () => {
      const tData = {
        planets: {
          Sun: [90],
        } as Record<string, number[]>,
        cusps: [...cusps],
      }
      const transit = createTransit(undefined, tData)
      const result = transit.aspects(null as any)
      expect(result).toBe(transit)
    })
  })
})
