alter table public.writing_drafts
  add column if not exists thumbnail_url text;
