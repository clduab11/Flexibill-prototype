import AsyncStorage from '@react-native-async-storage/async-storage';

// API configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Storage keys
const AUTH_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_DATA_KEY = 'user_data';
const BILLS_KEY = 'bills';
const RECOMMENDATIONS_KEY = 'recommendations';

// Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}

// Auth types
export interface AuthTokens {
  token: string;
  refreshToken: string;
  expiresAt: number;
}

export interface LoginResponse {
  user: any;
  token: string;
  refreshToken: string;
  expiresAt: number;
}

export interface RegisterResponse {
  user: any;
  token: string;
}

class ApiService {
  private static instance: ApiService;
  private token: string | null = null;
  private refreshToken: string | null = null;

  private constructor() {
    // Initialize tokens from storage
    this.loadTokens();
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // Load tokens from AsyncStorage
  private async loadTokens(): Promise<void> {
    try {
      this.token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      this.refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error loading tokens from storage:', error);
    }
  }

  // Save tokens to AsyncStorage
  private async saveTokens(tokens: Partial<AuthTokens>): Promise<void> {
    try {
      if (tokens.token) {
        this.token = tokens.token;
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, tokens.token);
      }
      
      if (tokens.refreshToken) {
        this.refreshToken = tokens.refreshToken;
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
      }
    } catch (error) {
      console.error('Error saving tokens to storage:', error);
    }
  }

  // Clear tokens from AsyncStorage
  private async clearTokens(): Promise<void> {
    try {
      this.token = null;
      this.refreshToken = null;
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
      await AsyncStorage.removeItem(USER_DATA_KEY);
    } catch (error) {
      console.error('Error clearing tokens from storage:', error);
    }
  }

  // Get headers for API requests
  private getHeaders(includeAuth: boolean = true): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Generic request method
  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    requiresAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const headers = this.getHeaders(requiresAuth);
      
      const options: RequestInit = {
        method,
        headers,
      };

      if (data) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      const responseData = await response.json();

      if (!response.ok) {
        // Handle 401 Unauthorized - attempt to refresh token
        if (response.status === 401 && this.refreshToken && requiresAuth) {
          const refreshed = await this.refreshAuthToken();
          if (refreshed) {
            // Retry the request with the new token
            return this.request<T>(method, endpoint, data, requiresAuth);
          }
        }

        return {
          success: false,
          error: {
            message: responseData.error?.message || 'An error occurred',
            code: responseData.error?.code || 'UNKNOWN_ERROR',
            details: responseData.error?.details,
          },
        };
      }

      return {
        success: true,
        data: responseData,
      };
    } catch (error) {
      console.error(`API ${method} request error:`, error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Network error',
          code: 'NETWORK_ERROR',
        },
      };
    }
  }

  // HTTP method wrappers
  public async get<T>(endpoint: string, requiresAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, requiresAuth);
  }

  public async post<T>(
    endpoint: string,
    data: any,
    requiresAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, data, requiresAuth);
  }

  public async put<T>(
    endpoint: string,
    data: any,
    requiresAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, data, requiresAuth);
  }

  public async delete<T>(endpoint: string, requiresAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, requiresAuth);
  }

  // Auth methods
  public async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    const response = await this.post<LoginResponse>('/auth/login', { email, password }, false);
    
    if (response.success && response.data) {
      await this.saveTokens({
        token: response.data.token,
        refreshToken: response.data.refreshToken,
      });
      
      // Save user data
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(response.data.user));
    }
    
    return response;
  }

  public async register(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ): Promise<ApiResponse<RegisterResponse>> {
    const response = await this.post<RegisterResponse>(
      '/auth/register',
      { email, password, firstName, lastName },
      false
    );
    
    if (response.success && response.data) {
      await this.saveTokens({
        token: response.data.token,
      });
      
      // Save user data
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(response.data.user));
    }
    
    return response;
  }

  public async refreshAuthToken(): Promise<boolean> {
    if (!this.refreshToken) {
      return false;
    }

    try {
      const response = await this.post<AuthTokens>(
        '/auth/refresh-token',
        { refreshToken: this.refreshToken },
        false
      );

      if (response.success && response.data) {
        await this.saveTokens({
          token: response.data.token,
          refreshToken: response.data.refreshToken,
        });
        return true;
      }

      // If refresh failed, clear tokens
      await this.clearTokens();
      return false;
    } catch (error) {
      console.error('Error refreshing token:', error);
      await this.clearTokens();
      return false;
    }
  }

  public async logout(): Promise<ApiResponse<void>> {
    const response = await this.post<void>('/auth/logout', {});
    await this.clearTokens();
    return response;
  }

  public async forgotPassword(email: string): Promise<ApiResponse<void>> {
    return this.post<void>('/auth/forgot-password', { email }, false);
  }

  public async resetPassword(password: string): Promise<ApiResponse<void>> {
    return this.post<void>('/auth/reset-password', { password }, false);
  }

  public async getCurrentUser(): Promise<any | null> {
    try {
      const userData = await AsyncStorage.getItem(USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  public async updateProfile(
    firstName?: string,
    lastName?: string
  ): Promise<ApiResponse<any>> {
    return this.put<any>('/auth/profile', { firstName, lastName });
  }

  public isAuthenticated(): boolean {
    return !!this.token;
  }

  // Local storage methods for offline access
  public async saveBills(bills: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(BILLS_KEY, JSON.stringify(bills));
    } catch (error) {
      console.error('Error saving bills to storage:', error);
    }
  }

  public async getBills(): Promise<any[] | null> {
    try {
      const billsData = await AsyncStorage.getItem(BILLS_KEY);
      return billsData ? JSON.parse(billsData) : null;
    } catch (error) {
      console.error('Error getting bills from storage:', error);
      return null;
    }
  }

  public async saveRecommendations(recommendations: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(RECOMMENDATIONS_KEY, JSON.stringify(recommendations));
    } catch (error) {
      console.error('Error saving recommendations to storage:', error);
    }
  }

  public async getRecommendations(): Promise<any[] | null> {
    try {
      const recommendationsData = await AsyncStorage.getItem(RECOMMENDATIONS_KEY);
      return recommendationsData ? JSON.parse(recommendationsData) : null;
    } catch (error) {
      console.error('Error getting recommendations from storage:', error);
      return null;
    }
  }
}

export default ApiService.getInstance();
