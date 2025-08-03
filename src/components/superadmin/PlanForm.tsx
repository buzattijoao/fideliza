import React, { useState } from 'react';
import { X, CreditCard, Users, Package, DollarSign, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Plan } from '../../types';
import { supabase } from '../../lib/supabase';

interface PlanFormProps {
  plan?: Plan;
  onClose: () => void;
}

export default function PlanForm({ plan, onClose }: PlanFormProps) {
  const { dispatch } = useApp();
  const [formData, setFormData] = useState({
    name: plan?.name || '',
    maxCustomers: plan?.maxCustomers ?? 0, // Use ?? para garantir número
    maxProducts: plan?.maxProducts ?? 0,
    price: plan?.price ?? 0,
    features: plan?.features ?? [''],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;

    if (type === 'number') {
      finalValue = Number(value);
    }
    setFormData(prev => ({ ...prev, [name]: finalValue }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData(prev => ({ ...prev, features: newFeatures }));
  };

  const addFeature = () => {
    setFormData(prev => ({ ...prev, features: [...prev.features, ''] }));
  };

  const removeFeature = (index: number) => {
    if (formData.features.length > 1) {
      const newFeatures = formData.features.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, features: newFeatures }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Nome do plano é obrigatório';
    if (formData.maxCustomers < -1 || formData.maxCustomers === 0)
      newErrors.maxCustomers = 'Número de clientes deve ser maior que 0 ou -1 para ilimitado';
    if (formData.maxProducts < -1 || formData.maxProducts === 0)
      newErrors.maxProducts = 'Número de produtos deve ser maior que 0 ou -1 para ilimitado';
    if (formData.price <= 0)
      newErrors.price = 'Preço deve ser maior que zero';
    const validFeatures = formData.features.filter(f => f.trim());
    if (validFeatures.length === 0)
      newErrors.features = 'Pelo menos uma funcionalidade é obrigatória';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validate()) return;

  // 1) Monta o payload em snake_case para o Supabase
  const payload = {
    name:          formData.name.trim(),
    max_customers: Number(formData.maxCustomers),
    max_products:  Number(formData.maxProducts),
    price:         Number(formData.price),
    features:      formData.features.filter(f => f.trim()),  // <-- array de strings
  };

  let row: any = null;
  let error: any = null;

  if (plan) {
    // Modo edição
    console.log('Editando plano. ID usado:', plan.id);
    console.log('→ payload de edição:', payload);

    const updateRes = await supabase
      .from('plans')
      .update(payload)
      .eq('id', plan.id)
      .select()
      .single();

    console.log('→ updateRes.error (edição):', updateRes.error);

    row   = updateRes.data;
    error = updateRes.error;

    if (!row) {
      console.error(
        'Nenhum plano encontrado com esse ID! ' +
        'Confirme se o ID está correto e existe na tabela plans.'
      );
    }
  } else {
    // Modo criação
    const insertRes = await supabase
      .from('plans')
      .insert(payload)
      .select()
      .single();

    row   = insertRes.data;
    error = insertRes.error;
  }

  // Se deu erro, exibe na UI e aborta
  if (error) {
    setErrors({ submit: error.message });
    return;
  }

  // Se não retornou row por algum motivo
  if (!row) {
    setErrors({
      submit: plan
        ? 'Erro ao editar plano (nenhum plano encontrado).'
        : 'Erro ao criar plano.'
    });
    return;
  }

  // Atualiza o estado global com o resultado
  dispatch({
    type: plan ? 'UPDATE_PLAN' : 'ADD_PLAN',
    payload: {
      id:           row.id,
      name:         row.name,
      maxCustomers: row.max_customers,
      maxProducts:  row.max_products,
      price:        row.price,
      features:     row.features ?? [],      // <-- recebe diretamente o array
      createdAt:    row.created_at
                       ? new Date(row.created_at)
                       : new Date(),
    },
  });

  // Fecha o modal/form
  onClose();
};




  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {plan ? 'Editar Plano' : 'Novo Plano'}
          </h2>
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
              Nome do Plano *
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Nome do plano"
              />
            </div>
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Máximo de Clientes *
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="number"
                name="maxCustomers"
                value={formData.maxCustomers}
                onChange={handleChange}
                className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.maxCustomers ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Use -1 para ilimitado</p>
            {errors.maxCustomers && <p className="mt-1 text-sm text-red-600">{errors.maxCustomers}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Máximo de Produtos *
            </label>
            <div className="relative">
              <Package className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="number"
                name="maxProducts"
                value={formData.maxProducts}
                onChange={handleChange}
                className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.maxProducts ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Use -1 para ilimitado</p>
            {errors.maxProducts && <p className="mt-1 text-sm text-red-600">{errors.maxProducts}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preço Mensal (R$) *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
            </div>
            {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Funcionalidades *
            </label>
            <div className="space-y-2">
              {formData.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => handleFeatureChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Descreva uma funcionalidade"
                  />
                  {formData.features.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="p-2 text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addFeature}
                className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar funcionalidade</span>
              </button>
            </div>
            {errors.features && <p className="mt-1 text-sm text-red-600">{errors.features}</p>}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">Resumo do Plano</h3>
            <div className="space-y-1 text-sm text-blue-700">
              <p>Nome: {formData.name || 'Não definido'}</p>
              <p>
                Clientes: {formData.maxCustomers === -1 ? 'Ilimitados' : formData.maxCustomers}
              </p>
              <p>
                Produtos: {formData.maxProducts === -1 ? 'Ilimitados' : formData.maxProducts}
              </p>
              <p>Preço: R$ {formData.price.toFixed(2)}/mês</p>
            </div>
          </div>

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
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105"
            >
              {plan ? 'Salvar' : 'Criar Plano'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}