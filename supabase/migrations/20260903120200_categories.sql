-- Kwartje — 03: categories.
-- Spec: docs/06-data-model.md §6; docs/07-supabase-schema.md §4.

create table categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households on delete cascade,
  "group" category_group not null,
  key text not null,
  name_nl text not null,
  name_en text not null,
  icon text not null,
  color text,
  parent_id uuid references categories on delete set null,
  is_system boolean not null default false,
  sort_order int not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- docs/06 §6: "system categories have household_id is null"; a household
  -- category is, by construction, not a system one and vice versa.
  constraint categories_system_household_ck check (
    (is_system and household_id is null) or (not is_system and household_id is not null)
  )
);

-- `key` is unique among system categories, and unique per household among
-- that household's own categories — a plain UNIQUE(household_id, key) would
-- not do this because NULL <> NULL, so two system rows could share a key.
create unique index categories_system_key_uniq on categories (key) where household_id is null;
create unique index categories_household_key_uniq on categories (household_id, key) where household_id is not null;
create index categories_household_idx on categories (household_id);
create index categories_group_idx on categories ("group");
create index categories_parent_idx on categories (parent_id) where parent_id is not null;

revoke all on table categories from anon;
alter table categories enable row level security;

-- docs/07 §4, verbatim: "select allowed when household_id is null (system)
-- or app.is_member(household_id). Insert/update/delete only for own
-- household rows."
create policy categories_select on categories for select to authenticated
  using (household_id is null or app.is_member(household_id));
create policy categories_insert on categories for insert to authenticated
  with check (household_id is not null and app.is_member(household_id) and not is_system);
create policy categories_update on categories for update to authenticated
  using (household_id is not null and app.is_member(household_id))
  with check (household_id is not null and app.is_member(household_id) and not is_system);
create policy categories_delete on categories for delete to authenticated
  using (household_id is not null and app.is_member(household_id));

create trigger categories_touch_updated_at before update on categories
  for each row execute function app.touch_updated_at();
-- household_id is nullable here (null forever, for system rows) but still
-- must never be reassigned once set (invariant I-1).
create trigger categories_freeze_household before update on categories
  for each row execute function app.freeze_household();
