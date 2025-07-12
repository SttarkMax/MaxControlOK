
import { QuoteStatus } from './types';

export const translateQuoteStatus = (status: QuoteStatus): string => {
  switch (status) {
    case 'draft':
      return 'Rascunho';
    case 'sent':
      return 'Enviado';
    case 'accepted':
      return 'Aceito';
    case 'rejected':
      return 'Rejeitado';
    case 'converted_to_order':
      return 'Convertido em OS';
    case 'cancelled':
      return 'Cancelado';
    default:
      return status;
  }
};

// Helper to format currency, can be expanded
export const formatCurrency = (amount?: number): string => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return (0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  return amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  // Handle cases where the day might exceed the number of days in the target month
  // e.g., Jan 31 + 1 month should be Feb 28/29, not Mar 2/3
  if (result.getDate() !== date.getDate() && date.getMonth() !== (date.getMonth() + months) % 12) {
    result.setDate(0); // Sets date to the last day of the previous month
  }
  return result;
};

export const addWeeks = (date: Date, weeks: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + weeks * 7);
  return result;
};

// Helper to format date to YYYY-MM-DD for input[type="date"]
export const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to format phone number to (XX) XXXXX-XXXX
export const formatPhoneNumber = (value: string): string => {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, '');
  
  // Limit to 11 digits (DDD + 9 digits)
  const limitedNumbers = numbers.slice(0, 11);
  
  // Apply formatting based on length
  if (limitedNumbers.length <= 2) {
    return limitedNumbers;
  } else if (limitedNumbers.length <= 7) {
    return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2)}`;
  } else {
    return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 7)}-${limitedNumbers.slice(7)}`;
  }
};

// Helper to remove phone formatting and return only numbers
export const unformatPhoneNumber = (value: string): string => {
  return value.replace(/\D/g, '');
};