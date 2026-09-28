import React, { useState, useEffect, useCallback } from 'react';
import { 
  Employee, 
  AttendanceRecord, 
  LeaveRequest, 
  GeoLocationData
} from './types';
import { 
  loadEmployees, 
  loadAttendance, 
  loadLeaveRequests, 
  clockIn, 
  clockOut, 
  startBreak, 
  endBreak, 
  submitLeaveRequest, 
  reviewLeaveRequest, 
  cancelLeaveRequest, 
  getTodayAttendanceForEmployee 
} from './utils/storage';
import { supabase } from './lib/supabase';
import { Header } from './components/Header';
import { LoginView } from './components/LoginView';
import { ManagerMainDashboard } from './components/ManagerMainDashboard';
import { StaffMonthlyCalendarView } from './components/StaffMonthlyCalendarView';
import { StaffCalendarPicker } from './components/StaffCalendarPicker';
import { StaffClockConsole } from './components/StaffClockConsole';
import { OfferLetterTracker } from './components/OfferLetterTracker';
import { StaffLeaveHistory } from './components/StaffLeaveHistory';
import { StaffAttendanceHistory } from './components/StaffAttendanceHistory';
import { ManagerLeaveDashboard } from './components/ManagerLeaveDashboard';
import { ManagerAttendanceHistory } from './components/ManagerAttendanceHistory';
import { LeaveRequestModal } from './components/LeaveRequestModal';

export default function App() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [appError, setAppError] = useState('');

  // Staff member selected by the manager for calendar review.
  const [selectedStaffForCalendar, setSelectedStaffForCalendar] = useState<Employee | null>(null);

  // View state
  const [activeView, setActiveView] = useState<
    'manager_dashboard' | 'staff_calendar' | 'leave_management' | 'staff_clock' | 'staff_leave' | 'attendance_audit'
  >('manager_dashboard');

  // Modals
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  // Active current user
  const currentEmployee = employees.find((e) => e.id === currentUserId);
  const isManager = currentEmployee?.role === 'manager';

  const loadUserData = useCallback(async (userId: string) => {
    setIsLoading(true);
    setAppError('');
    try {
      const [nextEmployees, nextAttendance, nextLeaveRequests] = await Promise.all([
        loadEmployees(), loadAttendance(), loadLeaveRequests(),
      ]);
      if (!nextEmployees.some((employee) => employee.id === userId)) {
        throw new Error('Your login is valid, but your staff profile is missing. Ask the manager to check Supabase setup.');
      }
      setEmployees(nextEmployees);
      setAttendance(nextAttendance);
      setLeaveRequests(nextLeaveRequests);
      setCurrentUserId(userId);
      setIsAuthenticated(true);
      const signedInEmployee = nextEmployees.find((employee) => employee.id === userId);
      setActiveView(signedInEmployee?.role === 'manager' ? 'manager_dashboard' : 'staff_clock');
    } catch (error) {
      setAppError(error instanceof Error ? error.message : 'Could not load your staff data.');
      setIsAuthenticated(false);
      setCurrentUserId(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT' || !session) {
        setIsAuthenticated(false);
        setCurrentUserId(null);
        setEmployees([]);
        setAttendance([]);
        setLeaveRequests([]);
        setIsLoading(false);
      } else if (event === 'SIGNED_IN') {
        window.setTimeout(() => { if (mounted) void loadUserData(session.user.id); }, 0);
      }
    });
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        setAppError(error.message);
        setIsLoading(false);
      } else if (data.session) {
        void loadUserData(data.session.user.id);
      } else {
        setIsLoading(false);
      }
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, [loadUserData]);

  // Synchronize view when switching between staff and manager
  useEffect(() => {
    if (isManager) {
      if (activeView === 'staff_clock' || activeView === 'staff_leave') {
        setActiveView('manager_dashboard');
      }
    } else {
      if (activeView === 'manager_dashboard' || activeView === 'leave_management' || activeView === 'attendance_audit') {
        setActiveView('staff_clock');
      }
    }
  }, [currentUserId, isManager]);

  // If a staff is clicked to view their calendar, initialize selection
  const handleSelectStaffForCalendar = (emp: Employee) => {
    setSelectedStaffForCalendar(emp);
    setActiveView('staff_calendar');
  };

  const handleLoginSuccess = () => {
    setIsLoading(true);
    setAppError('');
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) setAppError(error.message);
  };

  // Clock In handler with GPS and 10:00 AM late evaluation
  const handleClockIn = (
    location: 'Office HQ' | 'Remote / WFH' | 'Client Site',
    note: string,
    geo?: GeoLocationData
  ) => {
    void clockIn(currentEmployee!.id, location, note, attendance, geo).then(setAttendance).catch((error) => setAppError(error.message));
  };

  // Break handlers
  const handleStartBreak = (attendanceId: string, note: string) => {
    void startBreak(attendanceId, note, attendance).then(setAttendance).catch((error) => setAppError(error.message));
  };

  const handleEndBreak = (attendanceId: string) => {
    void endBreak(attendanceId, attendance).then(setAttendance).catch((error) => setAppError(error.message));
  };

  // Clock Out handler with GPS
  const handleClockOut = (attendanceId: string, geo?: GeoLocationData) => {
    void clockOut(attendanceId, attendance, geo).then(setAttendance).catch((error) => setAppError(error.message));
  };

  // Submit Leave Request
  const handleSubmitLeave = (request: Omit<LeaveRequest, 'id' | 'appliedAt' | 'status'>) => {
    void submitLeaveRequest(request).then(setLeaveRequests).catch((error) => setAppError(error.message));
  };

  // Review Leave Request (Approve or Reject with reason)
  const handleReviewLeave = (
    requestId: string,
    decision: 'approved' | 'rejected',
    comment: string
  ) => {
    void reviewLeaveRequest(
      requestId,
      decision,
      currentEmployee!.id,
      currentEmployee!.name,
      comment
    ).then(setLeaveRequests).catch((error) => setAppError(error.message));
  };

  // Cancel Leave Request
  const handleCancelLeave = (requestId: string) => {
    void cancelLeaveRequest(requestId).then(setLeaveRequests).catch((error) => setAppError(error.message));
  };

  if (isLoading) {
    return <div className="min-h-screen grid place-items-center bg-slate-50 text-sm text-slate-600">Loading your secure staff portal…</div>;
  }

  if (!isAuthenticated) {
    return <><LoginView onLoginSuccess={handleLoginSuccess} />{appError && <div role="alert" className="fixed bottom-4 left-4 right-4 mx-auto max-w-xl rounded-lg bg-rose-100 p-3 text-sm text-rose-800">{appError}</div>}</>;
  }

  if (!currentEmployee) {
    return <div className="min-h-screen grid place-items-center bg-slate-50 p-6"><div className="max-w-lg rounded-xl bg-white p-6 shadow"><h1 className="font-semibold text-slate-900">Could not load your staff profile</h1><p className="mt-2 text-sm text-slate-600">{appError || 'The signed-in account has no profile in Supabase yet.'} Check that the setup SQL has been run.</p><button onClick={handleLogout} className="mt-4 rounded bg-indigo-600 px-4 py-2 text-sm text-white">Log out</button></div></div>;
  }

  // Only render staff records after Supabase has authenticated the user and loaded their profile.
  const todayAttendance = getTodayAttendanceForEmployee(currentEmployee.id, attendance);
  const pendingRequestsCount = leaveRequests.filter((r) => r.status === 'pending').length;
  const staffLeaveRequests = leaveRequests.filter((r) => r.employeeId === currentEmployee.id);
  const staffAttendance = attendance.filter((a) => a.employeeId === currentEmployee.id);
  const staffMembers = employees.filter((e) => e.role === 'staff');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {appError && <div role="alert" className="bg-rose-50 border-b border-rose-200 px-4 py-2 text-sm text-rose-800">{appError}<button className="ml-3 underline" onClick={() => setAppError('')}>Dismiss</button></div>}
      {/* Top Header Navigation */}
      <Header
        currentEmployee={currentEmployee}
        pendingRequestsCount={pendingRequestsCount}
        activeView={activeView}
        setActiveView={setActiveView}
        onRequestLeaveOpen={() => setIsLeaveModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ============================================================== */}
        {/* MANAGER VIEWS */}
        {/* ============================================================== */}

        {/* 1) Manager Main Dashboard (Default page upon logging in) */}
        {isManager && activeView === 'manager_dashboard' && (
          <ManagerMainDashboard
            currentManager={currentEmployee}
            allEmployees={employees}
            attendanceRecords={attendance}
            leaveRequests={leaveRequests}
            onSelectStaff={handleSelectStaffForCalendar}
            onNavigateToLeaves={() => setActiveView('leave_management')}
          />
        )}

        {/* 2) Dedicated Staff Monthly Calendar */}
        {isManager && activeView === 'staff_calendar' && (
          selectedStaffForCalendar ? (
            <StaffMonthlyCalendarView
              employee={selectedStaffForCalendar}
              allAttendance={attendance}
              allLeaveRequests={leaveRequests}
              onBack={() => {
                setSelectedStaffForCalendar(null);
                setActiveView('manager_dashboard');
              }}
              onRequestLeaveForStaff={() => setIsLeaveModalOpen(true)}
            />
          ) : (
            <StaffCalendarPicker
              staffMembers={staffMembers}
              attendanceRecords={attendance}
              onSelectStaff={(emp) => setSelectedStaffForCalendar(emp)}
            />
          )
        )}

        {/* 3) Leave Approval & Reject Page (Approve/Reject with valid reason, reflected on calendar) */}
        {isManager && activeView === 'leave_management' && (
          <ManagerLeaveDashboard
            currentManager={currentEmployee}
            allEmployees={employees}
            leaveRequests={leaveRequests}
            onReviewRequest={handleReviewLeave}
          />
        )}

        {/* 4) GPS Attendance History Ledger */}
        {isManager && activeView === 'attendance_audit' && (
          <ManagerAttendanceHistory
            attendanceRecords={attendance}
            allEmployees={employees}
          />
        )}

        {/* ============================================================== */}
        {/* STAFF VIEWS */}
        {/* ============================================================== */}

        {/* Staff Clock In / Out Console */}
        {!isManager && activeView === 'staff_clock' && (
          <div className="space-y-6">
            <StaffClockConsole
              currentEmployee={currentEmployee}
              todayAttendance={todayAttendance}
              onClockIn={handleClockIn}
              onStartBreak={handleStartBreak}
              onEndBreak={handleEndBreak}
              onClockOut={handleClockOut}
              onRequestLeave={() => setIsLeaveModalOpen(true)}
            />

            <StaffAttendanceHistory records={staffAttendance} />
          </div>
        )}

        {/* Staff Offer Letter & Leaves Hub */}
        {!isManager && activeView === 'staff_leave' && (
          <div className="space-y-6">
            <OfferLetterTracker
              currentEmployee={currentEmployee}
              allLeaveRequests={leaveRequests}
              onRequestLeave={() => setIsLeaveModalOpen(true)}
            />

            <StaffLeaveHistory
              requests={staffLeaveRequests}
              onCancelRequest={handleCancelLeave}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
          StaffPulse Management Portal · 10:00 AM Strict Shift Start · Offer Letter Quota Tracking & Leave Approvals
        </div>
      </footer>

      {/* Modals */}
      <LeaveRequestModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        currentEmployee={selectedStaffForCalendar || currentEmployee}
        allLeaveRequests={leaveRequests}
        onSubmit={handleSubmitLeave}
      />

    </div>
  );
}
