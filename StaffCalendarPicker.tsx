import React, { useState } from 'react';
import { Employee, AttendanceRecord, LeaveRequest } from '../types';
import { 
  Users, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Laptop, 
  Building,
  Activity,
  FileSpreadsheet
} from 'lucide-react';
import { getTodayDateString, formatTime12h } from '../utils/dateUtils';

interface StaffCalendarPickerProps {
  staffMembers: Employee[];
  attendanceRecords: AttendanceRecord[];
  onSelectStaff: (employee: Employee) => void;
}

export const StaffCalendarPicker: React.FC<StaffCalendarPickerProps> = ({
  staffMembers,
  attendanceRecords,
  onSelectStaff,
}) => {
  const today = getTodayDateString();
  const todayAttendanceMap = new Map(
    attendanceRecords.filter((a) => a.date === today).map((a) => [a.employeeId, a])
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <span>Staff Monthly & Yearly Attendance Calendars</span>
          </h3>
          <p className="text-xs text-slate-500">
            Select a team member to inspect their full month calendar, 10:00 AM punctuality history (late check-ins in RED), and approved leaves.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {staffMembers.map((emp) => {
          const att = todayAttendanceMap.get(emp.id);
          const isLate = att && att.clockInTime > '10:00:00';
          const isOnTime = att && att.clockInTime <= '10:00:00';

          return (
            <div
              key={emp.id}
              onClick={() => onSelectStaff(emp)}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={emp.avatar}
                      alt={emp.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {emp.name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {emp.title}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {emp.department}
                      </p>
                    </div>
                  </div>

                  {emp.locationCountry?.includes('India') && (
                    <span className="text-[9px] font-semibold bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded">
                      India WFH
                    </span>
                  )}
                </div>

                {/* Today's 10:00 AM Punctuality Tag */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Today's Check-in:</span>
                    {att ? (
                      <span className="font-mono font-bold text-slate-900 tabular-nums">
                        {formatTime12h(att.clockInTime)}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Not clocked in</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-500">10:00 AM Rule:</span>
                    {isLate ? (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        <span>LATE (after 10:00 AM)</span>
                      </span>
                    ) : isOnTime ? (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>On-Time Arrival</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Pending</span>
                    )}
                  </div>
                </div>

                {/* Active Computer Activity */}
                {emp.activeWorkStatus && (
                  <div className="text-[11px] text-slate-600 flex items-center gap-1.5 truncate">
                    <Activity className="w-3 h-3 text-indigo-600 shrink-0" />
                    <span className="truncate">Active on: <strong>{emp.activeWorkStatus.currentApp}</strong></span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:text-indigo-800">
                <span>Open {emp.name.split(' ')[0]}'s Calendar</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
