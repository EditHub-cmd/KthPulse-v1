import React, { useState, useMemo } from 'react';
import { Employee, AttendanceRecord, LeaveRequest } from '../types';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  MapPin, 
  Laptop, 
  Building, 
  FileText, 
  Globe, 
  Activity,
  CalendarDays,
  Info
} from 'lucide-react';
import { 
  formatDatePretty, 
  formatTime12h, 
  formatMinutesToHours, 
  calculateDurationMinutes, 
  datesOverlap,
  getTodayDateString 
} from '../utils/dateUtils';
import { computeEmployeeLeaveBalances } from '../utils/storage';

interface StaffMonthlyCalendarViewProps {
  employee: Employee;
  allAttendance: AttendanceRecord[];
  allLeaveRequests: LeaveRequest[];
  onBack: () => void;
  onRequestLeaveForStaff?: () => void;
}

export const StaffMonthlyCalendarView: React.FC<StaffMonthlyCalendarViewProps> = ({
  employee,
  allAttendance,
  allLeaveRequests,
  onBack,
  onRequestLeaveForStaff,
}) => {
  // Calendar Month & Year State (Defaulting to current date: Sep 2026)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(8); // 8 is September (0-indexed)
  const [selectedDayDetail, setSelectedDayDetail] = useState<{
    dateStr: string;
    attendance?: AttendanceRecord;
    approvedLeave?: LeaveRequest;
  } | null>(null);

  const todayStr = getTodayDateString();

  // Employee specific records
  const empAttendance = useMemo(
    () => allAttendance.filter((a) => a.employeeId === employee.id),
    [allAttendance, employee.id]
  );

  const empApprovedLeaves = useMemo(
    () => allLeaveRequests.filter((r) => r.employeeId === employee.id && r.status === 'approved'),
    [allLeaveRequests, employee.id]
  );

  const balances = useMemo(
    () => computeEmployeeLeaveBalances(employee, allLeaveRequests),
    [employee, allLeaveRequests]
  );

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calendar calculations
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday

  // Month attendance map
  const monthAttendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    for (const att of empAttendance) {
      map.set(att.date, att);
    }
    return map;
  }, [empAttendance]);

  // Check if a date string falls inside an approved leave
  const getApprovedLeaveForDate = (dateStr: string): LeaveRequest | undefined => {
    return empApprovedLeaves.find((l) => datesOverlap(l.startDate, l.endDate, dateStr, dateStr));
  };

  // Monthly summary metrics
  const monthMetrics = useMemo(() => {
    let totalWorkedDays = 0;
    let onTimeDays = 0;
    let lateDays = 0;
    let totalMinutesWorked = 0;
    let approvedLeaveDaysCount = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const att = monthAttendanceMap.get(dayStr);
      const leave = getApprovedLeaveForDate(dayStr);

      if (leave) {
        approvedLeaveDaysCount += leave.isHalfDay ? 0.5 : 1;
      }

      if (att) {
        totalWorkedDays++;
        // 10:00 AM Strict Rule
        if (att.clockInTime > '10:00:00') {
          lateDays++;
        } else {
          onTimeDays++;
        }
        totalMinutesWorked += calculateDurationMinutes(att.clockInTime, att.clockOutTime, att.breaks);
      }
    }

    return {
      totalWorkedDays,
      onTimeDays,
      lateDays,
      approvedLeaveDaysCount,
      totalHours: formatMinutesToHours(totalMinutesWorked),
    };
  }, [currentYear, currentMonth, daysInMonth, monthAttendanceMap, empApprovedLeaves]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600 hover:text-slate-900 cursor-pointer"
            title="Return to Main Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                {employee.name}'s Attendance & Leave Calendar
              </h2>
              {employee.locationCountry && (
                <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded font-semibold">
                  {employee.locationCountry}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {employee.title} · {employee.department} · Timezone: {employee.timezone || 'UTC'}
            </p>
          </div>
        </div>

        {/* 10:00 AM Working Policy Pill */}
        <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-xs">
          <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
          <div>
            <span className="font-semibold text-slate-900 block">
              Shift Starts at 10:00 AM
            </span>
            <span className="text-[11px] text-rose-600 font-medium">
              Check-ins &ge; 10:01 AM flagged in RED as Late
            </span>
          </div>
        </div>
      </div>

      {/* Staff Computer Activity & Offer Letter Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Computer Activity Monitor Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
              <span>Computer Work Activity</span>
            </span>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Tracking</span>
            </span>
          </div>

          <div className="pt-1">
            <div className="text-xs font-semibold text-slate-900">
              Active App: {employee.activeWorkStatus?.currentApp || 'Google Sheets & Email Portal'}
            </div>
            <div className="text-xs text-slate-600 italic mt-0.5">
              "{employee.activeWorkStatus?.activeTask || 'Working on designated team sprint deliverables'}"
            </div>
            <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
              <span>Status: {employee.activeWorkStatus?.isIdle ? 'Idle / Background' : 'Actively Typing / Working'}</span>
              <span>Updated: {employee.activeWorkStatus?.lastActiveAt || '2 mins ago'}</span>
            </div>
          </div>
        </div>

        {/* Offer Letter Balance Snapshot */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>Offer Letter Contract Quotas ({employee.offerLetter.contractType})</span>
            </span>
            <span className="text-xs text-slate-400">
              Signed: {employee.offerLetter.offerDate}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-1">
            {balances.map((b) => (
              <div key={b.leaveType} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <span className="text-[10px] text-slate-500 block truncate">{b.label}</span>
                <span className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                  {b.remaining} / {b.entitled}d
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {b.used}d used
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Summary Scoreboard (Focusing on 10:00 AM Punctuality & Approved Leaves) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-500 block">Total Days Worked</span>
          <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
            {monthMetrics.totalWorkedDays}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">In {monthNames[currentMonth]}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] text-emerald-700 block font-medium">On-Time (Before 10:00 AM)</span>
          <span className="text-xl font-bold font-mono text-emerald-700 tabular-nums">
            {monthMetrics.onTimeDays}
          </span>
          <span className="text-[10px] text-emerald-600 block mt-0.5">Compliant</span>
        </div>

        {/* LATE ARRIVALS IN RED */}
        <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 shadow-sm">
          <span className="text-[11px] text-rose-800 block font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>Late (&ge; 10:01 AM)</span>
          </span>
          <span className="text-xl font-bold font-mono text-rose-700 tabular-nums">
            {monthMetrics.lateDays}
          </span>
          <span className="text-[10px] text-rose-600 block mt-0.5">Exceeded 10:00 AM</span>
        </div>

        {/* APPROVED LEAVE REFLECTION */}
        <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-200 shadow-sm">
          <span className="text-[11px] text-indigo-800 block font-semibold flex items-center gap-1">
            <CalendarDays className="w-3 h-3 text-indigo-600" />
            <span>Approved Leaves</span>
          </span>
          <span className="text-xl font-bold font-mono text-indigo-700 tabular-nums">
            {monthMetrics.approvedLeaveDaysCount} days
          </span>
          <span className="text-[10px] text-indigo-600 block mt-0.5">Reflected on calendar</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-500 block">Total Net Hours</span>
          <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
            {monthMetrics.totalHours}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Punched duration</span>
        </div>
      </div>

      {/* Interactive Calendar Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Month & Year Navigation Bar */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-slate-900 font-mono">
              {monthNames[currentMonth]} {currentYear}
            </h3>
            <span className="text-xs text-slate-500 hidden sm:inline">
              (Working Hour: 10:00 AM · Late check-ins in RED)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrentMonth(8); // September
                setCurrentYear(2026);
              }}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 7-Day Calendar Grid Header */}
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center text-xs font-semibold text-slate-500 py-2.5">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Days Matrix */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
          {/* Empty cells before month starts */}
          {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
            <div key={`empty-${idx}`} className="min-h-[105px] p-2 bg-slate-50/40" />
          ))}

          {/* Days of current month */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const att = monthAttendanceMap.get(dateStr);
            const approvedLeave = getApprovedLeaveForDate(dateStr);
            const isToday = dateStr === todayStr;

            const isLate = att && att.clockInTime > '10:00:00';
            const isOnTime = att && att.clockInTime <= '10:00:00';

            const dayOfWeek = new Date(currentYear, currentMonth, dayNum).getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            return (
              <div
                key={dateStr}
                onClick={() => setSelectedDayDetail({ dateStr, attendance: att, approvedLeave })}
                className={`min-h-[105px] p-2 transition-colors cursor-pointer relative flex flex-col justify-between ${
                  isToday
                    ? 'bg-indigo-50/40 ring-1 ring-inset ring-indigo-500'
                    : isLate
                    ? 'bg-rose-50/25 hover:bg-rose-50/50'
                    : approvedLeave
                    ? 'bg-indigo-50/30 hover:bg-indigo-50/60'
                    : isWeekend
                    ? 'bg-slate-50/30'
                    : 'hover:bg-slate-50/80'
                }`}
              >
                {/* Day Number Header */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-mono font-semibold ${
                      isToday
                        ? 'w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px]'
                        : isLate
                        ? 'text-rose-700'
                        : isWeekend
                        ? 'text-slate-400'
                        : 'text-slate-700'
                    }`}
                  >
                    {dayNum}
                  </span>

                  {isToday && (
                    <span className="text-[9px] font-bold text-indigo-700 uppercase">
                      Today
                    </span>
                  )}
                </div>

                {/* Content inside the Day Cell */}
                <div className="space-y-1 my-auto">
                  {/* Attendance Clock In / Out Records */}
                  {att && (
                    <div className="space-y-0.5">
                      {/* Clock In - Highlighted in RED if >= 10:01 AM */}
                      <div
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold flex items-center justify-between tabular-nums ${
                          isLate
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                        }`}
                        title={
                          isLate
                            ? `Clocked in at ${formatTime12h(att.clockInTime)} - LATE (after 10:00 AM working hour)`
                            : `Clocked in at ${formatTime12h(att.clockInTime)} - On Time`
                        }
                      >
                        <span className="truncate">
                          In: {formatTime12h(att.clockInTime)}
                        </span>
                        {isLate && (
                          <span className="text-[9px] font-bold uppercase tracking-wider">
                            LATE
                          </span>
                        )}
                      </div>

                      {/* Clock Out */}
                      {att.clockOutTime ? (
                        <div className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 flex items-center justify-between tabular-nums">
                          <span>Out: {formatTime12h(att.clockOutTime)}</span>
                        </div>
                      ) : (
                        <div className="text-[9px] text-emerald-700 font-medium px-1 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Shift Active</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* REFLECT APPROVED LEAVE ON CALENDAR */}
                  {approvedLeave && (
                    <div
                      className="p-1 rounded bg-indigo-600 text-white text-[10px] font-semibold space-y-0.5 shadow-sm"
                      title={`Approved Leave: ${approvedLeave.reason} (Approved by ${approvedLeave.reviewedByName})`}
                    >
                      <div className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3 text-white shrink-0" />
                        <span className="truncate capitalize">
                          {approvedLeave.leaveType.replace('_', ' ')} Leave
                        </span>
                      </div>
                      <div className="text-[9px] text-indigo-100 truncate">
                        Approved by {approvedLeave.reviewedByName || 'Manager'}
                      </div>
                    </div>
                  )}

                  {!att && !approvedLeave && !isWeekend && (
                    <div className="text-[10px] text-slate-300 italic text-center py-1">
                      No punch
                    </div>
                  )}
                </div>

                {/* Micro Footer for Cell */}
                {att && (
                  <div className="text-[9px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100/60 font-mono">
                    <span className="truncate">{att.workLocation.replace('Remote / ', '')}</span>
                    <span>{formatMinutesToHours(calculateDurationMinutes(att.clockInTime, att.clockOutTime, att.breaks))}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Inspection Modal */}
      {selectedDayDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Daily Record: {formatDatePretty(selectedDayDetail.dateStr)}
                </h4>
                <p className="text-xs text-slate-500">
                  Staff: {employee.name} ({employee.department})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Attendance Details */}
            {selectedDayDetail.attendance ? (
              <div className="space-y-3">
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    selectedDayDetail.attendance.clockInTime > '10:00:00'
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {selectedDayDetail.attendance.clockInTime > '10:00:00' ? (
                      <AlertTriangle className="w-5 h-5 text-rose-600" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    )}
                    <div>
                      <div className="text-xs font-bold">
                        {selectedDayDetail.attendance.clockInTime > '10:00:00'
                          ? 'LATE ARRIVAL BEYOND 10:00 AM'
                          : 'ON-TIME ARRIVAL'}
                      </div>
                      <div className="text-[11px]">
                        Clocked In: <strong>{formatTime12h(selectedDayDetail.attendance.clockInTime)}</strong> (Working hour is 10:00 AM)
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Clock Out:</span>
                    <span className="font-semibold text-slate-900">
                      {formatTime12h(selectedDayDetail.attendance.clockOutTime)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Net Working Time:</span>
                    <span className="font-semibold text-slate-900">
                      {formatMinutesToHours(
                        calculateDurationMinutes(
                          selectedDayDetail.attendance.clockInTime,
                          selectedDayDetail.attendance.clockOutTime,
                          selectedDayDetail.attendance.breaks
                        )
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Work Location:</span>
                    <span className="font-semibold text-slate-900">
                      {selectedDayDetail.attendance.workLocation}
                    </span>
                  </div>
                  {selectedDayDetail.attendance.clockInGeo && (
                    <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                      <span className="text-slate-400 block text-[10px]">GPS Captured:</span>
                      <span>{selectedDayDetail.attendance.clockInGeo.addressName}</span>
                    </div>
                  )}
                  {selectedDayDetail.attendance.notes && (
                    <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Punch Notes:</span>
                      <span>"{selectedDayDetail.attendance.notes}"</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                No attendance punches logged for this date.
              </div>
            )}

            {/* Approved Leave Detail */}
            {selectedDayDetail.approvedLeave && (
              <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1.5 text-xs text-indigo-900">
                <div className="font-semibold flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-indigo-700" />
                  <span>Approved Leave Reflected on Calendar</span>
                </div>
                <div>
                  <strong>Type:</strong> {selectedDayDetail.approvedLeave.leaveType.toUpperCase()} Leave ({selectedDayDetail.approvedLeave.totalDays} days)
                </div>
                <div>
                  <strong>Staff Reason:</strong> "{selectedDayDetail.approvedLeave.reason}"
                </div>
                <div className="text-[11px] text-indigo-700 pt-1 border-t border-indigo-200">
                  <strong>Supervisor Decision:</strong> "{selectedDayDetail.approvedLeave.managerComment || 'Approved'}" (by {selectedDayDetail.approvedLeave.reviewedByName})
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedDayDetail(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
