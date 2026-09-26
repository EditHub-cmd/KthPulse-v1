export type UserRole = 'staff' | 'manager';

export type LeaveType = 'annual' | 'sick' | 'casual' | 'maternity_paternity' | 'unpaid';

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface OfferLetterContract {
  offerDate: string;
  contractType: 'Full-Time' | 'Contract' | 'Part-Time';
  annualLeaveEntitlement: number;
  sickLeaveEntitlement: number;
  casualLeaveEntitlement: number;
  maternityPaternityEntitlement: number;
  probationMonths: number;
  standardHoursPerDay: number;
  contractClauseSummary?: string;
}

export interface ActiveWorkStatus {
  currentApp: string; // e.g. "Google Sheets - Monthly Sales Ledger", "Gmail / Email Client", "Code Editor"
  lastActiveAt: string;
  isIdle: boolean;
  activeTask: string;
  tabFocusState: 'active' | 'background_idle';
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  title: string;
  department: string;
  avatar: string;
  joinedDate: string;
  locationCountry?: string; // e.g. "India (Remote - Bangalore)", "Singapore (HQ)"
  timezone?: string; // e.g. "Asia/Kolkata (IST)", "Asia/Singapore (SGT)"
  managerId?: string;
  offerLetter: OfferLetterContract;
  activeWorkStatus?: ActiveWorkStatus;
}

export interface GeoLocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  addressName?: string;
  verifiedOfficeZone?: boolean;
}

export interface BreakRecord {
  id: string;
  startTime: string; // HH:mm:ss
  endTime?: string | null; // HH:mm:ss
  note?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  clockInTime: string; // HH:mm:ss
  clockOutTime?: string | null; // HH:mm:ss
  breaks: BreakRecord[];
  workLocation: 'Office HQ' | 'Remote / WFH' | 'Client Site';
  clockInGeo?: GeoLocationData;
  clockOutGeo?: GeoLocationData;
  status: 'present' | 'late' | 'half-day' | 'on-leave' | 'absent';
  notes?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeDepartment: string;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isHalfDay: boolean;
  halfDayPeriod?: 'morning' | 'afternoon';
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  appliedAt: string; // ISO string
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  managerComment?: string;
  supportingDocName?: string;
}

export interface LeaveBalanceSummary {
  leaveType: LeaveType;
  label: string;
  entitled: number;
  used: number;
  pending: number;
  remaining: number;
  description: string;
}
