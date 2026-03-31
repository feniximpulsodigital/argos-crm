-- Add 'type' and 'status' columns to messages table for media type tracking and delivery status
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'text';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'delivered';