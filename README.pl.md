# Projekt lokalizacji zawartości społeczności XMCL

To repozytorium zawiera lokalizację (i18n) dla zawartości społeczności, takiej jak modyfikacje, paczki zasobów i shadery dla XMCL.

[English README here](./README.en.md) [Русский README здесь](./README.ru.md) [Українська README тут](./README.uk.md) [Deutsches README hier](./README.de.md) [简体中文 README](./README.md)

## Dlaczego potrzebujemy tego repozytorium?

Ponieważ wielu użytkowników woli widzieć zlokalizowane nazwy zamiast oryginalnych nazw angielskich. Celem tego repozytorium jest umożliwienie większej liczbie użytkowników lepszego korzystania z XMCL, a także dostarczenie punktu odniesienia dla innych twórców.

## Jak pomóc w tłumaczeniu

Do zarządzania tłumaczeniami używamy systemu Git. Możesz forkować to repozytorium i przesłać Pull Request, aby dodać swoje tłumaczenia.

### Jak dodać tłumaczenie dla modyfikacji/paczki zasobów/shadera?

Dane tłumaczeń modyfikacji, paczek zasobów i shaderów są przechowywane odpowiednio w plikach `<locale>/mods.csv`, `<locale>/resourcepacks.csv` oraz `<locale>/shaderpacks.csv`.

`<locale>` to kod lokalizacji dla języka, na który chcesz tłumaczyć. Na przykład `zh_cn` to kod lokalizacji dla języka chińskiego.

Możesz dodać nowy wiersz w odpowiednim pliku, aby dodać nowe tłumaczenie. Kolumny są oddzielone przecinkami `,`.

Wiersz powinien mieć następujący format:

```
<name>,<modrinthId>,<curseforgeId>,<description>
```

`name` to zlokalizowana nazwa modyfikacji/paczki zasobów/shadera. `description` to zlokalizowany opis modyfikacji/paczki zasobów/shadera.

Te dwie wartości będą wyświetlane w XMCL.

Jeśli nie znasz `modrinthId` lub `curseforgeId`, możesz zostawić to pole puste, ale przynajmniej jeden z identyfikatorów `modrinthId` lub `curseforgeId` musi być podany.
