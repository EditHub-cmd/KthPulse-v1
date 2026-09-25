import React, { useState, useMemo } from 'react';
import { Employee, LeaveRequest, LeaveType } from '../types';
import { 
  X, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Clock, 
  Info,
  Paperclip
} from 'lucide-react';
import { computeEmployeeLeaveBalances } from '../utils/storage';
import { calculateWorkingDays, getTodayDateString } from '../utils/dateUtils';

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmployee: Employee;
  allLeaveRequests: LeaveRequest[];
  onSubmit: (request: Omit<LeaveRequest, 'id' | 'appliedAt' | 'status'>) => void;
}

export const LeaveRequestModal: React.FC<LeaveRequestModalProps> = ({
  isOpen,
  onClose,
  currentEmployee,
  allLeaveRequests,
  onSubmit,
}) => {
  if (!isOpen) return null;

  const today = getTodayDateString();
  const balances = useMemo(
    () => computeEmployeeLeaveBalances(currentEmployee, allLeaveRequests),
    [currentEmployee, allLeaveRequests]
  );

  const [leaveType, setLeaveType] = useState<LeaveType>('annual');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayPeriod, setHalfDayPeriod] = useState<'morning' | 'afternoon'>('morning');
  const [reason, setReason] = useState('');
  const [docName, setDocName] = useState<string>('');

  // Calculate working days requested
  const requestedDays = useMemo(() => {
    return calculateWorkingDays(startDate, endDate, isHalfDay);
  }, [startDate, endDate, isHalfDay]);

  // Find balance for selected leave category
  const selectedBalance = useMemo(() => {
    if (leaveType === 'unpaid') return null;
    return balances.find((b) => b.leaveType === leaveType);
  }, [balances, leaveType]);

  const availableDays = selectedBalance ? selectedBalance.remaining : 999;
  const isInsufficient = leaveType !== 'unpaid' && requestedDays > availableDays;
  const projectedRemaining = selectedBalance ? Math.max(0, availableDays - requestedDays) : 0;
  const willBeLow = selectedBalance && !isInsufficient && projectedRemaining <= 2 && selectedBalance.entitled > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isInsufficient || requestedDays <= 0 || !reason.trim()) {
      return;
    }

    onSubmit({
      employeeId: currentEmployee.id,
      employeeName: currentEmployee.name,
      employeeDepartment: currentEmployee.department,
      leaveType,
      startDate,
      endDate: isHalfDay ? startDate : endDate,
      isHalfDay,
      halfDayPeriod: isHalfDay ? halfDayPeriod : undefined,
      totalDays: requestedDays,
      reason: reason.trim(),
      supportingDocName: docName || undefined,
    });

    onClose();
  };

  const commonReasons = [
    'Annual vacation / Personal travel',
    'Medical checkup / Doctor consultation',
    'Family emergency / Childcare needs',
    'Home maintenance & relocation',
    'Personal wellness day',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Apply for Leave
            </h3>
            <p className="text-xs text-slate-500">
              Validated against offer letter entitlement for {currentEmployee.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Leave Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Leave Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { type: 'annual', label: 'Annual Leave' },
                { type: 'sick', label: 'Sick / Medical' },
                { type: 'casual', label: 'Casual / Urgent' },
                { type: 'maternity_paternity', label: 'Parental' },
                { type: 'unpaid', label: 'Unpaid Leave' },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setLeaveType(item.type as LeaveType)}
                  className={`px-3 py-2 text-xs font-medium rounded-xl border text-left transition-all cursor-pointer ${
                    leaveType === item.type
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-900 font-semibold ring-1 ring-indigo-600'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Current Balance Insight Banner */}
          {selectedBalance && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center justify-between text-slate-700">
                <span className="font-medium">Offer Letter Quota:</span>
                <span className="font-mono font-semibold">{selectedBalance.entitled} days</span>
              </div>
              <div className="flex items-center justify-between text-slate-700 mt-1">
                <span>Already Used / Approved:</span>
                <span className="font-mono text-slate-600">{selectedBalance.used} days</span>
              </div>
              <div className="flex items-center justify-between text-slate-700 mt-1">
                <span>Awaiting Supervisor Review:</span>
                <span className="font-mono text-amber-700">{selectedBalance.pending} days</span>
              </div>
              <div className="flex items-center justify-between text-indigo-900 font-semibold pt-2 mt-2 border-t border-slate-200">
                <span>Available Remaining Balance:</span>
                <span className="font-mono text-sm">{selectedBalance.remaining} days</span>
              </div>
            </div>
          )}

          {/* Date Picker Fields */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (e.target.value > endDate) setEndDate(e.target.value);
                  }}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={isHalfDay ? startDate : endDate}
                  disabled={isHalfDay}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white ${
                    isHalfDay ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  required
                />
              </div>
            </div>

            {/* Half-Day Toggle */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHalfDay}
                  onChange={(e) => {
                    setIsHalfDay(e.target.checked);
                    if (e.target.checked) setEndDate(startDate);
                  }}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Apply as Half-Day (0.5 day)</span>
              </label>

              {isHalfDay && (
                <div className="flex gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setHalfDayPeriod('morning')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      halfDayPeriod === 'morning'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    Morning
                  </button>
                  <button
                    type="button"
                    onClick={() => setHalfDayPeriod('afternoon')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      halfDayPeriod === 'afternoon'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    Afternoon
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Requested Days Count Calculation */}
          <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-slate-100 font-medium">
            <span className="text-slate-600">Total Working Days Requested:</span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              {requestedDays} {requestedDays === 1 ? 'day' : 'days'}
            </span>
          </div>

          {/* Insufficient Balance Blocking Alert */}
          {isInsufficient && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block text-rose-950">
                  Insufficient Contractual Leave Balance
                </strong>
                <span>
                  You requested <strong>{requestedDays} days</strong>, but your offer letter balance has only <strong>{availableDays} days</strong> remaining for this category. Submission is prevented. Please reduce requested dates or select Unpaid Leave.
                </span>
              </div>
            </div>
          )}

          {/* Low Balance Warning Alert */}
          {willBeLow && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block text-amber-950">
                  Low Leave Balance Alert
                </strong>
                <span>
                  This request will leave you with only <strong>{projectedRemaining} day(s)</strong> remaining of your offer letter quota.
                </span>
              </div>
            </div>
          )}

          {/* Reason Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Reason for Leave Request <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">Required for supervisor review</span>
            </div>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State reason (e.g., family commitment, medical visit)..."
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none text-slate-800"
              required
            />
            {/* Quick Reason Chips */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {commonReasons.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded cursor-pointer transition-colors"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Supporting Document / Medical Certificate Simulator */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Supporting Documentation (Optional)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const demoDocs = [
                    'Medical_Certificate_Clinic.pdf',
                    'Flight_Itinerary.pdf',
                    'Hospital_Discharge_Form.pdf',
                  ];
                  setDocName(demoDocs[Math.floor(Math.random() * demoDocs.length)]);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>{docName ? 'Change Attachment' : 'Attach Medical Cert / Document'}</span>
              </button>
              {docName && (
                <div className="flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                  <FileText className="w-3.5 h-3.5" />
                  <span className="font-mono truncate max-w-[180px]">{docName}</span>
                  <button
                    type="button"
                    onClick={() => setDocName('')}
                    className="text-slate-400 hover:text-rose-600 ml-1 cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isInsufficient || requestedDays <= 0 || !reason.trim()}
              className={`px-5 py-2.5 text-xs font-semibold text-white rounded-lg shadow-sm transition-all flex items-center gap-2 ${
                isInsufficient || requestedDays <= 0 || !reason.trim()
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] cursor-pointer'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Submit Leave Request</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
