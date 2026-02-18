import Chart from './chart'
import default_settings from './settings'

const validData = {
  planets: {
    Sun: [0],
    Moon: [90],
    Mercury: [120],
    Venus: [180],
    Mars: [240],
    Jupiter: [300],
  },
  cusps: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
}

describe('Chart', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="chart"></div>'
  })

  describe('constructor', () => {
    test('should create a chart with default settings', () => {
      const chart = new Chart('chart', 800, 800)
      expect(chart.cx).toBe(400)
      expect(chart.cy).toBe(400)
      expect(chart.radius).toBe(400 - default_settings.MARGIN)
    })

    test('should create a DOM element if elementId does not exist', () => {
      const chart = new Chart('new-element', 600, 600)
      const el = document.getElementById('new-element')
      expect(el).not.toBeNull()
    })

    test('should not create DOM element when elementId is empty string', () => {
      expect(() => {
        new Chart('', 600, 600)
      }).toThrow()
    })

    test('should apply custom settings', () => {
      const chart = new Chart('chart', 800, 800, { MARGIN: 100 })
      expect(chart.radius).toBe(400 - 100)
    })

    test('should keep default COLORS_SIGNS when not overridden', () => {
      const chart = new Chart('chart', 800, 800, { MARGIN: 100 })
      expect(chart.settings.COLORS_SIGNS).toHaveLength(12)
    })

    test('should allow custom COLORS_SIGNS', () => {
      const customColors = Array(12).fill('#000')
      const chart = new Chart('chart', 800, 800, { COLORS_SIGNS: customColors })
      expect(chart.settings.COLORS_SIGNS).toStrictEqual(customColors)
    })

    test('should set width and height on the SVG paper', () => {
      const chart = new Chart('chart', 700, 500)
      expect(chart.paper.width).toBe(700)
      expect(chart.paper.height).toBe(500)
    })

    test('should compute cx and cy from paper dimensions', () => {
      const chart = new Chart('chart', 600, 400)
      expect(chart.cx).toBe(300)
      expect(chart.cy).toBe(200)
    })
  })

  describe('radix', () => {
    test('should return a Radix instance', () => {
      const chart = new Chart('chart', 800, 800)
      const radix = chart.radix(validData)
      expect(radix).toBeDefined()
    })

    test('should render SVG content into the DOM', () => {
      const chart = new Chart('chart', 800, 800)
      chart.radix(validData)
      const svg = document.querySelector('svg')
      expect(svg).not.toBeNull()
      expect(svg!.childNodes.length).toBeGreaterThan(0)
    })

    test('should throw when cusps length is not 12', () => {
      const chart = new Chart('chart', 800, 800)
      expect(() => {
        chart.radix({ planets: {}, cusps: [1, 2, 3, 4, 5] })
      }).toThrow()
    })

    test('should create radix with only cusps and no planets', () => {
      const chart = new Chart('chart', 800, 800)
      const data = {
        planets: {},
        cusps: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
      }
      const radix = chart.radix(data)
      expect(radix).toBeDefined()
    })
  })

  describe('scale', () => {
    test('should set transform attribute on root', () => {
      const chart = new Chart('chart', 800, 800)
      chart.radix(validData)
      chart.scale(2)
      const transform = chart.paper.root.getAttribute('transform')
      expect(transform).toContain('scale(2)')
    })

    test('should include translate to recenter', () => {
      const chart = new Chart('chart', 800, 800)
      chart.radix(validData)
      chart.scale(1.5)
      const transform = chart.paper.root.getAttribute('transform')
      expect(transform).toContain('translate(')
      expect(transform).toContain('scale(1.5)')
    })

    test('scale(1) should translate to 0,0', () => {
      const chart = new Chart('chart', 800, 800)
      chart.radix(validData)
      chart.scale(1)
      const transform = chart.paper.root.getAttribute('transform')
      expect(transform).toBe('translate(0,0) scale(1)')
    })
  })

  describe('calibrate', () => {
    test('should return the chart instance for chaining', () => {
      const chart = new Chart('chart', 800, 800)
      chart.radix(validData)
      const result = chart.calibrate()
      expect(result).toBe(chart)
    })

    test('should add lines and circles to the SVG', () => {
      const chart = new Chart('chart', 800, 800)
      chart.radix(validData)
      const beforeCount = chart.paper.root.childNodes.length
      chart.calibrate()
      const afterCount = chart.paper.root.childNodes.length
      expect(afterCount).toBeGreaterThan(beforeCount)
    })
  })
})
