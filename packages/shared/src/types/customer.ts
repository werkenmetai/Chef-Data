/**
 * Customer and Connection Types
 */

/**
 * Customer (our user, not Exact relation)
 */
export interface Customer {
  id: string;
  email: string;
  name: string | null;
  company_name: string | null;
  plan: CustomerPlan;
  status: CustomerStatus;
  created_at: string;
  updated_at: string;
}

export type CustomerPlan = 'free' | 'pro' | 'enterprise';
export type CustomerStatus = 'active' | 'suspended' | 'cancelled';

/**
 * Connection to Exact Online Division
 */
export interface Connection {
  id: string;
  customer_id: string;
  division_id: number;
  division_code: string | null;
  division_name: string | null;
  country: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  status: ConnectionStatus;
  created_at: string;
  last_used_at: string | null;
}

export type ConnectionStatus = 'active' | 'expired' | 'revoked';

/**
 * API Usage Record
 */
export interface UsageRecord {
  id: number;
  customer_id: string;
  connection_id: string | null;
  tool_name: string;
  success: boolean;
  duration_ms: number | null;
  error_type: string | null;
  created_at: string;
}

/**
 * Support Ticket
 */
export interface Ticket {
  id: string;
  customer_id: string | null;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigned_to: string | null;
  ai_resolution: string | null;
  created_at: string;
  resolved_at: string | null;
  error_context: Record<string, unknown> | null;
}

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Known Issue
 */
export interface KnownIssue {
  id: number;
  pattern: string;
  description: string | null;
  workaround: string | null;
  auto_response: string | null;
  affected_tools: string[];
  status: 'active' | 'resolved';
  created_at: string;
  resolved_at: string | null;
}
