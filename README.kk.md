# XMCL қоғамдастық мазмұнын халықаралықтандыру (i18n) жобасы

Бұл репозиторийде XMCL үшін модылар, ресурс бумалары, шейдерлер және модпактар сияқты қоғамдастық мазмұнының локализациясы (i18n) бар.

[English README](./README.en.md) [Українська README](./README.uk.md) [Русский README](./README.ru.md) [Deutsches README](./README.de.md) [Polskie README](./README.pl.md) [日本語 README](./README.ja.md) [Version française](./README.fr.md) [Italiano README](./README.it.md) [Беларуская README](./README.be.md) [हिन्दी README](./README.hi.md) [简体中文 README](./README.md)

## Неліктен бұл репозиторий қажет?

Көптеген пайдаланушылар ағылшын тіліндегі атаулардың орнына өз ана тіліндегі локализацияланған атаулар мен сипаттамаларды көргенді жөн көреді. Жобаның мақсаты — XMCL пайдалануын барынша ыңғайлы ету.

## Үлес қосу жолы

Біз аудармаларды басқару үшін Git жүйесін қолданамыз. Сіз бұл репозиторийді fork жасап, өз аудармаларыңызды қосу үшін Pull Request жібере аласыз.

### Мод / ресурс бумасы / шейдер / модпак үшін аударманы қалай қосуға болады?

Аударма деректері `src/<locale>/mods.csv`, `src/<locale>/resourcepacks.csv`, `src/<locale>/shaderpacks.csv` және `src/<locale>/modpacks.csv` файлдарында сақталады.

`<locale>` — бұл сіз аударғыңыз келетін тіл коды (мысалы, қазақ тілі үшін `kk`).

Жол пішімі:

```
<name>,<modrinthId>,<curseforgeId>,<description>
```

`name` — аударылған атауы, ал `description` — аударылған сипаттамасы. Бұл өрістер XMCL лаунчерінде көрсетіледі.
