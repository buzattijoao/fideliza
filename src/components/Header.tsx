import React from 'react';
import { LogOut, Brain, User, Building2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export default function Header() {
  const { state, dispatch } = useApp();

  const handleLogout = () => {
    dispatch({ type: 'SET_CURRENT_USER', payload: null });
    dispatch({ type: 'SET_CURRENT_COMPANY', payload: null });
  };

  if (!state.currentUser) return null;

  const getTitle = () => {
    if (state.currentUser.type === 'superadmin') {
      return 'Fideliza.AI - Super Admin';
    }
    if (state.currentUser.type === 'admin') {
      return `${state.currentCompany?.name || 'Empresa'} - Painel Admin`;
    }
    return 'Fideliza.AI - Seus Pontos';
  };

  const getSubtitle = () => {
    if (state.currentUser.type === 'superadmin') {
      return 'Gerenciamento de Plataforma';
    }
    if (state.currentUser.type === 'admin') {
      return 'Painel Administrativo';
    }
    return 'Programa de Fidelidade';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              {state.currentUser.type === 'superadmin' ? (
                <Brain className="w-6 h-6 text-white" />
              ) : (
                <Building2 className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{getTitle()}</h1>
              <p className="text-sm text-gray-500">{getSubtitle()}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                {state.currentUser.name}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}