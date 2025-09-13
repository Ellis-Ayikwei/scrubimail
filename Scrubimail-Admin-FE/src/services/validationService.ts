import axiosInstance from "./axiosInstance";

export interface EmailValidationRequest {
  email: string;
  real_time?: boolean;
}

export interface BulkValidationRequest {
  emails: string[];
}

export interface ValidationResult {
  id: number;
  email: string;
  status: string;
  score: number;
  verdict: string;
  is_valid: boolean;
  breakdown: {
    syntax: { valid: boolean };
    dns: { valid: boolean; score: number };
    smtp: { valid: boolean; catch_all: boolean };
    reputation: { reputation_score: number };
    role_based: { is_role_based: boolean };
  };
  suggestions: string[];
  warnings: string[];
  validation_time: number;
}

export interface BulkJobResponse {
  job_id: number;
  total_emails: number;
  status: string;
  message: string;
}

export interface BulkJobStatus {
  job_id: number;
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
  // Single email validation
  async validateEmail(request: EmailValidationRequest): Promise<ValidationResult> {
    const response = await axiosInstance.post('/validate/', request);
    return response.data;
  }

  // Bulk email validation
  async validateBulk(request: BulkValidationRequest): Promise<BulkJobResponse> {
    const response = await axiosInstance.post('/validate-bulk/', request);
    return response.data;
  }

  // Get bulk job status
  async getBulkJobStatus(jobId: number): Promise<BulkJobStatus> {
    const response = await axiosInstance.get(`/bulk-status/${jobId}/`);
    return response.data;
  }

  // Get validation status
  async getValidationStatus(validationId: number): Promise<ValidationResult> {
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