/**
 * Sistema de Testes de Integração para MaxControl
 * 
 * Este arquivo contém testes para validar a integração entre frontend e backend
 */

import { supabase, testSupabaseConnection } from './lib/supabase';
import { 
  companyService, 
  categoryService, 
  productService, 
  customerService, 
  quoteService,
  userService 
} from './services/supabaseService';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  duration?: number;
}

class SystemIntegrationTester {
  private results: TestResult[] = [];

  async runAllTests(): Promise<TestResult[]> {
    console.log('🚀 Iniciando testes de integração do sistema...');
    
    await this.testSupabaseConnection();
    await this.testCompanyService();
    await this.testCategoryService();
    await this.testProductService();
    await this.testCustomerService();
    await this.testQuoteService();
    await this.testUserService();
    await this.testDataConsistency();
    
    this.printResults();
    return this.results;
  }

  private async testSupabaseConnection() {
    const startTime = Date.now();
    try {
      const isConnected = await testSupabaseConnection();
      this.results.push({
        test: 'Conexão Supabase',
        status: isConnected ? 'PASS' : 'FAIL',
        message: isConnected ? 'Conexão estabelecida com sucesso' : 'Falha na conexão',
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.results.push({
        test: 'Conexão Supabase',
        status: 'FAIL',
        message: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        duration: Date.now() - startTime
      });
    }
  }

  private async testCompanyService() {
    const startTime = Date.now();
    try {
      const company = await companyService.getCompany();
      this.results.push({
        test: 'Company Service - Get',
        status: 'PASS',
        message: `Empresa carregada: ${company?.name || 'Nenhuma empresa'}`,
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.results.push({
        test: 'Company Service - Get',
        status: 'FAIL',
        message: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        duration: Date.now() - startTime
      });
    }
  }

  private async testCategoryService() {
    const startTime = Date.now();
    try {
      const categories = await categoryService.getCategories();
      this.results.push({
        test: 'Category Service - Get All',
        status: 'PASS',
        message: `${categories.length} categorias carregadas`,
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.results.push({
        test: 'Category Service - Get All',
        status: 'FAIL',
        message: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        duration: Date.now() - startTime
      });
    }
  }

  private async testProductService() {
    const startTime = Date.now();
    try {
      const products = await productService.getProducts();
      this.results.push({
        test: 'Product Service - Get All',
        status: 'PASS',
        message: `${products.length} produtos carregados`,
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.results.push({
        test: 'Product Service - Get All',
        status: 'FAIL',
        message: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        duration: Date.now() - startTime
      });
    }
  }

  private async testCustomerService() {
    const startTime = Date.now();
    try {
      const customers = await customerService.getCustomers();
      this.results.push({
        test: 'Customer Service - Get All',
        status: 'PASS',
        message: `${customers.length} clientes carregados`,
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.results.push({
        test: 'Customer Service - Get All',
        status: 'FAIL',
        message: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        duration: Date.now() - startTime
      });
    }
  }

  private async testQuoteService() {
    const startTime = Date.now();
    try {
      const quotes = await quoteService.getQuotes();
      const quotesWithItems = quotes.filter(q => q.items && q.items.length > 0);
      
      this.results.push({
        test: 'Quote Service - Get All',
        status: 'PASS',
        message: `${quotes.length} orçamentos carregados (${quotesWithItems.length} com itens)`,
        duration: Date.now() - startTime
      });

      // Test específico para items
      if (quotes.length > 0 && quotesWithItems.length === 0) {
        this.results.push({
          test: 'Quote Items Loading',
          status: 'FAIL',
          message: 'Orçamentos encontrados mas nenhum item carregado',
          duration: 0
        });
      } else if (quotesWithItems.length > 0) {
        this.results.push({
          test: 'Quote Items Loading',
          status: 'PASS',
          message: `Items carregados corretamente em ${quotesWithItems.length} orçamentos`,
          duration: 0
        });
      }
    } catch (error) {
      this.results.push({
        test: 'Quote Service - Get All',
        status: 'FAIL',
        message: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        duration: Date.now() - startTime
      });
    }
  }

  private async testUserService() {
    const startTime = Date.now();
    try {
      const users = await userService.getUsers();
      this.results.push({
        test: 'User Service - Get All',
        status: 'PASS',
        message: `${users.length} usuários carregados`,
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.results.push({
        test: 'User Service - Get All',
        status: 'FAIL',
        message: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        duration: Date.now() - startTime
      });
    }
  }

  private async testDataConsistency() {
    const startTime = Date.now();
    try {
      // Test referential integrity
      const quotes = await quoteService.getQuotes();
      const customers = await customerService.getCustomers();
      const products = await productService.getProducts();

      let inconsistencies = 0;

      // Check quote-customer relationships
      for (const quote of quotes) {
        if (quote.customerId && !customers.find(c => c.id === quote.customerId)) {
          inconsistencies++;
        }
      }

      // Check quote items-product relationships
      for (const quote of quotes) {
        for (const item of quote.items || []) {
          if (item.productId && !products.find(p => p.id === item.productId)) {
            inconsistencies++;
          }
        }
      }

      this.results.push({
        test: 'Data Consistency Check',
        status: inconsistencies === 0 ? 'PASS' : 'FAIL',
        message: inconsistencies === 0 
          ? 'Todos os relacionamentos estão consistentes' 
          : `${inconsistencies} inconsistências encontradas`,
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.results.push({
        test: 'Data Consistency Check',
        status: 'FAIL',
        message: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        duration: Date.now() - startTime
      });
    }
  }

  private printResults() {
    console.log('\n📊 RESULTADOS DOS TESTES DE INTEGRAÇÃO\n');
    console.log('=' .repeat(60));
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;
    
    this.results.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
      const duration = result.duration ? ` (${result.duration}ms)` : '';
      console.log(`${icon} ${result.test}${duration}`);
      console.log(`   ${result.message}\n`);
    });
    
    console.log('=' .repeat(60));
    console.log(`📈 RESUMO: ${passed} passou | ${failed} falhou | ${skipped} pulou`);
    console.log(`🎯 Taxa de sucesso: ${((passed / this.results.length) * 100).toFixed(1)}%`);
    console.log('=' .repeat(60));
  }
}

// Export para uso em desenvolvimento
export const runSystemTests = async () => {
  const tester = new SystemIntegrationTester();
  return await tester.runAllTests();
};

// Auto-run em desenvolvimento (comentar em produção)
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  // Executar testes após 3 segundos para dar tempo do app carregar
  setTimeout(() => {
    runSystemTests().catch(console.error);
  }, 3000);
}