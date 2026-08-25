-- Patients can use check-ins and Chat Buddy without being linked to a clinician.
-- They can attach a clinician later from the directory.

alter table patients alter column clinician_id drop not null;

create or replace function public.provision_patient_solo()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_role user_role;
begin
  select role into v_role from profiles where id = auth.uid();
  if v_role is distinct from 'patient' then
    raise exception 'only patients can continue without a clinician';
  end if;
  insert into patients (id, clinician_id) values (auth.uid(), null)
    on conflict (id) do nothing;
end;
$$;
grant execute on function public.provision_patient_solo() to authenticated;

-- If they started solo, attaching a clinician later updates the null clinician_id.
-- If they already have a clinician, this is a no-op so they cannot reassign themselves.
create or replace function public.provision_patient_with_clinician(p_clinician_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_role user_role;
begin
  select role into v_role from profiles where id = auth.uid();
  if v_role is distinct from 'patient' then
    raise exception 'only patients can select their own clinician';
  end if;
  if not exists (select 1 from clinicians where id = p_clinician_id) then
    raise exception 'clinician not found';
  end if;
  insert into patients (id, clinician_id) values (auth.uid(), p_clinician_id)
    on conflict (id) do update
      set clinician_id = excluded.clinician_id
      where patients.clinician_id is null;
end;
$$;
grant execute on function public.provision_patient_with_clinician(uuid) to authenticated;
