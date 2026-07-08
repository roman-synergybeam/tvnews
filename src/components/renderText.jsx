import React from 'react';

// Convert the *asterisk* highlight convention into accent-colored spans.
// Everything is rendered as React text nodes, so there is no HTML injection
// risk even though the content is authored by admins.
export function renderText(input) {
  const str = String(input ?? '');
  if (!str) return null;
  const parts = str.split(/(\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.length > 2 && part.startsWith('*') && part.endsWith('*')) {
      return (
        <span className="nc-accent" key={i}>
          {part.slice(1, -1)}
        </span>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}
