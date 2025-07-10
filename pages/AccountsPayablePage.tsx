

import React, { useState, useMemo } from 'react';
import { AccountsPayableEntry } from '../types';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Textarea from '../components/common/Textarea';
import Spinner from '../components/common/Spinner';
import BanknotesIcon from '../components/icons/BanknotesIcon';
import PlusIcon from '../components/icons/PlusIcon';
import TrashIcon from '../components/icons/TrashIcon';
import PencilIcon from '../components/icons/PencilIcon';
import { formatCurrency, formatDateForInput, addMonths, addWeeks } from '../utils';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from 'chart.js';
import { useAccountsPayable } from '../hooks/useSupabaseData';

ChartJS.register(ArcElement, Tooltip, Legend);

type FilterStatus = 'all' | 'paid' | 'pending';
type TimeFilter = 'all' | 'week' | 'month' | 'specific_month';
type ParcelType = 'none' | 'weekly' | 'monthly';

const initialFormState = {
  name: '',
  totalAmount: 0,
  dueDate: formatDateForInput(new Date()),
  isPaid: false,
  parcelType: 'none' as ParcelType,
  numberOfInstallments: 1,
  notes: '',
};

const AccountsPayablePage: React.FC = () => {
  const { entries, loading, createEntries, updateEntry, deleteEntry, deleteEntriesBySeries } = useAccountsPayable();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentFormData, setCurrentFormData] = useState(initialFormState);
  const [editingEntry, setEditingEntry] = useState<AccountsPayableEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [selectedFilterYear, setSelectedFilterYear] = useState<number>(new Date().getFullYear());
  const [selectedFilterMonth, setSelectedFilterMonth] = useState<number>(new Date().getMonth() + 1); // 1-12

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setCurrentFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'parcelType') {
      setCurrentFormData(prev => ({ ...prev, parcelType: value as ParcelType }));
    }
    else {
       setCurrentFormData(prev => ({ 
        ...prev, 
        [name]: (name === 'totalAmount' || name === 'numberOfInstallments') ? parseFloat(value) || 0 : value 
      }));
    }
  };

  const openModalForNew = () => {
    setEditingEntry(null);
    setCurrentFormData(initialFormState);
    setIsModalOpen(true);
  };

  const openModalForEdit = (entry: AccountsPayableEntry) => {
    setEditingEntry(entry);
    // For editing, we simplify: users edit the specific installment or single entry.
    // Parceling details are not re-editable directly from an installment.
    setCurrentFormData({
      name: entry.name,
      totalAmount: entry.amount, // Editing amount of this specific entry
      dueDate: entry.dueDate,
      isPaid: entry.isPaid,
      parcelType: 'none', // Not applicable when editing single instance
      numberOfInstallments: 1, // Not applicable
      notes: entry.notes || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEntry(null);
    setCurrentFormData(initialFormState);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingEntry) { // Editing existing entry
        const updatedEntry: AccountsPayableEntry = {
          ...editingEntry,
          name: currentFormData.name,
          amount: currentFormData.totalAmount, // This is 'installmentAmount' effectively
          dueDate: currentFormData.dueDate,
          isPaid: currentFormData.isPaid,
          notes: currentFormData.notes,
        };
        await updateEntry(updatedEntry);
      } else { // Adding new entry or series of entries
        const newEntries: Omit<AccountsPayableEntry, 'id'>[] = [];
        const now = new Date().toISOString();
        const seriesId = `series-${Date.now()}`;

        if (currentFormData.parcelType === 'none' || currentFormData.numberOfInstallments <= 0) {
          newEntries.push({
            name: currentFormData.name,
            amount: currentFormData.totalAmount,
            dueDate: currentFormData.dueDate,
            isPaid: currentFormData.isPaid,
            createdAt: now,
            notes: currentFormData.notes,
          });
        } else {
          const installmentAmount = parseFloat((currentFormData.totalAmount / currentFormData.numberOfInstallments).toFixed(2));
          let firstDueDate = new Date(currentFormData.dueDate + "T00:00:00"); // Ensure date is parsed correctly

          for (let i = 0; i < currentFormData.numberOfInstallments; i++) {
            let currentInstallmentDueDate: Date;
            if (i === 0) {
              currentInstallmentDueDate = firstDueDate;
            } else {
              currentInstallmentDueDate = currentFormData.parcelType === 'weekly' 
                ? addWeeks(firstDueDate, i) 
                : addMonths(firstDueDate, i);
            }
            
            newEntries.push({
              name: `${currentFormData.name} - Parcela ${i + 1}/${currentFormData.numberOfInstallments}`,
              amount: i === currentFormData.numberOfInstallments - 1 && currentFormData.numberOfInstallments > 1 && 
                      (installmentAmount * currentFormData.numberOfInstallments !== currentFormData.totalAmount) 
                      ? parseFloat((currentFormData.totalAmount - (installmentAmount * (currentFormData.numberOfInstallments - 1))).toFixed(2))
                      : installmentAmount,
              dueDate: formatDateForInput(currentInstallmentDueDate),
              isPaid: false, // New installments are pending
              seriesId: seriesId,
              totalInstallmentsInSeries: currentFormData.numberOfInstallments,
              installmentNumberOfSeries: i + 1,
              createdAt: now,
              notes: i === 0 ? currentFormData.notes : undefined, // Notes typically on the first
            });
          }
        }
        await createEntries(newEntries);
      }
      closeModal();
    } catch (error) {
      console.error('Erro ao salvar conta a pagar:', error);
      alert('Erro ao salvar conta a pagar. Tente novamente.');
    }

    setIsLoading(false);
  };

  const handleDeleteEntry = async (entryId: string) => {
    const entryToDelete = entries.find(e => e.id === entryId);
    if (!entryToDelete) return;

    try {
      if (entryToDelete.seriesId) {
          if (window.confirm(`Esta é uma parcela. Deseja excluir apenas esta parcela ou todas as ${entryToDelete.totalInstallmentsInSeries} parcelas desta dívida? \n\nOK = Excluir TODAS as parcelas da série.\nCancelar = Excluir APENAS esta parcela.`)) {
              // Delete all in series
              await deleteEntriesBySeries(entryToDelete.seriesId);
          } else {
              // Delete only this one
              await deleteEntry(entryId);
          }
      } else {
          if (window.confirm('Tem certeza que deseja excluir esta dívida?')) {
              await deleteEntry(entryId);
          }
      }
    } catch (error) {
      console.error('Erro ao excluir conta a pagar:', error);
      alert('Erro ao excluir conta a pagar. Tente novamente.');
    }
  };

  const handleTogglePaid = async (entryId: string) => {
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return;
    
    try {
      await updateEntry({ ...entry, isPaid: !entry.isPaid });
    } catch (error) {
      console.error('Erro ao atualizar status da conta:', error);
      alert('Erro ao atualizar status da conta. Tente novamente.');
    }
  };

  const handleTogglePaidOld = (entryId: string) => {
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return;
    
    const updatedEntry = { ...entry, isPaid: !entry.isPaid };
    updateEntry(updatedEntry).catch(error => {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status. Tente novamente.');
    });
  };

  const handleDeleteEntryOld = (entryId: string) => {
    const entryToDelete = entries.find(e => e.id === entryId);
    if (!entryToDelete) return;

    if (entryToDelete.seriesId) {
        if (window.confirm(`Esta é uma parcela. Deseja excluir apenas esta parcela ou todas as ${entryToDelete.totalInstallmentsInSeries} parcelas desta dívida? \n\nOK = Excluir TODAS as parcelas da série.\nCancelar = Excluir APENAS esta parcela.`)) {
            // Delete all in series
            deleteEntriesBySeries(entryToDelete.seriesId).catch(error => {
              console.error('Erro ao excluir série:', error);
              alert('Erro ao excluir série. Tente novamente.');
            });
        } else {
            // Delete only this one
            deleteEntry(entryId).catch(error => {
              console.error('Erro ao excluir conta:', error);
              alert('Erro ao excluir conta. Tente novamente.');
            });
        }
    } else {
        if (window.confirm('Tem certeza que deseja excluir esta dívida?')) {
            deleteEntry(entryId).catch(error => {
              console.error('Erro ao excluir conta:', error);
              alert('Erro ao excluir conta. Tente novamente.');
            });
        }
    }
  };

  const availableYears = useMemo(() => {
    if (entries.length === 0) {
      return [new Date().getFullYear()];
    }
    const yearsWithEntries = [...new Set(entries.map(e => new Date(e.dueDate).getFullYear()))].sort((a, b) => b - a);
    const allPossibleYears = [...new Set([...yearsWithEntries, new Date().getFullYear()])].sort((a,b) => b-a);
    return allPossibleYears;
  }, [entries]);

  const monthOptions = useMemo(() => (
      Array.from({ length: 12 }, (_, i) => ({
          value: i + 1,
          label: new Date(0, i).toLocaleString('pt-BR', { month: 'long' }),
      }))
  ), []);

  const yearOptions = useMemo(() => (
      availableYears.map(year => ({ value: year, label: year.toString() }))
  ), [availableYears]);
  
  const filteredEntries = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)); // Monday as start of week
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return entries.filter(entry => {
      const statusMatch = filterStatus === 'all' || (filterStatus === 'paid' && entry.isPaid) || (filterStatus === 'pending' && !entry.isPaid);
      const searchMatch = entry.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      let timeMatch = true;
      const dueDate = new Date(entry.dueDate + "T00:00:00");

      switch (timeFilter) {
          case 'week':
              timeMatch = dueDate >= startOfWeek && dueDate <= endOfWeek;
              break;
          case 'month':
              timeMatch = dueDate.getFullYear() === currentYear && dueDate.getMonth() === currentMonth;
              break;
          case 'specific_month':
              timeMatch = dueDate.getFullYear() === selectedFilterYear && (dueDate.getMonth() + 1) === selectedFilterMonth;
              break;
          case 'all':
          default:
              timeMatch = true;
              break;
      }

      return statusMatch && searchMatch && timeMatch;
    });
  }, [entries, filterStatus, searchTerm, timeFilter, selectedFilterMonth, selectedFilterYear]);

  const { totalVisible, totalPaid, totalPending } = useMemo(() => {
    const totalVisible = filteredEntries.reduce((sum, e) => sum + e.amount, 0);
    const totalPaid = filteredEntries.filter(e => e.isPaid).reduce((sum, e) => sum + e.amount, 0);
    const totalPending = filteredEntries.filter(e => !e.isPaid).reduce((sum, e) => sum + e.amount, 0);
      
    return { totalVisible, totalPaid, totalPending };
  }, [filteredEntries]);

  const monthlySummaryData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11

    const entriesThisMonth = entries.filter(entry => {
        const dueDate = new Date(entry.dueDate + "T00:00:00");
        return dueDate.getFullYear() === currentYear && dueDate.getMonth() === currentMonth;
    });

    const totalPaidThisMonth = entriesThisMonth
        .filter(e => e.isPaid)
        .reduce((sum, e) => sum + e.amount, 0);

    const totalPendingThisMonth = entriesThisMonth
        .filter(e => !e.isPaid)
        .reduce((sum, e) => sum + e.amount, 0);

    return { totalPaidThisMonth, totalPendingThisMonth };
  }, [entries]);

  const pieChartData: ChartData<'pie'> = useMemo(() => ({
    labels: ['Pendentes no Mês', 'Pagas no Mês'],
    datasets: [
        {
            label: 'Valor (R$)',
            data: [monthlySummaryData.totalPendingThisMonth, monthlySummaryData.totalPaidThisMonth],
            backgroundColor: [
                'rgba(239, 68, 68, 0.7)', // red-500 with opacity
                'rgba(34, 197, 94, 0.7)', // green-500 with opacity
            ],
            borderColor: [
                'rgba(239, 68, 68, 1)',
                'rgba(34, 197, 94, 1)',
            ],
            borderWidth: 1,
            hoverOffset: 8,
        },
    ],
  }), [monthlySummaryData]);

  const pieChartOptions: ChartOptions<'pie'> = useMemo(() => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
          legend: {
              position: 'top',
              labels: {
                  color: '#d1d5db',
                  font: { size: 12, family: 'Inter' }
              }
          },
          title: {
              display: true,
              text: `Resumo de Contas para ${new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}`,
              color: '#f3f4f6',
              font: { size: 16, weight: 600, family: 'Inter' }
          },
          tooltip: {
              backgroundColor: '#1d1d1d', 
              titleColor: '#f3f4f6', 
              bodyColor: '#d1d5db',
              callbacks: {
                  label: function(context) {
                      const label = context.label || '';
                      const value = context.raw as number;
                      const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0) || 1;
                      const percentage = total > 0 ? ((value / total) * 100).toFixed(2) : 0;
                      return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                  }
              }
          }
      },
  }), []);


  const parcelTypeOptions: { value: ParcelType; label: string }[] = [
    { value: 'none', label: 'Não Parcelar (Pagamento Único)' },
    { value: 'weekly', label: 'Semanalmente' },
    { value: 'monthly', label: 'Mensalmente' },
  ];

  if (loading) {
    return (
      <div className="p-6 text-white flex items-center justify-center">
        <Spinner size="lg" />
        <span className="ml-3">Carregando contas a pagar...</span>
      </div>
    );
  }

  return (
    <div className="p-6 text-gray-300">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center">
          <BanknotesIcon className="h-8 w-8 text-yellow-500 mr-3" />
          <h2 className="text-2xl font-semibold text-white">Contas a Pagar</h2>
        </div>
        <Button onClick={openModalForNew} variant="primary" iconLeft={<PlusIcon className="w-5 h-5"/>}>
          Adicionar Nova Conta
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        <div className="lg:col-span-2 p-4 bg-[#1d1d1d] rounded-lg shadow flex items-center justify-center">
          {(monthlySummaryData.totalPaidThisMonth > 0 || monthlySummaryData.totalPendingThisMonth > 0) ? (
            <div className="h-80 w-full relative">
                <Pie data={pieChartData} options={pieChartOptions} />
            </div>
          ) : (
            <div className="text-center text-gray-500 h-80 flex flex-col justify-center items-center">
                <BanknotesIcon className="h-12 w-12 mx-auto mb-2" />
                <p>Nenhuma conta com vencimento este mês para exibir no gráfico.</p>
            </div>
          )}
        </div>
        <div className="lg:col-span-3 space-y-4">
            <div className="p-4 bg-[#1d1d1d] rounded-lg shadow text-center h-full flex flex-col justify-around">
              <div>
                <h3 className="text-md font-medium text-gray-400">Total na Lista Atual</h3>
                <p className="text-2xl font-bold text-yellow-500">{formatCurrency(totalVisible)}</p>
              </div>
              <div>
                <h3 className="text-md font-medium text-gray-400">Total Pago (na lista)</h3>
                <p className="text-2xl font-bold text-green-500">{formatCurrency(totalPaid)}</p>
              </div>
              <div>
                <h3 className="text-md font-medium text-gray-400">Total Pendente (na lista)</h3>
                <p className="text-2xl font-bold text-red-500">{formatCurrency(totalPending)}</p>
              </div>
            </div>
        </div>
      </div>

      <div className="space-y-4 mb-6 p-4 bg-[#1d1d1d] rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <Input
                    id="searchTerm"
                    type="text"
                    placeholder="Pesquisar por nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    label="Pesquisar Conta"
                />
            </div>
            <div>
                <Select
                    label="Filtrar Status"
                    options={[
                        { value: 'all', label: 'Todas' },
                        { value: 'pending', label: 'Pendentes' },
                        { value: 'paid', label: 'Pagas' },
                    ]}
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                />
            </div>
            <div>
                <Select
                    label="Filtrar Vencimento"
                    options={[
                        { value: 'all', label: 'Qualquer Data' },
                        { value: 'week', label: 'Esta Semana' },
                        { value: 'month', label: 'Este Mês' },
                        { value: 'specific_month', label: 'Mês Específico...' },
                    ]}
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                />
            </div>
        </div>
        {timeFilter === 'specific_month' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#1F1F1F]">
                <div className="md:col-start-2">
                    <Select
                        label="Mês Específico"
                        options={monthOptions}
                        value={selectedFilterMonth}
                        onChange={(e) => setSelectedFilterMonth(Number(e.target.value))}
                    />
                </div>
                <div>
                    <Select
                        label="Ano"
                        options={yearOptions}
                        value={selectedFilterYear}
                        onChange={(e) => setSelectedFilterYear(Number(e.target.value))}
                    />
                </div>
            </div>
        )}
      </div>

      {filteredEntries.length === 0 && entries.length > 0 && (
         <div className="text-center py-10 bg-[#1d1d1d] shadow-xl rounded-lg">
          <BanknotesIcon className="mx-auto h-12 w-12 text-gray-500" />
          <h3 className="mt-2 text-sm font-medium text-white">Nenhuma conta encontrada</h3>
          <p className="mt-1 text-sm text-gray-400">Verifique os filtros aplicados ou adicione novas contas.</p>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="text-center py-10 bg-[#1d1d1d] shadow-xl rounded-lg">
          <BanknotesIcon className="mx-auto h-12 w-12 text-gray-500" />
          <h3 className="mt-2 text-sm font-medium text-white">Nenhuma conta a pagar registrada</h3>
          <p className="mt-1 text-sm text-gray-400">Comece adicionando suas contas a pagar.</p>
        </div>
      ) : (
        <div className="bg-[#1d1d1d] shadow-xl rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-[#1F1F1F]">
            <thead className="bg-[#1F1F1F]">
              <tr>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider w-16">Paga?</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nome da Conta</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Vencimento</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Valor (R$)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-[#1d1d1d] divide-y divide-[#1F1F1F]">
              {filteredEntries.map(entry => (
                <tr key={entry.id} className={`${entry.isPaid ? 'bg-green-900/30' : 'hover:bg-[#1F1F1F]/50'}`}>
                  <td className="px-3 py-4 whitespace-nowrap text-center">
                    <Input
                      type="checkbox"
                      checked={entry.isPaid}
                      onChange={() => handleTogglePaid(entry.id)}
                      className="form-checkbox h-5 w-5 text-yellow-500 bg-gray-600 border-gray-500 rounded focus:ring-yellow-400 cursor-pointer"
                      aria-label={`Marcar como ${entry.isPaid ? 'não paga' : 'paga'}`}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${entry.isPaid ? 'text-gray-500 line-through' : 'text-white'}`}>{entry.name}</div>
                    {entry.notes && <div className="text-xs text-gray-400 truncate max-w-xs">{entry.notes}</div>}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${entry.isPaid ? 'text-gray-500 line-through' : 'text-gray-300'}`}>{new Date(entry.dueDate + "T00:00:00").toLocaleDateString('pt-BR')}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${entry.isPaid ? 'text-gray-500 line-through' : 'text-yellow-400'}`}>{formatCurrency(entry.amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 flex items-center">
                    <Button onClick={() => openModalForEdit(entry)} variant="secondary" size="xs" iconLeft={<PencilIcon className="w-4 h-4"/>} title="Editar Conta"/>
                    <Button onClick={() => handleDeleteEntry(entry.id)} variant="danger" size="xs" iconLeft={<TrashIcon className="w-4 h-4"/>} title="Excluir Conta"/>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-[#1d1d1d] p-6 md:p-8 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto text-gray-300">
            <h3 className="text-xl font-semibold mb-6 text-white">{editingEntry ? 'Editar Conta a Pagar' : 'Adicionar Nova Conta a Pagar'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input 
                label="Nome da Conta/Dívida" 
                name="name" 
                value={currentFormData.name} 
                onChange={handleInputChange} 
                required 
              />
              <Input 
                label={editingEntry || currentFormData.parcelType === 'none' ? "Valor da Conta/Parcela" : "Valor Total da Dívida (a ser parcelado)"}
                name="totalAmount" 
                type="number" 
                step="0.01"
                min="0.01"
                value={currentFormData.totalAmount === 0 && !editingEntry ? '' : currentFormData.totalAmount} 
                onChange={handleInputChange} 
                required 
              />
              <Input 
                label={editingEntry || currentFormData.parcelType === 'none' ? "Data de Vencimento" : "Data de Vencimento da Primeira Parcela"}
                name="dueDate" 
                type="date"
                value={currentFormData.dueDate} 
                onChange={handleInputChange} 
                required
                className="text-gray-300"
                style={{ colorScheme: 'dark' }}
              />
              <Textarea
                label="Observações (Opcional)"
                name="notes"
                value={currentFormData.notes}
                onChange={handleInputChange}
                rows={2}
              />

              {!editingEntry && (
                <>
                  <Select
                    label="Parcelamento"
                    name="parcelType"
                    options={parcelTypeOptions}
                    value={currentFormData.parcelType}
                    onChange={handleInputChange}
                  />
                  {currentFormData.parcelType !== 'none' && (
                    <Input
                      label="Número de Parcelas"
                      name="numberOfInstallments"
                      type="number"
                      min="2" // Minimum 2 for parceling
                      step="1"
                      value={currentFormData.numberOfInstallments <=1 ? '' : currentFormData.numberOfInstallments}
                      onChange={handleInputChange}
                      required
                    />
                  )}
                </>
              )}
               <div className="flex items-center space-x-2 pt-2">
                <Input
                    id="isPaid"
                    name="isPaid"
                    type="checkbox"
                    checked={currentFormData.isPaid}
                    onChange={handleInputChange}
                    className="form-checkbox h-5 w-5 text-yellow-500 bg-gray-600 border-gray-500 rounded focus:ring-yellow-400"
                />
                <label htmlFor="isPaid" className="text-sm font-medium text-gray-300">Marcar como Paga?</label>
              </div>

              <div className="flex justify-end space-x-3 pt-6">
                <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
                <Button type="submit" variant="primary" isLoading={isLoading}>{isLoading ? "Salvando..." : (editingEntry ? 'Salvar Alterações' : 'Adicionar Conta')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsPayablePage;