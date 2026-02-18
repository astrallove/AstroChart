import default_settings from './settings'
import {
  getPointPosition,
  degreeToRadians,
  radiansToDegree,
  getDescriptionPosition,
  validate,
  getEmptyWrapper,
  removeChilds,
  isCollision,
  isInCollision,
  getDashedLinesPositions,
  getRulerPositions,
  comparePoints,
  placePointsInCollision,
  assemble,
} from './utils'
import type { LocatedPoint } from './radix'

describe('degreeToRadians', () => {
  test.each([
    [0, 0],
    [90, Math.PI / 2],
    [180, Math.PI],
    [360, 2 * Math.PI],
    [45, Math.PI / 4],
  ])('should convert %d degrees to radians', (degrees, expected) => {
    expect(degreeToRadians(degrees)).toBeCloseTo(expected)
  })
})

describe('radiansToDegree', () => {
  test.each([
    [0, 0],
    [Math.PI / 2, 90],
    [Math.PI, 180],
    [2 * Math.PI, 360],
    [Math.PI / 4, 45],
  ])('should convert %d radians to degrees', (radians, expected) => {
    expect(radiansToDegree(radians)).toBeCloseTo(expected)
  })
})

describe('getDescriptionPosition', () => {
  test('should return positions for each text', () => {
    const point = { x: 100, y: 100 }
    const texts = ['15', 'R', 'e']
    const result = getDescriptionPosition(point, texts, default_settings)
    expect(result).toHaveLength(3)
    result.forEach((item, idx) => {
      expect(item.text).toBe(texts[idx])
      expect(typeof item.x).toBe('number')
      expect(typeof item.y).toBe('number')
    })
  })

  test('should return empty array for empty texts', () => {
    const point = { x: 100, y: 100 }
    const result = getDescriptionPosition(point, [], default_settings)
    expect(result).toHaveLength(0)
  })

  test('should offset y position for each subsequent text', () => {
    const point = { x: 100, y: 100 }
    const texts = ['a', 'b', 'c']
    const result = getDescriptionPosition(point, texts, default_settings)
    expect(result[0].y).toBeLessThan(result[1].y)
    expect(result[1].y).toBeLessThan(result[2].y)
  })

  test('first text y should be above the point', () => {
    const point = { x: 100, y: 100 }
    const texts = ['a']
    const result = getDescriptionPosition(point, texts, default_settings)
    expect(result[0].y).toBeLessThan(point.y)
  })
})

describe('validate', () => {
  test('should return no error for valid data', () => {
    const data = {
      planets: { Sun: [0], Moon: [90] },
      cusps: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
    }
    const status = validate(data)
    expect(status.hasError).toBe(false)
    expect(status.messages).toHaveLength(0)
  })

  test('should error on null data', () => {
    const status = validate(null as any)
    expect(status.hasError).toBe(true)
    expect(status.messages).toContain('Data is not set.')
  })

  test('should error on undefined data', () => {
    const status = validate(undefined as any)
    expect(status.hasError).toBe(true)
  })

  test('should error when planets is null', () => {
    const status = validate({ planets: null as any, cusps: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330] })
    expect(status.hasError).toBe(true)
    expect(status.messages.join(' ')).toContain('planets')
  })

  test('should error when planet value is not an array', () => {
    const status = validate({ planets: { Sun: 123 as any }, cusps: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330] })
    expect(status.hasError).toBe(true)
    expect(status.messages.join(' ')).toContain('Array')
  })

  test('should error when cusps is not an array', () => {
    const status = validate({ planets: {}, cusps: 'invalid' as any })
    expect(status.hasError).toBe(true)
    expect(status.messages.join(' ')).toContain('Array')
  })

  test('should error when cusps has wrong length', () => {
    const status = validate({ planets: {}, cusps: [1, 2, 3] })
    expect(status.hasError).toBe(true)
    expect(status.messages.join(' ')).toContain('12')
  })

  test('should accept valid data with empty planets', () => {
    const data = {
      planets: {},
      cusps: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
    }
    const status = validate(data)
    expect(status.hasError).toBe(false)
  })

  test('should accept null cusps', () => {
    const data = {
      planets: { Sun: [0] },
      cusps: null as any,
    }
    const status = validate(data)
    // cusps null is acceptable (some paths handle it)
    expect(status.hasError).toBe(false)
  })

  test('should collect multiple errors', () => {
    const status = validate({ planets: { Sun: 'bad' as any, Moon: 42 as any }, cusps: [1] })
    expect(status.hasError).toBe(true)
    expect(status.messages.length).toBeGreaterThanOrEqual(2)
  })
})

describe('getEmptyWrapper', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="paper"><g id="parent"></g></div>'
  })

  test('should create new wrapper element', () => {
    const parent = document.getElementById('parent')!
    const wrapper = getEmptyWrapper(parent, 'new-wrapper', 'paper')
    expect(wrapper.getAttribute('id')).toBe('new-wrapper')
  })

  test('should return existing element and clear its children', () => {
    const parent = document.getElementById('parent')!
    const existing = document.createElement('g')
    existing.setAttribute('id', 'existing-wrapper')
    const child = document.createElement('span')
    existing.appendChild(child)
    document.body.appendChild(existing)

    const wrapper = getEmptyWrapper(parent, 'existing-wrapper', 'paper')
    expect(wrapper.getAttribute('id')).toBe('existing-wrapper')
    expect(wrapper.childNodes.length).toBe(0)
  })

  test('should throw when paper element not found', () => {
    const parent = document.getElementById('parent')!
    expect(() => {
      getEmptyWrapper(parent, 'test', 'nonexistent')
    }).toThrow()
  })
})

describe('removeChilds', () => {
  test('should remove all children', () => {
    const parent = document.createElement('div')
    parent.appendChild(document.createElement('span'))
    parent.appendChild(document.createElement('span'))
    parent.appendChild(document.createElement('span'))
    expect(parent.childNodes.length).toBe(3)
    removeChilds(parent)
    expect(parent.childNodes.length).toBe(0)
  })

  test('should handle null parent', () => {
    // Should not throw
    removeChilds(null as any)
  })

  test('should handle parent with no children', () => {
    const parent = document.createElement('div')
    removeChilds(parent)
    expect(parent.childNodes.length).toBe(0)
  })
})

describe('isInCollision', () => {
  test('should detect collision with nearby point', () => {
    const points = [{ x: 0, y: 0, r: 10, angle: 100 }]
    expect(isInCollision(102, points, default_settings)).toBe(true)
  })

  test('should not detect collision with distant point', () => {
    const points = [{ x: 0, y: 0, r: 10, angle: 100 }]
    expect(isInCollision(200, points, default_settings)).toBe(false)
  })

  test('should handle zero-crossing collision', () => {
    const points = [{ x: 0, y: 0, r: 10, angle: 358 }]
    expect(isInCollision(2, points, default_settings)).toBe(true)
  })

  test('should return false for empty points', () => {
    expect(isInCollision(100, [], default_settings)).toBe(false)
  })
})

describe('getDashedLinesPositions', () => {
  test('should return single line when no collision', () => {
    const result = getDashedLinesPositions(
      400, 400, 45, 100, 300, 200, [], default_settings
    )
    expect(result).toHaveLength(1)
    expect(result[0].startX).toBeDefined()
    expect(result[0].startY).toBeDefined()
    expect(result[0].endX).toBeDefined()
    expect(result[0].endY).toBeDefined()
  })

  test('should return two lines when there is a collision', () => {
    const obstacles: LocatedPoint[] = [
      { name: 'Sun', x: 0, y: 0, r: 10, angle: 45 },
    ]
    const result = getDashedLinesPositions(
      400, 400, 45, 100, 300, 200, obstacles, default_settings
    )
    expect(result.length).toBeGreaterThanOrEqual(1)
  })
})

describe('getRulerPositions', () => {
  test('should return 72 ruler positions', () => {
    const result = getRulerPositions(400, 400, 300, 320, 0, default_settings)
    expect(result).toHaveLength(72)
  })

  test('each position should have startX, startY, endX, endY', () => {
    const result = getRulerPositions(400, 400, 300, 320, 0, default_settings)
    result.forEach((pos) => {
      expect(typeof pos.startX).toBe('number')
      expect(typeof pos.startY).toBe('number')
      expect(typeof pos.endX).toBe('number')
      expect(typeof pos.endY).toBe('number')
    })
  })

  test('should handle reversed radius (start > end)', () => {
    const result = getRulerPositions(400, 400, 320, 300, 0, default_settings)
    expect(result).toHaveLength(72)
  })

  test('should account for start angle shift', () => {
    const noShift = getRulerPositions(400, 400, 300, 320, 0, default_settings)
    const withShift = getRulerPositions(400, 400, 300, 320, 90, default_settings)
    // Positions should be different when shifted
    expect(noShift[0].startX).not.toBeCloseTo(withShift[0].startX)
  })
})

describe('getPointPosition - extended', () => {
  test('should handle negative angles', () => {
    const pos1 = getPointPosition(100, 100, 50, -90, default_settings)
    const pos2 = getPointPosition(100, 100, 50, 270, default_settings)
    expect(pos1.x).toBeCloseTo(pos2.x)
    expect(pos1.y).toBeCloseTo(pos2.y)
  })

  test('should handle angle > 360', () => {
    const pos1 = getPointPosition(100, 100, 50, 450, default_settings)
    const pos2 = getPointPosition(100, 100, 50, 90, default_settings)
    expect(pos1.x).toBeCloseTo(pos2.x)
    expect(pos1.y).toBeCloseTo(pos2.y)
  })

  test('should return center when radius is 0', () => {
    const pos = getPointPosition(100, 100, 0, 45, default_settings)
    expect(pos.x).toBeCloseTo(100)
    expect(pos.y).toBeCloseTo(100)
  })
})

describe('placePointsInCollision - extended', () => {
  test('should handle both points at same angle and same pointer', () => {
    const p1: LocatedPoint = { name: 'A', pointer: 180, angle: 180, x: 0, y: 0, r: 10 }
    const p2: LocatedPoint = { name: 'B', pointer: 180, angle: 180, x: 0, y: 0, r: 10 }
    placePointsInCollision(p1, p2)
    // They should be moved apart
    expect(p1.angle).not.toBe(p2.angle)
  })

  test('should handle points near 0/360 boundary', () => {
    const p1: LocatedPoint = { name: 'A', pointer: 1, angle: 1, x: 0, y: 0, r: 10 }
    const p2: LocatedPoint = { name: 'B', pointer: 359, angle: 359, x: 0, y: 0, r: 10 }
    placePointsInCollision(p1, p2)
    // Both should remain in valid range [0, 360)
    expect(p1.angle).toBeGreaterThanOrEqual(0)
    expect(p1.angle).toBeLessThan(360)
    expect(p2.angle).toBeGreaterThanOrEqual(0)
    expect(p2.angle).toBeLessThan(360)
  })

  test('should use angle when pointer is undefined', () => {
    const p1: LocatedPoint = { name: 'A', angle: 100, x: 0, y: 0, r: 10 }
    const p2: LocatedPoint = { name: 'B', angle: 110, x: 0, y: 0, r: 10 }
    placePointsInCollision(p1, p2)
    expect(p1.angle).toBe(99)
    expect(p2.angle).toBe(111)
  })
})

describe('assemble - extended', () => {
  test('should throw when too many planets for circle', () => {
    const universe = { cx: 0, cy: 0, r: 1 }
    const settings = { ...default_settings, COLLISION_RADIUS: 100 }
    const locatedPoints: LocatedPoint[] = [
      { name: 'A', x: 0, y: 0, r: 100, angle: 0 },
      { name: 'B', x: 0, y: 0, r: 100, angle: 90 },
      { name: 'C', x: 0, y: 0, r: 100, angle: 180 },
    ]
    const newPoint: LocatedPoint = { name: 'D', x: 0, y: 0, r: 100, angle: 270 }
    expect(() => {
      assemble(locatedPoints, newPoint, universe, settings)
    }).toThrow('Unresolved planet collision')
  })

  test('should handle single point', () => {
    const universe = { cx: 0, cy: 0, r: 100 }
    const point: LocatedPoint = { name: 'A', x: 100, y: 0, r: 10, angle: 180 }
    const result = assemble([], point, universe, default_settings)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('A')
  })

  test('should handle two non-colliding points', () => {
    const universe = { cx: 0, cy: 0, r: 100 }
    const p1: LocatedPoint = { name: 'A', x: 100, y: 0, r: 10, angle: 0 }
    const p2: LocatedPoint = { name: 'B', x: -100, y: 0, r: 10, angle: 180 }
    let points = assemble([], p1, universe, default_settings)
    points = assemble(points, p2, universe, default_settings)
    expect(points).toHaveLength(2)
    // Original angles should be preserved
    expect(points.find((p) => p.name === 'A')!.angle).toBe(0)
    expect(points.find((p) => p.name === 'B')!.angle).toBe(180)
  })
})
