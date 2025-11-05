'use strict';

// Filters to prevent meta/diagnostic/stat-like content from being spoken in voice

function stripDiagnostics(text) {
  try {
    let out = String(text || '');
    // Remove lines that look like stats/diagnostics
    const statLine = /^(?:\s*)(?:mood|energy|consciousness|awareness|stats?|emotional\s*state|focus|anxiety|fatigue)\s*[:=].*$/gim;
    out = out.replace(statLine, '');

    // Remove bracketed meta [..] or (..) that mention internal systems or percents
    const bracketMeta = /\[(?:[^\]]*(?:mood|energy|consciousness|%|tokens?|latency|model)[^\]]*)\]/gim;
    const parenMeta = /\((?:[^)]*(?:mood|energy|consciousness|%|tokens?|latency|model)[^)]*)\)/gim;
    out = out.replace(bracketMeta, '').replace(parenMeta, '');

    // Remove obvious debug key=value pairs
    out = out.replace(/\b[a-zA-Z_]{3,12}\s*=\s*[-+]?\d+(?:\.\d+)?%?/g, '');

    // Collapse extra spaces
    out = out.replace(/\s{2,}/g, ' ').trim();
    return out;
  } catch {
    return text;
  }
}

module.exports = { stripDiagnostics };
