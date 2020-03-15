import { normalizeChannelSelection, guessRgb, range } from '../src/utils';
import { Dimension, DimensionSelection } from '../src/types';

describe('Normalized channel selections', () => {
  const dims: Dimension[] = [
    { name: 'time', type: 'temporal', unit: 'second' },
    { name: 'stain', type: 'nominal', values: ['A', 'B', 'C', 'D', 'F'] },
    { name: 'someOrdinal', type: 'ordinal' },
    { name: 'z', type: 'quantitative', unit: { size: 10, unit: 'micron' } },
    { name: 'y', type: 'quantitative', unit: { size: 1, unit: 'micron' } },
    { name: 'x', type: 'quantitative', unit: { size: 1, unit: 'micron' } },
  ];

  test.each([
    [[{ id: 'time', index: 1 }], [1, 0, 0, 0, 0, 0]],
    [
      [
        { id: 'time', index: 4 },
        { id: 'time', index: 5 },
      ],
      [5, 0, 0, 0, 0, 0],
    ],
    [
      [
        { id: 'time', index: 1 },
        { id: 'stain', index: 'C' },
      ],
      [1, 2, 0, 0, 0, 0],
    ],
    [
      [
        { id: 'time', index: 4 },
        { id: 'stain', index: 'B' },
        { id: 2, index: 2 },
        { id: 4, index: 34 },
      ],
      [4, 1, 2, 0, 34, 0],
    ],
  ])(
    'Sets correct selection %s, expected %p',
    (input: DimensionSelection[], expected: number[]) => {
      expect(normalizeChannelSelection(dims, input)).toEqual(expected);
    },
  );

  test.each([
    [[{ id: 'time', index: 'F' }]],
    [[{ id: 'notALabel', index: 0 }]],
    [[{ id: 10, index: 0 }]],
    [[{ id: 'stain', index: 'G' }]],
    [[{ id: 'z', index: -2 }]],
    [[{ id: 'someOrdinal', index: 'D' }]],
  ])('Throw for invalid selections', (input: DimensionSelection[]) => {
    expect(() => normalizeChannelSelection(dims, input)).toThrow();
  });
});

describe('Guess RGB/A', () => {
  test.each([
    [[6, 20, 2, 3, 4], true],
    [[6, 20, 2, 3, 3], true],
    [[6, 20, 5, 6, 2], false],
    [[150, 100, 2, 3, 50], false],
    [[5, 4], false],
    [[5, 3], false],
    [[50, 50, 4], true],
  ])('Guess RGB based on shape %s, expected %p', (input: number[], expected: boolean) => {
    expect(guessRgb(input)).toEqual(expected);
  });
});

describe('Test range util', () => {
  test.each([
    [0, []],
    [2, [0, 1]],
    [10, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]],
  ])('Valid length %s, expected %p', (input: number, expected: number[]) => {
    expect(range(input)).toEqual(expected);
  });

  test.each([[-1], [-10]])('Invalid lengths %s, expected %p', (input: number) => {
    expect(() => range(input)).toThrow();
  });
});
