import React, { useState } from 'react';
import { Brain, Mail, Lock, Eye, EyeOff, Building2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { cleanPhone } from '../utils/helpers';

export default function LoginForm() {
  const { state, dispatch } = useApp();
  const [loginType, setLoginType] = useState<'superadmin' | 'company' | 'customer'>('company');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companySlug, setCompanySlug] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Super Admin login
    if (loginType === 'superadmin') {
      if (email === 'onsolutions' && password === '33537095a') {
        dispatch({
          type: 'SET_CURRENT_USER',
          payload: {
            id: 'superadmin',
            type: 'superadmin',
            email: 'onsolutions',
            name: 'Super Administrador',
          },
        });
        return;
      } else {
        setError('Credenciais de super admin inválidas');
        return;
      }
    }

    // Company Admin login
    if (loginType === 'company') {
      const company = state.companies.find(c => c.ownerEmail === email && c.isActive);
      if (!company) {
        setError('Empresa não encontrada ou inativa');
        return;
      }

      if (company.password !== password) {
        setError('Senha incorreta');
        return;
      }

      dispatch({
        type: 'SET_CURRENT_USER',
        payload: {
          id: company.id,
          type: 'admin',
          email: company.ownerEmail,
          name: company.ownerName,
          companyId: company.id,
        },
      });
      dispatch({ type: 'SET_CURRENT_COMPANY', payload: company });
      return;
    }

    // Customer login
    if (loginType === 'customer') {
      const customer = state.customers.find(c => c.email === email);
      if (!customer) {
        setError('Cliente não encontrado');
        return;
      }

      if (customer.password !== password) {
        setError('Senha incorreta');
        return;
      }

      const company = state.companies.find(c => c.id === customer.companyId && c.isActive);
      if (!company) {
        setError('Empresa não encontrada ou inativa');
        return;
      }

      dispatch({
        type: 'SET_CURRENT_USER',
        payload: {
          id: customer.id,
          type: 'customer',
          email: customer.email,
          name: customer.name,
          companyId: company.id,
        },
      });
      dispatch({ type: 'SET_CURRENT_COMPANY', payload: company });
      return;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Fideliza.AI
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Plataforma inteligente de fidelidade
          </p>
        </div>

        {/* Login Type Selector */}
        <div className="bg-white rounded-lg p-1 shadow-sm border border-gray-200">
          <div className="grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => setLoginType('company')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-all ${
                loginType === 'company'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Empresa
            </button>
            <button
              type="button"
              onClick={() => setLoginType('customer')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-all ${
                loginType === 'customer'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Cliente
            </button>
            <button
              type="button"
              onClick={() => setLoginType('superadmin')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-all ${
                loginType === 'superadmin'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Admin
            </button>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {loginType === 'superadmin' ? 'Usuário' : 'Email'}
              </label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full px-10 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder={loginType === 'superadmin' ? 'Digite seu usuário' : 'Digite seu email'}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-10 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Digite sua senha"
                  required
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
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
          >
            Entrar
          </button>
        </form>

        {loginType === 'customer' && (
          <div className="text-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 space-y-2">
              <p className="text-sm text-gray-600 font-medium">Acesso do Cliente</p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>Faça login com seu email e senha</p>
                <p>Sua senha inicial é seu número de telefone</p>
                <p>Você verá todas as empresas onde possui cadastro</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}