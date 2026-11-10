import { useState } from 'react';

const MAX_TAGS = 5;

// Type a tag and press Enter or comma to add it. Click × (or Backspace on an empty box) to remove one.
export default function TagInput({ id, tags, onChange, error }) {
  const [text, setText] = useState('');

  function add(raw) {
    const name = raw.trim().replace(/^#/, '');
    if (!name) return;
    const exists = tags.some((t) => t.toLowerCase() === name.toLowerCase());
    if (!exists && tags.length < MAX_TAGS && name.length <= 30) onChange([...tags, name]);
    setText('');
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(text);
    } else if (e.key === 'Backspace' && !text && tags.length) {
      onChange(tags.slice(0, -1));
    }
  }

  const full = tags.length >= MAX_TAGS;
  return (
    <div className="field">
      <label htmlFor={id}>Tags</label>
      <div className={`tag-input ${error ? 'invalid' : ''}`}>
        {tags.map((t) => (
          <span key={t} className="tag-pill">
            #{t}
            <button type="button" aria-label={`Remove tag ${t}`} onClick={() => onChange(tags.filter((x) => x !== t))}>
              ×
            </button>
          </span>
        ))}
        <input
          id={id}
          value={text}
          disabled={full}
          placeholder={full ? 'Maximum 5 tags' : 'Add a tag and press Enter'}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => add(text)}
          maxLength={30}
        />
      </div>
      {error ? <span className="field-error">{error}</span> : <span className="field-hint">Up to 5 tags, e.g. react, nodejs, css.</span>}
    </div>
  );
}
