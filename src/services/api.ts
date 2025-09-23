const API_BASE_URL = 'http://localhost:3001/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'staff' | 'admin';
}

export interface CargoRecord {
  id: string;
  barcodeNumber: string;
  exitNumber: string;
  carrierCompany: 'aras_aylin' | 'aras_verar' | 'aras_hatip' | 'ptt' | 'surat' | 'verar' | 'yurtici';
  senderCompany: string;
  description: string;
  photos: string[];
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCargoRecordData {
  barcodeNumber: string;
  exitNumber: string;
  carrierCompany: string;
  senderCompany: string;
  description: string;
  photos?: string[];
  createdBy: string;
  createdByName: string;
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Kullanıcı işlemleri
  async login(email: string, password: string): Promise<User> {
    return this.request<User>('/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/users');
  }

  async getUser(id: string): Promise<User> {
    return this.request<User>(`/users/${id}`);
  }

  // Kargo kayıt işlemleri
  async getCargoRecords(): Promise<CargoRecord[]> {
    return this.request<CargoRecord[]>('/cargo-records');
  }

  async getCargoRecord(id: string): Promise<CargoRecord> {
    return this.request<CargoRecord>(`/cargo-records/${id}`);
  }

  async createCargoRecord(data: CreateCargoRecordData): Promise<CargoRecord> {
    return this.request<CargoRecord>('/cargo-records', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCargoRecord(id: string, data: Partial<CreateCargoRecordData>): Promise<CargoRecord> {
    return this.request<CargoRecord>(`/cargo-records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCargoRecord(id: string): Promise<void> {
    return this.request<void>(`/cargo-records/${id}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string; message: string }> {
    return this.request<{ status: string; message: string }>('/health');
  }
}

export const apiService = new ApiService();

