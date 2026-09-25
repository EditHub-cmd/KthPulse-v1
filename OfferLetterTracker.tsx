import React from 'react';
import { Employee, LeaveRequest, LeaveBalanceSummary } from '../types';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  ShieldAlert, 
  PlusCircle, 
  Info,
  Award
} from 'lucide-react';
import { computeEmployeeLeaveBalances } from '../utils/storage';

interface OfferLetterTrackerProps {
  currentEmployee: Employee;
  allLeaveRequests: LeaveRequest[];
  onRequestLeave: () => void;
}

export const OfferLetterTracker: React.FC<OfferLetterTrackerProps> = ({
  currentEmployee,
  allLeaveRequests,
  onRequestLeave,
}) => {
  const balances = computeEmployeeLeaveBalances(currentEmployee, allLeaveRequests);

  // Identify categories with low remaining balance (<= 3 days remaining and entitled > 0)
  const lowBalanceCategories = balances.filter(
    (b) => b.remaining <= 3 && b.remaining >= 0 && b.entitled > 0
  );

  const exhaustedCategories = balances.filter(
    (b) => b.remaining === 0 && b.entitled > 0
  );

  return (
    <div className="space-y-6">
      {/* Low Leave Balance Notification Alert */}
      {lowBalanceCategories.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-amber-900">
              Low Leave Balance Notification
            </h4>
            <p className="text-xs text-amber-800 mt-0.5">
              Notice: You have <strong>{lowBalanceCategories.map((c) => `${c.remaining} day(s) of ${c.label}`).join(', ')}</strong> remaining under your contractual offer letter.
              {exhaustedCategories.length > 0 && (
                <span className="block mt-1 text-amber-950 font-medium">
                  {exhaustedCategories.map((c) => c.label).join(', ')} quota is fully exhausted.
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onRequestLeave}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shrink-0 cursor-pointer shadow-sm transition-colors"
          >
            Apply Time Off
          </button>
        </div>
      )}

      {/* Offer Letter Contract Terms Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-900">
                  Employment Offer Letter Leave Quotas
                </h3>
                <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded font-medium">
                  Official Terms
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Staff member: <strong>{currentEmployee.name}</strong> · ID: {currentEmployee.id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Contract Signed: {currentEmployee.offerLetter.offerDate}</span>
            <span aria-hidden="true">·</span>
            <span>{currentEmployee.offerLetter.contractType}</span>
          </div>
        </div>

        {/* Contract Clause Excerpt */}
        {currentEmployee.offerLetter.contractClauseSummary && (
          <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <Info className="w-3.5 h-3.5 text-indigo-600" />
              <span>Offer Letter Leave Clause Summary</span>
            </div>
            <p className="text-slate-600 leading-relaxed italic">
              "{currentEmployee.offerLetter.contractClauseSummary}"
            </p>
          </div>
        )}

        {/* Summary Metric Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-2">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 block">Total Annual Entitlement</span>
            <span className="text-lg font-bold text-slate-900 font-mono tabular-nums">
              {currentEmployee.offerLetter.annualLeaveEntitlement} days
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 block">Sick / Medical Entitlement</span>
            <span className="text-lg font-bold text-slate-900 font-mono tabular-nums">
              {currentEmployee.offerLetter.sickLeaveEntitlement} days
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 block">Casual Entitlement</span>
            <span className="text-lg font-bold text-slate-900 font-mono tabular-nums">
              {currentEmployee.offerLetter.casualLeaveEntitlement} days
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] text-slate-500 block">Parental Entitlement</span>
            <span className="text-lg font-bold text-slate-900 font-mono tabular-nums">
              {currentEmployee.offerLetter.maternityPaternityEntitlement} days
            </span>
          </div>
        </div>
      </div>

      {/* Leave Balances Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Contractual Leave Ledger & Balances
            </h3>
            <p className="text-xs text-slate-500">
              Real-time balance breakdown against your offer letter baseline
            </p>
          </div>
          <button
            type="button"
            onClick={onRequestLeave}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Apply for Leave</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {balances.map((item) => {
            const isLow = item.remaining <= 3 && item.entitled > 0;
            const isExhausted = item.remaining === 0 && item.entitled > 0;
            const usedPercent = Math.min(100, Math.round(((item.used + item.pending) / (item.entitled || 1)) * 100));

            return (
              <div
                key={item.leaveType}
                className={`bg-white rounded-2xl border p-5 shadow-sm transition-all relative ${
                  isExhausted
                    ? 'border-rose-200 ring-1 ring-rose-200'
                    : isLow
                    ? 'border-amber-200 ring-1 ring-amber-200'
                    : 'border-slate-200'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-slate-900">
                        {item.label}
                      </h4>
                      {isExhausted ? (
                        <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded px-1.5 py-0.5">
                          Exhausted
                        </span>
                      ) : isLow ? (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                          Low Quota ({item.remaining} left)
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">
                          Available
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.description}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                      {item.remaining}
                    </span>
                    <span className="text-xs text-slate-500 block">days remaining</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 mb-4">
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className="bg-indigo-600 h-full transition-all"
                      style={{ width: `${Math.round((item.used / (item.entitled || 1)) * 100)}%` }}
                      title={`Used: ${item.used} days`}
                    />
                    <div
                      className="bg-amber-400 h-full transition-all"
                      style={{ width: `${Math.round((item.pending / (item.entitled || 1)) * 100)}%` }}
                      title={`Pending Approval: ${item.pending} days`}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 font-mono tabular-nums">
                    <span>{usedPercent}% allocated</span>
                    <span>{item.remaining} / {item.entitled} days free</span>
                  </div>
                </div>

                {/* Breakdown Ledger Table */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Offer Entitled</span>
                    <span className="font-semibold text-slate-800 font-mono tabular-nums">
                      {item.entitled} days
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Approved Taken</span>
                    <span className="font-semibold text-slate-800 font-mono tabular-nums">
                      {item.used} days
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Pending Approval</span>
                    <span className="font-semibold text-amber-700 font-mono tabular-nums">
                      {item.pending} days
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
