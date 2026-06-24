import type {
  AppState,
  CategoryKey,
  Lang,
  SelectedGroups,
  ExpandedCategories,
  SerializedState,
} from '@app-types/index';
import { load, save } from '@utils/storage';
import safeOrder from '@data/safeOrder.json';
import nsfwOrder from '@data/nsfwOrder.json';
import { getData } from '@core/dataManager';

export const DEFAULT_SAFE_ORDER: CategoryKey[] = safeOrder as CategoryKey[];
export const DEFAULT_NSFW_ORDER: CategoryKey[] = nsfwOrder as CategoryKey[];

export function getSafeOrder(): CategoryKey[] {
  const allCats = Object.keys(getData().promptLibrary) as CategoryKey[];
  return allCats.filter((cat) => !DEFAULT_NSFW_ORDER.includes(cat));
}

export function getNsfwOrder(): CategoryKey[] {
  const allCats = Object.keys(getData().promptLibrary) as CategoryKey[];
  return allCats.filter((cat) => DEFAULT_NSFW_ORDER.includes(cat));
}

export function getAllOrder(): CategoryKey[] {
  return [...getSafeOrder(), ...getNsfwOrder()];
}

export const MUTUALLY_EXCLUSIVE_PAIRS: [CategoryKey, CategoryKey][] = [
  ['actionTag', 'actionNatural'],
  ['nsfwActionTag', 'nsfwActionNatural'],
];

function makeDefaultSelectedGroups(): SelectedGroups {
  const obj = {} as SelectedGroups;
  getAllOrder().forEach((cat) => {
    obj[cat] = new Set<number>();
  });
  return obj;
}

function makeDefaultExpandedCategories(): ExpandedCategories {
  const obj = {} as ExpandedCategories;
  getAllOrder().forEach((cat) => {
    obj[cat] = false;
  });
  obj.quality = true;
  obj.subject = true;
  return obj;
}

export function createDefaultState(): AppState {
  return {
    selectedGroups: makeDefaultSelectedGroups(),
    expandedCategories: makeDefaultExpandedCategories(),
    activeCategory: 'quality',
    shuffled: false,
    mode: 'sd',
    lang: 'zh-CN',
    nsfwEnabled: false,
    blurIntensity: 20,
    shimmerEnabled: true,
    searchTerm: '',
    isLoading: true,
  };
}

export function serializeState(state: AppState): SerializedState {
  const selectedGroups = {} as Record<CategoryKey, number[]>;
  getAllOrder().forEach((cat) => {
    selectedGroups[cat] = Array.from(state.selectedGroups[cat] ?? []);
  });

  return {
    selectedGroups,
    expandedCategories: state.expandedCategories,
    activeCategory: state.activeCategory,
    shuffled: state.shuffled,
    mode: state.mode,
    lang: state.lang,
    nsfwEnabled: state.nsfwEnabled,
    blurIntensity: state.blurIntensity,
    shimmerEnabled: state.shimmerEnabled,
  };
}

export function loadState(): Partial<AppState> {
  const data = load<SerializedState>();
  if (!data) return {};

  const allOrder = getAllOrder();
  const selectedGroups = makeDefaultSelectedGroups();
  if (data.selectedGroups) {
    allOrder.forEach((cat) => {
      const ids = data.selectedGroups[cat];
      if (Array.isArray(ids)) {
        selectedGroups[cat] = new Set(ids);
      }
    });
  }

  const result: Partial<AppState> = {};
  result.selectedGroups = selectedGroups;

  if (data.expandedCategories) result.expandedCategories = { ...makeDefaultExpandedCategories(), ...data.expandedCategories };
  if (typeof data.activeCategory === 'string' && allOrder.includes(data.activeCategory)) result.activeCategory = data.activeCategory;
  if (typeof data.shuffled === 'boolean') result.shuffled = data.shuffled;
  if (data.mode === 'sd' || data.mode === 'anima') result.mode = data.mode;
  if (data.lang === 'zh-CN' || data.lang === 'zh-TW' || data.lang === 'en') result.lang = data.lang as Lang;
  if (typeof data.nsfwEnabled === 'boolean') result.nsfwEnabled = data.nsfwEnabled;
  if (typeof data.blurIntensity === 'number') result.blurIntensity = data.blurIntensity;
  if (typeof data.shimmerEnabled === 'boolean') result.shimmerEnabled = data.shimmerEnabled;

  return result;
}

export function persistState(state: AppState): void {
  save(serializeState(state));
}

export function getVisibleOrder(state: AppState): CategoryKey[] {
  return state.nsfwEnabled ? getAllOrder() : getSafeOrder();
}

export function isCategoryNsfw(cat: CategoryKey): boolean {
  return getNsfwOrder().includes(cat);
}
