import type { AppState, CategoryKey, Lang, Mode } from '@app-types/index';
import { store, dispatch } from '@core/store';
import { t, setLanguage } from '@core/i18n';
import { getVisibleOrder, getNsfwOrder, getAllOrder } from '@core/state';
import {
  getTotalGroups,
  toggleGroupSelection,
  removeGroupSelection,
  clearAllSelections,
} from '@core/promptEngine';
import { copyToClipboard } from '@utils/clipboard';
import { $, $$ } from '@utils/dom';
import { initShaderBackground } from '@webgl/shaderBackground';
import { createLayout } from '@components/Layout';
import { renderSidebar, patchSidebarBadge, updateSidebarTotalBadge, setActiveSidebarItem } from '@components/Sidebar';
import { renderContentArea, patchCardVisual } from '@components/CategorySection';
import { renderSelectedGroups, updatePromptOutput, updateRegenBtn, type RightPanelElements } from '@components/RightPanel';
import {
  openSettings,
  closeSettings,
  updateSettingsTexts,
  applyBlur,
  applyShimmer,
} from '@components/SettingsModal';
import { openNsfw, closeNsfw } from '@components/NsfwModal';
import { createEditorModal, openEditor, closeEditor } from '@components/EditorModal';
import '@styles/index.css';

export function initApp(): () => void {
  const { elements } = createLayout();
  const destroyShader = initShaderBackground(elements.shaderCanvas);
  const editorElements = createEditorModal();

  setLanguage(store.getState().lang);

  let lastAutoPrompt = '';
  let promptIsCustom = false;

  // Right panel element grouping
  const rightPanelElements: RightPanelElements = {
    container: elements.selectedGroupsContainer,
    emptyHint: elements.emptyHintRight,
    groupCountBadge: elements.groupCountBadge,
    clearAllBtn: elements.clearAllBtn,
    promptOutput: elements.promptOutput,
    charCount: elements.charCount,
    regenPromptBtn: elements.regenPromptBtn,
  };

  // NSFW modal element grouping
  const nsfwModalElements = {
    modal: elements.nsfwModal,
    title: $('#nsfwModalTitle', elements.nsfwModal)!,
    cancelBtn: $('#nsfwModalCancel', elements.nsfwModal) as HTMLButtonElement,
    confirmBtn: $('#nsfwModalConfirm', elements.nsfwModal) as HTMLButtonElement,
  };

  // Settings modal element grouping
  const settingsModalElements = {
    modal: elements.settingsModal,
    backdrop: $('#settingsBackdrop', elements.settingsModal)!,
    closeBtn: $('#settingsCloseBtn', elements.settingsModal) as HTMLButtonElement,
    title: elements.settingsTitle,
    blurLabel: elements.settingsBlurLabel,
    blurSlider: elements.blurSlider,
    blurValue: elements.blurValue,
    shimmerLabel: elements.settingsShimmerLabel,
    shimmerToggle: elements.shimmerToggle,
    shimmerHint: elements.settingsShimmerHint,
  };

  function fullRefresh(): void {
    const state = store.getState();
    renderSidebar({
      state,
      container: elements.sidebarNav,
      onNavigate: (cat) => {
        dispatch({ activeCategory: cat });
        setActiveSidebarItem(cat);
        const section = document.querySelector(`[data-cat-section="${cat}"]`);
        if (section) {
          const topNavHeight = elements.topNav.offsetHeight;
          elements.mainContent.scrollTo({
            top: (section as HTMLElement).offsetTop - topNavHeight - 16,
            behavior: 'smooth',
          });
        }
      },
    });
    renderContentArea({
      state,
      container: elements.contentSections,
      searchTerm: state.searchTerm,
      onToggle: handleToggleGroup,
    });
    renderSelectedGroups(state, rightPanelElements, handleRemoveGroup);
    const promptResult = updatePromptOutput(state, rightPanelElements, lastAutoPrompt, promptIsCustom, true);
    lastAutoPrompt = promptResult.lastAutoPrompt;
    promptIsCustom = promptResult.promptIsCustom;
    updateStaticTexts(state);
    updateModeUI(state);
    updateLangButtons(state);
    updateNsfwButton(state);
    applyBlur(state, settingsModalElements);
    applyShimmer(state, settingsModalElements);
  }

  function lightRefresh(): void {
    const state = store.getState();
    renderSelectedGroups(state, rightPanelElements, handleRemoveGroup);
    const promptResult = updatePromptOutput(state, rightPanelElements, lastAutoPrompt, promptIsCustom);
    lastAutoPrompt = promptResult.lastAutoPrompt;
    promptIsCustom = promptResult.promptIsCustom;
    updateSidebarTotalBadge(elements.sidebarTotalBadge, getTotalGroups(state));

    const order = getVisibleOrder(state);
    order.forEach((cat) => {
      const isActive = state.activeCategory === cat;
      patchSidebarBadge(cat, state.selectedGroups[cat]?.size ?? 0, isActive);
    });
  }

  function handleToggleGroup(cat: CategoryKey, id: number): void {
    const state = store.getState();
    const result = toggleGroupSelection(state, cat, id);
    dispatch(result.state);

    for (const { cat: dCat, id: dId } of result.deselected) {
      patchCardVisual(dCat, dId, false);
    }
    patchCardVisual(cat, id, result.state.selectedGroups[cat].has(id));
    lightRefresh();
  }

  function handleRemoveGroup(cat: CategoryKey, id: number): void {
    const state = store.getState();
    const newState = removeGroupSelection(state, cat, id);
    dispatch(newState);
    patchCardVisual(cat, id, false);
    lightRefresh();
  }

  function handleClearAll(): void {
    const state = store.getState();
    const order = getVisibleOrder(state);
    const toPatch: Array<{ cat: CategoryKey; id: number }> = [];
    for (const cat of order) {
      for (const id of state.selectedGroups[cat]) {
        toPatch.push({ cat, id });
      }
    }

    const newState = clearAllSelections(state);
    dispatch(newState);

    for (const { cat, id } of toPatch) {
      patchCardVisual(cat, id, false);
    }

    lastAutoPrompt = '';
    promptIsCustom = false;
    elements.promptOutput.value = '';
    elements.charCount.textContent = `0 ${t('badge_chars')}`;
    lightRefresh();
  }

  async function handleCopy(): Promise<void> {
    const prompt = elements.promptOutput.value;
    if (!prompt) return;
    try {
      await copyToClipboard(prompt);
      elements.copyBtn.classList.add('copy-pulse-v10');
      const span = elements.copyBtn.querySelector('span');
      if (span) span.textContent = t('copy_success');
      setTimeout(() => {
        elements.copyBtn.classList.remove('copy-pulse-v10');
        const labelSpan = elements.copyBtn.querySelector('span');
        if (labelSpan) labelSpan.textContent = t('label_copy');
      }, 1200);
    } catch (e) {
      console.error('Copy failed', e);
    }
  }

  function handleShuffle(): void {
    const state = store.getState();
    if (getTotalGroups(state) === 0) return;
    dispatch({ shuffled: true });
    const promptResult = updatePromptOutput(store.getState(), rightPanelElements, lastAutoPrompt, promptIsCustom, true);
    lastAutoPrompt = promptResult.lastAutoPrompt;
    promptIsCustom = promptResult.promptIsCustom;
  }

  function handleModeChange(mode: Mode): void {
    const state = store.getState();
    if (state.mode === mode) return;
    dispatch({ mode });
    const promptResult = updatePromptOutput(store.getState(), rightPanelElements, lastAutoPrompt, promptIsCustom, true);
    lastAutoPrompt = promptResult.lastAutoPrompt;
    promptIsCustom = promptResult.promptIsCustom;
    updateModeUI(store.getState());
  }

  function handleLangChange(lang: Lang): void {
    const state = store.getState();
    if (state.lang === lang) return;
    setLanguage(lang);
    dispatch({ lang });
    fullRefresh();
  }

  function handleNsfwToggle(): void {
    const state = store.getState();
    if (state.nsfwEnabled) {
      const selectedGroups = { ...state.selectedGroups };
      for (const cat of getNsfwOrder()) {
        selectedGroups[cat] = new Set();
      }
      dispatch({ nsfwEnabled: false, selectedGroups });
      fullRefresh();
    } else {
      openNsfw(nsfwModalElements);
    }
  }

  function confirmNsfw(): void {
    closeNsfw(nsfwModalElements);
    dispatch({ nsfwEnabled: true });
    fullRefresh();
  }

  function updateStaticTexts(_state: AppState): void {
    elements.promptOutput.placeholder = t('hint_emptyPrompt');
    elements.emptyHintRight.textContent = t('hint_emptyRight');
    elements.searchInput.placeholder = t('search_placeholder');
    elements.sidebarTitle.textContent = t('sidebarTitle');
    updateSettingsTexts(settingsModalElements);

    const labelIds = [
      'label_selectedGroups',
      'label_prompt',
      'label_clearAll',
      'label_copy',
      'label_shuffle',
      'label_nsfw',
    ];
    for (const id of labelIds) {
      const el = document.getElementById(id);
      if (el) el.textContent = t(id);
    }
  }

  function updateModeUI(state: AppState): void {
    $$<HTMLButtonElement>('.mode-option', elements.modeToggle).forEach((btn) => {
      const active = btn.dataset.mode === state.mode;
      btn.classList.toggle('bg-indigo-500', active);
      btn.classList.toggle('text-white', active);
      btn.classList.toggle('text-zinc-400', !active);
      btn.setAttribute('aria-pressed', String(active));
    });
  }

  function updateLangButtons(state: AppState): void {
    $$<HTMLButtonElement>('.lang-btn', elements.topNav).forEach((btn) => {
      const active = btn.dataset.lang === state.lang;
      btn.classList.toggle('bg-indigo-500', active);
      btn.classList.toggle('text-white', active);
      btn.classList.toggle('text-zinc-400', !active);
      btn.setAttribute('aria-pressed', String(active));
    });
  }

  function updateNsfwButton(state: AppState): void {
    const label = $('#label_nsfw', elements.nsfwBtn);
    if (state.nsfwEnabled) {
      elements.nsfwBtn.className = 'px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 glass border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20';
      elements.nsfwBtn.setAttribute('aria-pressed', 'true');
      if (label) label.textContent = t('label_nsfwOn');
    } else {
      elements.nsfwBtn.className = 'px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 glass text-zinc-400 hover:text-zinc-200 border-white/5';
      elements.nsfwBtn.setAttribute('aria-pressed', 'false');
      if (label) label.textContent = t('label_nsfw');
    }
  }

  function bindEvents(): void {
    // Search
    let searchTimeout: ReturnType<typeof setTimeout> | null = null;
    elements.searchInput.addEventListener('input', (e) => {
      const term = (e.target as HTMLInputElement).value.trim();
      if (searchTimeout) clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        dispatch({ searchTerm: term });
        renderContentArea({ state: store.getState(), container: elements.contentSections, searchTerm: term, onToggle: handleToggleGroup });
        elements.searchClearBtn.classList.toggle('hidden', !term);
      }, 150);
    });

    elements.searchClearBtn.addEventListener('click', () => {
      elements.searchInput.value = '';
      dispatch({ searchTerm: '' });
      renderContentArea({ state: store.getState(), container: elements.contentSections, searchTerm: '', onToggle: handleToggleGroup });
      elements.searchClearBtn.classList.add('hidden');
      elements.searchInput.focus();
    });

    // Mode toggle
    elements.modeToggle.addEventListener('click', (e) => {
      const opt = (e.target as HTMLElement).closest('.mode-option') as HTMLButtonElement | null;
      if (!opt || !opt.dataset.mode) return;
      handleModeChange(opt.dataset.mode as Mode);
    });

    // Language buttons
    $$<HTMLButtonElement>('.lang-btn', elements.topNav).forEach((btn) => {
      btn.addEventListener('click', () => handleLangChange(btn.dataset.lang as Lang));
    });

    // NSFW
    elements.nsfwBtn.addEventListener('click', handleNsfwToggle);
    nsfwModalElements.cancelBtn.addEventListener('click', () => closeNsfw(nsfwModalElements));
    nsfwModalElements.confirmBtn.addEventListener('click', confirmNsfw);
    elements.nsfwModal.addEventListener('click', (e) => {
      if (e.target === elements.nsfwModal) closeNsfw(nsfwModalElements);
    });

    // Settings
    elements.settingsBtn.addEventListener('click', () => openSettings(settingsModalElements));
    function refreshFromCurrentData(): void {
      const state = store.getState();
      const order = getAllOrder();
      const selectedGroups = { ...state.selectedGroups };
      const expandedCategories = { ...state.expandedCategories };
      for (const cat of order) {
        if (!selectedGroups[cat]) selectedGroups[cat] = new Set();
        if (!(cat in expandedCategories)) expandedCategories[cat] = false;
      }
      for (const cat of Object.keys(selectedGroups)) {
        if (!order.includes(cat as CategoryKey)) delete selectedGroups[cat as CategoryKey];
      }
      for (const cat of Object.keys(expandedCategories)) {
        if (!order.includes(cat as CategoryKey)) delete expandedCategories[cat as CategoryKey];
      }
      expandedCategories.quality = true;
      expandedCategories.subject = true;
      dispatch({
        selectedGroups,
        expandedCategories,
        activeCategory: order.includes(state.activeCategory) ? state.activeCategory : order[0],
      });
      fullRefresh();
    }

    elements.editorBtn.addEventListener('click', () => {
      openEditor(editorElements, {
        onChange: () => refreshFromCurrentData(),
        onSave: () => refreshFromCurrentData(),
        onCancel: () => refreshFromCurrentData(),
      });
    });
    settingsModalElements.closeBtn.addEventListener('click', () => closeSettings(settingsModalElements));
    settingsModalElements.backdrop.addEventListener('click', () => closeSettings(settingsModalElements));

    settingsModalElements.blurSlider.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value, 10);
      dispatch({ blurIntensity: value });
      applyBlur(store.getState(), settingsModalElements);
    });

    settingsModalElements.shimmerToggle.addEventListener('click', () => {
      const state = store.getState();
      dispatch({ shimmerEnabled: !state.shimmerEnabled });
      applyShimmer(store.getState(), settingsModalElements);
    });

    // Right panel
    elements.clearAllBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleClearAll();
    });
    elements.copyBtn.addEventListener('click', handleCopy);
    elements.shuffleBtn.addEventListener('click', handleShuffle);

    elements.promptOutput.addEventListener('input', () => {
      elements.charCount.textContent = `${elements.promptOutput.value.length} ${t('badge_chars')}`;
      promptIsCustom = elements.promptOutput.value !== lastAutoPrompt;
      updateRegenBtn(rightPanelElements, promptIsCustom);
    });

    elements.regenPromptBtn.addEventListener('click', () => {
      const promptResult = updatePromptOutput(store.getState(), rightPanelElements, lastAutoPrompt, promptIsCustom, true);
      lastAutoPrompt = promptResult.lastAutoPrompt;
      promptIsCustom = promptResult.promptIsCustom;
    });

    // Scroll spy for sidebar
    let scrollSpyTimeout: ReturnType<typeof setTimeout> | null = null;
    elements.mainContent.addEventListener('scroll', () => {
      if (scrollSpyTimeout) clearTimeout(scrollSpyTimeout);
      scrollSpyTimeout = setTimeout(() => {
        const state = store.getState();
        const order = getVisibleOrder(state);
        const scrollTop = elements.mainContent.scrollTop + 120;
        let currentCat = order[0];
        for (const cat of order) {
          const section = document.querySelector(`[data-cat-section="${cat}"]`);
          if (section && (section as HTMLElement).offsetTop <= scrollTop) {
            currentCat = cat;
          }
        }
        if (state.activeCategory !== currentCat) {
          dispatch({ activeCategory: currentCat });
          setActiveSidebarItem(currentCat);
        }
      }, 100);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeSettings(settingsModalElements);
        closeNsfw(nsfwModalElements);
        closeEditor(editorElements);
      }
    });
  }

  bindEvents();
  fullRefresh();

  // Remove loading state after first render
  dispatch({ isLoading: false });

  return () => {
    destroyShader();
  };
}
