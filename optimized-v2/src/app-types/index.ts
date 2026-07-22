export type Lang = 'zh-CN' | 'zh-TW' | 'en';

export type CategoryKey =
  | 'quality'
  | 'style'
  | 'subject'
  | 'character'
  | 'clothing'
  | 'actionTag'
  | 'actionNatural'
  | 'perspective'
  | 'composition'
  | 'background'
  | 'nsfwCharacter'
  | 'nsfwClothing'
  | 'nsfwExpression'
  | 'nsfwActionTag'
  | 'nsfwSpecial'
  | 'nsfwActionNatural';

export type Mode = 'sd' | 'anima';

export interface LocalizedName {
  'zh-CN': string;
  'zh-TW': string;
  en: string;
}

export interface PromptGroup {
  id: number;
  name: LocalizedName;
  texts: string[];
  imageUrl?: string;
}

export type PromptLibrary = Record<CategoryKey, PromptGroup[]>;

export interface CategoryMeta {
  icon: string;
  color: string;
}

export type CategoryMetaMap = Record<CategoryKey, CategoryMeta>;

export interface I18nMap {
  [key: string]: string;
}

export type SelectedGroups = Record<CategoryKey, Set<number>>;
export type ExpandedCategories = Record<CategoryKey, boolean>;

export interface AppState {
  selectedGroups: SelectedGroups;
  expandedCategories: ExpandedCategories;
  activeCategory: CategoryKey;
  shuffled: boolean;
  mode: Mode;
  lang: Lang;
  nsfwEnabled: boolean;
  blurIntensity: number;
  shimmerEnabled: boolean;
  searchTerm: string;
  isLoading: boolean;
}

export interface SerializedState {
  selectedGroups: Record<CategoryKey, number[]>;
  expandedCategories: Partial<ExpandedCategories>;
  activeCategory?: CategoryKey;
  shuffled?: boolean;
  mode?: Mode;
  lang?: Lang;
  nsfwEnabled?: boolean;
  blurIntensity?: number;
  shimmerEnabled?: boolean;
}

export interface SelectedGroupItem {
  category: CategoryKey;
  id: number;
  name: LocalizedName;
  texts: string[];
  imageUrl?: string;
}
