import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
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

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<LoggedInUser | null>(null);
  const { company: companyDetails } = useCompany();
  
  const [selectedQuoteForGlobalView, setSelectedQuoteForGlobalView] = useState<Quote | null>(null);
  const [isViewDetailsModalOpenForGlobal, setIsViewDetailsModalOpenForGlobal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Check for existing Supabase session on app load
  useEffect(() => {
    const checkSession = async () => {
      if (!supabase) {
        // If Supabase is not configured, check localStorage for existing session
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          const user: LoggedInUser = JSON.parse(savedUser);
          setCurrentUser(user);
          setIsAuthenticated(true);
        }
        return;
      }
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // User is authenticated with Supabase - try to get user data from app_users table
          try {
            const { data: userData, error } = await supabase
              .from('app_users')
              .select('*')
              .eq('username', session.user.email?.split('@')[0] || 'admin')
              .single();

            if (userData && !error) {
              const loggedInUser: LoggedInUser = {
                id: userData.id,
                username: userData.username,
                fullName: userData.full_name || userData.username,
                role: userData.role as any,
              };
              setCurrentUser(loggedInUser);
              setIsAuthenticated(true);
              localStorage.setItem('currentUser', JSON.stringify(loggedInUser));
            } else {
              // Fallback to basic user data from auth
              const fallbackUser: LoggedInUser = {
                id: session.user.id,
                username: session.user.email?.split('@')[0] || 'User',
                fullName: session.user.user_metadata?.full_name || session.user.email || 'User',
                role: 'admin', // Default to admin for authenticated users
              };
              setCurrentUser(fallbackUser);
              setIsAuthenticated(true);
              localStorage.setItem('currentUser', JSON.stringify(fallbackUser));
            }
          } catch (error) {
            console.warn('Error fetching user data from app_users, using fallback:', error);
            // Fallback authentication
            const fallbackUser: LoggedInUser = {
              id: session.user.id,
              username: session.user.email?.split('@')[0] || 'User',
              fullName: session.user.email || 'User',
              role: 'admin',
            };
            setCurrentUser(fallbackUser);
            setIsAuthenticated(true);
            localStorage.setItem('currentUser', JSON.stringify(fallbackUser));
          }
        } else {
          // No session, check localStorage for fallback
          const savedUser = localStorage.getItem('currentUser');
          if (savedUser) {
            const user: LoggedInUser = JSON.parse(savedUser);
            setCurrentUser(user);
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.warn('Error checking Supabase session, using localStorage fallback:', error);
        // Fallback to localStorage
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          const user: LoggedInUser = JSON.parse(savedUser);
          setCurrentUser(user);
          setIsAuthenticated(true);
        }
      }
    };
    
    checkSession();
    
    // Listen for auth changes
    let subscription: any = null;
    
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Handle sign in - get user data from app_users table
          supabase
            .from('app_users')
            .select('*')
            .eq('username', session.user.email?.split('@')[0] || 'admin')
            .single()
            .then(({ data: userData, error }) => {
              if (userData && !error) {
                const loggedInUser: LoggedInUser = {
                  id: userData.id,
                  username: userData.username,
                  fullName: userData.full_name || userData.username,
                  role: userData.role as any,
                };
                setCurrentUser(loggedInUser);
                setIsAuthenticated(true);
                localStorage.setItem('currentUser', JSON.stringify(loggedInUser));
              } else {
                // Fallback
                const fallbackUser: LoggedInUser = {
                  id: session.user.id,
                  username: session.user.email?.split('@')[0] || 'User',
                  fullName: session.user.email || 'User',
                  role: 'admin',
                };
                setCurrentUser(fallbackUser);
                setIsAuthenticated(true);
                localStorage.setItem('currentUser', JSON.stringify(fallbackUser));
              }
            })
            .catch(error => {
              console.warn('Error fetching user data on auth change, using fallback:', error);
              // Fallback
              const fallbackUser: LoggedInUser = {
                id: session.user.id,
                username: session.user.email?.split('@')[0] || 'User',
                fullName: session.user.email || 'User',
                role: 'admin',
              };
              setCurrentUser(fallbackUser);
              setIsAuthenticated(true);
              localStorage.setItem('currentUser', JSON.stringify(fallbackUser));
            });
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem('currentUser');
        }
      });
      subscription = data.subscription;
    }
    
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
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
    const storedUsers: User[] = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
    const foundUser = storedUsers.find(u => u.username.toLowerCase() === username.toLowerCase());

    let userToSet: LoggedInUser;

    if (foundUser) {
      userToSet = {
        id: foundUser.id,
        username: foundUser.username,
        fullName: foundUser.fullName || foundUser.username, 
        role: foundUser.role,
      };
    } else {
      // Fallback for simulated users not in UsersPage list, or first-time admin.
      // The role is now determined automatically instead of being selected.
      const defaultRole = username === 'Admin User' ? UserAccessLevel.ADMIN : DEFAULT_USER_ACCESS_LEVEL;
      userToSet = {
        id: username, // Use username as ID for simulated/unmanaged users
        username: username,
        fullName: username, // Default fullName to username
        role: defaultRole,
      };
    }
    
    setCurrentUser(userToSet);
    setIsAuthenticated(true);
    localStorage.setItem('currentUser', JSON.stringify(userToSet));
  };

  const handleLogout = async () => {
    // Sign out from Supabase if authenticated
    if (supabase) {
      await supabase.auth.signOut();
    }
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
                  <ProtectedRoute requiredRole={[UserAccessLevel.ADMIN, UserAccessLevel.SALES, UserAccessLevel.VIEWER]}>
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