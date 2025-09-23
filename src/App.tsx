import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { StaffDashboard } from './components/StaffDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { RecordDetail } from './components/RecordDetail';
import { apiService, User, CargoRecord } from './services/api';

type ViewType = 'login' | 'staff-dashboard' | 'admin-dashboard' | 'record-detail';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<CargoRecord | null>(null);
  const [records, setRecords] = useState<CargoRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Uygulama başlangıcında localStorage'dan kullanıcı bilgilerini yükle
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const savedUser = localStorage.getItem('currentUser');
        const savedView = localStorage.getItem('currentView') as ViewType;
        
        if (savedUser) {
          const user = JSON.parse(savedUser);
          setCurrentUser(user);
          
          // Kullanıcı bilgilerini doğrula
          try {
            await apiService.getUser(user.id);
            setCurrentView(savedView || (user.role === 'admin' ? 'admin-dashboard' : 'staff-dashboard'));
          } catch (err) {
            // Kullanıcı bilgileri geçersizse localStorage'ı temizle
            localStorage.removeItem('currentUser');
            localStorage.removeItem('currentView');
            setCurrentView('login');
          }
        }
      } catch (err) {
        console.error('Uygulama başlatma hatası:', err);
        setCurrentView('login');
      } finally {
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, []);

  // Verileri yükle
  useEffect(() => {
    const loadData = async () => {
      if (currentUser) {
        setLoading(true);
        setError(null);
        try {
          const [recordsData, usersData] = await Promise.all([
            apiService.getCargoRecords(),
            apiService.getUsers()
          ]);
          setRecords(recordsData);
          setUsers(usersData);
        } catch (err) {
          setError('Veriler yüklenirken hata oluştu: ' + (err as Error).message);
        } finally {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [currentUser]);

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const user = await apiService.login(email, password);
      setCurrentUser(user);
      
      const view = user.role === 'admin' ? 'admin-dashboard' : 'staff-dashboard';
      setCurrentView(view);
      
      // localStorage'a kaydet
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('currentView', view);
    } catch (err) {
      setError('Giriş yapılırken hata oluştu: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('login');
    setSelectedRecord(null);
    
    // localStorage'ı temizle
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentView');
  };

  const handleViewRecord = (record: CargoRecord) => {
    setSelectedRecord(record);
    setCurrentView('record-detail');
    localStorage.setItem('currentView', 'record-detail');
  };

  const handleBackFromRecord = () => {
    setSelectedRecord(null);
    const view = currentUser?.role === 'admin' ? 'admin-dashboard' : 'staff-dashboard';
    setCurrentView(view);
    localStorage.setItem('currentView', view);
  };

  const createRecord = async (data: { barcodeNumber: string; exitNumber: string; carrierCompany: string; senderCompany: string; description: string; photos?: string[] }) => {
    if (!currentUser) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const newRecord = await apiService.createCargoRecord({
        ...data,
        createdBy: currentUser.id,
        createdByName: currentUser.name,
      });
      setRecords(prev => [newRecord, ...prev]);
    } catch (err) {
      setError('Kayıt oluşturulurken hata oluştu: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const updateRecord = async (id: string, updates: Partial<Omit<CargoRecord, 'id' | 'createdBy' | 'createdByName' | 'createdAt'>>) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedRecord = await apiService.updateCargoRecord(id, updates);
      setRecords(prev => prev.map(r => r.id === id ? updatedRecord : r));
      if (selectedRecord && selectedRecord.id === id) {
        setSelectedRecord(updatedRecord);
      }
    } catch (err) {
      setError('Kayıt güncellenirken hata oluştu: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const deleteRecord = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await apiService.deleteCargoRecord(id);
      setRecords(prev => prev.filter(r => r.id !== id));
      if (selectedRecord && selectedRecord.id === id) {
        setSelectedRecord(null);
        if (currentUser?.role === 'admin') setCurrentView('admin-dashboard');
        else setCurrentView('staff-dashboard');
      }
    } catch (err) {
      setError('Kayıt silinirken hata oluştu: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Uygulama henüz başlatılmadıysa loading göster
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 flex items-center space-x-4 shadow-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
          <span className="text-lg font-medium text-gray-700">Uygulama başlatılıyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {/* Error Message */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500"></div>
            <span>Yükleniyor...</span>
          </div>
        </div>
      )}

      {currentView === 'login' && (
        <Login onLogin={handleLogin} loading={loading} />
      )}

      {currentView === 'staff-dashboard' && currentUser && (
        <StaffDashboard
          user={currentUser}
          onLogout={handleLogout}
          onViewRecord={handleViewRecord}
          records={records}
          onCreateRecord={createRecord}
        />
      )}

      {currentView === 'admin-dashboard' && currentUser && (
        <AdminDashboard
          user={currentUser}
          onLogout={handleLogout}
          onViewRecord={handleViewRecord}
          records={records}
          users={users}
          onUpdateRecord={updateRecord}
          onDeleteRecord={deleteRecord}
        />
      )}

      {currentView === 'record-detail' && selectedRecord && currentUser && (
        <RecordDetail
          record={selectedRecord}
          onBack={handleBackFromRecord}
          isAdmin={currentUser.role === 'admin'}
          onUpdateRecord={updateRecord}
          onDeleteRecord={deleteRecord}
        />
      )}
    </div>
  );
}

export default App;