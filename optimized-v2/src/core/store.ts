import type { AppState } from '@app-types/index';
import { createDefaultState, loadState, persistState } from '@core/state';

type Listener = (state: AppState, prevState: AppState) => void;
type SelectorListener<T> = (value: T, prevValue: T, state: AppState) => void;

class Store {
  private state: AppState;
  private listeners: Set<Listener> = new Set();
  private selectorListeners: Map<string, Set<(value: unknown, prevValue: unknown, state: AppState) => void>> = new Map();

  constructor() {
    this.state = { ...createDefaultState(), ...loadState() };
  }

  getState(): AppState {
    return this.state;
  }

  setState(partial: Partial<AppState>): void {
    const prevState = this.state;
    this.state = { ...prevState, ...partial };
    this.notify(prevState);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  subscribeTo<T>(selector: (state: AppState) => T, listener: SelectorListener<T>): () => void {
    const key = selector.toString();
    if (!this.selectorListeners.has(key)) {
      this.selectorListeners.set(key, new Set());
    }
    const wrapped = listener as (value: unknown, prevValue: unknown, state: AppState) => void;
    this.selectorListeners.get(key)!.add(wrapped);

    return () => {
      this.selectorListeners.get(key)?.delete(wrapped);
    };
  }

  private notify(prevState: AppState): void {
    this.listeners.forEach((listener) => listener(this.state, prevState));
    this.selectorListeners.forEach((listeners) => {
      // Note: selector-based subscriptions are best-effort here since we don't re-evaluate selectors
      listeners.forEach((listener) => listener(this.state, prevState, this.state));
    });
    persistState(this.state);
  }
}

export const store = new Store();

export function dispatch(partial: Partial<AppState>): void {
  store.setState(partial);
}

export function getState(): AppState {
  return store.getState();
}
