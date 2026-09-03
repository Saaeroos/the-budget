-- Kwartje — seed: system categories.
-- Spec: docs/06-data-model.md §6 (the exact key list, per group).
-- Idempotent: targets the partial unique index on (key) where
-- household_id is null (see 03_categories.sql migration).

insert into categories (household_id, "group", key, name_nl, name_en, icon, is_system, sort_order) values
-- vaste_lasten
(null, 'vaste_lasten', 'huur', 'Huur', 'Rent', 'home', true, 1),
(null, 'vaste_lasten', 'hypotheek', 'Hypotheek', 'Mortgage', 'landmark', true, 2),
(null, 'vaste_lasten', 'energie', 'Energie', 'Energy', 'zap', true, 3),
(null, 'vaste_lasten', 'water', 'Water', 'Water', 'droplet', true, 4),
(null, 'vaste_lasten', 'gemeentebelasting', 'Gemeentebelasting', 'Municipal tax', 'building-2', true, 5),
(null, 'vaste_lasten', 'waterschapsbelasting', 'Waterschapsbelasting', 'Water board tax', 'waves', true, 6),
(null, 'vaste_lasten', 'zorgverzekering', 'Zorgverzekering', 'Health insurance', 'heart-pulse', true, 7),
(null, 'vaste_lasten', 'overige_verzekeringen', 'Overige verzekeringen', 'Other insurance', 'shield', true, 8),
(null, 'vaste_lasten', 'internet_tv', 'Internet & tv', 'Internet & TV', 'wifi', true, 9),
(null, 'vaste_lasten', 'mobiel', 'Mobiel', 'Mobile phone', 'smartphone', true, 10),
(null, 'vaste_lasten', 'abonnementen', 'Abonnementen', 'Subscriptions', 'repeat', true, 11),
(null, 'vaste_lasten', 'kinderopvang', 'Kinderopvang', 'Childcare', 'baby', true, 12),
(null, 'vaste_lasten', 'ov_abonnement', 'OV-abonnement', 'Public transport pass', 'train', true, 13),
(null, 'vaste_lasten', 'aflossingen', 'Aflossingen', 'Loan repayments', 'credit-card', true, 14),
(null, 'vaste_lasten', 'alimentatie', 'Alimentatie', 'Alimony', 'hand-coins', true, 15),
-- reserveringen
(null, 'reserveringen', 'kleding', 'Kleding & schoenen', 'Clothing & shoes', 'shirt', true, 1),
(null, 'reserveringen', 'inventaris_onderhoud', 'Inventaris & onderhoud', 'Household inventory & maintenance', 'wrench', true, 2),
(null, 'reserveringen', 'vakantie', 'Vakantie', 'Holiday', 'plane', true, 3),
(null, 'reserveringen', 'zorgkosten_eigen_risico', 'Zorgkosten & eigen risico', 'Healthcare costs & deductible', 'stethoscope', true, 4),
(null, 'reserveringen', 'contributies', 'Contributies', 'Membership fees', 'users', true, 5),
(null, 'reserveringen', 'cadeaus_feestdagen', 'Cadeaus & feestdagen', 'Gifts & holidays', 'gift', true, 6),
(null, 'reserveringen', 'auto_onderhoud_apk', 'Auto-onderhoud & APK', 'Car maintenance & inspection', 'car', true, 7),
(null, 'reserveringen', 'huisdier_zorg', 'Huisdierenzorg', 'Pet care', 'paw-print', true, 8),
(null, 'reserveringen', 'studie', 'Studie', 'Education', 'graduation-cap', true, 9),
-- huishoudelijk
(null, 'huishoudelijk', 'boodschappen', 'Boodschappen', 'Groceries', 'shopping-cart', true, 1),
(null, 'huishoudelijk', 'schoonmaak_was', 'Schoonmaak & was', 'Cleaning & laundry', 'washing-machine', true, 2),
(null, 'huishoudelijk', 'persoonlijke_verzorging', 'Persoonlijke verzorging', 'Personal care', 'sparkles', true, 3),
(null, 'huishoudelijk', 'huisdieren', 'Huisdieren', 'Pets', 'dog', true, 4),
(null, 'huishoudelijk', 'uit_eten_bezorgen', 'Uit eten & bezorgen', 'Eating out & delivery', 'utensils', true, 5),
(null, 'huishoudelijk', 'vervoer_brandstof', 'Vervoer & brandstof', 'Transport & fuel', 'fuel', true, 6),
(null, 'huishoudelijk', 'openbaar_vervoer', 'Openbaar vervoer', 'Public transport', 'bus', true, 7),
(null, 'huishoudelijk', 'vrije_tijd', 'Vrije tijd', 'Leisure', 'ticket', true, 8),
(null, 'huishoudelijk', 'sport', 'Sport', 'Sport', 'dumbbell', true, 9),
(null, 'huishoudelijk', 'medisch_klein', 'Kleine medische kosten', 'Minor medical costs', 'pill', true, 10),
-- vrij_besteedbaar
(null, 'vrij_besteedbaar', 'sparen', 'Sparen', 'Savings', 'piggy-bank', true, 1),
(null, 'vrij_besteedbaar', 'beleggen', 'Beleggen', 'Investing', 'trending-up', true, 2),
(null, 'vrij_besteedbaar', 'uitgaan', 'Uitgaan', 'Going out', 'party-popper', true, 3),
(null, 'vrij_besteedbaar', 'hobby', 'Hobby', 'Hobby', 'palette', true, 4),
(null, 'vrij_besteedbaar', 'overig', 'Overig', 'Other', 'more-horizontal', true, 5),
-- inkomen
(null, 'inkomen', 'salaris', 'Salaris', 'Salary', 'wallet', true, 1),
(null, 'inkomen', 'vakantiegeld', 'Vakantiegeld', 'Holiday allowance', 'sun', true, 2),
(null, 'inkomen', 'dertiende_maand', 'Dertiende maand', '13th month bonus', 'gift', true, 3),
(null, 'inkomen', 'toeslagen', 'Toeslagen', 'Benefits', 'hand-coins', true, 4),
(null, 'inkomen', 'kinderbijslag', 'Kinderbijslag', 'Child benefit', 'baby', true, 5),
(null, 'inkomen', 'uitkering', 'Uitkering', 'Social benefit', 'life-buoy', true, 6),
(null, 'inkomen', 'zzp_omzet', 'ZZP-omzet', 'Freelance revenue', 'briefcase', true, 7),
(null, 'inkomen', 'rente', 'Rente', 'Interest', 'percent', true, 8),
(null, 'inkomen', 'teruggave_belasting', 'Belastingteruggave', 'Tax refund', 'receipt', true, 9),
(null, 'inkomen', 'overig_inkomen', 'Overige inkomsten', 'Other income', 'plus-circle', true, 10),
-- overboeking
(null, 'overboeking', 'interne_overboeking', 'Interne overboeking', 'Internal transfer', 'arrow-left-right', true, 1),
(null, 'overboeking', 'sparen_overboeking', 'Overboeking naar sparen', 'Transfer to savings', 'piggy-bank', true, 2)
on conflict (key) where household_id is null do nothing;
