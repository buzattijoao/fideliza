import React, { useState, useEffect } from 'react';
import { X, Search, FileText, DollarSign } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Sale, PointsTransaction, Customer } from '../../types';
import { formatCurrency } from '../../utils/helpers';
import { supabase } from '../../lib/supabase';

interface SaleFormProps {
  onClose: () => void;
}

export default function SaleForm({ onClose }: SaleFormProps) {
  const { state, dispatch } = useApp();
  const companyId = state.currentCompany?.id!;
  const companyPointsConfig = state.pointsConfigs.find(pc => pc.companyId === companyId)!
    || { reaisPerPoint: 10, companyId };

  // **1)** estado local para a lista vinda do banco
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [formData, setFormData] = useState({
    customerId: '',
    customerSearch: '',
    amount: '',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // **2)** busca clientes da empresa ao montar o form
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from<Customer>('customers')
        .select('id, name, cpf, email, points')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Erro ao carregar clientes:', error);
      } else {
        setCustomers(data);
      }
    })();
  }, [companyId]);

  const handleChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    setFormData(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(e => ({ ...e, [name]: '' }));
  };

  const handleCustomerSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setFormData(f => ({ ...f, customerSearch: v, customerId: '' }));
    setShowCustomerDropdown(v.length > 0);
    if (errors.customerId) setErrors(e => ({ ...e, customerId: '' }));
  };

  const selectCustomer = (c: Customer) => {
    setFormData(f => ({
      ...f,
      customerId: c.id,
      customerSearch: `${c.name} – ${c.cpf}`,
    }));
    setShowCustomerDropdown(false);
  };

  // **3)** filtra pelo input sobre a lista `customers`
  const filteredCustomers = customers
    .filter(c => {
      const term = formData.customerSearch.toLowerCase();
      return (
        c.name.toLowerCase().includes(term) ||
        c.cpf.includes(term) ||
        c.email.toLowerCase().includes(term)
      );
    })
    .slice(0, 10);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.customerId) e.customerId = 'Cliente é obrigatório';
    if (!formData.amount || Number(formData.amount) <= 0) e.amount = 'Valor deve ser maior que zero';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

    const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validate()) return;

  // 1) Identifica o cliente selecionado
  const customer = customers.find(c => c.id === formData.customerId)!;

  // 2) Calcula valor e pontos
  const amount = Number(formData.amount);
  const pointsEarned = Math.floor(amount / companyPointsConfig.reaisPerPoint);

  // 3) Insere a venda
  const { data: saleData, error: saleErr } = await supabase
    .from<Sale>('sales')
    .insert({
      customer_id:   customer.id,
      customer_name: customer.name,
      company_id:    companyId,
      amount,           // se sua coluna for NUMERIC/INTEGER
      points_earned: pointsEarned,
      date:          new Date(),
      description:   formData.description.trim() || null,
    })
    .select('*')
    .single();

  if (saleErr || !saleData) {
    console.error('Erro ao registrar venda:', saleErr);
    setErrors({ submit: saleErr?.message || 'Erro ao salvar venda.' });
    return;
  }

  // 4) Atualiza pontos do cliente
  const { data: updatedCustomer, error: custErr } = await supabase
    .from<Customer>('customers')
    .update({ points: customer.points + pointsEarned })
    .eq('id', customer.id)
    .select('*')
    .single();

  if (custErr || !updatedCustomer) {
    console.error('Erro ao atualizar pontos do cliente:', custErr);
    setErrors({ submit: custErr?.message || 'Erro ao atualizar pontos.' });
    return;
  }

  // 5) Insere transação de pontos
  const { data: txData, error: txErr } = await supabase
    .from<PointsTransaction>('points_transactions')
    .insert({
      company_id:    companyId,
      customer_id:   customer.id,
      customer_name: customer.name,
      type:          'earned',
      points:        pointsEarned,
      description:   `Compra: ${formatCurrency(amount)}`,
      date:          new Date(),
    })
    .select('*')
    .single();

  if (txErr || !txData) {
    console.error('Erro ao registrar transação:', txErr);
    setErrors({ submit: txErr?.message || 'Erro ao salvar transação.' });
    return;
  }

  const newSale: Sale = {
  id:            saleData.id,
  customerId:    saleData.customer_id,
  customerName:  saleData.customer_name,
  amount:        Number(saleData.amount),
  pointsEarned:  saleData.points_earned,
  date:          saleData.date ? new Date(saleData.date) : new Date(),
  description:   saleData.description ?? '',
  companyId:     saleData.company_id,
};

dispatch({ type: 'ADD_SALE',               payload: newSale });
dispatch({ type: 'UPDATE_CUSTOMER',        payload: updatedCustomer });
dispatch({ type: 'ADD_POINTS_TRANSACTION', payload: txData });

// fecha o modal
onClose();
};



  const selectedCustomer = customers.find(c => c.id === formData.customerId);
  const amt = Number(formData.amount) || 0;
  const ptsToEarn = Math.floor(amt / companyPointsConfig.reaisPerPoint);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Nova Venda</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* cliente */}
          <div>
            <label className="block mb-2 font-medium">Cliente *</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={formData.customerSearch}
                onChange={handleCustomerSearch}
                onFocus={() => setShowCustomerDropdown(true)}
                className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-pink-500 ${
                  errors.customerId ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Busque por nome, CPF ou email..."
              />
              {showCustomerDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow max-h-60 overflow-y-auto">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => selectCustomer(c)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0"
                      >
                        <div className="font-medium">{c.name}</div>
                        <div className="text-sm text-gray-500">
                          {c.cpf} • {c.email} • {c.points} pontos
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">Nenhum cliente encontrado</div>
                  )}
                </div>
              )}
            </div>
            {errors.customerId && <p className="mt-1 text-sm text-red-600">{errors.customerId}</p>}
          </div>

          {/* valor */}
          <div>
            <label className="block mb-2 font-medium">Valor da Venda *</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 text-gray-400" />
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-pink-500 ${
                  errors.amount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
          </div>

          {/* descrição */}
          <div>
            <label className="block mb-2 font-medium">Descrição</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-gray-400" />
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-pink-500"
                placeholder="Descrição (opcional)"
              />
            </div>
          </div>

          {/* resumo */}
          {amt > 0 && (
            <div className="p-4 bg-green-50 border rounded-lg">
              <p className="text-green-700">Valor: {formatCurrency(amt)}</p>
              <p className="text-green-700">Pontos a ganhar: {ptsToEarn}</p>
              {selectedCustomer && (
                <p className="text-green-700">
                  Total pontos: {selectedCustomer.points + ptsToEarn}
                </p>
              )}
            </div>
          )}

          {/* botões */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-orange-400 text-white rounded-lg hover:from-pink-600 hover:to-orange-500"
            >
              Registrar Venda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
