import type { AppState } from '@app-types/index';
import { t } from '@core/i18n';

export interface SettingsModalElements {
  modal: HTMLDivElement;
  backdrop: HTMLElement;
  closeBtn: HTMLButtonElement;
  title: HTMLElement;
  blurLabel: HTMLElement;
  blurSlider: HTMLInputElement;
  blurValue: HTMLElement;
  shimmerLabel: HTMLElement;
  shimmerToggle: HTMLButtonElement;
  shimmerHint: HTMLElement;
}

export function openSettings(elements: SettingsModalElements): void {
  elements.modal.classList.remove('opacity-0', 'invisible');
  elements.modal.classList.add('opacity-100', 'visible');
  elements.closeBtn.focus();
}

export function closeSettings(elements: SettingsModalElements): void {
  elements.modal.classList.add('opacity-0', 'invisible');
  elements.modal.classList.remove('opacity-100', 'visible');
}

export function updateSettingsTexts(elements: SettingsModalElements): void {
  elements.title.textContent = t('settings_title');
  elements.blurLabel.textContent = t('settings_blur');
  elements.shimmerLabel.textContent = t('settings_shimmer');
  elements.shimmerHint.textContent = t('settings_shimmerHint');
}

export function applyBlur(state: AppState, elements: SettingsModalElements): void {
  document.documentElement.style.setProperty('--blur-intensity', `${state.blurIntensity}px`);
  elements.blurSlider.value = String(state.blurIntensity);
  elements.blurValue.textContent = `${state.blurIntensity}px`;
}

export function applyShimmer(state: AppState, elements: SettingsModalElements): void {
  const span = elements.shimmerToggle.querySelector('span');
  if (state.shimmerEnabled) {
    document.body.classList.add('shimmer-enabled');
    elements.shimmerToggle.classList.add('bg-indigo-500');
    elements.shimmerToggle.classList.remove('bg-white/10');
    span?.classList.add('translate-x-5');
    span?.classList.remove('translate-x-0.5');
    elements.shimmerToggle.setAttribute('aria-checked', 'true');
  } else {
    document.body.classList.remove('shimmer-enabled');
    elements.shimmerToggle.classList.remove('bg-indigo-500');
    elements.shimmerToggle.classList.add('bg-white/10');
    span?.classList.remove('translate-x-5');
    span?.classList.add('translate-x-0.5');
    elements.shimmerToggle.setAttribute('aria-checked', 'false');
  }
}
