import type { AppState, CategoryKey } from '@app-types/index';
import { t, getGroupName } from '@core/i18n';
import { getAllSelectedGroups } from '@core/promptEngine';
import categoryMeta from '@data/categoryMeta.json';
import type { CategoryMetaMap } from '@app-types/index';
import { escapeHtml, emptyElement } from '@utils/dom';

const meta = categoryMeta as CategoryMetaMap;

const chipCls: Record<string, string> = {
  indigo: 'bg-indigo-500/10 text-indigo-200 border-indigo-500/20',
  purple: 'bg-purple-500/10 text-purple-200 border-purple-500/20',
  pink: 'bg-pink-500/10 text-pink-200 border-pink-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-200 border-emerald-500/20',
  teal: 'bg-teal-500/10 text-teal-200 border-teal-500/20',
  amber: 'bg-amber-500/10 text-amber-200 border-amber-500/20',
  cyan: 'bg-cyan-500/10 text-cyan-200 border-cyan-500/20',
  sky: 'bg-sky-500/10 text-sky-200 border-sky-500/20',
  rose: 'bg-rose-500/10 text-rose-200 border-rose-500/20',
  orange: 'bg-orange-500/10 text-orange-200 border-orange-500/20',
  violet: 'bg-violet-500/10 text-violet-200 border-violet-500/20',
};

export interface RightPanelElements {
  container: HTMLElement;
  emptyHint: HTMLElement;
  groupCountBadge: HTMLElement;
  clearAllBtn: HTMLButtonElement;
  promptOutput: HTMLTextAreaElement;
  charCount: HTMLElement;
  regenPromptBtn: HTMLButtonElement;
}

export function renderSelectedGroups(state: AppState, elements: RightPanelElements, onRemove: (cat: CategoryKey, id: number) => void): void {
  const all = getAllSelectedGroups(state);
  const total = all.length;

  elements.groupCountBadge.textContent = `${total} ${t('badge_groups')}`;

  if (total === 0) {
    elements.clearAllBtn.classList.add('hidden');
    emptyElement(elements.container);
    elements.container.appendChild(elements.emptyHint);
    elements.emptyHint.classList.remove('hidden');
    return;
  }

  elements.clearAllBtn.classList.remove('hidden');
  elements.emptyHint.classList.add('hidden');
  emptyElement(elements.container);

  const fragment = document.createDocumentFragment();
  for (const g of all) {
    const color = meta[g.category].color;
    const cls = chipCls[color];
    const gName = getGroupName(g.name, state.lang);

    const chip = document.createElement('span');
    chip.className = `selected-chip-v10 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border ${cls}`;
    chip.innerHTML = `
      ${escapeHtml(gName)}
      <span class="text-[10px] font-normal opacity-50">(${g.texts.length})</span>
      <button class="remove-chip-btn-v10 w-4 h-4 rounded-full flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-colors text-zinc-500 flex-shrink-0 text-[10px]" data-cat="${g.category}" data-id="${g.id}" title="${t('label_clearAll')}" aria-label="Remove ${escapeHtml(gName)}">✕</button>
    `;
    fragment.appendChild(chip);
  }

  elements.container.appendChild(fragment);
  elements.container.appendChild(elements.emptyHint);

  elements.container.querySelectorAll('.remove-chip-btn-v10').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const cat = (e.currentTarget as HTMLElement).getAttribute('data-cat') as CategoryKey;
      const id = Number((e.currentTarget as HTMLElement).getAttribute('data-id'));
      onRemove(cat, id);
    });
  });
}

export function updatePromptOutput(
  state: AppState,
  elements: RightPanelElements,
  _lastAutoPrompt: string,
  promptIsCustom: boolean,
  forceOverwrite: boolean = false
): { lastAutoPrompt: string; promptIsCustom: boolean } {
  const prompt = composePromptForRender(state);

  if (forceOverwrite || !promptIsCustom || elements.promptOutput.value.trim() === '') {
    elements.promptOutput.value = prompt;
    promptIsCustom = false;
  }

  elements.charCount.textContent = `${elements.promptOutput.value.length} ${t('badge_chars')}`;
  updateRegenBtn(elements, promptIsCustom);

  return { lastAutoPrompt: prompt, promptIsCustom };
}

function composePromptForRender(state: AppState): string {
  const allGroups = getAllSelectedGroups(state);
  if (allGroups.length === 0) return '';

  const allTexts = allGroups.flatMap((g) => g.texts);
  let prompt = allTexts.join(', ');
  if (state.mode === 'anima') {
    prompt = t('animaPrefix') + prompt;
  }
  return prompt;
}

export function updateRegenBtn(elements: RightPanelElements, promptIsCustom: boolean): void {
  if (promptIsCustom && elements.promptOutput.value.trim() !== '') {
    elements.regenPromptBtn.classList.remove('hidden');
  } else {
    elements.regenPromptBtn.classList.add('hidden');
  }
}
