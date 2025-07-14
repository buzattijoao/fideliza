import React, { useState } from 'react';
import { X, ShoppingBag, DollarSign, FileText, User, Search } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Sale, PointsTransaction } from '../../types';
import { generateId, formatCurrency } from '../../utils/helpers';

interface SaleFormProps {
  onClose: () => void;
}

export default function SaleForm({ onClose }: SaleFormProps) {
  const { state, dispatch } = useApp();
  const companyPointsConfig = state.pointsConfigs.find(pc => pc.companyId === state.currentCompany?.id) || { reaisPerPoint: 10, companyId: state.currentCompany?.id || '' };
  const [formData, setFormData] = useState({
    customerId: '',
    customerSearch: '',
    amount: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCustomerSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, customerSearch: value, customerId: '' }));
    setShowCustomerDropdown(value.length > 0);
    
    if (errors.customerId) {
      setErrors(prev => ({ ...prev, customerId: '' }));
    }
  };

  const selectCustomer = (customer: any) => {
    setFormData(prev => ({ 
      ...prev, 
      customerId: customer.id, 
      customerSearch: `${customer.name} - ${customer.cpf}` 
    }));
    setShowCustomerDropdown(false);
  };

  const filteredCustomers = state.customers
    .filter(c => c.companyId === state.currentCompany?.id)
    .filter(customer => {
      const searchTerm = formData.customerSearch.toLowerCase();
      return customer.name.toLowerCase().includes(searchTerm) ||
             customer.cpf.includes(searchTerm) ||
             customer.email.toLowerCase().includes(searchTerm);
    })
    .slice(0, 10); // Limit to 10 results

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerId) {
      newErrors.customerId = 'Cliente é obrigatório';
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      newErrors.amount = 'Valor deve ser maior que zero';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    const customer = state.customers.find(c => c.id === formData.customerId);
    if (!customer) return;

    const amount = Number(formData.amount);
    const pointsEarned = Math.floor(amount / companyPointsConfig.reaisPerPoint);

    // Create sale
    const sale: Sale = {
      id: generateId(),
      companyId: state.currentCompany?.id || '',
      customerId: customer.id,
      customerName: customer.name,
      amount,
      pointsEarned,
      date: new Date(),
      description: formData.description.trim(),
    };

    // Update customer points
    const updatedCustomer = {
      ...customer,
      points: customer.points + pointsEarned,
    };

    // Create points transaction
    const transaction: PointsTransaction = {
      id: generateId(),
      companyId: state.currentCompany?.id || '',
      customerId: customer.id,
      customerName: customer.name,
      type: 'earned',
      points: pointsEarned,
      description: `Compra: ${formatCurrency(amount)}`,
      date: new Date(),
    };

    dispatch({ type: 'ADD_SALE', payload: sale });
    dispatch({ type: 'UPDATE_CUSTOMER', payload: updatedCustomer });
    dispatch({ type: 'ADD_POINTS_TRANSACTION', payload: transaction });

    onClose();
  };

  const selectedCustomer = state.customers.find(c => c.id === formData.customerId);
  const amount = Number(formData.amount) || 0;
  const pointsToEarn = Math.floor(amount / companyPointsConfig.reaisPerPoint);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Nova Venda</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente *
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={formData.customerSearch}
                onChange={handleCustomerSearch}
                onFocus={() => setShowCustomerDropdown(formData.customerSearch.length > 0)}
                className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all ${
                  errors.customerId ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Busque por nome, CPF ou email..."
              />
              
              {showCustomerDropdown && filteredCustomers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredCustomers.map(customer => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => selectCustomer(customer)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-500">
                        {customer.cpf} • {customer.email} • {customer.points} pontos
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {showCustomerDropdown && formData.customerSearch.length > 0 && filteredCustomers.length === 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
                  Nenhum cliente encontrado
                </div>
              )}
            </div>
            {errors.customerId && <p className="mt-1 text-sm text-red-600">{errors.customerId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor da Venda *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all ${
                  errors.amount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
            </div>
            {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all resize-none"
                placeholder="Descrição da venda (opcional)"
              />
            </div>
          </div>

          {amount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-800 mb-2">Resumo da Venda</h3>
              <div className="space-y-1 text-sm text-green-700">
                <p>Valor: {formatCurrency(amount)}</p>
                <p>Pontos a ganhar: {pointsToEarn}</p>
                {selectedCustomer && (
                  <p>Pontos finais: {selectedCustomer.points + pointsToEarn}</p>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-500 to-orange-400 text-white rounded-lg hover:from-pink-600 hover:to-orange-500 transition-all transform hover:scale-105"
            >
              Registrar Venda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}