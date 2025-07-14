import React, { useState } from 'react';
import { X, Building2, User, Mail, Lock, CreditCard, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Company } from '../../types';
import { generateId, validateEmail } from '../../utils/helpers';

interface CompanyFormProps {
  company?: Company;
  onClose: () => void;
}

export default function CompanyForm({ company, onClose }: CompanyFormProps) {
  const { state, dispatch } = useApp();
  const [formData, setFormData] = useState({
    name: company?.name || '',
    slug: company?.slug || '',
    ownerName: company?.ownerName || '',
    ownerEmail: company?.ownerEmail || '',
    password: company?.password || '',
    planId: company?.planId || '',
    isActive: company?.isActive !== false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let finalValue = value;

    if (name === 'name' && !company) {
      // Auto-generate slug from company name
      const slug = value.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData(prev => ({ ...prev, name: value, slug }));
      return;
    }

    if (name === 'slug') {
      // Clean slug
      finalValue = value.toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }

    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome da empresa é obrigatório';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Código da empresa é obrigatório';
    } else if (formData.slug.length < 3) {
      newErrors.slug = 'Código deve ter pelo menos 3 caracteres';
    } else {
      // Check if slug is unique
      const existingCompany = state.companies.find(c => 
        c.slug === formData.slug && c.id !== company?.id
      );
      if (existingCompany) {
        newErrors.slug = 'Este código já está em uso';
      }
    }

    if (!formData.ownerName.trim()) {
      newErrors.ownerName = 'Nome do proprietário é obrigatório';
    }

    if (!formData.ownerEmail.trim()) {
      newErrors.ownerEmail = 'Email é obrigatório';
    } else if (!validateEmail(formData.ownerEmail)) {
      newErrors.ownerEmail = 'Email inválido';
    } else {
      // Check if email is unique
      const existingCompany = state.companies.find(c => 
        c.ownerEmail === formData.ownerEmail && c.id !== company?.id
      );
      if (existingCompany) {
        newErrors.ownerEmail = 'Este email já está em uso';
      }
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 4) {
      newErrors.password = 'Senha deve ter pelo menos 4 caracteres';
    }

    if (!formData.planId) {
      newErrors.planId = 'Plano é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    const companyData: Company = {
      id: company?.id || generateId(),
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      ownerName: formData.ownerName.trim(),
      ownerEmail: formData.ownerEmail.trim(),
      password: formData.password.trim(),
      planId: formData.planId,
      isActive: formData.isActive,
      createdAt: company?.createdAt || new Date(),
    };

    if (company) {
      dispatch({ type: 'UPDATE_COMPANY', payload: companyData });
    } else {
      dispatch({ type: 'ADD_COMPANY', payload: companyData });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {company ? 'Editar Empresa' : 'Nova Empresa'}
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
              Nome da Empresa *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Nome da empresa"
              />
            </div>
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código da Empresa *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.slug ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="codigo-da-empresa"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              URL de acesso: site.com.br/{formData.slug || 'codigo-da-empresa'}
            </p>
            {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Proprietário *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.ownerName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Nome completo do proprietário"
              />
            </div>
            {errors.ownerName && <p className="mt-1 text-sm text-red-600">{errors.ownerName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email do Proprietário *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="email"
                name="ownerEmail"
                value={formData.ownerEmail}
                onChange={handleChange}
                className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.ownerEmail ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="email@exemplo.com"
              />
            </div>
            {errors.ownerEmail && <p className="mt-1 text-sm text-red-600">{errors.ownerEmail}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Senha de acesso"
              />
              <button
                type="button"
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plano *
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <select
                name="planId"
                value={formData.planId}
                onChange={handleChange}
                className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  errors.planId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Selecione um plano</option>
                {state.plans.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - R$ {plan.price.toFixed(2)}/mês
                  </option>
                ))}
              </select>
            </div>
            {errors.planId && <p className="mt-1 text-sm text-red-600">{errors.planId}</p>}
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              name="isActive"
              id="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Empresa ativa
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
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105"
            >
              {company ? 'Salvar' : 'Criar Empresa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}