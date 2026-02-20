import default_settings from './settings'
import Zodiac from './zodiac'

describe('Zodiac - extended', () => {
  const cusps = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]

  describe('constructor', () => {
    test('should throw when cusps is null', () => {
      expect(() => new Zodiac(null as any)).toThrow("Param 'cusps' must not be empty.")
    })

    test('should throw when cusps is not 12 length', () => {
      expect(() => new Zodiac([1, 2, 3])).toThrow("Param 'cusps' is not 12 length Array.")
    })

    test('should throw when cusps is empty array', () => {
      expect(() => new Zodiac([])).toThrow("Param 'cusps' is not 12 length Array.")
    })

    test('should accept valid cusps without settings', () => {
      const zodiac = new Zodiac(cusps)
      expect(zodiac.cusps).toStrictEqual(cusps)
    })

    test('should accept valid cusps with custom settings', () => {
      const zodiac = new Zodiac(cusps, default_settings)
      expect(zodiac.settings).toBe(default_settings)
    })
  })

  describe('getSign - boundary cases', () => {
    const zodiac = new Zodiac(cusps)

    test('should return Aries (1) for 0 degrees', () => {
      expect(zodiac.getSign(0)).toBe(1)
    })

    test('should return Aries (1) for 29.99 degrees', () => {
      expect(zodiac.getSign(29.99)).toBe(1)
    })

    test('should return Taurus (2) for exactly 30 degrees', () => {
      expect(zodiac.getSign(30)).toBe(2)
    })

    test('should return Pisces (12) for 359.99 degrees', () => {
      expect(zodiac.getSign(359.99)).toBe(12)
    })

    test('should handle angle > 360 (wrap around)', () => {
      expect(zodiac.getSign(361)).toBe(1) // 1 degree
      expect(zodiac.getSign(390)).toBe(2) // 30 degrees
    })

    test('should return sign for each 30-degree boundary', () => {
      for (let i = 0; i < 12; i++) {
        expect(zodiac.getSign(i * 30)).toBe(i + 1)
      }
    })
  })

  describe('isRetrograde - extended', () => {
    const zodiac = new Zodiac(cusps)

    test('should return true for zero speed', () => {
      // 0 is not < 0, so not retrograde
      expect(zodiac.isRetrograde(0)).toBe(false)
    })

    test('should return true for very small negative speed', () => {
      expect(zodiac.isRetrograde(-0.0001)).toBe(true)
    })

    test('should return false for positive speed', () => {
      expect(zodiac.isRetrograde(1.5)).toBe(false)
    })
  })

  describe('getHouseNumber - edge cases', () => {
    test('should handle cusps that cross zero', () => {
      const crossingCusps = [330, 0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300]
      const zodiac = new Zodiac(crossingCusps)
      expect(zodiac.getHouseNumber(340)).toBe(1)
      expect(zodiac.getHouseNumber(350)).toBe(1)
      expect(zodiac.getHouseNumber(10)).toBe(2)
    })

    test('should return house 1 for point at first cusp', () => {
      const zodiac = new Zodiac(cusps)
      expect(zodiac.getHouseNumber(0)).toBe(1)
    })

    test('should return correct house for point at last cusp', () => {
      const zodiac = new Zodiac(cusps)
      expect(zodiac.getHouseNumber(330)).toBe(12)
    })

    test('should handle angles > 360', () => {
      const zodiac = new Zodiac(cusps)
      // 365 mod 360 = 5, which is in house 1
      expect(zodiac.getHouseNumber(365)).toBe(1)
    })
  })

  describe('toDMS', () => {
    const zodiac = new Zodiac(cusps)

    test('should return a string containing degree symbol', () => {
      const result = zodiac.toDMS(266.1234)
      expect(result).toContain('°')
    })

    test('should return consistent results for known values', () => {
      // These values match the existing tests in zodiac.test.ts
      expect(zodiac.toDMS(266.1234)).toBe("266° 7' 24")
      expect(zodiac.toDMS(0.1234)).toBe("0° 7' 24")
    })

    test('should return string with degree, minute, second parts', () => {
      const result = zodiac.toDMS(100.5)
      const parts = result.split(' ')
      expect(parts.length).toBe(3)
      expect(parts[0]).toContain('°')
      expect(parts[1]).toContain("'")
    })
  })

  describe('getDignities - edge cases', () => {
    const zodiac = new Zodiac(cusps)

    test('should return empty for null planet', () => {
      expect(zodiac.getDignities(null as any)).toStrictEqual([])
    })

    test('should return empty for planet without name', () => {
      expect(zodiac.getDignities({ name: '', position: 0 } as any)).toStrictEqual([])
    })

    test('should return empty for unknown planet name', () => {
      expect(zodiac.getDignities({ name: 'Vulcan', position: 0 })).toStrictEqual([])
    })

    test('should handle position at 0 degrees', () => {
      const result = zodiac.getDignities({ name: 'Sun', position: 0 })
      // Sun at 0 (Aries) => exaltation
      expect(result).toContain(default_settings.DIGNITIES_EXALTATION)
    })

    test('should handle position at 360 degrees (wraps to 0)', () => {
      const result = zodiac.getDignities({ name: 'Sun', position: 360 })
      // 360 mod 360 = 0 => Aries => getSign returns 1
      expect(result).toContain(default_settings.DIGNITIES_EXALTATION)
    })

    test('should include exact exaltation when within orbit', () => {
      const result = zodiac.getDignities(
        { name: 'Sun', position: 19 },
        [{ name: 'Sun', position: 19, orbit: 2 }]
      )
      expect(result).toContain(default_settings.DIGNITIES_EXALTATION)
      expect(result).toContain(default_settings.DIGNITIES_EXACT_EXALTATION)
    })

    test('should not include exact exaltation when outside orbit', () => {
      const result = zodiac.getDignities(
        { name: 'Sun', position: 25 },
        [{ name: 'Sun', position: 19, orbit: 2 }]
      )
      // 25 is in Aries still, so exaltation yes, but exact exaltation no
      expect(result).toContain(default_settings.DIGNITIES_EXALTATION)
      expect(result).not.toContain(default_settings.DIGNITIES_EXACT_EXALTATION)
    })

    test('should detect exact exaltation for position >= 360 (normalized)', () => {
      // 379 mod 360 = 19, which should match exact exaltation at 19
      const result = zodiac.getDignities(
        { name: 'Sun', position: 379 },
        [{ name: 'Sun', position: 19, orbit: 2 }]
      )
      expect(result).toContain(default_settings.DIGNITIES_EXALTATION)
      expect(result).toContain(default_settings.DIGNITIES_EXACT_EXALTATION)
    })

    test('should handle exact exaltation with empty array', () => {
      const result = zodiac.getDignities({ name: 'Sun', position: 19 }, [])
      expect(result).toContain(default_settings.DIGNITIES_EXALTATION)
      expect(result).not.toContain(default_settings.DIGNITIES_EXACT_EXALTATION)
    })
  })

  describe('hasConjunction', () => {
    const zodiac = new Zodiac(cusps)

    test('should detect conjunction within orbit', () => {
      expect(zodiac.hasConjunction(18, 19, 2)).toBe(true)
    })

    test('should not detect conjunction outside orbit', () => {
      expect(zodiac.hasConjunction(10, 19, 2)).toBe(false)
    })

    test('should handle conjunction crossing zero', () => {
      // Point near 0, conjunction point at 359 with orbit 4
      // minOrbit = 357, maxOrbit = 361 => 1 (crossing)
      expect(zodiac.hasConjunction(0, 359, 4)).toBe(true)
    })

    test('should detect exact conjunction', () => {
      expect(zodiac.hasConjunction(100, 100, 2)).toBe(true)
    })
  })
})
