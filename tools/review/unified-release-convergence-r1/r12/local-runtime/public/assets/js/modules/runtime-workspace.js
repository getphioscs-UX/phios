import { t } from '../i18n.js';
import { getWorkspaceOptions } from './runtime-workspace-state.js';

export const RUNTIME_STAGES = Object.freeze([
  { id: 'entry', number: '01', href: '/reality-entry.html' },
  { id: 'reconstruction', number: '02', href: '/reality-reconstruction.html' },
  { id: 'reading', number: '03', href: '/reality-reading.html' },
  { id: 'navigation', number: '04', href: '/reality-navigation.html' },
  { id: 'review', number: '05', href: '/reality-review.html' },
  { id: 'memory', number: '06', href: '/my-reality.html#memory' },
  { id: 'continuity', number: '07', href: '/my-reality.html#continuity' }
]);

const stageKey = id => `workspace.stage.${id}`;

export function renderRuntimeWorkspace(root, options = {}) {
  if (!root) return;
  const resolved = options.useSharedState === false ? options : getWorkspaceOptions(options.currentStage);
  const currentStage = resolved.currentStage || 'entry';
  const completed = new Set(resolved.completedStages || []);
  const available = new Set(resolved.availableStages || ['entry']);
  const currentIndex = RUNTIME_STAGES.findIndex(stage => stage.id === currentStage);

  root.innerHTML = `<aside class="runtime-workspace-sidebar" aria-label="${t('workspace.sidebarAria')}">
    <div class="runtime-workspace-brand"><span aria-hidden="true">Φ</span><div><strong>PHI OS</strong><small>${t('workspace.runtimeLabel')}</small></div></div>
    <nav><ol>${RUNTIME_STAGES.map((stage,index)=>{
      const isCurrent=stage.id===currentStage;
      const isComplete=completed.has(stage.id);
      const canOpen=available.has(stage.id) || isCurrent || isComplete;
      const classes=[isCurrent?'is-current':'',isComplete?'is-complete':'',!canOpen?'is-locked':''].filter(Boolean).join(' ');
      const label=isCurrent?t('workspace.currentStage'):isComplete?t('workspace.completedStage'):canOpen?t('workspace.availableStage'):t('workspace.upcomingStage');
      const content=`<span>${stage.number}</span><strong>${t(stageKey(stage.id))}</strong><small>${label}</small>`;
      return `<li class="${classes}">${canOpen?`<a href="${stage.href}"${isCurrent?' aria-current="step"':''}>${content}</a>`:`<div aria-disabled="true">${content}</div>`}</li>`;
    }).join('')}</ol></nav>
    <div class="runtime-workspace-boundary"><strong>${t('workspace.boundaryTitle')}</strong><p>${t('workspace.boundaryText')}</p></div>
  </aside>`;
}

export function initializeRuntimeWorkspace(options = {}) {
  document.querySelectorAll('[data-runtime-workspace]').forEach(root => renderRuntimeWorkspace(root, options));
}
