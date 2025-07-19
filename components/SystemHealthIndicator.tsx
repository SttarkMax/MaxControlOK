import React, { useState, useEffect } from 'react';
import { testSupabaseConnection } from '../lib/supabase';
import CheckCircleIcon from './icons/CheckCircleIcon';

interface SystemHealthIndicatorProps {
  className?: string;
}

const SystemHealthIndicator: React.FC<SystemHealthIndicatorProps> = ({ className = '' }) => {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkSystemHealth = async () => {
    try {
      const isConnected = await testSupabaseConnection();
      setIsHealthy(isConnected);
      setLastCheck(new Date());
    } catch (error) {
      console.error('Health check failed:', error);
      setIsHealthy(false);
      setLastCheck(new Date());
    }
  };

  useEffect(() => {
    // Check immediately
    checkSystemHealth();
    
    // Check every 5 minutes
    const interval = setInterval(checkSystemHealth, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (isHealthy === null) {
    return (
      <div className={`flex items-center text-gray-400 ${className}`}>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse mr-2"></div>
        <span className="text-xs">Verificando...</span>
      </div>
    );
  }

  return (
    <div 
      className={`flex items-center cursor-pointer ${className}`}
      onClick={checkSystemHealth}
      title={`Sistema ${isHealthy ? 'saudável' : 'com problemas'}. Última verificação: ${lastCheck?.toLocaleTimeString('pt-BR')}`}
    >
      <div className={`w-2 h-2 rounded-full mr-2 ${isHealthy ? 'bg-green-500' : 'bg-red-500'}`}></div>
      <span className={`text-xs ${isHealthy ? 'text-green-400' : 'text-red-400'}`}>
        {isHealthy ? 'Sistema OK' : 'Sistema com problemas'}
      </span>
    </div>
  );
};

export default SystemHealthIndicator;