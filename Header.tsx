import React, { useState } from 'react';
import { Employee, LeaveRequest } from '../types';
import { 
  Clock, 
  CalendarDays, 
  ShieldCheck, 
  RotateCcw, 
  ChevronDown,
  LogOut,
  LayoutDashboard,
  Calendar,
  CheckCircle2,
  Users
} from 'lucide-react';

interface HeaderProps {
  currentEmployee: Employee;
  allEmployees: Employee[];
  pendingRequestsCount: number;
  activeView: 'manager_dashboard' | 'staff_calendar' | 'leave_management' | 'staff_clock' | 'staff_leave' | 'attendance_audit';
  setActiveView: (view: 'manager_dashboard' | 'staff_calendar' | 'leave_management' | 'staff_clock' | 'staff_leave' | 'attendance_audit') => void;
  onSwitchUser: (employeeId: string) => void;
  onResetData: () => void;
  onRequestLeaveOpen: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentEmployee,
  allEmployees,
  pendingRequestsCount,
  activeView,
  setActiveView,
  onSwitchUser,
  onResetData,
  onRequestLeaveOpen,
  onLogout,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const isManager = currentEmployee.role === 'manager';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text element wordmark */}
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setActiveView(isManager ? 'manager_dashboard' : 'staff_clock')}
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 block leading-tight">
                StaffPulse
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {isManager ? 'Manager Supervision Hub' : 'Staff Attendance & Leaves'}
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {isManager ? (
              <>
                <button
                  type="button"
                  onClick={() => setActiveView('manager_dashboard')}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeView === 'manager_dashboard'
                      ? 'bg-slate-100 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Main Dashboard</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveView('leave_management')}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 relative cursor-pointer ${
                    activeView === 'leave_management'
                      ? 'bg-slate-100 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <CalendarDays className="w-4 h-4" />
                  <span>Leave Approvals</span>
                  {pendingRequestsCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-amber-500 text-white rounded-full">
                      {pendingRequestsCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveView('staff_calendar')}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeView === 'staff_calendar'
                      ? 'bg-slate-100 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Staff Calendars (10 AM Rule)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveView('attendance_audit')}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeView === 'attendance_audit'
                      ? 'bg-slate-100 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>GPS Attendance Ledger</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setActiveView('staff_clock')}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeView === 'staff_clock'
                      ? 'bg-slate-100 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>My Clock In/Out</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveView('staff_leave')}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeView === 'staff_leave'
                      ? 'bg-slate-100 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <CalendarDays className="w-4 h-4" />
                  <span>Offer Letter Quotas & Leaves</span>
                </button>
              </>
            )}
          </nav>

          {/* Zone 3: Actions & Account Switcher */}
          <div className="flex items-center gap-3">
            {/* Quick Request Leave CTA for Staff */}
            {!isManager && (
              <button
                type="button"
                onClick={onRequestLeaveOpen}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Apply Leave</span>
              </button>
            )}

            {/* User Account Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-left cursor-pointer"
              >
                <img
                  src={currentEmployee.avatar}
                  alt={currentEmployee.name}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover border border-slate-200"
                />
                <div className="hidden lg:block text-xs">
                  <div className="font-semibold text-slate-800 flex items-center gap-1">
                    {currentEmployee.name}
                    {isManager && (
                      <span className="text-[9px] bg-indigo-100 text-indigo-800 px-1 rounded font-medium">
                        Manager
                      </span>
                    )}
                  </div>
                  <div className="text-slate-400 text-[10px] truncate max-w-[120px]">
                    {currentEmployee.email}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <div className="px-3.5 py-2 border-b border-slate-100 text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                    Switch Active User Account
                  </div>

                  <div className="max-h-64 overflow-y-auto py-1">
                    {allEmployees.map((emp) => (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => onSwitchUser(emp.id)}
                        className={`w-full px-3.5 py-2 text-left flex items-center gap-2.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                          emp.id === currentEmployee.id ? 'bg-indigo-50/70' : ''
                        }`}
                      >
                        <img
                          src={emp.avatar}
                          alt={emp.name}
                          referrerPolicy="no-referrer"
                          className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                            <span className="truncate">{emp.name}</span>
                            {emp.role === 'manager' && (
                              <span className="text-[9px] text-indigo-700 bg-indigo-50 border border-indigo-200 rounded px-1">
                                Manager
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {emp.title} · {emp.locationCountry || 'Remote'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 mt-1 pt-1 px-3 space-y-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUserDropdownOpen(false);
                        onResetData();
                      }}
                      className="w-full py-1 text-xs text-slate-600 hover:text-rose-600 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Sample Data</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 font-medium transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Dedicated Logout Button */}
            <button
              type="button"
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
              title="Log out of StaffPulse"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
