---
description: Create a database migration with RLS, indexes and pgTAP tests
---

Create the migration `$1`.

1. Read `docs/06-data-model.md` for the entity and its invariants, and `docs/07-supabase-schema.md` §4–§5 for the RLS and trigger patterns.
2. `pnpm db:new $1` to create the timestamped file.
3. In the **same** file:
   - the DDL, with check constraints for every invariant that can be expressed in the database
   - `alter table … enable row level security`
   - all four policies (select/insert/update/delete) using `app.can_read` / `app.is_member`
   - indexes for every query pattern the feature needs
   - triggers (`touch_updated_at`, `freeze_household` where applicable)
4. Add a pgTAP test in `supabase/tests/` proving: user A cannot read user B's rows; a `personal`-scoped row is invisible to another household member; every check constraint rejects bad data.
5. Update the drizzle schema in `src/db/schema.ts` if the table is mirrored locally.
6. Run `pnpm db:reset && pnpm test:db`.

The migration must be backward compatible with the currently released app (expand → migrate → contract across two releases). Never drop a column in the same release that stops writing it.
