const installedScopes = new WeakSet();
const openerByDialog = new WeakMap();

function resolveDialog(scope, id) {
  if (!id) return null;
  const dialog = scope.querySelector(`#${CSS.escape(id)}`);
  return dialog instanceof HTMLDialogElement ? dialog : null;
}

function syncExpanded(opener, open) {
  if (opener?.hasAttribute?.('aria-expanded')) opener.setAttribute('aria-expanded', String(open));
}

function openDialog(dialog, opener) {
  const parent = opener?.closest?.('dialog[open]');
  if (parent && parent !== dialog) parent.close('switch');
  openerByDialog.set(dialog, opener || null);
  syncExpanded(opener, true);
  queueMicrotask(() => {
    if (!dialog.open) dialog.showModal();
    document.documentElement.dataset.cxDialogOpen = dialog.id || 'true';
    dialog.dispatchEvent(new CustomEvent('phios:dialogopen', { bubbles: true, detail: { id: dialog.id } }));
  });
}

function closeDialog(dialog, value = 'close') {
  if (dialog?.open) dialog.close(value);
}

export function installCustomerDialogs(scope = document) {
  if (installedScopes.has(scope)) return;
  installedScopes.add(scope);

  scope.addEventListener('click', event => {
    const opener = event.target.closest('[data-cx-dialog-open]');
    if (opener) {
      const dialog = resolveDialog(scope, opener.dataset.cxDialogOpen);
      if (dialog) {
        event.preventDefault();
        openDialog(dialog, opener);
      }
      return;
    }

    const close = event.target.closest('[data-cx-dialog-close]');
    if (close) {
      event.preventDefault();
      closeDialog(close.closest('dialog'));
      return;
    }

    const dialog = event.target instanceof HTMLDialogElement ? event.target : null;
    if (dialog?.open) closeDialog(dialog, 'backdrop');
  });

  scope.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('close', () => {
      const opener = openerByDialog.get(dialog);
      syncExpanded(opener, false);
      openerByDialog.delete(dialog);
      if (!scope.querySelector('dialog[open]')) delete document.documentElement.dataset.cxDialogOpen;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
      dialog.dispatchEvent(new CustomEvent('phios:dialogclose', { bubbles: true, detail: { id: dialog.id, returnValue: dialog.returnValue } }));
    });
  });
}
