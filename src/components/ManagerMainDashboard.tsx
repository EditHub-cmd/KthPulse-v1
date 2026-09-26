import React from 'react';
import { Employee, AttendanceRecord, LeaveRequest } from '../types';
import { 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  MapPin, 
  ArrowRight, 
  Activity, 
  Laptop, 
  Building,
  CalendarDays,
  FileSpreadsheet,
  Mail
} from 'lucide-react';
import { 
  getTodayDateString, 
  formatTime12h, 
  datesOverlap 
} from '../utils/dateUtils';

interface ManagerMainDashboardProps {
  currentManager: Employee;
  allEmployees: Employee[];
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  onSelectStaff: (employee: Employee) => void;
  onNavigateToLeaves: () => void;
}

export const ManagerMainDashboard: React.FC<ManagerMainDashboardProps> = ({
  currentManager,
  allEmployees,
  attendanceRecords,
  leaveRequests,
  onSelectStaff,
  onNavigateToLeaves,
}) => {
  const today = getTodayDateString();

  // Filter only staff members (excluding the manager from the staff roster)
  const staffMembers = allEmployees.filter((e) => e.role === 'staff');

  const todayAttendanceMap = new Map(
    attendanceRecords.filter((a) => a.date === today).map((a) => [a.employeeId, a])
  );

  // Check approved leaves for today
  const onLeaveEmpIds = new Set(
    leaveRequests
      .filter((r) => r.status === 'approved' && datesOverlap(r.startDate, r.endDate, today, today))
      .map((r) => r.employeeId)
  );

  // Count punctuality stats
  let onTimeCount = 0;
  let lateCount = 0;
  let notClockedInCount = 0;
  let onLeaveCount = 0;

  staffMembers.forEach((emp) => {
    if (onLeaveEmpIds.has(emp.id)) {
      onLeaveCount++;
      return;
    }
    const att = todayAttendanceMap.get(emp.id);
    if (!att) {
      notClockedInCount++;
    } else if (att.clockInTime > '10:00:00') {
      lateCount++;
    } else {
      onTimeCount++;
    }
  });

  const pendingLeavesCount = leaveRequests.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 10:00 AM Punctuality Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-lg font-bold">
              Staff Attendance & Live Shift Roster
            </h2>
          </div>
          <p className="text-xs text-slate-300">
            Official working hour is <strong className="text-amber-300">10:00 AM sharp</strong>. Any clock-in at <strong>10:01 AM or later is flagged in RED as Late</strong>. Click on any staff member to view their complete Month & Year punch and leave calendar.
          </p>
        </div>

        {pendingLeavesCount > 0 && (
          <button
            type="button"
            onClick={onNavigateToLeaves}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <CalendarDays className="w-4 h-4" />
            <span>{pendingLeavesCount} Pending Leave Approvals</span>
          </button>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] text-emerald-700 block font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>On-Time (&le; 10:00 AM)</span>
          </span>
          <span className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
            {onTimeCount}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Checked in on schedule</span>
        </div>

        {/* LATE ARRIVALS IN RED */}
        <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 shadow-sm">
          <span className="text-[11px] text-rose-800 block font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Late Check-Ins (&ge; 10:01 AM)</span>
          </span>
          <span className="text-2xl font-bold font-mono text-rose-700 tabular-nums">
            {lateCount}
          </span>
          <span className="text-[10px] text-rose-600 block mt-0.5">Arrived after 10:00 AM</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-500 block font-medium">Pending Shift Start</span>
          <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {notClockedInCount}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Not clocked in yet today</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] text-indigo-700 block font-medium">On Approved Leave</span>
          <span className="text-2xl font-bold font-mono text-indigo-700 tabular-nums">
            {onLeaveCount}
          </span>
          <span className="text-[10px] text-indigo-500 block mt-0.5">Official time off</span>
        </div>
      </div>

      {/* Main Staff Roster with 10:00 AM Punctuality & Activity */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Staff Clock-In Status & Computer Activity (Today)
            </h3>
            <p className="text-xs text-slate-500">
              Click on any staff member's name (e.g. <strong>John Doe</strong>) to view their dedicated Month & Year calendar
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 tabular-nums">
            {staffMembers.length} team members total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Staff Member</th>
                <th className="py-3.5 px-4">Location & Timezone</th>
                <th className="py-3.5 px-4">Clock-In Time</th>
                <th className="py-3.5 px-4">10:00 AM Punctuality</th>
                <th className="py-3.5 px-4">Computer Activity (Work Log)</th>
                <th className="py-3.5 px-4 text-right">Calendar Record</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffMembers.map((emp) => {
                const att = todayAttendanceMap.get(emp.id);
                const isOnLeave = onLeaveEmpIds.has(emp.id);
                const isLate = att && att.clockInTime > '10:00:00';
                const isOnTime = att && att.clockInTime <= '10:00:00';

                return (
                  <tr 
                    key={emp.id} 
                    className="hover:bg-indigo-50/30 transition-colors group cursor-pointer"
                    onClick={() => onSelectStaff(emp)}
                  >
                    {/* Staff Profile - Clickable */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={emp.avatar}
                          alt={emp.name}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectStaff(emp);
                            }}
                            className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-left flex items-center gap-1 cursor-pointer"
                          >
                            <span>{emp.name}</span>
                            <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                          <div className="text-[11px] text-slate-500">
                            {emp.title} · {emp.department}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Location & Timezone (Remote India / HQ) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        {emp.locationCountry?.includes('India') ? (
                          <Laptop className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        ) : (
                          <Building className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        )}
                        <span>{emp.locationCountry || 'Remote'}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {emp.timezone}
                      </div>
                    </td>

                    {/* Clock In Time */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {att ? (
                        <div className="font-mono font-bold text-slate-900 text-xs tabular-nums">
                          {formatTime12h(att.clockInTime)}
                        </div>
                      ) : isOnLeave ? (
                        <span className="text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-[11px] font-medium">
                          On Approved Leave
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs font-mono">
                          --:--
                        </span>
                      )}
                    </td>

                    {/* 10:00 AM Punctuality (RED IF >= 10:01 AM) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {isLate ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-600 text-white rounded-lg font-bold text-[11px] shadow-sm animate-in fade-in">
                          <AlertTriangle className="w-3.5 h-3.5 text-white" />
                          <span>LATE ({formatTime12h(att.clockInTime)})</span>
                        </div>
                      ) : isOnTime ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>ON TIME ({formatTime12h(att.clockInTime)})</span>
                        </div>
                      ) : isOnLeave ? (
                        <span className="text-[11px] text-indigo-600 font-medium">
                          Leave Approved
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">
                          Not Clocked In
                        </span>
                      )}
                    </td>

                    {/* Computer Activity (Google Sheets, Gmail, etc.) */}
                    <td className="py-3.5 px-4 max-w-xs">
                      {emp.activeWorkStatus ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-800 truncate">
                            <Activity className="w-3 h-3 text-indigo-600 shrink-0" />
                            <span className="truncate">{emp.activeWorkStatus.currentApp}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate italic">
                            "{emp.activeWorkStatus.activeTask}"
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>

                    {/* View Calendar Action Button */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStaff(emp);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>View Calendar</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
