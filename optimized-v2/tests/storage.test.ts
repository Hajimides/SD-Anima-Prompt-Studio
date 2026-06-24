import { describe, it, expect, beforeEach } from 'vitest';
import { save, load, clear } from '@utils/storage';

describe('storage', () => {
  beforeEach(() => {
    clear();
  });

  it('saves and loads data', () => {
    const data = { test: true, count: 42 };
    save(data);
    expect(load()).toEqual(data);
  });

  it('returns null when no data', () => {
    expect(load()).toBeNull();
  });

  it('clears data', () => {
    save({ key: 'value' });
    clear();
    expect(load()).toBeNull();
  });
});
