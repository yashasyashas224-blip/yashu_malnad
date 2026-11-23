import { CATEGORIES, type CategoryId } from '../data/locations';

interface CategoryBarProps {
  category: CategoryId | 'all';
  onChange: (category: CategoryId | 'all') => void;
}

export function CategoryBar({ category, onChange }: CategoryBarProps) {
  const options: Array<{ id: CategoryId | 'all'; label: string; emoji: string }> = [
    { id: 'all', label: 'All places', emoji: '📍' },
    ...CATEGORIES.map((item) => ({ id: item.id, label: item.label, emoji: item.emoji })),
  ];

  return (
    <div className="shrink-0 border-b border-slate-200 bg-white">
      <div
        role="group"
        aria-label="Filter campus places by category"
        className="category-scroll flex items-center gap-1.5 overflow-x-auto px-3 py-2 sm:px-4"
      >
        {options.map((option) => {
          const active = option.id === category;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.id)}
              className={`flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition sm:text-[13px] ${
                active
                  ? 'border-navy-900 bg-navy-900 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span aria-hidden="true">{option.emoji}</span>
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
