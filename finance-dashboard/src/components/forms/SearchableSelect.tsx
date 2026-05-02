import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  group?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  groupLabels?: Record<string, string>;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  label,
  groupLabels,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  // Group the filtered options
  const grouped = filtered.reduce<Record<string, Option[]>>((acc, opt) => {
    const group = opt.group || '_ungrouped';
    if (!acc[group]) acc[group] = [];
    acc[group].push(opt);
    return acc;
  }, {});

  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="text-text-secondary text-xs font-body block mb-1">{label}</label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-border-subtle bg-bg-tertiary py-2 px-3 text-sm font-body transition-colors hover:border-border-active"
      >
        <span className={selectedOption ? 'text-text-primary' : 'text-text-muted'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} className="text-text-muted shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border-subtle bg-bg-elevated shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border-subtle px-3 py-2">
            <Search size={14} className="text-text-muted shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none font-body"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-text-muted font-body">
                No results found
              </div>
            ) : (
              Object.entries(grouped).map(([group, items]) => (
                <div key={group}>
                  {groupLabels && group !== '_ungrouped' && groupLabels[group] && (
                    <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted font-body">
                      {groupLabels[group]}
                    </div>
                  )}
                  {items.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setOpen(false);
                        setSearch('');
                      }}
                      className="flex w-full items-center justify-between px-3 py-1.5 text-sm text-text-primary hover:bg-bg-tertiary transition-colors font-body"
                    >
                      <span>{opt.label}</span>
                      {opt.value === value && (
                        <Check size={14} className="text-accent-green shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
