import AspectCalculator from './aspect'
import default_settings from './settings'

const defaultAspects = {
  conjunction: { degree: 0, orbit: 10, color: 'transparent' },
  square: { degree: 90, orbit: 8, color: '#FF4500' },
  trine: { degree: 120, orbit: 8, color: '#27AE60' },
  opposition: { degree: 180, orbit: 10, color: '#27AE60' },
}

describe('AspectCalculator - extended', () => {
  describe('constructor', () => {
    test('should throw when toPoints is null', () => {
      expect(() => new AspectCalculator(null as any)).toThrow()
    })

    test('should use default aspects when settings not provided', () => {
      const calc = new AspectCalculator({ Sun: [0] })
      expect(calc.settings.ASPECTS).toBeDefined()
      expect(calc.settings.ASPECTS!.conjunction).toBeDefined()
    })

    test('should use custom aspects from settings', () => {
      const customAspects = {
        sextile: { degree: 60, orbit: 6, color: '#blue' },
      }
      const calc = new AspectCalculator({ Sun: [0] }, { ASPECTS: customAspects })
      expect(calc.settings.ASPECTS!.sextile).toBeDefined()
    })
  })

  describe('getToPoints', () => {
    test('should return the toPoints', () => {
      const toPoints = { Sun: [0], Moon: [90] }
      const calc = new AspectCalculator(toPoints)
      expect(calc.getToPoints()).toBe(toPoints)
    })
  })

  describe('radix - extended', () => {
    test('should return empty array for null points', () => {
      const calc = new AspectCalculator({ Sun: [0] }, { ...default_settings, ASPECTS: defaultAspects })
      expect(calc.radix(null as any)).toStrictEqual([])
    })

    test('should not create self-aspects', () => {
      const calc = new AspectCalculator({ Sun: [0] }, { ...default_settings, ASPECTS: defaultAspects })
      const aspects = calc.radix({ Sun: [0] })
      // Sun should not have an aspect with itself
      const selfAspects = aspects.filter(
        (a) => a.point.name === a.toPoint.name
      )
      expect(selfAspects).toHaveLength(0)
    })

    test('should detect conjunction at 0 degrees', () => {
      const calc = new AspectCalculator(
        { Sun: [0], Moon: [3] },
        { ...default_settings, ASPECTS: defaultAspects }
      )
      const aspects = calc.radix({ Sun: [0], Moon: [3] })
      const conjunctions = aspects.filter((a) => a.aspect.name === 'conjunction')
      expect(conjunctions.length).toBeGreaterThan(0)
    })

    test('should detect opposition at 180 degrees', () => {
      const calc = new AspectCalculator(
        { Sun: [0], Moon: [180] },
        { ...default_settings, ASPECTS: defaultAspects }
      )
      const aspects = calc.radix({ Sun: [0], Moon: [180] })
      const oppositions = aspects.filter((a) => a.aspect.name === 'opposition')
      expect(oppositions.length).toBeGreaterThan(0)
    })

    test('should detect trine at 120 degrees', () => {
      const calc = new AspectCalculator(
        { Sun: [0], Moon: [120] },
        { ...default_settings, ASPECTS: defaultAspects }
      )
      const aspects = calc.radix({ Sun: [0], Moon: [120] })
      const trines = aspects.filter((a) => a.aspect.name === 'trine')
      expect(trines.length).toBeGreaterThan(0)
    })

    test('should not detect aspects outside orbit', () => {
      const calc = new AspectCalculator(
        { Sun: [0], Moon: [50] },
        { ...default_settings, ASPECTS: defaultAspects }
      )
      const aspects = calc.radix({ Sun: [0], Moon: [50] })
      // 50 degrees is not near any standard aspect
      expect(aspects).toHaveLength(0)
    })

    test('should sort aspects by precision', () => {
      const calc = new AspectCalculator(
        { Sun: [0], Moon: [91], Mercury: [122], As: [330], Ic: [90] },
        { ...default_settings, ASPECTS: defaultAspects }
      )
      const aspects = calc.radix({ Sun: [0], Moon: [91], Mercury: [122] })
      for (let i = 1; i < aspects.length; i++) {
        expect(Math.abs(parseFloat(aspects[i].precision))).toBeGreaterThanOrEqual(
          Math.abs(parseFloat(aspects[i - 1].precision))
        )
      }
    })

    test('should detect aspects across the 0/360 boundary', () => {
      const calc = new AspectCalculator(
        { Sun: [2], Moon: [358] },
        { ...default_settings, ASPECTS: defaultAspects }
      )
      const aspects = calc.radix({ Sun: [2], Moon: [358] })
      const conjunctions = aspects.filter((a) => a.aspect.name === 'conjunction')
      // gap = |2 - 358| = 356, then 360 - 356 = 4, which is within orbit [-5, 5]
      expect(conjunctions.length).toBeGreaterThan(0)
    })

    test('should include correct aspect data in results', () => {
      const calc = new AspectCalculator(
        { Sun: [0], Moon: [90] },
        { ...default_settings, ASPECTS: defaultAspects }
      )
      const aspects = calc.radix({ Sun: [0], Moon: [90] })
      const square = aspects.find((a) => a.aspect.name === 'square')
      expect(square).toBeDefined()
      expect(square!.aspect.degree).toBe(90)
      expect(square!.aspect.orbit).toBe(8)
      expect(square!.aspect.color).toBe('#FF4500')
    })

    test('should handle multiple planets with many aspects', () => {
      const planets = {
        Sun: [0],
        Moon: [90],
        Mercury: [180],
        Venus: [270],
      }
      const calc = new AspectCalculator(planets, { ...default_settings, ASPECTS: defaultAspects })
      const aspects = calc.radix(planets)
      // Should find squares and oppositions among these
      expect(aspects.length).toBeGreaterThan(0)
    })
  })

  describe('transit - extended', () => {
    test('should return empty array for null points', () => {
      const calc = new AspectCalculator({ Sun: [0] }, { ...default_settings, ASPECTS: defaultAspects })
      expect(calc.transit(null as any)).toStrictEqual([])
    })

    test('should allow self-aspects in transit (planet transit to same natal planet)', () => {
      const calc = new AspectCalculator(
        { Sun: [0] },
        { ...default_settings, ASPECTS: defaultAspects }
      )
      const aspects = calc.transit({ Sun: [90] })
      expect(aspects.length).toBeGreaterThan(0)
    })

    test('should calculate precision with sign for approach/separation', () => {
      const calc = new AspectCalculator(
        { Sun: [0] },
        { ...default_settings, ASPECTS: defaultAspects }
      )
      const aspects = calc.transit({ Sun: [89] })
      expect(aspects).toHaveLength(1)
      // approaching => negative precision
      expect(parseFloat(aspects[0].precision)).toBeLessThan(0)
    })

    test('should flip precision sign for retrograde', () => {
      const calc = new AspectCalculator(
        { Sun: [0] },
        { ...default_settings, ASPECTS: defaultAspects }
      )
      // Direct motion approaching
      const directAspects = calc.transit({ Sun: [1, 1] })
      // Retrograde approaching
      const retroAspects = calc.transit({ Sun: [1, -1] })

      expect(directAspects).toHaveLength(1)
      expect(retroAspects).toHaveLength(1)
      // Signs should be opposite
      expect(
        Math.sign(parseFloat(directAspects[0].precision))
      ).toBe(
        -Math.sign(parseFloat(retroAspects[0].precision))
      )
    })

    test('should sort transit aspects by precision', () => {
      const calc = new AspectCalculator(
        { Sun: [0], Moon: [90], Mercury: [180] },
        { ...default_settings, ASPECTS: defaultAspects }
      )
      const aspects = calc.transit({ Jupiter: [2] })
      for (let i = 1; i < aspects.length; i++) {
        expect(Math.abs(parseFloat(aspects[i].precision))).toBeGreaterThanOrEqual(
          Math.abs(parseFloat(aspects[i - 1].precision))
        )
      }
    })

    test('should detect multiple aspect types for same transit', () => {
      const calc = new AspectCalculator(
        { Sun: [0], Moon: [90], Mercury: [120], Venus: [180] },
        { ...default_settings, ASPECTS: defaultAspects }
      )
      const aspects = calc.transit({ Jupiter: [0] })
      const names = new Set(aspects.map((a) => a.aspect.name))
      // Jupiter at 0: conjunction to Sun(0), square to Moon(90), trine to Mercury(120), opposition to Venus(180)
      expect(names.has('conjunction')).toBe(true)
      expect(names.has('square')).toBe(true)
      expect(names.has('trine')).toBe(true)
      expect(names.has('opposition')).toBe(true)
    })
  })

  describe('hasAspect - edge cases', () => {
    test('should detect aspect at exact degree', () => {
      const calc = new AspectCalculator(
        { Sun: [0], Moon: [90] },
        { ...default_settings, ASPECTS: defaultAspects }
      )
      const aspects = calc.radix({ Sun: [0], Moon: [90] })
      const square = aspects.find((a) => a.aspect.name === 'square')
      expect(square).toBeDefined()
      expect(square!.precision).toBe('0.0000')
    })

    test('should detect aspect at edge of orbit', () => {
      // Square orbit is 8, so range is 86 to 94
      const calc = new AspectCalculator(
        { Sun: [0], Moon: [86] },
        { ...default_settings, ASPECTS: defaultAspects }
      )
      const aspects = calc.radix({ Sun: [0], Moon: [86] })
      const square = aspects.find((a) => a.aspect.name === 'square')
      expect(square).toBeDefined()
    })

    test('should not detect aspect just outside orbit', () => {
      // Square orbit is 8, so 85 should be outside
      const calc = new AspectCalculator(
        { Sun: [0], Moon: [85] },
        { ...default_settings, ASPECTS: defaultAspects }
      )
      const aspects = calc.radix({ Sun: [0], Moon: [85] })
      const square = aspects.find((a) => a.aspect.name === 'square')
      expect(square).toBeUndefined()
    })
  })

  describe('calcPrecision', () => {
    test('precision should be 0 for exact aspect', () => {
      const calc = new AspectCalculator(
        { Sun: [0], Moon: [90] },
        { ...default_settings, ASPECTS: defaultAspects }
      )
      const aspects = calc.radix({ Sun: [0], Moon: [90] })
      const exactAspect = aspects.find((a) => a.precision === '0.0000')
      expect(exactAspect).toBeDefined()
    })

    test('precision should increase as angle deviates from aspect', () => {
      const calc1 = new AspectCalculator(
        { Sun: [0], Moon: [91] },
        { ...default_settings, ASPECTS: defaultAspects }
      )
      const calc2 = new AspectCalculator(
        { Sun: [0], Moon: [93] },
        { ...default_settings, ASPECTS: defaultAspects }
      )
      const aspects1 = calc1.radix({ Sun: [0], Moon: [91] })
      const aspects2 = calc2.radix({ Sun: [0], Moon: [93] })
      const sq1 = aspects1.find((a) => a.aspect.name === 'square')
      const sq2 = aspects2.find((a) => a.aspect.name === 'square')
      expect(parseFloat(sq1!.precision)).toBeLessThan(parseFloat(sq2!.precision))
    })
  })

  describe('isTransitPointApproachingToAspect', () => {
    test('transit past conjunction should be separating (positive precision)', () => {
      const calc = new AspectCalculator(
        { Sun: [0] },
        { ...default_settings, ASPECTS: defaultAspects }
      )
      const aspects = calc.transit({ Moon: [1] })
      const conj = aspects.find((a) => a.aspect.name === 'conjunction')
      expect(conj).toBeDefined()
      expect(parseFloat(conj!.precision)).toBeGreaterThan(0)
    })

    test('transit before conjunction should be approaching (negative precision)', () => {
      const calc = new AspectCalculator(
        { Sun: [0] },
        { ...default_settings, ASPECTS: defaultAspects }
      )
      const aspects = calc.transit({ Moon: [359] })
      const conj = aspects.find((a) => a.aspect.name === 'conjunction')
      expect(conj).toBeDefined()
      expect(parseFloat(conj!.precision)).toBeLessThan(0)
    })
  })
})
