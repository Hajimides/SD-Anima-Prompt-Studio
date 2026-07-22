import type { Lang, LocalizedName } from '@app-types/index';
import { getData } from '@core/dataManager';

let currentLang: Lang = 'zh-CN';

export function setLanguage(lang: Lang): void {
  currentLang = lang;
  document.documentElement.lang = lang === 'zh-TW' ? 'zh-TW' : lang === 'en' ? 'en' : 'zh-CN';
}

export function getLanguage(): Lang {
  return currentLang;
}

export function t(key: string, fallback?: string): string {
  const dict = getData().i18n[currentLang];
  if (dict && key in dict) return dict[key];
  const fallbackDict = getData().i18n['zh-CN'];
  if (fallbackDict && key in fallbackDict) return fallbackDict[key];
  return fallback ?? key;
}

export function getGroupName(name: LocalizedName | string, lang: Lang = currentLang): string {
  if (typeof name === 'string') return name;
  return name[lang] ?? name['zh-CN'] ?? Object.values(name)[0] ?? '';
}

export function getAvailableLanguages(): Lang[] {
  return Object.keys(getData().i18n) as Lang[];
}
