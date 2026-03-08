
-- Storage bucket for screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('screenshots', 'screenshots', true);

-- Allow public read
CREATE POLICY "Screenshots are publicly accessible"
ON storage.objects FOR SELECT USING (bucket_id = 'screenshots');

-- Allow anonymous uploads (no auth required for this dev tool)
CREATE POLICY "Anyone can upload screenshots"
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'screenshots');

-- Screenshots metadata table
CREATE TABLE public.screenshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT,
  trigger_type TEXT NOT NULL DEFAULT 'manual',
  phase TEXT,
  metadata JSONB DEFAULT '{}',
  ai_analysis TEXT,
  ai_recommendations JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.screenshots ENABLE ROW LEVEL SECURITY;

-- Public read/write for dev tool (no auth)
CREATE POLICY "Anyone can view screenshots" ON public.screenshots FOR SELECT USING (true);
CREATE POLICY "Anyone can insert screenshots" ON public.screenshots FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update screenshots" ON public.screenshots FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete screenshots" ON public.screenshots FOR DELETE USING (true);
