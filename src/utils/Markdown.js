const Theme = require('./Theme');

/**
 * Converts Discord & standard markdown into clean blessed-compatible formatted text.
 * Handles **bold**, *italics*, `inline code`, ```codeblocks```, > quotes, and # headings.
 */
function renderMarkdown(md) {
  if (!md || typeof md !== 'string') return '';

  let out = md;

  // Code blocks: ```js\ncode\n```
  out = out.replace(/```(?:[a-zA-Z0-9]+)?\n([\s\S]*?)```/g, (match, code) => {
    const lines = code.trim().split('\n').map(l => `  {#CCCCCC-fg}${l}{/#CCCCCC-fg}`);
    return `\n{#333333-fg}┌────────────────────────────────────────{/#333333-fg}\n${lines.join('\n')}\n{#333333-fg}└────────────────────────────────────────{/#333333-fg}\n`;
  });

  // Inline code: `code`
  out = out.replace(/`([^`]+)`/g, (match, c) => {
    return `{#FFFFFF-bg}{#000000-fg}{bold} ${c} {/bold}{/#FFFFFF-bg}{/#000000-fg}`;
  });

  // Bold text: **bold**
  out = out.replace(/\*\*([^*]+)\*\*/g, (match, b) => {
    return `{bold}{#FFFFFF-fg}${b}{/#FFFFFF-fg}{/bold}`;
  });

  // Italic text: *italic* or _italic_
  out = out.replace(/\*([^*]+)\*/g, (match, it) => {
    return `{#AAAAAA-fg}${it}{/#AAAAAA-fg}`;
  });
  out = out.replace(/_([^_]+)_/g, (match, it) => {
    return `{#AAAAAA-fg}${it}{/#AAAAAA-fg}`;
  });

  // Blockquotes: > quote
  out = out.replace(/^>\s*(.+)$/gm, (match, q) => {
    return `{#666666-fg}│{/#666666-fg} {#CCCCCC-fg}${q}{/#CCCCCC-fg}`;
  });

  // Headings: #, ##, ###
  out = out.replace(/^###\s*(.+)$/gm, (match, h) => {
    return `\n{bold}{#DDDDDD-fg}■ ${h}{/#DDDDDD-fg}{/bold}`;
  });
  out = out.replace(/^##\s*(.+)$/gm, (match, h) => {
    return `\n{bold}{#FFFFFF-fg}▲ ${h}{/#FFFFFF-fg}{/bold}`;
  });
  out = out.replace(/^#\s*(.+)$/gm, (match, h) => {
    return `\n{bold}{#FFFFFF-fg}◆ ${h.toUpperCase()}{/#FFFFFF-fg}{/bold}\n${Theme.divider(28)}`;
  });

  // Bullet points: • or * or -
  out = out.replace(/^[\*\-]\s+(.+)$/gm, (match, item) => {
    return `  {#888888-fg}▪{/#888888-fg} {#EEEEEE-fg}${item}{/#EEEEEE-fg}`;
  });

  return out;
}

module.exports = { renderMarkdown };
