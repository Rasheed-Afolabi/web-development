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
} from '@/components/dashboard/RFDWidgets';

import { AddTransactionDialog } from '@/components/forms/AddTransactionDialog';

export function DashboardView() {
  const [showBigPicture, setShowBigPicture] = useState(false);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1400px] mx-auto">
      {/* Hero — Daily Allowance */}
      <DailyAllowanceHero />

      {/* Row 2: Cash Flow + Weekly Streams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CashFlowPulse />
        <WeeklyStreams />
      </div>

      {/* Row 3: Where It Went (donut) + Cost of Earning */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <WhereItWent />
        <CostOfEarning />
      </div>

      {/* Row 4: Goals + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GoalsList />
        <RecentActivity />
      </div>

      {/* Big Picture Toggle */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowBigPicture(!showBigPicture)}
          className="text-[11px] font-medium text-[#9898B0] hover:text-[#F0F0F5] border border-[#1F2937] hover:border-[#2A3441] rounded-full px-5 py-2 transition-colors"
        >
          {showBigPicture ? 'Hide Big Picture ↑' : 'Show Big Picture ↓'}
        </button>
      </div>
      <BigPicture visible={showBigPicture} />

      {/* Floating Add Transaction */}
      <AddTransactionDialog />
    </div>
  );
}
