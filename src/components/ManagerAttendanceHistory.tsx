import React, { useState } from 'react';
import { AttendanceRecord, Employee } from '../types';
import { 
  Clock, 
  MapPin, 
  Navigation, 
  Download, 
  Search, 
  Filter, 
  Calendar, 
  ShieldCheck, 
  AlertTriangle,
  Building,
  Laptop,
  Briefcase,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { 
  formatDatePretty, 
  formatTime12h, 
  formatMinutesToHours, 
  calculateDurationMinutes 
} from '../utils/dateUtils';
import { formatGpsCoordinates } from '../utils/geoUtils';

interface ManagerAttendanceHistoryProps {
  attendanceRecords: AttendanceRecord[];
  allEmployees: Employee[];
}

export const ManagerAttendanceHistory: React.FC<ManagerAttendanceHistoryProps> = ({
  attendanceRecords,
  allEmployees,
}) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGpsRecord, setSelectedGpsRecord] = useState<AttendanceRecord | null>(null);

  const employeeMap = new Map(allEmployees.map((e) => [e.id, e]));

  // Filter attendance records
  const filteredRecords = attendanceRecords.filter((rec) => {
    if (selectedEmployeeId !== 'all' && rec.employeeId !== selectedEmployeeId) return false;
    if (selectedLocation !== 'all' && rec.workLocation !== selectedLocation) return false;
    if (searchQuery) {
      const emp = employeeMap.get(rec.employeeId);
      const name = emp?.name.toLowerCase() || '';
      const notes = rec.notes?.toLowerCase() || '';
      const q = searchQuery.toLowerCase();
      if (!name.includes(q) && !notes.includes(q) && !rec.date.includes(q)) {
        return false;
      }
    }
    return true;
  });

  // Export to CSV for Payroll & Attendance Records
  const handleExportCsv = () => {
    const headers = [
      'Record ID',
      'Employee Name',
      'Employee ID',
      'Department',
      'Date',
      'Clock In Time',
      'Clock In GPS Lat',
      'Clock In GPS Lng',
      'Clock In Location Name',
      'Office Zone Verified',
      'Clock Out Time',
      'Clock Out GPS Lat',
      'Clock Out GPS Lng',
      'Work Location',
      'Net Working Minutes',
      'Punctuality Status',
      'Notes',
    ];

    const rows = filteredRecords.map((rec) => {
      const emp = employeeMap.get(rec.employeeId);
      const netMins = calculateDurationMinutes(rec.clockInTime, rec.clockOutTime, rec.breaks);
      return [
        rec.id,
        emp?.name || 'Unknown',
        rec.employeeId,
        emp?.department || '',
        rec.date,
        rec.clockInTime,
        rec.clockInGeo?.latitude || '',
        rec.clockInGeo?.longitude || '',
        `"${rec.clockInGeo?.addressName || ''}"`,
        rec.clockInGeo?.verifiedOfficeZone ? 'YES' : 'NO',
        rec.clockOutTime || 'Active',
        rec.clockOutGeo?.latitude || '',
        rec.clockOutGeo?.longitude || '',
        rec.workLocation,
        netMins,
        rec.status,
        `"${rec.notes || ''}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_GPS_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <span>Staff Attendance Ledger & GPS Verification</span>
          </h3>
          <p className="text-xs text-slate-500">
            Audit clock in/out timestamps, physical GPS coordinates, office geofence compliance, and hours
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Employee Filter */}
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Staff Members</option>
            {allEmployees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.department})
              </option>
            ))}
          </select>

          {/* Location Filter */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Work Locations</option>
            <option value="Office HQ">Office HQ</option>
            <option value="Remote / WFH">Remote / WFH</option>
            <option value="Client Site">Client Site</option>
          </select>

          {/* Export CSV button */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Clock In & GPS</th>
                <th className="py-3.5 px-4">Clock Out & GPS</th>
                <th className="py-3.5 px-4">Work Location</th>
                <th className="py-3.5 px-4">Net Duration</th>
                <th className="py-3.5 px-4">Punctuality</th>
                <th className="py-3.5 px-4 text-right">GPS Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((rec) => {
                const emp = employeeMap.get(rec.employeeId);
                const netMins = calculateDurationMinutes(rec.clockInTime, rec.clockOutTime, rec.breaks);
                const hasClockInGps = Boolean(rec.clockInGeo);
                const hasClockOutGps = Boolean(rec.clockOutGeo);

                return (
                  <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Employee Profile */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={emp?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                          alt={emp?.name}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <div className="font-semibold text-slate-900">
                            {emp?.name || 'Staff Member'}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {emp?.department}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-medium text-slate-800">
                        {formatDatePretty(rec.date)}
                      </span>
                      <span className="text-[11px] text-slate-400 block font-mono">
                        {rec.date}
                      </span>
                    </td>

                    {/* Clock In & GPS Location */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-semibold text-slate-900 tabular-nums">
                        {formatTime12h(rec.clockInTime)}
                      </div>
                      {hasClockInGps ? (
                        <div className="flex items-center gap-1 text-[11px] mt-0.5">
                          <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="text-slate-600 truncate max-w-[150px]" title={rec.clockInGeo?.addressName}>
                            {rec.clockInGeo?.addressName || formatGpsCoordinates(rec.clockInGeo)}
                          </span>
                          {rec.clockInGeo?.verifiedOfficeZone && (
                            <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1 rounded font-medium shrink-0">
                              HQ Geofence
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">GPS not logged</span>
                      )}
                    </td>

                    {/* Clock Out & GPS Location */}
                    <td className="py-3.5 px-4">
                      {rec.clockOutTime ? (
                        <>
                          <div className="font-mono font-semibold text-slate-900 tabular-nums">
                            {formatTime12h(rec.clockOutTime)}
                          </div>
                          {hasClockOutGps ? (
                            <div className="flex items-center gap-1 text-[11px] mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="text-slate-600 truncate max-w-[150px]" title={rec.clockOutGeo?.addressName}>
                                {rec.clockOutGeo?.addressName || formatGpsCoordinates(rec.clockOutGeo)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">GPS not logged</span>
                          )}
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          <span>Shift Active</span>
                        </span>
                      )}
                    </td>

                    {/* Work Location */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                        {rec.workLocation === 'Office HQ' && <Building className="w-3.5 h-3.5 text-indigo-600" />}
                        {rec.workLocation === 'Remote / WFH' && <Laptop className="w-3.5 h-3.5 text-amber-600" />}
                        {rec.workLocation === 'Client Site' && <Briefcase className="w-3.5 h-3.5 text-blue-600" />}
                        <span>{rec.workLocation}</span>
                      </div>
                    </td>

                    {/* Net Duration */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono font-semibold text-slate-900 text-xs tabular-nums">
                        {formatMinutesToHours(netMins)}
                      </span>
                      {rec.breaks.length > 0 && (
                        <span className="text-[10px] text-slate-400 block">
                          {rec.breaks.length} break(s) taken
                        </span>
                      )}
                    </td>

                    {/* Punctuality Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {rec.status === 'late' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
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

                    {/* GPS Inspector Button */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedGpsRecord(rec)}
                        className="px-2.5 py-1 text-xs font-medium text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>Inspect GPS</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* GPS Inspection Modal */}
      {selectedGpsRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-indigo-600" />
                <h4 className="text-base font-semibold text-slate-900">
                  GPS Attendance Verification Inspector
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGpsRecord(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <div>
                <strong>Staff:</strong> {employeeMap.get(selectedGpsRecord.employeeId)?.name} (ID: {selectedGpsRecord.employeeId})
              </div>
              <div>
                <strong>Shift Date:</strong> {formatDatePretty(selectedGpsRecord.date)}
              </div>
              <div>
                <strong>Location Category:</strong> {selectedGpsRecord.workLocation}
              </div>
            </div>

            {/* Clock In GPS Box */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  Clock In GPS Coordinates
                </span>
                <span className="font-mono text-xs font-semibold text-slate-700 tabular-nums">
                  {formatTime12h(selectedGpsRecord.clockInTime)}
                </span>
              </div>

              {selectedGpsRecord.clockInGeo ? (
                <div className="text-xs space-y-1 text-slate-700">
                  <div className="font-mono text-indigo-900 bg-white p-2 rounded border border-slate-200 tabular-nums">
                    Latitude: {selectedGpsRecord.clockInGeo.latitude.toFixed(6)}, Longitude: {selectedGpsRecord.clockInGeo.longitude.toFixed(6)}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>GPS Accuracy Radius: ~{selectedGpsRecord.clockInGeo.accuracy || 10} meters</span>
                    {selectedGpsRecord.clockInGeo.verifiedOfficeZone ? (
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Verified Astute HQ Perimeter
                      </span>
                    ) : (
                      <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Off-Site / Remote Location
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Location Name: <strong>{selectedGpsRecord.clockInGeo.addressName}</strong>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400">GPS data was not recorded for this clock in.</div>
              )}
            </div>

            {/* Clock Out GPS Box */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-600" />
                  Clock Out GPS Coordinates
                </span>
                <span className="font-mono text-xs font-semibold text-slate-700 tabular-nums">
                  {formatTime12h(selectedGpsRecord.clockOutTime)}
                </span>
              </div>

              {selectedGpsRecord.clockOutGeo ? (
                <div className="text-xs space-y-1 text-slate-700">
                  <div className="font-mono text-slate-900 bg-white p-2 rounded border border-slate-200 tabular-nums">
                    Latitude: {selectedGpsRecord.clockOutGeo.latitude.toFixed(6)}, Longitude: {selectedGpsRecord.clockOutGeo.longitude.toFixed(6)}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>GPS Accuracy Radius: ~{selectedGpsRecord.clockOutGeo.accuracy || 10} meters</span>
                    {selectedGpsRecord.clockOutGeo.verifiedOfficeZone ? (
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Verified Astute HQ Perimeter
                      </span>
                    ) : (
                      <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        Authorized Exit Area
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Location Name: <strong>{selectedGpsRecord.clockOutGeo.addressName}</strong>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400">
                  {selectedGpsRecord.clockOutTime
                    ? 'GPS data was not recorded for this clock out.'
                    : 'Staff is currently clocked in; clock out GPS will be recorded upon departure.'}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedGpsRecord(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
