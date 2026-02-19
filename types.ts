
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
  icon: string;
  logo_url?: string;
  user_id?: string;
}

export interface PlanEvent {
  id: string;
  title: string;
  date: string;
  location?: string;
  type: string;
  company_id: string;
  status: EventStatus;
  value: number;
  invoice_status?: InvoiceStatus;
  invoice_number?: string;
  user_id?: string;
}

export type ViewState = 'LANDING' | 'AUTH' | 'DASHBOARD' | 'EVENTS' | 'COMPANIES' | 'NEW_EVENT' | 'EDIT_EVENT' | 'NEW_COMPANY' | 'SETTINGS' | 'SUBSCRIPTION' | 'CHECKOUT';

export interface User {
  email: string;
  name: string;
  photo?: string;
  trial_start_date?: string;
  subscription_status?: 'trial' | 'active' | 'expired';
  plan_type?: 'none' | 'monthly' | 'yearly';
  bio?: string;
  company_name?: string;
  cnpj?: string;
}
