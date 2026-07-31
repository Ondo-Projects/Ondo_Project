interface AdminFilterChipsProps<T extends string> {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}

export default function AdminFilterChips<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: AdminFilterChipsProps<T>) {
  return (
    <div className="admin-filter-row" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value || '__all__'}
          type="button"
          className={`admin-filter-chip${value === option.value ? ' admin-filter-chip--active' : ''}`}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
