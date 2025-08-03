import React, { useState } from 'react';
import { useEffect } from 'react';
import { 
  Building2, 
  CreditCard, 
  Users, 
  TrendingUp, 
  Plus, 
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Database,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import CompanyForm from './CompanyForm';
import PlanForm from './PlanForm';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { checkSupabaseConnection, supabase } from '../../lib/supabase';

export default function SuperAdminDashboard() {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState('companies');
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [supabaseStatus, setSupabaseStatus] = useState<{ connected: boolean; error: string | null } | null>(null);
  const [empresasCount, setEmpresasCount] = useState<number>(0);
  const [activeEmpresasCount, setActiveEmpresasCount] = useState<number>(0);
  const [clientesCount, setClientesCount] = useState<number>(0);
  const [receitaPotencial, setReceitaPotencial] = useState<number>(0);
  

  useEffect(() => {
    const checkConnection = async () => {
      const status = await checkSupabaseConnection();
      setSupabaseStatus(status);
    };
    
    checkConnection();
    // Fetch dashboard metrics from Supabase
    const fetchMetrics = async () => {
      const { count: total } = await supabase.from('companies').select('*', { count: 'exact', head: true });
      if (total != null) setEmpresasCount(total);
      const { count: active } = await supabase.from('companies').select('*', { count: 'exact', head: true }).eq('is_active', true);
      if (active != null) setActiveEmpresasCount(active);
      const { count: clientes } = await supabase.from('customers').select('*', { count: 'exact', head: true });
      if (clientes != null) setClientesCount(clientes);
      const { data: emps } = await supabase.from('companies').select('plan_id').eq('is_active', true);
      let rev = 0;
      for (const e of emps) {
        const { data: plan } = await supabase
          .from('plans')
          .select('price')
         .eq('id', e.plan_id)
          .single();
        // forçar number e fallback a 0
        const price = plan?.price ? Number(plan.price) : 0;
        rev += price;
      }
      setReceitaPotencial(rev);
    };
    fetchMetrics();
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { id: 'companies', label: 'Empresas', icon: Building2 },
    { id: 'plans', label: 'Planos', icon: CreditCard },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  ];

  const stats = [
    {
      label: 'Total de Empresas',
      value: empresasCount,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Empresas Ativas',
      value: activeEmpresasCount,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Total de Clientes',
      value: clientesCount,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      label: 'Receita Potencial',
      value: formatCurrency(receitaPotencial),
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
   },
  ];

  const filteredCompanies = state.companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPlans = state.plans.filter(plan =>
    plan.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteCompany = async (companyId: string) => {
  const company = state.companies.find(c => c.id === companyId);
  if (!company) return;

  const companyCustomers = state.customers.filter(c => c.companyId === companyId);
  const companyProducts = state.products.filter(p => p.companyId === companyId);
  const companySales = state.sales.filter(s => s.companyId === companyId);
  const companyTransactions = state.pointsTransactions.filter(t => t.companyId === companyId);
  const companyRequests = state.loyaltyRequests.filter(r => r.companyId === companyId);
  const companyPointsConfig = state.pointsConfigs.filter(pc => pc.companyId === companyId);

  const confirmMessage = `ATENÇÃO: Tem certeza que deseja excluir a empresa "${company.name}"?\n\nEsta ação irá excluir PERMANENTEMENTE:\n- ${companyCustomers.length} cliente(s)\n- ${companyProducts.length} produto(s)\n- ${companySales.length} venda(s)\n- ${companyTransactions.length} transação(ões) de pontos\n- ${companyRequests.length} solicitação(ões)\n- Configurações de pontos\n\nTODOS OS DADOS SERÃO PERDIDOS!\nEsta operação NÃO PODE ser desfeita!\n\nDigite "EXCLUIR" para confirmar:`;
  
  const userInput = prompt(confirmMessage);

  if (userInput === 'EXCLUIR') {
    try {
      // Se possível, faça primeiro no banco de dados (Supabase):
      // Apague os filhos antes (ordem importa!)
      await Promise.all([
        ...companyRequests.map(r => supabase.from('loyalty_requests').delete().eq('id', r.id)),
        ...companyTransactions.map(t => supabase.from('points_transactions').delete().eq('id', t.id)),
        ...companySales.map(s => supabase.from('sales').delete().eq('id', s.id)),
        ...companyProducts.map(p => supabase.from('products').delete().eq('id', p.id)),
        ...companyCustomers.map(c => supabase.from('customers').delete().eq('id', c.id)),
        ...companyPointsConfig.map(pc => supabase.from('points_configs').delete().eq('company_id', pc.companyId)),
      ]);
      // Agora apague a empresa no banco
      await supabase.from('companies').delete().eq('id', companyId);

      // Agora sim, limpa localmente
      companyRequests.forEach(request => {
        dispatch({ type: 'DELETE_LOYALTY_REQUEST', payload: request.id });
      });
      companyTransactions.forEach(transaction => {
        dispatch({ type: 'DELETE_POINTS_TRANSACTION', payload: transaction.id });
      });
      companySales.forEach(sale => {
        dispatch({ type: 'DELETE_SALE', payload: sale.id });
      });
      companyProducts.forEach(product => {
        dispatch({ type: 'DELETE_PRODUCT', payload: product.id });
      });
      companyCustomers.forEach(customer => {
        dispatch({ type: 'DELETE_CUSTOMER', payload: customer.id });
      });
      companyPointsConfig.forEach(config => {
        dispatch({ type: 'DELETE_POINTS_CONFIG', payload: config.companyId });
      });
      dispatch({ type: 'DELETE_COMPANY', payload: companyId });

      alert('Empresa excluída com sucesso!');
    } catch (err) {
      alert('Erro ao excluir dados no banco: ' + err.message);
    }
  } else if (userInput !== null) {
    alert('Operação cancelada. Digite exatamente "EXCLUIR" para confirmar a exclusão.');
  }
};


  // SuperAdminDashboard.tsx

const handleDeletePlan = async (planId: string) => {
  // 1) checa se há empresas usando
  const inUse = state.companies.some(c => c.planId === planId);
  if (inUse) {
    alert('Não é possível excluir este plano pois existem empresas utilizando-o.');
    return;
  }

  // 2) confirma com o usuário
  if (!window.confirm('Tem certeza que deseja excluir este plano?')) {
    return;
  }

  // 3) dispara o DELETE e seleciona o que foi apagado
  const { data, error, count } = await supabase
    .from('plans')
    .delete({ returning: 'representation' })  // pede para retornar os dados deletados
    .eq('id', planId)
    .select();                               // sem isso, às vezes o supabase-js não faz o request

  console.log('→ deleteRes.data:', data);
  console.log('→ deleteRes.error:', error);
  console.log('→ deleteRes.count:', count);

  // 4) trata o resultado
  if (error) {
    alert('Erro ao excluir plano: ' + error.message);
  } else if (!data || data.length === 0) {
    alert('Nenhum registro deletado. Verifique se o ID existe e sua policy no Supabase.');
  } else {
    dispatch({ type: 'DELETE_PLAN', payload: planId });
    alert('Plano excluído com sucesso!');
  }
};




  const toggleCompanyStatus = (company: any) => {
    const updatedCompany = { ...company, isActive: !company.isActive };
    dispatch({ type: 'UPDATE_COMPANY', payload: updatedCompany });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Supabase Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Database className="w-5 h-5 text-gray-600" />
            <h3 className="text-sm font-medium text-gray-900">Status do Supabase</h3>
          </div>
          <div className="flex items-center space-x-2">
            {supabaseStatus === null ? (
              <span className="text-sm text-gray-500">Verificando...</span>
            ) : supabaseStatus.connected ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">Conectado</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-600">Desconectado</span>
                {supabaseStatus.error && (
                  <span className="text-xs text-red-500 ml-2">({supabaseStatus.error})</span>
                )}
              </>
            )}
          </div>
        </div>
        {!supabaseStatus?.connected && (
          <div className="mt-2 text-xs text-gray-500">
            Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Search and Actions */}
          {activeTab !== 'analytics' && (
            <div className="flex justify-between items-center mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
                />
              </div>
              <div className="flex space-x-3">
                {activeTab === 'companies' && (
                  <button
                    onClick={() => setShowCompanyForm(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nova Empresa</span>
                  </button>
                )}
                {activeTab === 'plans' && (
                  <button
                    onClick={() => setShowPlanForm(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Novo Plano</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          {activeTab === 'companies' && (
            <div className="space-y-4">
              {filteredCompanies.map((company) => {
                const plan = state.plans.find(p => p.id === company.planId);
                const companyCustomers = state.customers.filter(c => c.companyId === company.id);
                const companyProducts = state.products.filter(p => p.companyId === company.id);
                
                return (
                  <div
                    key={company.id}
                    className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-gray-900">{company.name}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          company.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {company.isActive ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{company.ownerName} • {company.ownerEmail}</p>
                      <p className="text-sm text-gray-500">Código: {company.slug}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {plan?.name || 'Sem plano'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {companyCustomers.length} clientes • {companyProducts.length} produtos
                        </span>
                        <span className="text-xs text-gray-500">
                          Desde {formatDate(new Date(company.createdAt))}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => toggleCompanyStatus(company)}
                        className={`p-2 transition-colors ${
                          company.isActive 
                            ? 'text-gray-400 hover:text-red-600' 
                            : 'text-gray-400 hover:text-green-600'
                        }`}
                        title={company.isActive ? 'Desativar' : 'Ativar'}
                      >
                        {company.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setEditingCompany(company)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCompany(company.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'plans' && (
            <div className="space-y-4">
              {filteredPlans.map((plan) => {
                const companiesCount = state.companies.filter(c => c.planId === plan.id).length;
                
                return (
                  <div
                    key={plan.id}
                    className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{plan.name}</h3>
                      <p className="text-sm text-gray-500">
                        {plan.maxCustomers === -1 ? 'Clientes ilimitados' : `${plan.maxCustomers} clientes`} • 
                        {plan.maxProducts === -1 ? ' Produtos ilimitados' : ` ${plan.maxProducts} produtos`}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {formatCurrency(plan.price)}/mês
                        </span>
                        <span className="text-xs text-gray-500">
                          {companiesCount} empresas usando
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="flex flex-wrap gap-1">
                            {plan.features.map((feature, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800"
                              >
                                {feature}
                              </span>
                            ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingPlan(plan)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Distribuição por Planos</h3>
                  <div className="space-y-3">
                    {state.plans.map(plan => {
                      const count = state.companies.filter(c => c.planId === plan.id).length;
                      const percentage = state.companies.length > 0 ? (count / state.companies.length) * 100 : 0;
                      
                      return (
                        <div key={plan.id} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">{plan.name}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Resumo Geral</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total de Vendas</span>
                      <span className="text-sm font-medium">{state.sales.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Receita Total</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(state.sales.reduce((sum, sale) => sum + sale.amount, 0))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Pontos Distribuídos</span>
                      <span className="text-sm font-medium">
                        {state.pointsTransactions.reduce((sum, t) => 
                          t.type === 'earned' || t.type === 'credit' ? sum + t.points : sum, 0
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Produtos Cadastrados</span>
                      <span className="text-sm font-medium">{state.products.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCompanyForm && (
        <CompanyForm
          company={editingCompany}
          onClose={() => {
            setShowCompanyForm(false);
            setEditingCompany(null);
          }}
        />
      )}

      {showPlanForm && (
        <PlanForm
          plan={editingPlan}
          onClose={() => {
            setShowPlanForm(false);
            setEditingPlan(null);
          }}
        />
      )}

      {editingCompany && (
        <CompanyForm
          company={editingCompany}
          onClose={() => setEditingCompany(null)}
        />
      )}

      {editingPlan && (
        <PlanForm
          plan={editingPlan}
          onClose={() => setEditingPlan(null)}
        />
      )}
    </div>
  );
}