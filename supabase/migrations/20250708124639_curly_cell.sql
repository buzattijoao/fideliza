-- 20250708124639_curly_cell.sql
-- Adiciona coluna rejection_reason à tabela loyalty_requests

ALTER TABLE public.loyalty_requests
  ADD COLUMN IF NOT EXISTS rejection_reason text;
