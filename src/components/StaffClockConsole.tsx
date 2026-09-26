import React, { useState, useEffect } from 'react';
import { Employee, AttendanceRecord, GeoLocationData } from '../types';
import { 
  Clock, 
  MapPin, 
  Coffee, 
  LogOut, 
  LogIn, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Calendar,
  Building,
  Laptop,
  Briefcase,
  Navigation,
  Loader2
} from 'lucide-react';
import { 
  formatTime12h, 
  formatMinutesToHours, 
  calculateDurationMinutes, 
  getCurrentTimeString, 
  getTodayDateString 
} from '../utils/dateUtils';
import { captureCurrentGps, formatGpsCoordinates } from '../utils/geoUtils';

interface StaffClockConsoleProps {
  currentEmployee: Employee;
  todayAttendance?: AttendanceRecord;
  onClockIn: (
    location: 'Office HQ' | 'Remote / WFH' | 'Client Site',
    note: string,
    geo?: GeoLocationData
  ) => void;
  onStartBreak: (attendanceId: string, note: string) => void;
  onEndBreak: (attendanceId: string) => void;
  onClockOut: (attendanceId: string, geo?: GeoLocationData) => void;
  onRequestLeave: () => void;
}

export const StaffClockConsole: React.FC<StaffClockConsoleProps> = ({
  currentEmployee,
  todayAttendance,
  onClockIn,
  onStartBreak,
  onEndBreak,
  onClockOut,
  onRequestLeave,
}) => {
  // Live clock state
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [selectedLocation, setSelectedLocation] = useState<'Office HQ' | 'Remote / WFH' | 'Client Site'>('Office HQ');
  const [checkInNote, setCheckInNote] = useState('');
  const [breakNote, setBreakNote] = useState('Lunch Break');
  const [showBreakSelector, setShowBreakSelector] = useState(false);
  const [isCapturingGps, setIsCapturingGps] = useState(false);
  const [gpsStatusMessage, setGpsStatusMessage] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTriggerClockIn = async () => {
    setIsCapturingGps(true);
    setGpsStatusMessage('Acquiring precise GPS satellite fix...');
    try {
      const geo = await captureCurrentGps(selectedLocation);
      setGpsStatusMessage(`GPS verified: ${geo.addressName}`);
      onClockIn(selectedLocation, checkInNote, geo);
    } catch (e) {
      console.error(e);
      onClockIn(selectedLocation, checkInNote);
    } finally {
      setIsCapturingGps(false);
    }
  };

  const handleTriggerClockOut = async () => {
    if (!todayAttendance) return;
    setIsCapturingGps(true);
    setGpsStatusMessage('Verifying departure GPS location...');
    try {
      const geo = await captureCurrentGps(todayAttendance.workLocation);
      onClockOut(todayAttendance.id, geo);
    } catch (e) {
      console.error(e);
      onClockOut(todayAttendance.id);
    } finally {
      setIsCapturingGps(false);
    }
  };

  // Determine current status
  const isClockedIn = Boolean(todayAttendance && !todayAttendance.clockOutTime);
  const isClockedOut = Boolean(todayAttendance && todayAttendance.clockOutTime);
  const activeBreak = todayAttendance?.breaks.find((b) => !b.endTime);
  const isOnBreak = Boolean(isClockedIn && activeBreak);

  // Calculate live working duration
  const elapsedMinutes = todayAttendance
    ? calculateDurationMinutes(
        todayAttendance.clockInTime,
        todayAttendance.clockOutTime,
        todayAttendance.breaks
      )
    : 0;

  const targetHours = currentEmployee.offerLetter.standardHoursPerDay || 8;
  const targetMinutes = targetHours * 60;
  const progressPercent = Math.min(100, Math.round((elapsedMinutes / targetMinutes) * 100));

  const formattedLiveClock = currentTime.toLocaleTimeString('en-US', {
    hour12: true,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const formattedLiveDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Card: Live Clock & Shift Status */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Digital Clock & Date */}
          <div className="lg:col-span-5 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-md text-xs font-medium text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{formattedLiveDate}</span>
            </div>

            <div className="font-mono text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 tabular-nums">
              {formattedLiveClock}
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span>Standard Contract Hours: {targetHours}.0h / day</span>
              <span aria-hidden="true">·</span>
              <span>Offer Letter: {currentEmployee.offerLetter.contractType}</span>
            </div>
          </div>

          {/* Middle Column: Current Status Badge & Metrics */}
          <div className="lg:col-span-4 border-y lg:border-y-0 lg:border-x border-slate-100 py-6 lg:py-0 lg:px-6 space-y-4">
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">
                Current Shift Status
              </div>
              {isOnBreak ? (
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-xl font-bold text-amber-900">
                    On Break ({activeBreak?.note || 'Rest'})
                  </span>
                </div>
              ) : isClockedIn ? (
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xl font-bold text-emerald-900">
                    Clocked In · Working
                  </span>
                </div>
              ) : isClockedOut ? (
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-slate-400" />
                  <span className="text-xl font-bold text-slate-800">
                    Shift Completed (Clocked Out)
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-slate-300" />
                  <span className="text-xl font-bold text-slate-700">
                    Not Clocked In Today
                  </span>
                </div>
              )}
            </div>

            {/* Time Elapsed Metric & Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Logged Time Today</span>
                <span className="font-mono font-semibold text-slate-800 tabular-nums">
                  {formatMinutesToHours(elapsedMinutes)} / {targetHours}h 00m
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    progressPercent >= 100
                      ? 'bg-emerald-500'
                      : isOnBreak
                      ? 'bg-amber-500'
                      : isClockedIn
                      ? 'bg-indigo-600'
                      : 'bg-slate-300'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500 flex justify-between">
                <span>{progressPercent}% of target completed</span>
                {todayAttendance?.workLocation && (
                  <span className="font-medium text-slate-700">
                    Location: {todayAttendance.workLocation}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Action Buttons */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            {!isClockedIn && !isClockedOut && (
              <div className="space-y-3">
                {/* Location Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Select Work Location
                  </label>
                  <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setSelectedLocation('Office HQ')}
                      className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                        selectedLocation === 'Office HQ'
                          ? 'bg-white text-slate-900 shadow-sm font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Building className="w-3 h-3" />
                      <span>Office</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedLocation('Remote / WFH')}
                      className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                        selectedLocation === 'Remote / WFH'
                          ? 'bg-white text-slate-900 shadow-sm font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Laptop className="w-3 h-3" />
                      <span>WFH</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedLocation('Client Site')}
                      className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                        selectedLocation === 'Client Site'
                          ? 'bg-white text-slate-900 shadow-sm font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Briefcase className="w-3 h-3" />
                      <span>Client</span>
                    </button>
                  </div>
                </div>

                {/* Optional Note */}
                <input
                  type="text"
                  placeholder="Optional check-in note..."
                  value={checkInNote}
                  onChange={(e) => setCheckInNote(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
                />

                {/* Main Clock In Button with GPS indicator */}
                <button
                  type="button"
                  onClick={handleTriggerClockIn}
                  disabled={isCapturingGps}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                >
                  {isCapturingGps ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying GPS & Clocking In...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Clock In (Capture GPS)</span>
                    </>
                  )}
                </button>

                {gpsStatusMessage && (
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 px-1 font-mono">
                    <Navigation className="w-3 h-3 text-indigo-600 shrink-0" />
                    <span className="truncate">{gpsStatusMessage}</span>
                  </div>
                )}
              </div>
            )}

            {isClockedIn && (
              <div className="space-y-3">
                {isOnBreak ? (
                  <button
                    type="button"
                    onClick={() => todayAttendance && onEndBreak(todayAttendance.id)}
                    className="w-full py-3.5 px-4 bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white font-semibold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Resume Work (End Break)</span>
                  </button>
                ) : (
                  <>
                    {/* Start Break Trigger or Selector */}
                    {showBreakSelector ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                        <div className="text-xs font-semibold text-amber-900">
                          Select Break Type
                        </div>
                        <div className="flex gap-1.5">
                          {['Lunch Break', 'Coffee Break', 'Personal Rest'].map((b) => (
                            <button
                              key={b}
                              type="button"
                              onClick={() => setBreakNote(b)}
                              className={`text-[11px] px-2 py-1 rounded border transition-colors ${
                                breakNote === b
                                  ? 'bg-amber-600 text-white border-amber-600 font-semibold'
                                  : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-100'
                              }`}
                            >
                              {b}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (todayAttendance) {
                                onStartBreak(todayAttendance.id, breakNote);
                                setShowBreakSelector(false);
                              }
                            }}
                            className="flex-1 py-1.5 bg-amber-600 text-white rounded text-xs font-semibold hover:bg-amber-700 cursor-pointer"
                          >
                            Start Break Now
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowBreakSelector(false)}
                            className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded text-xs hover:bg-slate-50 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowBreakSelector(true)}
                        className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Coffee className="w-4 h-4 text-amber-700" />
                        <span>Take a Break</span>
                      </button>
                    )}

                    {/* Clock Out Button with GPS verification */}
                    <button
                      type="button"
                      onClick={handleTriggerClockOut}
                      disabled={isCapturingGps}
                      className="w-full py-3.5 px-4 bg-slate-900 hover:bg-rose-700 active:scale-[0.99] text-white font-semibold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                    >
                      {isCapturingGps ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying Departure GPS...</span>
                        </>
                      ) : (
                        <>
                          <LogOut className="w-4 h-4" />
                          <span>Clock Out (Capture GPS)</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            )}

            {isClockedOut && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                <div className="text-xs font-semibold text-slate-800">
                  Great work today!
                </div>
                <div className="text-xs text-slate-500">
                  You clocked out at {formatTime12h(todayAttendance?.clockOutTime)}.
                </div>
                <button
                  type="button"
                  onClick={onRequestLeave}
                  className="w-full py-2 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                >
                  Plan Upcoming Leave
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Today's Punch Timeline and Shift Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Timeline Punch Log */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Today's Punch Activity Log
              </h3>
              <p className="text-xs text-slate-500">
                Real-time chronological events for your current shift
              </p>
            </div>
            {todayAttendance && (
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {todayAttendance.status === 'late' ? 'Late Check-in' : 'On-Time Check-in'}
              </span>
            )}
          </div>

          {!todayAttendance ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <span>No punches recorded for today yet. Use the Clock In button above to start your shift.</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Clock In Node */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <LogIn className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900">Clocked In</span>
                    <span className="text-xs font-mono font-semibold text-slate-800 tabular-nums">
                      {formatTime12h(todayAttendance.clockInTime)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                    <span>{todayAttendance.workLocation}</span>
                    {todayAttendance.clockInGeo && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 text-slate-600 font-mono">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          <span>{todayAttendance.clockInGeo.addressName}</span>
                          {todayAttendance.clockInGeo.verifiedOfficeZone && (
                            <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1 py-0.2 rounded border border-emerald-200">
                              HQ Verified
                            </span>
                          )}
                        </span>
                      </>
                    )}
                    {todayAttendance.notes && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{todayAttendance.notes}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Breaks Nodes */}
              {todayAttendance.breaks.map((b, idx) => (
                <div key={b.id || idx} className="flex items-start gap-3 pl-2 border-l-2 border-dashed border-slate-200 ml-3.5 py-1">
                  <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 -ml-3.5">
                    <Coffee className="w-3 h-3" />
                  </div>
                  <div className="flex-1 min-w-0 ml-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-amber-900">
                        {b.note || 'Break'}
                      </span>
                      <span className="text-xs font-mono text-slate-700 tabular-nums">
                        {formatTime12h(b.startTime)}
                        {b.endTime ? ` → ${formatTime12h(b.endTime)}` : ' (In Progress)'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Clock Out Node (or Live In-Progress Indicator) */}
              {todayAttendance.clockOutTime ? (
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <LogOut className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-900">Clocked Out</span>
                      <span className="text-xs font-mono font-semibold text-slate-800 tabular-nums">
                        {formatTime12h(todayAttendance.clockOutTime)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                      <span>Shift finalized · Net time: {formatMinutesToHours(elapsedMinutes)}</span>
                      {todayAttendance.clockOutGeo && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 text-slate-600 font-mono">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            <span>{todayAttendance.clockOutGeo.addressName}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-xs text-indigo-700 bg-indigo-50/70 p-3 rounded-xl border border-indigo-100">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping" />
                  <span>Shift currently active and recording. Remember to clock out before leaving.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Shift Rules & Offer Letter Reminders */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <AlertCircle className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900">
              Shift Policy & Guidelines
            </h3>
          </div>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="font-semibold text-slate-800 block">Standard Hours</span>
              <span>
                Your offer letter stipulates {currentEmployee.offerLetter.standardHoursPerDay} hours per working day (excluding 1h lunch).
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="font-semibold text-slate-800 block">Punctuality Threshold</span>
              <span>
                Arrivals after 09:15 AM are automatically flagged as late check-ins for supervisor attendance review.
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="font-semibold text-slate-800 block">Need a Day Off?</span>
              <p className="text-slate-500">
                You can apply for leave anytime. Your supervisor will review and approve it based on your offer letter balance.
              </p>
              <button
                type="button"
                onClick={onRequestLeave}
                className="mt-1 text-indigo-600 hover:text-indigo-800 font-medium inline-block cursor-pointer"
              >
                Submit Leave Application →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
