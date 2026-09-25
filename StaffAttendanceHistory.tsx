import React from 'react';
import { AttendanceRecord } from '../types';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle,
  Building,
  Laptop,
  Briefcase 
} from 'lucide-react';
import { 
  formatDatePretty, 
  formatTime12h, 
  formatMinutesToHours, 
  calculateDurationMinutes 
} from '../utils/dateUtils';
import { formatGpsCoordinates } from '../utils/geoUtils';

interface StaffAttendanceHistoryProps {
  records: AttendanceRecord[];
}

export const StaffAttendanceHistory: React.FC<StaffAttendanceHistoryProps> = ({ records }) => {
  if (records.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
        No attendance records found yet.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            My Attendance Punch History
          </h3>
          <p className="text-xs text-slate-500">
            Audit of past clock in/out times, GPS verifications, and logged hours
          </p>
        </div>
        <span className="text-xs font-mono text-slate-500 tabular-nums">
          {records.length} shifts recorded
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Clock In (GPS)</th>
              <th className="py-3 px-4">Clock Out (GPS)</th>
              <th className="py-3 px-4">Location</th>
              <th className="py-3 px-4">Net Hours</th>
              <th className="py-3 px-4">Punctuality</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((rec) => {
              const netMins = calculateDurationMinutes(rec.clockInTime, rec.clockOutTime, rec.breaks);
              return (
                <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-semibold text-slate-900 block">
                      {formatDatePretty(rec.date)}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {rec.date}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-mono font-semibold text-slate-900 tabular-nums block">
                      {formatTime12h(rec.clockInTime)}
                    </span>
                    {rec.clockInGeo ? (
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate max-w-[140px]" title={rec.clockInGeo.addressName}>
                          {rec.clockInGeo.addressName}
                        </span>
                        {rec.clockInGeo.verifiedOfficeZone && (
                          <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1 rounded border border-emerald-200 shrink-0">
                            HQ
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400">GPS not logged</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    {rec.clockOutTime ? (
                      <>
                        <span className="font-mono font-semibold text-slate-900 tabular-nums block">
                          {formatTime12h(rec.clockOutTime)}
                        </span>
                        {rec.clockOutGeo ? (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate max-w-[140px]" title={rec.clockOutGeo.addressName}>
                              {rec.clockOutGeo.addressName}
                            </span>
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-medium">
                        Shift Active
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-slate-700 font-medium">
                      {rec.workLocation === 'Office HQ' && <Building className="w-3.5 h-3.5 text-indigo-600" />}
                      {rec.workLocation === 'Remote / WFH' && <Laptop className="w-3.5 h-3.5 text-amber-600" />}
                      {rec.workLocation === 'Client Site' && <Briefcase className="w-3.5 h-3.5 text-blue-600" />}
                      <span>{rec.workLocation}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-mono font-semibold text-slate-800 tabular-nums">
                      {formatMinutesToHours(netMins)}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {rec.status === 'late' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Late Arrival</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>On Time</span>
                      </span>
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
