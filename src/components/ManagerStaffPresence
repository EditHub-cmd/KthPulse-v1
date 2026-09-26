import React from 'react';
import { Employee, AttendanceRecord, LeaveRequest } from '../types';
import { 
  Users, 
  MapPin, 
  Clock, 
  Coffee, 
  Calendar, 
  CheckCircle2, 
  Building, 
  Laptop, 
  Briefcase,
  AlertCircle 
} from 'lucide-react';
import { getTodayDateString, formatTime12h, datesOverlap } from '../utils/dateUtils';

interface ManagerStaffPresenceProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
}

export const ManagerStaffPresence: React.FC<ManagerStaffPresenceProps> = ({
  employees,
  attendanceRecords,
  leaveRequests,
}) => {
  const today = getTodayDateString();

  // Find today's attendance for each employee
  const todayAttendanceMap = new Map(
    attendanceRecords.filter((a) => a.date === today).map((a) => [a.employeeId, a])
  );

  // Find employees on approved leave today
  const onLeaveEmpIds = new Set(
    leaveRequests
      .filter(
        (r) =>
          r.status === 'approved' &&
          datesOverlap(r.startDate, r.endDate, today, today)
      )
      .map((r) => r.employeeId)
  );

  // Group staff by status
  const clockedInStaff: Employee[] = [];
  const onBreakStaff: Employee[] = [];
  const clockedOutStaff: Employee[] = [];
  const onLeaveStaff: Employee[] = [];
  const notClockedInStaff: Employee[] = [];

  for (const emp of employees) {
    if (onLeaveEmpIds.has(emp.id)) {
      onLeaveStaff.push(emp);
      continue;
    }

    const att = todayAttendanceMap.get(emp.id);
    if (!att) {
      notClockedInStaff.push(emp);
    } else if (att.clockOutTime) {
      clockedOutStaff.push(emp);
    } else {
      const hasActiveBreak = att.breaks.some((b) => !b.endTime);
      if (hasActiveBreak) {
        onBreakStaff.push(emp);
      } else {
        clockedInStaff.push(emp);
      }
    }
  }

  const officeCount = attendanceRecords
    .filter((a) => a.date === today && !a.clockOutTime && a.workLocation === 'Office HQ')
    .length;

  const remoteCount = attendanceRecords
    .filter((a) => a.date === today && !a.clockOutTime && a.workLocation === 'Remote / WFH')
    .length;

  return (
    <div className="space-y-6">
      {/* Presence Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">Working Now</span>
            <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
              {clockedInStaff.length + onBreakStaff.length}
            </span>
            <span className="text-[10px] text-slate-400 block">
              {officeCount} Office · {remoteCount} Remote
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">On Break</span>
            <span className="text-xl font-bold text-amber-900 font-mono tabular-nums">
              {onBreakStaff.length}
            </span>
            <span className="text-[10px] text-slate-400 block">Lunch / Rest</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">On Approved Leave</span>
            <span className="text-xl font-bold text-indigo-900 font-mono tabular-nums">
              {onLeaveStaff.length}
            </span>
            <span className="text-[10px] text-slate-400 block">Contractual Quota</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">Not Clocked In</span>
            <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
              {notClockedInStaff.length}
            </span>
            <span className="text-[10px] text-slate-400 block">Pending Shift Start</span>
          </div>
        </div>
      </div>

      {/* Roster of Staff and Their Live Attendance Status */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">
            Live Workforce Roster & Current Location
          </h3>
          <p className="text-xs text-slate-500">
            Real-time presence across Office HQ, Remote, and Field locations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
          {employees.map((emp) => {
            const att = todayAttendanceMap.get(emp.id);
            const isOnLeave = onLeaveEmpIds.has(emp.id);
            const isClockedIn = Boolean(att && !att.clockOutTime);
            const activeBreak = att?.breaks.find((b) => !b.endTime);
            const isOnBreak = Boolean(isClockedIn && activeBreak);
            const isCompleted = Boolean(att && att.clockOutTime);

            let statusLabel = 'Not Clocked In';
            let badgeBg = 'bg-slate-100 text-slate-600 border-slate-200';
            let dotColor = 'bg-slate-300';

            if (isOnLeave) {
              statusLabel = 'On Approved Leave';
              badgeBg = 'bg-indigo-50 text-indigo-700 border-indigo-200';
              dotColor = 'bg-indigo-500';
            } else if (isOnBreak) {
              statusLabel = `On Break (${activeBreak?.note || 'Rest'})`;
              badgeBg = 'bg-amber-50 text-amber-800 border-amber-200';
              dotColor = 'bg-amber-500';
            } else if (isClockedIn) {
              statusLabel = `Working (${att?.workLocation})`;
              badgeBg = 'bg-emerald-50 text-emerald-800 border-emerald-200';
              dotColor = 'bg-emerald-500';
            } else if (isCompleted) {
              statusLabel = 'Shift Completed';
              badgeBg = 'bg-slate-100 text-slate-700 border-slate-200';
              dotColor = 'bg-slate-400';
            }

            return (
              <div
                key={emp.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={emp.avatar}
                      alt={emp.name}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <div className="font-semibold text-slate-900 text-xs">
                        {emp.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {emp.department}
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded border flex items-center gap-1.5 ${badgeBg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                    <span>{statusLabel}</span>
                  </span>
                </div>

                {att && (
                  <div className="text-[11px] text-slate-600 space-y-1 pt-2 border-t border-slate-200/60 font-mono tabular-nums">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Clock In Time:</span>
                      <span className="font-medium text-slate-800">{formatTime12h(att.clockInTime)}</span>
                    </div>
                    {att.clockInGeo && (
                      <div className="flex justify-between items-center text-[10px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          <span>GPS:</span>
                        </span>
                        <span className="truncate max-w-[150px]">{att.clockInGeo.addressName}</span>
                      </div>
                    )}
                    {att.clockOutTime && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Clock Out Time:</span>
                        <span className="font-medium text-slate-800">{formatTime12h(att.clockOutTime)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
