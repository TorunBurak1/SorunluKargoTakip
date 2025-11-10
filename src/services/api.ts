const API_BASE_URL = 'http://localhost:3001/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'staff' | 'admin';
  createdAt?: string;
}

export interface CargoRecord {
  id: string;
  barcodeNumber: string;
  exitNumber: string;
  carrierCompany: 'aras_aylin' | 'aras_verar' | 'aras_hatip' | 'ptt' | 'surat' | 'verar' | 'yurtici';
  senderCompany: string;
  description: string;
  photos: string[];
  status: 'open' | 'in_progress' | 'resolved' | 'paid' | 'rejected';
  resolutionNote?: string;
  paymentNote?: string;
  rejectionReason?: string;
  statusUpdatedBy?: string;
  statusUpdatedByName?: string;
  statusUpdatedAt?: string;
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
  recipientName: string;
  description: string;
  photos?: string[];
  createdBy: string;
  createdByName: string;
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('API Service: Requesting URL:', url);
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      console.log('API Service: Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Service: Response data:', data);
      return data;
    } catch (error) {
      console.error('API Service: Request failed:', error);
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

  async createUser(data: {
    name: string;
    email: string;
    role: 'staff' | 'admin';
    password: string;
  }): Promise<User> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: {
    name: string;
    email: string;
    role: 'staff' | 'admin';
  }): Promise<User> {
    return this.request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateUserPassword(id: string, newPassword: string): Promise<void> {
    return this.request<void>(`/users/${id}/password`, {
      method: 'PATCH',
      body: JSON.stringify({ newPassword }),
    });
  }

  async deleteUser(id: string): Promise<void> {
    return this.request<void>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Kargo kayıt işlemleri
  async getCargoRecords(): Promise<CargoRecord[]> {
    try {
      console.log('API Service: getCargoRecords çağrılıyor...');
      const data = await this.request<CargoRecord[]>('/cargo-records');
      console.log('API Service: getCargoRecords başarılı:', data);
      return data;
    } catch (error) {
      console.error('API Service: getCargoRecords hatası:', error);
      throw error;
    }
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

  async updateCargoRecordStatus(
    id: string, 
    data: {
      status: 'open' | 'in_progress' | 'resolved' | 'paid' | 'rejected';
      resolutionNote?: string;
      paymentNote?: string;
      rejectionReason?: string;
      updatedBy: string;
      updatedByName: string;
    }
  ): Promise<CargoRecord> {
    return this.request<CargoRecord>(`/cargo-records/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteCargoRecord(id: string): Promise<void> {
    return this.request<void>(`/cargo-records/${id}`, {
      method: 'DELETE',
    });
  }

  // Tüm verileri getir
  async getAllData(): Promise<{
    users: User[];
    cargoRecords: CargoRecord[];
    summary: {
      totalUsers: number;
      totalCargoRecords: number;
      usersByRole: {
        admin: number;
        staff: number;
      };
      cargoRecordsByStatus: {
        open: number;
        in_progress: number;
        resolved: number;
        paid: number;
        rejected: number;
      };
    };
  }> {
    return this.request<{
      users: User[];
      cargoRecords: CargoRecord[];
      summary: {
        totalUsers: number;
        totalCargoRecords: number;
        usersByRole: {
          admin: number;
          staff: number;
        };
        cargoRecordsByStatus: {
          open: number;
          in_progress: number;
          resolved: number;
          paid: number;
          rejected: number;
        };
      };
    }>('/all-data');
  }

  // Health check
  async healthCheck(): Promise<{ status: string; message: string }> {
    return this.request<{ status: string; message: string }>('/health');
  }
}

export const apiService = new ApiService();


