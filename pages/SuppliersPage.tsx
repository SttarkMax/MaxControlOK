import React, { useState, useMemo, useRef } from 'react';
import { Supplier, Debt, SupplierCredit } from '../types';
import { formatCurrency, formatDateForInput } from '../utils';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Textarea from '../components/common/Textarea';
import Spinner from '../components/common/Spinner';
import TruckIcon from '../components/icons/TruckIcon';
import PlusIcon from '../components/icons/PlusIcon';
import TrashIcon from '../components/icons/TrashIcon';
import PencilIcon from '../components/icons/PencilIcon';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, ChartData, ChartOptions } from 'chart.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import CurrencyDollarIcon from '../components/icons/CurrencyDollarIcon';
import { useSuppliers } from '../hooks/useSupabaseData';

ChartJS.register(ArcElement, Tooltip, Legend);

const initialSupplierState: Supplier = { id: '', name: '', cnpj: '', phone: '', email: '', address: '', notes: '' };
const initialDebtFormState = { description: '', totalAmount: 0, dateAdded: formatDateForInput(new Date()) };
const initialPaymentFormState = { amount: 0, date: formatDateForInput(new Date()), description: '' };


// Main Page Component
const SuppliersPage: React.FC = () => {
    const { 
        suppliers, 
        debts, 
        credits: supplierCredits, 
        loading,
        createSupplier,
        updateSupplier,
        deleteSupplier,
        createDebt,
        deleteDebt,
        createCredit,
        deleteCredit
    } = useSuppliers();
    
    const [searchTerm, setSearchTerm] = useState('');

    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

    const handleOpenSupplierModal = (supplier: Supplier | null) => {
        setEditingSupplier(supplier);
        setIsSupplierModalOpen(true);
    };

    const handleSaveSupplier = async (supplier: Supplier) => {
        try {
            if (supplier.id) {
                await updateSupplier(supplier);
            } else {
                await createSupplier(supplier);
            }
            setIsSupplierModalOpen(false);
        } catch (error) {
            console.error('Erro ao salvar fornecedor:', error);
            alert('Erro ao salvar fornecedor. Tente novamente.');
        }
    };

    const handleDeleteSupplier = async (supplierId: string) => {
        const associatedDebts = debts.filter(d => d.supplierId === supplierId).length;
        const associatedPayments = supplierCredits.filter(p => p.supplierId === supplierId).length;
        if ((associatedDebts > 0 || associatedPayments > 0) && !window.confirm(`Este fornecedor tem ${associatedDebts} dívida(s) e ${associatedPayments} pagamento(s) associado(s). Excluir o fornecedor também excluirá todos esses registros. Deseja continuar?`)) {
            return;
        }
        try {
            await deleteSupplier(supplierId);
        } catch (error) {
            console.error('Erro ao excluir fornecedor:', error);
            alert('Erro ao excluir fornecedor. Tente novamente.');
        }
    };

    const handleOpenDetailsModal = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setIsDetailsModalOpen(true);
    };

    const suppliersWithStats = useMemo(() => {
        return suppliers
            .map(supplier => {
                const supplierDebts = debts.filter(d => d.supplierId === supplier.id);
                const totalDebtAmount = supplierDebts.reduce((sum, d) => sum + d.totalAmount, 0);
                const supplierPayments = supplierCredits.filter(c => c.supplierId === supplier.id);
                const totalPaid = supplierPayments.reduce((sum, p) => sum + p.amount, 0);
                const balance = totalDebtAmount - totalPaid;
                return { ...supplier, totalDebtAmount, totalPaid, balance };
            })
            .filter(supplier => supplier.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [suppliers, debts, supplierCredits, searchTerm]);

    if (loading) {
        return (
            <div className="p-6 text-white flex items-center justify-center">
                <Spinner size="lg" />
                <span className="ml-3">Carregando fornecedores...</span>
            </div>
        );
    }

    return (
        <div className="p-6 text-gray-300">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center"><TruckIcon className="h-8 w-8 text-yellow-500 mr-3" /><h2 className="text-2xl font-semibold text-white">Fornecedores</h2></div>
                <Button onClick={() => handleOpenSupplierModal(null)} variant="primary" iconLeft={<PlusIcon className="w-5 h-5" />}>Adicionar Fornecedor</Button>
            </div>
            <Input className="mb-6 max-w-sm" type="text" placeholder="Buscar por nome..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />

            {suppliersWithStats.length === 0 ? (
                 <div className="text-center py-10 bg-[#1d1d1d] shadow-xl rounded-lg">
                    <TruckIcon className="mx-auto h-12 w-12 text-gray-500" />
                    <h3 className="mt-2 text-sm font-medium text-white">{suppliers.length === 0 ? "Nenhum fornecedor cadastrado" : "Nenhum fornecedor encontrado"}</h3>
                    <p className="mt-1 text-sm text-gray-400">{suppliers.length === 0 ? "Comece adicionando um novo fornecedor." : "Tente uma busca diferente."}</p>
                 </div>
            ) : (
                <div className="bg-[#1d1d1d] shadow-xl rounded-lg overflow-x-auto">
                    <table className="min-w-full divide-y divide-[#1F1F1F]">
                        <thead className="bg-[#131313]">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Fornecedor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Contato</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Dívida Total</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Saldo Devedor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-[#1d1d1d] divide-y divide-[#1F1F1F]">
                            {suppliersWithStats.map(s => (
                                <tr key={s.id} className="hover:bg-[#1F1F1F]/50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{s.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{s.phone || s.email || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 text-right">{formatCurrency(s.totalDebtAmount)}</td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${s.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>{formatCurrency(s.balance)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                      <div className="flex items-center space-x-2">
                                        <Button variant="outline" size="sm" onClick={() => handleOpenDetailsModal(s)}>Detalhes</Button>
                                        <Button variant="secondary" size="sm" onClick={() => handleOpenSupplierModal(s)} iconLeft={<PencilIcon className="w-4 h-4" />} title="Editar Fornecedor"/>
                                        <Button variant="danger" size="sm" onClick={() => handleDeleteSupplier(s.id)} iconLeft={<TrashIcon className="w-4 h-4" />} title="Excluir Fornecedor"/>
                                      </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {isSupplierModalOpen && <SupplierFormModal supplier={editingSupplier} onSave={handleSaveSupplier} onClose={() => setIsSupplierModalOpen(false)} />}
            {isDetailsModalOpen && selectedSupplier && (
                <SupplierDetailsModal 
                    supplier={selectedSupplier} 
                    debts={debts.filter(d => d.supplierId === selectedSupplier.id)}
                    payments={supplierCredits.filter(p => p.supplierId === selectedSupplier.id)}
                    onCreateDebt={createDebt}
                    onDeleteDebt={deleteDebt}
                    onCreateCredit={createCredit}
                    onDeleteCredit={deleteCredit}
                    onClose={() => setIsDetailsModalOpen(false)} 
                />
            )}
        </div>
    );
};

// Supplier Form Modal
const SupplierFormModal: React.FC<{ supplier: Supplier | null; onSave: (supplier: Supplier) => void; onClose: () => void; }> = ({ supplier, onSave, onClose }) => {
    const [formState, setFormState] = useState(supplier || initialSupplierState);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormState({ ...formState, [e.target.name]: e.target.value });
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formState); };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
            <div className="bg-[#1d1d1d] p-6 md:p-8 rounded-lg shadow-xl w-full max-w-lg text-gray-300">
                <h3 className="text-xl font-semibold mb-6 text-white">{supplier ? 'Editar' : 'Adicionar'} Fornecedor</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Nome" name="name" value={formState.name} onChange={handleChange} required />
                    <Input label="CNPJ" name="cnpj" value={formState.cnpj || ''} onChange={handleChange} />
                    <Input label="Telefone" name="phone" value={formState.phone || ''} onChange={handleChange} />
                    <Input label="Email" name="email" type="email" value={formState.email || ''} onChange={handleChange} />
                    <Textarea label="Endereço" name="address" value={formState.address || ''} onChange={handleChange} rows={2} />
                    <Textarea label="Observações" name="notes" value={formState.notes || ''} onChange={handleChange} rows={2} />
                    <div className="flex justify-end space-x-3 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" variant="primary">Salvar</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

type Transaction = {
    id: string;
    date: string;
    description?: string;
    debit: number;
    credit: number;
    type: 'debt' | 'payment';
};

// Supplier Details Modal
const SupplierDetailsModal: React.FC<{ 
    supplier: Supplier; 
    debts: Debt[]; 
    payments: SupplierCredit[]; 
    onCreateDebt: (debt: Omit<Debt, 'id'>) => Promise<Debt>;
    onDeleteDebt: (id: string) => Promise<void>;
    onCreateCredit: (credit: Omit<SupplierCredit, 'id'>) => Promise<SupplierCredit>;
    onDeleteCredit: (id: string) => Promise<void>;
    onClose: () => void; 
}> = ({ supplier, debts, payments, onCreateDebt, onDeleteDebt, onCreateCredit, onDeleteCredit, onClose }) => {
    const chartRef = useRef<ChartJS<'pie'>>(null);
    const [debtForm, setDebtForm] = useState(initialDebtFormState);
    const [paymentForm, setPaymentForm] = useState(initialPaymentFormState);

    const supplierStats = useMemo(() => {
        const totalDebtAmount = debts.reduce((sum, d) => sum + d.totalAmount, 0);
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        const balance = totalDebtAmount - totalPaid;
        return { totalDebtAmount, totalPaid, balance };
    }, [debts, payments]);

    const unifiedTransactions = useMemo(() => {
        const allTransactions: Transaction[] = [
            ...debts.map(d => ({ id: d.id, date: d.dateAdded, description: d.description, debit: d.totalAmount, credit: 0, type: 'debt' as const })),
            ...payments.map(p => ({ id: p.id, date: p.date, description: p.description, debit: 0, credit: p.amount, type: 'payment' as const }))
        ];
        allTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        let runningBalance = 0;
        return allTransactions.map(tx => {
            runningBalance += tx.debit - tx.credit;
            return { ...tx, balance: runningBalance };
        });
    }, [debts, payments]);

    const pieChartData: ChartData<'pie'> = useMemo(() => {
        return {
            labels: ['Em Aberto', 'Pago'],
            datasets: [{ data: [Math.max(0, supplierStats.balance), supplierStats.totalPaid], backgroundColor: ['#ef4444', '#22c55e'], borderColor: ['#1d1d1d', '#1d1d1d'], borderWidth: 2 }]
        }
    }, [supplierStats]);
    
    const pieOptions: ChartOptions<'pie'> = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'bottom', labels: {color: '#d1d5db'} } } };

    const handleAddDebt = async () => {
        if (debtForm.totalAmount <= 0) { alert("O valor da dívida deve ser positivo."); return; }
        try {
            await onCreateDebt({ supplierId: supplier.id, ...debtForm });
            setDebtForm(initialDebtFormState);
        } catch (error) {
            console.error('Erro ao adicionar dívida:', error);
            alert('Erro ao adicionar dívida. Tente novamente.');
        }
    };

    const handleAddPayment = async () => {
        if (paymentForm.amount <= 0) { alert("O valor do pagamento deve ser positivo."); return; }
        try {
            await onCreateCredit({ supplierId: supplier.id, ...paymentForm });
            setPaymentForm(initialPaymentFormState);
        } catch (error) {
            console.error('Erro ao adicionar pagamento:', error);
            alert('Erro ao adicionar pagamento. Tente novamente.');
        }
    };

    const handleDeleteTransaction = async (tx: Transaction & { balance: number }) => {
        if (tx.type === 'debt') {
            if (window.confirm("Tem certeza que deseja excluir esta dívida?")) {
                try {
                    await onDeleteDebt(tx.id);
                } catch (error) {
                    console.error('Erro ao excluir dívida:', error);
                    alert('Erro ao excluir dívida. Tente novamente.');
                }
            }
        } else { // type === 'payment'
            if (window.confirm("Tem certeza que deseja excluir este pagamento?")) {
                try {
                    await onDeleteCredit(tx.id);
                } catch (error) {
                    console.error('Erro ao excluir pagamento:', error);
                    alert('Erro ao excluir pagamento. Tente novamente.');
                }
            }
        }
    };
    
    const generatePdfReport = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(`Relatório do Fornecedor: ${supplier.name}`, 14, 22);

        doc.setFontSize(11);
        doc.text(`Dívida Total: ${formatCurrency(supplierStats.totalDebtAmount)}`, 14, 35);
        doc.text(`Total Pago: ${formatCurrency(supplierStats.totalPaid)}`, 14, 42);
        doc.setFontSize(12).setFont(undefined, 'bold');
        doc.text(`Saldo Devedor: ${formatCurrency(supplierStats.balance)}`, 14, 52);
        doc.setFontSize(11).setFont(undefined, 'normal');

        let yPos = 70;

        if (unifiedTransactions.length > 0) {
            doc.setFontSize(14).text("Extrato de Transações", 14, yPos); yPos += 8;
            autoTable(doc, {
                startY: yPos,
                head: [['Data', 'Descrição', 'Dívida (+)', 'Pagamento (-)', 'Saldo']],
                body: unifiedTransactions.map(tx => [
                    new Date(tx.date + "T00:00:00").toLocaleDateString('pt-BR'),
                    tx.description || '-',
                    tx.debit > 0 ? formatCurrency(tx.debit) : '-',
                    tx.credit > 0 ? formatCurrency(tx.credit) : '-',
                    formatCurrency(tx.balance)
                ]),
                theme: 'striped', headStyles: { fillColor: [40, 40, 40] },
                didParseCell: function (data) {
                    if(data.column.index === 4) data.cell.styles.fontStyle = 'bold' as const;
                    if(data.column.index === 2 && data.row.raw && (data.row.raw as any[])[2] !== '-') data.cell.styles.textColor = '#dc2626'; // red
                    if(data.column.index === 3 && data.row.raw && (data.row.raw as any[])[3] !== '-') data.cell.styles.textColor = '#16a34a'; // green
                }
            });
        }
        
        doc.save(`Relatorio_${supplier.name.replace(/\s/g, '_')}.pdf`);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-[60] flex items-center justify-center p-4">
            <div className="bg-[#1d1d1d] p-4 md:p-6 rounded-lg shadow-2xl w-full max-w-6xl max-h-[95vh] text-gray-300 flex flex-col">
                <div className="flex justify-between items-start mb-4 flex-shrink-0">
                    <div>
                        <h3 className="text-2xl font-semibold text-white">{supplier.name}</h3>
                        <p className="text-sm text-gray-400">{supplier.phone} {supplier.email && `| ${supplier.email}`}</p>
                    </div>
                    <Button type="button" variant="secondary" onClick={onClose}>&times; Fechar</Button>
                </div>
                
                <div className="flex-grow overflow-y-auto pr-4 -mr-4">
                    {/* Summary & Chart */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        <div className="lg:col-span-2 bg-[#1d1d1d]/50 p-4 rounded-lg space-y-2">
                            <h4 className="font-semibold text-lg text-white mb-2">Resumo Financeiro</h4>
                            <div className="flex justify-between"><span>Dívida Total:</span><span>{formatCurrency(supplierStats.totalDebtAmount)}</span></div>
                            <div className="flex justify-between"><span>Total Pago:</span><span className="text-green-400">{formatCurrency(supplierStats.totalPaid)}</span></div>
                            <hr className="border-gray-600 my-2" />
                            <div className="flex justify-between text-lg font-bold"><span>Saldo Devedor:</span><span className={supplierStats.balance > 0 ? 'text-red-400' : 'text-green-400'}>{formatCurrency(supplierStats.balance)}</span></div>
                        </div>
                        <div className="bg-[#1d1d1d]/50 p-4 rounded-lg h-64">{supplierStats.totalDebtAmount > 0 && <Pie ref={chartRef} data={pieChartData} options={pieOptions} />}</div>
                    </div>
                    
                    {/* Add Transaction Forms */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                       {/* Add Debt Form */}
                        <div className="bg-black p-4 rounded-lg border border-[#1F1F1F]">
                            <h4 className="font-semibold text-lg text-white mb-3">Adicionar Dívida</h4>
                            <div className="space-y-3">
                                <Textarea label="Descrição (Opcional)" value={debtForm.description} onChange={e => setDebtForm({...debtForm, description: e.target.value})} rows={1} />
                                <Input label="Data da Dívida" type="date" value={debtForm.dateAdded} onChange={e => setDebtForm({...debtForm, dateAdded: e.target.value})} />
                                <Input label="Valor da Dívida" type="number" step="0.01" value={debtForm.totalAmount > 0 ? debtForm.totalAmount : ''} onChange={e => setDebtForm({...debtForm, totalAmount: parseFloat(e.target.value) || 0})} placeholder="0.00" />
                                <Button onClick={handleAddDebt} variant="primary" className="w-full">Adicionar Dívida</Button>
                            </div>
                        </div>
                         {/* Add Payment Form */}
                        <div className="bg-black p-4 rounded-lg border border-[#1F1F1F]">
                            <h4 className="font-semibold text-lg text-white mb-3">Adicionar Pagamento</h4>
                             <div className="space-y-3">
                                <Textarea label="Descrição (Opcional)" value={paymentForm.description} onChange={e => setPaymentForm({...paymentForm, description: e.target.value})} rows={1} />
                                <Input label="Data do Pagamento" type="date" value={paymentForm.date} onChange={e => setPaymentForm({...paymentForm, date: e.target.value})} />
                                <Input label="Valor do Pagamento" type="number" step="0.01" value={paymentForm.amount > 0 ? paymentForm.amount : ''} onChange={e => setPaymentForm({...paymentForm, amount: parseFloat(e.target.value) || 0})} placeholder="0.00"/>
                                <Button onClick={handleAddPayment} variant="success" className="w-full">Adicionar Pagamento</Button>
                            </div>
                        </div>
                    </div>

                    {/* Transaction Ledger */}
                    <div>
                        <h4 className="font-semibold text-lg text-white mb-2">Extrato de Transações</h4>
                        <div className="overflow-x-auto bg-[#1d1d1d]/50 rounded-lg max-h-96">
                            <table className="min-w-full divide-y divide-[#1F1F1F]">
                                <thead className="bg-[#1F1F1F]/50 sticky top-0"><tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium uppercase">Data</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium uppercase">Descrição</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium uppercase">Dívida (+)</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium uppercase">Pagamento (-)</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium uppercase">Saldo</th>
                                    <th className="px-3 py-2 text-center text-xs font-medium uppercase">Ação</th>
                                </tr></thead>
                                <tbody className="divide-y divide-[#1F1F1F]">
                                    {unifiedTransactions.length > 0 ? unifiedTransactions.map(tx => (
                                        <tr key={`${tx.type}-${tx.id}`} className="hover:bg-[#1F1F1F]/50">
                                            <td className="px-3 py-2 text-sm whitespace-nowrap">{new Date(tx.date + "T00:00:00").toLocaleDateString('pt-BR')}</td>
                                            <td className="px-3 py-2 text-sm">{tx.description || '-'}</td>
                                            <td className="px-3 py-2 text-sm text-right text-red-400">{tx.debit > 0 ? formatCurrency(tx.debit) : '-'}</td>
                                            <td className="px-3 py-2 text-sm text-right text-green-400">{tx.credit > 0 ? formatCurrency(tx.credit) : '-'}</td>
                                            <td className="px-3 py-2 text-sm text-right font-semibold">{formatCurrency(tx.balance)}</td>
                                            <td className="px-3 py-2 text-center">
                                                <Button size="xs" variant="danger" title="Excluir Transação" onClick={()=>handleDeleteTransaction(tx)}><TrashIcon className="w-4 h-4"/></Button>
                                            </td>
                                        </tr>
                                    )) : <tr><td colSpan={6} className="text-center py-4 text-gray-500">Nenhuma transação registrada.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="mt-6 text-right border-t border-[#1F1F1F] pt-4 flex-shrink-0">
                    <Button onClick={generatePdfReport} variant="outline" className="mr-2">Exportar Relatório (PDF)</Button>
                    <Button onClick={onClose} variant="primary">Fechar</Button>
                </div>
            </div>
        </div>
    );
};

export default SuppliersPage;