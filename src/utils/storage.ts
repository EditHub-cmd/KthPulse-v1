import { AttendanceRecord, Employee, LeaveBalanceSummary, LeaveRequest, LeaveType } from '../types';
import { supabase } from '../lib/supabase';
import { getCurrentTimeString, getTodayDateString } from './dateUtils';

function throwIfError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

export async function loadEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('name');
  throwIfError(error);
  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    title: row.title,
    department: row.department,
    avatar: row.avatar || '',
    joinedDate: row.joined_date,
    locationCountry: row.location_country || undefined,
    timezone: row.timezone || undefined,
    managerId: row.manager_id || undefined,
    offerLetter: row.offer_letter,
    activeWorkStatus: row.active_work_status || undefined,
  } as Employee));
}

export async function loadAttendance(): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase.from('attendance').select('*').order('date', { ascending: false });
  throwIfError(error);
  return (data || []).map((row) => ({
    id: row.id,
    employeeId: row.employee_id,
    date: row.date,
    clockInTime: row.clock_in_time,
    clockOutTime: row.clock_out_time,
    breaks: row.breaks || [],
    workLocation: row.work_location,
    clockInGeo: row.clock_in_geo || undefined,
    clockOutGeo: row.clock_out_geo || undefined,
    status: row.status,
    notes: row.notes || undefined,
  } as AttendanceRecord));
}

export async function loadLeaveRequests(): Promise<LeaveRequest[]> {
  const { data, error } = await supabase.from('leave_requests').select('*, employee:profiles!leave_requests_employee_id_fkey(name, department)').order('applied_at', { ascending: false });
  throwIfError(error);
  return (data || []).map((row) => ({
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee?.name || '',
    employeeDepartment: row.employee?.department || '',
    leaveType: row.leave_type,
    startDate: row.start_date,
    endDate: row.end_date,
    isHalfDay: row.is_half_day,
    halfDayPeriod: row.half_day_period || undefined,
    totalDays: Number(row.total_days),
    reason: row.reason,
    status: row.status,
    appliedAt: row.applied_at,
    reviewedBy: row.reviewed_by || undefined,
    reviewedByName: row.reviewed_by_name || undefined,
    reviewedAt: row.reviewed_at || undefined,
    managerComment: row.manager_comment || undefined,
    supportingDocName: row.supporting_doc_name || undefined,
  } as LeaveRequest));
}

export function computeEmployeeLeaveBalances(employee: Employee, leaveRequests: LeaveRequest[]): LeaveBalanceSummary[] {
  const empRequests = leaveRequests.filter((r) => r.employeeId === employee.id && r.status !== 'cancelled');
  const getUsage = (type: LeaveType) => empRequests.reduce((sum, req) => {
    if (req.leaveType !== type) return sum;
    return { used: sum.used + (req.status === 'approved' ? req.totalDays : 0), pending: sum.pending + (req.status === 'pending' ? req.totalDays : 0) };
  }, { used: 0, pending: 0 });
  const types: Array<[LeaveType, string, number, string]> = [
    ['annual', 'Annual Leave', employee.offerLetter.annualLeaveEntitlement, 'Paid holiday allowance designated in offer letter contract.'],
    ['sick', 'Sick & Medical Leave', employee.offerLetter.sickLeaveEntitlement, 'Allowance for medical indisposition and clinic visits with MC.'],
    ['casual', 'Casual / Personal Leave', employee.offerLetter.casualLeaveEntitlement, 'Short notice personal time off for family and urgent errands.'],
    ['maternity_paternity', 'Parental Leave', employee.offerLetter.maternityPaternityEntitlement, 'Contractual parental leave entitlement.'],
  ];
  return types.map(([leaveType, label, entitled, description]) => {
    const { used, pending } = getUsage(leaveType);
    return { leaveType, label, entitled, used, pending, remaining: Math.max(0, entitled - used - pending), description };
  });
}

export function getTodayAttendanceForEmployee(employeeId: string, records: AttendanceRecord[]): AttendanceRecord | undefined {
  return records.find((record) => record.employeeId === employeeId && record.date === getTodayDateString());
}

export async function clockIn(employeeId: string, location: AttendanceRecord['workLocation'], notes: string, _records: AttendanceRecord[], geo?: AttendanceRecord['clockInGeo']): Promise<AttendanceRecord[]> {
  const time = getCurrentTimeString();
  const { error } = await supabase.from('attendance').insert({
    employee_id: employeeId, date: getTodayDateString(), clock_in_time: time,
    breaks: [], work_location: location, clock_in_geo: geo || null,
    status: time > '10:00:00' ? 'late' : 'present', notes: notes || `Clocked in via StaffPulse (${location})`,
  });
  throwIfError(error);
  return loadAttendance();
}

export async function startBreak(id: string, note: string, records: AttendanceRecord[]): Promise<AttendanceRecord[]> {
  const row = records.find((record) => record.id === id);
  if (!row) throw new Error('Attendance record not found.');
  const breaks = [...row.breaks, { id: crypto.randomUUID(), startTime: getCurrentTimeString(), endTime: null, note: note || 'Rest Break' }];
  const { error } = await supabase.from('attendance').update({ breaks }).eq('id', id);
  throwIfError(error);
  return loadAttendance();
}

export async function endBreak(id: string, records: AttendanceRecord[]): Promise<AttendanceRecord[]> {
  const row = records.find((record) => record.id === id);
  if (!row) throw new Error('Attendance record not found.');
  const time = getCurrentTimeString();
  const breaks = row.breaks.map((item) => item.endTime ? item : { ...item, endTime: time });
  const { error } = await supabase.from('attendance').update({ breaks }).eq('id', id);
  throwIfError(error);
  return loadAttendance();
}

export async function clockOut(id: string, records: AttendanceRecord[], geo?: AttendanceRecord['clockOutGeo']): Promise<AttendanceRecord[]> {
  const row = records.find((record) => record.id === id);
  if (!row) throw new Error('Attendance record not found.');
  const time = getCurrentTimeString();
  const breaks = row.breaks.map((item) => item.endTime ? item : { ...item, endTime: time });
  const { error } = await supabase.from('attendance').update({ clock_out_time: time, clock_out_geo: geo || null, breaks }).eq('id', id);
  throwIfError(error);
  return loadAttendance();
}

export async function submitLeaveRequest(request: Omit<LeaveRequest, 'id' | 'appliedAt' | 'status'>): Promise<LeaveRequest[]> {
  const { error } = await supabase.from('leave_requests').insert({
    employee_id: request.employeeId, leave_type: request.leaveType, start_date: request.startDate,
    end_date: request.endDate, is_half_day: request.isHalfDay, half_day_period: request.halfDayPeriod || null,
    total_days: request.totalDays, reason: request.reason, supporting_doc_name: request.supportingDocName || null,
  });
  throwIfError(error);
  return loadLeaveRequests();
}

export async function reviewLeaveRequest(id: string, decision: 'approved' | 'rejected', managerId: string, managerName: string, comment: string): Promise<LeaveRequest[]> {
  const { error } = await supabase.from('leave_requests').update({
    status: decision, reviewed_by: managerId, reviewed_by_name: managerName,
    reviewed_at: new Date().toISOString(), manager_comment: comment || (decision === 'approved' ? 'Approved by supervisor' : 'Rejected by supervisor'),
  }).eq('id', id);
  throwIfError(error);
  return loadLeaveRequests();
}

export async function cancelLeaveRequest(id: string): Promise<LeaveRequest[]> {
  const { error } = await supabase.from('leave_requests').update({ status: 'cancelled' }).eq('id', id).eq('status', 'pending');
  throwIfError(error);
  return loadLeaveRequests();
}

export async function updateOfferLetterContract(id: string, offerLetter: Employee['offerLetter']): Promise<Employee[]> {
  const { error } = await supabase.from('profiles').update({ offer_letter: offerLetter }).eq('id', id);
  throwIfError(error);
  return loadEmployees();
}
