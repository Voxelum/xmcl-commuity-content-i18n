# Projet de localisation du contenu de la communauté XMCL

Ce dépôt contient les traductions d'internationalisation (i18n) pour le contenu de la communauté tel que les mods, les packs de ressources et les shaders pour XMCL.

[English README here](./README.en.md) [Русский README здесь](./README.ru.md) [Українська README тут](./README.uk.md) [Deutsches README hier](./README.de.md) [Polskie README tutaj](./README.pl.md) [日本語 READMEはこちら](./README.ja.md) [简体中文 README](./README.md)

## Pourquoi avons-nous besoin de ce dépôt ?

Parce que de nombreux utilisateurs sont plus habitués à voir des noms localisés plutôt que les noms originaux en anglais. Le but de ce dépôt est de permettre à davantage d'utilisateurs de mieux utiliser XMCL, et même de fournir une référence pour d'autres développeurs.

## Comment contribuer

Nous utilisons simplement git pour gérer les traductions. Vous pouvez forker ce dépôt et soumettre une pull request pour contribuer à vos traductions.

### Comment ajouter une traduction pour un mod/pack de ressources/shader ?

Les données de traduction des mods, des packs de ressources et des shaders sont stockées respectivement dans les fichiers `<locale>/mods.csv`, `<locale>/resourcepacks.csv` et `<locale>/shaderpacks.csv`.

Le `<locale>` est le code de langue pour la langue que vous souhaitez traduire. Par exemple, `zh_cn` est le code de langue pour le chinois.

Vous pouvez ajouter une nouvelle ligne dans le fichier correspondant pour ajouter une nouvelle traduction. Les colonnes sont séparées par une virgule `,`.

La ligne doit suivre le format ci-dessous :

```
<name>,<modrinthId>,<curseforgeId>,<description>
```

Le `name` est le nom localisé traduit pour le mod/pack de ressources/shader. La `description` est la description localisée traduite pour le mod/pack de ressources/shader.

Ces deux éléments seront affichés dans XMCL.

Si vous ne connaissez pas le `modrinthId` ou le `curseforgeId`, vous pouvez le laisser vide, mais au moins un des identifiants `modrinthId` ou `curseforgeId` doit être fourni.
