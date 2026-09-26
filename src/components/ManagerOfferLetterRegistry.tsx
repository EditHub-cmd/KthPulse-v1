import React, { useState } from 'react';
import { Employee, LeaveRequest } from '../types';
import { 
  FileText, 
  Edit3, 
  Plus, 
  Check, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  UserPlus, 
  Award,
  AlertTriangle
} from 'lucide-react';
import { computeEmployeeLeaveBalances } from '../utils/storage';

interface ManagerOfferLetterRegistryProps {
  employees: Employee[];
  leaveRequests: LeaveRequest[];
  onUpdateOfferLetter: (employeeId: string, updatedOffer: Employee['offerLetter']) => void;
  onOpenAddEmployee: () => void;
}

export const ManagerOfferLetterRegistry: React.FC<ManagerOfferLetterRegistryProps> = ({
  employees,
  leaveRequests,
  onUpdateOfferLetter,
  onOpenAddEmployee,
}) => {
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Employee['offerLetter'] | null>(null);

  const startEdit = (emp: Employee) => {
    setEditingEmployeeId(emp.id);
    setEditForm({ ...emp.offerLetter });
  };

  const handleSaveEdit = (employeeId: string) => {
    if (editForm) {
      onUpdateOfferLetter(employeeId, editForm);
      setEditingEmployeeId(null);
      setEditForm(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span>Staff Offer Letter & Leave Entitlement Master Registry</span>
          </h3>
          <p className="text-xs text-slate-500">
            Official contractual baseline quotas stipulating annual, sick, casual, and parental leaves for each employee
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddEmployee}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Add Staff with Offer Letter</span>
        </button>
      </div>

      {/* Grid of Employees and their Offer Letter Entitlements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {employees.map((emp) => {
          const balances = computeEmployeeLeaveBalances(emp, leaveRequests);
          const isEditing = editingEmployeeId === emp.id;

          const annualBal = balances.find((b) => b.leaveType === 'annual');
          const sickBal = balances.find((b) => b.leaveType === 'sick');
          const casualBal = balances.find((b) => b.leaveType === 'casual');

          const hasLowBalance = balances.some((b) => b.remaining <= 3 && b.entitled > 0);

          return (
            <div
              key={emp.id}
              className={`bg-white rounded-2xl border p-6 shadow-sm space-y-4 transition-all ${
                isEditing ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-slate-200'
              }`}
            >
              {/* Employee Bio Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <img
                    src={emp.avatar}
                    alt={emp.name}
                    referrerPolicy="no-referrer"
                    className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-slate-900">
                        {emp.name}
                      </h4>
                      {emp.role === 'manager' && (
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded font-medium">
                          Supervisor
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      {emp.title} · {emp.department}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Offer Letter Signed: {emp.offerLetter.offerDate} ({emp.offerLetter.contractType})
                    </div>
                  </div>
                </div>

                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => startEdit(emp)}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                    title="Adjust contractual leave entitlements"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(emp.id)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingEmployeeId(null)}
                      className="px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Offer Letter Clause Excerpt */}
              {emp.offerLetter.contractClauseSummary && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 italic">
                  "{emp.offerLetter.contractClauseSummary}"
                </div>
              )}

              {/* Quotas & Entitlements Editor or Display */}
              {isEditing && editForm ? (
                <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div className="font-semibold text-slate-800">
                    Edit Contract Entitlements (Offer Letter)
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 mb-1">Annual Leave (Days)</label>
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={editForm.annualLeaveEntitlement}
                        onChange={(e) =>
                          setEditForm({ ...editForm, annualLeaveEntitlement: Number(e.target.value) || 0 })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Sick Leave (Days)</label>
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={editForm.sickLeaveEntitlement}
                        onChange={(e) =>
                          setEditForm({ ...editForm, sickLeaveEntitlement: Number(e.target.value) || 0 })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Casual Leave (Days)</label>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={editForm.casualLeaveEntitlement}
                        onChange={(e) =>
                          setEditForm({ ...editForm, casualLeaveEntitlement: Number(e.target.value) || 0 })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Parental Leave (Days)</label>
                      <input
                        type="number"
                        min="0"
                        max="120"
                        value={editForm.maternityPaternityEntitlement}
                        onChange={(e) =>
                          setEditForm({ ...editForm, maternityPaternityEntitlement: Number(e.target.value) || 0 })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">Annual Leave</span>
                    <span className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                      {annualBal?.remaining} / {emp.offerLetter.annualLeaveEntitlement}d
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {annualBal?.used}d used · {annualBal?.pending}d pend
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">Sick Leave</span>
                    <span className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                      {sickBal?.remaining} / {emp.offerLetter.sickLeaveEntitlement}d
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {sickBal?.used}d used · {sickBal?.pending}d pend
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">Casual Leave</span>
                    <span className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                      {casualBal?.remaining} / {emp.offerLetter.casualLeaveEntitlement}d
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {casualBal?.used}d used · {casualBal?.pending}d pend
                    </span>
                  </div>
                </div>
              )}

              {/* Low Balance Alert Indicator */}
              {hasLowBalance && (
                <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Notice: Employee has low leave balance remaining (&le;3 days) in one or more categories.</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
