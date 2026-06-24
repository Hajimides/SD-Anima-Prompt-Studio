const STORAGE_KEY = 'sd-prompt-selector-optimized-v1';

export function save<T>(data: T): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save state to localStorage', e);
  }
}

export function load<T>(): T | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn('Failed to load state from localStorage', e);
    return null;
  }
}

export function clear(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear localStorage', e);
  }
}
