/**
 * Fullscreen modal for rendered diagrams
 */

export function initDiagrams(): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>('figure.mermaid > .mermaid-expand');
  if (!buttons.length) return;

  const dialog = document.createElement('dialog');
  dialog.className = 'mermaid-modal';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'mermaid-close';
  close.setAttribute('aria-label', 'Close diagram');
  close.textContent = '\u00d7';
  const body = document.createElement('div');
  body.className = 'mermaid-modal-body';
  dialog.append(close, body);
  document.body.append(dialog);

  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog || event.target === body) dialog.close();
  });
  dialog.addEventListener('close', () => body.replaceChildren());

  for (const button of buttons) {
    button.addEventListener('click', () => {
      const svg = button.parentElement?.querySelector(':scope > svg');
      if (!svg) return;
      body.replaceChildren(svg.cloneNode(true));
      dialog.showModal();
    });
  }
}
