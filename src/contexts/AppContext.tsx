import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Customer,
  Product,
  Sale,
  PointsConfig,
  PointsTransaction,
  User,
  Company,
  Plan,
  LoyaltyRequest,
  WebhookConfig
} from '../types';

interface AppState {
  customers: Customer[];
  products: Product[];
  sales: Sale[];
  pointsConfigs: PointsConfig[];
  pointsTransactions: PointsTransaction[];
  companies: Company[];
  plans: Plan[];
  loyaltyRequests: LoyaltyRequest[];
  webhookConfigs: WebhookConfig[];
  currentUser: User | null;
  currentCompany: Company | null;
  isLoading: boolean;
}

export type AppAction =
  | { type: 'SET_LOADING';                payload: boolean }
  | { type: 'SET_CURRENT_USER';           payload: User | null }
  | { type: 'SET_CURRENT_COMPANY';        payload: Company | null }

  | { type: 'SET_CUSTOMERS';              payload: Customer[] }
  | { type: 'ADD_CUSTOMER';               payload: Customer }
  | { type: 'UPDATE_CUSTOMER';            payload: Customer }
  | { type: 'DELETE_CUSTOMER';            payload: string }

  | { type: 'SET_PRODUCTS';               payload: Product[] }
  | { type: 'ADD_PRODUCT';                payload: Product }
  | { type: 'UPDATE_PRODUCT';             payload: Product }
  | { type: 'DELETE_PRODUCT';             payload: string }

  | { type: 'SET_SALES';                  payload: Sale[] }
  | { type: 'ADD_SALE';                   payload: Sale }
  | { type: 'DELETE_SALE';                payload: string }

  | { type: 'UPDATE_POINTS_CONFIG';       payload: PointsConfig }
  | { type: 'SET_POINTS_TRANSACTIONS';    payload: PointsTransaction[] }
  | { type: 'ADD_POINTS_TRANSACTION';     payload: PointsTransaction }
  | { type: 'DELETE_POINTS_TRANSACTION';  payload: string }
  | { type: 'DELETE_POINTS_CONFIG';       payload: string }

  | { type: 'SET_LOYALTY_REQUESTS';       payload: LoyaltyRequest[] }
  | { type: 'ADD_LOYALTY_REQUEST';        payload: LoyaltyRequest }
  | { type: 'UPDATE_LOYALTY_REQUEST';     payload: LoyaltyRequest }
  | { type: 'DELETE_LOYALTY_REQUEST';     payload: string }

  | { type: 'ADD_COMPANY';                payload: Company }
  | { type: 'UPDATE_COMPANY';             payload: Company }
  | { type: 'DELETE_COMPANY';             payload: string }

  | { type: 'ADD_PLAN';                   payload: Plan }
  | { type: 'UPDATE_PLAN';                payload: Plan }
  | { type: 'DELETE_PLAN';                payload: string }

  | { type: 'UPDATE_WEBHOOK_CONFIG';      payload: WebhookConfig }

  | { type: 'INITIALIZE_DATA';            payload: Partial<AppState> };

const defaultPlans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    maxCustomers: 100,
    maxProducts: 10,
    price: 49.9,
    features: ['100 clientes', '10 produtos', 'Suporte básico'],
    createdAt: new Date(),
    planId: ''
  },
  {
    id: 'professional',
    name: 'Professional',
    maxCustomers: 500,
    maxProducts: 50,
    price: 99.9,
    features: ['500 clientes', '50 produtos', 'Suporte prioritário', 'Relatórios avançados'],
    createdAt: new Date(),
    planId: ''
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    maxCustomers: -1,
    maxProducts: -1,
    price: 199.9,
    features: ['Clientes ilimitados', 'Produtos ilimitados', 'Suporte 24/7', 'API personalizada'],
    createdAt: new Date(),
    planId: ''
  },
];

const initialState: AppState = {
  customers: [],
  products: [],
  sales: [],
  pointsConfigs: [],
  pointsTransactions: [],
  companies: [],
  plans: defaultPlans,
  loyaltyRequests: [],
  webhookConfigs: [],
  currentUser: null,
  currentCompany: null,
  isLoading: false,
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}>({
  state: initialState,
  dispatch: () => null,
});

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };
    case 'SET_CURRENT_COMPANY':
      return { ...state, currentCompany: action.payload };

    case 'SET_CUSTOMERS':
      return { ...state, customers: action.payload };
    case 'ADD_CUSTOMER':
      return { ...state, customers: [...state.customers, action.payload] };
    case 'UPDATE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.map(c =>
          c.id === action.payload.id ? action.payload : c
        ),
      };
    case 'DELETE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.filter(c => c.id !== action.payload),
      };

    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
    case 'ADD_PRODUCT':
      return { ...state, products: [...state.products, action.payload] };
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(p =>
          p.id === action.payload.id ? action.payload : p
        ),
      };
    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.filter(p => p.id !== action.payload),
      };

    case 'SET_SALES':
      return { ...state, sales: action.payload };
    case 'ADD_SALE':
      return { ...state, sales: [...state.sales, action.payload] };
    case 'DELETE_SALE':
      return {
        ...state,
        sales: state.sales.filter(s => s.id !== action.payload),
      };

    case 'UPDATE_POINTS_CONFIG':
      return {
        ...state,
        pointsConfigs: state.pointsConfigs.some(pc => pc.companyId === action.payload.companyId)
          ? state.pointsConfigs.map(pc =>
              pc.companyId === action.payload.companyId ? action.payload : pc
            )
          : [...state.pointsConfigs, action.payload],
      };

    case 'SET_POINTS_TRANSACTIONS':
      return { ...state, pointsTransactions: action.payload };
    case 'ADD_POINTS_TRANSACTION':
      return {
        ...state,
        pointsTransactions: [...state.pointsTransactions, action.payload],
      };
    case 'DELETE_POINTS_TRANSACTION':
      return {
        ...state,
        pointsTransactions: state.pointsTransactions.filter(t => t.id !== action.payload),
      };

    case 'DELETE_POINTS_CONFIG':
      return {
        ...state,
        pointsConfigs: state.pointsConfigs.filter(pc => pc.companyId !== action.payload),
      };

    case 'SET_LOYALTY_REQUESTS':
      return { ...state, loyaltyRequests: action.payload };
    case 'ADD_LOYALTY_REQUEST':
      return { ...state, loyaltyRequests: [...state.loyaltyRequests, action.payload] };
    case 'UPDATE_LOYALTY_REQUEST':
      return {
        ...state,
        loyaltyRequests: state.loyaltyRequests.map(r =>
          r.id === action.payload.id ? action.payload : r
        ),
      };
    case 'DELETE_LOYALTY_REQUEST':
      return {
        ...state,
        loyaltyRequests: state.loyaltyRequests.filter(r => r.id !== action.payload),
      };

    case 'ADD_COMPANY':
      return { ...state, companies: [...state.companies, action.payload] };
    case 'UPDATE_COMPANY':
      return {
        ...state,
        companies: state.companies.map(c =>
          c.id === action.payload.id ? action.payload : c
        ),
      };
    case 'DELETE_COMPANY':
      return {
        ...state,
        companies: state.companies.filter(c => c.id !== action.payload),
      };

    case 'ADD_PLAN':
      return { ...state, plans: [...state.plans, action.payload] };
    case 'UPDATE_PLAN':
      return {
        ...state,
        plans: state.plans.map(p =>
          p.id === action.payload.id ? action.payload : p
        ),
      };
    case 'DELETE_PLAN':
      return {
        ...state,
        plans: state.plans.filter(p => p.id !== action.payload),
      };

    case 'UPDATE_WEBHOOK_CONFIG':
      return {
        ...state,
        webhookConfigs: state.webhookConfigs.some(wc => wc.companyId === action.payload.companyId)
          ? state.webhookConfigs.map(wc =>
              wc.companyId === action.payload.companyId ? action.payload : wc
            )
          : [...state.webhookConfigs, action.payload],
      };

    case 'INITIALIZE_DATA':
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
  async function initData() {
    dispatch({ type: 'SET_LOADING', payload: true });

    // 1) Fetch e map customers
    const { data: customerRows, error: customerError } =
      await supabase.from('customers').select('*');
    if (customerError) console.error(customerError);
    const customers =
      customerRows?.map(c => ({
        id:         c.id,
        name:       c.name,
        cpf:        c.cpf,
        email:      c.email,
        phone:      c.phone,
        address:    c.address || undefined,
        birthDate:  c.birth_date ? new Date(c.birth_date) : new Date(),
        points:     c.points,
        password:   c.password,
        createdAt:  c.created_at ? new Date(c.created_at) : new Date(),
        companyId:  c.company_id,
      })) || [];

    // 2) Fetch e map products
    const { data: productRows, error: productError } =
      await supabase.from('products').select('*');
    if (productError) console.error(productError);
    const products =
      productRows?.map(p => ({
        id:             p.id,
        name:           p.name,
        description:    p.description,
        pointsRequired: p.points_required,
        imageUrl:       p.image_url || undefined,
        available:      p.available,
        createdAt:      p.created_at ? new Date(p.created_at) : new Date(),
        companyId:      p.company_id,
      })) || [];

    // 3) Fetch e map sales
    const { data: saleRows, error: saleError } =
      await supabase.from('sales').select('*');
    if (saleError) console.error(saleError);
    const sales =
      saleRows?.map(s => ({
        id:           s.id,
        customerId:   s.customer_id,
        customerName: s.customer_name,
        amount:       parseFloat(s.amount),
        pointsEarned: s.points_earned,
        date:         s.date ? new Date(s.date) : new Date(),
        description:  s.description || undefined,
        companyId:    s.company_id,
      })) || [];

    // 4) Fetch e map plans
    const { data: planRows, error: planError } =
      await supabase.from('plans').select('*');
    if (planError) console.error(planError);
    const plans =
      planRows?.map(p => ({
        id:           p.id,
        planId:       p.id,
        name:         p.name,
        maxCustomers: p.max_customers,
        maxProducts:  p.max_products,
        price:        Number(p.price),
        features:     p.features,
        createdAt:    p.created_at ? new Date(p.created_at) : new Date(),
      })) || [];
    //console.log('[DEBUG] planos mapeados:', plans);

    // 5) Fetch e map companies
    const { data: companyRows, error: companyError } =
      await supabase.from('companies').select('*');
    if (companyError) console.error('Erro ao carregar empresas:', companyError);
    const companies =
      companyRows?.map(c => ({
        id:         c.id,
        name:       c.name,
        slug:       c.slug,
        ownerName:  c.owner_name,
        ownerEmail: c.owner_email,
        password:   c.password,
        planId:     c.plan_id,
        isActive:   c.is_active,
        createdAt:  c.created_at ? new Date(c.created_at) : new Date(),
      })) || [];
    //console.log('[DEBUG] empresas mapeadas:', companies);

    // 7) pointsConfigs
      const { data: pcRows, error: pcErr } = await supabase
        .from('points_config')
        .select('*');
      if (pcErr) console.error(pcErr);
      const pointsConfigs = pcRows?.map(pc => ({
        companyId:     pc.company_id,
        reaisPerPoint: pc.reais_per_point,
      })) || [];

      // 8) pointsTransactions
      const { data: txRows, error: txErr } = await supabase
        .from('points_transactions')
        .select('*');
      if (txErr) console.error(txErr);
      const pointsTransactions = txRows?.map(tx => ({
        id:           tx.id,
        companyId:    tx.company_id,
        customerId:   tx.customer_id,
        customerName: tx.customer_name,
        type:         tx.type,
        points:       tx.points,
        description:  tx.description,
        date:         new Date(tx.date),
      })) || [];

      // 9) loyaltyRequests
      const { data: lrRows, error: lrErr } = await supabase
        .from('loyalty_requests')
        .select('*');
      if (lrErr) console.error(lrErr);
      const loyaltyRequests = lrRows?.map(r => ({
        id:                   r.id,
        customerId:           r.customer_id,
        customerName:         r.customer_name,
        productId:            r.product_id,
        productName:          r.product_name,
        pointsUsed:           r.points_used,
        customerPointsBefore: r.customer_points_before,
        status:               r.status as any,
        requestDate:          new Date(r.request_date),
        processedDate:        r.processed_date   ? new Date(r.processed_date)   : undefined,
        processedBy:          r.processed_by      ?? undefined,
        expiresAt:            r.expires_at       ? new Date(r.expires_at)       : undefined,
        companyId:            r.company_id,
      })) || [];

      // 10) webhookConfigs
      const { data: wcRows, error: wcErr } = await supabase
        .from('webhook_configs')
        .select('*');
      if (wcErr) console.error(wcErr);
      const webhookConfigs = wcRows?.map(wc => ({
        id:            wc.id,
        companyId:     wc.company_id,
        url:           wc.url,
        secret:        wc.secret,
        enabledEvents: wc.enabled_events,
      })) || [];

      dispatch({
          type: 'INITIALIZE_DATA',
          payload: {
            customers,
            products,
            sales,
            plans,
            companies,
            pointsConfigs,
            pointsTransactions,
            loyaltyRequests,
            webhookConfigs,
          },
        });

        // Se não havia currentCompany, joga a primeira empresa aqui:
        if (companies.length > 0) {
          dispatch({ type: 'SET_CURRENT_COMPANY', payload: companies[0] });
        }

        dispatch({ type: 'SET_LOADING', payload: false });
     
    }

    initData();
  }, []);  // ← certifica-se de fechar o useEffect aqui

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}



export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};