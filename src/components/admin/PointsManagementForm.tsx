import React, { useState } from 'react';
import { X, User, Award, Plus, Minus, Trash2, Search } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { PointsTransaction } from '../../types';
import { generateId } from '../../utils/helpers';

interface PointsManagementFormProps {
  onClose: () => void;
}

export default function PointsManagementForm({ onClose }: PointsManagementFormProps) {
  const { state, dispatch } = useApp();
  const [formData, setFormData] = useState({
    customerId: '',
    customerSearch: '',
    points: '',
    description: '',
    type: 'credit' as 'credit' | 'debit' | 'remove_all',
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

    if (!formData.points || Number(formData.points) <= 0) {
      newErrors.points = 'Pontos devem ser maior que zero';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    if (formData.type !== 'remove_all') {
      const customer = state.customers.find(c => c.id === formData.customerId);
      if (customer && formData.type === 'debit' && customer.points < Number(formData.points)) {
        newErrors.points = 'Cliente não possui pontos suficientes';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    const customer = state.customers.find(c => c.id === formData.customerId);
    if (!customer) return;

    let points = Number(formData.points);
    let newPoints = customer.points;
    let transactionType = formData.type;
    
    if (formData.type === 'remove_all') {
      points = customer.points;
      newPoints = 0;
      transactionType = 'debit';
    } else {
      newPoints = formData.type === 'credit' 
        ? customer.points + points 
        : customer.points - points;
    }

    // Update customer points
    const updatedCustomer = {
      ...customer,
      points: newPoints,
    };

    // Create transaction
    const transaction: PointsTransaction = {
      id: generateId(),
      companyId: state.currentCompany?.id || '',
      customerId: customer.id,
      customerName: customer.name,
      type: transactionType,
      points,
      description: formData.type === 'remove_all' 
        ? `Remoção total de pontos: ${formData.description.trim()}`
        : formData.description.trim(),
      date: new Date(),
    };

    dispatch({ type: 'UPDATE_CUSTOMER', payload: updatedCustomer });
    dispatch({ type: 'ADD_POINTS_TRANSACTION', payload: transaction });

    onClose();
  };

  const selectedCustomer = state.customers.find(c => c.id === formData.customerId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Gerenciar Pontos</h2>
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
              Tipo de Operação *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'credit' }))}
                className={`flex items-center justify-center space-x-2 px-4 py-3 border rounded-lg transition-all ${
                  formData.type === 'credit'
                    ? 'bg-green-50 border-green-300 text-green-700'
                    : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'debit' }))}
                className={`flex items-center justify-center space-x-2 px-4 py-3 border rounded-lg transition-all ${
                  formData.type === 'debit'
                    ? 'bg-red-50 border-red-300 text-red-700'
                    : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Minus className="w-4 h-4" />
                <span>Remover</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'remove_all' }))}
                className={`flex items-center justify-center space-x-2 px-3 py-3 border rounded-lg transition-all ${
                  formData.type === 'remove_all'
                    ? 'bg-red-50 border-red-300 text-red-700'
                    : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>Zerar</span>
              </button>
            </div>
          </div>

          {formData.type !== 'remove_all' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantidade de Pontos *
              </label>
              <div className="relative">
                <Award className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  name="points"
                  value={formData.points}
                  onChange={handleChange}
                  min="1"
                  className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all ${
                    errors.points ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                />
              </div>
              {errors.points && <p className="mt-1 text-sm text-red-600">{errors.points}</p>}
            </div>
          )}

          {formData.type === 'remove_all' && selectedCustomer && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-medium text-red-800 mb-2">⚠️ Atenção</h3>
              <p className="text-sm text-red-700">
                Esta ação irá remover TODOS os {selectedCustomer.points} pontos do cliente.
                Esta operação não pode ser desfeita.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className={`w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all resize-none ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={
                formData.type === 'remove_all' 
                  ? "Motivo da remoção total de pontos"
                  : "Motivo da alteração de pontos"
              }
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          {selectedCustomer && (formData.points || formData.type === 'remove_all') && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-2">Resumo</h3>
              <div className="space-y-1 text-sm text-blue-700">
                <p>Cliente: {selectedCustomer.name}</p>
                <p>Pontos atuais: {selectedCustomer.points}</p>
                <p>
                  Pontos após operação: {
                    formData.type === 'remove_all'
                      ? 0
                      : formData.type === 'credit' 
                      ? selectedCustomer.points + Number(formData.points)
                      : selectedCustomer.points - Number(formData.points)
                  }
                </p>
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
              className={`flex-1 px-4 py-3 text-white rounded-lg transition-all transform hover:scale-105 ${
                formData.type === 'remove_all'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                  : formData.type === 'credit'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                  : 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600'
              }`}
            >
              {formData.type === 'remove_all' 
                ? 'Zerar Pontos' 
                : formData.type === 'credit' 
                ? 'Adicionar Pontos' 
                : 'Remover Pontos'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}