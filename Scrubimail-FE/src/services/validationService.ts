import axiosInstance from "./axiosInstance";


/** Verification mode for the realtime endpoint (Issue 9). Deep is the default. */
export type ValidationMode = 'deep' | 'fast';

export interface EmailValidationRequest {
  email: string;
  /** Opt into the sub-100ms syntax/DNS-only path (no SMTP probe). */
  mode?: ValidationMode;
  details?: boolean;
}

export interface BulkValidationRequest {
  emails: string[];
}

/** The five-value verification status (Issue 5). */
export type VerificationStatus =
  | 'valid'
  | 'invalid'
  | 'catch_all'
  | 'unknown'
  | 'do_not_mail';

export interface ValidationResult {
  id: string; // UUID
  email: string;
  status: string; // record status (completed/…)
  score: number;
  verdict: string;
  is_valid: boolean;
  /** Machine-readable verification status + sub_status (Issue 5/9). */
  verification_status?: VerificationStatus;
  sub_status?: string;
  /** Realtime endpoint extras (Issue 9). */
  mode?: ValidationMode;
  cached?: boolean;
  verified_at?: string | null;
  breakdown: {
    syntax: { valid: boolean };
    dns: { valid: boolean; score: number; null_mx?: boolean };
    smtp: { valid: boolean; catch_all: boolean };
    reputation: { reputation_score: number; is_spam_trap?: boolean };
    role_based: { is_role_based: boolean };
  };
  suggestions: string[];
  warnings: string[];
  validation_time: number;
}

export interface BulkJobResponse {
  job_id: string; // UUID
  total_emails: number;
  status: string;
  message: string;
  status_url?: string;
}

export interface BulkJobStatus {
  job_id: string; // UUID
  status: string;
  progress: number;
  total_emails: number;
  total_processed: number;
  summary: {
    total_validations: number;
    completed_validations: number;
    valid_emails: number;
    invalid_emails: number;
    risky_emails: number;
    avg_score: number;
  };
}

export interface ValidationHistory {
  results: ValidationResult[];
  summary: {
    total_validations: number;
    completed_validations: number;
    valid_emails: number;
    invalid_emails: number;
    risky_emails: number;
    avg_score: number;
  };
}

export interface ValidationAnalytics {
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  overview: {
    total_validations: number;
    completed_validations: number;
    success_rate: number;
    avg_score: number;
  };
  daily_stats: Array<{
    date: string;
    validations: number;
    valid_count: number;
    invalid_count: number;
    avg_score: number;
  }>;
  top_domains: Array<{
    domain: string;
    count: number;
    avg_score: number;
  }>;
}

export interface DomainReputation {
  domain: string;
  reputation_score: number;
  is_disposable: boolean;
  is_corporate: boolean;
  tld_risk: boolean;
  spam_trap_risk: number;
  last_checked: string;
  cached: boolean;
}

class ValidationService {
  // Single email validation. Deep by default (may return valid/invalid inline);
  // pass mode:'fast' for the syntax/DNS-only path. `details` returns the full
  // breakdown. Mode/details go in the query string per the API contract.
  async validateEmail(request: EmailValidationRequest): Promise<ValidationResult> {
    const { email, mode, details } = request;
    const params: Record<string, string> = {};
    if (mode === 'fast') params.mode = 'fast';
    if (details) params.details = 'true';
    const response = await axiosInstance.post('/validate/', { email }, { params });
    return response.data;
  }

  // Bulk email validation — enqueues a job and returns 202 + job_id immediately.
  // Poll getBulkJobStatus for progress.
  async validateBulk(request: BulkValidationRequest): Promise<BulkJobResponse> {
    const response = await axiosInstance.post('/validate-bulk/', request);
    return response.data;
  }

  // Get bulk job status (ids are UUIDs)
  async getBulkJobStatus(jobId: string): Promise<BulkJobStatus> {
    const response = await axiosInstance.get(`/bulk-status/${jobId}/`);
    return response.data;
  }

  // Get validation status (ids are UUIDs)
  async getValidationStatus(validationId: string): Promise<ValidationResult> {
    const response = await axiosInstance.get(`/status/${validationId}/`);
    return response.data;
  }

  // Get validation history
  async getValidationHistory(params?: {
    page?: number;
    page_size?: number;
    start_date?: string;
    end_date?: string;
    status?: string;
  }): Promise<ValidationHistory> {
    const response = await axiosInstance.get('/history/', { params });
    return response.data;
  }

  // Get validation analytics
  async getValidationAnalytics(params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<ValidationAnalytics> {
    const response = await axiosInstance.get('/analytics/', { params });
    return response.data;
  }

  // Get domain reputation
  async getDomainReputation(domain: string): Promise<DomainReputation> {
    const response = await axiosInstance.get(`/domain-reputation/${domain}/`);
    return response.data;
  }
}

export const validationService = new ValidationService();
export default validationService;