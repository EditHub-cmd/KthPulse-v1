import React, { useState, useEffect } from 'react';
import { 
  Employee, 
  AttendanceRecord, 
  LeaveRequest, 
  GeoLocationData, 
  UserRole 
} from './types';
import { 
  loadEmployees, 
  saveEmployees, 
  loadAttendance, 
  saveAttendance, 
  loadLeaveRequests, 
  saveLeaveRequests, 
  getActiveUserId, 
  setActiveUserId, 
  clockIn, 
  clockOut, 
  startBreak, 
  endBreak, 
  submitLeaveRequest, 
  reviewLeaveRequest, 
  cancelLeaveRequest, 
  updateOfferLetterContract, 
  resetDemoData, 
  getTodayAttendanceForEmployee 
} from './utils/storage';
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
import { AddEmployeeModal } from './components/AddEmployeeModal';

export default function App() {
  const [employees, setEmployees] = useState<Employee[]>(() => loadEmployees());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => loadAttendance());
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => loadLeaveRequests());
  const [currentUserId, setCurrentUserId] = useState<string>(() => getActiveUserId());
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  // Selected staff member for dedicated Calendar View (e.g. John Doe)
  const [selectedStaffForCalendar, setSelectedStaffForCalendar] = useState<Employee | null>(null);

  // View state
  const [activeView, setActiveView] = useState<
    'manager_dashboard' | 'staff_calendar' | 'leave_management' | 'staff_clock' | 'staff_leave' | 'attendance_audit'
  >('manager_dashboard');

  // Modals
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);

  // Active current user
  const currentEmployee = employees.find((e) => e.id === currentUserId) || employees[0];
  const isManager = currentEmployee?.role === 'manager';

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

  // Switch active user
  const handleSwitchUser = (employeeId: string) => {
    setCurrentUserId(employeeId);
    setActiveUserId(employeeId);
    const user = employees.find((e) => e.id === employeeId);
    if (user?.role === 'manager') {
      setActiveView('manager_dashboard');
    } else {
      setActiveView('staff_clock');
    }
  };

  // Login handler
  const handleLoginSuccess = (emp: Employee) => {
    setCurrentUserId(emp.id);
    setActiveUserId(emp.id);
    setIsAuthenticated(true);
    if (emp.role === 'manager') {
      setActiveView('manager_dashboard');
    } else {
      setActiveView('staff_clock');
    }
  };

  // Logout handler
  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  // Clock In handler with GPS and 10:00 AM late evaluation
  const handleClockIn = (
    location: 'Office HQ' | 'Remote / WFH' | 'Client Site',
    note: string,
    geo?: GeoLocationData
  ) => {
    const updated = clockIn(currentEmployee.id, location, note, attendance, geo);
    setAttendance(updated);
  };

  // Break handlers
  const handleStartBreak = (attendanceId: string, note: string) => {
    const updated = startBreak(attendanceId, note, attendance);
    setAttendance(updated);
  };

  const handleEndBreak = (attendanceId: string) => {
    const updated = endBreak(attendanceId, attendance);
    setAttendance(updated);
  };

  // Clock Out handler with GPS
  const handleClockOut = (attendanceId: string, geo?: GeoLocationData) => {
    const updated = clockOut(attendanceId, attendance, geo);
    setAttendance(updated);
  };

  // Submit Leave Request
  const handleSubmitLeave = (request: Omit<LeaveRequest, 'id' | 'appliedAt' | 'status'>) => {
    const updated = submitLeaveRequest(request, leaveRequests);
    setLeaveRequests(updated);
  };

  // Review Leave Request (Approve or Reject with reason)
  const handleReviewLeave = (
    requestId: string,
    decision: 'approved' | 'rejected',
    comment: string
  ) => {
    const updated = reviewLeaveRequest(
      requestId,
      decision,
      currentEmployee.id,
      currentEmployee.name,
      comment,
      leaveRequests
    );
    setLeaveRequests(updated);
  };

  // Cancel Leave Request
  const handleCancelLeave = (requestId: string) => {
    const updated = cancelLeaveRequest(requestId, leaveRequests);
    setLeaveRequests(updated);
  };

  // Add new employee
  const handleAddEmployee = (newEmp: Employee) => {
    const updated = [...employees, newEmp];
    setEmployees(updated);
    saveEmployees(updated);
  };

  // Reset to initial demo data
  const handleResetData = () => {
    resetDemoData();
    const freshEmps = loadEmployees();
    setEmployees(freshEmps);
    setAttendance(loadAttendance());
    setLeaveRequests(loadLeaveRequests());
    setCurrentUserId(freshEmps[0].id);
    setIsAuthenticated(true);
    setActiveView('manager_dashboard');
    setSelectedStaffForCalendar(null);
  };

  // Today's attendance for current employee
  const todayAttendance = getTodayAttendanceForEmployee(currentEmployee.id, attendance);
  const pendingRequestsCount = leaveRequests.filter((r) => r.status === 'pending').length;

  const staffLeaveRequests = leaveRequests.filter((r) => r.employeeId === currentEmployee.id);
  const staffAttendance = attendance.filter((a) => a.employeeId === currentEmployee.id);
  const staffMembers = employees.filter((e) => e.role === 'staff');

  // If user is logged out, show LoginView
  if (!isAuthenticated) {
    return (
      <LoginView
        allEmployees={employees}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header Navigation */}
      <Header
        currentEmployee={currentEmployee}
        allEmployees={employees}
        pendingRequestsCount={pendingRequestsCount}
        activeView={activeView}
        setActiveView={setActiveView}
        onSwitchUser={handleSwitchUser}
        onResetData={handleResetData}
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

        {/* 2) Dedicated Staff Monthly Calendar (When clicking John Doe or other staff) */}
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

      <AddEmployeeModal
        isOpen={isAddEmployeeModalOpen}
        onClose={() => setIsAddEmployeeModalOpen(false)}
        onAddEmployee={handleAddEmployee}
      />
    </div>
  );
}
