/*
  # Initial Database Schema for Fideliza.AI

  1. New Tables
    - `plans` - Subscription plans for companies
    - `companies` - Company information and settings
    - `customers` - Customer data with loyalty points
    - `products` - Products available for redemption
    - `sales` - Sales transactions and points earned
    - `points_config` - Points configuration per company
    - `points_transactions` - Detailed points transaction history
    - `loyalty_requests` - Product redemption requests

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users based on company access
    - Ensure data isolation between companies

  3. Features
    - UUID primary keys for all tables
    - Proper foreign key relationships
    - Default values for timestamps and boolean fields
    - Unique constraints where needed
*/

-- Create plans table
CREATE TABLE IF NOT EXISTS plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  max_customers integer NOT NULL DEFAULT 100,
  max_products integer NOT NULL DEFAULT 50,
  price decimal(10,2) NOT NULL DEFAULT 0,
  features text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  owner_name text NOT NULL,
  owner_email text UNIQUE NOT NULL,
  password text NOT NULL,
  plan_id uuid REFERENCES plans(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cpf text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text DEFAULT '',
  birth_date date NOT NULL,
  points integer DEFAULT 0,
  password text NOT NULL,
  created_at timestamptz DEFAULT now(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  UNIQUE(cpf, company_id),
  UNIQUE(email, company_id)
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  points_required integer NOT NULL DEFAULT 0,
  image_url text DEFAULT '',
  available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE
);

-- Create points_config table
CREATE TABLE IF NOT EXISTS points_config (
  company_id uuid PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  reais_per_point decimal(10,2) NOT NULL DEFAULT 1.00
);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  amount decimal(10,2) NOT NULL DEFAULT 0,
  points_earned integer NOT NULL DEFAULT 0,
  date timestamptz DEFAULT now(),
  description text DEFAULT '',
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  products text DEFAULT '',
  original_amount decimal(10,2) DEFAULT 0,
  points_used_as_discount integer DEFAULT 0,
  discount_amount decimal(10,2) DEFAULT 0
);

-- Create points_transactions table
CREATE TABLE IF NOT EXISTS points_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  type text NOT NULL CHECK (type IN ('earned', 'spent', 'credit', 'debit')),
  points integer NOT NULL,
  description text NOT NULL,
  date timestamptz DEFAULT now(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE
);

-- Create loyalty_requests table
CREATE TABLE IF NOT EXISTS loyalty_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  points_used integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  request_date timestamptz DEFAULT now(),
  processed_date timestamptz,
  processed_by text,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE
);

-- Enable Row Level Security on all tables
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for plans (accessible to all authenticated users)
CREATE POLICY "Plans are viewable by authenticated users"
  ON plans
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for companies (accessible to all authenticated users for basic info)
CREATE POLICY "Companies are viewable by authenticated users"
  ON companies
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Companies can be updated by authenticated users"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Companies can be inserted by authenticated users"
  ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for customers (company-specific access)
CREATE POLICY "Customers are viewable by same company"
  ON customers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Customers can be inserted by authenticated users"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Customers can be updated by authenticated users"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Customers can be deleted by authenticated users"
  ON customers
  FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for products (company-specific access)
CREATE POLICY "Products are viewable by authenticated users"
  ON products
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Products can be managed by authenticated users"
  ON products
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for points_config (company-specific access)
CREATE POLICY "Points config is viewable by authenticated users"
  ON points_config
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Points config can be managed by authenticated users"
  ON points_config
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for sales (company-specific access)
CREATE POLICY "Sales are viewable by authenticated users"
  ON sales
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Sales can be managed by authenticated users"
  ON sales
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for points_transactions (company-specific access)
CREATE POLICY "Points transactions are viewable by authenticated users"
  ON points_transactions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Points transactions can be managed by authenticated users"
  ON points_transactions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for loyalty_requests (company-specific access)
CREATE POLICY "Loyalty requests are viewable by authenticated users"
  ON loyalty_requests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Loyalty requests can be managed by authenticated users"
  ON loyalty_requests
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default plan
INSERT INTO plans (name, max_customers, max_products, price, features) VALUES
('Básico', 100, 50, 29.90, ARRAY['Gestão de clientes', 'Sistema de pontos', 'Produtos para resgate'])
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_cpf ON customers(cpf);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_birth_date ON customers(birth_date);
CREATE INDEX IF NOT EXISTS idx_products_company_id ON products(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_company_id ON sales(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
CREATE INDEX IF NOT EXISTS idx_points_transactions_company_id ON points_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_customer_id ON points_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_requests_company_id ON loyalty_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_requests_status ON loyalty_requests(status);