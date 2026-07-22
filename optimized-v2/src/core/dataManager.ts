import type {
  PromptLibrary,
  CategoryMetaMap,
  CategoryKey,
  PromptGroup,
  LocalizedName,
  Lang,
  I18nMap,
} from '@app-types/index';
import defaultPromptLibrary from '@data/promptLibrary.json';
import defaultCategoryMeta from '@data/categoryMeta.json';
import defaultZhCN from '@i18n/zh-CN.json';
import defaultZhTW from '@i18n/zh-TW.json';
import defaultEn from '@i18n/en.json';

const STORAGE_KEY = 'prompt-studio-v2-data';

export interface EditableData {
  promptLibrary: PromptLibrary;
  categoryMeta: CategoryMetaMap;
  i18n: Record<Lang, I18nMap>;
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function getDefaultData(): EditableData {
  return {
    promptLibrary: deepClone(defaultPromptLibrary) as PromptLibrary,
    categoryMeta: deepClone(defaultCategoryMeta) as CategoryMetaMap,
    i18n: {
      'zh-CN': deepClone(defaultZhCN) as I18nMap,
      'zh-TW': deepClone(defaultZhTW) as I18nMap,
      en: deepClone(defaultEn) as I18nMap,
    },
  };
}

export function loadEditableData(): EditableData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as EditableData;
      if (parsed.promptLibrary && parsed.categoryMeta && parsed.i18n) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load editable data from localStorage', e);
  }
  return getDefaultData();
}

export function saveEditableData(data: EditableData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save editable data to localStorage', e);
  }
}

export function exportEditableData(data: EditableData): string {
  return JSON.stringify(data, null, 2);
}

export function importEditableData(json: string): EditableData | null {
  try {
    const parsed = JSON.parse(json) as EditableData;
    if (parsed.promptLibrary && parsed.categoryMeta && parsed.i18n) {
      if (draftData) {
        draftData = parsed;
      } else {
        currentData = parsed;
        saveEditableData(currentData);
      }
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to import editable data', e);
  }
  return null;
}

// ========== Draft mode for editor ==========
let currentData: EditableData = loadEditableData();
let draftData: EditableData | null = null;

export function getData(): EditableData {
  return draftData ?? currentData;
}

export function createDraft(): EditableData {
  draftData = deepClone(currentData);
  return draftData;
}

export function discardDraft(): void {
  draftData = null;
}

export function commitDraft(): void {
  if (draftData) {
    currentData = draftData;
    draftData = null;
    saveEditableData(currentData);
  }
}

export function hasDraft(): boolean {
  return draftData !== null;
}

export function isDraftModified(): boolean {
  if (!draftData) return false;
  return JSON.stringify(draftData) !== JSON.stringify(currentData);
}

export function resetEditableData(): EditableData {
  const defaults = getDefaultData();
  if (draftData) {
    draftData = defaults;
  } else {
    currentData = defaults;
    saveEditableData(currentData);
  }
  return defaults;
}

// Category operations
export function getCategories(): CategoryKey[] {
  return Object.keys(getData().promptLibrary) as CategoryKey[];
}

export function getCategoryMeta(cat: CategoryKey): CategoryMetaMap[CategoryKey] | undefined {
  return getData().categoryMeta[cat];
}

export function getCategoryI18n(cat: CategoryKey): string {
  return getData().i18n['zh-CN']['cat_' + cat] ?? cat;
}

export function getGroups(cat: CategoryKey): PromptGroup[] {
  return getData().promptLibrary[cat] ?? [];
}

export function addGroup(cat: CategoryKey, group: PromptGroup): void {
  if (!getData().promptLibrary[cat]) return;
  const groups = getData().promptLibrary[cat];
  const maxId = groups.reduce((max, g) => Math.max(max, g.id), 0);
  group.id = maxId + 1;
  groups.push(group);
}

export function updateGroup(cat: CategoryKey, id: number, updates: Partial<PromptGroup>): void {
  const groups = getData().promptLibrary[cat];
  if (!groups) return;
  const idx = groups.findIndex((g) => g.id === id);
  if (idx === -1) return;
  groups[idx] = { ...groups[idx], ...updates };
}

export function deleteGroup(cat: CategoryKey, id: number): void {
  const groups = getData().promptLibrary[cat];
  if (!groups) return;
  getData().promptLibrary[cat] = groups.filter((g) => g.id !== id);
}

export function addCategory(
  key: CategoryKey,
  meta: CategoryMetaMap[CategoryKey],
  names: LocalizedName
): boolean {
  if (getData().promptLibrary[key]) return false;

  getData().promptLibrary[key] = [];
  getData().categoryMeta[key] = meta;
  getData().i18n['zh-CN']['cat_' + key] = names['zh-CN'];
  getData().i18n['zh-TW']['cat_' + key] = names['zh-TW'];
  getData().i18n.en['cat_' + key] = names.en;
  return true;
}

export function updateCategory(
  key: CategoryKey,
  meta: Partial<CategoryMetaMap[CategoryKey]>,
  names?: LocalizedName
): void {
  if (getData().categoryMeta[key]) {
    getData().categoryMeta[key] = { ...getData().categoryMeta[key], ...meta };
  }
  if (names) {
    getData().i18n['zh-CN']['cat_' + key] = names['zh-CN'];
    getData().i18n['zh-TW']['cat_' + key] = names['zh-TW'];
    getData().i18n.en['cat_' + key] = names.en;
  }
}

export function deleteCategory(key: CategoryKey): void {
  delete getData().promptLibrary[key];
  delete getData().categoryMeta[key];
  delete getData().i18n['zh-CN']['cat_' + key];
  delete getData().i18n['zh-TW']['cat_' + key];
  delete getData().i18n.en['cat_' + key];
}

export function reorderCategories(order: CategoryKey[]): void {
  const reordered: PromptLibrary = {} as PromptLibrary;
  for (const cat of order) {
    if (getData().promptLibrary[cat]) {
      reordered[cat] = getData().promptLibrary[cat];
    }
  }
  // Add any missing categories at the end
  for (const cat of Object.keys(getData().promptLibrary)) {
    if (!reordered[cat as CategoryKey]) {
      reordered[cat as CategoryKey] = getData().promptLibrary[cat as CategoryKey];
    }
  }
  getData().promptLibrary = reordered;
}

export function reorderGroups(cat: CategoryKey, orderedIds: number[]): void {
  const groups = getData().promptLibrary[cat];
  if (!groups) return;
  const map = new Map(groups.map((g) => [g.id, g]));
  getData().promptLibrary[cat] = orderedIds
    .map((id) => map.get(id))
    .filter((g): g is PromptGroup => g !== undefined);
}

export function updateI18n(lang: Lang, key: string, value: string): void {
  getData().i18n[lang][key] = value;
}
