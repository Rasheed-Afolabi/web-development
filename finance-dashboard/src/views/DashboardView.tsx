import { useState } from 'react';

import {
  DailyAllowanceHero,
  CashFlowPulse,
  WeeklyStreams,
  WhereItWent,
  CostOfEarning,
  GoalsList,
  RecentActivity,
  BigPicture,
  RecurringBillsWidget,
  CashFlowForecastWidget,
  NetWorthWidget,
  DebtPayoffWidget,
  EnvelopeDashboardWidget,
} from '@/components/dashboard/RFDWidgets';

import { InsightCard } from '@/components/dashboard/InsightCard';
import { MemberBreakdownWidget } from '@/components/dashboard/MemberBreakdownWidget';
import { DashboardFilterBar } from '@/components/dashboard/DashboardFilterBar';
import { DashboardFilterProvider } from '@/contexts/DashboardFilterContext';
import { AddTransactionDialog } from '@/components/forms/AddTransactionDialog';
import { useSettingsStore } from '@/stores/useSettingsStore';

function DashboardContent() {
  const [showBigPicture, setShowBigPicture] = useState(false);
  const budgetMode = useSettingsStore((s) => s.budgetMode);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1400px] mx-auto">
      {/* 1. Hero — Daily Allowance (enhanced A3) */}
      <DailyAllowanceHero />

      {/* 2. Filter Bar */}
      <DashboardFilterBar />

      {/* 3. Cash Flow + Weekly Streams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CashFlowPulse />
        <WeeklyStreams />
      </div>

      {/* 4. Where It Went / Envelope + Cost of Earning */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {budgetMode === 'envelope' ? <EnvelopeDashboardWidget /> : <WhereItWent />}
        <CostOfEarning />
      </div>

      {/* 5. Goals + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GoalsList />
        <RecentActivity />
      </div>

      {/* 6. Smart Insights (enhanced A1) */}
      <InsightCard />

      {/* 7. Recurring Bills (B1) */}
      <RecurringBillsWidget />

      {/* 8. Cash Flow Forecast (B2) */}
      <CashFlowForecastWidget />

      {/* 9. Net Worth + Debt Payoff (C) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NetWorthWidget />
        <DebtPayoffWidget />
      </div>

      {/* 10. Member Breakdown (E1, conditional on >1 member) */}
      <MemberBreakdownWidget />

      {/* 11. Big Picture Toggle */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowBigPicture(!showBigPicture)}
          className="text-[11px] font-medium text-[#9898B0] hover:text-[#F0F0F5] border border-[#1F2937] hover:border-[#2A3441] rounded-full px-5 py-2 transition-colors"
        >
          {showBigPicture ? 'Hide Big Picture ↑' : 'Show Big Picture ↓'}
        </button>
      </div>
      <BigPicture visible={showBigPicture} />

      {/* 12. Floating Add Transaction */}
      <AddTransactionDialog />
    </div>
  );
}

export function DashboardView() {
  return (
    <DashboardFilterProvider>
      <DashboardContent />
    </DashboardFilterProvider>
  );
}
