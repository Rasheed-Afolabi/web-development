import { useState } from 'react';
import { format } from 'date-fns';
import type { TimeRangePreset, DateRange } from '@/types';

interface TimeRangeFilterProps {
  preset: TimeRangePreset;
  onPresetChange: (preset: TimeRangePreset) => void;
  onCustomRangeChange: (range: DateRange) => void;
}

const presets: { value: TimeRangePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'this-week', label: 'This Week' },
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'all-time', label: 'All Time' },
  { value: 'custom', label: 'Custom' },
];

export function TimeRangeFilter({ preset, onPresetChange, onCustomRangeChange }: TimeRangeFilterProps) {
  const [customStart, setCustomStart] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleCustomApply = () => {
    onCustomRangeChange({
      start: new Date(customStart + 'T00:00:00'),
      end: new Date(customEnd + 'T23:59:59'),
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onPresetChange(value)}
          className={`px-3 py-1.5 rounded-full text-xs font-body font-medium transition-all ${
            preset === value
              ? 'bg-accent-blue text-bg-primary'
              : 'bg-bg-tertiary text-text-secondary hover:bg-bg-elevated hover:text-text-primary border border-border-subtle'
          }`}
        >
          {label}
        </button>
      ))}
      {preset === 'custom' && (
        <div className="flex items-center gap-2 ml-2">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="bg-bg-tertiary border border-border-subtle rounded-lg px-2 py-1 text-xs text-text-primary font-body"
          />
          <span className="text-text-muted text-xs">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="bg-bg-tertiary border border-border-subtle rounded-lg px-2 py-1 text-xs text-text-primary font-body"
          />
          <button
            onClick={handleCustomApply}
            className="px-3 py-1 rounded-lg text-xs font-body font-medium bg-accent-blue text-bg-primary hover:bg-accent-blue/90 transition-colors"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
