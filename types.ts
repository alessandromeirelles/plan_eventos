
export enum EventStatus {
  PENDING = 'PENDENTE',
  PAID = 'PAGO',
  LATE = 'ATRASADO',
  CANCELED = 'CANCELADO'
}

export enum InvoiceStatus {
  ISSUED = 'SIM',
  PENDING = 'PENDENTE',
  CANCELED = 'CANCELADA'
}

export interface Company {
  id: string;
  name: string;
  cnpj: string;
  address: string;
  contact: string;
  responsible?: string;
  icon: string;
  logo_url?: string;
  user_id?: string;
  color?: string;
}

export interface Expense {
  id: string;
  type: string;
  value: number;
}

export interface PlanEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  type: string;
  company_id: string;
  status: EventStatus;
  value: number;
  expenses?: Expense[];
  invoice_status?: InvoiceStatus;
  invoice_number?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  paid_at?: string;
  invoice_issued_at?: string;
  google_calendar_event_id?: string;
}

export type ViewState = 'LANDING' | 'AUTH' | 'DASHBOARD' | 'EVENTS' | 'COMPANIES' | 'NEW_EVENT' | 'EDIT_EVENT' | 'NEW_COMPANY' | 'EDIT_COMPANY' | 'SETTINGS' | 'SUBSCRIPTION' | 'CHECKOUT' | 'ADMIN_DASHBOARD' | 'REPORTS';

export interface User {
  uid?: string;
  email: string;
  name: string;
  photo?: string;
  trial_start_date?: string;
  subscription_status?: 'trial' | 'active' | 'expired';
  subscription_expiry_date?: string;
  plan_type?: 'none' | 'monthly' | 'yearly';
  bio?: string;
  company_name?: string;
  cnpj?: string;
  status?: 'active' | 'suspended' | 'deleted';
  event_types?: string[];
  google_calendar_connected?: boolean;
  role?: 'admin' | 'user';
  last_activity?: string;
  emails_sent?: string[]; // List of keys like '3d', '7d', etc.
}
