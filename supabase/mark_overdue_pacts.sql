-- Mark overdue pacts using server time
create or replace function public.mark_overdue_pacts()
returns void
language sql
security invoker
as $$
  update pacts
  set status = 'missed'
  where user_id = auth.uid()
    and status = 'active'
    and deadline < now();
$$;
