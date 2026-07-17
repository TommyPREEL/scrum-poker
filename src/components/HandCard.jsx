export function HandCard({ value, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`sp-hand-card${selected ? " sp-hand-card--selected" : ""}`}
      onClick={() => onSelect(value)}
      aria-pressed={selected}
    >
      {value}
    </button>
  );
}
