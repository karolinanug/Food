import type { Ingredient, MealId, Recipe } from "../types";

const SKONIS = "pagal skonį";

function r(
  id: string,
  name: string,
  minutes: number,
  meals: MealId[],
  tags: string[],
  ingredients: [string, number, string?][],
  steps: string[]
): Recipe {
  const ing: Ingredient[] = ingredients.map(([product, qty, note]) => ({ product, qty, ...(note ? { note } : {}) }));
  return { id, name, servings: 4, minutes, meals, tags, ingredients: ing, steps };
}

// Visi kiekiai – 4 porcijoms, produkto vienetais (g, ml arba vnt.).
export const RECIPES: Recipe[] = [
  r("cepelinai", "Cepelinai su mėsa", 120, ["pietus", "vakariene"], ["tradicinis"], [
    ["bulves", 2500], ["kiaulienos_farsas", 500], ["svogunai", 200], ["sonine", 200],
    ["grietine", 400], ["krakmolas", 30], ["druska", 10, SKONIS], ["pipirai", 2, SKONIS],
  ], [
    "Trečdalį bulvių išvirkite su lupenomis, likusias nulupkite ir smulkiai sutarkuokite.",
    "Tarkius gerai nuspauskite, nusistovėjusį krakmolą įmaišykite atgal, sudėkite sugrūstas virtas bulves, pasūdykite.",
    "Faršą sumaišykite su puse smulkintų svogūnų, druska ir pipirais.",
    "Iš bulvių masės formuokite papločius, dėkite įdarą, suformuokite cepelinus.",
    "Virkite pasūdytame verdančiame vandenyje apie 25 min.",
    "Padažui pakepinkite šoninę su likusiais svogūnais, įmaišykite grietinę.",
  ]),
  r("saltibarsciai", "Šaltibarščiai su karštomis bulvėmis", 25, ["pietus", "vakariene"], ["tradicinis", "vasarai", "vegetariškas"], [
    ["marinuoti_burokeliai", 500], ["kefyras", 1000], ["agurkai", 300], ["kiausiniai", 4],
    ["krapai", 1], ["laiskai", 1], ["bulves", 1000], ["druska", 5, SKONIS],
  ], [
    "Kiaušinius išvirkite kietai, bulves išvirkite.",
    "Agurkus supjaustykite šiaudeliais, smulkiai sukapokite krapus ir laiškus.",
    "Kefyrą sumaišykite su burokėliais, agurkais ir žalumynais, pasūdykite, atvėsinkite.",
    "Patiekite su puselėmis kiaušinių ir karštomis bulvėmis.",
  ]),
  r("kugelis", "Kugelis", 90, ["pietus", "vakariene"], ["tradicinis"], [
    ["bulves", 2000], ["sonine", 250], ["svogunai", 200], ["kiausiniai", 2],
    ["pienas", 200], ["grietine", 200], ["druska", 8, SKONIS], ["pipirai", 2, SKONIS],
  ], [
    "Šoninę ir svogūnus supjaustykite, apkepinkite.",
    "Bulves sutarkuokite, nupilkite dalį skysčio, užpilkite karštu pienu.",
    "Įmuškite kiaušinius, sudėkite šoninę su svogūnais, pasūdykite, išmaišykite.",
    "Kepkite riebalais išteptoje formoje 180 °C apie 1 val. Patiekite su grietine.",
  ]),
  r("balandeliai", "Balandėliai", 100, ["pietus", "vakariene"], ["tradicinis"], [
    ["kopustas", 1500], ["mal_mesa", 600], ["ryziai", 150], ["svogunai", 100], ["morkos", 150],
    ["pom_konservai", 400], ["grietine", 200], ["druska", 6, SKONIS], ["pipirai", 2, SKONIS],
  ], [
    "Kopūsto gūžę pavirkite, kol lapai suminkštės, atskirkite lapus.",
    "Ryžius pusiau išvirkite, sumaišykite su faršu, smulkintu svogūnu, druska ir pipirais.",
    "Į lapus suvyniokite įdarą, sudėkite į puodą ant tarkuotų morkų.",
    "Užpilkite pomidorais su stikline vandens, troškinkite apie 50 min. Patiekite su grietine.",
  ]),
  r("bulviniai_blynai", "Bulviniai blynai", 45, ["pietus", "vakariene"], ["tradicinis", "vegetariškas"], [
    ["bulves", 1500], ["kiausiniai", 2], ["miltai", 60], ["svogunai", 100],
    ["grietine", 200], ["aliejus", 60], ["druska", 6, SKONIS],
  ], [
    "Bulves ir svogūną smulkiai sutarkuokite, nupilkite skystį.",
    "Įmuškite kiaušinius, įberkite miltų ir druskos, išmaišykite.",
    "Kepkite karštame aliejuje iš abiejų pusių, kol gražiai paruduos. Patiekite su grietine.",
  ]),
  r("varsketukai", "Varškėtukai", 30, ["pusryciai"], ["vegetariškas", "greitas"], [
    ["varske", 500], ["kiausiniai", 2], ["miltai", 100], ["cukrus", 30], ["grietine", 200], ["sviestas", 30],
  ], [
    "Varškę sutrinkite su kiaušiniais ir cukrumi, įmaišykite miltus.",
    "Miltuotomis rankomis formuokite paplotėlius.",
    "Kepkite svieste ant vidutinės ugnies po 3–4 min. iš abiejų pusių. Patiekite su grietine.",
  ]),
  r("grikiai_vistiena", "Grikiai su vištiena ir grybais", 40, ["pietus", "vakariene"], ["greitas"], [
    ["grikiai", 300], ["vist_file", 600], ["pievagrybiai", 400], ["svogunai", 100], ["morkos", 100],
    ["aliejus", 30], ["druska", 5, SKONIS], ["pipirai", 1, SKONIS],
  ], [
    "Grikius išvirkite pasūdytame vandenyje.",
    "Vištieną supjaustykite gabalėliais ir apkepkite aliejuje.",
    "Sudėkite svogūną, tarkuotą morką ir grybus, troškinkite 10 min.",
    "Sumaišykite su grikiais, pagardinkite druska ir pipirais.",
  ]),
  r("barsciai", "Raudonieji barščiai", 60, ["pietus"], ["sriuba", "vegetariškas"], [
    ["burokeliai", 600], ["bulves", 500], ["morkos", 100], ["svogunai", 100], ["kopustas", 300],
    ["grietine", 200], ["krapai", 1], ["lauro", 1, SKONIS], ["druska", 8, SKONIS],
  ], [
    "Bulves supjaustykite kubeliais ir virkite 2 l vandens su lauro lapais.",
    "Sudėkite tarkuotus burokėlius, morkas, smulkintus svogūnus ir kopūstus.",
    "Virkite 25 min., pasūdykite. Patiekite su grietine ir krapais.",
  ]),
  r("zirniu_sriuba", "Žirnių sriuba su rūkytais šonkauliais", 90, ["pietus"], ["sriuba"], [
    ["zirniai", 300], ["sonkauliai", 500], ["bulves", 500], ["morkos", 100], ["svogunai", 100],
    ["lauro", 1, SKONIS], ["druska", 6, SKONIS], ["pipirai", 1, SKONIS],
  ], [
    "Žirnius išmirkykite per naktį.",
    "Šonkaulius užpilkite 2,5 l vandens, sudėkite žirnius ir virkite 45 min.",
    "Sudėkite bulves, morkas, svogūną ir lauro lapus, virkite dar 25 min.",
    "Pagardinkite druska ir pipirais.",
  ]),
  r("vistienos_sriuba", "Vištienos sriuba su makaronais", 70, ["pietus"], ["sriuba"], [
    ["vist_blauzdeles", 800], ["morkos", 200], ["svogunai", 100], ["smulkus_makaronai", 150],
    ["petrazoles", 1], ["druska", 8, SKONIS],
  ], [
    "Vištieną užpilkite 2,5 l vandens, užvirinkite, nugriebkite putas.",
    "Sudėkite svogūną ir morkas, virkite 40 min.",
    "Išimkite mėsą, atskirkite nuo kaulų, grąžinkite į sultinį.",
    "Suberkite makaronus, virkite 7 min., pagardinkite petražolėmis.",
  ]),
  r("lasisa_bulves", "Orkaitėje kepta lašiša su bulvėmis", 40, ["vakariene"], ["žuvis"], [
    ["lasisa", 600], ["bulves", 1000], ["citrina", 1], ["krapai", 1],
    ["aliejus", 30], ["druska", 5, SKONIS], ["pipirai", 1, SKONIS],
  ], [
    "Bulves supjaustykite skiltelėmis, sumaišykite su aliejumi ir druska, kepkite 200 °C 20 min.",
    "Lašišą pagardinkite druska, pipirais ir citrinos sultimis.",
    "Sudėkite žuvį ant bulvių ir kepkite dar 15 min. Pabarstykite krapais.",
  ]),
  r("makaronai_mesa", "Spagečiai su malta jautiena", 30, ["pietus", "vakariene"], ["greitas"], [
    ["makaronai", 400], ["jautienos_farsas", 500], ["pom_konservai", 400], ["svogunai", 100],
    ["cesnakai", 10], ["suris", 100], ["aliejus", 20], ["druska", 5, SKONIS],
  ], [
    "Makaronus išvirkite pagal pakuotės nurodymus.",
    "Aliejuje pakepinkite svogūną ir česnaką, sudėkite faršą ir apkepkite.",
    "Supilkite pomidorus, troškinkite 15 min., pasūdykite.",
    "Patiekite su makaronais ir tarkuotu sūriu.",
  ]),
  r("aviziu_kose", "Avižinė košė su obuoliais", 15, ["pusryciai"], ["vegetariškas", "greitas"], [
    ["avizos", 200], ["pienas", 800], ["obuoliai", 300], ["sviestas", 20], ["cinamonas", 2, SKONIS], ["medus", 40],
  ], [
    "Užvirinkite pieną, suberkite dribsnius ir virkite 5 min. maišydami.",
    "Įmaišykite sviestą, sudėkite tarkuotus obuolius ir cinamoną.",
    "Patiekite su medumi.",
  ]),
  r("kiausiniene", "Kiaušinienė su pomidorais ir rugine duona", 15, ["pusryciai"], ["vegetariškas", "greitas"], [
    ["kiausiniai", 8], ["pomidorai", 300], ["laiskai", 1], ["sviestas", 20], ["juoda_duona", 300], ["druska", 3, SKONIS],
  ], [
    "Svieste pakepinkite pomidorų skilteles.",
    "Įmuškite kiaušinius, pasūdykite, kepkite iki norimo kietumo.",
    "Pabarstykite laiškais, patiekite su rugine duona.",
  ]),
  r("silke_bulves", "Silkė su karštomis bulvėmis", 35, ["pietus", "vakariene"], ["tradicinis", "žuvis", "greitas"], [
    ["silke", 400], ["bulves", 1000], ["svogunai", 150], ["krapai", 1], ["grietine", 200],
  ], [
    "Išvirkite bulves.",
    "Silkę supjaustykite gabalėliais, apdėkite svogūnų žiedais.",
    "Patiekite su karštomis bulvėmis, grietine ir krapais.",
  ]),
  r("karbonadai", "Kiaulienos karbonadai su kopūstų salotomis", 50, ["pietus", "vakariene"], [], [
    ["karbonadas", 600], ["kiausiniai", 1], ["dziuvesiai", 100], ["miltai", 40], ["aliejus", 60],
    ["bulves", 1000], ["kopustas", 500], ["morkos", 150], ["druska", 6, SKONIS], ["pipirai", 1, SKONIS],
  ], [
    "Mėsą supjaustykite griežinėliais, išmuškite, pagardinkite druska ir pipirais.",
    "Apvoliokite miltuose, plaktame kiaušinyje ir džiūvėsėliuose, kepkite aliejuje.",
    "Kopūstą ir morką supjaustykite šiaudeliais, pasūdykite, patrinkite rankomis.",
    "Patiekite su virtomis bulvėmis.",
  ]),
];
