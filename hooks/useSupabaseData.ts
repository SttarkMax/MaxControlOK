import { useState, useEffect } from 'react';
import { isSupabaseConfigured } from '../lib/supabase';
import { 
  companyService,
  categoryService,
  productService,
  customerService,
  quoteService,
  supplierService,
  accountsPayableService,
  userService
} from '../services/supabaseService';
import { 
  CompanyInfo, 
  Category, 
  Product, 
  Customer, 
  Quote,
  Supplier,
  Debt,
  SupplierCredit,
  AccountsPayableEntry,
  User
} from '../types';

// Company hook
export const useCompany = () => {
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCompany = async () => {
    try {
      setLoading(true);
      
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        setCompany({
          name: 'Sua Empresa',
          logoUrlDarkBg: '',
          logoUrlLightBg: '',
          address: '',
          phone: '',
          email: '',
          cnpj: '',
          instagram: '',
          website: '',
        });
        setError('Aplicação funcionando em modo offline');
        return;
      }
      
      const data = await companyService.getCompany();
      setCompany(data);
      setError(null);
    } catch (err) {
      console.error('Error loading company:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar empresa';
      
      // Check for missing table error
      if (errorMessage.includes('does not exist') || (err as any)?.code === '42P01') {
        setError('Banco de dados não configurado - funcionando em modo offline');
      } else {
        setError(errorMessage);
      }
      
      // Set default company data on network error
      if (errorMessage.includes('Conexão com o banco de dados falhou') || 
          errorMessage.includes('does not exist') || 
          (err as any)?.code === '42P01') {
        setCompany({
          name: 'Sua Empresa',
          logoUrlDarkBg: '',
          logoUrlLightBg: '',
          address: '',
          phone: '',
          email: '',
          cnpj: '',
          instagram: '',
          website: '',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const saveCompany = async (companyData: CompanyInfo) => {
    try {
      await companyService.saveCompany(companyData);
      setCompany(companyData);
      setError(null);
    } catch (err) {
      console.error('Error saving company:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar empresa');
      throw err;
    }
  };

  useEffect(() => {
    loadCompany();
  }, []);

  return { company, loading, error, saveCompany, refetch: loadCompany };
};

// Categories hook
export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = async () => {
    try {
      setLoading(true);
      
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        setCategories([]);
        setError('Aplicação funcionando em modo offline');
        return;
      }
      
      const data = await categoryService.getCategories();
      setCategories(data);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar categorias';
      setError(errorMessage);
      
      // Set empty array on network error
      if (errorMessage.includes('Conexão com o banco de dados falhou')) {
        setCategories([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (category: Omit<Category, 'id'>) => {
    try {
      const newCategory = await categoryService.createCategory(category);
      setCategories(prev => [...prev, newCategory]);
      setError(null);
      return newCategory;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar categoria');
      throw err;
    }
  };

  const updateCategory = async (category: Category) => {
    try {
      await categoryService.updateCategory(category);
      setCategories(prev => prev.map(c => c.id === category.id ? category : c));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar categoria');
      throw err;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await categoryService.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir categoria');
      throw err;
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  return { 
    categories, 
    loading, 
    error, 
    createCategory, 
    updateCategory, 
    deleteCategory, 
    refetch: loadCategories 
  };
};

// Products hook
export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        setProducts([]);
        setError('Aplicação funcionando em modo offline');
        return;
      }
      
      const data = await productService.getProducts();
      setProducts(data);
      setError(null);
    } catch (err) {
      console.warn('🔌 Products hook - switching to offline mode');
      setProducts([]);
      setError('Aplicação funcionando em modo offline');
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (product: Omit<Product, 'id'>) => {
    try {
      const newProduct = await productService.createProduct(product);
      setProducts(prev => [...prev, newProduct]);
      setError(null);
      return newProduct;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar produto');
      throw err;
    }
  };

  const updateProduct = async (product: Product) => {
    try {
      await productService.updateProduct(product);
      setProducts(prev => prev.map(p => p.id === product.id ? product : p));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar produto');
      throw err;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await productService.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir produto');
      throw err;
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return { 
    products, 
    loading, 
    error, 
    createProduct, 
    updateProduct, 
    deleteProduct, 
    refetch: loadProducts 
  };
};

// Customers hook
export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        setCustomers([]);
        setError('Aplicação funcionando em modo offline');
        return;
      }
      
      const data = await customerService.getCustomers();
      setCustomers(data);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar clientes';
      setError(errorMessage);
      
      // Set empty array on network error
      if (errorMessage.includes('Conexão com o banco de dados falhou')) {
        setCustomers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const createCustomer = async (customer: Omit<Customer, 'id'>) => {
    try {
      const newCustomer = await customerService.createCustomer(customer);
      setCustomers(prev => [...prev, newCustomer]);
      setError(null);
      return newCustomer;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar cliente');
      throw err;
    }
  };

  const updateCustomer = async (customer: Customer) => {
    try {
      await customerService.updateCustomer(customer);
      setCustomers(prev => prev.map(c => c.id === customer.id ? customer : c));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar cliente');
      throw err;
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      await customerService.deleteCustomer(id);
      setCustomers(prev => prev.filter(c => c.id !== id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir cliente');
      throw err;
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  return { 
    customers, 
    loading, 
    error, 
    createCustomer, 
    updateCustomer, 
    deleteCustomer, 
    refetch: loadCustomers 
  };
};

// Quotes hook
export const useQuotes = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        setQuotes([]);
        setError('Aplicação funcionando em modo offline');
        return;
      }
      
      const data = await quoteService.getQuotes();
      setQuotes(data);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar orçamentos';
      
      // Check for missing table error
      if (errorMessage.includes('does not exist') || (err as any)?.code === '42P01') {
        setError('Banco de dados não configurado - funcionando em modo offline');
      } else {
        setError(errorMessage);
      }
      
      // Set empty array on network error to prevent app crash
      if (errorMessage.includes('Conexão com o banco de dados falhou') || 
          errorMessage.includes('does not exist') || 
          (err as any)?.code === '42P01') {
        setQuotes([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const createQuote = async (quote: Omit<Quote, 'id'>) => {
    try {
      const newQuote = await quoteService.createQuote(quote);
      setQuotes(prev => [newQuote, ...prev]);
      setError(null);
      return newQuote;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar orçamento');
      throw err;
    }
  };

  const updateQuote = async (quote: Quote) => {
    try {
      await quoteService.updateQuote(quote);
      setQuotes(prev => prev.map(q => q.id === quote.id ? quote : q));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar orçamento');
      throw err;
    }
  };

  const deleteQuote = async (id: string) => {
    try {
      await quoteService.deleteQuote(id);
      setQuotes(prev => prev.filter(q => q.id !== id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir orçamento');
      throw err;
    }
  };

  useEffect(() => {
    loadQuotes();
  }, []);

  return { 
    quotes, 
    loading, 
    error, 
    createQuote, 
    updateQuote, 
    deleteQuote, 
    refetch: loadQuotes 
  };
};

// Suppliers hook
export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [credits, setCredits] = useState<SupplierCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        setSuppliers([]);
        setDebts([]);
        setCredits([]);
        setError('Aplicação funcionando em modo offline');
        return;
      }
      
      const [suppliersData, debtsData, creditsData] = await Promise.all([
        supplierService.getSuppliers(),
        supplierService.getSupplierDebts(),
        supplierService.getSupplierCredits(),
      ]);
      setSuppliers(suppliersData);
      setDebts(debtsData);
      setCredits(creditsData);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar fornecedores';
      setError(errorMessage);
      
      // Set empty arrays on network error
      if (errorMessage.includes('Conexão com o banco de dados falhou')) {
        setSuppliers([]);
        setDebts([]);
        setCredits([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const createSupplier = async (supplier: Omit<Supplier, 'id'>) => {
    try {
      const newSupplier = await supplierService.createSupplier(supplier);
      setSuppliers(prev => [...prev, newSupplier]);
      setError(null);
      return newSupplier;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar fornecedor');
      throw err;
    }
  };

  const updateSupplier = async (supplier: Supplier) => {
    try {
      await supplierService.updateSupplier(supplier);
      setSuppliers(prev => prev.map(s => s.id === supplier.id ? supplier : s));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar fornecedor');
      throw err;
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      await supplierService.deleteSupplier(id);
      setSuppliers(prev => prev.filter(s => s.id !== id));
      setDebts(prev => prev.filter(d => d.supplierId !== id));
      setCredits(prev => prev.filter(c => c.supplierId !== id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir fornecedor');
      throw err;
    }
  };

  const createDebt = async (debt: Omit<Debt, 'id'>) => {
    try {
      const newDebt = await supplierService.createSupplierDebt(debt);
      setDebts(prev => [newDebt, ...prev]);
      setError(null);
      return newDebt;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar dívida');
      throw err;
    }
  };

  const deleteDebt = async (id: string) => {
    try {
      await supplierService.deleteSupplierDebt(id);
      setDebts(prev => prev.filter(d => d.id !== id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir dívida');
      throw err;
    }
  };

  const createCredit = async (credit: Omit<SupplierCredit, 'id'>) => {
    try {
      const newCredit = await supplierService.createSupplierCredit(credit);
      setCredits(prev => [newCredit, ...prev]);
      setError(null);
      return newCredit;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar pagamento');
      throw err;
    }
  };

  const deleteCredit = async (id: string) => {
    try {
      await supplierService.deleteSupplierCredit(id);
      setCredits(prev => prev.filter(c => c.id !== id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir pagamento');
      throw err;
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return { 
    suppliers, 
    debts, 
    credits, 
    loading, 
    error, 
    createSupplier, 
    updateSupplier, 
    deleteSupplier,
    createDebt,
    deleteDebt,
    createCredit,
    deleteCredit,
    refetch: loadData 
  };
};

// Accounts Payable hook
export const useAccountsPayable = () => {
  const [entries, setEntries] = useState<AccountsPayableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEntries = async () => {
    try {
      setLoading(true);
      
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        setEntries([]);
        setError('Aplicação funcionando em modo offline');
        return;
      }
      
      const data = await accountsPayableService.getAccountsPayable();
      setEntries(data);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar contas a pagar';
      setError(errorMessage);
      
      // Set empty array on network error
      if (errorMessage.includes('Conexão com o banco de dados falhou')) {
        setEntries([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const createEntries = async (newEntries: Omit<AccountsPayableEntry, 'id'>[]) => {
    try {
      const createdEntries = await accountsPayableService.createAccountsPayable(newEntries);
      setEntries(prev => [...prev, ...createdEntries].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
      setError(null);
      return createdEntries;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar contas a pagar');
      throw err;
    }
  };

  const updateEntry = async (entry: AccountsPayableEntry) => {
    try {
      await accountsPayableService.updateAccountsPayable(entry);
      setEntries(prev => prev.map(e => e.id === entry.id ? entry : e).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar conta a pagar');
      throw err;
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      await accountsPayableService.deleteAccountsPayable(id);
      setEntries(prev => prev.filter(e => e.id !== id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir conta a pagar');
      throw err;
    }
  };

  const deleteEntriesBySeries = async (seriesId: string) => {
    try {
      await accountsPayableService.deleteAccountsPayableBySeries(seriesId);
      setEntries(prev => prev.filter(e => e.seriesId !== seriesId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir série de contas a pagar');
      throw err;
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  return { 
    entries, 
    loading, 
    error, 
    createEntries, 
    updateEntry, 
    deleteEntry, 
    deleteEntriesBySeries,
    refetch: loadEntries 
  };
};

// Users hook
export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        setUsers([]);
        setError('Aplicação funcionando em modo offline');
        return;
      }
      
      const data = await userService.getUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar usuários';
      setError(errorMessage);
      
      // Set empty array on network error
      if (errorMessage.includes('Conexão com o banco de dados falhou')) {
        setUsers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (user: Omit<User, 'id'> & { password: string }) => {
    try {
      const newUser = await userService.createUser(user);
      setUsers(prev => [...prev, newUser]);
      setError(null);
      return newUser;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar usuário');
      throw err;
    }
  };

  const updateUser = async (user: User & { password?: string }) => {
    try {
      await userService.updateUser(user);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...user, password: '' } : u));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar usuário');
      throw err;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await userService.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir usuário');
      throw err;
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return { 
    users, 
    loading, 
    error, 
    createUser, 
    updateUser, 
    deleteUser, 
    refetch: loadUsers 
  };
};