
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Quote } from '../types';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import DocumentTextIcon from '../components/icons/DocumentTextIcon';
import PlusIcon from '../components/icons/PlusIcon';
import { translateQuoteStatus, formatCurrency } from '../utils';
import { useQuotes } from '../hooks/useSupabaseData';

interface AllQuotesPageProps {
  openGlobalViewDetailsModal: (quote: Quote) => void;
}

const AllQuotesPage: React.FC<AllQuotesPageProps> = ({ openGlobalViewDetailsModal }) => {
  const { quotes: allQuotes, loading } = useQuotes();
  const navigate = useNavigate();

  const sortedQuotes = [...allQuotes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getStatusColorClass = (status: Quote['status']): string => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-600 text-black';
      case 'sent':
        return 'bg-blue-600 text-white';
      case 'accepted':
      case 'converted_to_order':
        return 'bg-green-600 text-white';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-600 text-white';
      default:
        return 'bg-gray-600 text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-white flex items-center justify-center">
        <Spinner size="lg" />
        <span className="ml-3">Carregando orçamentos...</span>
      </div>
    );
  }

  return (
    <div className="p-6 text-gray-300">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <DocumentTextIcon className="h-8 w-8 text-yellow-500 mr-3" />
          <h2 className="text-2xl font-semibold text-white">Todos os Orçamentos</h2>
        </div>
        <Button onClick={() => navigate('/quotes/new')} variant="primary" iconLeft={<PlusIcon className="w-5 h-5"/>}>
          Criar Novo Orçamento
        </Button>
      </div>

      {sortedQuotes.length === 0 ? (
        <div className="text-center py-10 bg-[#282828] shadow-xl rounded-lg">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-500" />
          <h3 className="mt-2 text-sm font-medium text-white">Nenhum orçamento encontrado</h3>
          <p className="mt-1 text-sm text-gray-400">Comece criando um novo orçamento.</p>
          <div className="mt-6">
            <Button onClick={() => navigate('/quotes/new')} variant="primary" iconLeft={<PlusIcon className="w-4 h-4"/>}>
              Criar Novo Orçamento
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-[#282828] shadow-xl rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-[#282828]">
            <thead className="bg-[#282828]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Número</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Data Criação</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Vendedor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Valor (À Vista)</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-[#282828] divide-y divide-[#282828]">
              {sortedQuotes.map(quote => (
                <tr key={quote.id} className="hover:bg-[#3a3a3a]/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-yellow-400">{quote.quoteNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{quote.clientName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{new Date(quote.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{quote.salespersonFullName || quote.salespersonUsername}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 text-xs rounded-full font-semibold ${getStatusColorClass(quote.status)}`}>
                      {translateQuoteStatus(quote.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 text-right">{formatCurrency(quote.totalCash)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
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
      )}
    </div>
  );
};

export default AllQuotesPage;