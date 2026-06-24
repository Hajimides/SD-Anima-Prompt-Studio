import type { AppState, CategoryKey } from '@app-types/index';
import { t } from '@core/i18n';
import { getVisibleOrder } from '@core/state';
import { getData } from '@core/dataManager';

export interface SidebarRenderContext {
  state: AppState;
  container: HTMLElement;
  onNavigate: (cat: CategoryKey) => void;
}

export function renderSidebar({ state, container, onNavigate }: SidebarRenderContext): void {
  const order = getVisibleOrder(state);
  container.innerHTML = '';

  const fragment = document.createDocumentFragment();
  for (const cat of order) {
    const catMeta = getData().categoryMeta[cat] ?? { icon: '•', color: 'indigo' };
    const selCount = state.selectedGroups[cat]?.size ?? 0;
    const isActive = state.activeCategory === cat;

    const btn = document.createElement('button');
    btn.className = `sidebar-item w-full flex items-center gap-3 px-4 py-2.5 rounded-r-xl text-left text-sm font-medium transition-all duration-200 ${
      isActive ? 'active text-zinc-100' : 'text-zinc-400'
    }`;
    btn.setAttribute('data-sidebar-cat', cat);
    btn.setAttribute('aria-current', isActive ? 'page' : 'false');
    btn.innerHTML = `
      <span class="text-base w-6 text-center" aria-hidden="true">${catMeta.icon}</span>
      <span class="flex-1 truncate">${t('cat_' + cat)}</span>
      ${selCount > 0 ? `<span class="sidebar-badge-v10 text-[11px] ${isActive ? 'text-zinc-400' : 'text-zinc-600'} bg-white/5 px-1.5 py-0.5 rounded-full min-w-[20px] text-center">${selCount}</span>` : ''}
    `;
    btn.addEventListener('click', () => onNavigate(cat));
    fragment.appendChild(btn);
  }

  container.appendChild(fragment);
}

export function patchSidebarBadge(cat: CategoryKey, count: number, isActive: boolean): void {
  const item = document.querySelector(`[data-sidebar-cat="${cat}"]`);
  if (!item) return;

  let badge = item.querySelector('.sidebar-badge-v10');
  if (count > 0) {
    if (badge) {
      badge.textContent = String(count);
    } else {
      badge = document.createElement('span');
      badge.className = `sidebar-badge-v10 text-[11px] ${isActive ? 'text-zinc-400' : 'text-zinc-600'} bg-white/5 px-1.5 py-0.5 rounded-full min-w-[20px] text-center`;
      badge.textContent = String(count);
      item.appendChild(badge);
    }
  } else if (badge) {
    badge.remove();
  }
}

export function updateSidebarTotalBadge(el: HTMLElement, total: number): void {
  el.textContent = `${total} ${t('badge_groups')}`;
}

export function setActiveSidebarItem(cat: CategoryKey): void {
  document.querySelectorAll('[data-sidebar-cat]').forEach((item) => {
    const isActive = item.getAttribute('data-sidebar-cat') === cat;
    item.classList.toggle('active', isActive);
    item.classList.toggle('text-zinc-100', isActive);
    item.classList.toggle('text-zinc-400', !isActive);
    item.setAttribute('aria-current', isActive ? 'page' : 'false');
  });
}
