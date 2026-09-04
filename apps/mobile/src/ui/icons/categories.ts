// `docs/12` §7: a fixed category-key → icon mapping, one icon per system category key, never
// randomised. Keys and their `lucide` name match `supabase/seed/01_categories.sql` (the source
// of truth per `docs/06` §6) verbatim; a handful were renamed in this pinned `lucide-react-native`
// version (`home`→`House`, `waves`→`WavesLadder`, `train`→`TrainFront`,
// `more-horizontal`→`Ellipsis`, `plus-circle`→`CirclePlus` — docs/DECISIONS.md, 2026-09-04).
import {
  Baby,
  Briefcase,
  Bus,
  Car,
  CirclePlus,
  CreditCard,
  Dog,
  Droplet,
  Dumbbell,
  Ellipsis,
  Fuel,
  Gift,
  GraduationCap,
  HandCoins,
  HeartPulse,
  House,
  Landmark,
  LifeBuoy,
  type LucideIcon,
  PawPrint,
  Palette,
  PartyPopper,
  Percent,
  Pill,
  PiggyBank,
  Plane,
  Receipt,
  Repeat,
  Shield,
  Shirt,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Stethoscope,
  Sun,
  Ticket,
  TrainFront,
  TrendingUp,
  Users,
  Utensils,
  Wallet,
  WashingMachine,
  Wifi,
  Wrench,
  Zap,
  Building2,
  WavesLadder,
  ArrowLeftRight,
} from 'lucide-react-native';

/* ── Types ────────────────────────────────────────────── */

export type CategoryIconKey =
  // vaste_lasten
  | 'huur'
  | 'hypotheek'
  | 'energie'
  | 'water'
  | 'gemeentebelasting'
  | 'waterschapsbelasting'
  | 'zorgverzekering'
  | 'overige_verzekeringen'
  | 'internet_tv'
  | 'mobiel'
  | 'abonnementen'
  | 'kinderopvang'
  | 'ov_abonnement'
  | 'aflossingen'
  | 'alimentatie'
  // reserveringen
  | 'kleding'
  | 'inventaris_onderhoud'
  | 'vakantie'
  | 'zorgkosten_eigen_risico'
  | 'contributies'
  | 'cadeaus_feestdagen'
  | 'auto_onderhoud_apk'
  | 'huisdier_zorg'
  | 'studie'
  // huishoudelijk
  | 'boodschappen'
  | 'schoonmaak_was'
  | 'persoonlijke_verzorging'
  | 'huisdieren'
  | 'uit_eten_bezorgen'
  | 'vervoer_brandstof'
  | 'openbaar_vervoer'
  | 'vrije_tijd'
  | 'sport'
  | 'medisch_klein'
  // vrij_besteedbaar
  | 'sparen'
  | 'beleggen'
  | 'uitgaan'
  | 'hobby'
  | 'overig'
  // inkomen
  | 'salaris'
  | 'vakantiegeld'
  | 'dertiende_maand'
  | 'toeslagen'
  | 'kinderbijslag'
  | 'uitkering'
  | 'zzp_omzet'
  | 'rente'
  | 'teruggave_belasting'
  | 'overig_inkomen'
  // overboeking
  | 'interne_overboeking'
  | 'sparen_overboeking';

/* ── Implementation ───────────────────────────────────── */

export const CATEGORY_ICON: Readonly<Record<CategoryIconKey, LucideIcon>> = {
  huur: House,
  hypotheek: Landmark,
  energie: Zap,
  water: Droplet,
  gemeentebelasting: Building2,
  waterschapsbelasting: WavesLadder,
  zorgverzekering: HeartPulse,
  overige_verzekeringen: Shield,
  internet_tv: Wifi,
  mobiel: Smartphone,
  abonnementen: Repeat,
  kinderopvang: Baby,
  ov_abonnement: TrainFront,
  aflossingen: CreditCard,
  alimentatie: HandCoins,

  kleding: Shirt,
  inventaris_onderhoud: Wrench,
  vakantie: Plane,
  zorgkosten_eigen_risico: Stethoscope,
  contributies: Users,
  cadeaus_feestdagen: Gift,
  auto_onderhoud_apk: Car,
  huisdier_zorg: PawPrint,
  studie: GraduationCap,

  boodschappen: ShoppingCart,
  schoonmaak_was: WashingMachine,
  persoonlijke_verzorging: Sparkles,
  huisdieren: Dog,
  uit_eten_bezorgen: Utensils,
  vervoer_brandstof: Fuel,
  openbaar_vervoer: Bus,
  vrije_tijd: Ticket,
  sport: Dumbbell,
  medisch_klein: Pill,

  sparen: PiggyBank,
  beleggen: TrendingUp,
  uitgaan: PartyPopper,
  hobby: Palette,
  overig: Ellipsis,

  salaris: Wallet,
  vakantiegeld: Sun,
  dertiende_maand: Gift,
  toeslagen: HandCoins,
  kinderbijslag: Baby,
  uitkering: LifeBuoy,
  zzp_omzet: Briefcase,
  rente: Percent,
  teruggave_belasting: Receipt,
  overig_inkomen: CirclePlus,

  interne_overboeking: ArrowLeftRight,
  sparen_overboeking: PiggyBank,
};
