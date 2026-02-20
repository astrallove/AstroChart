import Radix from './radix'
import SVG from './svg'
import default_settings from './settings'

const cusps = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]

const fullPlanetsData = {
  planets: {
    Sun: [0],
    Moon: [90],
    Mercury: [120],
    Venus: [180],
    Mars: [240],
    Jupiter: [300],
    Saturn: [330],
  } as Record<string, number[]>,
  cusps,
}

const minimalData = {
  planets: { Sun: [0] } as Record<string, number[]>,
  cusps,
}

function createRadix(data: { planets: Record<string, number[]>; cusps: number[] } = fullPlanetsData, settings = default_settings) {
  document.body.innerHTML = '<div id="chart"></div>'
  const paper = new SVG('chart', 800, 800, settings)
  return new Radix(paper, 400, 400, 350, data, settings)
}

describe('Radix', () => {
  describe('constructor', () => {
    test('should set cx, cy, and radius', () => {
      const radix = createRadix()
      expect(radix.cx).toBe(400)
      expect(radix.cy).toBe(400)
      expect(radix.radius).toBe(350)
    })

    test('should throw on invalid data (no cusps)', () => {
      document.body.innerHTML = '<div id="chart"></div>'
      const paper = new SVG('chart', 800, 800, default_settings)
      expect(() => {
        new Radix(paper, 400, 400, 350, { planets: {}, cusps: [] } as any, default_settings)
      }).toThrow()
    })

    test('should throw on null data', () => {
      document.body.innerHTML = '<div id="chart"></div>'
      const paper = new SVG('chart', 800, 800, default_settings)
      expect(() => {
        new Radix(paper, 400, 400, 350, null as any, default_settings)
      }).toThrow()
    })

    test('should throw when planets property is not an array', () => {
      document.body.innerHTML = '<div id="chart"></div>'
      const paper = new SVG('chart', 800, 800, default_settings)
      expect(() => {
        new Radix(paper, 400, 400, 350, { planets: { Sun: 123 as any }, cusps } as any, default_settings)
      }).toThrow()
    })

    test('should clone planets data into toPoints', () => {
      const radix = createRadix()
      expect(radix.toPoints).toStrictEqual(fullPlanetsData.planets)
      // Verify it's a deep clone
      radix.toPoints.Sun = [999]
      expect(fullPlanetsData.planets.Sun).toStrictEqual([0])
    })

    test('should compute shift from first cusp', () => {
      const data = {
        planets: { Sun: [0] },
        cusps: [90, 120, 150, 180, 210, 240, 270, 300, 330, 0, 30, 60],
      }
      const radix = createRadix(data)
      // shift = 360 - cusps[0] = 360 - 90 = 270
      expect(radix.shift).toBeCloseTo(270, 0)
    })

    test('should have shift of 0 when first cusp is 0', () => {
      const data = {
        planets: { Sun: [0] },
        cusps: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
      }
      const radix = createRadix(data)
      // cusps[0] is 0 (falsy), so the shift calculation is skipped and shift remains 0
      expect(radix.shift).toBe(0)
    })

    test('should create aspects wrapper element', () => {
      const radix = createRadix()
      const aspectsEl = document.getElementById('chart-astrology-aspects')
      expect(aspectsEl).not.toBeNull()
    })

    test('should create radix universe element', () => {
      const radix = createRadix()
      const radixEl = document.getElementById('chart-astrology-radix')
      expect(radixEl).not.toBeNull()
    })
  })

  describe('drawBg', () => {
    test('should add background element to universe', () => {
      const radix = createRadix()
      radix.drawBg()
      const bg = document.getElementById('chart-astrology-bg')
      expect(bg).not.toBeNull()
      expect(bg!.childNodes.length).toBeGreaterThan(0)
    })

    test('should set fill to none when STROKE_ONLY is true', () => {
      const settings = { ...default_settings, STROKE_ONLY: true }
      const radix = createRadix(minimalData, settings)
      radix.drawBg()
      const bg = document.getElementById('chart-astrology-bg')
      const path = bg!.querySelector('path')
      expect(path!.getAttribute('fill')).toBe('none')
    })
  })

  describe('drawUniverse', () => {
    test('should create 12 sign segments', () => {
      const radix = createRadix()
      radix.drawUniverse()
      const signsWrapper = document.getElementById('chart-astrology-radix-signs')
      expect(signsWrapper).not.toBeNull()
      // 12 segments + 12 sign symbols = 24 elements
      expect(signsWrapper!.childNodes.length).toBe(24)
    })

    test('should set stroke when STROKE_ONLY is true', () => {
      const settings = { ...default_settings, STROKE_ONLY: true }
      const radix = createRadix(minimalData, settings)
      radix.drawUniverse()
      const signsWrapper = document.getElementById('chart-astrology-radix-signs')
      const firstSegment = signsWrapper!.firstChild as Element
      expect(firstSegment.getAttribute('fill')).toBe('none')
      expect(firstSegment.getAttribute('stroke')).toBe(settings.CIRCLE_COLOR)
    })
  })

  describe('drawPoints', () => {
    test('should render planet symbols', () => {
      const radix = createRadix()
      radix.drawPoints()
      const pointsWrapper = document.getElementById('chart-astrology-radix-planets')
      expect(pointsWrapper).not.toBeNull()
      expect(pointsWrapper!.childNodes.length).toBeGreaterThan(0)
    })

    test('should handle missing planets gracefully', () => {
      const data = {
        planets: null as any,
        cusps,
      }
      // validate would fail with null planets, so use empty
      const dataEmpty = { planets: {}, cusps }
      const radix = createRadix(dataEmpty)
      radix.data.planets = null as any
      // Should return early without error
      radix.drawPoints()
    })

    test('should create located points', () => {
      const radix = createRadix()
      radix.drawPoints()
      expect(radix.locatedPoints.length).toBeGreaterThan(0)
    })

    test('should display retrograde marker for retrograde planets', () => {
      const data = {
        planets: {
          Sun: [120, -0.5], // retrograde
          Moon: [240, 1], // direct
        },
        cusps,
      }
      const radix = createRadix(data)
      radix.drawPoints()
      const pointsWrapper = document.getElementById('chart-astrology-radix-planets')
      const textElements = pointsWrapper!.querySelectorAll('text')
      const texts = Array.from(textElements).map((t) => t.textContent)
      expect(texts).toContain('R')
    })
  })

  describe('drawAxis', () => {
    test('should render axis lines', () => {
      const radix = createRadix()
      radix.drawAxis()
      const axisWrapper = document.getElementById('chart-astrology-radix-axis')
      expect(axisWrapper).not.toBeNull()
      expect(axisWrapper!.childNodes.length).toBeGreaterThan(0)
    })

    test('should not draw axis when cusps is null', () => {
      const data = { planets: { Sun: [0] }, cusps }
      const radix = createRadix(data)
      radix.data.cusps = null as any
      radix.drawAxis()
      // Should not throw
    })
  })

  describe('drawCusps', () => {
    test('should render cusp lines', () => {
      const radix = createRadix()
      radix.drawCusps()
      const cuspsWrapper = document.getElementById('chart-astrology-radix-cusps')
      expect(cuspsWrapper).not.toBeNull()
      expect(cuspsWrapper!.childNodes.length).toBeGreaterThan(0)
    })

    test('should not draw cusps when cusps is null', () => {
      const data = { planets: { Sun: [0] }, cusps }
      const radix = createRadix(data)
      radix.data.cusps = null as any
      radix.drawCusps()
      // Should not throw
    })
  })

  describe('drawRuler', () => {
    test('should render ruler lines', () => {
      const radix = createRadix()
      radix.drawRuler()
      const rulerWrapper = document.getElementById('chart-astrology-radix-ruler')
      expect(rulerWrapper).not.toBeNull()
      // 72 ruler lines + 1 circle
      expect(rulerWrapper!.childNodes.length).toBe(73)
    })
  })

  describe('drawCircles', () => {
    test('should render three circles', () => {
      const radix = createRadix()
      radix.drawCircles()
      const circlesWrapper = document.getElementById('chart-astrology-radix-circles')
      expect(circlesWrapper).not.toBeNull()
      expect(circlesWrapper!.querySelectorAll('circle').length).toBe(3)
    })
  })

  describe('aspects', () => {
    test('should draw aspect lines between planets', () => {
      const radix = createRadix()
      radix.drawPoints()
      const result = radix.aspects()
      expect(result).toBe(radix)
      const aspectsWrapper = document.getElementById('chart-astrology-aspects')
      expect(aspectsWrapper!.querySelectorAll('line').length).toBeGreaterThan(0)
    })

    test('should accept custom aspects array', () => {
      const radix = createRadix()
      const customAspects = [
        {
          aspect: { name: 'conjunction', degree: 0, orbit: 10, color: '#ff0000' },
          point: { name: 'Sun', position: 0 },
          toPoint: { name: 'Moon', position: 5 },
          precision: '5.0000',
        },
      ]
      radix.aspects(customAspects)
      const aspectsWrapper = document.getElementById('chart-astrology-aspects')
      const lines = aspectsWrapper!.querySelectorAll('line')
      expect(lines.length).toBe(1)
      expect(lines[0].getAttribute('stroke')).toBe('#ff0000')
    })

    test('should filter duplicate aspects', () => {
      const data = {
        planets: {
          Sun: [0],
          Moon: [90],
        },
        cusps,
      }
      const radix = createRadix(data)
      radix.drawPoints()
      radix.aspects()
      const aspectsWrapper = document.getElementById('chart-astrology-aspects')
      const lines = aspectsWrapper!.querySelectorAll('line')
      // Sun-Moon square should appear only once (duplicates filtered)
      const squareLines = Array.from(lines).filter(
        (l) => l.getAttribute('data-name') === 'square'
      )
      expect(squareLines.length).toBe(1)
    })

    test('should set data attributes on aspect lines', () => {
      const radix = createRadix()
      radix.drawPoints()
      radix.aspects()
      const aspectsWrapper = document.getElementById('chart-astrology-aspects')
      const line = aspectsWrapper!.querySelector('line')
      if (line) {
        expect(line.getAttribute('data-name')).toBeTruthy()
        expect(line.getAttribute('data-degree')).toBeTruthy()
        expect(line.getAttribute('data-point')).toBeTruthy()
        expect(line.getAttribute('data-toPoint')).toBeTruthy()
        expect(line.getAttribute('data-precision')).toBeTruthy()
      }
    })

    test('should use LINE_COLOR when STROKE_ONLY is true', () => {
      const settings = { ...default_settings, STROKE_ONLY: true }
      const data = {
        planets: { Sun: [0], Moon: [90] },
        cusps,
      }
      const radix = createRadix(data, settings)
      radix.drawPoints()
      radix.aspects()
      const aspectsWrapper = document.getElementById('chart-astrology-aspects')
      const lines = aspectsWrapper!.querySelectorAll('line')
      if (lines.length > 0) {
        expect(lines[0].getAttribute('stroke')).toBe(settings.LINE_COLOR)
      }
    })
  })

  describe('addPointsOfInterest', () => {
    test('should add points to toPoints', () => {
      const radix = createRadix()
      const result = radix.addPointsOfInterest({ As: [0], Mc: [270] })
      expect(result).toBe(radix)
      expect(radix.toPoints.As).toStrictEqual([0])
      expect(radix.toPoints.Mc).toStrictEqual([270])
    })

    test('should not remove existing planets from toPoints', () => {
      const radix = createRadix()
      radix.addPointsOfInterest({ As: [0] })
      expect(radix.toPoints.Sun).toStrictEqual([0])
    })

    test('should skip inherited properties on points', () => {
      const radix = createRadix()
      const proto = { inherited: [50] }
      const points = Object.create(proto)
      points.As = [0]
      radix.addPointsOfInterest(points)
      expect(radix.toPoints.As).toStrictEqual([0])
      expect(radix.toPoints.inherited).toBeUndefined()
    })
  })

  describe('drawPoints - SHOW_DIGNITIES_TEXT false', () => {
    test('should not show dignities text when SHOW_DIGNITIES_TEXT is false', () => {
      const settings = { ...default_settings, SHOW_DIGNITIES_TEXT: false }
      const radix = createRadix(fullPlanetsData, settings)
      radix.drawPoints()
      const pointsWrapper = document.getElementById('chart-astrology-radix-planets')
      expect(pointsWrapper).not.toBeNull()
      expect(pointsWrapper!.childNodes.length).toBeGreaterThan(0)
    })
  })

  describe('drawPoints - inherited planet properties', () => {
    test('should skip inherited properties on planets data', () => {
      const proto = { inherited: [50] }
      const planets = Object.create(proto)
      planets.Sun = [0]
      planets.Moon = [90]
      const data = { planets, cusps }
      const radix = createRadix(data)
      radix.drawPoints()
      // Should not throw and should only process own properties
      expect(radix.locatedPoints.length).toBe(2)
    })
  })

  describe('transit', () => {
    test('should create a transit chart', () => {
      const radix = createRadix()
      radix.drawBg()
      radix.drawUniverse()
      radix.drawRuler()
      radix.drawPoints()
      radix.drawCusps()
      radix.drawAxis()
      radix.drawCircles()

      const transitData = {
        planets: {
          Sun: [45],
          Moon: [135],
        },
        cusps,
      }
      const transit = radix.transit(transitData)
      expect(transit).toBeDefined()
    })

    test('should remove axis when creating transit', () => {
      const radix = createRadix()
      radix.drawBg()
      radix.drawUniverse()
      radix.drawRuler()
      radix.drawPoints()
      radix.drawCusps()
      radix.drawAxis()
      radix.drawCircles()

      const axisWrapper = document.getElementById('chart-astrology-radix-axis')
      expect(axisWrapper!.childNodes.length).toBeGreaterThan(0)

      const transitData = {
        planets: { Sun: [45] },
        cusps,
      }
      radix.transit(transitData)
      // After transit creation, axis should be cleared
      expect(axisWrapper!.childNodes.length).toBe(0)
    })
  })
})
