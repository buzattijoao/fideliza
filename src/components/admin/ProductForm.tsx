import React, { useState } from 'react';
import { X, Package, FileText, Award, Image } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Product } from '../../types';
import { supabase } from '../../lib/supabase';

interface ProductFormProps {
  product?: Product;
  onClose:  () => void;
  onSave:   () => void;
}

export default function ProductForm({ product, onClose, onSave }: ProductFormProps) {
  const { state, dispatch } = useApp();
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    pointsRequired: product?.pointsRequired || 0,
    imageUrl: product?.imageUrl || '',
    available: product?.available !== false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({ ...prev, [name]: finalValue }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    if (formData.pointsRequired <= 0) {
      newErrors.pointsRequired = 'Pontos devem ser maior que zero';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validate()) return;

  // 1) Monte o objeto no formato snake_case que a tabela espera
  const payload = {
    name:             formData.name.trim(),
    description:      formData.description.trim(),
    points_required:  Number(formData.pointsRequired),
    image_url:        formData.imageUrl.trim() || null,
    available:        formData.available,
    company_id:       state.currentCompany?.id,
  };

  let data: Product | null = null;
  let error: any = null;

  if (product) {
    // 2a) Se for edição, faz UPDATE
    const res = await supabase
      .from<Product>('products')
      .update(payload)
      .eq('id', product.id)
      .select()    // força o return da linha atualizada
      .single();
    data = res.data;
    error = res.error;
  } else {
    // 2b) Se for criação, faz INSERT
    const res = await supabase
      .from<Product>('products')
      .insert(payload)
      .select()    // força o return do novo registro
      .single();
    data = res.data;
    error = res.error;
  }

  if (error || !data) {
    console.error('Erro ao salvar produto:', error);
    setErrors({ submit: error?.message || 'Erro inesperado' });
    return;
  }

  // 3) Dispatch usando o objeto que veio do banco
  if (product) {
    dispatch({ type: 'UPDATE_PRODUCT', payload: data });
  } else {
    dispatch({ type: 'ADD_PRODUCT', payload: data });
  }

  // 4) Recarrega a lista e fecha o modal
  onSave();   // <<< aqui você recarrega os produtos no dashboard
  onClose();  // <<< fecha o formulário
};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {product ? 'Editar Produto' : 'Novo Produto'}
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
              Nome *
            </label>
            <div className="relative">
              <Package className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Nome do produto"
              />
            </div>
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all resize-none ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Descrição do produto"
              />
            </div>
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pontos Necessários *
            </label>
            <div className="relative">
              <Award className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="number"
                name="pointsRequired"
                value={formData.pointsRequired}
                onChange={handleChange}
                min="1"
                className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all ${
                  errors.pointsRequired ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
              />
            </div>
            {errors.pointsRequired && <p className="mt-1 text-sm text-red-600">{errors.pointsRequired}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL da Imagem
            </label>
            <div className="relative">
              <Image className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              name="available"
              id="available"
              checked={formData.available}
              onChange={handleChange}
              className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
            />
            <label htmlFor="available" className="text-sm font-medium text-gray-700">
              Produto disponível
            </label>
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
              className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-500 to-orange-400 text-white rounded-lg hover:from-pink-600 hover:to-orange-500 transition-all transform hover:scale-105"
            >
              {product ? 'Salvar' : 'Criar Produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}