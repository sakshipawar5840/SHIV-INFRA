// ============================================
// SHIVINFRA ACTIVITY LOG API SERVICE
// ============================================

import { apiClient } from './axiosClient';

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  type: 'Access' | 'Create' | 'Update' | 'Delete';
  description: string;
  user: string;
  company_id?: string;
  user_id?: string;
  user_email?: string;
  action_type?: string;
  details?: string;
  ip_address?: string;
}

export async function fetchActivityLogs(): Promise<ActivityLogEntry[]> {
  const response = await apiClient.get('/v1/activity-logs');
  return response.data.data || [];
}

export async function createActivityLog(
  type: 'Access' | 'Create' | 'Update' | 'Delete',
  description: string,
  user: string
): Promise<void> {
  await apiClient.post('/v1/activity-logs', {
    action_type: type,
    details: description,
    user_email: user,
  });
}
