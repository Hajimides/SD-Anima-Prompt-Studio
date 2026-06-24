import type { AppState, CategoryKey, PromptGroup } from '@app-types/index';
import { t, getGroupName } from '@core/i18n';
import { promptLibrary } from '@core/promptEngine';
import { getVisibleOrder } from '@core/state';
import { getData } from '@core/dataManager';
import { escapeHtml } from '@utils/dom';

export interface CategorySectionRenderContext {
  state: AppState;
  cat: CategoryKey;
  index: number;
  searchTerm: string;
  onToggle: (cat: CategoryKey, id: number) => void;
}

const tagUnselectedCls: Record<string, string> = {
  indigo: 'glass text-zinc-300 border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/5',
  purple: 'glass text-zinc-300 border-white/5 hover:border-purple-500/30 hover:bg-purple-500/5',
  pink: 'glass text-zinc-300 border-white/5 hover:border-pink-500/30 hover:bg-pink-500/5',
  emerald: 'glass text-zinc-300 border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5',
  teal: 'glass text-zinc-300 border-white/5 hover:border-teal-500/30 hover:bg-teal-500/5',
  amber: 'glass text-zinc-300 border-white/5 hover:border-amber-500/30 hover:bg-amber-500/5',
  cyan: 'glass text-zinc-300 border-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/5',
  sky: 'glass text-zinc-300 border-white/5 hover:border-sky-500/30 hover:bg-sky-500/5',
  rose: 'glass text-zinc-300 border-white/5 hover:border-rose-500/30 hover:bg-rose-500/5',
  orange: 'glass text-zinc-300 border-white/5 hover:border-orange-500/30 hover:bg-orange-500/5',
  violet: 'glass text-zinc-300 border-white/5 hover:border-violet-500/30 hover:bg-violet-500/5',
};

const tagSelectedCls: Record<string, string> = {
  indigo: 'bg-indigo-500/20 text-indigo-200 border-indigo-500/40 shadow-lg shadow-indigo-500/10',
  purple: 'bg-purple-500/20 text-purple-200 border-purple-500/40 shadow-lg shadow-purple-500/10',
  pink: 'bg-pink-500/20 text-pink-200 border-pink-500/40 shadow-lg shadow-pink-500/10',
  emerald: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40 shadow-lg shadow-emerald-500/10',
  teal: 'bg-teal-500/20 text-teal-200 border-teal-500/40 shadow-lg shadow-teal-500/10',
  amber: 'bg-amber-500/20 text-amber-200 border-amber-500/40 shadow-lg shadow-amber-500/10',
  cyan: 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40 shadow-lg shadow-cyan-500/10',
  sky: 'bg-sky-500/20 text-sky-200 border-sky-500/40 shadow-lg shadow-sky-500/10',
  rose: 'bg-rose-500/20 text-rose-200 border-rose-500/40 shadow-lg shadow-rose-500/10',
  orange: 'bg-orange-500/20 text-orange-200 border-orange-500/40 shadow-lg shadow-orange-500/10',
  violet: 'bg-violet-500/20 text-violet-200 border-violet-500/40 shadow-lg shadow-violet-500/10',
};

function createCharacterCard(group: PromptGroup, cat: CategoryKey, isSelected: boolean, lang: string): HTMLElement {
  const gName = getGroupName(group.name, lang as 'zh-CN' | 'zh-TW' | 'en');
  const imgUrl = group.imageUrl ?? '';

  const card = document.createElement('div');
  card.className = `char-card-music group shimmer-card relative rounded-2xl overflow-hidden glass border-white/5 ${
    isSelected ? 'ring-2 ring-purple-500/50 shadow-lg shadow-purple-500/15' : ''
  }`;
  card.setAttribute('data-cat-item', cat);
  card.setAttribute('data-cat', cat);
  card.setAttribute('data-id', String(group.id));
  card.setAttribute('role', 'button');
  card.setAttribute('aria-pressed', String(isSelected));
  card.setAttribute('tabindex', '0');
  card.title = `${gName}: ${group.texts.join(', ')}`;
  card.innerHTML = `
    <div class="aspect-[3/2.5] bg-gradient-to-br from-zinc-800 to-zinc-900 relative overflow-hidden">
      <img src="${escapeHtml(imgUrl)}" loading="lazy" decoding="async" onerror="this.onerror=null;this.style.display='none';" alt="${escapeHtml(gName)}" class="w-full h-full object-cover absolute inset-0 transition-opacity duration-500">
      ${isSelected ? `<div class="checkmark-overlay-v10 absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-lg z-10">✓</div>` : ''}
      <div class="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-transparent to-transparent"></div>
      <div class="absolute bottom-0 left-0 right-0 p-3">
        <p class="text-sm font-semibold text-zinc-100 leading-tight">${escapeHtml(gName)}</p>
        <p class="text-[11px] text-zinc-400 mt-0.5">${group.texts.length} ${t('badge_words')}</p>
      </div>
    </div>
  `;
  return card;
}

function createTagCard(group: PromptGroup, cat: CategoryKey, isSelected: boolean, lang: string): HTMLElement {
  const color = (getData().categoryMeta[cat]?.color) ?? 'indigo';
  const cls = isSelected ? tagSelectedCls[color] : tagUnselectedCls[color];
  const gName = getGroupName(group.name, lang as 'zh-CN' | 'zh-TW' | 'en');

  const card = document.createElement('button');
  card.className = `tag-card shimmer-card px-4 py-4 rounded-2xl text-sm font-semibold border ${cls} flex flex-col items-center justify-center text-center leading-snug min-h-[72px]`;
  card.setAttribute('data-cat-item', cat);
  card.setAttribute('data-cat', cat);
  card.setAttribute('data-id', String(group.id));
  card.setAttribute('aria-pressed', String(isSelected));
  card.title = group.texts.join(', ');
  card.innerHTML = `
    <span>${escapeHtml(gName)}</span>
    <span class="text-[10px] font-normal opacity-50 mt-1">${group.texts.length} ${t('badge_words')}</span>
  `;
  return card;
}

export function createCategorySection({ state, cat, index, searchTerm, onToggle }: CategorySectionRenderContext): HTMLElement {
  const catMeta = getData().categoryMeta[cat] ?? { icon: '•', color: 'indigo' };
  const groups = promptLibrary[cat] ?? [];
  const filteredGroups = searchTerm
    ? groups.filter((g) => {
        const name = getGroupName(g.name, state.lang).toLowerCase();
        const texts = g.texts.join(' ').toLowerCase();
        const term = searchTerm.toLowerCase();
        return name.includes(term) || texts.includes(term);
      })
    : groups;

  const section = document.createElement('section');
  section.className = 'animate-slide-up';
  section.style.animationDelay = `${index * 0.05}s`;
  section.setAttribute('data-cat-section', cat);

  const header = document.createElement('div');
  header.className = 'flex items-center gap-3 mb-4';
  header.innerHTML = `
    <span class="text-xl" aria-hidden="true">${catMeta.icon}</span>
    <h2 class="section-title text-zinc-100">${t('cat_' + cat)}</h2>
    <span class="text-xs text-zinc-600 bg-white/5 px-2 py-0.5 rounded-full">${groups.length}</span>
  `;
  section.appendChild(header);

  if (filteredGroups.length === 0 && searchTerm) {
    const noResult = document.createElement('div');
    noResult.className = 'search-no-results-v10';
    noResult.textContent = t('search_noResults');
    section.appendChild(noResult);
    return section;
  }

  const grid = document.createElement('div');
  grid.className = cat === 'character'
    ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
    : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3';

  const fragment = document.createDocumentFragment();
  for (const group of filteredGroups) {
    const isSelected = state.selectedGroups[cat]?.has(group.id) ?? false;
    const card = cat === 'character'
      ? createCharacterCard(group, cat, isSelected, state.lang)
      : createTagCard(group, cat, isSelected, state.lang);

    card.addEventListener('click', () => onToggle(cat, group.id));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onToggle(cat, group.id);
      }
    });
    fragment.appendChild(card);
  }

  grid.appendChild(fragment);
  section.appendChild(grid);
  return section;
}

export function patchCardVisual(cat: CategoryKey, id: number, isSelected: boolean): void {
  const card = document.querySelector(`[data-cat="${cat}"][data-id="${id}"]`) as HTMLElement | null;
  if (!card) return;

  card.setAttribute('aria-pressed', String(isSelected));

  if (cat === 'character') {
    if (isSelected) {
      card.classList.add('ring-2', 'ring-purple-500/50', 'shadow-lg', 'shadow-purple-500/15');
      const inner = card.querySelector('div[class*="aspect-"]');
      if (inner && !inner.querySelector('.checkmark-overlay-v10')) {
        const check = document.createElement('div');
        check.className = 'checkmark-overlay-v10 absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-lg z-10';
        check.textContent = '✓';
        inner.appendChild(check);
      }
    } else {
      card.classList.remove('ring-2', 'ring-purple-500/50', 'shadow-lg', 'shadow-purple-500/15');
      const checkmark = card.querySelector('.checkmark-overlay-v10');
      checkmark?.remove();
    }
  } else {
    const catMeta = getData().categoryMeta[cat] ?? { icon: '•', color: 'indigo' };
    const color = catMeta.color;
    const unselArr = tagUnselectedCls[color].split(/\s+/);
    const selArr = tagSelectedCls[color].split(/\s+/);
    const removeSet = isSelected ? unselArr : selArr;
    const addSet = isSelected ? selArr : unselArr;

    card.classList.remove(...removeSet);
    card.classList.add(...addSet);
  }
}

export function renderContentArea({
  state,
  container,
  searchTerm,
  onToggle,
}: {
  state: AppState;
  container: HTMLElement;
  searchTerm: string;
  onToggle: (cat: CategoryKey, id: number) => void;
}): void {
  container.innerHTML = '';
  const order = getVisibleOrder(state);

  const fragment = document.createDocumentFragment();
  order.forEach((cat, index) => {
    fragment.appendChild(createCategorySection({ state, cat, index, searchTerm, onToggle }));
  });

  container.appendChild(fragment);
}
