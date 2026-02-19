/** Standard API response wrapper matching the backend ApiResponse<T> */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/** Health check response */
export interface HealthStatus {
  status: string;
  timestamp: string;
}
