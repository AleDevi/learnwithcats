// Small helpers to turn coloured cells into HTML.

export const escapeHtml = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function cellsToHtml(row) {
  return row
    .map((cell) => {
      if (!cell.fg && !cell.bg) return escapeHtml(cell.ch);
      const style = `${cell.fg ? `color:${cell.fg};` : ''}${cell.bg ? `background:${cell.bg};` : ''}`;
      return `<span style="${style}">${escapeHtml(cell.ch)}</span>`;
    })
    .join('');
}
