// ============================================
// SHIVINFRA INQUIRY API SERVICE
// ============================================

import { apiClient } from './axiosClient';

export interface InquiryItem {
  id: string;
  name: string;
  phone: string;
  project: string;
  location: string;
  budget: number;
  requirement: string;
  created_at: string;
  status: string;
  replied: boolean;
  interest_level: string;
  notes: string;
  company_id?: string;
}

export async function fetchInquiries(): Promise<InquiryItem[]> {
  const response = await apiClient.get('/v1/inquiries');
  return response.data.data || [];
}

export async function createInquiry(inquiry: Partial<InquiryItem>): Promise<InquiryItem> {
  const response = await apiClient.post('/v1/inquiries', inquiry);
  return response.data.data;
}

export async function updateInquiry(id: string, inquiry: Partial<InquiryItem>): Promise<InquiryItem> {
  const response = await apiClient.put(`/v1/inquiries/${id}`, inquiry);
  return response.data.data;
}

export async function deleteInquiry(id: string): Promise<void> {
  await apiClient.delete(`/v1/inquiries/${id}`);
}
