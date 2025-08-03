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
import { formatCurrency, formatDate, getUpcomingBirthdays, formatBirthDate, getAge } from '../../utils/helpers';
//import { formatCurrency, formatDate, getUpcomingBirthdays, formatBirthDate, getAge, generateId } from '../../utils/helpers';
import QRCodeModal from './QRCodeModal';
import StatisticsModal from './StatisticsModal';
import WebhookConfigModal from './WebhookConfigModal';
import FinancialSaleForm from './FinancialSaleForm';
import { LoyaltyRequest, Customer, PointsTransaction } from '../../types';
import { supabase } from '../../lib/supabase';
import { Sale, Product } from '../../types';



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
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedProductId, setSelectedProductId]   = useState<string>('');
  const [selectedProductByCustomer, setSelectedProductByCustomer] = useState<Record<string,string>>({});




  const currentCompany = state.currentCompany;
  const currentPlan = state.plans.find(p => p.id === currentCompany?.planId);

  const fetchCompanyRequests = async () => {
  if (!currentCompany) return;
  const { data, error } = await supabase
    .from('loyalty_requests')
    .select('*')
    .eq('company_id', currentCompany.id)
    .order('request_date', { ascending: false });

  if (!error && data) {
    const requests: LoyaltyRequest[] = data.map(r => ({
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

    dispatch({ type: 'SET_LOYALTY_REQUESTS', payload: requests });
  }
};

  // 1) Função para buscar clientes da empresa
  // 1) Buscar clientes
const fetchCompanyCustomers = async () => {
  if (!currentCompany) return;

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('company_id', currentCompany.id)
    .order('created_at', { ascending: false });

  if (!error && data) {
    const customers: Customer[] = data.map(c => ({
      id:         c.id,
      name:       c.name,
      cpf:        c.cpf,
      email:      c.email,
      phone:      c.phone,
      address:    c.address ?? undefined,
      birthDate:  c.birth_date ? new Date(c.birth_date) : new Date(),
      points:     c.points,
      password:   c.password,
      createdAt:  c.created_at ? new Date(c.created_at) : new Date(),
      companyId:  c.company_id,
    }));
    dispatch({ type: 'SET_CUSTOMERS', payload: customers });
  }
};

// 2) Buscar produtos
const fetchCompanyProducts = async () => {
  if (!currentCompany) return;

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('company_id', currentCompany.id)
    .order('created_at', { ascending: false });

  if (!error && data) {
    const products: Product[] = data.map(p => ({
      id:             p.id,
      name:           p.name,
      description:    p.description,
      pointsRequired: p.points_required,
      imageUrl:       p.image_url ?? undefined,
      available:      p.available,
      createdAt:      p.created_at ? new Date(p.created_at) : new Date(),
      companyId:      p.company_id,
    }));
    dispatch({ type: 'SET_PRODUCTS', payload: products });
  }
};

// 3) Buscar vendas
const fetchCompanySales = async () => {
  if (!currentCompany) return;

  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .eq('company_id', currentCompany.id)
    .order('date', { ascending: false });

  if (!error && data) {
    const sales: Sale[] = data.map(s => ({
      id:           s.id,
      customerId:   s.customer_id,
      customerName: s.customer_name,
      amount:       parseFloat(s.amount),
      pointsEarned: s.points_earned,
      date:         s.date ? new Date(s.date) : new Date(),
      description:  s.description ?? '',
      companyId:    s.company_id,
    }));
    dispatch({ type: 'SET_SALES', payload: sales });
  }
};


  // 1.4) Função para buscar transações de pontos da empresa
const fetchCompanyTransactions = async () => {
  if (!currentCompany) return;

  const { data, error } = await supabase
    .from('points_transactions')
    .select('*')
    .eq('company_id', currentCompany.id)
    .order('date', { ascending: false });

  if (!error && data) {
    const transactions: PointsTransaction[] = data.map(t => ({
      id:            t.id,
      companyId:     t.company_id,
      customerId:    t.customer_id,
      customerName:  t.customer_name,
      type:          t.type,
      points:        t.points,
      description:   t.description ?? '',
      date:          t.date ? new Date(t.date) : new Date(),
    }));
    dispatch({ type: 'SET_POINTS_TRANSACTIONS', payload: transactions });
  } else if (error) {
    console.error('Erro ao buscar transações:', error);
  }
};




 useEffect(() => {
  if (!currentCompany) return;

  const channel = supabase
    .channel('loyalty_requests')
    .on('postgres_changes', {
        event:    'INSERT',
        schema:   'public',
        table:    'loyalty_requests',
        filter:   `company_id=eq.${currentCompany.id}`
      },
      ({ new: r }) => {
        // faz o mesmo mapeamento de r para LoyaltyRequest…
        const mapped: LoyaltyRequest = {
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
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [currentCompany?.id, dispatch]);

  // dispara só uma vez, ao montar
useEffect(() => {
  if (!currentCompany) return;
  fetchCompanyCustomers();
  fetchCompanyProducts();
  fetchCompanySales();
  fetchCompanyRequests();
  fetchCompanyTransactions();
}, [currentCompany]);


  
  
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

  const maxCustomersDisplay = currentPlan.maxCustomers < 0
  ? '∞'
  : currentPlan.maxCustomers;
  const maxProductsDisplay = currentPlan.maxProducts < 0
  ? '∞'
  : currentPlan.maxProducts;

  // Check plan limits
  const isCustomerLimitReached =
  currentPlan.maxCustomers > 0 &&
  companyCustomers.length >= currentPlan.maxCustomers;
  const isProductLimitReached =
  currentPlan.maxProducts > 0 &&
  companyProducts.length >= currentPlan.maxProducts;

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
      value: `${companyCustomers.length}/${maxCustomersDisplay}`,
      icon: Users,
      color: isCustomerLimitReached ? 'text-red-600' : 'text-blue-600',
      bgColor: isCustomerLimitReached ? 'bg-red-100' : 'bg-blue-100',
    },
    {
      label: 'Produtos Ativos',
      value: `${companyProducts.filter(p => p.available).length}/${maxProductsDisplay}`,
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

  

  // AdminDashboard.tsx (dentro do componente)
const handleUpdatePointsConfig = async (newReaisPerPoint: number) => {
  if (!currentCompany) return;

  // upsert: se já existir, atualiza; senão, insere
  const { data, error } = await supabase
    .from('points_config')
    .upsert({
      company_id:      currentCompany.id,
      reais_per_point: newReaisPerPoint
    })
    .select('*')
    .single();

  if (error) {
    console.error('Erro ao atualizar configuração de pontos:', error);
    return alert('Não foi possível salvar a configuração.');
  }

  // dispara no contexto
  dispatch({
    type: 'UPDATE_POINTS_CONFIG',
    payload: {
      companyId:    data.company_id,
      reaisPerPoint: data.reais_per_point
    }
  });

  setShowPointsConfig(false);
};


// (2) Rejeitar solicitação
const handleRejectRequest = async (request: LoyaltyRequest, shouldReturnPoints: boolean) => {
  // 1) se for devolver pontos
  if (shouldReturnPoints) {
    // busca saldo atual
    const { data: customer, error: fetchErr } = await supabase
      .from<Customer>('customers')
      .select('id, points, name')
      .eq('id', request.customerId)
      .single();
    if (fetchErr || !customer) return console.error(fetchErr);

    // calcula e atualiza novo saldo
    const newBalance = customer.points + request.pointsUsed;
    const { data: updatedCust, error: updErr } = await supabase
      .from<Customer>('customers')
      .update({ points: newBalance })
      .eq('id', customer.id)
      .select('*')
      .single();
    if (updErr || !updatedCust) return console.error(updErr);
    dispatch({ type: 'UPDATE_CUSTOMER', payload: updatedCust });

    // registra transação de crédito
    const { data: tx, error: txErr } = await supabase
      .from<PointsTransaction>('points_transactions')
      .insert({
        company_id:    currentCompany.id,
        customer_id:   customer.id,
        customer_name: customer.name,
        type:          'credit',
        points:        request.pointsUsed,
        description:   `Rejeição + Devolução: ${request.productName}`,
        date:          new Date(),
      })
      .select('*')
      .single();
    if (txErr || !tx) return console.error(txErr);
    dispatch({ type: 'ADD_POINTS_TRANSACTION', payload: tx });
  }

  // 2) atualiza status da solicitação como 'rejected'
  const { data: updReq, error: reqErr } = await supabase
    .from<LoyaltyRequest>('loyalty_requests')
    .update({
      status:         'rejected',
      processed_date: new Date(),
      processed_by:   state.currentUser?.name,
    })
    .eq('id', request.id)
    .select('*')
    .single();
  if (reqErr || !updReq) return console.error(reqErr);
  dispatch({ type: 'UPDATE_LOYALTY_REQUEST', payload: updReq });

  // 3) limpa e fecha modal
  setShowRejectModal(false);
  setRequestToReject(null);
};


  const handleCompleteRequest = async (request: LoyaltyRequest) => {
  if (!window.confirm('Marcar como concluído? O produto foi entregue ao cliente?')) return;

  const { data: updReq, error } = await supabase
    .from<LoyaltyRequest>('loyalty_requests')
    .update({
      status:         'completed',
      processed_date: new Date(),
      processed_by:   state.currentUser?.name || 'Admin',
    })
    .eq('id', request.id)
    .select('*')
    .single();

  if (error || !updReq) {
    console.error('Erro ao concluir:', error);
    return alert('Não foi possível marcar como concluído.');
  }

  // Ao invés de dispatch com updReq cru, faça:
  await fetchCompanyRequests();
}

  

  const openRejectModal = (request: any) => {
    setRequestToReject(request);
    setShowRejectModal(true);
  };

  // Auto-complete expired requests
  React.useEffect(() => {
    const checkExpiredRequests = () => {
      const now = new Date();
      const expiredRequests = companyLoyaltyRequests.filter(
        r => r.status === 'approved' && 
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

  const handleDeleteCustomer = async (customerId: string) => {
    const customer = state.customers.find(c => c.id === customerId);
    if (!customer) return;

    const confirmMessage = `Tem certeza que deseja excluir o cliente "${customer.name}"?\n\nEsta ação irá:\n- Remover o cliente permanentemente\n- Excluir todas as vendas relacionadas\n- Excluir todas as transações de pontos\n- Excluir todas as solicitações de produtos\n\nEsta operação NÃO PODE ser desfeita!`;
    
    if (window.confirm(confirmMessage)) {

         // 1) Deleta no Supabase
   const { error: delErr } = await supabase
     .from('customers')
     .delete()
     .eq('id', customerId);
   if (delErr) {
     console.error('Erro ao deletar cliente:', delErr);
     return;
   }

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

  const handleDeleteProduct = async (productId: string) => {
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

   // 1) Deleta no Supabase (isso já cascata professionalmente se você criar FK com ON DELETE CASCADE,
   //    senão você teria que deletar manualmente as loyalty_requests primeiro no banco)
   const { error: delErr } = await supabase
     .from('products')
     .delete()
     .eq('id', productId);
   if (delErr) {
     console.error('Erro ao deletar produto:', delErr);
     return;
   }


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


const handleDeleteSale = async (saleId: string) => {
  const sale = state.sales.find(s => s.id === saleId);
  if (!sale) return;

  if (!window.confirm(
    `Remover venda de "${sale.customerName}"? Esta ação não pode ser desfeita.`
  )) {
    return;
  }

  // 1) Chama o Supabase para deletar do banco
  const { data, error } = await supabase
    .from('sales')
    .delete()
    .eq('id', saleId)
    // inclua também a company_id se sua policy exigir:
    .eq('company_id', currentCompany.id)
    // sem o .select(), o Supabase não retorna erro de row-level security
    .select('*');

  // 2) Se der erro, mostra no console e alerta o usuário
  if (error) {
    console.error('Erro ao excluir venda no Supabase:', error);
    alert(`❌ Não foi possível excluir a venda no servidor:\n${error.message}`);
    return;
  }

  // 3) Se passou, atualiza a UI removendo do estado global
  dispatch({ type: 'DELETE_SALE', payload: saleId });

  // 4) Feedback
  alert('✅ Venda excluída com sucesso!');
};



     // src/components/admin/AdminDashboard.tsx
// …dentro do componente AdminDashboard, antes do `return(...)`…

const handleCreateRequest = async (customer: Customer, product: Product) => {
  const payload = {
    customer_id:   customer.id,
    customer_name: customer.name,
    product_id:    product.id,
    product_name:  product.name,
    points_used:   product.pointsRequired,
    status:        'pending' as const,
    request_date:  new Date(),
    company_id:    currentCompany!.id,
  };

  const { data: insertedReq, error: insertErr } = await supabase
    .from<LoyaltyRequest>('loyalty_requests')
    .insert(payload)
    .select('*')
    .single();

  if (insertErr) {
    console.error('Erro ao criar solicitação:', insertErr);
    return;
  }

  // recarrega do banco para garantir que o ID veio com hífens
  await fetchCompanyRequests();
};




// dentro do AdminDashboard, antes do `return(...)`

/** 1) Aprovar solicitação */
// dentro do seu AdminDashboard.tsx, logo após a definição de fetchCompanyRequests()

const handleApproveRequest = async (request: LoyaltyRequest) => {
  // 1) calcula expiry
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  // 2) persiste APPROVED + expires_at no Supabase
  const { data: updReq, error } = await supabase
    .from<LoyaltyRequest>('loyalty_requests')
    .update({
      status:         'approved',
      processed_date: new Date(),
      processed_by:   state.currentUser?.name,
      expires_at:     expiresAt,
    })
    .eq('id', request.id)
    .select('*')
    .single();

  if (error || !updReq) {
    console.error('Erro ao aprovar:', error);
    return alert('Não foi possível marcar como "Disponível para retirada".');
  }

  // 3) atualiza o estado global (ou refetch)
  dispatch({ type: 'UPDATE_LOYALTY_REQUEST', payload: updReq });
};

  // dentro de AdminDashboard.tsx, junto com os outros handlers
const handleDeleteRequest = async (request: LoyaltyRequest) => {
  if (!window.confirm('Tem certeza que deseja excluir esta solicitação?')) return;

  // 1) Deleta do Supabase
  const { error } = await supabase
    .from('loyalty_requests')
    .delete()
    .eq('id', request.id)
    .eq('company_id', currentCompany!.id);

  if (error) {
    console.error('Erro ao excluir solicitação:', error);
    return alert('❌ Não foi possível excluir a solicitação no servidor.');
  }

  // 2) Atualiza o estado local
  dispatch({ type: 'DELETE_LOYALTY_REQUEST', payload: request.id });
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
                  {/* Campo de Busca */}
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
                {/* Clientes */}
                  {activeTab === 'customers' && (
                    <>
                      {/* Ações */}
                      <div className="flex justify-end mb-4">
                        <button
                          onClick={() => {
                            setEditingCustomer(null)
                            setShowCustomerForm(true)
                          }}
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
                      </div>

                      
                    </>
                  )}

                  {/* Produtos */}
                  {activeTab === 'products' && (
                    <>
                      {/* Ações */}
                      <div className="flex justify-end mb-4">
                        <button
                          onClick={() => {
                            setEditingProduct(null)
                            setShowProductForm(true)
                          }}
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
                      </div>

                      {/* Conteúdo */}
                      
                    </>
                  )}

                  {/* Vendas */}
                  {activeTab === 'sales' && (
                    <>
                      {/* Ações */}
                      <div className="flex justify-end mb-4">
                        <button
                            onClick={() => {
                              setEditingSale(null)
                              setShowSaleForm(true)
                            }}
                            className={`
                              flex items-center space-x-2
                              px-4 py-2
                              rounded-lg
                              bg-gradient-to-r from-blue-500 to-purple-600
                              text-white
                              hover:from-blue-600 hover:to-purple-700
                              transition-all
                            `}
                          >
                            <Plus className="w-4 h-4" />
                            <span>Nova Venda</span>
                          </button>
                      </div>

                      {/* Conteúdo */}
                      
                    </>
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
                      onClick={() => {
                        setEditingCustomer(customer);
                        setShowCustomerForm(true);
                      }}
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
                    {/* Solicitação de produto */}
                    
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                       setEditingProduct(product);
                       setShowProductForm(true);
                     }}
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
          {filteredSales.length > 0 ? (
            filteredSales.map((sale) => (
              <div
                key={sale.id}
                className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
              >
                {/* Detalhes da venda */}
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

                {/* Botão excluir */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDeleteSale(sale.id)}
                    className="p-2 text-gray-400 hover:text-red-600"
                    title="Excluir Venda"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              Nenhuma venda encontrada
            </div>
          )}
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
                    className={`
                      rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between
                      ${
                        request.status === 'pending'
                          ? 'bg-yellow-50 border border-yellow-200'
                          : request.status === 'approved'
                          ? 'bg-blue-50   border border-blue-200'
                          : request.status === 'completed'
                          ? 'bg-green-50  border border-green-200'
                          : 'bg-red-50    border border-red-200'
                      }
                    `}
                  >
                    {/* Detalhes */}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{request.customerName}</h3>
                      <p className="text-sm text-gray-500">Produto: {request.productName}</p>
                    </div>

                    {/* Pontos e Status */}
                    <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {request.pointsUsed} pontos
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          request.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : request.status === 'approved'
                            ? 'bg-blue-100 text-blue-800'
                            : request.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {request.status === 'pending'
                          ? 'Pendente'
                          : request.status === 'approved'
                          ? 'Disponível para retirada'
                          : request.status === 'completed'
                          ? 'Concluído'
                          : 'Rejeitado'}
                      </span>
                    </div>

                    {/* Data e Countdown */}
                    <div className="mt-2 sm:mt-0 sm:ml-4 text-xs text-gray-500">
                      {formatDate(request.requestDate)}
                      {request.status === 'approved' && request.expiresAt && (
                        <div className="mt-1">
                          <CountdownTimer expiresAt={request.expiresAt} />
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex space-x-2 mt-2 sm:mt-0">
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApproveRequest(request)}
                            className="p-2 text-green-600 hover:text-green-800"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => openRejectModal(request)}
                            className="p-2 text-red-600 hover:text-red-800"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      {request.status === 'approved' && (
                        <button
                          onClick={() => handleCompleteRequest(request)}
                          className="p-2 text-green-600 hover:text-green-800"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      )}
                      {(request.status === 'rejected' || request.status === 'completed') && (
                        <button
                          onClick={() => handleDeleteRequest(request)}
                          className="p-2 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
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

          {/* Transações */}
            {activeTab === 'transactions' && (
              <>
                {/* Conteúdo: lista de transações */}
                <div className="space-y-4">
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map(tx => (
                      <div
                        key={tx.id}
                        className="bg-white rounded-lg p-4 flex items-center justify-between shadow-sm"
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {tx.customerName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {tx.type === 'credit'
                              ? 'Crédito de pontos'
                              : 'Débito de pontos'}
                          </p>
                          <div className="mt-2 flex items-center space-x-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                tx.type === 'credit'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {tx.type === 'credit' ? '+' : '-'}
                              {tx.points} pontos
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatDate(new Date(tx.date))}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500">
                      Nenhuma transação encontrada.
                    </p>
                  )}
                </div>
              </>
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
      {/* Modals */}
{showCustomerForm && (
  <CustomerForm
    customer={editingCustomer}
    onClose={() => {
      setShowCustomerForm(false);
      setEditingCustomer(null);
    }}
    onSave={() => {
      fetchCompanyCustomers();
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
    onSave={() => {
      fetchCompanyProducts();
      setShowProductForm(false);
      setEditingProduct(null);
    }}
  />
)}

{showSaleForm && (
  <SaleForm
    sale={editingSale}
    onClose={() => setShowSaleForm(false)}
    onSave={() => {
      fetchCompanySales();
      setShowSaleForm(false);
      setEditingSale(null);
    }}
  />
)}


{showFinancialSaleForm && (
  <FinancialSaleForm
    onClose={() => setShowFinancialSaleForm(false)}
  />
)}

{showPointsConfig && (
  <PointsConfigForm
    defaultValue={companyPointsConfig.reaisPerPoint}  // valor que veio do state
    onClose={() => setShowPointsConfig(false)}
    onSave={handleUpdatePointsConfig}                 // seu upsert + dispatch
  />
)}


{showPointsManagement && (
  <PointsManagementForm onClose={() => setShowPointsManagement(false)} />
)}


{showQRCode && (
  <QRCodeModal
    onClose={() => setShowQRCode(false)}
  />
)}

{showStatistics && (
  <StatisticsModal
    type={showStatistics}
    onClose={() => setShowStatistics(null)}
  />
)}

{showWebhookConfig && (
  <WebhookConfigModal
    onClose={() => setShowWebhookConfig(false)}
  />
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