// Kaip kiekvieną katalogo produktą rasti parduotuvėse: paieškos frazė, privalomi ir draudžiami žodžiai.
// Žodžiai lyginami be lietuviškų raidžių ir mažosiomis (žr. normalize), todėl rašome „bulv“, „sald“ ir pan.

export interface MatchRule {
  query: string;
  /** Pavadinime turi būti bent vienas iš kiekvienos grupės. */
  must: string[][];
  /** Pavadinime negali būti nė vieno iš šių. */
  not?: string[];
}

const PROCESSED = ["traskuc", "salot", "kose", "blyn", "cepelin", "sald", "konserv", "marinuot", "sultys", "uogien", "padaz", "sriub", "trauk", "milt", "dribsn", "pagard", "prieskon", "vaik", "kudik", "sausain", "ledai", "jogurt", "desert"];

function rule(query: string, must: (string | string[])[], not: string[] = []): MatchRule {
  return { query, must: must.map((m) => (Array.isArray(m) ? m : [m])), not };
}

const veg = (query: string, stem: string, extraNot: string[] = []) => rule(query, [stem], [...PROCESSED, ...extraNot]);

export const RULES: Record<string, MatchRule> = {
  // Daržovės ir vaisiai
  bulves: veg("bulvės", "bulv", ["batat", "krakmol", "fri", "kroket", "skilt", "lazdel"]),
  svogunai: veg("svogūnai", "svogun", ["laisk", "ziedai", "kepti", "pavasar"]),
  morkos: veg("morkos", "morkos", ["korej", "tarkuot"]),
  cesnakai: veg("česnakai", "cesnak", ["baton", "sviest", "milt", "granul", "malt", "dzio", "pasta", "aliej", "laisk"]),
  burokeliai: veg("burokėliai", "burokel", ["virt", "tarkuot", "lap"]),
  marinuoti_burokeliai: rule("tarkuoti burokėliai", ["burokel", ["marinuot", "tarkuot"]], ["sriub", "salot"]),
  kopustas: veg("baltagūžiai kopūstai", "kopust", ["juros", "raugint", "pekin", "zied", "brokol", "raudon", "briuse", "zieminis", "kaliaropes"]),
  agurkai: veg("agurkai", "agurk", ["raugint", "rauginti", "sudyt", "mazai", "korniso"]),
  pomidorai: veg("pomidorai", "pomidor", ["nulupt", "pilni", "dziov", "pasta", "trint", "smulkint", "kecup", "vysni", "cherry", "kokteil"]),
  krapai: veg("krapai", "krap", ["dziov", "sekl"]),
  laiskai: rule("svogūnų laiškai", ["laisk"], ["dziov", "sald"]),
  petrazoles: veg("petražolės", "petrazol", ["dziov", "sakn"]),
  pievagrybiai: veg("pievagrybiai", "pievagryb", ["sald", "pjaust", "kepti"]),
  obuoliai: veg("obuoliai", "obuol", ["dzio", "trapuc", "pyrag", "sultys", "acto"]),
  citrina: veg("citrinos", "citrin", ["zaliosios", "sult", "rugst", "pipir", "zole", "arbat", "vanden"]),
  paprikos: veg("paprikos", "paprik", ["silk", "file", "riesut", "malt", "rukyt", "dziov", "kepint", "trapuc", "lazdel"]),
  cukinijos: veg("cukinijos", "cukinij"),
  brokoliai: veg("brokoliai", "brokol", ["sald"]),
  spinatai: veg("špinatai", "spinat", ["sald"]),
  bananai: veg("bananai", "banan", ["dzio", "trapuc", "sokolad"]),
  imbieras: veg("imbieras", "imbier", ["malt", "marinuot", "arbat", "sultys", "dziov", "cukat", "sokolad"]),

  // Mėsa ir žuvis
  kiaulienos_farsas: rule("kiaulienos faršas", ["farsas", "kiaul"], ["jautien", "vistien", "kalakut", "kotlet", "virtin"]),
  mal_mesa: rule("kiaulienos ir jautienos faršas", ["farsas", "kiaul", "jautien"], ["kotlet", "virtin"]),
  jautienos_farsas: rule("jautienos faršas", ["farsas", "jautien"], ["kiaul", "kotlet", "virtin"]),
  sonine: rule("rūkyta šoninė", ["sonin"], ["sald", "trapuc"]),
  vist_file: rule("vištienos šlaunelių filė", ["vist", "slaunel"], ["marinat", "keps", "kepta", "virta", "sald", "rukyt", "marinuot"]),
  vist_blauzdeles: rule("vištienos blauzdelės", ["vist", "blauzdel"], ["marinat", "kept", "rukyt", "marinuot", "griliu"]),
  sonkauliai: rule("rūkyti šonkauliai", ["sonkaul", "rukyt"], ["jautien"]),
  karbonadas: rule("kiaulienos karbonadas", ["kiaul", "karbonad"], ["rukyt", "kept", "sald"]),
  vist_krutinele: rule("vištienos krūtinėlės filė", ["vist", "krutinel"], ["marinat", "keps", "kepta", "virta", "rukyt", "sald", "marinuot", "pjausny"]),
  kalakutienos_farsas: rule("kalakutienos faršas", ["kalakut", "farsas"]),
  menke: rule("menkės filė", ["menk", "file"], ["rukyt", "kepta", "dzio", "lazdel"]),
  kumpis: rule("virtas kumpis", ["kumpis"], ["rukyt", "vytint", "sald"]),
  desreles: rule("pieniškos dešrelės", ["desrel", "pienis"]),
  lasisa: rule("lašišos filė", ["lasis", "file"], ["s. r.", "s.r.", "sud", "padaz", "aliej", "rukyt", "sudyt", "konserv", "pastet", "dzio"]),
  silke: rule("silkės filė aliejuje", ["silk", "file"], ["rukyt", "patal", "salot", "pomidor", "garstyc"]),

  // Pieno produktai ir kiaušiniai
  grietine: rule("grietinė 30%", ["grietin"], ["misin", "augalin", "padaz", "kremas", "ledai", "sur"]),
  kefyras: rule("kefyras", ["kefyr"], ["vaisi", "brašk", "vysni", "kokteil"]),
  pienas: rule("pienas 2,5%", ["pienas"], ["kondens", "sausas", "kokos", "aviz", "migdol", "soj", "ryz", "sokolad", "kakav", "kokteil", "rugst", "vaik", "kudik", "be laktozes"]),
  varske: rule("varškė", ["varske"], ["grudet", "surel", "desert", "kremas", "pyrag", "glaistyt", "spurgos", "kepta", "apkep"]),
  kiausiniai: rule("vištų kiaušiniai", ["kiausin"], ["putpel", "sokolad", "virti", "makaron", "trynys", "baltym", "majonez", "salot"]),
  sviestas: rule("sviestas 82%", ["sviest"], ["augal", "mis", "zemes riesut", "sausain", "kakav", "sokolad", "glais", "lydyt"]),
  suris: rule("fermentinis sūris", ["suris", ["ferment", "gouda", "edam", "dziugas", "tilzit"]], ["lydyt", "tepam", "varske", "surel", "lazdel", "griliu", "kepam"]),
  jogurtas: rule("natūralus jogurtas", ["jogurt", "natural"], ["gerimas", "vaisi", "brašk"]),
  mocarela: rule("mocarela", ["mocarel"], ["tarkuot", "pica", "lazdel", "salot"]),
  aviziu_gerimas: rule("avižų gėrimas", ["aviz", "gerim"], ["sokolad", "kakav", "kava", "barist"]),

  // Duona
  juoda_duona: rule("ruginė duona", ["duona", "rugin"], ["traskuc", "dziuves", "skrebut", "kvietin"]),
  dziuvesiai: rule("džiūvėsėliai", ["dziuves"], ["razin", "arbatin", "sald", "vanil", "prieskon", "pagard"]),
  batonas: rule("batonas", ["batonas"], ["sokolad", "pilno grudo", "sald"]),
  tortilijos: rule("tortilijos", [["tortilij", "tortil", "paplotel"]], ["traskuc", "kukuruz", "sur"]),

  // Bakalėja
  grikiai: rule("grikių kruopos", ["grik"], ["dribsn", "milt", "makaron", "trapuc", "kose", "vaik", "arbat"]),
  ryziai: rule("ilgagrūdžiai ryžiai", ["ryziai"], ["trapuc", "pyrag", "milt", "dribsn", "sald", "vaik", "laukin", "rudi", "suši", "susi", "risot", "pudding"]),
  makaronai: rule("spagečiai", ["spagec"], ["sald", "be glitim", "padaz", "pilno grudo"]),
  smulkus_makaronai: rule("sriubos makaronai", ["makaron", ["smulk", "vermis", "zvaigzd", "raidel", "sriubai"]], ["paruost", "greito", "maggi", "skon"]),
  miltai: rule("kvietiniai miltai", ["milt", "kviet"], ["pilno grudo", "blyn", "mieli", "pyrag", "rug", "speltos"]),
  avizos: rule("avižiniai dribsniai", ["aviz", "dribsn"], ["sausain", "batonel", "kose", "greitai", "sokolad", "granol", "musli"]),
  zirniai: rule("skaldyti žirniai", ["zirn", ["skaldyt", "sausi", "geltoni"]], ["konserv", "zali", "sald", "avinz", "uzkand"]),
  pom_konservai: rule("smulkinti pomidorai", ["pomidor", ["smulkint", "pjaustyt", "gabaleli"]], ["kecup", "padaz", "pasta", "sriub", "dziov"]),
  krakmolas: rule("bulvių krakmolas", ["krakmol"], ["kukuruz"]),
  cukrus: rule("cukrus", ["cukrus"], ["rudas", "vanil", "pudra", "gabaleli", "nendr", "sirupas", "saldikl"]),
  medus: rule("medus", ["medus"], ["sausain", "pyrag", "garstyc", "arbat", "imbier"]),
  lesiai: rule("raudonieji lęšiai", ["lesiai"], ["konserv", "sriub", "makaron", "trapuc"]),
  avinzirniai: rule("konservuoti avinžirniai", ["avinzirn"], ["humus", "milt", "trapuc", "makaron"]),
  pupeles: rule("konservuotos raudonosios pupelės", ["pupel", "raudon"], ["pomidor", "padaz", "sriub"]),
  tofu: rule("tofu", ["tofu"], ["desrel", "uzkand", "pagamint"]),
  kokosu_pienas: rule("kokosų pienas", ["kokos", "pien"], ["sokolad", "gerim", "ledai", "milt", "drozl"]),
  kuskusas: rule("kuskusas", ["kuskus"], ["paruost", "salot", "greito"]),
  pom_pasta: rule("pomidorų pasta", ["pomidor", ["past", "koncentrat", "tyre"]], ["kecup", "padaz", "sriub", "dziov"]),
  makaronai_bg: rule("makaronai be glitimo", ["makaron", "be glitim"]),
  sojos_padazas: rule("sojų padažas", ["soj", "padaz"], ["teriyaki", "majonez"]),
  alyvuogiu_aliejus: rule("alyvuogių aliejus", ["alyvuog", "aliej"], ["mis", "purskiam", "konserv", "sardin", "tunas", "pomidor", "silk"]),

  // Prieskoniai ir aliejus
  druska: rule("druska", ["druska"], ["vonios", "jodo ne", "trapuc", "zemes riesut", "migdol", "karamel", "rinkinys", "malunel"]),
  pipirai: rule("malti juodieji pipirai", ["pipir", "juod"], ["zirneliai", "malunel", "mis", "spalvot", "citrin", "dresing", "padaz", "kumpis", "dešr"]),
  lauro: rule("lauro lapai", ["lauro"]),
  cinamonas: rule("maltas cinamonas", ["cinamon"], ["sausain", "bandel", "cukrus", "arbat", "dribsn", "lazdel", "sald"]),
  aliejus: rule("saulėgrąžų aliejus", ["saulegraz", "aliej"], ["seklos", "lukst", "sald", "chalv", "duona", "sardin", "silk", "tunas", "konserv"]),
  kario: rule("kario prieskoniai", ["kari"], ["padaz", "past", "sriub", "kariai", "kepsn", "makaron", "vistien"]),
  paprika_malta: rule("malta paprika", ["paprik", "malt"], ["trapuc", "traskuc", "riesut"]),
  raudonelis: rule("džiovintas raudonėlis", ["raudonel"], ["mis", "arbat", "aliej", "pica"]),
};

/** Visada atmetama: gyvūnų ir kūdikių maistas, paruošti patiekalai. */
const GLOBAL_NOT = ["skonio", "paruosiam", "pasar", "sunim", "suniu", "katem", "kaciu", "gyvun", "kudik", "tyrel", "men.)", "sefai", "paruost", "su padazu"];

/** Mažosios raidės, be diakritikų, vienas tarpas. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function titleMatches(title: string, r: MatchRule): boolean {
  const t = normalize(title);
  if (!r.must.every((group) => group.some((w) => t.includes(normalize(w))))) return false;
  if ([...(r.not ?? []), ...GLOBAL_NOT].some((w) => t.includes(normalize(w)))) return false;
  // „Varškės užtepėlė su česnakais“: produktas po „su“ yra tik priedas, ne pati prekė.
  const su = t.indexOf(" su ");
  if (su >= 0) {
    const first = Math.min(...r.must[0].map((w) => t.indexOf(normalize(w))).filter((i) => i >= 0));
    if (first > su) return false;
  }
  return true;
}
