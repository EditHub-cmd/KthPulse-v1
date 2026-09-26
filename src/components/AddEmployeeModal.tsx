import React, { useState } from 'react';
import { Employee } from '../types';
import { X, UserPlus, FileText, CheckCircle2 } from 'lucide-react';
import { getTodayDateString } from '../utils/dateUtils';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEmployee: (employee: Employee) => void;
}

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({
  isOpen,
  onClose,
  onAddEmployee,
}) => {
  if (!isOpen) return null;

  const today = getTodayDateString();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [contractType, setContractType] = useState<'Full-Time' | 'Contract' | 'Part-Time'>('Full-Time');
  const [annualLeave, setAnnualLeave] = useState(18);
  const [sickLeave, setSickLeave] = useState(14);
  const [casualLeave, setCasualLeave] = useState(7);
  const [parentalLeave, setParentalLeave] = useState(14);
  const [clauseNotes, setClauseNotes] = useState('Contractual appointment with standard paid leave entitlement and supervisor sign-off.');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const avatars = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    ];

    const newEmp: Employee = {
      id: `emp_${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      role: 'staff',
      title: title.trim() || 'Software Engineer',
      department,
      avatar: avatars[Math.floor(Math.random() * avatars.length)],
      joinedDate: today,
      managerId: 'emp_manager',
      offerLetter: {
        offerDate: today,
        contractType,
        annualLeaveEntitlement: Number(annualLeave) || 18,
        sickLeaveEntitlement: Number(sickLeave) || 14,
        casualLeaveEntitlement: Number(casualLeave) || 7,
        maternityPaternityEntitlement: Number(parentalLeave) || 14,
        probationMonths: 3,
        standardHoursPerDay: 8,
        contractClauseSummary: clauseNotes,
      },
    };

    onAddEmployee(newEmp);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-semibold text-slate-900">
              Add Staff Member & Offer Letter Terms
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jordan Lee"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Work Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jordan.lee@astutexperience.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Job Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Backend Developer"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
              >
                <option value="Engineering">Engineering</option>
                <option value="Product & Design">Product & Design</option>
                <option value="Operations">Operations</option>
                <option value="Marketing">Marketing</option>
                <option value="Customer Support">Customer Support</option>
              </select>
            </div>
          </div>

          {/* Offer Letter Contract Section */}
          <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-3">
            <div className="flex items-center gap-1.5 font-semibold text-indigo-950">
              <FileText className="w-4 h-4 text-indigo-700" />
              <span>Offer Letter Leave Entitlement Baseline</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="block text-indigo-900 text-[11px] mb-1 font-medium">Annual</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={annualLeave}
                  onChange={(e) => setAnnualLeave(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-white border border-indigo-200 rounded font-mono text-center"
                />
              </div>
              <div>
                <label className="block text-indigo-900 text-[11px] mb-1 font-medium">Sick / MC</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={sickLeave}
                  onChange={(e) => setSickLeave(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-white border border-indigo-200 rounded font-mono text-center"
                />
              </div>
              <div>
                <label className="block text-indigo-900 text-[11px] mb-1 font-medium">Casual</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={casualLeave}
                  onChange={(e) => setCasualLeave(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-white border border-indigo-200 rounded font-mono text-center"
                />
              </div>
              <div>
                <label className="block text-indigo-900 text-[11px] mb-1 font-medium">Parental</label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={parentalLeave}
                  onChange={(e) => setParentalLeave(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-white border border-indigo-200 rounded font-mono text-center"
                />
              </div>
            </div>

            <div>
              <label className="block text-indigo-900 text-[11px] mb-1 font-medium">Contract Terms Excerpt</label>
              <input
                type="text"
                value={clauseNotes}
                onChange={(e) => setClauseNotes(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded text-slate-800"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm cursor-pointer"
            >
              Save Staff & Offer Letter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
