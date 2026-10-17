# Progetto di internazionalizzazione dei contenuti della community XMCL

Questo repository contiene l'internazionalizzazione (i18n) per i contenuti della community come mod, pacchetti di risorse, pacchetti di shader e modpack per XMCL.

[English README](./README.en.md) [Українська README](./README.uk.md) [Русский README](./README.ru.md) [Deutsches README](./README.de.md) [Polskie README](./README.pl.md) [日本語 README](./README.ja.md) [Version française](./README.fr.md) [हिन्दी README](./README.hi.md) [Беларуская README](./README.be.md) [Қазақша README](./README.kk.md) [简体中文 README](./README.md)

## Perché questo repository?

Molti utenti preferiscono visualizzare nomi e descrizioni localizzati nella propria lingua madre anziché in inglese. Lo scopo di questo repository è consentire a un maggior numero di utenti di sfruttare al meglio XMCL.

## Come contribuire

Usiamo Git per gestire le traduzioni. Puoi creare un fork di questo repository e inviare una Pull Request con i tuoi contributi.

### Come aggiungere una traduzione per mod / resource pack / shaderpack / modpack?

I dati di traduzione sono archiviati rispettivamente in `src/<locale>/mods.csv`, `src/<locale>/resourcepacks.csv`, `src/<locale>/shaderpacks.csv` e `src/<locale>/modpacks.csv`.

`<locale>` è il codice della lingua che desideri tradurre (ad esempio `it` per l'italiano).

Le righe seguono il formato:

```
<name>,<modrinthId>,<curseforgeId>,<description>
```

`name` è il nome tradotto e `description` è la descrizione tradotta. Entrambi i campi verranno visualizzati in XMCL.
