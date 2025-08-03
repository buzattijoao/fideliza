-- 20250708121901_navy_hill.sql
-- Atualiza loyalty_requests: expande status, adiciona expires_at e rejection_reason

-- 1) Remove antigo CHECK de status (se existir)
ALTER TABLE public.loyalty_requests
  DROP CONSTRAINT IF EXISTS pedidos_lealdade_status_check;

-- 2) Adiciona novo CHECK com as opções extras
ALTER TABLE public.loyalty_requests
  ADD CONSTRAINT pedidos_lealdade_status_check
    CHECK (status IN (
      'pending',
      'approved',
      'rejected',
      'available_for_pickup',
      'completed'
    ));

-- 3) Garante que a coluna expires_at existe
ALTER TABLE public.loyalty_requests
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- 4) Garante que a coluna rejection_reason existe
ALTER TABLE public.loyalty_requests
  ADD COLUMN IF NOT EXISTS rejection_reason text;
