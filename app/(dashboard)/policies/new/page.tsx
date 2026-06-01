"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import api, { policiesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, ChevronDown, X } from "lucide-react";
import Link from "next/link";

// ── Sabit tiplər və məlumatlar ────────────────────────────────────────────────

type PolicyType = "auto" | "casco" | "property" | "travel";

const typeLabels: Record<PolicyType, string> = {
  auto: "İcbari avtomobil sığortası",
  casco: "Kasko",
  property: "Əmlak",
  travel: "Səfər",
};

type InsuranceGroup = "icbari" | "könüllü" | "məhsul";

const INSURANCE_GROUPS: Record<InsuranceGroup, { label: string; items: { value: string; label: string }[] }> = {
  icbari: {
    label: "İcbari sığorta növləri",
    items: [
      { value: "avtonəqliyyat", label: "Avtonəqliyyat vasitəsi sahiblərinin mülki məsuliyyətinin icbari sığortası" },
      { value: "daşınmaz_əmlak", label: "Daşınmaz əmlakın icbari sığortası" },
      { value: "dəimmis", label: "Daşınmaz əmlakın istismarı ilə bağlı mülki məsuliyyətin icbari sığortası – DƏİMMİS" },
      { value: "peşə_əmək", label: "İstehsalatda bədbəxt hadisələr və peşə xəstəlikləri nəticəsindən icbari sığorta" },
      { value: "sərnişin", label: "Sərnişinlərin icbari fərdi qəza sığortası" },
      { value: "auditor", label: "Auditorların Peşə Məsuliyyətinin İcbari Sığortası" },
      { value: "yaşıl_kart", label: "Yaşıl Kart" },
    ],
  },
  könüllü: {
    label: "Könüllü növlər",
    items: [
      { value: "kasko", label: "Kasko sığorta" },
      { value: "əmlak", label: "Əmlak Sığortası" },
      { value: "səfər", label: "Səfər sığortası" },
      { value: "yük", label: "Yük sığortası" },
      { value: "tibbi", label: "Tibbi sığorta" },
      { value: "qiymətləndirmə_peşə", label: "Qiymətləndirmə Peşə Məsuliyyətinin Sığortası" },
      { value: "fərdi_qəza", label: "Fərdi qəza sığortası" },
    ],
  },
  məhsul: {
    label: "Sığorta məhsulları",
    items: [],
  },
};

const INSURANCE_COMPANIES = [
  {
    key: "ateşgah",
    label: "Atəşgah sığorta",
    items: [
      { value: "ateşgah_agent_kasko", label: "Agent kasko" },
      { value: "ateşgah_kasko_bolgem", label: "Kasko Bölgəm" },
      { value: "ateşgah_al_paket", label: "Al paket" },
      { value: "ateşgah_avto_plus", label: "Avto+" },
      { value: "ateşgah_avto_extra", label: "Avto Extra" },
      { value: "ateşgah_arxayin_qonsu", label: "Arxayın qonşu" },
      { value: "ateşgah_yuz_yasa_tibbi", label: "Yüz yaşa Tibbi sığorta" },
    ],
  },
  {
    key: "ateşgah_həyat",
    label: "Atəşgah Həyat sığorta",
    items: [
      { value: "ah_heyatin_yigim", label: "Həyatın yığım sığortası" },
      { value: "ah_muddətli_həyat", label: "Müddətli həyat sığortası" },
      { value: "ah_usaqlarin_tehsil", label: "Uşaqların Təhsil Sığortası" },
      { value: "ah_qorunan_gelir", label: "Qorunan Gəlir sığortası" },
      { value: "ah_aile_fondu", label: "Ailə Fondu sığortası" },
    ],
  },
  {
    key: "paşa",
    label: "Paşa sığorta",
    items: [
      { value: "pasha_optimal_kasko", label: "Optimal kasko" },
      { value: "pasha_parkinq_kasko", label: "Parkinq kasko" },
      { value: "pasha_yasil_azerbaycan", label: "Yaşıl Azərbaycan" },
      { value: "pasha_yuvam", label: "Yuvam" },
      { value: "pasha_yaxin_qonsu", label: "Yaxın qonşu" },
      { value: "pasha_evrika", label: "Evrika" },
      { value: "pasha_ev_esyalari", label: "Ev əşyalarının sığortası" },
      { value: "pasha_ecnebi_sefər", label: "Əcnəbilərin səfər sığortası" },
      { value: "pasha_mektebli_tibbi", label: "Məktəbli tibbi sığortası" },
    ],
  },
  {
    key: "paşa_həyat",
    label: "Paşa Həyat sığorta",
    items: [
      { value: "ph_heyatin_yasam", label: "Həyatın yaşam sığortası" },
      { value: "ph_usaqlar_ucun_həyat", label: "Uşaqlar üçün Həyat Sığortası" },
      { value: "ph_həyata_baglam", label: "Həyata bağlan sığortası" },
      { value: "ph_gelirli_həyat", label: "Gəlirli Həyat Sığortası" },
      { value: "ph_100_qat", label: "100 Qat sığorta" },
      { value: "ph_kredit_həyat", label: "Kredit Həyat Sığortası" },
    ],
  },
  {
    key: "xalq",
    label: "Xalq Sığorta",
    items: [
      { value: "xalq_mikro_kasko", label: "Mikro kasko" },
      { value: "xalq_plyus_kasko", label: "Plyus kasko" },
      { value: "xalq_saglam_yasa", label: "Sağlam Yaşa" },
    ],
  },
  {
    key: "meqa",
    label: "Meqa sığorta",
    items: [
      { value: "meqa_mini_kasko", label: "Mini kasko" },
      { value: "meqa_extra_icbari", label: "Extra İcbari" },
    ],
  },
  {
    key: "qala",
    label: "Qala Sığorta",
    items: [
      { value: "qala_serikli_kasko", label: "Şərikli kasko" },
      { value: "qala_qaydali_kasko", label: "Qaydalı kasko" },
      { value: "qala_100", label: "Qala 100" },
      { value: "qala_emin", label: "Əmin Qala bilərsiz" },
      { value: "qala_intizamli", label: "İntizamlı Sürücü" },
      { value: "qala_elite", label: "Qala Elite Club" },
      { value: "qala_evimiz", label: "Evimiz Qalamızdır" },
      { value: "qala_saglam_həyat", label: "Sağlam Həyat" },
    ],
  },
];

const CAR_BRANDS_WITH_MODELS = [
  { id: 1, name: "Acura", models: ["CL", "ILX", "Integra", "Legend", "MDX", "NSX", "RDX", "RL", "RLX", "RSX", "TL", "TLX", "TSX", "ZDX"] },
  { id: 2, name: "Alfa Romeo", models: ["147", "156", "159", "166", "Brera", "Giulia", "Giulietta", "GTV", "MiTo", "Spider", "Stelvio", "Tonale"] },
  { id: 3, name: "Aston Martin", models: ["DB11", "DB9", "DBS", "DBX", "Rapide", "Vantage", "Virage"] },
  { id: 4, name: "Audi", models: ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "e-tron", "Q2", "Q3", "Q4", "Q5", "Q7", "Q8", "R8", "RS3", "RS4", "RS5", "RS6", "RS7", "S3", "S4", "S5", "S6", "S7", "S8", "SQ5", "SQ7", "SQ8", "TT", "TTS"] },
  { id: 5, name: "BMW", models: ["1 Seriya", "2 Seriya", "3 Seriya", "4 Seriya", "5 Seriya", "6 Seriya", "7 Seriya", "8 Seriya", "i3", "i4", "i5", "i7", "iX", "iX3", "M2", "M3", "M4", "M5", "M6", "M8", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "XM", "Z3", "Z4"] },
  { id: 6, name: "Bentley", models: ["Bentayga", "Continental", "Flying Spur", "Mulsanne"] },
  { id: 7, name: "Buick", models: ["Electra", "Encore", "Enclave", "Envision", "LaCrosse", "Regal", "Verano"] },
  { id: 8, name: "BYD", models: ["Atto 3", "Han", "Song", "Tang", "Yuan"] },
  { id: 9, name: "Cadillac", models: ["ATS", "CT4", "CT5", "CT6", "CTS", "DTS", "Escalade", "Lyriq", "SRX", "STS", "XT4", "XT5", "XT6"] },
  { id: 10, name: "Chery", models: ["Arrizo 5", "Arrizo 6", "Arrizo 8", "Tiggo 4", "Tiggo 5X", "Tiggo 7", "Tiggo 8"] },
  { id: 11, name: "Chevrolet", models: ["Aveo", "Blazer", "Camaro", "Captiva", "Colorado", "Corvette", "Cruze", "Equinox", "Express", "Impala", "Lacetti", "Malibu", "Niva", "Orlando", "Silverado", "Sonic", "Spark", "Suburban", "Tahoe", "Tracker", "TrailBlazer", "Traverse", "Trax", "Volt"] },
  { id: 12, name: "Chrysler", models: ["300", "300C", "Crossfire", "Grand Voyager", "Pacifica", "Sebring", "Town & Country", "Voyager"] },
  { id: 13, name: "Citroen", models: ["Berlingo", "C1", "C2", "C3", "C3 Aircross", "C4", "C4 Cactus", "C4 Picasso", "C5", "C5 Aircross", "C5 X", "C6", "DS3", "DS4", "DS5", "Jumpy", "Saxo", "Xsara Picasso"] },
  { id: 14, name: "Cupra", models: ["Ateca", "Born", "Formentor", "Leon"] },
  { id: 15, name: "Daewoo", models: ["Espero", "Gentra", "Lanos", "Matiz", "Nexia", "Nubira", "Sens", "Tacuma"] },
  { id: 16, name: "Daihatsu", models: ["Charade", "Cuore", "Sirion", "Terios"] },
  { id: 17, name: "Dodge", models: ["Caliber", "Challenger", "Charger", "Dart", "Durango", "Grand Caravan", "Journey", "Nitro", "Ram", "Viper"] },
  { id: 18, name: "Ferrari", models: ["458", "488", "F40", "F430", "GTC4Lusso", "LaFerrari", "Portofino", "Roma", "SF90"] },
  { id: 19, name: "Fiat", models: ["124 Spider", "500", "500L", "500X", "Bravo", "Doblo", "Ducato", "Egea", "Linea", "Palio", "Panda", "Punto", "Tipo"] },
  { id: 20, name: "Ford", models: ["Bronco", "C-Max", "EcoSport", "Edge", "Escape", "Expedition", "Explorer", "F-150", "Fiesta", "Focus", "Fusion", "Galaxy", "Kuga", "Maverick", "Mondeo", "Mustang", "Puma", "Ranger", "S-Max", "Territory", "Transit", "Transit Custom"] },
  { id: 21, name: "GAC", models: ["GS3", "GS4", "GS5", "GS8"] },
  { id: 22, name: "GAZ", models: ["21", "24", "31105", "3110", "Gazel", "Volga"] },
  { id: 23, name: "Genesis", models: ["G70", "G80", "G90", "GV70", "GV80"] },
  { id: 24, name: "Great Wall", models: ["Haval F7", "Haval H2", "Haval H6", "Haval H9", "Poer", "Tank 300", "Tank 500", "Wingle"] },
  { id: 25, name: "Honda", models: ["Accord", "Civic", "CR-V", "CR-Z", "e:Ny1", "Element", "FIT", "FR-V", "HR-V", "Insight", "Jazz", "Legend", "Odyssey", "Passport", "Pilot", "Prologue", "Ridgeline", "S2000", "Stream", "ZR-V"] },
  { id: 26, name: "Hummer", models: ["H1", "H2", "H3"] },
  { id: 27, name: "Hyundai", models: ["Accent", "Atos", "Azera", "Creta", "Elantra", "Equus", "Getz", "Grandeur", "i10", "i20", "i30", "i40", "ix20", "ix35", "Ioniq", "Ioniq 5", "Ioniq 6", "Kona", "Lantra", "Matrix", "Nexo", "Palisade", "Santa Cruz", "Santa Fe", "Sonata", "Staria", "Terracan", "Trajet", "Tucson", "Veloster", "Venue"] },
  { id: 28, name: "Infiniti", models: ["EX", "FX", "G", "M", "Q30", "Q50", "Q60", "Q70", "QX30", "QX50", "QX55", "QX60", "QX70", "QX80"] },
  { id: 29, name: "Isuzu", models: ["D-Max", "MU-X", "Trooper"] },
  { id: 30, name: "JAC", models: ["J7", "S3", "S5", "S7", "T8"] },
  { id: 31, name: "Jaguar", models: ["E-Pace", "F-Pace", "F-Type", "I-Pace", "S-Type", "X-Type", "XE", "XF", "XJ"] },
  { id: 32, name: "Jeep", models: ["Cherokee", "Commander", "Compass", "Gladiator", "Grand Cherokee", "Grand Cherokee L", "Patriot", "Renegade", "Wrangler"] },
  { id: 33, name: "Kia", models: ["Cadenza", "Carens", "Carnival", "Cerato", "Ceed", "EV6", "EV9", "K5", "K8", "K9", "Magentis", "Mohave", "Niro", "Optima", "Picanto", "ProCeed", "Rio", "Seltos", "Sorento", "Soul", "Sportage", "Stinger", "Stonic", "Telluride", "Venga", "XCeed"] },
  { id: 34, name: "Lamborghini", models: ["Aventador", "Gallardo", "Huracan", "Murcielago", "Urus"] },
  { id: 35, name: "Lada", models: ["2101", "2102", "2103", "2104", "2105", "2106", "2107", "2108", "2109", "21099", "2110", "2111", "2112", "2115", "Granta", "Kalina", "Largus", "Niva", "Priora", "XRAY"] },
  { id: 36, name: "Land Rover", models: ["Defender", "Discovery", "Discovery Sport", "Freelander", "Range Rover", "Range Rover Evoque", "Range Rover Sport", "Range Rover Velar"] },
  { id: 37, name: "Lexus", models: ["CT", "ES", "GS", "GX", "IS", "LC", "LS", "LX", "NX", "RC", "RX", "RZ", "UX"] },
  { id: 38, name: "Lincoln", models: ["Aviator", "Corsair", "MKC", "MKS", "MKT", "MKX", "MKZ", "Navigator"] },
  { id: 39, name: "Lynk & Co", models: ["01", "02", "05"] },
  { id: 40, name: "Maserati", models: ["Ghibli", "GranTurismo", "Grecale", "Levante", "MC20", "Quattroporte"] },
  { id: 41, name: "Mazda", models: ["2", "3", "5", "6", "626", "CX-3", "CX-30", "CX-5", "CX-60", "CX-7", "CX-8", "CX-9", "MX-5", "MX-30", "RX-8"] },
  { id: 42, name: "McLaren", models: ["540C", "570S", "600LT", "720S", "765LT", "Artura", "GT"] },
  { id: 43, name: "Mercedes-Benz", models: ["A", "AMG GT", "B", "C", "CL", "CLA", "CLK", "CLS", "E", "EQA", "EQB", "EQC", "EQE", "EQS", "G", "GL", "GLA", "GLB", "GLC", "GLE", "GLK", "GLS", "ML", "R", "S", "SL", "SLC", "SLK", "Sprinter", "V", "Viano", "Vito"] },
  { id: 44, name: "Mitsubishi", models: ["ASX", "Colt", "Eclipse", "Eclipse Cross", "Galant", "L200", "Lancer", "Lancer Evolution", "Montero", "Outlander", "Pajero", "Pajero Sport", "Space Star"] },
  { id: 45, name: "MINI", models: ["Clubman", "Cooper", "Countryman", "Hatch", "Paceman"] },
  { id: 46, name: "Nissan", models: ["350Z", "370Z", "Almera", "Altima", "Ariya", "Armada", "Frontier", "GT-R", "Juke", "Kicks", "Leaf", "Maxima", "Micra", "Murano", "Navara", "Note", "Patrol", "Pathfinder", "Primera", "Qashqai", "Quest", "Rogue", "Sentra", "Teana", "Terra", "Tiida", "Titan", "X-Trail", "Xterra"] },
  { id: 47, name: "Opel", models: ["Adam", "Agila", "Antara", "Astra", "Cascada", "Combo", "Corsa", "Crossland", "Grandland", "Insignia", "Meriva", "Mokka", "Omega", "Signum", "Vectra", "Vivaro", "Zafira"] },
  { id: 48, name: "Peugeot", models: ["107", "108", "2008", "208", "301", "307", "308", "3008", "4007", "4008", "407", "408", "5008", "508", "Partner", "RCZ", "Traveller"] },
  { id: 49, name: "Porsche", models: ["718", "911", "Boxster", "Cayenne", "Cayman", "Macan", "Panamera", "Taycan"] },
  { id: 50, name: "Renault", models: ["Arkana", "Austral", "Captur", "Clio", "Duster", "Espace", "Fluence", "Grand Scenic", "Kadjar", "Kangoo", "Koleos", "Laguna", "Logan", "Master", "Megane", "Modus", "Sandero", "Scenic", "Symbol", "Trafic", "Triber", "Zoe"] },
  { id: 51, name: "Rolls-Royce", models: ["Cullinan", "Dawn", "Ghost", "Phantom", "Silver Shadow", "Spectre", "Wraith"] },
  { id: 52, name: "SEAT", models: ["Arona", "Ateca", "Exeo", "Ibiza", "Leon", "Tarraco"] },
  { id: 53, name: "Skoda", models: ["Citigo", "Fabia", "Kamiq", "Karoq", "Kodiaq", "Octavia", "Rapid", "Roomster", "Scala", "Superb", "Yeti"] },
  { id: 54, name: "SsangYong", models: ["Actyon", "Korando", "Musso", "Rexton", "Rodius", "Tivoli", "XLV"] },
  { id: 55, name: "Subaru", models: ["BRZ", "Crosstrek", "Forester", "Impreza", "Legacy", "Levorg", "Outback", "Solterra", "WRX", "XV"] },
  { id: 56, name: "Suzuki", models: ["Alto", "Baleno", "Grand Vitara", "Ignis", "Jimny", "Kizashi", "Liana", "S-Cross", "SX4", "Swift", "Vitara"] },
  { id: 57, name: "Tesla", models: ["Cybertruck", "Model 3", "Model S", "Model X", "Model Y", "Roadster"] },
  { id: 58, name: "Toyota", models: ["4Runner", "Alphard", "Auris", "Avalon", "Avensis", "Aygo", "Bz4X", "C-HR", "Camry", "Corolla", "Crown", "FJ Cruiser", "Fortuner", "GR86", "GR Supra", "Hiace", "Highlander", "Hilux", "Land Cruiser", "Land Cruiser Prado", "Mark X", "Mirai", "Prius", "RAV4", "Rush", "Sequoia", "Sienna", "Tundra", "Venza", "Vios", "Yaris", "Yaris Cross"] },
  { id: 59, name: "UAZ", models: ["469", "Bukhanka", "Hunter", "Patriot"] },
  { id: 60, name: "VAZ", models: ["2101", "2102", "2103", "2104", "2105", "2106", "2107", "2108", "2109", "21099", "2110", "2111", "2112", "2115"] },
  { id: 61, name: "Volkswagen", models: ["Amarok", "Arteon", "Atlas", "Caddy", "CC", "Crafter", "Golf", "ID.3", "ID.4", "ID.5", "ID.6", "Jetta", "Multivan", "Passat", "Phaeton", "Polo", "Scirocco", "Sharan", "T-Cross", "T-Roc", "Taigo", "Tayron", "Tiguan", "Touareg", "Touran", "Transporter", "Up!"] },
  { id: 62, name: "Volvo", models: ["C30", "C40", "C70", "EX30", "EX90", "S40", "S60", "S80", "S90", "V40", "V60", "V70", "V90", "XC40", "XC60", "XC70", "XC90"] },
  { id: 63, name: "Zotye", models: ["SR7", "T300", "T600"] },
  { id: 64, name: "ZAZ", models: ["968", "Chance", "Forza", "Lanos", "Sens", "Slavuta", "Tavria"] },
  { id: 65, name: "Geely", models: ["Atlas", "Atlas Pro", "Coolray", "Emgrand", "Tugella", "Cityray"] },
  { id: 66, name: "Haval", models: ["Dargo", "F5", "F7", "F7x", "H2", "H6", "H9", "Jolion"] },
  { id: 67, name: "Changan", models: ["CS35", "CS55", "CS75", "CS85", "Eado", "UNI-T", "UNI-V", "UNI-K"] },
  { id: 68, name: "MG", models: ["3", "5", "6", "HS", "Marvel R", "RX5", "ZS"] },
  { id: 69, name: "Seres", models: ["5", "7"] },
  { id: 70, name: "Exeed", models: ["LX", "TXL", "VX"] },
  { id: 71, name: "Omoda", models: ["C5", "5"] },
];

// ── Reusable searchable dropdown ──────────────────────────────────────────────
function SearchableSelect({
  label, value, onChange, options, placeholder = "Seçin", required, disabled = false,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; placeholder?: string; required?: boolean; disabled?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (v: string) => { onChange(v); setSearch(""); setOpen(false); };
  const handleClear = (e: React.MouseEvent) => { e.stopPropagation(); onChange(""); setSearch(""); };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div ref={ref} className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen(o => !o)}
          className={`h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm flex items-center justify-between gap-2 transition-colors
            ${disabled ? "opacity-50 cursor-not-allowed bg-muted" : "hover:border-gray-400 cursor-pointer"}`}
        >
          <span className={value ? "text-foreground" : "text-muted-foreground"}>
            {value || placeholder}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {value && !disabled && (
              <span onClick={handleClear} className="text-muted-foreground hover:text-foreground">
                <X size={14} />
              </span>
            )}
            <ChevronDown size={14} className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
          </div>
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-input rounded-md shadow-lg">
            <div className="p-2 border-b">
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Axtar..."
                className="w-full text-sm px-2 py-1 border border-input rounded outline-none focus:border-primary"
              />
            </div>
            <div className="max-h-52 overflow-y-auto">
              {filtered.length === 0
                ? <div className="px-3 py-2 text-sm text-muted-foreground">Nəticə tapılmadı</div>
                : filtered.map(o => (
                  <div
                    key={o}
                    onClick={() => handleSelect(o)}
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-accent transition-colors
                      ${value === o ? "bg-primary/10 text-primary font-medium" : ""}`}
                  >
                    {o}
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {required && (
          <input tabIndex={-1} required value={value} onChange={() => { }}
            className="absolute inset-0 opacity-0 pointer-events-none" />
        )}
      </div>
    </div>
  );
}

// ── Brand + Model linked pair ─────────────────────────────────────────────────
function BrandModelSelect({
  brand, model, onBrandChange, onModelChange,
}: {
  brand: string; model: string;
  onBrandChange: (v: string) => void; onModelChange: (v: string) => void;
}) {
  const brandNames = CAR_BRANDS_WITH_MODELS.map(b => b.name);
  const selectedBrand = CAR_BRANDS_WITH_MODELS.find(b => b.name === brand);
  const modelOptions = selectedBrand ? selectedBrand.models : [];

  const handleBrandChange = (v: string) => { onBrandChange(v); onModelChange(""); };

  return (
    <>
      <SearchableSelect label="Avtomobilin markası" value={brand} onChange={handleBrandChange} options={brandNames} placeholder="Marka seçin" />
      <SearchableSelect label="Avtomobilin modeli" value={model} onChange={onModelChange} options={modelOptions} placeholder={brand ? "Model seçin" : "Əvvəlcə marka seçin"} disabled={!brand} />
    </>
  );
}

// ── InfoTooltip ───────────────────────────────────────────────────────────────
function InfoTooltip({ imageSrc, alt }: { imageSrc: string; alt: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex items-center cursor-help ml-1" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span className="text-blue-500 text-xs font-bold select-none">✶</span>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 shadow-xl rounded-lg overflow-hidden border border-gray-200 bg-white w-64">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageSrc} alt={alt} className="w-full h-auto object-contain" />
          <p className="text-xs text-center text-gray-500 py-1 px-2">{alt}</p>
        </div>
      )}
    </span>
  );
}

// ── Shared personal info fields ───────────────────────────────────────────────
function PersonalInfoFields({
  details,
  setDetail,
  customerPhone,
  setCustomerPhone,
  customerEmail,
  setCustomerEmail,
  showSearch = false,
  onSearch,
  searchLoading = false,
  searchMsg = "",
}: {
  details: Record<string, any>;
  setDetail: (key: string, value: any) => void;
  customerPhone: string;
  setCustomerPhone: (v: string) => void;
  customerEmail: string;
  setCustomerEmail: (v: string) => void;
  showSearch?: boolean;
  onSearch?: () => void;
  searchLoading?: boolean;
  searchMsg?: string;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label className="flex items-center">
          Ş/V Fin kodu *
          <InfoTooltip imageSrc="https://www.kapitalbank.az/assets/static/img/fin_code_old_version.png" alt="FİN kodu nümunəsi" />
        </Label>
        <Input
          value={details.fin || ""}
          onChange={e => setDetail("fin", e.target.value.toUpperCase())}
          placeholder="XXXXXXX"
          className="uppercase"
          required
        />
      </div>
      <div className="space-y-2">
        <Label className="flex items-center">
          Ş/V nömrəsi *
          <InfoTooltip imageSrc="https://tehsil.socar.az/img/nomresi.png" alt="Şəxsiyyət vəsiqəsi nömrəsi nümunəsi" />
        </Label>
        <Input
          value={details.id_card_no || ""}
          onChange={e => setDetail("id_card_no", e.target.value.toUpperCase())}
          placeholder="AAXXXXXXXX"
          className="uppercase"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Doğum tarixi</Label>
        <Input
          type="date"
          value={details.birth_date || ""}
          onChange={e => setDetail("birth_date", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Sürücülük vəsiqəsinin seriya və nömrəsi</Label>
        <Input
          value={details.driving_license || ""}
          onChange={e => setDetail("driving_license", e.target.value.toUpperCase())}
          placeholder="AA000000"
          className="uppercase"
        />
      </div>
      <div className="space-y-2">
        <Label>Mobil nömrə *</Label>
        <Input
          value={customerPhone}
          onChange={e => setCustomerPhone(e.target.value)}
          placeholder="+994 50 XXX XX XX"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          type="email"
          value={customerEmail}
          onChange={e => setCustomerEmail(e.target.value)}
        />
      </div>
      {/* CHANGE: showSearch prop retained but no Axtar button rendered here — 
          Avtonəqliyyat and Kasko handle their own search buttons inline */}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function NewPolicyPage() {
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [details, setDetails] = useState<Record<string, any>>({});
  const [previewPrice, setPreviewPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchMsg, setSearchMsg] = useState("");

  // Sığorta növü state-ləri
  const [insuranceGroup, setInsuranceGroup] = useState<InsuranceGroup>("icbari");
  const [insuranceSubType, setInsuranceSubType] = useState("");
  const [insuranceCompany, setInsuranceCompany] = useState("");
  const [hoveredCompany, setHoveredCompany] = useState<string>("ateşgah");
  const [openTab, setOpenTab] = useState<InsuranceGroup | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tabsRef.current && !tabsRef.current.contains(e.target as Node)) {
        setOpenTab(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const setDetail = (key: string, value: any) => setDetails(d => ({ ...d, [key]: value }));

  const handleFinSearch = async () => {
    const fin = (details.fin || "").trim();
    const idCard = (details.id_card_no || "").trim();
    if (!fin && !idCard) { setSearchMsg("FİN və ya Ş/V nömrəsi daxil edin"); return; }
    setSearchLoading(true);
    setSearchMsg("");
    try {
      const res = await api.get("/api/auth/search-customer", { params: { fin, id_card_no: idCard } });
      if (res.data?.name) {
        setCustomerName(res.data.name || "");
        setCustomerPhone(res.data.phone || "");
        setCustomerEmail(res.data.email || "");
        setSearchMsg("Müştəri tapıldı.");
      } else {
        setSearchMsg("Müştəri tapılmadı.");
      }
    } catch {
      setSearchMsg("Müştəri tapılmadı.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await policiesApi.create({
        insurance_group: insuranceGroup,
        insurance_sub_type: insuranceSubType,
        insurance_company: insuranceCompany,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        start_date: startDate,
        end_date: endDate,
        notes,
        details,
      });
      router.push("/policies");
    } catch (e: any) {
      setError(e.response?.data?.message || "Xəta baş verdi");
      setLoading(false);
    }
  };

  // ── Determine which form to show based on selected insurance sub-type ──────
  const isAvtonəqliyyat = insuranceSubType === "avtonəqliyyat";
  const isDaşınmazEmlak = insuranceSubType === "daşınmaz_əmlak";
  const isDəimmis = insuranceSubType === "dəimmis";
  const isYaşılKart = insuranceSubType === "yaşıl_kart";
  const isKasko = insuranceSubType === "kasko" ||
    INSURANCE_COMPANIES.find(c => c.key === "ateşgah")?.items.some(i => i.value === insuranceSubType && i.label.toLowerCase().includes("kasko")) ||
    INSURANCE_COMPANIES.find(c => c.key === "paşa")?.items.some(i => i.value === insuranceSubType && i.label.toLowerCase().includes("kasko")) ||
    INSURANCE_COMPANIES.find(c => c.key === "xalq")?.items.some(i => i.value === insuranceSubType && i.label.toLowerCase().includes("kasko")) ||
    INSURANCE_COMPANIES.find(c => c.key === "meqa")?.items.some(i => i.value === insuranceSubType && i.label.toLowerCase().includes("kasko")) ||
    INSURANCE_COMPANIES.find(c => c.key === "qala")?.items.some(i => i.value === insuranceSubType && i.label.toLowerCase().includes("kasko")) ||
    ["ateşgah_agent_kasko", "ateşgah_kasko_bolgem", "ateşgah_al_paket", "ateşgah_avto_plus", "ateşgah_avto_extra",
      "pasha_optimal_kasko", "pasha_parkinq_kasko", "xalq_mikro_kasko", "xalq_plyus_kasko",
      "meqa_mini_kasko", "qala_serikli_kasko", "qala_qaydali_kasko", "qala_100", "qala_emin", "qala_intizamli", "qala_elite"].includes(insuranceSubType);

  const showFormSection = insuranceSubType !== "";

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/policies"><Button variant="ghost" size="icon"><ArrowLeft size={18} /></Button></Link>
        <h1 className="text-2xl font-bold text-slate-900">Yeni Sığorta</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Sığorta növləri Card ── */}
        <Card>
          <CardHeader><CardTitle>Sığorta növləri və məhsulları</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2" ref={tabsRef}>
              {(["icbari", "könüllü", "məhsul"] as InsuranceGroup[]).map(g => (
                <div key={g} className="relative">
                  <div
                    onClick={() => setOpenTab(openTab === g ? null : g)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium flex items-center gap-1 select-none transition-colors cursor-pointer
                      ${insuranceGroup === g && insuranceSubType
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50"}`}
                  >
                    {INSURANCE_GROUPS[g].label}
                    <ChevronDown size={12} className={`opacity-50 transition-transform ${openTab === g ? "rotate-180" : ""}`} />
                  </div>

                  {openTab === g && g !== "məhsul" && (
                    <div className="absolute top-full left-0 mt-1 w-96 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                      {INSURANCE_GROUPS[g].items.map(item => (
                        <div
                          key={item.value}
                          onMouseDown={() => {
                            setInsuranceGroup(g);
                            setInsuranceSubType(item.value);
                            setInsuranceCompany("");
                            setDetails({});
                            setOpenTab(null);
                          }}
                          className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl
                            ${insuranceGroup === g && insuranceSubType === item.value ? "bg-blue-50 text-blue-700" : "text-gray-800"}`}
                        >
                          {item.label}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CHANGE: məhsul dropdown — right submenu opens on hover */}
                  {openTab === g && g === "məhsul" && (
                    <div
                      className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50"
                      style={{ width: 580, display: "flex" }}
                    >
                      {/* Left pane: company list */}
                      <div className="w-48 border-r border-gray-100 py-1 shrink-0">
                        {INSURANCE_COMPANIES.map(company => (
                          <div
                            key={company.key}
                            onMouseEnter={() => setHoveredCompany(company.key)}
                            className={`px-4 py-2.5 text-sm cursor-default flex items-center justify-between
                              ${hoveredCompany === company.key ? "bg-blue-50 text-blue-700" : "text-gray-800 hover:bg-gray-50"}`}
                          >
                            {company.label}
                            <ChevronDown size={12} className="-rotate-90 opacity-40" />
                          </div>
                        ))}
                      </div>
                      {/* Right pane: items for hovered company — always visible on hover */}
                      <div className="flex-1 py-1 overflow-y-auto max-h-72">
                        {(INSURANCE_COMPANIES.find(c => c.key === hoveredCompany) ?? INSURANCE_COMPANIES[0]).items.map(item => (
                          <div
                            key={item.value}
                            onMouseDown={() => {
                              setInsuranceGroup("məhsul");
                              setInsuranceSubType(item.value);
                              const co = INSURANCE_COMPANIES.find(c => c.items.some(i => i.value === item.value));
                              setInsuranceCompany(co?.label ?? "");
                              setDetails({});
                              setOpenTab(null);
                            }}
                            className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-gray-50
                              ${insuranceSubType === item.value ? "bg-blue-50 text-blue-700" : "text-gray-800"}`}
                          >
                            {item.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {insuranceSubType && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
                <span className="shrink-0">✓</span>
                {insuranceGroup === "məhsul" && insuranceCompany && (
                  <span className="font-medium">{insuranceCompany} —</span>
                )}
                <span>
                  {insuranceGroup === "məhsul"
                    ? INSURANCE_COMPANIES.flatMap(c => c.items).find(i => i.value === insuranceSubType)?.label
                    : INSURANCE_GROUPS[insuranceGroup as "icbari" | "könüllü"].items.find(i => i.value === insuranceSubType)?.label}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ══════════════════════════════════════════════════════════════════════
            AVTONƏQLIYYAT — İcbari avtomobil sığortası
        ══════════════════════════════════════════════════════════════════════ */}
        {showFormSection && isAvtonəqliyyat && (
          <>
            {/* Avtomobil məlumatları */}
            <Card>
              <CardHeader><CardTitle>Avtomobil məlumatlarını daxil edin</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dövlət qeydiyyat nişanı *</Label>
                  <Input
                    value={details.plate || ""}
                    onChange={e => setDetail("plate", e.target.value.toUpperCase())}
                    placeholder="90AA001"
                    required
                    className="uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Qeydiyyat şəhadətnaməsi nömrəsi *</Label>
                  <Input
                    value={details.reg_cert_no || ""}
                    onChange={e => setDetail("reg_cert_no", e.target.value.toUpperCase())}
                    placeholder="AA000000"
                    required
                    className="uppercase"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Şəxsi məlumatlar — with inline Axtar button */}
            <Card>
              <CardHeader><CardTitle>Şəxsi məlumatlarınızı daxil edin</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <PersonalInfoFields
                  details={details}
                  setDetail={setDetail}
                  customerPhone={customerPhone}
                  setCustomerPhone={setCustomerPhone}
                  customerEmail={customerEmail}
                  setCustomerEmail={setCustomerEmail}
                />
                {/* CHANGE: Axtar button stays in Avtonəqliyyat */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                    <span className="shrink-0 mt-0.5">⚠</span>
                    <span>FİN kodu və ya Ş/V nömrəsini daxil edərək mövcud müştərini axtara bilərsiniz. Məlumatlar avtomatik doldurulacaq.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button type="button" variant="outline" onClick={handleFinSearch} disabled={searchLoading}
                      className="bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 hover:border-blue-400">
                      {searchLoading ? "Axtarılır..." : "Axtar"}
                    </Button>
                    {searchMsg && (
                      <span className={`text-sm ${searchMsg.includes("tapıldı") && !searchMsg.includes("tapılmadı") ? "text-green-600" : "text-red-500"}`}>
                        {searchMsg}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sığorta şirkətləri */}
            <Card>
              <CardHeader><CardTitle>Sığorta şirkətləri</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {INSURANCE_COMPANIES.map(co => (
                    <button
                      key={co.key}
                      type="button"
                      onClick={() => setDetail("selected_company", co.key)}
                      className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors text-left
                        ${details.selected_company === co.key
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"}`}
                    >
                      {co.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            DAŞINMAZ ƏMLAK — no Axtar button
        ══════════════════════════════════════════════════════════════════════ */}
        {showFormSection && isDaşınmazEmlak && (
          <Card>
            <CardHeader><CardTitle>Şəxsi məlumatlarınızı daxil edin</CardTitle></CardHeader>
            <CardContent>
              <PersonalInfoFields
                details={details}
                setDetail={setDetail}
                customerPhone={customerPhone}
                setCustomerPhone={setCustomerPhone}
                customerEmail={customerEmail}
                setCustomerEmail={setCustomerEmail}
              />
            </CardContent>
          </Card>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            DƏİMMİS — no Axtar button
        ══════════════════════════════════════════════════════════════════════ */}
        {showFormSection && isDəimmis && (
          <Card>
            <CardHeader><CardTitle>Şəxsi məlumatlarınızı daxil edin</CardTitle></CardHeader>
            <CardContent>
              <PersonalInfoFields
                details={details}
                setDetail={setDetail}
                customerPhone={customerPhone}
                setCustomerPhone={setCustomerPhone}
                customerEmail={customerEmail}
                setCustomerEmail={setCustomerEmail}
              />
            </CardContent>
          </Card>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            YAŞIL KART — no Axtar button
        ══════════════════════════════════════════════════════════════════════ */}
        {showFormSection && isYaşılKart && (
          <Card>
            <CardHeader><CardTitle>Şəxsi məlumatlarınızı daxil edin</CardTitle></CardHeader>
            <CardContent>
              <PersonalInfoFields
                details={details}
                setDetail={setDetail}
                customerPhone={customerPhone}
                setCustomerPhone={setCustomerPhone}
                customerEmail={customerEmail}
                setCustomerEmail={setCustomerEmail}
              />
            </CardContent>
          </Card>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            KASKO — Könüllü kasko + bütün kasko məhsulları
        ══════════════════════════════════════════════════════════════════════ */}
        {showFormSection && isKasko && (
          <>
            {/* Polisin əsas məlumatları — CHANGE: "Şirkət" field removed */}
            <Card>
              <CardHeader><CardTitle>Polisin əsas məlumatları</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Şirkət Polisin nömrəsi" value={details.policy_number} onChange={v => setDetail("policy_number", v)} />
                <Field label="Sistem Polisin nömrəsi" value={details.system_policy_number} onChange={v => setDetail("system_policy_number", v)} />
                <div className="space-y-2">
                  <Label>Polisin statusu</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={details.policy_status || ""}
                    onChange={e => setDetail("policy_status", e.target.value)}
                  >
                    <option value="">Seçin</option>
                    <option value="pending">Buraxıldı</option>
                    <option value="expired">Qüvvədədir</option>
                    <option value="cancelled">Ödəniş gözləyir</option>
                  </select>
                </div>
                <Field label="Hazırlanma tarixi" type="date" value={details.issue_date} onChange={v => setDetail("issue_date", v)} />
                <Field label="Sığorta müddəti" value={details.policy_duration} onChange={v => setDetail("policy_duration", v)} placeholder="1-12 ay" />
                <Field label="Başlanma tarixi" type="date" value={details.start_date_kasko} onChange={v => setDetail("start_date_kasko", v)} />
                <Field label="Bitmə tarixi" type="date" value={details.end_date_kasko} onChange={v => setDetail("end_date_kasko", v)} />
              </CardContent>
            </Card>

            {/* Avtomobil haqqında məlumat — CHANGE: Axtar button moved after Qeydiyyat şəhadətnaməsi nömrəsi */}
            <Card>
              <CardHeader><CardTitle>Avtomobil haqqında məlumat</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dövlət qeydiyyat nişanı *</Label>
                  <Input
                    value={details.plate || ""}
                    onChange={e => setDetail("plate", e.target.value.toUpperCase())}
                    placeholder="90AA001"
                    required
                    className="uppercase flex-1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Qeydiyyat şəhadətnaməsi nömrəsi *</Label>
                  <div className="flex gap-2">
                    <Input
                      value={details.reg_cert_no || ""}
                      onChange={e => setDetail("reg_cert_no", e.target.value.toUpperCase())}
                      placeholder="AA000000"
                      required
                      className="uppercase flex-1"
                    />
                    <Button type="button" variant="outline" size="sm">Axtar</Button>
                  </div>
                </div>
                <BrandModelSelect
                  brand={details.brand || ""}
                  model={details.model || ""}
                  onBrandChange={v => setDetail("brand", v)}
                  onModelChange={v => setDetail("model", v)}
                />
                <div className="space-y-2">
                  <Label>Avtomobilin növü</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={details.vehicle_type || ""}
                    onChange={e => setDetail("vehicle_type", e.target.value)}
                  >
                    <option value="">Seçin</option>
                    <option value="sedan">Sedan</option>
                    <option value="sedan">Kabrio</option>
                    <option value="sedan">Van</option>
                    <option value="sedan">Furqon</option>
                    <option value="sedan">Rodster</option>
                    <option value="suv">SUV</option>
                    <option value="hatchback">Hatchback</option>
                    <option value="minivan">Minivan</option>
                    <option value="pickup">Pikap</option>
                    <option value="crossover">Crossover</option>
                    <option value="coupe">Kupe</option>
                    <option value="other">Minik</option>
                    <option value="other">Yük</option>
                    <option value="other">Qoşqu</option>
                    <option value="other">Motosikl</option>
                    <option value="other">Avtobus və Mikroavtobus</option>
                    <option value="other">Elektromobil</option>
                  </select>
                </div>
                <Field label="Ban nömrəsi" value={details.body_number} onChange={v => setDetail("body_number", v)} placeholder="VIN/Ban nömrəsi" />
                <Field label="Şassi nömrəsi" value={details.chassis_number} onChange={v => setDetail("chassis_number", v)} />
                <Field label="Mühərrik nömrəsi" value={details.engine_number} onChange={v => setDetail("engine_number", v)} />
                <Field label="İstehsal ili" type="number" value={details.year} onChange={v => setDetail("year", v)} placeholder="2020" />
                <div className="space-y-2">
                  <Label>İstifadənin məqsədi</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={details.usage_purpose || ""}
                    onChange={e => setDetail("usage_purpose", e.target.value)}
                  >
                    <option value="">Seçin</option>
                    <option value="personal">Şəxsi</option>
                    <option value="commercial">İşgüzar</option>
                    <option value="taxi">Taksi</option>
                    <option value="rental">İcarə</option>
                  </select>
                </div>
                <Field label="Mühərrik (sm³)" value={details.engine_volume} onChange={v => setDetail("engine_volume", v)} placeholder="1600" />
                <Field label="Tonaj" value={details.tonnage} onChange={v => setDetail("tonnage", v)} />
                <Field label="At gücü (hp)" type="number" value={details.horsepower} onChange={v => setDetail("horsepower", v)} />
                <Field label="Yer sayı" type="number" value={details.seat_count} onChange={v => setDetail("seat_count", v)} />
                <Field label="Avtomobilin bazar dəyəri (AZN)" type="number" value={details.car_market_value} onChange={v => setDetail("car_market_value", v)} />
                <Field label="Faktiki qət etdiyi məsafə (km)" type="number" value={details.mileage} onChange={v => setDetail("mileage", v)} />
              </CardContent>
            </Card>

            {/* Sığortalı — with inline Axtar button */}
            <Card>
              <CardHeader><CardTitle>Sığortalı</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center">
                      Ş/V Fin kodu *
                      <InfoTooltip imageSrc="https://www.kapitalbank.az/assets/static/img/fin_code_old_version.png" alt="FİN kodu nümunəsi" />
                    </Label>
                    <Input
                      value={details.fin || ""}
                      onChange={e => setDetail("fin", e.target.value.toUpperCase())}
                      placeholder="XXXXXXX"
                      className="uppercase"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center">
                      Ş/V nömrəsi *
                      <InfoTooltip imageSrc="https://tehsil.socar.az/img/nomresi.png" alt="Şəxsiyyət vəsiqəsi nömrəsi nümunəsi" />
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={details.id_card_no || ""}
                        onChange={e => setDetail("id_card_no", e.target.value.toUpperCase())}
                        placeholder="AAXXXXXXXX"
                        className="uppercase flex-1"
                        required
                      />
                      <Button type="button" variant="outline" size="sm" onClick={handleFinSearch} disabled={searchLoading}>
                        {searchLoading ? "..." : "Axtar"}
                      </Button>
                    </div>
                    {searchMsg && (
                      <span className={`text-xs ${searchMsg.includes("tapıldı") && !searchMsg.includes("tapılmadı") ? "text-green-600" : "text-red-500"}`}>
                        {searchMsg}
                      </span>
                    )}
                  </div>
                  <Field label="Sürücülük vəsiqəsinin seriya və nömrəsi" value={details.driving_license} onChange={v => setDetail("driving_license", v)} placeholder="AA000000" />
                  <Field label="Sürücülük stajı (il)" type="number" value={details.driving_experience} onChange={v => setDetail("driving_experience", v)} placeholder="0-5" />
                </div>

                {/* Sürücü məlumatı - dynamic list placeholder */}
                <div className="space-y-2">
                  <Label>Sürücü məlumatı</Label>
                   <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={details.usage_purpose || ""}
                    onChange={e => setDetail("usage_purpose", e.target.value)}
                  >
                    <option value="">Seçin</option>
                    <option value="personal">Sığortalı</option>
                    <option value="persona2">Bütün sürücülər</option>
                    <option value="persona3">Seçilmiş kategoriyalı sürücülər</option>
          
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Təminatlar */}
            <Card>
              <CardHeader><CardTitle>Təminatlar</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Sığorta məbləği (AZN)" type="number" value={details.insurance_amount} onChange={v => setDetail("insurance_amount", v)} />
                <Field label="Azadolma (franchise)" value={details.deductible} onChange={v => setDetail("deductible", v)} />
                <div className="space-y-2">
                  <Label>NV-nin təmir servisi</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={details.repair_service || ""}
                    onChange={e => setDetail("repair_service", e.target.value)}
                  >
                    <option value="">Seçin</option>
                    <option value="official">Rəsmi servis</option>
                    <option value="any">İstənilən servis</option>
                    <option value="insurer">Sığortaçının seçimi</option>
                  </select>
                </div>
                <Field label="Sığorta tarifi (%)" type="number" step="0.01" value={details.insurance_rate} onChange={v => setDetail("insurance_rate", v)} />
                <Field label="Sığorta haqqı (AZN)" type="number" value={details.premium_amount} onChange={v => setDetail("premium_amount", v)} />
                <Field label="Sığorta agenti" value={details.insurance_agent} onChange={v => setDetail("insurance_agent", v)} />
               <div className="space-y-2">
  <Label>Ödəniş forması</Label>

<div className="space-y-2">

  <div className="flex gap-2">
    {/* əsas select */}
   <div className="space-y-2">

  <div className="flex gap-2">
    {/* əsas select */}
    <select
      className={`h-10 rounded-md border border-input bg-background px-3 py-2 text-sm transition-all
        ${details.payment_method === "installment" ? "w-1/2" : "w-full"}`}
      value={details.payment_method || ""}
      onChange={e => {
        setDetail("payment_method", e.target.value);

        if (e.target.value !== "installment") {
          setDetail("installment_months", "");
        }
      }}
    >
      <option value="">Seçin</option>
      <option value="cash">Tam</option>
      <option value="card">Kart</option>
      <option value="transfer">Bank köçürməsi</option>
      <option value="installment">Hissə-hissə</option>
    </select>

    {/* ay input */}
    {details.payment_method === "installment" && (
      <Input
        type="number"
        min={1}
        max={12}
        placeholder="1-12 ay"
        className="w-1/2"
        value={details.installment_months || ""}
        onChange={e => {
          const value = Number(e.target.value);

          if (value >= 1 && value <= 12) {
            setDetail("installment_months", value);
          } else if (e.target.value === "") {
            setDetail("installment_months", "");
          }
        }}
      />
    )}
  </div>
</div>
  </div>
</div>

  
</div>
              </CardContent>
            </Card>

            {/* CHANGE: Əlavə qeydlər only in Kasko */}
            <Card>
              <CardHeader><CardTitle>Əlavə qeydlər</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Qeydlər</Label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Əlavə məlumat..."
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* ── Other sub-types — generic personal info form, no Axtar, no notes */}
        {showFormSection && !isAvtonəqliyyat && !isDaşınmazEmlak && !isDəimmis && !isYaşılKart && !isKasko && (
          <Card>
            <CardHeader>
              <CardTitle>Şəxsi məlumatlarınızı daxil edin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <PersonalInfoFields
                details={details}
                setDetail={setDetail}
                customerPhone={customerPhone}
                setCustomerPhone={setCustomerPhone}
                customerEmail={customerEmail}
                setCustomerEmail={setCustomerEmail}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Başlama tarixi</Label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Bitmə tarixi</Label>
                  <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Actions ── */}
        {showFormSection && (
          <div className="flex flex-col sm:flex-row gap-3 items-start">
            {previewPrice !== null && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-blue-900 font-semibold">
                Təxmini premium: {formatCurrency(previewPrice)}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">{error}</div>
        )}

        {showFormSection && (
          <div className="flex items-start gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
            <span className="shrink-0 mt-0.5">ℹ</span>
            <span>İrəli düyməsini sıxmaqla, siz bizə gedişatınızı yadda saxlamağa və məlumatlarınızın təhlükəsizliyini təmin etməyə kömək edirsiniz.</span>
          </div>
        )}

        <div className="flex gap-3">
          <Link href="/policies">
            <Button type="button" variant="outline"
              className="border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400">
              Əvvələ qayıt
            </Button>
          </Link>
          {showFormSection && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDetails({});
                  setCustomerName("");
                  setCustomerPhone("");
                  setCustomerEmail("");
                  setStartDate("");
                  setEndDate("");
                  setNotes("");
                  setPreviewPrice(null);
                  setError("");
                  setSearchMsg("");
                }}
                className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
              >
                Təmizlə
              </Button>
              <Button type="submit" disabled={loading}
                className="bg-primary text-white hover:bg-primary/90 disabled:opacity-60">
                {loading ? "Göndərilir..." : "İrəli"}
              </Button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}

// ── Field helper ──────────────────────────────────────────────────────────────
function Field({
  label, value, onChange, required, type = "text", placeholder, step,
}: {
  label: string; value: any; onChange: (v: string) => void; required?: boolean;
  type?: string; placeholder?: string; step?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type={type}
        value={value || ""}
        onChange={(e: any) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        step={step}
      />
    </div>
  );
}