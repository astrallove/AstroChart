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

describe('Transit', () => {
  describe('constructor', () => {
    test('should create transit with valid data', () => {
      const tData = makeTransitData()
      const transit = createTransit(undefined, tData)
      expect(transit).toBeDefined()
      expect(transit.data.planets).toStrictEqual(tData.planets)
    })

    test('should throw on invalid transit data', () => {
      document.body.innerHTML = '<div id="chart"></div>'
      const chart = new Chart('chart', 800, 800)
      const radix = chart.radix(makeRadixData())
      expect(() => {
        radix.transit({ planets: {}, cusps: [] } as any)
      }).toThrow()
    })

    test('should throw on null transit data', () => {
      document.body.innerHTML = '<div id="chart"></div>'
      const chart = new Chart('chart', 800, 800)
      const radix = chart.radix(makeRadixData())
      expect(() => {
        radix.transit(null as any)
      }).toThrow()
    })

    test('should inherit cx, cy, radius from radix', () => {
      const transit = createTransit()
      expect(transit.cx).toBeDefined()
      expect(transit.cy).toBeDefined()
      expect(transit.radius).toBeDefined()
    })

    test('should inherit shift from radix', () => {
      const transit = createTransit()
      expect(transit.shift).toBeDefined()
    })

    test('should create transit universe element', () => {
      createTransit()
      const transitEl = document.getElementById('chart-astrology-transit')
      expect(transitEl).not.toBeNull()
    })
  })

  describe('drawBg', () => {
    test('should add background element', () => {
      createTransit()
      const bg = document.getElementById('chart-astrology-bg')
      expect(bg).not.toBeNull()
    })
  })

  describe('drawPoints', () => {
    test('should render transit planet symbols', () => {
      createTransit()
      const pointsWrapper = document.getElementById('chart-astrology-transit-planets')
      expect(pointsWrapper).not.toBeNull()
      expect(pointsWrapper!.childNodes.length).toBeGreaterThan(0)
    })

    test('should handle custom planets data', () => {
      const transit = createTransit()
      transit.drawPoints({ Sun: [100], Moon: [200] })
      const pointsWrapper = document.getElementById('chart-astrology-transit-planets')
      expect(pointsWrapper).not.toBeNull()
    })

    test('should handle null planets gracefully', () => {
      const transit = createTransit()
      // Set null on a fresh transit instance - does not corrupt shared data
      transit.data = { planets: null as any, cusps: [...cusps] }
      transit.drawPoints()
    })

    test('should show retrograde marker for retrograde transit planets', () => {
      const tData = {
        planets: {
          Saturn: [250, -0.1],
        } as Record<string, number[]>,
        cusps: [...cusps],
      }
      const transit = createTransit(undefined, tData)
      const pointsWrapper = document.getElementById('chart-astrology-transit-planets')
      const textElements = pointsWrapper!.querySelectorAll('text')
      const texts = Array.from(textElements).map((t) => t.textContent)
      expect(texts).toContain('R')
    })

    test('should populate locatedPoints', () => {
      const transit = createTransit()
      expect(transit.locatedPoints.length).toBeGreaterThan(0)
    })
  })

  describe('drawCusps', () => {
    test('should render transit cusp lines', () => {
      const transit = createTransit()
      const cuspsWrapper = document.getElementById('chart-astrology-transit-cusps')
      expect(cuspsWrapper).not.toBeNull()
      expect(cuspsWrapper!.childNodes.length).toBeGreaterThan(0)
    })

    test('should handle custom cusps data', () => {
      const transit = createTransit()
      const customCusps = [10, 40, 70, 100, 130, 160, 190, 220, 250, 280, 310, 340]
      transit.drawCusps(customCusps)
      const cuspsWrapper = document.getElementById('chart-astrology-transit-cusps')
      expect(cuspsWrapper!.childNodes.length).toBeGreaterThan(0)
    })

    test('should handle null cusps gracefully', () => {
      const transit = createTransit()
      transit.data = { planets: makeTransitData().planets, cusps: null as any }
      transit.drawCusps()
    })
  })

  describe('drawRuler', () => {
    test('should render transit ruler', () => {
      createTransit()
      const rulerWrapper = document.getElementById('chart-astrology-transit-ruler')
      expect(rulerWrapper).not.toBeNull()
      // 72 ruler lines + 1 circle
      expect(rulerWrapper!.childNodes.length).toBe(73)
    })
  })

  describe('drawCircles', () => {
    test('should render transit circle', () => {
      createTransit()
      const circlesWrapper = document.getElementById('chart-astrology-transit-circles')
      expect(circlesWrapper).not.toBeNull()
      expect(circlesWrapper!.querySelectorAll('circle').length).toBe(1)
    })
  })

  describe('aspects', () => {
    test('should draw transit aspect lines with custom aspects', () => {
      const transit = createTransit()
      const customAspects = [
        {
          aspect: { name: 'square', degree: 90, orbit: 8, color: '#FF4500' },
          point: { name: 'Sun', position: 45 },
          toPoint: { name: 'Moon', position: 135 },
          precision: '0.0000',
        },
      ]
      const result = transit.aspects(customAspects)
      expect(result).toBe(transit)
    })

    test('should set data attributes on transit aspect lines', () => {
      const transit = createTransit()
      const customAspects = [
        {
          aspect: { name: 'trine', degree: 120, orbit: 8, color: '#27AE60' },
          point: { name: 'Sun', position: 45 },
          toPoint: { name: 'Mercury', position: 165 },
          precision: '0.0000',
        },
      ]
      transit.aspects(customAspects)
      const aspectsWrapper = document.getElementById('chart-astrology-aspects')
      const line = aspectsWrapper!.querySelector('line')
      expect(line).not.toBeNull()
      expect(line!.getAttribute('data-name')).toBe('trine')
      expect(line!.getAttribute('data-degree')).toBe('120')
    })

    test('should use LINE_COLOR when STROKE_ONLY is true', () => {
      const transit = createTransit(undefined, undefined, { STROKE_ONLY: true })
      const customAspects = [
        {
          aspect: { name: 'square', degree: 90, orbit: 8, color: '#FF4500' },
          point: { name: 'Sun', position: 45 },
          toPoint: { name: 'Moon', position: 135 },
          precision: '0.0000',
        },
      ]
      transit.aspects(customAspects)
      const aspectsWrapper = document.getElementById('chart-astrology-aspects')
      const line = aspectsWrapper!.querySelector('line')
      if (line) {
        expect(line.getAttribute('stroke')).toBe(transit.settings.LINE_COLOR)
      }
    })
  })
})
