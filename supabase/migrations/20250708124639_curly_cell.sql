-- Add rejection_reason column to loyalty_requests table
ALTER TABLE loyalty_requests 
ADD COLUMN IF NOT EXISTS rejection_reason text;