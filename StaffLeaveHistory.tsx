import React from 'react';
import { LeaveRequest } from '../types';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  MessageSquare, 
  Paperclip, 
  Trash2 
} from 'lucide-react';
import { formatDatePretty } from '../utils/dateUtils';

interface StaffLeaveHistoryProps {
  requests: LeaveRequest[];
  onCancelRequest: (requestId: string) => void;
}

export const StaffLeaveHistory: React.FC<StaffLeaveHistoryProps> = ({
  requests,
  onCancelRequest,
}) => {
  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2" />
        <h4 className="text-sm font-semibold text-slate-800">No Leave Requests Found</h4>
        <p className="text-xs text-slate-500 mt-1">
          You haven't submitted any leave requests yet. Use the "Apply for Leave" button above.
        </p>
      </div>
    );
  }

  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case 'annual': return 'Annual Leave';
      case 'sick': return 'Sick / Medical';
      case 'casual': return 'Casual / Personal';
      case 'maternity_paternity': return 'Parental';
      case 'unpaid': return 'Unpaid Leave';
      default: return type;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            My Leave Application History
          </h3>
          <p className="text-xs text-slate-500">
            Track status, supervisor approval decisions, and feedback notes
          </p>
        </div>
        <span className="text-xs font-mono text-slate-500 tabular-nums">
          {requests.length} records total
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Leave Type</th>
              <th className="py-3 px-4">Dates & Duration</th>
              <th className="py-3 px-4">Reason / Notes</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Supervisor Feedback</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requests.map((req) => {
              const isPending = req.status === 'pending';
              const isApproved = req.status === 'approved';
              const isRejected = req.status === 'rejected';

              return (
                <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-900 block">
                      {getLeaveTypeLabel(req.leaveType)}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Applied {new Date(req.appliedAt).toLocaleDateString()}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-mono text-slate-800 font-medium tabular-nums">
                      {formatDatePretty(req.startDate)}
                      {req.endDate !== req.startDate && ` → ${formatDatePretty(req.endDate)}`}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {req.isHalfDay ? `0.5 Day (${req.halfDayPeriod})` : `${req.totalDays} Working Days`}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 max-w-xs">
                    <p className="text-slate-700 truncate" title={req.reason}>
                      {req.reason}
                    </p>
                    {req.supportingDocName && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded mt-1 font-mono">
                        <Paperclip className="w-3 h-3" />
                        <span>{req.supportingDocName}</span>
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    {isPending && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                        <Clock className="w-3 h-3" />
                        <span>Awaiting Review</span>
                      </span>
                    )}
                    {isApproved && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        <CheckCircle className="w-3 h-3" />
                        <span>Approved</span>
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                        <XCircle className="w-3 h-3" />
                        <span>Rejected</span>
                      </span>
                    )}
                    {req.status === 'cancelled' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        Cancelled
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 max-w-xs">
                    {req.managerComment ? (
                      <div className="text-[11px] text-slate-700 space-y-0.5">
                        <div className="flex items-center gap-1 font-medium text-slate-800">
                          <MessageSquare className="w-3 h-3 text-slate-400" />
                          <span>{req.reviewedByName || 'Supervisor'}:</span>
                        </div>
                        <p className={`italic ${isRejected ? 'text-rose-800 font-medium' : 'text-slate-600'}`}>
                          "{req.managerComment}"
                        </p>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px]">—</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => onCancelRequest(req.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Withdraw leave request"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
