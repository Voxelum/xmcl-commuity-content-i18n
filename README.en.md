# XMCL Community Content I18n Project

This repo contains the i18n for community content like mods, resource packs, and shaders for XMCL.

## How to contribute

We just use git to manage the translations. You can fork this repo and submit a pull request to contribute your translations.

### How to add a translation for a mod/resource pack/shader?

The mods/resource packs/shader packs translation data are stored in `<locale>/mods.csv`, `<locale>/resourcepacks.csv`, and `<locale>/shaderpacks.csv` respectively.

The `<locale>` is the locale code for the language you want to translate. For example, `zh_cn` is the locale code for Chinese.

You can add a new row to the corresponding file to add a new translation. The columns are separated by `,`. 

The row should follow the format below:

```
<name>,<modrinthId>,<curseforgeId>,<description>
```

The `name` is the translated local name for the mod/resource pack/shader pack. The `description` is the translated description for the mod/resource pack/shader pack.

These two will be displayed in the XMCL.

If you don't know the `modrinthId` or `curseforgeId`, you can leave it empty, but either `modrinthId` or `curseforgeId` should be provided.

