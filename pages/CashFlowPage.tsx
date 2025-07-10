import React from 'react';
import CurrencyDollarIcon from '../components/icons/CurrencyDollarIcon';

const CashFlowPage: React.FC = () => {
  return (
    <div className="p-6 bg-[#1d1d1d] shadow-xl rounded-lg text-center text-white">
      <CurrencyDollarIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
      <h2 className="text-2xl font-semibold text-white">Fluxo de Caixa</h2>
      <p className="text-gray-300 mt-2">
        Esta seção está em desenvolvimento.
      </p>
      <p className="text-gray-400 mt-1">
        Futuramente, você poderá registrar entradas, saídas e visualizar relatórios financeiros.
      </p>
    </div>
  );
};

export default CashFlowPage;