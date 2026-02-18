import default_settings from './settings'
import SVG from './svg'

function createSVG(settings = default_settings) {
  document.body.innerHTML = '<div id="test-svg"></div>'
  return new SVG('test-svg', 800, 800, settings)
}

describe('SVG', () => {
  describe('constructor', () => {
    test('should create SVG element in DOM', () => {
      createSVG()
      const svgEl = document.querySelector('svg')
      expect(svgEl).not.toBeNull()
      expect(svgEl!.getAttribute('width')).toBe('800')
      expect(svgEl!.getAttribute('height')).toBe('800')
    })

    test('should set viewBox', () => {
      createSVG()
      const svgEl = document.querySelector('svg')
      expect(svgEl!.getAttribute('viewBox')).toBe('0 0 800 800')
    })

    test('should throw when root element not found', () => {
      document.body.innerHTML = ''
      expect(() => {
        new SVG('nonexistent', 800, 800, default_settings)
      }).toThrow('Root element not found')
    })

    test('should store width and height', () => {
      const svg = createSVG()
      expect(svg.width).toBe(800)
      expect(svg.height).toBe(800)
    })

    test('should create a wrapper g element with id', () => {
      const svg = createSVG()
      expect(svg.root).toBeDefined()
      expect(svg.root.getAttribute('id')).toBe('test-svg-astrology')
    })
  })

  describe('getSymbol - planet symbols', () => {
    test.each([
      'Sun', 'Moon', 'Mercury', 'Venus', 'Mars',
      'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto',
      'Chiron', 'Lilith', 'NNode', 'SNode', 'Fortune',
    ])('should render %s symbol', (planet) => {
      const svg = createSVG()
      const symbol = svg.getSymbol(planet, 100, 100)
      expect(symbol).toBeDefined()
      expect(symbol.tagName.toLowerCase()).toBe('g')
    })
  })

  describe('getSymbol - zodiac signs', () => {
    test.each([
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
    ])('should render %s sign', (sign) => {
      const svg = createSVG()
      const symbol = svg.getSymbol(sign, 100, 100)
      expect(symbol).toBeDefined()
    })
  })

  describe('getSymbol - axis symbols', () => {
    test.each(['As', 'Ds', 'Mc', 'Ic'])('should render %s axis symbol', (axis) => {
      const svg = createSVG()
      const symbol = svg.getSymbol(axis, 100, 100)
      expect(symbol).toBeDefined()
    })
  })

  describe('getSymbol - cusp numbers', () => {
    test.each(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'])(
      'should render cusp number %s',
      (cusp) => {
        const svg = createSVG()
        const symbol = svg.getSymbol(cusp, 100, 100)
        expect(symbol).toBeDefined()
      }
    )
  })

  describe('getSymbol - unknown symbol', () => {
    test('should render a colored circle for unknown symbols', () => {
      const svg = createSVG()
      const symbol = svg.getSymbol('UnknownPlanet', 100, 100)
      expect(symbol).toBeDefined()
      expect(symbol.tagName.toLowerCase()).toBe('circle')
      expect(symbol.getAttribute('fill')).toBe('#ff0000')
    })
  })

  describe('getSymbol - CUSTOM_SYMBOL_FN', () => {
    test('should use custom function when provided', () => {
      const customElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      const mockFn = jest.fn().mockReturnValue(customElement)
      const svg = createSVG({ ...default_settings, CUSTOM_SYMBOL_FN: mockFn })
      const result = svg.getSymbol('Sun', 10, 20)
      expect(mockFn).toHaveBeenCalledWith('Sun', 10, 20, svg)
      expect(result).toBe(customElement)
    })

    test('should fall back to default when custom function returns null', () => {
      const mockFn = jest.fn().mockReturnValue(null)
      const svg = createSVG({ ...default_settings, CUSTOM_SYMBOL_FN: mockFn })
      const result = svg.getSymbol('Sun', 10, 20)
      expect(mockFn).toHaveBeenCalled()
      expect(result.tagName.toLowerCase()).toBe('g')
    })

    test('should fall back to default when custom function returns undefined', () => {
      const mockFn = jest.fn().mockReturnValue(undefined)
      const svg = createSVG({ ...default_settings, CUSTOM_SYMBOL_FN: mockFn })
      const result = svg.getSymbol('Moon', 10, 20)
      expect(mockFn).toHaveBeenCalled()
      expect(result.tagName.toLowerCase()).toBe('g')
    })
  })

  describe('getSymbol - ADD_CLICK_AREA', () => {
    // Only Jupiter and Uranus implement ADD_CLICK_AREA in their symbol methods
    const planetsWithClickArea = ['Jupiter', 'Uranus']
    const planetsWithoutClickArea = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars',
      'Saturn', 'Neptune', 'Pluto', 'Chiron', 'Lilith', 'NNode', 'SNode', 'Fortune']

    test.each(planetsWithClickArea)('should add click area rect for %s when ADD_CLICK_AREA is true', (planet) => {
      const svg = createSVG({ ...default_settings, ADD_CLICK_AREA: true })
      const symbol = svg.getSymbol(planet, 100, 100)
      const rects = symbol.getElementsByTagName('rect')
      expect(rects.length).toBeGreaterThanOrEqual(1)
    })

    test.each(planetsWithClickArea)('should NOT add click area rect for %s when ADD_CLICK_AREA is false', (planet) => {
      const svg = createSVG({ ...default_settings, ADD_CLICK_AREA: false })
      const symbol = svg.getSymbol(planet, 100, 100)
      const rects = symbol.getElementsByTagName('rect')
      expect(rects.length).toBe(0)
    })

    test.each(planetsWithoutClickArea)('should not have click area rect for %s regardless of ADD_CLICK_AREA', (planet) => {
      const svg = createSVG({ ...default_settings, ADD_CLICK_AREA: true })
      const symbol = svg.getSymbol(planet, 100, 100)
      const rects = symbol.getElementsByTagName('rect')
      expect(rects.length).toBe(0)
    })
  })

  describe('line', () => {
    test('should create a line element', () => {
      const svg = createSVG()
      const line = svg.line(10, 20, 30, 40)
      expect(line.tagName.toLowerCase()).toBe('line')
      expect(line.getAttribute('x1')).toBe('10')
      expect(line.getAttribute('y1')).toBe('20')
      expect(line.getAttribute('x2')).toBe('30')
      expect(line.getAttribute('y2')).toBe('40')
    })
  })

  describe('circle', () => {
    test('should create a circle element', () => {
      const svg = createSVG()
      const circle = svg.circle(100, 200, 50)
      expect(circle.tagName.toLowerCase()).toBe('circle')
      expect(circle.getAttribute('cx')).toBe('100')
      expect(circle.getAttribute('cy')).toBe('200')
      expect(circle.getAttribute('r')).toBe('50')
    })
  })

  describe('text', () => {
    test('should create a text element with content', () => {
      const svg = createSVG()
      const textEl = svg.text('hello', 10, 20, '12', '#000')
      expect(textEl.tagName.toLowerCase()).toBe('text')
      expect(textEl.textContent).toBe('hello')
    })
  })

  describe('createRectForClick', () => {
    test('should create a transparent rectangle', () => {
      const svg = createSVG()
      const rect = svg.createRectForClick(50, 60)
      expect(rect.tagName.toLowerCase()).toBe('rect')
      expect(rect.getAttribute('fill')).toBe('transparent')
      expect(rect.getAttribute('width')).toBe('20px')
      expect(rect.getAttribute('height')).toBe('20px')
    })
  })

  describe('getSignWrapperId', () => {
    test('should return correct ID', () => {
      const svg = createSVG()
      const id = svg.getSignWrapperId('Aries')
      expect(id).toBe('test-svg-astrology-radix-signs-Aries')
    })
  })

  describe('getHouseIdWrapper', () => {
    test('should return correct ID', () => {
      const svg = createSVG()
      const id = svg.getHouseIdWrapper('1')
      expect(id).toBe('test-svg-astrology-radix-cusps-1')
    })
  })
})
