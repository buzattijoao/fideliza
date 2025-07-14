import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Customer, Product, Sale, PointsConfig, PointsTransaction, User, Company, Plan, LoyaltyRequest, WebhookConfig } from '../types';

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

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CURRENT_USER'; payload: User | null }
  | { type: 'SET_CURRENT_COMPANY'; payload: Company | null }
  | { type: 'ADD_CUSTOMER'; payload: Customer }
  | { type: 'UPDATE_CUSTOMER'; payload: Customer }
  | { type: 'DELETE_CUSTOMER'; payload: string }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'ADD_SALE'; payload: Sale }
  | { type: 'UPDATE_POINTS_CONFIG'; payload: PointsConfig }
  | { type: 'ADD_POINTS_TRANSACTION'; payload: PointsTransaction }
  | { type: 'DELETE_POINTS_TRANSACTION'; payload: string }
  | { type: 'DELETE_SALE'; payload: string }
  | { type: 'DELETE_POINTS_CONFIG'; payload: string }
  | { type: 'ADD_COMPANY'; payload: Company }
  | { type: 'UPDATE_COMPANY'; payload: Company }
  | { type: 'DELETE_COMPANY'; payload: string }
  | { type: 'ADD_PLAN'; payload: Plan }
  | { type: 'UPDATE_PLAN'; payload: Plan }
  | { type: 'DELETE_PLAN'; payload: string }
  | { type: 'ADD_LOYALTY_REQUEST'; payload: LoyaltyRequest }
  | { type: 'UPDATE_LOYALTY_REQUEST'; payload: LoyaltyRequest }
  | { type: 'DELETE_LOYALTY_REQUEST'; payload: string }
  | { type: 'UPDATE_WEBHOOK_CONFIG'; payload: WebhookConfig }
  | { type: 'INITIALIZE_DATA'; payload: Partial<AppState> };

const defaultPlans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    maxCustomers: 100,
    maxProducts: 10,
    price: 49.90,
    features: ['100 clientes', '10 produtos', 'Suporte básico'],
    createdAt: new Date(),
  },
  {
    id: 'professional',
    name: 'Professional',
    maxCustomers: 500,
    maxProducts: 50,
    price: 99.90,
    features: ['500 clientes', '50 produtos', 'Suporte prioritário', 'Relatórios avançados'],
    createdAt: new Date(),
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    maxCustomers: -1, // Unlimited
    maxProducts: -1, // Unlimited
    price: 199.90,
    features: ['Clientes ilimitados', 'Produtos ilimitados', 'Suporte 24/7', 'API personalizada'],
    createdAt: new Date(),
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
    case 'ADD_SALE':
      return { ...state, sales: [...state.sales, action.payload] };
    case 'UPDATE_POINTS_CONFIG':
      return {
        ...state,
        pointsConfigs: state.pointsConfigs.some(pc => pc.companyId === action.payload.companyId)
          ? state.pointsConfigs.map(pc =>
              pc.companyId === action.payload.companyId ? action.payload : pc
            )
          : [...state.pointsConfigs, action.payload],
      };
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
    case 'DELETE_SALE':
      return {
        ...state,
        sales: state.sales.filter(s => s.id !== action.payload),
      };
    case 'DELETE_POINTS_CONFIG':
      return {
        ...state,
        pointsConfigs: state.pointsConfigs.filter(pc => pc.companyId !== action.payload),
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
    // Load data from localStorage on mount
    const savedData = localStorage.getItem('fidelizaAiData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        
        // Migrate existing customers to include birthDate if missing
        if (parsedData.customers) {
          parsedData.customers = parsedData.customers.map((customer: any) => ({
            ...customer,
            birthDate: customer.birthDate || new Date('1990-01-01'),
          }));
        }
        
        // Ensure default plans are always available
        const dataWithPlans = {
          ...parsedData,
          plans: parsedData.plans?.length > 0 ? parsedData.plans : defaultPlans,
        };
        dispatch({ type: 'INITIALIZE_DATA', payload: dataWithPlans });
      } catch (error) {
        console.error('Error loading saved data:', error);
        dispatch({ type: 'INITIALIZE_DATA', payload: { plans: defaultPlans } });
      }
    } else {
      dispatch({ type: 'INITIALIZE_DATA', payload: { plans: defaultPlans } });
    }
  }, []);

  useEffect(() => {
    // Save data to localStorage whenever state changes
    const dataToSave = {
      customers: state.customers,
      products: state.products,
      sales: state.sales,
      pointsConfigs: state.pointsConfigs,
      pointsTransactions: state.pointsTransactions,
      companies: state.companies,
      plans: state.plans,
      loyaltyRequests: state.loyaltyRequests,
      webhookConfigs: state.webhookConfigs,
    };
    localStorage.setItem('fidelizaAiData', JSON.stringify(dataToSave));
  }, [state.customers, state.products, state.sales, state.pointsConfigs, state.pointsTransactions, state.companies, state.plans, state.loyaltyRequests, state.webhookConfigs]);

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