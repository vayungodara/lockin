-- Mark overdue non-recurring pacts as missed,
-- and reset recurring pacts (completed/missed/overdue) for their next period.
create or replace function public.mark_overdue_pacts()
returns void
language plpgsql
security invoker
set search_path = pg_catalog, public, pg_temp
as $$
declare
  r record;
  next_dl timestamptz;
begin
  -- 1) Non-recurring overdue active pacts → missed
  update pacts
  set status = 'missed'
  where user_id = auth.uid()
    and status = 'active'
    and deadline < now()
    and (is_recurring = false or is_recurring is null);

  -- 2) Recurring pacts that are completed or missed AND whose deadline has passed
  --    → advance deadline to next future occurrence, reset to active
  for r in
    select id, deadline, recurrence_type
    from pacts
    where user_id = auth.uid()
      and is_recurring = true
      and recurrence_type is not null
      and deadline < now()
      and status in ('completed', 'missed')
  loop
    next_dl := r.deadline;
    loop
      case r.recurrence_type
        when 'daily' then
          next_dl := next_dl + interval '1 day';
        when 'weekly' then
          next_dl := next_dl + interval '7 days';
        when 'weekdays' then
          next_dl := next_dl + interval '1 day';
          while extract(dow from next_dl) in (0, 6) loop
            next_dl := next_dl + interval '1 day';
          end loop;
        else
          next_dl := next_dl + interval '1 day';
      end case;
      exit when next_dl > now();
    end loop;

    update pacts
    set status = 'active',
        completed_at = null,
        deadline = next_dl
    where id = r.id;
  end loop;

  -- 3) Recurring active pacts that are overdue (user didn't complete or miss them)
  --    → advance deadline to next future occurrence, keep active
  for r in
    select id, deadline, recurrence_type
    from pacts
    where user_id = auth.uid()
      and is_recurring = true
      and recurrence_type is not null
      and status = 'active'
      and deadline < now()
  loop
    next_dl := r.deadline;
    loop
      case r.recurrence_type
        when 'daily' then
          next_dl := next_dl + interval '1 day';
        when 'weekly' then
          next_dl := next_dl + interval '7 days';
        when 'weekdays' then
          next_dl := next_dl + interval '1 day';
          while extract(dow from next_dl) in (0, 6) loop
            next_dl := next_dl + interval '1 day';
          end loop;
        else
          next_dl := next_dl + interval '1 day';
      end case;
      exit when next_dl > now();
    end loop;

    update pacts
    set deadline = next_dl
    where id = r.id;
  end loop;
end;
$$;
