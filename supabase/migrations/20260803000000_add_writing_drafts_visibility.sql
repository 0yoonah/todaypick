alter table public.writing_drafts
  add column if not exists visibility text not null default 'private';

alter table public.writing_drafts
  drop constraint if exists writing_drafts_visibility_check;
alter table public.writing_drafts
  add constraint writing_drafts_visibility_check
  check (visibility in ('public', 'private'));
