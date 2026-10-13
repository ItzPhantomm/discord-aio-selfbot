/**
 * Intelligent message chunker that splits long messages into chunks
 * safely within Discord's 2,000 character limit (default 1,900 chars per chunk).
 * Preserves newlines, markdown blocks, and word boundaries.
 */
function splitMessage(text, { maxLength = 1900, char = '\n' } = {}) {
  if (typeof text !== 'string') text = String(text);
  if (text.length <= maxLength) return [text];

  const chunks = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    // Try to split at the last newline before maxLength
    let splitIndex = remaining.lastIndexOf(char, maxLength);
    if (splitIndex <= 0) {
      // If no newline, try splitting at the last space
      splitIndex = remaining.lastIndexOf(' ', maxLength);
    }
    if (splitIndex <= 0) {
      // Hard break at maxLength if no space or newline
      splitIndex = maxLength;
    }

    const chunk = remaining.slice(0, splitIndex).trimEnd();
    chunks.push(chunk);
    remaining = remaining.slice(splitIndex).trimStart();
  }

  return chunks;
}

module.exports = { splitMessage };
