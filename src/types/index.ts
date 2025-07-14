export interface Customer {
  id: string;
  name: string;
  cpf: string;
  email: string;
  phone: string;
  address?: string;
  birthDate: Date;
  points: number;
  password: string;
  createdAt: Date;
  companyId: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  imageUrl?: string;
  available: boolean;
  createdAt: Date;
  companyId: string;
}

export interface Sale {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  pointsEarned: number;
  date: Date;
  description?: string;
  companyId: string;
  products?: string;
  originalAmount?: number;
  pointsUsedAsDiscount?: number;
  discountAmount?: number;
}

export interface PointsConfig {
  reaisPerPoint: number;
  companyId: string;
}

export interface PointsTransaction {
  id: string;
  customerId: string;
  customerName: string;
  type: 'earned' | 'spent' | 'credit' | 'debit';
  points: number;
  description: string;
  date: Date;
  companyId: string;
}

export interface LoyaltyRequest {
  id: string;
  customerId: string;
  customerName: string;
  productId: string;
  productName: string;
  pointsUsed: number;
  status: 'pending' | 'approved' | 'rejected' | 'available_for_pickup' | 'completed';
  requestDate: Date;
  processedDate?: Date;
  processedBy?: string;
  companyId: string;
  expiresAt?: Date;
  rejectionReason?: string;
}

export interface Plan {
  id: string;
  name: string;
  maxCustomers: number;
  maxProducts: number;
  price: number;
  features: string[];
  createdAt: Date;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
  password: string;
  planId: string;
  isActive: boolean;
  createdAt: Date;
}

export interface WebhookConfig {
  companyId: string;
  purchases: {
    enabled: boolean;
    url: string;
  };
  requests: {
    enabled: boolean;
    url: string;
  };
  birthdays: {
    enabled: boolean;
    url: string;
    message: string;
    creditsAmount: number;
    daysInAdvance: number;
  };
}

export interface User {
  id: string;
  type: 'superadmin' | 'admin' | 'customer';
  email: string;
  name: string;
  companyId?: string;
}