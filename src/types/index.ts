export type UserRole = "staff" | "technician" | "admin";
export type TicketStatus = "Pending" | "In_Progress" | "Claim" | "Resolved";
export type AttachmentType = "before" | "after";

export interface Branch {
  branch_id: number;
  branch_name: string;
  zone: string | null;
}

export interface Category {
  category_id: number;
  category_name: string;
}

export interface User {
  user_id: string;
  name: string;
  email?: string | null;
  role: UserRole;
  branch_id: number | null;
  branch?: Branch | null;
}

export interface Ticket {
  ticket_id: number;
  branch_id: number;
  branch?: Branch;
  category_id: number;
  category?: Category;
  reporter_id: string;
  reporter?: User;
  report_date: string;
  issue_description: string;
  status: TicketStatus;
  technician_id: string | null;
  technician?: User | null;
  technician_note: string | null;
  resolved_date: string | null;
  attachments?: TicketAttachment[];
  logs?: TicketLog[];
}

export interface TicketAttachment {
  attachment_id: number;
  ticket_id: number;
  file_path: string;
  type: AttachmentType;
  uploaded_by: string;
  uploaded_at: string;
}

export interface TicketLog {
  log_id: number;
  ticket_id: number;
  old_status: TicketStatus | null;
  new_status: TicketStatus;
  note?: string | null;
  changed_by: string;
  changed_at: string;
}

export interface DashboardKpi {
  pending: number;
  inProgress: number;
  resolved: number;
  resolvedToday: number;
}
