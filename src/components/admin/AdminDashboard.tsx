import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShoppingBag, 
  Gift, 
  TrendingUp, 
  Plus, 
  Settings,
  Search,
  Edit,
  Trash2,
  Award,
  CreditCard,
  AlertTriangle,
  QrCode,
  BarChart3,
  DollarSign,
  Webhook,
  Calendar,
  Bell,
  Package2,
  CheckCircle,
  XCircle,
  DollarSign as DollarSignIcon,
  X,
  Package,
  Clock,
  Eye
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import CustomerForm from './CustomerForm';
import ProductForm from './ProductForm';
import SaleForm from './SaleForm';
import PointsConfigForm from './PointsConfigForm';
import PointsManagementForm from './PointsManagementForm';
import { formatCurrency, formatDate, getUpcomingBirthdays, formatBirthDate, getAge, generateId } from '../../utils/helpers';
import QRCodeModal from './QRCodeModal';
import StatisticsModal from './StatisticsModal';
import WebhookConfigModal from './WebhookConfigModal';
import FinancialSaleForm from './FinancialSaleForm';
import { LoyaltyRequest, Customer, PointsTransaction } from '../../types';

export default function AdminDashboard() {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState('customers');
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [showPointsConfig, setShowPointsConfig] = useState(false);
  const [showPointsManagement, setShowPointsManagement] = useState(false);
  const [showFinancialSaleForm, setShowFinancialSaleForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showStatistics, setShowStatistics] = useState<'requests' | 'costs' | null>(null);
  const [showWebhookConfig, setShowWebhookConfig] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [requestToReject, setRequestToReject] = useState(null);

  const currentCompany = state.currentCompany;
  const currentPlan = state.plans.find(p => p.id === currentCompany?.planId);
  
  if (!currentCompany || !currentPlan) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-red-800 mb-2">Erro de Configuração</h2>
          <p className="text-red-600">Empresa ou plano não encontrado. Entre em contato com o suporte.</p>
        </div>
      </div>
    );
  }

  // Filter data by company
  const companyCustomers = state.customers.filter(c => c.companyId === currentCompany.id);
  const companyProducts = state.products.filter(p => p.companyId === currentCompany.id);
  const companySales = state.sales.filter(s => s.companyId === currentCompany.id);
  const companyTransactions = state.pointsTransactions.filter(t => t.companyId === currentCompany.id);
  const companyPointsConfig = state.pointsConfigs.find(pc => pc.companyId === currentCompany.id) || { reaisPerPoint: 10, companyId: currentCompany.id };

  // Loyalty requests
  const companyLoyaltyRequests = state.loyaltyRequests.filter(r => r.companyId === currentCompany.id);
  const pendingRequests = companyLoyaltyRequests.filter(r => r.status === 'pending');

  // Calculate product recurrence data
  const getProductRecurrenceData = () => {
    const productStats = new Map();
    
    companyLoyaltyRequests.forEach(request => {
      const productId = request.productId;
      const productName = request.productName;
      
      if (!productStats.has(productId)) {
        productStats.set(productId, {
          id: productId,
          name: productName,
          totalRequests: 0,
          approvedRequests: 0,
          rejectedRequests: 0,
          pendingRequests: 0,
          completedRequests: 0,
          totalPointsUsed: 0,
          lastRequestDate: null,
        });
      }
      
      const stats = productStats.get(productId);
      stats.totalRequests++;
      stats.totalPointsUsed += request.pointsUsed;
      
      if (!stats.lastRequestDate || new Date(request.requestDate) > new Date(stats.lastRequestDate)) {
        stats.lastRequestDate = request.requestDate;
      }
      
      switch (request.status) {
        case 'approved':
        case 'available_for_pickup':
          stats.approvedRequests++;
          break;
        case 'rejected':
          stats.rejectedRequests++;
          break;
        case 'pending':
          stats.pendingRequests++;
          break;
        case 'completed':
          stats.completedRequests++;
          break;
      }
    });
    
    return Array.from(productStats.values())
      .sort((a, b) => b.totalRequests - a.totalRequests);
  };

  const productRecurrenceData = getProductRecurrenceData();

  // Birthday notifications
  const upcomingBirthdays = getUpcomingBirthdays(companyCustomers, 30);
  const todayBirthdays = upcomingBirthdays.filter(c => c.daysUntilBirthday === 0);
  const nextWeekBirthdays = upcomingBirthdays.filter(c => c.daysUntilBirthday <= 7 && c.daysUntilBirthday > 0);

  // Check plan limits
  const isCustomerLimitReached = currentPlan.maxCustomers !== -1 && companyCustomers.length >= currentPlan.maxCustomers;
  const isProductLimitReached = currentPlan.maxProducts !== -1 && companyProducts.length >= currentPlan.maxProducts;

  const tabs = [
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'products', label: 'Produtos', icon: Gift },
    { id: 'sales', label: 'Vendas', icon: ShoppingBag },
    { id: 'financial', label: 'Financeiro', icon: DollarSignIcon },
    { id: 'requests', label: 'Solicitações', icon: Package2 },
    { id: 'recurrence', label: 'Recorrências', icon: TrendingUp },
    { id: 'transactions', label: 'Transações', icon: TrendingUp },
    { id: 'birthdays', label: 'Aniversários', icon: Calendar },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const stats = [
    {
      label: 'Total de Clientes',
      value: `${companyCustomers.length}${currentPlan.maxCustomers !== -1 ? `/${currentPlan.maxCustomers}` : ''}`,
      icon: Users,
      color: isCustomerLimitReached ? 'text-red-600' : 'text-blue-600',
      bgColor: isCustomerLimitReached ? 'bg-red-100' : 'bg-blue-100',
    },
    {
      label: 'Produtos Ativos',
      value: `${companyProducts.filter(p => p.available).length}${currentPlan.maxProducts !== -1 ? `/${currentPlan.maxProducts}` : ''}`,
      icon: Gift,
      color: isProductLimitReached ? 'text-red-600' : 'text-green-600',
      bgColor: isProductLimitReached ? 'bg-red-100' : 'bg-green-100',
    },
    {
      label: 'Vendas Hoje',
      value: companySales.filter(s => {
        const today = new Date();
        const saleDate = new Date(s.date);
        return saleDate.toDateString() === today.toDateString();
      }).length,
      icon: ShoppingBag,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
    },
    {
      label: 'Receita Total',
      value: formatCurrency(companySales.reduce((sum, sale) => sum + sale.amount, 0)),
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      label: 'Solicitações Pendentes',
      value: pendingRequests.length,
      icon: Package2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  const filteredCustomers = companyCustomers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.cpf.includes(searchTerm)
  );

  const filteredProducts = companyProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSales = companySales.filter(sale =>
    sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sale.description && sale.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredTransactions = companyTransactions.filter(transaction =>
    transaction.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApproveRequest = (request: any) => {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now
    
    const updatedRequest = {
      ...request,
      status: 'available_for_pickup' as const,
      processedDate: new Date(),
      processedBy: state.currentUser?.name || 'Admin',
      expiresAt,
    };

    dispatch({ type: 'UPDATE_LOYALTY_REQUEST', payload: updatedRequest });
  };

  const handleRejectRequest = (request: LoyaltyRequest, shouldReturnPoints: boolean) => {
  // 1) Se for para devolver pontos, atualiza o cliente e registra a transação
  if (shouldReturnPoints) {
    const customer = state.customers.find(c => c.id === request.customerId);
    if (customer) {
      // Atualiza saldo do cliente
      const updatedCustomer: Customer = {
        ...customer,
        points: customer.points + request.pointsUsed,
      };
      dispatch({ type: 'UPDATE_CUSTOMER', payload: updatedCustomer });

      // Cria registro de transação de crédito
      const transaction: PointsTransaction = {
        id: generateId(),
        companyId: currentCompany.id,
        customerId: customer.id,
        customerName: customer.name,
        type: 'credit',
        points: request.pointsUsed,
        description: `Devolução: ${request.productName} (solicitação rejeitada)`,
        date: new Date(),
      };
      dispatch({ type: 'ADD_POINTS_TRANSACTION', payload: transaction });
    }
  }

  // 2) Atualiza sempre o status da solicitação para 'rejected'
  const updatedRequest: LoyaltyRequest = {
    ...request,
    status: 'rejected',
    processedDate: new Date(),
    processedBy: state.currentUser?.name || 'Admin',
  };
  dispatch({ type: 'UPDATE_LOYALTY_REQUEST', payload: updatedRequest });

  // 3) Fecha o modal
  setShowRejectModal(false);
  setRequestToReject(null);
};

  const handleCompleteRequest = (request: any) => {
    if (window.confirm('Marcar como concluído? O produto foi entregue ao cliente?')) {
      const updatedRequest = {
        ...request,
        status: 'completed' as const,
        processedDate: new Date(),
        processedBy: state.currentUser?.name || 'Admin',
      };

      dispatch({ type: 'UPDATE_LOYALTY_REQUEST', payload: updatedRequest });
    }
  };

  const openRejectModal = (request: any) => {
    setRequestToReject(request);
    setShowRejectModal(true);
  };

  // Auto-complete expired requests
  React.useEffect(() => {
    const checkExpiredRequests = () => {
      const now = new Date();
      const expiredRequests = companyLoyaltyRequests.filter(
        r => r.status === 'available_for_pickup' && 
             r.expiresAt && 
             new Date(r.expiresAt) <= now
      );

      expiredRequests.forEach(request => {
        const updatedRequest = {
          ...request,
          status: 'completed' as const,
          processedDate: new Date(),
          processedBy: 'Sistema (expirado)',
        };
        dispatch({ type: 'UPDATE_LOYALTY_REQUEST', payload: updatedRequest });
      });
    };

    const interval = setInterval(checkExpiredRequests, 60000); // Check every minute
    checkExpiredRequests(); // Check immediately

    return () => clearInterval(interval);
  }, [companyLoyaltyRequests, dispatch]);

  const handleDeleteCustomer = (customerId: string) => {
    const customer = state.customers.find(c => c.id === customerId);
    if (!customer) return;

    const confirmMessage = `Tem certeza que deseja excluir o cliente "${customer.name}"?\n\nEsta ação irá:\n- Remover o cliente permanentemente\n- Excluir todas as vendas relacionadas\n- Excluir todas as transações de pontos\n- Excluir todas as solicitações de produtos\n\nEsta operação NÃO PODE ser desfeita!`;
    
    if (window.confirm(confirmMessage)) {
      // Remove related data
      const customerSales = state.sales.filter(s => s.customerId === customerId);
      const customerTransactions = state.pointsTransactions.filter(t => t.customerId === customerId);
      const customerRequests = state.loyaltyRequests.filter(r => r.customerId === customerId);

      // Delete all related data
      customerSales.forEach(sale => {
        dispatch({ type: 'DELETE_SALE', payload: sale.id });
      });
      
      customerTransactions.forEach(transaction => {
        dispatch({ type: 'DELETE_POINTS_TRANSACTION', payload: transaction.id });
      });
      
      customerRequests.forEach(request => {
        dispatch({ type: 'DELETE_LOYALTY_REQUEST', payload: request.id });
      });

      // Finally delete the customer
      dispatch({ type: 'DELETE_CUSTOMER', payload: customerId });
    }
  };

  const handleDeleteProduct = (productId: string) => {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    const relatedRequests = state.loyaltyRequests.filter(r => r.productId === productId);
    const hasActiveRequests = relatedRequests.some(r => r.status === 'pending');

    let confirmMessage = `Tem certeza que deseja excluir o produto "${product.name}"?`;
    
    if (hasActiveRequests) {
      confirmMessage += `\n\nATENÇÃO: Este produto possui solicitações pendentes que também serão excluídas.`;
    }
    
    if (relatedRequests.length > 0) {
      confirmMessage += `\n\nEsta ação irá excluir ${relatedRequests.length} solicitação(ões) relacionada(s).`;
    }
    
    confirmMessage += `\n\nEsta operação NÃO PODE ser desfeita!`;
    
    if (window.confirm(confirmMessage)) {
      // Delete related loyalty requests
      relatedRequests.forEach(request => {
        // If request is pending, return points to customer
        if (request.status === 'pending') {
          const customer = state.customers.find(c => c.id === request.customerId);
          if (customer) {
            const updatedCustomer = {
              ...customer,
              points: customer.points + request.pointsUsed,
            };

            // Create credit transaction
            const transaction = {
              id: generateId(),
              companyId: currentCompany.id,
              customerId: customer.id,
              customerName: customer.name,
              type: 'credit' as const,
              points: request.pointsUsed,
              description: `Devolução automática: ${product.name} (produto excluído)`,
              date: new Date(),
            };

            dispatch({ type: 'UPDATE_CUSTOMER', payload: updatedCustomer });
            dispatch({ type: 'ADD_POINTS_TRANSACTION', payload: transaction });
          }
        }
        
        dispatch({ type: 'DELETE_LOYALTY_REQUEST', payload: request.id });
      });

      dispatch({ type: 'DELETE_PRODUCT', payload: productId });
    }
  };

  const handleDeleteRequest = (request: any) => {
    if (window.confirm('Tem certeza que deseja excluir esta solicitação?')) {
      dispatch({ type: 'DELETE_LOYALTY_REQUEST', payload: request.id });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Plan Info */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{currentCompany.name}</h2>
            <p className="text-blue-100 mt-1">Plano: {currentPlan.name}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-100">Código de acesso</div>
            <div className="text-lg font-bold">{currentCompany.slug}</div>
          </div>
        </div>
      </div>

      {/* Plan Limits Warning */}
      {(isCustomerLimitReached || isProductLimitReached) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Limite do plano atingido</h3>
              <p className="text-sm text-yellow-700 mt-1">
                {isCustomerLimitReached && 'Você atingiu o limite de clientes do seu plano. '}
                {isProductLimitReached && 'Você atingiu o limite de produtos do seu plano. '}
                Considere fazer upgrade para continuar crescendo.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Birthday Notifications */}
      {(todayBirthdays.length > 0 || nextWeekBirthdays.length > 0) && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-3">
            <Bell className="w-5 h-5 text-purple-600 mr-2" />
            <h3 className="text-sm font-medium text-purple-800">Notificações de Aniversário</h3>
          </div>
          {todayBirthdays.length > 0 && (
            <div className="mb-2">
              <p className="text-sm text-purple-700">
                🎉 <strong>Hoje:</strong> {todayBirthdays.map(c => c.name).join(', ')}
              </p>
            </div>
          )}
          {nextWeekBirthdays.length > 0 && (
            <div>
              <p className="text-sm text-purple-700">
                📅 <strong>Próximos 7 dias:</strong> {nextWeekBirthdays.length} aniversário(s)
              </p>
            </div>
          )}
        </div>
      )}

      {/* Loyalty Requests Notification */}
      {pendingRequests.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <Package2 className="w-5 h-5 text-orange-600 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-orange-800">Solicitações Pendentes</h3>
              <p className="text-sm text-orange-700 mt-1">
                Você tem {pendingRequests.length} solicitação(ões) de produtos aguardando aprovação.
              </p>
            </div>
          </div>
        </div>
      )}

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
          {activeTab !== 'settings' && (
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
                {activeTab === 'customers' && (
                  <button
                    onClick={() => setShowCustomerForm(true)}
                    disabled={isCustomerLimitReached}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                      isCustomerLimitReached
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Novo Cliente</span>
                  </button>
                )}
                {activeTab === 'products' && (
                  <button
                    onClick={() => setShowProductForm(true)}
                    disabled={isProductLimitReached}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                      isProductLimitReached
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Novo Produto</span>
                  </button>
                )}
                {activeTab === 'sales' && (
                  <button
                    onClick={() => setShowSaleForm(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nova Venda</span>
                  </button>
                )}
                {activeTab === 'financial' && (
                  <button
                    onClick={() => setShowFinancialSaleForm(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nova Venda</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          {activeTab === 'customers' && (
            <div className="space-y-4">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{customer.name}</h3>
                    <p className="text-sm text-gray-500">{customer.email} • {customer.cpf}</p>
                    <p className="text-sm text-gray-500">{customer.phone}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {customer.points} pontos
                      </span>
                      <span className="text-xs text-gray-500">
                        {getAge(new Date(customer.birthDate))} anos
                      </span>
                      <span className="text-xs text-gray-500">
                        Desde {formatDate(new Date(customer.createdAt))}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingCustomer(customer)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(customer.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{product.name}</h3>
                    <p className="text-sm text-gray-500">{product.description}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        {product.pointsRequired} pontos
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.available ? 'Disponível' : 'Indisponível'}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingProduct(product)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'sales' && (
            <div className="space-y-4">
              {filteredSales.map((sale) => (
                <div
                  key={sale.id}
                  className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{sale.customerName}</h3>
                    <p className="text-sm text-gray-500">{sale.description}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {formatCurrency(sale.amount)}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        +{sale.pointsEarned} pontos
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(new Date(sale.date))}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'financial' && (
            <div className="space-y-4">
              {filteredSales.map((sale) => (
                <div
                  key={sale.id}
                  className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{sale.customerName}</h3>
                    <p className="text-sm text-gray-500">{sale.description}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {formatCurrency(sale.amount)}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        +{sale.pointsEarned} pontos
                      </span>
                      {sale.pointsUsedAsDiscount && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          -{sale.pointsUsedAsDiscount} pontos (desconto)
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {formatDate(new Date(sale.date))}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="space-y-4">
              {companyLoyaltyRequests.map((request) => (
                <div
                  key={request.id}
                  className={`rounded-lg p-4 flex items-center justify-between ${
                    request.status === 'pending'
                      ? 'bg-yellow-50 border border-yellow-200'
                      : request.status === 'available_for_pickup'
                      ? 'bg-blue-50 border border-blue-200'
                      : request.status === 'completed'
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{request.customerName}</h3>
                    <p className="text-sm text-gray-500">Produto: {request.productName}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {request.pointsUsed} pontos
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        request.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : request.status === 'available_for_pickup'
                          ? 'bg-blue-100 text-blue-800'
                          : request.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {request.status === 'pending' 
                          ? 'Pendente' 
                          : request.status === 'available_for_pickup' 
                          ? 'Disponível para retirada' 
                          : request.status === 'completed'
                          ? 'Concluído'
                          : 'Rejeitado'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(new Date(request.requestDate))}
                      </span>
                      {request.status === 'available_for_pickup' && request.expiresAt && (
                        <CountdownTimer expiresAt={new Date(request.expiresAt)} />
                      )}
                    </div>
                  </div>
                  {request.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApproveRequest(request)}
                        className="p-2 text-green-600 hover:text-green-800 transition-colors"
                        title="Aprovar"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openRejectModal(request)}
                        className="p-2 text-red-600 hover:text-red-800 transition-colors"
                        title="Rejeitar"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                  {request.status === 'available_for_pickup' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleCompleteRequest(request)}
                        className="p-2 text-green-600 hover:text-green-800 transition-colors"
                        title="Marcar como concluído"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                  {(request.status === 'rejected' || request.status === 'completed') && (
                    <button
                      onClick={() => handleDeleteRequest(request)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              {companyLoyaltyRequests.length === 0 && (
                <div className="text-center py-12">
                  <Package2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma solicitação encontrada</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'recurrence' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-blue-900 mb-4">Produtos Mais Solicitados</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{companyLoyaltyRequests.length}</div>
                    <div className="text-sm text-gray-600">Total de Solicitações</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {companyLoyaltyRequests.filter(r => r.status === 'completed').length}
                    </div>
                    <div className="text-sm text-gray-600">Produtos Entregues</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {companyLoyaltyRequests.reduce((sum, r) => sum + r.pointsUsed, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Pontos Utilizados</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {productRecurrenceData.map((product, index) => {
                  const approvalRate = product.totalRequests > 0 
                    ? ((product.approvedRequests + product.completedRequests) / product.totalRequests * 100).toFixed(1)
                    : '0';
                  
                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                              index === 0 ? 'bg-yellow-500' :
                              index === 1 ? 'bg-gray-400' :
                              index === 2 ? 'bg-orange-500' :
                              'bg-blue-500'
                            }`}>
                              {index + 1}
                            </div>
                            <h3 className="font-medium text-gray-900">{product.name}</h3>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">{product.totalRequests}</div>
                              <div className="text-xs text-gray-500">Total de Solicitações</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">{product.completedRequests}</div>
                              <div className="text-xs text-gray-500">Entregues</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-600">{product.totalPointsUsed}</div>
                              <div className="text-xs text-gray-500">Pontos Utilizados</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-orange-600">{approvalRate}%</div>
                              <div className="text-xs text-gray-500">Taxa de Aprovação</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-6 mt-4">
                            <div className="flex items-center space-x-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                {product.pendingRequests} pendente(s)
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {product.approvedRequests} aprovada(s)
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {product.rejectedRequests} rejeitada(s)
                              </span>
                            </div>
                          </div>
                          
                          {product.lastRequestDate && (
                            <p className="text-xs text-gray-500 mt-2">
                              Última solicitação: {formatDate(new Date(product.lastRequestDate))}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {productRecurrenceData.length === 0 && (
                  <div className="text-center py-12">
                    <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma solicitação de produto encontrada</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Os dados de recorrência aparecerão quando os clientes começarem a solicitar produtos
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{transaction.customerName}</h3>
                    <p className="text-sm text-gray-500">{transaction.description}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.type === 'earned' || transaction.type === 'credit'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type === 'earned' || transaction.type === 'credit' ? '+' : '-'}
                        {transaction.points} pontos
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(new Date(transaction.date))}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'birthdays' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-purple-900 mb-4">Aniversários Próximos (30 dias)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{todayBirthdays.length}</div>
                    <div className="text-sm text-gray-600">Hoje</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{nextWeekBirthdays.length}</div>
                    <div className="text-sm text-gray-600">Próximos 7 dias</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{upcomingBirthdays.length}</div>
                    <div className="text-sm text-gray-600">Próximos 30 dias</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {upcomingBirthdays.map((customer) => (
                  <div
                    key={customer.id}
                    className={`rounded-lg p-4 flex items-center justify-between ${
                      customer.daysUntilBirthday === 0
                        ? 'bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300'
                        : customer.daysUntilBirthday <= 7
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-gray-900">{customer.name}</h3>
                        {customer.daysUntilBirthday === 0 && (
                          <span className="text-2xl">🎉</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{customer.email} • {customer.phone}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {formatBirthDate(new Date(customer.birthDate))}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getAge(new Date(customer.birthDate)) + 1} anos
                        </span>
                        <span className={`text-xs font-medium ${
                          customer.daysUntilBirthday === 0
                            ? 'text-purple-600'
                            : customer.daysUntilBirthday <= 7
                            ? 'text-blue-600'
                            : 'text-gray-600'
                        }`}>
                          {customer.daysUntilBirthday === 0
                            ? 'Hoje!'
                            : customer.daysUntilBirthday === 1
                            ? 'Amanhã'
                            : `Em ${customer.daysUntilBirthday} dias`
                          }
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Calendar className={`w-6 h-6 ${
                        customer.daysUntilBirthday === 0
                          ? 'text-purple-500'
                          : customer.daysUntilBirthday <= 7
                          ? 'text-blue-500'
                          : 'text-gray-400'
                      }`} />
                    </div>
                  </div>
                ))}

                {upcomingBirthdays.length === 0 && (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum aniversário nos próximos 30 dias</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Configuração de Pontos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2">Estatísticas</h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => setShowStatistics('requests')}
                        className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <BarChart3 className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Solicitações de Fidelidade</span>
                        </div>
                        <span className="text-xs text-blue-600">Ver →</span>
                      </button>
                      
                      <button
                        onClick={() => setShowStatistics('costs')}
                        className="w-full flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Custo das Solicitações</span>
                        </div>
                        <span className="text-xs text-green-600">Ver →</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2">Ferramentas</h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => setShowQRCode(true)}
                        className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <QrCode className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-medium text-purple-800">QR Code de Cadastro</span>
                        </div>
                        <span className="text-xs text-purple-600">Gerar →</span>
                      </button>
                      
                      <button
                        onClick={() => setShowWebhookConfig(true)}
                        className="w-full flex items-center justify-between p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <Webhook className="w-4 h-4 text-orange-600" />
                          <span className="text-sm font-medium text-orange-800">Configurar Webhooks</span>
                        </div>
                        <span className="text-xs text-orange-600">Config →</span>
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  Atualmente: Cada {companyPointsConfig.reaisPerPoint} reais gastos = 1 ponto
                </p>
                <button
                  onClick={() => setShowPointsConfig(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
                >
                  <Settings className="w-4 h-4" />
                  <span>Alterar Configuração</span>
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Gerenciar Pontos</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Adicione ou remova pontos diretamente de um cliente
                </p>
                <button
                  onClick={() => setShowPointsManagement(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Gerenciar Pontos</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCustomerForm && (
        <CustomerForm
          customer={editingCustomer}
          onClose={() => {
            setShowCustomerForm(false);
            setEditingCustomer(null);
          }}
        />
      )}

      {showProductForm && (
        <ProductForm
          product={editingProduct}
          onClose={() => {
            setShowProductForm(false);
            setEditingProduct(null);
          }}
        />
      )}

      {showSaleForm && (
        <SaleForm onClose={() => setShowSaleForm(false)} />
      )}

      {showFinancialSaleForm && (
        <FinancialSaleForm onClose={() => setShowFinancialSaleForm(false)} />
      )}

      {showPointsConfig && (
        <PointsConfigForm onClose={() => setShowPointsConfig(false)} />
      )}

      {showPointsManagement && (
        <PointsManagementForm onClose={() => setShowPointsManagement(false)} />
      )}

      {editingCustomer && (
        <CustomerForm
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
        />
      )}

      {editingProduct && (
        <ProductForm
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}

      {showQRCode && (
        <QRCodeModal onClose={() => setShowQRCode(false)} />
      )}

      {showStatistics && (
        <StatisticsModal 
          type={showStatistics} 
          onClose={() => setShowStatistics(null)} 
        />
      )}

      {showWebhookConfig && (
        <WebhookConfigModal onClose={() => setShowWebhookConfig(false)} />
      )}

      {/* Reject Modal */}
      {showRejectModal && requestToReject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Rejeitar Solicitação</h2>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRequestToReject(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-2">
                  {requestToReject.customerName}
                </h3>
                <p className="text-sm text-gray-600">
                  Produto: {requestToReject.productName}
                </p>
                <p className="text-sm text-gray-600">
                  Pontos utilizados: {requestToReject.pointsUsed}
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-yellow-800 mb-2">
                  O que fazer com os pontos?
                </h4>
                <p className="text-sm text-yellow-700">
                  Os pontos já foram descontados do cliente. Escolha se deseja devolvê-los ou mantê-los removidos.
                </p>
              </div>

              {/* dentro do JSX do Reject Modal */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleRejectRequest(requestToReject!, false)}
                    className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Rejeitar sem devolver pontos
                  </button>
                  <button
                    onClick={() => handleRejectRequest(requestToReject!, true)}
                    className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Rejeitar e devolver pontos
                  </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Countdown Timer Component
function CountdownTimer({ expiresAt }: { expiresAt: Date }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
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
    <span className={`text-xs font-mono ${timeLeft === 'Expirado' ? 'text-red-600' : 'text-blue-600'}`}>
      ⏰ {timeLeft}
    </span>
  );
}