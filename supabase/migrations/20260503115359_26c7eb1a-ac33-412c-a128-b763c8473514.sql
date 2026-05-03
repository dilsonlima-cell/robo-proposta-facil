
CREATE TABLE public.proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  project_title TEXT NOT NULL,
  proposal_version TEXT,
  objective TEXT,
  form_data JSONB,
  content TEXT NOT NULL,
  template_used TEXT DEFAULT 'classic',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert proposals"
ON public.proposals FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view proposals"
ON public.proposals FOR SELECT
USING (true);

CREATE POLICY "Anyone can delete proposals"
ON public.proposals FOR DELETE
USING (true);

CREATE INDEX idx_proposals_created_at ON public.proposals(created_at DESC);
