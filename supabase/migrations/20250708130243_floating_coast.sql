/*
  # Add webhook configuration table

  1. New Tables
    - `webhook_configs`
      - `company_id` (uuid, primary key, references companies)
      - `purchases_enabled` (boolean)
      - `purchases_url` (text)
      - `requests_enabled` (boolean)
      - `requests_url` (text)
      - `birthdays_enabled` (boolean)
      - `birthdays_url` (text)
      - `birthdays_message` (text)
      - `birthdays_credits_amount` (integer)
      - `birthdays_days_in_advance` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `webhook_configs` table
    - Add policy for authenticated users to manage webhook configs
*/

CREATE TABLE IF NOT EXISTS webhook_configs (
  company_id uuid PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  purchases_enabled boolean DEFAULT false,
  purchases_url text DEFAULT '',
  requests_enabled boolean DEFAULT false,
  requests_url text DEFAULT '',
  birthdays_enabled boolean DEFAULT false,
  birthdays_url text DEFAULT '',
  birthdays_message text DEFAULT 'Olá, {nome_do_cliente}! Vimos que é seu aniversário e gostaríamos de informar que disponibilizamos {valor_de_creditos} pontos para você! Que seu aniversário seja ainda mais completo!',
  birthdays_credits_amount integer DEFAULT 100,
  birthdays_days_in_advance integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE webhook_configs ENABLE ROW LEVEL SECURITY;

-- Create policies for webhook_configs
CREATE POLICY "Webhook configs are viewable by authenticated users"
  ON webhook_configs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Webhook configs can be managed by authenticated users"
  ON webhook_configs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_webhook_configs_company_id ON webhook_configs(company_id);