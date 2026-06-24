import { describe, it, expect } from 'vitest';
import { createDefaultState } from '@core/state';
import {
  toggleGroupSelection,
  removeGroupSelection,
  clearAllSelections,
  composePrompt,
  getTotalGroups,
  getTotalTexts,
  getMutualExclusion,
} from '@core/promptEngine';
import type { AppState } from '@app-types/index';

describe('promptEngine', () => {
  function makeState(): AppState {
    return createDefaultState();
  }

  it('toggles group selection', () => {
    const state = makeState();
    const result = toggleGroupSelection(state, 'quality', 1);
    expect(result.state.selectedGroups.quality.has(1)).toBe(true);
    expect(result.deselected).toEqual([]);
  });

  it('mutually excludes actionTag and actionNatural', () => {
    const state = makeState();
    state.selectedGroups.actionNatural = new Set([1]);
    const result = toggleGroupSelection(state, 'actionTag', 1);
    expect(result.state.selectedGroups.actionTag.has(1)).toBe(true);
    expect(result.state.selectedGroups.actionNatural.size).toBe(0);
    expect(result.deselected).toContainEqual({ cat: 'actionNatural', id: 1 });
  });

  it('mutually excludes nsfwActionTag and nsfwActionNatural', () => {
    const state = makeState();
    state.selectedGroups.nsfwActionTag = new Set([1]);
    const result = toggleGroupSelection(state, 'nsfwActionNatural', 1);
    expect(result.state.selectedGroups.nsfwActionNatural.has(1)).toBe(true);
    expect(result.state.selectedGroups.nsfwActionTag.size).toBe(0);
  });

  it('removes group selection', () => {
    const state = makeState();
    state.selectedGroups.quality = new Set([1, 2]);
    const newState = removeGroupSelection(state, 'quality', 1);
    expect(newState.selectedGroups.quality.has(1)).toBe(false);
    expect(newState.selectedGroups.quality.has(2)).toBe(true);
  });

  it('clears all selections', () => {
    const state = makeState();
    state.selectedGroups.quality = new Set([1]);
    state.selectedGroups.character = new Set([2]);
    const newState = clearAllSelections(state);
    expect(getTotalGroups(newState)).toBe(0);
  });

  it('composes prompt in SD mode', () => {
    const state = makeState();
    state.selectedGroups.quality = new Set([1]);
    const prompt = composePrompt(state);
    expect(prompt).toContain('masterpiece');
    expect(prompt).toContain('best quality');
  });

  it('composes prompt in Anima mode', () => {
    const state = makeState();
    state.mode = 'anima';
    state.selectedGroups.quality = new Set([1]);
    const prompt = composePrompt(state);
    expect(prompt.startsWith('score_9')).toBe(true);
    expect(prompt).toContain('masterpiece');
  });

  it('counts total groups and texts', () => {
    const state = makeState();
    state.selectedGroups.quality = new Set([1, 2]);
    expect(getTotalGroups(state)).toBe(2);
    expect(getTotalTexts(state)).toBeGreaterThan(0);
  });

  it('returns correct mutual exclusion pairs', () => {
    expect(getMutualExclusion('actionTag')).toBe('actionNatural');
    expect(getMutualExclusion('actionNatural')).toBe('actionTag');
    expect(getMutualExclusion('quality')).toBeNull();
  });
});
