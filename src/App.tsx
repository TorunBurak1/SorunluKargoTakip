import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './components/Login';
import { StaffDashboard } from './components/StaffDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { RecordDetail } from './components/RecordDetail';
import { TablePage } from './pages/TablePage';
import { RecordsProvider } from './contexts/RecordsContext';
import { UsersProvider } from './contexts/UsersContext';
import { mockUsers } from './data/mockData';
import { User, CargoRecord } from './types';
import { apiService } from './services/api';

type ViewType = 'login' | 'staff-dashboard' | 'admin-dashboard' | 'record-detail';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<CargoRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sayfa yüklendiğinde otomatik giriş kontrolü
  // sessionStorage kullanarak her sekme için ayrı oturum sağlıyoruz
  useEffect(() => {
    try {
      // Önce admin oturumunu kontrol et
      const adminUser = sessionStorage.getItem('adminUser');
      const adminView = sessionStorage.getItem('adminView') as ViewType;
      
      // Sonra staff oturumunu kontrol et
      const staffUser = sessionStorage.getItem('staffUser');
      const staffView = sessionStorage.getItem('staffView') as ViewType;
      
      // Admin oturumu varsa onu yükle
      if (adminUser && adminView) {
        try {
          const user = JSON.parse(adminUser);
          // Kullanıcı geçerli mi kontrol et
          if (user && user.id && user.name && user.role === 'admin') {
            setCurrentUser(user);
            setCurrentView(adminView);
            
            // Eğer record-detail view'ındaysa selectedRecord'u yükle
            if (adminView === 'record-detail') {
              const adminSelectedRecord = sessionStorage.getItem('adminSelectedRecord');
              if (adminSelectedRecord) {
                try {
                  const record = JSON.parse(adminSelectedRecord);
                  setSelectedRecord(record);
                  console.log('Admin record-detail view yüklendi:', record.id);
                } catch (error) {
                  console.error('Admin selectedRecord yükleme hatası:', error);
                  setCurrentView('admin-dashboard');
                  sessionStorage.setItem('adminView', 'admin-dashboard');
                }
              } else {
                setCurrentView('admin-dashboard');
                sessionStorage.setItem('adminView', 'admin-dashboard');
              }
            }
            console.log('Admin oturumu yüklendi:', user.name, adminView);
          } else {
            throw new Error('Geçersiz admin kullanıcı verisi');
          }
        } catch (error) {
          console.error('Admin oturum yükleme hatası:', error);
          sessionStorage.removeItem('adminUser');
          sessionStorage.removeItem('adminView');
          sessionStorage.removeItem('adminSelectedRecord');
          setCurrentView('login');
        }
      }
      // Admin oturumu yoksa staff oturumunu kontrol et
      else if (staffUser && staffView) {
        try {
          const user = JSON.parse(staffUser);
          // Kullanıcı geçerli mi kontrol et
          if (user && user.id && user.name && user.role === 'staff') {
            setCurrentUser(user);
            setCurrentView(staffView);
            
            // Eğer record-detail view'ındaysa selectedRecord'u yükle
            if (staffView === 'record-detail') {
              const staffSelectedRecord = sessionStorage.getItem('staffSelectedRecord');
              if (staffSelectedRecord) {
                try {
                  const record = JSON.parse(staffSelectedRecord);
                  setSelectedRecord(record);
                  console.log('Staff record-detail view yüklendi:', record.id);
                } catch (error) {
                  console.error('Staff selectedRecord yükleme hatası:', error);
                  setCurrentView('staff-dashboard');
                  sessionStorage.setItem('staffView', 'staff-dashboard');
                }
              } else {
                setCurrentView('staff-dashboard');
                sessionStorage.setItem('staffView', 'staff-dashboard');
              }
            }
            console.log('Staff oturumu yüklendi:', user.name, staffView);
          } else {
            throw new Error('Geçersiz staff kullanıcı verisi');
          }
        } catch (error) {
          console.error('Staff oturum yükleme hatası:', error);
          sessionStorage.removeItem('staffUser');
          sessionStorage.removeItem('staffView');
          sessionStorage.removeItem('staffSelectedRecord');
          setCurrentView('login');
        }
      } else {
        // Oturum yoksa login sayfasına yönlendir
        setCurrentView('login');
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('Oturum yükleme genel hatası:', error);
      // Tüm sessionStorage'ı temizle
      sessionStorage.removeItem('adminUser');
      sessionStorage.removeItem('adminView');
      sessionStorage.removeItem('staffUser');
      sessionStorage.removeItem('staffView');
      setCurrentView('login');
      setCurrentUser(null);
    }
    
    setIsLoading(false);
  }, []);

  const handleLogin = async (email: string, password: string) => {
    try {
      // API servisini kullanarak giriş yap
      const user = await apiService.login(email, password);
      
      if (user) {
        // Kullanıcı rolüne göre sessionStorage key'lerini belirle
        const userKey = user.role === 'admin' ? 'adminUser' : 'staffUser';
        const viewKey = user.role === 'admin' ? 'adminView' : 'staffView';
        
        // Farklı rolde kullanıcı giriş yapıyorsa diğer rolün oturumunu temizle
        if (user.role === 'admin') {
          // Admin giriş yapıyorsa staff oturumunu temizle
          const staffUser = sessionStorage.getItem('staffUser');
          if (staffUser) {
            const staffUserData = JSON.parse(staffUser);
            console.log('Admin giriş yapıyor, staff oturumu temizleniyor:', staffUserData.name);
            sessionStorage.removeItem('staffUser');
            sessionStorage.removeItem('staffView');
          }
        } else {
          // Staff giriş yapıyorsa admin oturumunu temizle
          const adminUser = sessionStorage.getItem('adminUser');
          if (adminUser) {
            const adminUserData = JSON.parse(adminUser);
            console.log('Staff giriş yapıyor, admin oturumu temizleniyor:', adminUserData.name);
            sessionStorage.removeItem('adminUser');
            sessionStorage.removeItem('adminView');
          }
        }
        
        // Yeni kullanıcıyı kaydet
        setCurrentUser(user);
        sessionStorage.setItem(userKey, JSON.stringify(user));
        
        // View'ı belirle ve kaydet
        const view = user.role === 'admin' ? 'admin-dashboard' : 'staff-dashboard';
        setCurrentView(view);
        sessionStorage.setItem(viewKey, view);
        
        console.log('Giriş yapıldı:', user.name, user.role, view);
      }
    } catch (error: any) {
      console.error('Giriş hatası:', error);
      alert(error.message || 'Geçersiz e-posta veya şifre!');
    }
  };

  const handleLogout = () => {
    console.log('Çıkış yapıldı:', currentUser?.name, currentUser?.role);
    
    // Kullanıcı rolüne göre doğru sessionStorage key'lerini temizle
    if (currentUser?.role === 'admin') {
      sessionStorage.removeItem('adminUser');
      sessionStorage.removeItem('adminView');
      sessionStorage.removeItem('adminSelectedRecord');
    } else if (currentUser?.role === 'staff') {
      sessionStorage.removeItem('staffUser');
      sessionStorage.removeItem('staffView');
      sessionStorage.removeItem('staffSelectedRecord');
    }
    
    setCurrentUser(null);
    setCurrentView('login');
    setSelectedRecord(null);
  };

  const handleViewRecord = (record: CargoRecord) => {
    setSelectedRecord(record);
    setCurrentView('record-detail');
    
    // Kullanıcı rolüne göre doğru sessionStorage key'ini güncelle
    const viewKey = currentUser?.role === 'admin' ? 'adminView' : 'staffView';
    const recordKey = currentUser?.role === 'admin' ? 'adminSelectedRecord' : 'staffSelectedRecord';
    sessionStorage.setItem(viewKey, 'record-detail');
    sessionStorage.setItem(recordKey, JSON.stringify(record));
  };

  const handleBackFromRecord = () => {
    setSelectedRecord(null);
    const view = currentUser?.role === 'admin' ? 'admin-dashboard' : 'staff-dashboard';
    setCurrentView(view);
    
    // Kullanıcı rolüne göre doğru sessionStorage key'ini güncelle
    const viewKey = currentUser?.role === 'admin' ? 'adminView' : 'staffView';
    const recordKey = currentUser?.role === 'admin' ? 'adminSelectedRecord' : 'staffSelectedRecord';
    sessionStorage.setItem(viewKey, view);
    sessionStorage.removeItem(recordKey);
  };

  // Loading durumunda spinner göster
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
          <button 
            onClick={() => {
              sessionStorage.clear();
              window.location.reload();
            }}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            SessionStorage Temizle ve Yenile
          </button>
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>Backend:</strong> http://localhost:3001</p>
            <p><strong>Frontend:</strong> http://localhost:5173</p>
            <p><strong>Demo Hesaplar:</strong></p>
            <p>• Yönetici: mehmet@kargo.com / 123456</p>
            <p>• Çalışan: ahmet@kargo.com / 123456</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <RecordsProvider>
        <UsersProvider>
          <div className="App">
            <Routes>
              {/* Tablo sayfası - herkese açık */}
              <Route path="/tablo" element={<TablePage />} />
              
              {/* Ana uygulama rotaları */}
              <Route path="/" element={
                !currentUser || currentView === 'login' ? (
                  <Login onLogin={handleLogin} />
                ) : currentView === 'staff-dashboard' && currentUser ? (
                  <StaffDashboard
                    user={currentUser}
                    onLogout={handleLogout}
                    onViewRecord={handleViewRecord}
                  />
                ) : currentView === 'admin-dashboard' && currentUser ? (
                  <AdminDashboard
                    user={currentUser}
                    onLogout={handleLogout}
                    onViewRecord={handleViewRecord}
                  />
                ) : currentView === 'record-detail' && selectedRecord && currentUser ? (
                  <RecordDetail
                    record={selectedRecord}
                    onBack={handleBackFromRecord}
                    isAdmin={currentUser.role === 'admin'}
                  />
                ) : (
                  <Login onLogin={handleLogin} />
                )
              } />
              
              {/* Diğer tüm rotalar ana sayfaya yönlendir */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </UsersProvider>
      </RecordsProvider>
    </Router>
  );
}

export default App;