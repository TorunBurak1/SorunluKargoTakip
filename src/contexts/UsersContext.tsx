import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../services/api';
import { apiService } from '../services/api';

interface UsersContextType {
  users: User[];
  loading: boolean;
  error: string | null;
  addUser: (userData: {
    name: string;
    email: string;
    role: 'staff' | 'admin';
    password: string;
  }) => Promise<void>;
  updateUser: (id: string, userData: {
    name: string;
    email: string;
    role: 'staff' | 'admin';
  }) => Promise<void>;
  updateUserPassword: (id: string, newPassword: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  refreshUsers: () => Promise<void>;
}

const UsersContext = createContext<UsersContextType | undefined>(undefined);

export const useUsers = () => {
  const context = useContext(UsersContext);
  if (context === undefined) {
    throw new Error('useUsers must be used within a UsersProvider');
  }
  return context;
};

interface UsersProviderProps {
  children: ReactNode;
}

export const UsersProvider: React.FC<UsersProviderProps> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Kullanıcıları yükle
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('UsersContext: Kullanıcılar yükleniyor...');
      const data = await apiService.getUsers();
      console.log('UsersContext: Kullanıcılar yüklendi:', data);
      setUsers(data);
    } catch (err) {
      console.error('UsersContext: Kullanıcılar yüklenirken hata:', err);
      setError(err instanceof Error ? err.message : 'Kullanıcılar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Component mount olduğunda kullanıcıları yükle
  useEffect(() => {
    loadUsers();
  }, []);

  const addUser = async (userData: {
    name: string;
    email: string;
    role: 'staff' | 'admin';
    password: string;
  }) => {
    try {
      setError(null);
      const newUser = await apiService.createUser(userData);
      setUsers(prevUsers => [...prevUsers, newUser]);
    } catch (err) {
      console.error('Kullanıcı eklenirken hata:', err);
      setError(err instanceof Error ? err.message : 'Kullanıcı eklenirken hata oluştu');
      throw err;
    }
  };

  const updateUser = async (id: string, userData: {
    name: string;
    email: string;
    role: 'staff' | 'admin';
  }) => {
    try {
      setError(null);
      const updated = await apiService.updateUser(id, userData);
      setUsers(prevUsers => 
        prevUsers.map(user => user.id === id ? updated : user)
      );
    } catch (err) {
      console.error('Kullanıcı güncellenirken hata:', err);
      setError(err instanceof Error ? err.message : 'Kullanıcı güncellenirken hata oluştu');
      throw err;
    }
  };

  const updateUserPassword = async (id: string, newPassword: string) => {
    try {
      setError(null);
      await apiService.updateUserPassword(id, newPassword);
    } catch (err) {
      console.error('Şifre güncellenirken hata:', err);
      setError(err instanceof Error ? err.message : 'Şifre güncellenirken hata oluştu');
      throw err;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      setError(null);
      await apiService.deleteUser(id);
      setUsers(prevUsers => prevUsers.filter(user => user.id !== id));
    } catch (err) {
      console.error('Kullanıcı silinirken hata:', err);
      setError(err instanceof Error ? err.message : 'Kullanıcı silinirken hata oluştu');
      throw err;
    }
  };

  const refreshUsers = async () => {
    await loadUsers();
  };

  const value = {
    users,
    loading,
    error,
    addUser,
    updateUser,
    updateUserPassword,
    deleteUser,
    refreshUsers,
  };

  return (
    <UsersContext.Provider value={value}>
      {children}
    </UsersContext.Provider>
  );
};
