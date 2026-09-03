-- Kwartje — seed: the Dutch financial calendar.
-- Spec: docs/02-market-nl.md §5. Only genuine bill-like / big-date events
-- become obligation_templates: pure income-side calendar items (toeslagen,
-- salaris, kinderbijslag, vakantiegeld) already have first-class homes in
-- income_events/benefits and are not obligations (docs/06 §8 header:
-- "Annual/irregular bills that are not simple recurring debits").
-- Idempotent: obligation_templates.key is a primary key.

insert into obligation_templates (key, name, category_key, month, typical_amount_min_cents, typical_amount_max_cents, instalments_common, notes) values
(
  'motorrijtuigenbelasting', 'Motorrijtuigenbelasting', 'auto_onderhoud_apk', null,
  5000, 15000, false,
  'Kwartaalheffing van de Belastingdienst; geen aparte categorie in de taxonomie, daarom onder auto-onderhoud & APK geplaatst.'
),
(
  'gemeentebelasting_jaarlijks', 'Gemeentelijke belastingen (OZB, afvalstoffen-, rioolheffing)', 'gemeentebelasting', 2,
  20000, 90000, true,
  'Betaalbaar in circa 8–10 maandelijkse termijnen via automatische incasso; kwijtschelding mogelijk bij een laag inkomen.'
),
(
  'waterschapsbelasting_jaarlijks', 'Waterschapsbelasting', 'waterschapsbelasting', 2,
  15000, 40000, true,
  'Vaak gecombineerd geïnd met de gemeentelijke aanslag.'
),
(
  'energie_jaarafrekening', 'Jaarafrekening energie', 'energie', 2,
  -30000, 50000, false,
  'Kan een teruggave (negatief) of bijbetaling (positief) zijn; meestal tussen januari en maart.'
),
(
  'zorgverzekering_overstap', 'Zorgverzekering overstapmoment', 'zorgverzekering', 12,
  null, null, false,
  'Opzeggen vóór 31 december, nieuwe polis kiezen vóór 31 januari. Informatief: geen vast bedrag.'
),
(
  'huurverhoging_jaarlijks', 'Jaarlijkse huurverhoging', 'huur', 7,
  null, null, false,
  'Treedt doorgaans op 1 juli in werking. Informatief: het percentage varieert per jaar en contract.'
),
(
  'sinterklaas', 'Sinterklaas', 'cadeaus_feestdagen', 12,
  5000, 20000, false,
  'Piek in cadeau-uitgaven begin december.'
),
(
  'zomervakantie', 'Zomervakantie', 'vakantie', 7,
  20000, 150000, false,
  'Uitgavenpiek in de zomer; schoolvakantieregio''s (noord/midden/zuid) lopen uiteen.'
)
on conflict (key) do nothing;
