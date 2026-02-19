
import { Company, PlanEvent, EventStatus, InvoiceStatus } from './types';

export const MOCK_COMPANIES: Company[] = [
  {
    id: 'c1',
    name: 'Agência X Design',
    cnpj: '12.345.678/0001-90',
    address: 'Av. Paulista, 1000 - Bela Vista, SP',
    contact: 'Ricardo Oliveira',
    icon: 'corporate_fare'
  },
  {
    id: 'c2',
    name: 'Studio Y Produções',
    cnpj: '98.765.432/0001-11',
    address: 'Rua Augusta, 450 - Consolação, SP',
    contact: 'Fernanda Costa',
    icon: 'camera'
  },
  {
    id: 'c3',
    name: 'Artes & Eventos S.A',
    cnpj: '45.678.123/0001-55',
    address: 'Al. Rio Negro, 500 - Alphaville, Barueri',
    contact: 'Marcos Viana',
    icon: 'theater_comedy'
  }
];

export const MOCK_EVENTS: PlanEvent[] = [
  {
    id: 'EV-9021',
    title: 'Workshop de Fotografia',
    date: '2023-10-24',
    location: 'Creative Studio Co.',
    // Fix: replaced EventType.WORKSHOP with 'Workshop' string
    type: 'Workshop',
    // Fix: replaced companyId with company_id to match PlanEvent interface
    company_id: 'c2',
    status: EventStatus.PAID,
    value: 1200,
    // Fix: replaced invoiceStatus with invoice_status to match PlanEvent interface
    invoice_status: InvoiceStatus.ISSUED,
    // Fix: replaced invoiceNumber with invoice_number to match PlanEvent interface
    invoice_number: 'NF-1029'
  },
  {
    id: 'EV-8845',
    title: 'Casamento Lucas & Ana',
    date: '2023-10-24',
    location: 'Espaço das Palmeiras',
    // Fix: replaced EventType.WEDDING with 'Casamento' string
    type: 'Casamento',
    // Fix: replaced companyId with company_id to match PlanEvent interface
    company_id: 'c3',
    status: EventStatus.PENDING,
    value: 5400,
    // Fix: replaced invoiceStatus with invoice_status to match PlanEvent interface
    invoice_status: InvoiceStatus.PENDING
  },
  {
    id: 'EV-7721',
    title: 'Workshop Criativo',
    date: '2023-10-28',
    location: 'Auditório Principal',
    // Fix: removed invalid property timeRange
    // Fix: replaced EventType.WORKSHOP with 'Workshop' string
    type: 'Workshop',
    // Fix: replaced companyId with company_id to match PlanEvent interface
    company_id: 'c1',
    status: EventStatus.LATE,
    value: 800,
    // Fix: replaced invoiceStatus with invoice_status to match PlanEvent interface
    invoice_status: InvoiceStatus.PENDING
  }
];