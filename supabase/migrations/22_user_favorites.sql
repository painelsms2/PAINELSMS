-- 22_user_favorites.sql

CREATE TABLE IF NOT EXISTS public.user_favorites (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    service_id TEXT REFERENCES public.services(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, service_id)
);

-- Enable RLS
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see only their own favorites
CREATE POLICY "Users can view their own favorites"
    ON public.user_favorites
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own favorites
CREATE POLICY "Users can insert their own favorites"
    ON public.user_favorites
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own favorites
CREATE POLICY "Users can delete their own favorites"
    ON public.user_favorites
    FOR DELETE
    USING (auth.uid() = user_id);
