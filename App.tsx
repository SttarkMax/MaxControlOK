import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase, testSupabaseConnection, isSupabaseConfigured } from './lib/supabase';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import CategoriesPage from './pages/CategoriesPage'; 
import CreateQuotePage from './pages/CreateQuotePage';
import CompanySettingsPage from './pages/CompanySettingsPage';
import OrdersPage from './pages/OrdersPage';
import CashFlowPage from './pages/CashFlowPage';
import CustomersPage from './pages/CustomersPage'; 
import UsersPage from './pages/UsersPage';
import AllQuotesPage from './pages/AllQuotesPage'; 
import UserSalesPerformancePage from './pages/UserSalesPerformancePage';
import SuppliersPage from './pages/SuppliersPage'; // Added for Suppliers
import AccountsPayablePage from './pages/AccountsPayablePage';
import ViewQuoteDetailsModal from './components/ViewQuoteDetailsModal'; 
import { UserAccessLevel, CompanyInfo, Quote, User, LoggedInUser } from './types'; 
import { DEFAULT_USER_ACCESS_LEVEL, USERS_STORAGE_KEY } from './constants';
import { useCompany } from './hooks/useSupabaseData';
import { userService } from './services/supabaseService';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<LoggedInUser | null>(null);
  const { company: companyDetails } = useCompany();
  
  const [selectedQuoteForGlobalView, setSelectedQuoteForGlobalView] = useState<Quote | null>(null);
  const [isViewDetailsModalOpenForGlobal, setIsViewDetailsModalOpenForGlobal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Test Supabase connection on app load
  useEffect(() => {
    console.log('🚀 App: Starting Supabase connection test...');
    if (isSupabaseConfigured()) {
      testSupabaseConnection().then(success => {
        if (success) {
          console.log('✅ App: Supabase connection successful - all systems ready');
          // Create default admin user if it doesn't exist
          createDefaultAdminUser();
        } else {
          console.error('❌ App: Supabase connection failed - check configuration');
        }
      }).catch(err => {
        console.error('❌ App: Initial Supabase connection test failed:', err);
      });
    } else {
      console.error('❌ App: Supabase not configured - check environment variables');
    }
  }, []);

  const createDefaultAdminUser = async () => {
    try {
      console.log('🔧 Force recreating admin user with correct password...');
      
      // Delete existing admin user if it exists
      try {
        await userService.deleteUserByUsername('admin@maxcontrol.com');
        console.log('🗑️ Existing admin user deleted');
      } catch (error) {
        console.log('ℹ️ No existing admin user to delete');
      }
      
      // Create fresh admin user
      await userService.createUser({
        username: 'admin@maxcontrol.com',
        fullName: 'Administrador',
        password: 'admin123',
        role: UserAccessLevel.ADMIN
      });
      console.log('✅ Fresh admin user created successfully');
    } catch (error) {
      console.error('❌ Error creating default admin user:', error);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      // Check localStorage for existing session first
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        try {
          const user: LoggedInUser = JSON.parse(savedUser);
          setCurrentUser(user);
          setIsAuthenticated(true);
        } catch (error) {
          console.warn('Error parsing saved user data:', error);
          localStorage.removeItem('currentUser');
        }
      }
    };
    
    checkSession();
  }, []);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'currentUser') { // Keep currentUser state in sync
        if (event.newValue) {
          setCurrentUser(JSON.parse(event.newValue));
        } else {
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);


  const handleLogin = (username: string) => {
    // User data is already set in localStorage by LoginPage
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const userToSet: LoggedInUser = JSON.parse(savedUser);
      setCurrentUser(userToSet);
      setIsAuthenticated(true);
      navigate('/');
    }
  };

  const handleLogout = async () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
  };
  
  const handleOpenViewDetailsForGlobal = (quote: Quote) => {
    setSelectedQuoteForGlobalView(quote);
    setIsViewDetailsModalOpenForGlobal(true);
  };
  const handleCloseViewDetailsForGlobal = () => {
    setIsViewDetailsModalOpenForGlobal(false);
    setSelectedQuoteForGlobalView(null);
  };

  const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: UserAccessLevel | UserAccessLevel[] }> = ({ children, requiredRole }) => {
    if (!isAuthenticated || !currentUser) { // Check currentUser as well
      return <Navigate to="/login" replace />;
    }
    if (requiredRole) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (!roles.includes(currentUser.role)) {
        alert("Você não tem permissão para acessar esta página.");
        return <Navigate to="/" replace />;
      }
    }
    return <>{children}</>;
  };


  if (!isAuthenticated || !currentUser) {
    return (
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </HashRouter>
    );
  }

  return (
    <HashRouter>
      <div className="flex flex-col min-h-screen bg-black">
        <Header 
          userName={currentUser.username} 
          userFullName={currentUser.fullName}
          userRole={currentUser.role} 
          onLogout={handleLogout} 
          companyInfo={companyDetails}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <div className="flex flex-1 pt-16"> 
          <Sidebar currentRole={currentUser.role} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
          <main className="flex-1 p-4 md:p-6 bg-black md:ml-64 overflow-y-auto"> 
            <Routes>
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <DashboardPage 
                    userName={currentUser.fullName || currentUser.username} 
                    userRole={currentUser.role}
                    openGlobalViewDetailsModal={handleOpenViewDetailsForGlobal} 
                  />
                </ProtectedRoute>
              } />
              <Route path="/products" element={<ProtectedRoute requiredRole={[UserAccessLevel.ADMIN, UserAccessLevel.SALES]}><ProductsPage /></ProtectedRoute>} />
              <Route path="/categories" element={<ProtectedRoute requiredRole={[UserAccessLevel.ADMIN, UserAccessLevel.SALES]}><CategoriesPage /></ProtectedRoute>} /> 
              <Route 
                path="/customers" 
                element={
                  <ProtectedRoute requiredRole={[UserAccessLevel.ADMIN, UserAccessLevel.SALES]}>
                    <CustomersPage 
                      openGlobalViewDetailsModal={handleOpenViewDetailsForGlobal} 
                    />
                  </ProtectedRoute>
                } 
              /> 
              <Route path="/quotes/new" element={<ProtectedRoute requiredRole={[UserAccessLevel.ADMIN, UserAccessLevel.SALES]}><CreateQuotePage currentUser={currentUser} /></ProtectedRoute>} />
              <Route path="/quotes/edit/:quoteId" element={<ProtectedRoute requiredRole={[UserAccessLevel.ADMIN, UserAccessLevel.SALES]}><CreateQuotePage currentUser={currentUser} /></ProtectedRoute>} />
              <Route 
                path="/quotes/all" 
                element={
                  <ProtectedRoute requiredRole={[UserAccessLevel.ADMIN, UserAccessLevel.SALES]}>
                    <AllQuotesPage openGlobalViewDetailsModal={handleOpenViewDetailsForGlobal} />
                  </ProtectedRoute>
                } 
              />
               <Route 
                path="/suppliers" 
                element={
                  <ProtectedRoute requiredRole={[UserAccessLevel.ADMIN, UserAccessLevel.SALES]}>
                    <SuppliersPage />
                  </ProtectedRoute>
                } 
              />
               <Route 
                path="/accounts-payable" 
                element={
                  <ProtectedRoute requiredRole={UserAccessLevel.ADMIN}>
                    <AccountsPayablePage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/sales/user-performance"
                element={
                  <ProtectedRoute requiredRole={UserAccessLevel.ADMIN}>
                    <UserSalesPerformancePage currentUser={currentUser} />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/users" 
                element={
                  <ProtectedRoute requiredRole={UserAccessLevel.ADMIN}>
                    <UsersPage loggedInUser={currentUser} />
                  </ProtectedRoute>
                } 
              />
              <Route path="/settings" element={<ProtectedRoute requiredRole={UserAccessLevel.ADMIN}><CompanySettingsPage /></ProtectedRoute>} />
              
              <Route path="/orders" element={<ProtectedRoute requiredRole={[UserAccessLevel.ADMIN, UserAccessLevel.SALES]}><OrdersPage /></ProtectedRoute>} />
              <Route path="/cashflow" element={<ProtectedRoute requiredRole={UserAccessLevel.ADMIN}><CashFlowPage /></ProtectedRoute>} />
              
              <Route path="*" element={<Navigate to="/" replace />} /> 
            </Routes>
          </main>
        </div>
      </div>
      <ViewQuoteDetailsModal
        isOpen={isViewDetailsModalOpenForGlobal}
        onClose={handleCloseViewDetailsForGlobal}
        quote={selectedQuoteForGlobalView}
      />
    </HashRouter>
  );
};

export default App;