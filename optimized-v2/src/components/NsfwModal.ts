import { t } from '@core/i18n';

export interface NsfwModalElements {
  modal: HTMLDivElement;
  title: HTMLElement;
  cancelBtn: HTMLButtonElement;
  confirmBtn: HTMLButtonElement;
}

export function openNsfw(elements: NsfwModalElements): void {
  elements.title.textContent = `🔞 ${t('nsfw_modal_title')}`;
  for (let i = 1; i <= 5; i++) {
    const clause = elements.modal.querySelector(`#nsfwClause${i}`) as HTMLElement | null;
    if (clause) clause.textContent = t(`nsfw_clause${i}`);
  }
  elements.cancelBtn.textContent = t('nsfw_modal_cancel');
  elements.confirmBtn.textContent = t('nsfw_modal_confirm');

  elements.modal.classList.remove('opacity-0', 'invisible');
  elements.cancelBtn.focus();
}

export function closeNsfw(elements: NsfwModalElements): void {
  elements.modal.classList.add('opacity-0', 'invisible');
}
