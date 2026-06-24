import { describe, it, expect } from 'vitest';
import { shuffle } from '@utils/shuffle';

describe('shuffle', () => {
  it('returns a new array with same elements', () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffle(arr);
    expect(shuffled).not.toBe(arr);
    expect(shuffled.sort()).toEqual(arr);
  });

  it('does not mutate original array', () => {
    const arr = [1, 2, 3];
    shuffle(arr);
    expect(arr).toEqual([1, 2, 3]);
  });

  it('handles empty array', () => {
    expect(shuffle([])).toEqual([]);
  });
});
