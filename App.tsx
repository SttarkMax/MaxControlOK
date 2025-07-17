import React, { useState, useEffect, useRef } from 'react';
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
          console.error('❌ App: Supabase connection failed');
          console.error('📋 CORS Fix: Add http://localhost:5173 to Supabase CORS origins');
          console.error('🔗 Go to: Supabase Dashboard → Project Settings → API → CORS');
          // Don't show alert immediately, let user work offline
        }
      }).catch(err => {
        console.error('❌ App: Initial Supabase connection test failed');
        console.error('📋 CORS Fix: Add http://localhost:5173 to Supabase CORS origins');
        // Don't show alert, let app continue in offline mode
      });
    } else {
      console.error('❌ App: Supabase not configured - check environment variables');
      console.error('📋 Check: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local');
    }
  }, []);

  const ensureUserExistsAndIsUpdated = async (username: string, fullName: string, password: string, role: 'admin' | 'sales' | 'viewer') => {
    try {
      console.log(`🔄 Checking for existing user: ${username}...`);
      
      // Check if user already exists
      const existingUser = await userService.getUserByUsername(username);
      
      if (existingUser) {
        console.log(`✅ User ${username} exists, updating password...`);
        try {
          await userService.updateUser({
            ...existingUser,
            password: password
          });
          console.log(`✅ User ${username} password updated successfully`);
        } catch (updateError) {
          console.error(`❌ Error updating user ${username}:`, updateError);
          throw updateError;
        }
      } else {
        console.log(`🔄 Creating user: ${username}...`);
        try {
          const newUser = await userService.createUser({
            username,
            fullName,
            role,
            password
          });
          console.log(`✅ User ${username} created successfully:`, newUser.id);
        } catch (createError) {
          // Handle race condition where user might be created between check and creation
          if (createError instanceof Error && (createError.message.includes('duplicate key') || createError.message.includes('já existe'))) {
            console.log(`ℹ️ User ${username} was created by another process, attempting to update...`);
            try {
              const userAfterRace = await userService.getUserByUsername(username);
              if (userAfterRace) {
                await userService.updateUser({
                  ...userAfterRace,
                  password: password
                });
                console.log(`✅ User ${username} updated after race condition`);
              } else {
                console.log(`⚠️ User ${username} still not found after race condition, skipping...`);
              }
            } catch (raceError) {
              console.log(`⚠️ Could not update user ${username} after race condition:`, raceError);
              // Don't throw here, just log and continue
            }
          } else {
            console.error(`❌ Error creating user ${username}:`, createError);
            throw createError;
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error ensuring user ${username} exists:`, error);
      // Don't throw error for admin setup, just log it
      console.log(`⚠️ Continuing despite error with user ${username}`);
    }
  };
  const createDefaultAdminUser = async () => {
    try {
      console.log('🔄 Checking for existing admin user...');
      
      // Check if user already exists first
      const existingUser = await userService.getUserByUsername('admin@maxcontrol.com');
      
      // Ensure default admin user exists and is updated
      await ensureUserExistsAndIsUpdated('admin@maxcontrol.com', 'Administrador', 'admin123', 'admin');
      
      // Ensure test user exists and is updated
      await ensureUserExistsAndIsUpdated('f13moreira@gmail.com', 'F13 Moreira', 'admin123', 'admin');
      
      console.log('✅ All default users ensured successfully');
    } catch (error) {
      console.error('❌ Error with admin user setup:', error);
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
                    <AllQuotesPage 
                      openGlobalViewDetailsModal={handleOpenViewDetailsForGlobal} 
                      currentUserRole={currentUser.role}
                    />
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
                    <UserSalesPerformancePage 
                      currentUser={currentUser} 
                      openGlobalViewDetailsModal={handleOpenViewDetailsForGlobal}
                    />
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