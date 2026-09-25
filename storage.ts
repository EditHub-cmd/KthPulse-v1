import { Employee, AttendanceRecord, LeaveRequest, LeaveBalanceSummary, LeaveType } from '../types';
import { INITIAL_EMPLOYEES, INITIAL_ATTENDANCE, INITIAL_LEAVE_REQUESTS } from '../data/mockData';
import { getCurrentTimeString, getTodayDateString } from './dateUtils';

const STORAGE_KEYS = {
  EMPLOYEES: 'staffpulse_employees_v1',
  ATTENDANCE: 'staffpulse_attendance_v1',
  LEAVE_REQUESTS: 'staffpulse_leave_requests_v1',
  CURRENT_USER_ID: 'staffpulse_current_user_v1',
};

export function loadEmployees(): Employee[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    if (!raw) {
      saveEmployees(INITIAL_EMPLOYEES);
      return INITIAL_EMPLOYEES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load employees from localStorage', e);
    return INITIAL_EMPLOYEES;
  }
}

export function saveEmployees(employees: Employee[]): void {
  localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
}

export function loadAttendance(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    if (!raw) {
      saveAttendance(INITIAL_ATTENDANCE);
      return INITIAL_ATTENDANCE;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load attendance from localStorage', e);
    return INITIAL_ATTENDANCE;
  }
}

export function saveAttendance(records: AttendanceRecord[]): void {
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
}

export function loadLeaveRequests(): LeaveRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LEAVE_REQUESTS);
    if (!raw) {
      saveLeaveRequests(INITIAL_LEAVE_REQUESTS);
      return INITIAL_LEAVE_REQUESTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load leave requests from localStorage', e);
    return INITIAL_LEAVE_REQUESTS;
  }
}

export function saveLeaveRequests(requests: LeaveRequest[]): void {
  localStorage.setItem(STORAGE_KEYS.LEAVE_REQUESTS, JSON.stringify(requests));
}

export function getActiveUserId(): string {
  return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || 'emp_1';
}

export function setActiveUserId(id: string): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, id);
}

// Calculate dynamic leave balances for an employee based on their offer letter terms
export function computeEmployeeLeaveBalances(
  employee: Employee,
  leaveRequests: LeaveRequest[]
): LeaveBalanceSummary[] {
  const empRequests = leaveRequests.filter((r) => r.employeeId === employee.id && r.status !== 'cancelled');

  const getUsage = (type: LeaveType) => {
    let used = 0;
    let pending = 0;

    for (const req of empRequests) {
      if (req.leaveType === type) {
        if (req.status === 'approved') {
          used += req.totalDays;
        } else if (req.status === 'pending') {
          pending += req.totalDays;
        }
      }
    }
    return { used, pending };
  };

  const annualUsage = getUsage('annual');
  const sickUsage = getUsage('sick');
  const casualUsage = getUsage('casual');
  const matPatUsage = getUsage('maternity_paternity');

  return [
    {
      leaveType: 'annual',
      label: 'Annual Leave',
      entitled: employee.offerLetter.annualLeaveEntitlement,
      used: annualUsage.used,
      pending: annualUsage.pending,
      remaining: Math.max(0, employee.offerLetter.annualLeaveEntitlement - annualUsage.used - annualUsage.pending),
      description: 'Paid holiday allowance designated in offer letter contract.',
    },
    {
      leaveType: 'sick',
      label: 'Sick & Medical Leave',
      entitled: employee.offerLetter.sickLeaveEntitlement,
      used: sickUsage.used,
      pending: sickUsage.pending,
      remaining: Math.max(0, employee.offerLetter.sickLeaveEntitlement - sickUsage.used - sickUsage.pending),
      description: 'Allowance for medical indisposition and clinic visits with MC.',
    },
    {
      leaveType: 'casual',
      label: 'Casual / Personal Leave',
      entitled: employee.offerLetter.casualLeaveEntitlement,
      used: casualUsage.used,
      pending: casualUsage.pending,
      remaining: Math.max(0, employee.offerLetter.casualLeaveEntitlement - casualUsage.used - casualUsage.pending),
      description: 'Short notice personal time off for family and urgent errands.',
    },
    {
      leaveType: 'maternity_paternity',
      label: 'Parental Leave',
      entitled: employee.offerLetter.maternityPaternityEntitlement,
      used: matPatUsage.used,
      pending: matPatUsage.pending,
      remaining: Math.max(0, employee.offerLetter.maternityPaternityEntitlement - matPatUsage.used - matPatUsage.pending),
      description: 'Contractual parental leave entitlement.',
    },
  ];
}

// Attendance operations
export function getTodayAttendanceForEmployee(
  employeeId: string,
  attendanceList: AttendanceRecord[]
): AttendanceRecord | undefined {
  const today = getTodayDateString();
  return attendanceList.find((a) => a.employeeId === employeeId && a.date === today);
}

export function clockIn(
  employeeId: string,
  location: 'Office HQ' | 'Remote / WFH' | 'Client Site',
  notes: string,
  attendanceList: AttendanceRecord[],
  geo?: import('../types').GeoLocationData
): AttendanceRecord[] {
  const today = getTodayDateString();
  const time = getCurrentTimeString();

  // Working hour is 10:00 AM sharp. If clock in > 10:00:00 (e.g. 10:01:00), flagged as late in RED!
  const isLate = time > '10:00:00';

  const newRecord: AttendanceRecord = {
    id: `att_${Date.now()}`,
    employeeId,
    date: today,
    clockInTime: time,
    clockOutTime: null,
    breaks: [],
    workLocation: location,
    clockInGeo: geo,
    status: isLate ? 'late' : 'present',
    notes: notes || `Clocked in via StaffPulse (${location})`,
  };

  const updated = [newRecord, ...attendanceList];
  saveAttendance(updated);
  return updated;
}

export function startBreak(
  attendanceId: string,
  breakNote: string,
  attendanceList: AttendanceRecord[]
): AttendanceRecord[] {
  const time = getCurrentTimeString();
  const updated = attendanceList.map((rec) => {
    if (rec.id === attendanceId) {
      return {
        ...rec,
        breaks: [
          ...rec.breaks,
          {
            id: `brk_${Date.now()}`,
            startTime: time,
            endTime: null,
            note: breakNote || 'Rest Break',
          },
        ],
      };
    }
    return rec;
  });
  saveAttendance(updated);
  return updated;
}

export function endBreak(
  attendanceId: string,
  attendanceList: AttendanceRecord[]
): AttendanceRecord[] {
  const time = getCurrentTimeString();
  const updated = attendanceList.map((rec) => {
    if (rec.id === attendanceId) {
      const updatedBreaks = rec.breaks.map((b) => {
        if (!b.endTime) {
          return { ...b, endTime: time };
        }
        return b;
      });
      return { ...rec, breaks: updatedBreaks };
    }
    return rec;
  });
  saveAttendance(updated);
  return updated;
}

export function clockOut(
  attendanceId: string,
  attendanceList: AttendanceRecord[],
  geo?: import('../types').GeoLocationData
): AttendanceRecord[] {
  const time = getCurrentTimeString();
  const updated = attendanceList.map((rec) => {
    if (rec.id === attendanceId) {
      // Also close any open break
      const updatedBreaks = rec.breaks.map((b) => {
        if (!b.endTime) {
          return { ...b, endTime: time };
        }
        return b;
      });
      return {
        ...rec,
        clockOutTime: time,
        clockOutGeo: geo,
        breaks: updatedBreaks,
      };
    }
    return rec;
  });
  saveAttendance(updated);
  return updated;
}

export function submitLeaveRequest(
  request: Omit<LeaveRequest, 'id' | 'appliedAt' | 'status'>,
  requestsList: LeaveRequest[]
): LeaveRequest[] {
  const newReq: LeaveRequest = {
    ...request,
    id: `req_${Date.now()}`,
    status: 'pending',
    appliedAt: new Date().toISOString(),
  };

  const updated = [newReq, ...requestsList];
  saveLeaveRequests(updated);
  return updated;
}

export function reviewLeaveRequest(
  requestId: string,
  decision: 'approved' | 'rejected',
  managerId: string,
  managerName: string,
  managerComment: string,
  requestsList: LeaveRequest[]
): LeaveRequest[] {
  const updated = requestsList.map((req) => {
    if (req.id === requestId) {
      return {
        ...req,
        status: decision,
        reviewedBy: managerId,
        reviewedByName: managerName,
        reviewedAt: new Date().toISOString(),
        managerComment: managerComment || (decision === 'approved' ? 'Approved by supervisor' : 'Rejected by supervisor'),
      };
    }
    return req;
  });
  saveLeaveRequests(updated);
  return updated;
}

export function cancelLeaveRequest(
  requestId: string,
  requestsList: LeaveRequest[]
): LeaveRequest[] {
  const updated = requestsList.map((req) => {
    if (req.id === requestId) {
      return { ...req, status: 'cancelled' as const };
    }
    return req;
  });
  saveLeaveRequests(updated);
  return updated;
}

export function updateOfferLetterContract(
  employeeId: string,
  newOfferLetter: Employee['offerLetter'],
  employeeList: Employee[]
): Employee[] {
  const updated = employeeList.map((emp) => {
    if (emp.id === employeeId) {
      return { ...emp, offerLetter: newOfferLetter };
    }
    return emp;
  });
  saveEmployees(updated);
  return updated;
}

export function resetDemoData(): void {
  localStorage.removeItem(STORAGE_KEYS.EMPLOYEES);
  localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
  localStorage.removeItem(STORAGE_KEYS.LEAVE_REQUESTS);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
}
