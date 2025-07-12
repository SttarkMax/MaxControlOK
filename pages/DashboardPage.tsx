import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Quote, Product, CompanyInfo, UserAccessLevel } from '../types';
import BuildingOfficeIcon from '../components/icons/BuildingOfficeIcon';
import SquaresPlusIcon from '../components/icons/SquaresPlusIcon';
import DocumentTextIcon from '../components/icons/DocumentTextIcon';
import CurrencyDollarIcon from '../components/icons/CurrencyDollarIcon';
import PencilIcon from '../components/icons/PencilIcon';
import CheckCircleIcon from '../components/icons/CheckCircleIcon'; 
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import Select from '../components/common/Select';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
  ScriptableContext, // Renamed from ScriptableChartContext for consistency with Chart.js docs, it is an alias for ScriptableContext
  Scriptable // Added Scriptable import
} from 'chart.js';
import { formatCurrency } from '../utils';
import { useQuotes, useProducts, useCompany } from '../hooks/useSupabaseData';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardPageProps {
  userName: string; 
  userRole: UserAccessLevel;
  openGlobalViewDetailsModal: (quote: Quote) => void; 
}

const DashboardPage: React.FC<DashboardPageProps> = ({ userName, userRole, openGlobalViewDetailsModal }) => {
  const { quotes: allQuotes, loading: quotesLoading } = useQuotes();
  const { products, loading: productsLoading } = useProducts();
  const { company: companyDetails } = useCompany();
  
  const [draftQuotes, setDraftQuotes] = useState<Quote[]>([]);
  const [recentAcceptedQuotes, setRecentAcceptedQuotes] = useState<Quote[]>([]);
  const [salesChartData, setSalesChartData] = useState<ChartData<'bar'>>({
    labels: [],
    datasets: [],
  });
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const navigate = useNavigate();

  const companyName = companyDetails?.name || 'Sua Empresa';
  const quoteCount = allQuotes.length;
  const productCount = products.length;

  const acceptedQuotes = useMemo(() => {
    return allQuotes.filter(q => q.status === 'accepted' || q.status === 'converted_to_order');
  }, [allQuotes]);

  useEffect(() => {
    if (!allQuotes.length) return;

    const acceptedForChart = allQuotes.filter(q => q.status === 'accepted' || q.status === 'converted_to_order');
    const currentSentQuotes = allQuotes
      .filter(q => q.status === 'sent')
      .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setDraftQuotes(currentSentQuotes);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthAccepted = allQuotes
      .filter(q => {
        const quoteDate = new Date(q.createdAt);
        return (q.status === 'accepted' || q.status === 'converted_to_order') &&
               quoteDate.getMonth() === currentMonth &&
               quoteDate.getFullYear() === currentYear;
      })
      .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setRecentAcceptedQuotes(currentMonthAccepted);

    // Process sales data for chart
    if (acceptedForChart.length > 0) {
      const years = [...new Set(acceptedForChart.map(q => new Date(q.createdAt).getFullYear()))].sort((a,b) => b - a);
      setAvailableYears(years);
      if (!years.includes(selectedYear) && years.length > 0) {
        setSelectedYear(years[0]); 
      }
    } else {
       setAvailableYears([new Date().getFullYear()]); 
    }
  }, [allQuotes]);

  useEffect(() => { 
    if (!acceptedQuotes.length) return;

    const yearlySales = acceptedQuotes.filter(q => new Date(q.createdAt).getFullYear() === selectedYear);
    const monthlySales: number[] = Array(12).fill(0);

    yearlySales.forEach(quote => {
      const month = new Date(quote.createdAt).getMonth(); 
      monthlySales[month] += quote.totalCash; 
    });

    const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    setSalesChartData({
      labels: monthLabels,
      datasets: [
        {
          label: `Vendas (${selectedYear})`,
          data: monthlySales,
          backgroundColor: 'rgba(234, 179, 8, 0.7)', 
          borderColor: 'rgba(234, 179, 8, 1)', 
          borderWidth: 1,
          borderRadius: 4,
          hoverBackgroundColor: 'rgba(234, 179, 8, 1)',
        },
      ],
    });
  }, [selectedYear, acceptedQuotes]);


  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#f3f4f6', 
          font: { size: 12, family: 'Inter' }
        }
      },
      title: {
        display: true,
        text: `Resumo Mensal de Vendas (${selectedYear})`,
        color: '#f3f4f6', 
        font: { 
          size: 16, 
          family: 'Inter', 
          weight: 600 as Scriptable<number | "bold" | "normal" | "lighter" | "bolder", ScriptableContext<'bar'>>,
        }
      },
      tooltip: {
        backgroundColor: '#000000', 
        titleColor: '#f3f4f6', 
        bodyColor: '#d1d5db', 
        callbacks: {
            label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                    label += ': ';
                }
                if (context.parsed.y !== null) {
                    label += formatCurrency(context.parsed.y);
                }
                return label;
            }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#d1d5db', 
          font: { family: 'Inter' }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)', 
        }
      },
      y: {
        ticks: {
          color: '#d1d5db', 
          font: { family: 'Inter' },
          callback: function(value) {
            return formatCurrency(Number(value));
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)', 
        },
        beginAtZero: true
      }
    }
  };
  
  const yearOptions = availableYears.length > 0 
    ? availableYears.map(year => ({ value: year, label: year.toString() }))
    : [{ value: new Date().getFullYear(), label: new Date().getFullYear().toString() }];

  if (quotesLoading || productsLoading) {
    return (
      <div className="p-6 text-white flex items-center justify-center">
        <Spinner size="lg" />
        <div className="ml-3">
          <span>Carregando dados do painel...</span>
          <div className="text-xs text-gray-400 mt-1">
            Conectando ao Supabase e carregando todas as informações...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-semibold text-white mb-2">{getGreeting()}, {userName}!</h1>
      <p className="text-gray-300 mb-8">Bem-vindo(a) ao painel de controle da {companyName}.</p>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link to="/products" className="block p-6 bg-[#1d1d1d] rounded-xl shadow-lg hover:shadow-xl hover:bg-[#282828] transition-all duration-300 ease-in-out">
          <div className="flex items-center">
            <SquaresPlusIcon className="h-10 w-10 text-yellow-500 mr-4" />
            <div>
              <p className="text-3xl font-bold text-white">{productCount}</p>
              <p className="text-gray-300">Produtos Cadastrados</p>
            </div>
          </div>
        </Link>
        <Link to="/quotes/all" className="block p-6 bg-[#1d1d1d] rounded-xl shadow-lg hover:shadow-xl hover:bg-[#282828] transition-all duration-300 ease-in-out">
          <div className="flex items-center">
            <DocumentTextIcon className="h-10 w-10 text-yellow-400 mr-4" />
            <div>
              <p className="text-3xl font-bold text-white">{quoteCount}</p>
              <p className="text-gray-300">Orçamentos Criados (Ver Todos)</p>
            </div>
          </div>
        </Link>
        {userRole === UserAccessLevel.ADMIN && (
            <Link to="/settings" className="block p-6 bg-[#1d1d1d] rounded-xl shadow-lg hover:shadow-xl hover:bg-[#282828] transition-all duration-300 ease-in-out">
            <div className="flex items-center">
                <BuildingOfficeIcon className="h-10 w-10 text-yellow-300 mr-4" />
                <div>
                <p className="text-xl font-semibold text-white">Configurar Empresa</p>
                <p className="text-gray-300">Gerenciar dados e logo</p>
                </div>
            </div>
            </Link>
        )}
      </div>

      {/* Recent Accepted Quotes Section */}
      <div className="bg-[#1d1d1d] p-6 rounded-xl shadow-lg mb-8">
        <div className="flex items-center mb-4">
            <CheckCircleIcon className="h-6 w-6 text-green-500 mr-2" />
            <h2 className="text-xl font-semibold text-white">Orçamentos Fechados Este Mês</h2>
        </div>
        {recentAcceptedQuotes.length > 0 ? (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#282828]">
                    <thead className="bg-[#282828]">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Número</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Cliente</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Data Aceite</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Valor</th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-400 uppercase">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="bg-[#1d1d1d] divide-y divide-[#282828]">
                        {recentAcceptedQuotes.map(quote => (
                            <tr key={quote.id} className="hover:bg-[#3a3a3a]">
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-green-400">{quote.quoteNumber}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{quote.clientName}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{new Date(quote.createdAt).toLocaleDateString('pt-BR')}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-200 text-right">{formatCurrency(quote.totalCash)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                                    <Button 
                                        onClick={() => openGlobalViewDetailsModal(quote)}
                                        variant="outline" 
                                        size="sm"
                                    >
                                        Ver Detalhes
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : (
            <p className="text-gray-400">Nenhum orçamento fechado este mês.</p>
        )}
      </div>
      
      {/* Draft Quotes Section */}
      <div className="bg-[#1d1d1d] p-6 rounded-xl shadow-lg mb-8">
        <div className="flex items-center mb-4">
            <PencilIcon className="h-6 w-6 text-yellow-500 mr-2" />
            <h2 className="text-xl font-semibold text-white">Orçamentos em Aberto (Enviados)</h2>
        </div>
        {draftQuotes.length > 0 ? (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#282828]">
                    <thead className="bg-[#282828]">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Número</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Cliente</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Data</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Total (À Vista)</th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-400 uppercase">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="bg-[#1d1d1d] divide-y divide-[#282828]">
                        {draftQuotes.map(quote => (
                            <tr key={quote.id} className="hover:bg-[#3a3a3a]">
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-yellow-400">{quote.quoteNumber}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{quote.clientName}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{new Date(quote.createdAt).toLocaleDateString('pt-BR')}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-200 text-right">{formatCurrency(quote.totalCash)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                                    <Button 
                                        onClick={() => navigate(`/quotes/edit/${quote.id}`)}
                                        variant="outline" 
                                        size="sm"
                                        iconLeft={<PencilIcon className="w-4 h-4"/>}
                                    >
                                        Editar
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : (
            <p className="text-gray-400">Nenhum orçamento enviado aguardando resposta.</p>
        )}
      </div>
      
      {/* Sales Chart Section */}
      <div className="bg-[#1d1d1d] p-6 rounded-xl shadow-lg mb-8">
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
                <CurrencyDollarIcon className="h-6 w-6 text-yellow-500 mr-2" />
                <h2 className="text-xl font-semibold text-white">Vendas Realizadas (Orçamentos Aceitos)</h2>
            </div>
            <div className="w-40">
                 <Select
                    label="Filtrar por Ano:"
                    options={yearOptions}
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="text-sm bg-black"
                />
            </div>
        </div>
        <div className="h-80 md:h-96 relative">
          {salesChartData.datasets.length > 0 && salesChartData.datasets[0].data.some(d => typeof d === 'number' && d > 0) ? (
            <Bar options={chartOptions} data={salesChartData} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Nenhuma venda realizada para o ano de {selectedYear}.</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="bg-[#1d1d1d] p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-white mb-4">Ações Rápidas</h2>
        <div className="flex flex-wrap gap-4">
          <Link to="/quotes/new">
            <Button variant="primary">Novo Orçamento</Button>
          </Link>
          <Link to="/products">
            <Button variant="secondary">Ver Produtos</Button>
          </Link>
           <Link to="/customers">
            <Button variant="secondary">Ver Clientes</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;