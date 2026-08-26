-- Migration: 25_notifications_system
-- Add notifications table, RLS, triggers, and admin broadcast RPC.

-- 1. Create Type & Table
CREATE TYPE public.notification_type AS ENUM (
  'payment_completed', 'payment_expired', 'payment_failed',
  'sms_generated', 'sms_received', 'sms_expired', 'admin_broadcast'
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id) WHERE read = false;

-- 2. RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- 3. Triggers for Transactions (Payments)
CREATE OR REPLACE FUNCTION public.notify_transaction_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if status changed from pending to a final state for a recharge
  IF OLD.status = 'pending' AND NEW.status IN ('completed', 'expired', 'failed') AND NEW.type = 'recharge' THEN
    IF NEW.status = 'completed' THEN
      INSERT INTO public.notifications (user_id, type, title, message)
      VALUES (NEW.user_id, 'payment_completed', 'Pagamento confirmado', 'Pagamento confirmado! R$ ' || NEW.amount || ' adicionados ao seu saldo.');
    ELSIF NEW.status = 'expired' THEN
      INSERT INTO public.notifications (user_id, type, title, message)
      VALUES (NEW.user_id, 'payment_expired', 'Pagamento expirado', 'Sua cobrança Pix expirou. Gere uma nova para recarregar.');
    ELSIF NEW.status = 'failed' THEN
      INSERT INTO public.notifications (user_id, type, title, message)
      VALUES (NEW.user_id, 'payment_failed', 'Pagamento falhou', 'Houve um erro ao processar seu pagamento. Tente novamente.');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_transaction_change
AFTER UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.notify_transaction_change();

-- 4. Triggers for Activations (SMS)
CREATE OR REPLACE FUNCTION public.notify_activation_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_service_name text;
BEGIN
  SELECT name INTO v_service_name FROM public.services WHERE id = NEW.service_id;
  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (NEW.user_id, 'sms_generated', 'Número gerado', 'Número gerado para ' || COALESCE(v_service_name, 'serviço') || '. Aguardando SMS...');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_activation_insert
AFTER INSERT ON public.activations
FOR EACH ROW
EXECUTE FUNCTION public.notify_activation_insert();

CREATE OR REPLACE FUNCTION public.notify_activation_change()
RETURNS TRIGGER AS $$
DECLARE
  v_service_name text;
BEGIN
  -- Notify when transitioning from waiting to completed or cancelled
  IF OLD.status = 'waiting' AND NEW.status IN ('completed', 'cancelled') THEN
    SELECT name INTO v_service_name FROM public.services WHERE id = NEW.service_id;
    
    IF NEW.status = 'completed' THEN
      INSERT INTO public.notifications (user_id, type, title, message)
      VALUES (NEW.user_id, 'sms_received', 'SMS Recebido', 'Código recebido para ' || COALESCE(v_service_name, 'serviço') || ': ' || NEW.sms_code);
    ELSIF NEW.status = 'cancelled' THEN
      INSERT INTO public.notifications (user_id, type, title, message)
      VALUES (NEW.user_id, 'sms_expired', 'Ativação expirada', 'A ativação para ' || COALESCE(v_service_name, 'serviço') || ' expirou ou foi cancelada sem receber o código.');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_activation_change
AFTER UPDATE ON public.activations
FOR EACH ROW
EXECUTE FUNCTION public.notify_activation_change();

-- 5. Admin Broadcast RPC
CREATE OR REPLACE FUNCTION public.admin_broadcast_notification(p_title TEXT, p_message TEXT)
RETURNS void AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message)
  SELECT id, 'admin_broadcast', p_title, p_message
  FROM auth.users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Expose table to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
