import bcrypt from 'bcryptjs';
import { supabase, handleSupabaseError } from '../lib/supabase';
import { 
  CompanyInfo, 
  Category, 
  Product, 
  Customer, 
  DownPaymentEntry, 
  Quote, 
  QuoteItem,
  Supplier,
  Debt,
  SupplierCredit,
  AccountsPayableEntry,
  User,
  UserAccessLevel
} from '../types';

// Helper function to check if Supabase is configured
const checkSupabaseConnection = () => {
  if (!supabase) {
    throw new Error('SUPABASE_NOT_CONFIGURED');
  }
  return true;
};

// Helper function to generate unique IDs
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Company Services
export const companyService = {
  async getCompany(): Promise<CompanyInfo | null> {
    try {
      checkSupabaseConnection();
      // This will throw SUPABASE_NOT_CONFIGURED
    } catch (error) {
      // Use localStorage fallback
      const stored = localStorage.getItem('companyInfo');
      if (stored) {
        return JSON.parse(stored);
      }
      return {
        name: 'Sua Empresa',
        logoUrlDarkBg: '',
        logoUrlLightBg: '',
        address: '',
        phone: '',
        email: '',
        cnpj: '',
        instagram: '',
        website: '',
      };
    }
  },

  async saveCompany(company: CompanyInfo): Promise<void> {
    try {
      checkSupabaseConnection();
      // This will throw SUPABASE_NOT_CONFIGURED
    } catch (error) {
      // Save to localStorage
      localStorage.setItem('companyInfo', JSON.stringify(company));
    }
  }
};

// Category Services
export const categoryService = {
  async getCategories(): Promise<Category[]> {
    try {
      checkSupabaseConnection();
    } catch (error) {
      const stored = localStorage.getItem('categories');
      return stored ? JSON.parse(stored) : [];
    }
  },

  async createCategory(category: Omit<Category, 'id'>): Promise<Category> {
    try {
      checkSupabaseConnection();
    } catch (error) {
      const newCategory = { ...category, id: generateId() };
      const stored = localStorage.getItem('categories');
      const categories = stored ? JSON.parse(stored) : [];
      categories.push(newCategory);
      localStorage.setItem('categories', JSON.stringify(categories));
      return newCategory;
    }
  },

  async updateCategory(category: Category): Promise<void> {
    try {
      checkSupabaseConnection();
    } catch (error) {
      const stored = localStorage.getItem('categories');
      const categories = stored ? JSON.parse(stored) : [];
      const index = categories.findIndex((c: Category) => c.id === category.id);
      if (index !== -1) {
        categories[index] = category;
        localStorage.setItem('categories', JSON.stringify(categories));
      }
    }
  },

  async deleteCategory(id: string): Promise<void> {
    try {
      checkSupabaseConnection();
    } catch (error) {
      const stored = localStorage.getItem('categories');
      const categories = stored ? JSON.parse(stored) : [];
      const filtered = categories.filter((c: Category) => c.id !== id);
      localStorage.setItem('categories', JSON.stringify(filtered));
    }
  }
};

// Product Services
export const productService = {
  async getProducts(): Promise<Product[]> {
    try {
      checkSupabaseConnection();
    } catch (error) {
      const stored = localStorage.getItem('products');
      return stored ? JSON.parse(stored) : [];
    }
  },

  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    try {
      checkSupabaseConnection();
    } catch (error) {
      const newProduct = { ...product, id: generateId() };
      const stored = localStorage.getItem('products');
      const products = stored ? JSON.parse(stored) : [];
      products.push(newProduct);
      localStorage.setItem('products', JSON.stringify(products));
      return newProduct;
    }
  },

  async updateProduct(product: Product): Promise<void> {
    try {
      checkSupabaseConnection();
    } catch (error) {
      const stored = localStorage.getItem('products');
      const products = stored ? JSON.parse(stored) : [];
      const index = products.findIndex((p: Product) => p.id === product.id);
      if (index !== -1) {
        products[index] = product;
        localStorage.setItem('products', JSON.stringify(products));
      }
    }
  },

  async deleteProduct(id: string): Promise<void> {
    try {
      checkSupabaseConnection();
    } catch (error) {
      const stored = localStorage.getItem('products');
      const products = stored ? JSON.parse(stored) : [];
      const filtered = products.filter((p: Product) => p.id !== id);
      localStorage.setItem('products', JSON.stringify(filtered));
    }
  }
};

// Customer Services
export const customerService = {
  async getCustomers(): Promise<Customer[]> {
    try {
      checkSupabaseConnection();
    } catch (error) {
      const stored = localStorage.getItem('customers');
      return stored ? JSON.parse(stored) : [];
    }
  },

  async createCustomer(customer: Omit<Customer, 'id'>): Promise<Customer> {
    try {
      checkSupabaseConnection();
    } catch (error) {
      const newCustomer = { ...customer, id: generateId() };
      const stored = localStorage.getItem('customers');
      const customers = stored ? JSON.parse(stored) : [];
      customers.push(newCustomer);
      localStorage.setItem('customers', JSON.stringify(customers));
      return newCustomer;
    }
  },

  async updateCustomer(customer: Customer): Promise<void> {
    try {
      checkSupabaseConnection();
    } catch (error) {
      const stored = localStorage.getItem('customers');
      const customers = stored ? JSON.parse(stored) : [];
      const index = customers.findIndex((c: Customer) => c.id === customer.id);
      if (index !== -1) {
        customers[index] = customer;
        localStorage.setItem('customers', JSON.stringify(customers));
      }
    }
  },

  async deleteCustomer(id: string): Promise<void> {
    try {
      checkSupabaseConnection();
    } catch (error) {
      const stored = localStorage.getItem('customers');
      const customers = stored ? JSON.parse(stored) : [];
      const filtered = customers.filter((c: Customer) => c.id !== id);
      localStorage.setItem('customers', JSON.stringify(filtered));
    }
  }
};

// Quote Services
export const quoteService = {
  async getQuotes(): Promise<Quote[]> {
    try {
      checkSupabaseConnection();
    } catch (error) {
      const stored = localStorage.getItem('quotes');
      return stored ? JSON.parse(stored) : [];
    }
  },

  async createQuote(quote: Omit<Quote, 'id'>): Promise<Quote> {
    try {
      checkSupabaseConnection();
    } catch (error) {
      const newQuote = { ...quote, id: generateId() };
      const stored = localStorage.getItem('quotes');
      const quotes = stored ? JSON.parse(stored) : [];
      quotes.unshift(newQuote);
      localStorage.setItem('quotes', JSON.stringify(quotes));
      return newQuote;
    }
  },

  async updateQuote(quote: Quote): Promise<void> {
    try {
      checkSupabaseConnection();
    } catch (error) {
      const stored = localStorage.getItem('quotes');
      const quotes = stored ? JSON.parse(stored) : [];
      const index = quotes.findIndex((q: Quote) => q.id === quote.id);
      if (index !== -1) {
        quotes[index] = quote;
        localStorage.setItem('quotes', JSON.stringify(quotes));
      }
    }
  },

  async deleteQuote(id: string): Promise<void> {
    try {
      checkSupabaseConnection();
    } catch (error) {
      const stored = localStorage.getItem('quotes');
      const quotes = stored ? JSON.parse(stored) : [];
      const filtered = quotes.filter((q: Quote) => q.id !== id);
      localStorage.setItem('quotes', JSON.stringify(filtered));
    }
  }
};

// Supplier Services
export const supplierService = {
  async getSuppliers(): Promise<Supplier[]> {
    try {
      checkSupabaseConnection();
    } catch (error) {
      const stored = localStorage.getItem('suppliers');
      return stored ? JSON.parse(stored) : [];
    }
  },

  async createSupplier(supplier: Omit<Supplier, 'id'>): Promise<Supplier> {
    try {
      checkSupabaseConnection();
    } catch (error) {
      const newSupplier = { ...supplier, id: generateId() };
      const stored = localStorage.getItem('suppliers');
      const suppliers = stored ? JSON.parse(stored) : [];
      suppliers.push(newSupplier);
      localStorage.setItem('suppliers', JSON.stringify(suppliers));
      return newSupplier;
    }
  },

  async updateSupplier(supplier: Supplier): Promise<void> {
    try {
      checkSupabaseConnection();
    } catch (error) {
      const stored = localStorage.getItem('suppliers');
      const suppliers = stored ? JSON.parse(stored) : [];
      const index = suppliers.findIndex((s: Supplier) => s.id === supplier.id);
      if (index !== -1) {
        suppliers[index] = supplier;
        localStorage.setItem('suppliers', JSON.stringify(suppliers));
      }
    }
  },

  async deleteSupplier(id: string): Promise<void> {
    try {
      checkSupabaseConnection();
    } catch (error) {
      const stored = localStorage.getItem('suppliers');
      const suppliers = stored ? JSON.parse(stored) : [];
      const filtered = suppliers.filter((s: Supplier) => s.id !== id);
      localStorage.setItem('suppliers', JSON.stringify(filtered));
      
      // Also remove related debts and credits
      const debts = JSON.parse(localStorage.getItem('supplierDebts') || '[]');
      const filteredDebts = debts.filter((d: Debt) => d.supplierId !== id);
      localStorage.setItem('supplierDebts', JSON.stringify(filteredDebts));
      
      const credits = JSON.parse(localStorage.getItem('supplierCredits') || '[]');
      const filteredCredits = credits.filter((c: SupplierCredit) => c.supplierId !== id);
      localStorage.setItem('supplierCredits', JSON.stringify(filteredCredits));
    }
  },

  async getSupplierDebts(): Promise<Debt[]> {
    try {
      checkSupabaseConnection();
    } catch (error) {
      const stored = localStorage.getItem('supplierDebts');
      return stored ? JSON.parse(stored) : [];
    }
  },

  async createSupplierDebt(debt: Omit<Debt, 'id'>): Promise<Debt> {
    try {
      checkSupabaseConnection();
    } catch (error) {
      const newDebt = { ...debt, id: generateId() };
      const stored = localStorage.getItem('supplierDebts');
      const debts = stored ? JSON.parse(stored) : [];
      debts.unshift(newDebt);
      localStorage.setItem('supplierDebts', JSON.stringify(debts));
      return newDebt;
    }
  },

  async deleteSupplierDebt(id: string): Promise<void> {
    try {
      checkSupabaseConnection();
    } catch (error) {
      const stored = localStorage.getItem('supplierDebts');
      const debts = stored ? JSON.parse(stored) : [];
      const filtered = debts.filter((d: Debt) => d.id !== id);
      localStorage.setItem('supplierDebts', JSON.stringify(filtered));
    }
  },

  async getSupplierCredits(): Promise<SupplierCredit[]> {
    try {
      checkSupabaseConnection();
    } catch (error) {
      const stored = localStorage.getItem('supplierCredits');
      return stored ? JSON.parse(stored) : [];
    }
  },

  async createSupplierCredit(credit: Omit<SupplierCredit, 'id'>): Promise<SupplierCredit> {
    try {
      checkSupabaseConnection();
    } catch (error) {
      const newCredit = { ...credit, id: generateId() };
      const stored = localStorage.getItem('supplierCredits');
      const credits = stored ? JSON.parse(stored) : [];
      credits.unshift(newCredit);
      localStorage.setItem('supplierCredits', JSON.stringify(credits));
      return newCredit;
    }
  },

  async deleteSupplierCredit(id: string): Promise<void> {
    try {
      checkSupabaseConnection();
    } catch (error) {
      const stored = localStorage.getItem('supplierCredits');
      const credits = stored ? JSON.parse(stored) : [];
      const filtered = credits.filter((c: SupplierCredit) => c.id !== id);
      localStorage.setItem('supplierCredits', JSON.stringify(filtered));
    }
  }
};

// Accounts Payable Services
export const accountsPayableService = {
  async getAccountsPayable(): Promise<AccountsPayableEntry[]> {
    try {
      checkSupabaseConnection();
    } catch (error) {
      const stored = localStorage.getItem('accountsPayable');
      return stored ? JSON.parse(stored) : [];
    }
  },

  async createAccountsPayable(entries: Omit<AccountsPayableEntry, 'id'>[]): Promise<AccountsPayableEntry[]> {
    try {
      checkSupabaseConnection();
    } catch (error) {
      const newEntries = entries.map(entry => ({ ...entry, id: generateId(), createdAt: new Date().toISOString() }));
      const stored = localStorage.getItem('accountsPayable');
      const allEntries = stored ? JSON.parse(stored) : [];
      allEntries.push(...newEntries);
      localStorage.setItem('accountsPayable', JSON.stringify(allEntries));
      return newEntries;
    }
  },

  async updateAccountsPayable(entry: AccountsPayableEntry): Promise<void> {
    try {
      checkSupabaseConnection();
    } catch (error) {
      const stored = localStorage.getItem('accountsPayable');
      const entries = stored ? JSON.parse(stored) : [];
      const index = entries.findIndex((e: AccountsPayableEntry) => e.id === entry.id);
      if (index !== -1) {
        entries[index] = entry;
        localStorage.setItem('accountsPayable', JSON.stringify(entries));
      }
    }
  },

  async deleteAccountsPayable(id: string): Promise<void> {
    try {
      checkSupabaseConnection();
    } catch (error) {
      const stored = localStorage.getItem('accountsPayable');
      const entries = stored ? JSON.parse(stored) : [];
      const filtered = entries.filter((e: AccountsPayableEntry) => e.id !== id);
      localStorage.setItem('accountsPayable', JSON.stringify(filtered));
    }
  },

  async deleteAccountsPayableBySeries(seriesId: string): Promise<void> {
    try {
      checkSupabaseConnection();
    } catch (error) {
      const stored = localStorage.getItem('accountsPayable');
      const entries = stored ? JSON.parse(stored) : [];
      const filtered = entries.filter((e: AccountsPayableEntry) => e.seriesId !== seriesId);
      localStorage.setItem('accountsPayable', JSON.stringify(filtered));
    }
  }
};

// User Services
export const userService = {
  async getUsers(): Promise<User[]> {
    try {
      checkSupabaseConnection();
    } catch (error) {
      const stored = localStorage.getItem('appUsers');
      return stored ? JSON.parse(stored) : [];
    }
  },

  async createUser(user: Omit<User, 'id'> & { password: string }): Promise<User> {
    try {
      checkSupabaseConnection();
    } catch (error) {
      const newUser = { ...user, id: generateId(), password: '' }; // Don't store password in localStorage
      const stored = localStorage.getItem('appUsers');
      const users = stored ? JSON.parse(stored) : [];
      users.push(newUser);
      localStorage.setItem('appUsers', JSON.stringify(users));
      return newUser;
    }
  },

  async updateUser(user: User & { password?: string }): Promise<void> {
    try {
      checkSupabaseConnection();
    } catch (error) {
      const stored = localStorage.getItem('appUsers');
      const users = stored ? JSON.parse(stored) : [];
      const index = users.findIndex((u: User) => u.id === user.id);
      if (index !== -1) {
        users[index] = { ...user, password: '' }; // Don't store password
        localStorage.setItem('appUsers', JSON.stringify(users));
      }
    }
  },

  async deleteUser(id: string): Promise<void> {
    try {
      checkSupabaseConnection();
    } catch (error) {
      const stored = localStorage.getItem('appUsers');
      const users = stored ? JSON.parse(stored) : [];
      const filtered = users.filter((u: User) => u.id !== id);
      localStorage.setItem('appUsers', JSON.stringify(filtered));
    }
  },

  async authenticateUser(username: string, password: string): Promise<User | null> {
    try {
      checkSupabaseConnection();
    } catch (error) {
      // Simple demo authentication
      if (username === 'admin' && password === 'password123') {
        return {
          id: 'admin',
          username: 'admin',
          fullName: 'Administrador',
          password: '',
          role: UserAccessLevel.ADMIN,
        };
      }
      return null;
    }
  },

  async getUserByEmail(email: string) {
    try {
      checkSupabaseConnection();
    } catch (error) {
      return null;
    }
  }
};