-- 20_limit_pending_pix.sql

CREATE OR REPLACE FUNCTION public.check_pending_pix_limit()
RETURNS TRIGGER AS $$
DECLARE
    pending_count INT;
BEGIN
    IF NEW.type = 'recharge' AND NEW.status = 'pending' THEN
        SELECT COUNT(*) INTO pending_count
        FROM public.transactions
        WHERE user_id = NEW.user_id 
          AND type = 'recharge' 
          AND status = 'pending';
          
        IF pending_count >= 3 THEN
            RAISE EXCEPTION 'Limite de transacoes PIX pendentes excedido (max 3)';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_pending_pix_limit_trigger ON public.transactions;

CREATE TRIGGER check_pending_pix_limit_trigger
BEFORE INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.check_pending_pix_limit();
