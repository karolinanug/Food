# Savaitės meniu

Patiekalų planavimo web appsas Lietuvos rinkai: savaitės planas, receptų biblioteka,
automatinis pirkinių sąrašas ir kainų palyginimas tarp **Barboros (Maxima), Rimi, IKI ir Lidl**.
Veikia naršyklėje ir telefone (PWA – galima įsidiegti į pradžios ekraną).

## Galimybės

- **Klausimynas** (pirmą kartą atidarius) – vardas, tikslai, šeimos dydis, dienos ir valgiai, mityba,
  alergijos, kalorijos, biudžetas, gaminimo laikas ir įgūdžiai, virtuvės įranga, mėgstamos virtuvės,
  parduotuvės ir ką turite namuose. Pagal atsakymus DI sugeneruoja savaitės receptus (tik iš produktų,
  kurių kainas žinome, ir be alergenų), o planas iškart sudedamas į kalendorių ir pirkinių sąrašą.
  Jei DI nepasiekiamas, planas sudaromas iš tinkamų bibliotekos receptų. Atsakymus galima pakeisti
  per ⚙ nustatymus.
- **Planas** – 7 dienos × pusryčiai / pietūs / vakarienė, porcijų skaičius kiekvienam patiekalui,
  „Užpildyti vakarienes“, savaitės kainos įvertis.
- **Receptai** – lietuviški receptai (cepelinai, šaltibarščiai, kugelis…) ir savi receptai;
  rikiavimas pagal porcijos kainą ar gaminimo laiką.
- **Namuose** – pažymite turimus produktus:
  - matote receptus, kuriuos galite pagaminti dabar arba kuriems trūksta 1–3 produktų (su jų kaina);
  - galite sugeneruoti **naują receptą su DI** – tik iš turimų produktų arba leidžiant papildomus;
  - turimi produktai nebeįtraukiami į pirkinių sąrašą.
- **Pirkiniai** – visų savaitės patiekalų ingredientai sujungiami, perskaičiuojami į pakuotes ir
  palyginami: kiek kainuotų viskas vienoje parduotuvėje ir koks yra pigiausias derinys.
  Sąrašą galima pažymėti, nukopijuoti ar pasidalinti.
- **Kainos** – produktų paieška ir filtrai, kiekvieno produkto kainos visose parduotuvėse,
  vieneto kaina (€/kg, €/l), akcijos.

Duomenys (planas, savi receptai, nustatymai) kol kas saugomi naršyklėje (`localStorage`).

## Paleidimas

```bash
npm install
npm run dev      # http://localhost:5173
npm test
npm run build
```

DI funkcijos veikia per serverio funkcijas `api/plan.ts` (savaitės planas) ir `api/recipe.ts`
(receptas iš turimų produktų), Vercel.
Lokaliai ją paleisite su `npx vercel dev`; reikia aplinkos kintamojo `ANTHROPIC_API_KEY`.
Diegiant į Vercel tą patį kintamąjį nustatykite projekto nustatymuose.

## Kainų duomenys

Kainas kasdien (~6:23 Lietuvos laiku) surenka GitHub Actions darbas `.github/workflows/prices.yml`:
`scripts/prices/update.ts` ieško kiekvieno katalogo produkto parduotuvėse, pagal taisykles
(`scripts/prices/matching.ts`) atrenka tinkamą prekę ir įrašo rezultatą į `public/prices.json`.
Pakeitimas įrašomas į repo, Vercel jį įdiegia, o appsas kainas įkelia paleidimo metu.

| Parduotuvė | Šaltinis | Kas surenkama |
|---|---|---|
| Rimi | rimi.lt e. parduotuvės paieška | visas asortimentas |
| Lidl | lidl.lt paieška | tik internete skelbiamos prekės (daugiausia akcijos) |
| Barbora (Maxima) | maxima.lt savaitės pasiūlymai | tik akcijos; barbora.lt blokuoja automatines užklausas |
| IKI | – | kol kas pavyzdinės kainos |

Parduotuvėms be duomenų rodomos pavyzdinės kainos su žyma „pvz.“. Jei parduotuvės svetainė
pasikeičia ir rinkiklis beveik nieko neranda, paliekami ankstesni duomenys.

Rankinis paleidimas: GitHub → Actions → „Kainų atnaujinimas“ → Run workflow, arba lokaliai
`npx tsx scripts/prices/update.ts --stores=rimi --products=bulves,pienas`.

Prekių parinkimą galima tikslinti `matching.ts`: `query` – paieškos frazė, `must` – žodžiai,
kurie turi būti pavadinime, `not` – žodžiai, dėl kurių prekė atmetama.

## Struktūra

```
api/plan.ts            savaitės plano generavimas pagal klausimyną (Claude API)
api/recipe.ts          recepto generavimas iš turimų produktų
api/_lib.ts            bendra DI logika
scripts/prices/        kainų rinkiklis (adapteriai, taisyklės, atnaujinimas)
public/prices.json     surinktos kainos
src/data/              produktai su kainomis, receptai, parduotuvės
src/lib/pricing.ts     pakuočių, krepšelio ir pigiausio derinio skaičiavimas
src/lib/diet.ts        mityba, alergijos, porcijos, plano dienos
src/components/Onboarding.tsx  klausimynas
src/views/             Planas, Receptai, Namuose, Pirkiniai, Kainos
src/components/        langai ir bendri komponentai
```
