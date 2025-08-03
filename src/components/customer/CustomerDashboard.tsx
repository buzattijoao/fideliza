import React, { useState, useEffect } from 'react';
import { Award, Gift, History, Settings, User, Lock, Eye, EyeOff, Package, X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { formatDate, formatBirthDate, getAge } from '../../utils/helpers';
import { LoyaltyRequest, PointsTransaction } from '../../types';
import { supabase } from '../../lib/supabase';

export default function CustomerDashboard() {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState('points');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const customerAccounts = state.customers.filter(c => c.email === state.currentUser?.email);
  const currentCustomer = customerAccounts.find(c => c.companyId === selectedCompanyId);
  const currentCompany = state.companies.find(c => c.id === selectedCompanyId);

  async function fetchCustomerRequests() {
  if (!currentCustomer || !selectedCompanyId) return;
  const { data, error } = await supabase
    .from('loyalty_requests')
    .select('*')
    .eq('company_id', selectedCompanyId)
    .eq('customer_id', currentCustomer.id)
    .order('request_date', { ascending: false });

  if (error || !data) {
    console.error('Erro ao buscar solicitações:', error);
    return;
  }

  // mapeia cada linha do banco para o seu tipo LoyaltyRequest
  const mapped: LoyaltyRequest[] = data.map(r => ({
    id:                   r.id,
    customerId:           r.customer_id,
    customerName:         r.customer_name,
    productId:            r.product_id,
    productName:          r.product_name,
    pointsUsed:           r.points_used,
    customerPointsBefore: r.customer_points_before,
    status:               r.status as any,
    requestDate:          new Date(r.request_date),
    processedDate:        r.processed_date ? new Date(r.processed_date) : undefined,
    processedBy:          r.processed_by ?? undefined,
    expiresAt:            r.expires_at   ? new Date(r.expires_at)   : undefined,
    companyId:            r.company_id,
  }));

  // joga tudo no estado de uma vez só
  dispatch({ type: 'SET_LOYALTY_REQUESTS', payload: mapped });
}

// 1.2) useEffect para rodar essa busca sempre que mudar de empresa ou cliente
React.useEffect(() => {
  fetchCustomerRequests();
}, [selectedCompanyId, currentCustomer?.id]);

// 2) Assinatura realtime de INSERT e UPDATE
useEffect(() => {
  if (!currentCustomer || !selectedCompanyId) return;

  const channel = supabase
    .channel('customer_loyalty_requests')
    .on('postgres_changes', {
      event:  'INSERT',
      schema: 'public',
      table:  'loyalty_requests',
      filter: `company_id=eq.${selectedCompanyId},customer_id=eq.${currentCustomer.id}`,
    }, ({ new: r }) => {
      const mapped: LoyaltyRequest = {      // <-- aqui
        id:                   r.id,
        customerId:           r.customer_id,
        customerName:         r.customer_name,
        productId:            r.product_id,
        productName:          r.product_name,
        pointsUsed:           r.points_used,
        customerPointsBefore: r.customer_points_before,
        status:               r.status as any,
        requestDate:          new Date(r.request_date),
        processedDate:        r.processed_date ? new Date(r.processed_date) : undefined,
        processedBy:          r.processed_by ?? undefined,
        expiresAt:            r.expires_at   ? new Date(r.expires_at)   : undefined,
        companyId:            r.company_id,
      };
      dispatch({ type: 'ADD_LOYALTY_REQUEST', payload: mapped });
    })
    .on('postgres_changes', {
      event:  'UPDATE',
      schema: 'public',
      table:  'loyalty_requests',
      filter: `company_id=eq.${selectedCompanyId},customer_id=eq.${currentCustomer.id}`,
    }, ({ new: r }) => {
      const mapped: LoyaltyRequest = {      // <-- e aqui também
        id:                   r.id,
        customerId:           r.customer_id,
        customerName:         r.customer_name,
        productId:            r.product_id,
        productName:          r.product_name,
        pointsUsed:           r.points_used,
        customerPointsBefore: r.customer_points_before,
        status:               r.status as any,
        requestDate:          new Date(r.request_date),
        processedDate:        r.processed_date ? new Date(r.processed_date) : undefined,
        processedBy:          r.processed_by ?? undefined,
        expiresAt:            r.expires_at   ? new Date(r.expires_at)   : undefined,
        companyId:            r.company_id,
      };
      dispatch({ type: 'UPDATE_LOYALTY_REQUEST', payload: mapped });
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [selectedCompanyId, currentCustomer?.id, dispatch]);
  

  const handleRequestProduct = async (product: any) => {
    // 1) validar pontos
    if (product.pointsRequired > currentCustomer.points) {
      alert('Você não possui pontos suficientes para este produto.');
      return;
    }
    if (!window.confirm(`Deseja solicitar ${product.name} por ${product.pointsRequired} pontos?`)) {
      return;
    }

    // 2) Inserir a solicitação no banco e já receber o registro completo (com UUID)
    const { data: newReq, error: reqErr } = await supabase
      .from<LoyaltyRequest>('loyalty_requests')
      .insert({
        customer_id:   currentCustomer.id,
        customer_name: currentCustomer.name,
        product_id:    product.id,
        product_name:  product.name,
        points_used:   product.pointsRequired,
        status:        'pending',
        request_date:  new Date(),
        company_id:    selectedCompanyId,
      })
      .select('*')
      .single();
    if (reqErr || !newReq) {
      console.error('Erro ao criar solicitação:', reqErr);
      alert('Falha ao enviar solicitação');
      return;
    }

    // 3) Atualizar o saldo de pontos do cliente no banco
    const newPoints = currentCustomer.points - product.pointsRequired;
    const { data: updCust, error: custErr } = await supabase
      .from<Customer>('customers')
      .update({ points: newPoints })
      .eq('id', currentCustomer.id)
      .select('*')
      .single();
    if (custErr || !updCust) {
      console.error('Erro ao atualizar pontos do cliente:', custErr);
      // aqui você poderia até tentar reverter a inserção de newReq, se quiser…
      return;
    }

    // 4) Registrar a transação de pontos no banco
    const { data: newTx, error: txErr } = await supabase
      .from<PointsTransaction>('points_transactions')
      .insert({
        company_id:    selectedCompanyId,
        customer_id:   currentCustomer.id,
        customer_name: currentCustomer.name,
        type:          'spent',
        points:        product.pointsRequired,
        description:   `Solicitação: ${product.name}`,
        date:          new Date(),
      })
      .select('*')
      .single();
    if (txErr || !newTx) {
      console.error('Erro ao criar transação:', txErr);
      // opcional: lidar com rollback
    }

    // 5) Atualizar o estado local para refletir imediatamente (e/ou rely no realtime)
    dispatch({ type: 'ADD_LOYALTY_REQUEST',   payload: newReq });
    dispatch({ type: 'UPDATE_CUSTOMER',        payload: updCust });
    dispatch({ type: 'ADD_POINTS_TRANSACTION', payload: newTx! });

    alert('✅ Solicitação enviada com sucesso! Aguarde aprovação.');
  };
  
  // Set initial selected company if not set
  React.useEffect(() => {
    if (!selectedCompanyId && customerAccounts.length > 0) {
      setSelectedCompanyId(customerAccounts[0].companyId);
    }
  }, [customerAccounts, selectedCompanyId]);

  
  if (!currentCustomer || !currentCompany) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  const availableProducts = state.products.filter(p => p.available && p.companyId === selectedCompanyId);
  const affordableProducts = availableProducts.filter(p => p.pointsRequired <= currentCustomer.points);
  const customerTransactions = state.pointsTransactions.filter(t => t.customerId === currentCustomer.id && t.companyId === selectedCompanyId);
  const companyPointsConfig = state.pointsConfigs.find(pc => pc.companyId === selectedCompanyId) || { reaisPerPoint: 10, companyId: selectedCompanyId };

  // Customer loyalty requests
  const customerLoyaltyRequests = state.loyaltyRequests.filter(r => r.customerId === currentCustomer.id && r.companyId === selectedCompanyId);


  const tabs = [
    { id: 'points', label: 'Meus Pontos', icon: Award },
    { id: 'products', label: 'Produtos', icon: Gift },
    { id: 'orders', label: 'Pedidos', icon: Package },
    { id: 'history', label: 'Histórico', icon: History },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword.length < 4) {
      setPasswordError('A senha deve ter pelo menos 4 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem');
      return;
    }

    const updatedCustomer = {
      ...currentCustomer,
      password: newPassword,
    };

    dispatch({ type: 'UPDATE_CUSTOMER', payload: updatedCustomer });
    setShowPasswordForm(false);
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Company Selector */}
      {customerAccounts.length > 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selecione a empresa
          </label>
          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            {customerAccounts.map((account) => {
              const company = state.companies.find(c => c.id === account.companyId);
              return (
                <option key={account.companyId} value={account.companyId}>
                  {company?.name} - {account.points} pontos
                </option>
              );
            })}
          </select>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-orange-400 rounded-xl p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Olá, {currentCustomer.name}!</h1>
            <p className="text-pink-100 mt-1">{currentCompany.name} - Programa de Fidelidade</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{currentCustomer.points}</div>
            <div className="text-pink-100">pontos disponíveis</div>
          </div>
        </div>
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
                      ? 'border-pink-500 text-pink-600'
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
          {activeTab === 'points' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-pink-50 to-orange-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pontos Totais</p>
                      <p className="text-2xl font-bold text-pink-600">{currentCustomer.points}</p>
                    </div>
                    <Award className="w-8 h-8 text-pink-500" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Produtos Disponíveis</p>
                      <p className="text-2xl font-bold text-green-600">{affordableProducts.length}</p>
                    </div>
                    <Gift className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Transações</p>
                      <p className="text-2xl font-bold text-blue-600">{customerTransactions.length}</p>
                    </div>
                    <History className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-medium text-blue-800 mb-2">Como funciona o sistema de pontos?</h3>
                <p className="text-sm text-blue-700">
                  A cada R$ {companyPointsConfig.reaisPerPoint.toFixed(2)} gastos, você ganha 1 ponto.
                  Use seus pontos para resgatar produtos incríveis em nossa loja!
                </p>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availableProducts.map((product) => {
                  const canAfford = product.pointsRequired <= currentCustomer.points;
                  return (
                    <div
                      key={product.id}
                      className={`rounded-lg border-2 p-6 transition-all ${
                        canAfford
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{product.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                          <div className="mt-4 flex items-center justify-between">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              canAfford
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {product.pointsRequired} pontos
                            </span>
                            {canAfford && (
                              <span className="text-sm text-green-600 font-medium">
                                ✓ Disponível
                              </span>
                            )}
                          </div>
                        </div>
                        {product.imageUrl && (
                          <div className="ml-4">
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                      {canAfford && (
                        <button
                          onClick={() => handleRequestProduct(product)}
                          className="mt-4 w-full bg-gradient-to-r from-pink-500 to-orange-400 text-white py-2 px-4 rounded-lg hover:from-pink-600 hover:to-orange-500 transition-all transform hover:scale-105"
                        >
                          Solicitar Agora
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {availableProducts.length === 0 && (
                <div className="text-center py-12">
                  <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum produto disponível no momento</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              {customerLoyaltyRequests.map((request) => (
                <div
                  key={request.id}
                  className={`rounded-lg p-4 border-2 ${
                    request.status === 'pending'
                      ? 'bg-yellow-50 border-yellow-200'
                      : request.status === 'approved'
                      ? 'bg-blue-50 border-blue-200'
                      : request.status === 'completed'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{request.productName}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Solicitado em {formatDate(new Date(request.requestDate))}
                      </p>
                      <div className="flex items-center space-x-4 mt-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {request.pointsUsed} pontos
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          request.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : request.status === 'approved'
                            ? 'bg-blue-100 text-blue-800'
                            : request.status === 'available_for_pickup'
                            ? 'bg-cyan-100 text-cyan-800'
                            : request.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {request.status === 'pending'
                            ? 'Aguardando resposta da loja'
                            : request.status === 'approved'
                            ? 'Aprovado'
                            : request.status === 'available_for_pickup'
                            ? 'Disponível para retirada'
                            : request.status === 'completed'
                            ? 'Concluído'
                            : 'Rejeitado'}
                        </span>
                      </div>
                      
                      {request.status === 'available_for_pickup' && request.expiresAt && (
                        <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Package className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">
                              Produto disponível para retirada
                            </span>
                          </div>
                          <div className="mt-1">
                            <CustomerCountdownTimer expiresAt={new Date(request.expiresAt)} />
                          </div>
                        </div>
                      )}
                      
                      {request.status === 'completed' && (
                        <div className="mt-3 p-3 bg-green-100 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Award className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">
                              Produto entregue com sucesso!
                            </span>
                          </div>
                          {request.processedDate && (
                            <p className="text-xs text-green-600 mt-1">
                              Concluído em {formatDate(new Date(request.processedDate))}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {request.status === 'rejected' && (
                        <div className="mt-3 p-3 bg-red-100 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Package className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-medium text-red-800">
                              Solicitação rejeitada
                            </span>
                          </div>
                          {request.rejectionReason && (
                            <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                              <p className="text-xs font-medium text-red-800">Motivo:</p>
                              <p className="text-xs text-red-700">{request.rejectionReason}</p>
                            </div>
                          )}
                          {request.processedDate && (
                            <p className="text-xs text-red-600 mt-1">
                              Rejeitado em {formatDate(new Date(request.processedDate))}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {customerLoyaltyRequests.length === 0 && (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Você ainda não fez nenhuma solicitação</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Acesse a aba "Produtos" para solicitar itens com seus pontos
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {customerTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{transaction.description}</h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(new Date(transaction.date))}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                      transaction.type === 'earned' || transaction.type === 'credit'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type === 'earned' || transaction.type === 'credit' ? '+' : '-'}
                      {transaction.points} pontos
                    </span>
                  </div>
                </div>
              ))}

              {customerTransactions.length === 0 && (
                <div className="text-center py-12">
                  <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma transação encontrada</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informações da Conta</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nome</label>
                    <p className="mt-1 text-sm text-gray-900">{currentCustomer.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{currentCustomer.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Telefone</label>
                    <p className="mt-1 text-sm text-gray-900">{currentCustomer.phone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">CPF</label>
                    <p className="mt-1 text-sm text-gray-900">{currentCustomer.cpf}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data de Nascimento</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatBirthDate(new Date(currentCustomer.birthDate))} ({getAge(new Date(currentCustomer.birthDate))} anos)
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Alterar Senha</h3>
                {!showPasswordForm ? (
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-orange-400 text-white rounded-lg hover:from-pink-600 hover:to-orange-500 transition-all"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Alterar Senha</span>
                  </button>
                ) : (
                  <form onSubmit={handlePasswordUpdate} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nova Senha
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                          placeholder="Digite sua nova senha"
                          required
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirmar Nova Senha
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                          placeholder="Confirme sua nova senha"
                          required
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {passwordError && (
                      <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                        {passwordError}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordForm(false);
                          setNewPassword('');
                          setConfirmPassword('');
                          setPasswordError('');
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-gradient-to-r from-pink-500 to-orange-400 text-white rounded-lg hover:from-pink-600 hover:to-orange-500 transition-all"
                      >
                        Salvar Senha
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Customer Countdown Timer Component
function CustomerCountdownTimer({ expiresAt }: { expiresAt: Date }) {
  const [timeLeft, setTimeLeft] = useState('');

  React.useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Expirado');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <div className="text-sm text-blue-700">
      <span className="font-medium">Tempo restante: </span>
      <span className={`font-mono ${timeLeft === 'Expirado' ? 'text-red-600' : 'text-blue-600'}`}>
        {timeLeft === 'Expirado' ? '⏰ Expirado' : `⏰ ${timeLeft}`}
      </span>
    </div>
  );
}