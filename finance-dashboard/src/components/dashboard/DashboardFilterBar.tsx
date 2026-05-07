import { useState } from 'react';
import { format } from 'date-fns';
import { useDashboardFilterContext } from '@/contexts/DashboardFilterContext';
import { INCOME_STREAMS } from '@/data/income-streams';
import { RFDCard } from './RFDPrimitives';
import type { TimeRangePreset, IncomeStream, ExpenseCategoryGroup } from '@/types';

const TIME_PRESETS: { value: TimeRangePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'this-week', label: 'This Week' },
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'all-time', label: 'All Time' },
  { value: 'custom', label: 'Custom' },
];

const CATEGORY_GROUPS: { value: ExpenseCategoryGroup; label: string }[] = [
  { value: 'essentials', label: 'Essentials' },
  { value: 'earning-costs', label: 'Earning' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'growth', label: 'Growth' },
  { value: 'commitments', label: 'Commitments' },
];

export function DashboardFilterBar() {
  const {
    preset,
    setPreset,
    setCustomRange,
    incomeStreams,
    setIncomeStreams,
    categoryGroups,
    setCategoryGroups,
    comparison,
    setComparison,
  } = useDashboardFilterContext();

  const [customStart, setCustomStart] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [streamDropdownOpen, setStreamDropdownOpen] = useState(false);

  const handleCustomApply = () => {
    setCustomRange({
      start: new Date(customStart + 'T00:00:00'),
      end: new Date(customEnd + 'T23:59:59'),
    });
  };

  const toggleStream = (stream: IncomeStream) => {
    if (incomeStreams === 'all') {
      setIncomeStreams([stream]);
    } else {
      const next = incomeStreams.includes(stream)
        ? incomeStreams.filter((s) => s !== stream)
        : [...incomeStreams, stream];
      setIncomeStreams(next.length === 0 ? 'all' : next);
    }
  };

  const toggleCategoryGroup = (group: ExpenseCategoryGroup) => {
    if (categoryGroups === 'all') {
      setCategoryGroups([group]);
    } else {
      const next = categoryGroups.includes(group)
        ? categoryGroups.filter((g) => g !== group)
        : [...categoryGroups, group];
      setCategoryGroups(next.length === 0 ? 'all' : next);
    }
  };

  return (
    <RFDCard padding="p-4">
      {/* Row 1: Time presets */}
      <div className="flex flex-wrap items-center gap-2">
        {TIME_PRESETS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setPreset(value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              preset === value
                ? 'bg-[#60A5FA] text-[#0F0F14]'
                : 'bg-[#1A1A24] text-[#9898B0] hover:bg-[#24243A] hover:text-[#F0F0F5] border border-[#1F2937]'
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
              className="bg-[#1A1A24] border border-[#1F2937] rounded-lg px-2 py-1 text-xs text-[#F0F0F5]"
            />
            <span className="text-[#7A8BA0] text-xs">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-[#1A1A24] border border-[#1F2937] rounded-lg px-2 py-1 text-xs text-[#F0F0F5]"
            />
            <button
              onClick={handleCustomApply}
              className="px-3 py-1 rounded-lg text-xs font-medium bg-[#60A5FA] text-[#0F0F14] hover:bg-[#60A5FA]/90 transition-colors"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Row 2: Income streams + Category groups + Comparison */}
      <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-[#1F2937]">
        {/* Income stream dropdown */}
        <div className="relative">
          <button
            onClick={() => setStreamDropdownOpen(!streamDropdownOpen)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
              incomeStreams !== 'all'
                ? 'bg-[#0F1F36] border-[#1E3A6B] text-[#60A5FA]'
                : 'bg-[#1A1A24] border-[#1F2937] text-[#9898B0] hover:text-[#F0F0F5]'
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {incomeStreams === 'all'
              ? 'All Streams'
              : `${incomeStreams.length} stream${incomeStreams.length > 1 ? 's' : ''}`}
          </button>
          {streamDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 z-50 w-56 bg-[#1A1A24] border border-[#1F2937] rounded-xl shadow-xl p-2 space-y-0.5">
              <button
                onClick={() => { setIncomeStreams('all'); setStreamDropdownOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                  incomeStreams === 'all' ? 'bg-[#24243A] text-[#F0F0F5]' : 'text-[#9898B0] hover:bg-[#24243A]'
                }`}
              >
                All Streams
              </button>
              {Object.entries(INCOME_STREAMS).map(([key, s]) => {
                const active = incomeStreams !== 'all' && incomeStreams.includes(key as IncomeStream);
                return (
                  <button
                    key={key}
                    onClick={() => toggleStream(key as IncomeStream)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2 transition-colors ${
                      active ? 'bg-[#24243A] text-[#F0F0F5]' : 'text-[#9898B0] hover:bg-[#24243A]'
                    }`}
                  >
                    <span className="h-2 w-2 rounded-sm flex-shrink-0" style={{ background: s.color }} />
                    {s.label}
                    {active && <span className="ml-auto text-[#60A5FA]">✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Category group pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setCategoryGroups('all')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              categoryGroups === 'all'
                ? 'bg-[#24243A] text-[#F0F0F5] border border-[#2A2A3E]'
                : 'text-[#7A8BA0] hover:text-[#9898B0]'
            }`}
          >
            All
          </button>
          {CATEGORY_GROUPS.map(({ value, label }) => {
            const active = categoryGroups !== 'all' && categoryGroups.includes(value);
            return (
              <button
                key={value}
                onClick={() => toggleCategoryGroup(value)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  active
                    ? 'bg-[#24243A] text-[#F0F0F5] border border-[#2A2A3E]'
                    : 'text-[#7A8BA0] hover:text-[#9898B0] border border-transparent'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Comparison toggle */}
        <button
          onClick={() => setComparison(comparison === 'none' ? 'previous-period' : 'none')}
          className={`ml-auto px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            comparison !== 'none'
              ? 'bg-[#0E2A1F] border-[#0F4F36] text-[#34D399]'
              : 'bg-[#1A1A24] border-[#1F2937] text-[#7A8BA0] hover:text-[#9898B0]'
          }`}
        >
          vs Previous
        </button>
      </div>
    </RFDCard>
  );
}
