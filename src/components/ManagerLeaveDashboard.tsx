import React, { useState } from 'react';
import { Employee, LeaveRequest, LeaveBalanceSummary } from '../types';
import { 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Clock, 
  User, 
  AlertCircle, 
  FileText, 
  MessageSquare, 
  Paperclip, 
  AlertTriangle,
  Users,
  Search,
  Filter
} from 'lucide-react';
import { formatDatePretty, datesOverlap } from '../utils/dateUtils';
import { computeEmployeeLeaveBalances } from '../utils/storage';

interface ManagerLeaveDashboardProps {
  currentManager: Employee;
  allEmployees: Employee[];
  leaveRequests: LeaveRequest[];
  onReviewRequest: (
    requestId: string,
    decision: 'approved' | 'rejected',
    comment: string
  ) => void;
}

export const ManagerLeaveDashboard: React.FC<ManagerLeaveDashboardProps> = ({
  currentManager,
  allEmployees,
  leaveRequests,
  onReviewRequest,
}) => {
  const [filterStatus, setFilterStatus] = useState<'pending' | 'all' | 'approved' | 'rejected'>('pending');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Active approval & rejection modal states
  const [approvingRequest, setApprovingRequest] = useState<LeaveRequest | null>(null);
  const [approvalReason, setApprovalReason] = useState('Approved. Task handover and team coverage confirmed.');
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const employeeMap = new Map(allEmployees.map((e) => [e.id, e]));

  // Filter requests
  const filteredRequests = leaveRequests.filter((req) => {
    if (filterStatus === 'pending' && req.status !== 'pending') return false;
    if (filterStatus === 'approved' && req.status !== 'approved') return false;
    if (filterStatus === 'rejected' && req.status !== 'rejected') return false;
    if (selectedDepartment !== 'all' && req.employeeDepartment !== selectedDepartment) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = req.employeeName.toLowerCase().includes(q);
      const matchReason = req.reason.toLowerCase().includes(q);
      if (!matchName && !matchReason) return false;
    }
    return true;
  });

  const pendingCount = leaveRequests.filter((r) => r.status === 'pending').length;

  const departments = Array.from(new Set(allEmployees.map((e) => e.department)));

  const handleConfirmApprove = () => {
    if (!approvingRequest || !approvalReason.trim()) return;
    onReviewRequest(approvingRequest.id, 'approved', approvalReason.trim());
    setApprovingRequest(null);
  };

  const handleConfirmReject = () => {
    if (!rejectingRequestId || !rejectionReason.trim()) return;
    onReviewRequest(rejectingRequestId, 'rejected', rejectionReason.trim());
    setRejectingRequestId(null);
    setRejectionReason('');
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <span>Staff Leave Approval Queue</span>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-semibold bg-amber-500 text-white rounded-full">
                {pendingCount} Pending
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-500">
            Review staff requests with contractual offer letter balances and team schedule overlap checks
          </p>
        </div>

        {/* Filter Segmented Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['pending', 'approved', 'rejected', 'all'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize cursor-pointer ${
                  filterStatus === s
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s === 'pending' ? `Pending (${pendingCount})` : s}
              </button>
            ))}
          </div>

          {/* Department Filter */}
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Leave Requests Cards / Table */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <h4 className="text-sm font-semibold text-slate-800">
            No Leave Requests in this View
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            {filterStatus === 'pending'
              ? 'All staff leave applications have been reviewed. You are all caught up!'
              : 'Try changing your status or department filter above.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const emp = employeeMap.get(req.employeeId);
            const balances = emp ? computeEmployeeLeaveBalances(emp, leaveRequests) : [];
            const specificBalance = balances.find((b) => b.leaveType === req.leaveType);

            // Check if another team member in same department is taking leave during same dates
            const overlappingRequests = leaveRequests.filter(
              (other) =>
                other.id !== req.id &&
                other.employeeDepartment === req.employeeDepartment &&
                other.status === 'approved' &&
                datesOverlap(req.startDate, req.endDate, other.startDate, other.endDate)
            );

            const isPending = req.status === 'pending';

            return (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm hover:border-slate-300 transition-all space-y-4"
              >
                {/* Top Row: Employee Profile, Dates & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <img
                      src={emp?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt={req.employeeName}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-slate-900">
                          {req.employeeName}
                        </h4>
                        <span className="text-xs text-slate-500">
                          {emp?.title}
                        </span>
                        <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium">
                          {req.employeeDepartment}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>Applied on {new Date(req.appliedAt).toLocaleString()}</span>
                        <span aria-hidden="true">·</span>
                        <span>Offer Letter Contract: {emp?.offerLetter.contractType || 'Full-Time'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md inline-block capitalize">
                        {req.leaveType.replace('_', ' ')} Leave
                      </div>
                      <div className="text-xs font-mono font-medium text-slate-700 mt-1 tabular-nums">
                        {req.totalDays} {req.totalDays === 1 ? 'Working Day' : 'Working Days'}
                        {req.isHalfDay && ` (${req.halfDayPeriod})`}
                      </div>
                    </div>

                    {req.status === 'approved' && (
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approved</span>
                      </span>
                    )}

                    {req.status === 'rejected' && (
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Rejected</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Second Row: Leave Dates & Offer Letter Leave Balance Box */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* Left: Requested Dates & Reason */}
                  <div className="md:col-span-7 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-800">
                      <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="font-semibold">Requested Period:</span>
                      <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-900 tabular-nums">
                        {formatDatePretty(req.startDate)}
                        {req.endDate !== req.startDate && ` → ${formatDatePretty(req.endDate)}`}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      <div className="font-semibold text-slate-700 mb-0.5">
                        Staff's Reason for Leave:
                      </div>
                      <p className="text-slate-800 italic">
                        "{req.reason}"
                      </p>
                      {req.supportingDocName && (
                        <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-mono mt-1.5">
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>Attached: {req.supportingDocName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Contractual Offer Letter Balance Ledger for Supervisor */}
                  <div className="md:col-span-5 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">
                        Offer Letter Balance ({specificBalance?.label || 'Leave'})
                      </span>
                      <span className="text-[10px] text-slate-500">Contract Entitlement</span>
                    </div>

                    {specificBalance ? (
                      <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-slate-200">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Offer Entitled</span>
                          <span className="font-mono font-bold text-slate-900 tabular-nums">
                            {specificBalance.entitled}d
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Taken to date</span>
                          <span className="font-mono font-semibold text-slate-600 tabular-nums">
                            {specificBalance.used}d
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Current Balance</span>
                          <span className="font-mono font-bold text-indigo-700 tabular-nums">
                            {specificBalance.remaining}d
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500">
                        Contract quota: {emp?.offerLetter.annualLeaveEntitlement} days annual leave.
                      </div>
                    )}

                    <div className="text-[11px] text-slate-600 flex justify-between pt-1 border-t border-slate-200/60">
                      <span>After this request ({req.totalDays}d):</span>
                      <span className="font-mono font-semibold text-slate-800 tabular-nums">
                        {specificBalance ? Math.max(0, specificBalance.remaining - (isPending ? req.totalDays : 0)) : 0} days remaining
                      </span>
                    </div>
                  </div>
                </div>

                {/* Overlap Alert with other team members */}
                {overlappingRequests.length > 0 && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-xs text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      <strong>Team Coverage Notice:</strong> {overlappingRequests.map((o) => o.employeeName).join(', ')} in {req.employeeDepartment} is already approved for leave during this window.
                    </span>
                  </div>
                )}

                {/* Supervisor Review Actions for Pending Requests */}
                {isPending && (
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setRejectingRequestId(req.id);
                        setRejectionReason('');
                      }}
                      className="px-4 py-2 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject with Reason</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setApprovingRequest(req);
                        setApprovalReason('Approved. Task handover and team coverage confirmed.');
                      }}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve with Reason</span>
                    </button>
                  </div>
                )}

                {/* Past Decision Logs */}
                {!isPending && req.managerComment && (
                  <div className="pt-2 text-xs text-slate-600 flex items-center gap-2">
                    <span className="font-semibold text-slate-700">Supervisor Decision:</span>
                    <span className="italic">"{req.managerComment}"</span>
                    <span className="text-slate-400 text-[11px]">
                      · by {req.reviewedByName || 'Manager'} on {req.reviewedAt ? new Date(req.reviewedAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Supervisor Rejection Modal (Requires Reason) */}
      {rejectingRequestId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-rose-700 font-semibold text-base">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <span>Provide Reason for Rejection</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Please specify why this leave request cannot be approved at this time. The employee will see this feedback in their leave history.
            </p>

            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Critical sprint release scheduled on this day, insufficient coverage in engineering team..."
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white resize-none text-slate-800"
              autoFocus
            />

            {/* Common Rejection Reason Presets */}
            <div className="flex flex-wrap gap-1">
              {[
                'High project deliverable conflict',
                'Multiple team members on leave',
                'Client presentation on this date',
                'Please reschedule to following week',
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRejectionReason(preset)}
                  className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectingRequestId(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={!rejectionReason.trim()}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer ${
                  !rejectionReason.trim()
                    ? 'bg-rose-300 cursor-not-allowed'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Supervisor Approval Modal (Requires Valid Reason) */}
      {approvingRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold text-base">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Approve Leave for {approvingRequest.employeeName}</span>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-900 space-y-1">
              <div>
                <strong>Requested:</strong> {formatDatePretty(approvingRequest.startDate)}
                {approvingRequest.endDate !== approvingRequest.startDate && ` → ${formatDatePretty(approvingRequest.endDate)}`} ({approvingRequest.totalDays} days)
              </div>
              <div>
                <strong>Staff Reason:</strong> "{approvingRequest.reason}"
              </div>
              <div className="text-[11px] text-emerald-700 font-medium">
                Once approved, this will automatically reflect as Approved Leave on {approvingRequest.employeeName}'s monthly calendar!
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Enter Supervisor Approval Remarks / Reason <span className="text-emerald-600">*</span>
              </label>
              <textarea
                rows={3}
                value={approvalReason}
                onChange={(e) => setApprovalReason(e.target.value)}
                placeholder="e.g. Approved. Sprint tasks covered by team..."
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-none text-slate-800"
                autoFocus
              />
            </div>

            {/* Common Approval Reason Presets */}
            <div className="flex flex-wrap gap-1">
              {[
                'Approved. Handover confirmed.',
                'Approved as scheduled in sprint plan.',
                'Medical rest approved with certificate.',
                'Approved. Urgent personal leave granted.',
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setApprovalReason(preset)}
                  className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setApprovingRequest(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={!approvalReason.trim()}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer ${
                  !approvalReason.trim()
                    ? 'bg-emerald-300 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
