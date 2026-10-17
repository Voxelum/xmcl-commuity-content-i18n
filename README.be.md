# Праект інтэрнацыяналізацыі кантэнту супольнасці XMCL

Гэты рэпазіторый змяшчае інтэрнацыяналізацыю (i18n) для кантэнту супольнасці, такога як моды, пакеты рэсурсаў, шэйдэры і модпакі для XMCL.

[English README](./README.en.md) [Українська README](./README.uk.md) [Русский README](./README.ru.md) [Deutsches README](./README.de.md) [Polskie README](./README.pl.md) [日本語 README](./README.ja.md) [Version française](./README.fr.md) [Italiano README](./README.it.md) [हिन्दी README](./README.hi.md) [Қазақша README](./README.kk.md) [简体中文 README](./README.md)

## Навошта патрэбны гэты рэпазіторый?

Шмат карыстальнікаў аддаюць перавагу лакалізаваным назвам і апісанням на роднай мове замест англійскіх арыгіналаў. Мэта гэтага праекта — палегчыць выкарыстанне XMCL для ўсіх.

## Як зрабіць свой унёсак

Мы выкарыстоўваем Git для кіравання перакладамі. Вы можаце зрабіць fork гэтага рэпазіторыя і адправіць Pull Request са сваімі перакладамі.

### Як дадаць пераклад для мода / пакета рэсурсаў / шэйдэра / модпака?

Пераклады захоўваюцца адпаведна ў `src/<locale>/mods.csv`, `src/<locale>/resourcepacks.csv`, `src/<locale>/shaderpacks.csv` і `src/<locale>/modpacks.csv`.

`<locale>` — гэта код лакалі для мовы (напрыклад, `be` для беларускай мовы).

Радкі маюць наступны фармат:

```
<name>,<modrinthId>,<curseforgeId>,<description>
```

`name` — лакалізаваная назва, а `description` — лакалізаванае апісанне. Гэтыя палі адлюстроўваюцца ў лаўнчары XMCL.
