# Savaitės meniu

Patiekalų planavimo web appsas Lietuvos rinkai: savaitės planas, receptų biblioteka,
automatinis pirkinių sąrašas ir kainų palyginimas tarp **Barboros (Maxima), Rimi, IKI ir Lidl**.
Veikia naršyklėje ir telefone (PWA – galima įsidiegti į pradžios ekraną).

## Galimybės

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

DI receptų generavimas veikia per serverio funkciją `api/recipe.ts` (Vercel).
Lokaliai ją paleisite su `npx vercel dev`; reikia aplinkos kintamojo `ANTHROPIC_API_KEY`.
Diegiant į Vercel tą patį kintamąjį nustatykite projekto nustatymuose.

## Kainų duomenys

⚠️ Kainos faile `src/data/products.ts` yra **pavyzdinės**. Lietuvos prekybos tinklai viešo
kainų API neteikia, todėl tikriems duomenims reikės pasirinkti šaltinį:

1. **Oficialus bendradarbiavimas** su tinklais (Barbora, Rimi, IKI, Lidl) arba jų partnerių programos.
2. **Kainų agregatoriai** – licencijuoti duomenys iš esamų kainų palyginimo paslaugų.
3. **Savas duomenų rinkimas** iš e. parduotuvių. Prieš tai būtina patikrinti kiekvieno tinklo
   naudojimo sąlygas ir teisinius apribojimus.

Kad ir kokį šaltinį pasirinktumėte, jo rezultatas turi atitikti `Product` / `Offer` tipus
(`src/types.ts`), o kainų logika (`src/lib/pricing.ts`) liks nepakitusi.

## Struktūra

```
api/recipe.ts          DI recepto generavimas (Claude API)
src/data/              produktai su kainomis, receptai, parduotuvės
src/lib/pricing.ts     pakuočių, krepšelio ir pigiausio derinio skaičiavimas
src/views/             Planas, Receptai, Namuose, Pirkiniai, Kainos
src/components/        langai ir bendri komponentai
```
