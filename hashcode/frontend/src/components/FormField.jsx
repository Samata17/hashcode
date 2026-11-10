// A label + input + error message, all linked together for screen readers.
// Pass "as='textarea'" for a multi-line field.
export default function FormField({ id, label, error, hint, as = 'input', className = '', ...inputProps }) {
  const Tag = as;
  const base = as === 'textarea' ? 'textarea' : 'input';
  return (
    <div className="field">
      {label && <label htmlFor={id}>{label}</label>}
      <Tag
        id={id}
        className={`${base} ${error ? 'invalid' : ''} ${className}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        {...inputProps}
      />
      {error ? (
        <span id={`${id}-error`} className="field-error">
          {error}
        </span>
      ) : (
        hint && (
          <span id={`${id}-hint`} className="field-hint">
            {hint}
          </span>
        )
      )}
    </div>
  );
}
