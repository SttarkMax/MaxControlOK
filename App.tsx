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
import { userService, UserAlreadyExistsError } from './services/supabaseService';

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
          console.error('❌ App: Supabase connection failed - check CORS settings');
          alert('Erro de conexão: Verifique se http://localhost:5173 está nas configurações CORS do Supabase');
        }
      }).catch(err => {
        console.error('❌ App: Initial Supabase connection test failed - CORS issue:', err);
        alert('Erro de CORS: Adicione http://localhost:5173 às configurações CORS do Supabase');
      });
    } else {
      console.error('❌ App: Supabase not configured - check environment variables');
    }
  }, []);

  const createDefaultAdminUser = async () => {
    try {
      console.log('🔧 Ensuring admin user exists with correct password...');
      
      // Skip if Supabase is not configured
      if (!isSupabaseConfigured()) {
        console.log('⚠️ Supabase not configured - skipping admin user creation');
        return;
      }
      
      // Check if admin user already exists
      const existingUser = await userService.getUserByUsername('admin@maxcontrol.com');
      
      if (existingUser) {
        console.log('🔄 Admin user exists, updating with proper password hash...');
        // Update existing user instead of deleting and recreating
        try {
          await userService.updateUser({
            id: existingUser.id,
            username: 'admin@maxcontrol.com',
            fullName: 'Administrador',
            password: 'admin123',
            role: UserAccessLevel.ADMIN
          });
          console.log('✅ Admin user updated with proper password hash');
        } catch (error) {
          console.log('⚠️ Could not update existing user:', error);
        }
      } else {
        console.log('➕ Creating new admin user...');
        try {
          await userService.createUser({
            username: 'admin@maxcontrol.com',
            fullName: 'Administrador',
            password: 'admin123',
            role: UserAccessLevel.ADMIN
          });
          console.log('✅ New admin user created successfully');
        } catch (error) {
          // Check if this is a duplicate key error (race condition)
          if (error instanceof UserAlreadyExistsError) {
            console.log('🔄 Race condition detected - admin user was created concurrently, updating existing user...');
            try {
              // Fetch the existing user and update it
              const existingUser = await userService.getUserByUsername('admin@maxcontrol.com');
              if (existingUser) {
                await userService.updateUser({
                  id: existingUser.id,
                  username: 'admin@maxcontrol.com',
                  fullName: 'Administrador',
                  password: 'admin123',
                  role: UserAccessLevel.ADMIN
                });
                console.log('✅ Admin user updated after race condition');
              }
            } catch (updateError) {
              console.log('⚠️ Could not update admin user after race condition:', updateError);
            }
          } else if (error instanceof Error && error.message.includes('duplicate key value violates unique constraint')) {
            // Fallback for other duplicate key scenarios
            console.log('🔄 Duplicate key detected - admin user exists, updating existing user...');
            try {
              const existingUser = await userService.getUserByUsername('admin@maxcontrol.com');
              if (existingUser) {
                await userService.updateUser({
                  id: existingUser.id,
                  username: 'admin@maxcontrol.com',
                  fullName: 'Administrador',
                  password: 'admin123',
                  role: UserAccessLevel.ADMIN
                });
                console.log('✅ Admin user updated after duplicate key detection');
              }
            } catch (updateError) {
              console.log('⚠️ Could not update admin user after duplicate key detection:', updateError);
            }
          } else {
            console.log('⚠️ Could not create admin user:', error);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error managing default admin user:', error);
    }
  };

  useEffect(() => {
    const checkSession = () => {
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