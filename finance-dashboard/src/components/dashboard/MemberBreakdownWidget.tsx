import { useMemo } from 'react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useDashboardFilterContext } from '@/contexts/DashboardFilterContext';
import { RFDCard, CollapsibleSection, Bar, fmtUSDShort } from './RFDPrimitives';
import { format } from 'date-fns';

export function MemberBreakdownWidget() {
  const members = useSettingsStore((s) => s.householdMembers);
  const transactions = useTransactionStore((s) => s.transactions);
  const { dateRange } = useDashboardFilterContext();

  const data = useMemo(() => {
    const startStr = format(dateRange.start, 'yyyy-MM-dd');
    const endStr = format(dateRange.end, 'yyyy-MM-dd');
    const filtered = transactions.filter((t) => t.date >= startStr && t.date <= endStr);

    return members.map((member) => {
      const memberTx = filtered.filter((t) => t.memberId === member.id);
      const income = memberTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = memberTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      return { ...member, income, expense };
    });
  }, [members, transactions, dateRange]);

  // Also capture unassigned
  const unassigned = useMemo(() => {
    const startStr = format(dateRange.start, 'yyyy-MM-dd');
    const endStr = format(dateRange.end, 'yyyy-MM-dd');
    const filtered = transactions.filter((t) => t.date >= startStr && t.date <= endStr && !t.memberId);
    const income = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense };
  }, [transactions, dateRange]);

  if (members.length <= 1) return null;

  const maxAmount = Math.max(
    ...data.map((d) => Math.max(d.income, d.expense)),
    Math.max(unassigned.income, unassigned.expense),
    1,
  );

  return (
    <RFDCard>
      <CollapsibleSection
        widgetId="member-breakdown"
        defaultExpanded={false}
        eyebrow="Household"
        title="Member Breakdown"
      >
        <div className="space-y-4">
          {data.map((member) => (
            <div key={member.id}>
              <div className="flex items-center gap-2 mb-2">
                {member.avatarEmoji && <span className="text-lg">{member.avatarEmoji}</span>}
                <span className="text-sm font-medium text-[#F0F0F5]">{member.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex justify-between text-[10px] font-mono mb-0.5">
                    <span className="text-[#34D399]">Income</span>
                    <span className="text-[#34D399]">{fmtUSDShort(member.income)}</span>
                  </div>
                  <Bar pct={(member.income / maxAmount) * 100} color={member.color || '#34D399'} height="h-1.5" />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-mono mb-0.5">
                    <span className="text-[#F87171]">Expense</span>
                    <span className="text-[#F87171]">{fmtUSDShort(member.expense)}</span>
                  </div>
                  <Bar pct={(member.expense / maxAmount) * 100} color="#F87171" height="h-1.5" />
                </div>
              </div>
            </div>
          ))}

          {(unassigned.income > 0 || unassigned.expense > 0) && (
            <div>
              <span className="text-[11px] text-[#7A8BA0]">Unassigned</span>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div>
                  <Bar pct={(unassigned.income / maxAmount) * 100} color="#7A8BA0" height="h-1" />
                  <span className="text-[10px] font-mono text-[#7A8BA0]">{fmtUSDShort(unassigned.income)}</span>
                </div>
                <div>
                  <Bar pct={(unassigned.expense / maxAmount) * 100} color="#7A8BA0" height="h-1" />
                  <span className="text-[10px] font-mono text-[#7A8BA0]">{fmtUSDShort(unassigned.expense)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>
    </RFDCard>
  );
}
