import type {
  AppState,
  CategoryKey,
  PromptGroup,
  PromptLibrary,
  SelectedGroupItem,
} from '@app-types/index';
import { getGroupName, t } from '@core/i18n';
import { shuffle } from '@utils/shuffle';
import { getAllOrder, getVisibleOrder, MUTUALLY_EXCLUSIVE_PAIRS } from '@core/state';
import { getData } from '@core/dataManager';

export const promptLibrary: PromptLibrary = new Proxy({} as PromptLibrary, {
  get(_target, prop) {
    return getData().promptLibrary[prop as CategoryKey];
  },
});

export function getGroupData(cat: CategoryKey, id: number): PromptGroup | undefined {
  return getData().promptLibrary[cat]?.find((g) => g.id === id);
}

export function getAllSelectedGroups(state: AppState): SelectedGroupItem[] {
  const result: SelectedGroupItem[] = [];
  const order = getVisibleOrder(state);

  for (const cat of order) {
    const ids = state.selectedGroups[cat];
    if (!ids) continue;
    for (const id of ids) {
      const group = getGroupData(cat, id);
      if (group) {
        result.push({
          category: cat,
          id: group.id,
          name: group.name,
          texts: group.texts,
          imageUrl: group.imageUrl,
        });
      }
    }
  }
  return result;
}

export function getTotalGroups(state: AppState): number {
  return getAllSelectedGroups(state).length;
}

export function getTotalTexts(state: AppState): number {
  return getAllSelectedGroups(state).reduce((sum, g) => sum + g.texts.length, 0);
}

export function composePrompt(state: AppState): string {
  const allGroups = getAllSelectedGroups(state);
  if (allGroups.length === 0) return '';

  let allTexts: string[] = [];
  for (const group of allGroups) {
    allTexts = allTexts.concat(group.texts);
  }

  if (state.shuffled) {
    allTexts = shuffle(allTexts);
  }

  let prompt = allTexts.join(', ');
  if (state.mode === 'anima') {
    prompt = t('animaPrefix') + prompt;
  }
  return prompt;
}

export function getMutualExclusion(cat: CategoryKey): CategoryKey | null {
  for (const [a, b] of MUTUALLY_EXCLUSIVE_PAIRS) {
    if (cat === a) return b;
    if (cat === b) return a;
  }
  return null;
}

export function toggleGroupSelection(
  state: AppState,
  cat: CategoryKey,
  id: number
): { state: AppState; deselected: Array<{ cat: CategoryKey; id: number }> } {
  const selectedGroups = { ...state.selectedGroups };
  const targetSet = new Set(selectedGroups[cat]);
  const deselected: Array<{ cat: CategoryKey; id: number }> = [];

  if (targetSet.has(id)) {
    targetSet.delete(id);
  } else {
    const mutual = getMutualExclusion(cat);
    if (mutual && selectedGroups[mutual]?.size) {
      const cleared = Array.from(selectedGroups[mutual]);
      selectedGroups[mutual] = new Set();
      for (const clearedId of cleared) {
        deselected.push({ cat: mutual, id: clearedId });
      }
    }
    targetSet.add(id);
  }

  selectedGroups[cat] = targetSet;

  return {
    state: { ...state, selectedGroups, shuffled: false },
    deselected,
  };
}

export function removeGroupSelection(state: AppState, cat: CategoryKey, id: number): AppState {
  const selectedGroups = { ...state.selectedGroups };
  const targetSet = new Set(selectedGroups[cat]);
  targetSet.delete(id);
  selectedGroups[cat] = targetSet;
  return { ...state, selectedGroups, shuffled: false };
}

export function clearAllSelections(state: AppState): AppState {
  const selectedGroups = { ...state.selectedGroups };
  for (const cat of getAllOrder()) {
    selectedGroups[cat] = new Set();
  }
  return { ...state, selectedGroups, shuffled: false };
}

export function filterGroups(cat: CategoryKey, term: string): PromptGroup[] {
  const groups = getData().promptLibrary[cat] ?? [];
  if (!term) return groups;
  const lower = term.toLowerCase();
  return groups.filter((g) => {
    const name = getGroupName(g.name).toLowerCase();
    const texts = g.texts.join(' ').toLowerCase();
    return name.includes(lower) || texts.includes(lower);
  });
}
