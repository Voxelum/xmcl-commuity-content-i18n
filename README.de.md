# XMCL Community Content I18n Projekt

Dieses Repository enthält die i18n-Übersetzungen für Community-Inhalte wie Mods, Ressourcenpakete und Shader für XMCL.

[English README here](./README.en.md) [Русский README здесь](./README.ru.md) [Українська README тут](./README.uk.md) [Polskie README tutaj](./README.pl.md) [日本語 READMEはこちら](./README.ja.md) [Version française ici](./README.fr.md) [简体中文 README](./README.md)

## Warum brauchen wir dieses Repository?

Da viele Benutzer eher an lokalisierte Namen als an die englischen Originalnamen gewöhnt sind. Der Zweck dieses Repositories ist es, mehr Benutzern eine bessere Nutzung von XMCL zu ermöglichen und sogar eine Referenz für andere Entwickler zu bieten.

## Wie man beiträgt

Wir verwenden Git, um die Übersetzungen zu verwalten. Sie können dieses Repository forken und einen Pull Request einreichen, um Ihre Übersetzungen beizutragen.

### Wie füge ich eine Übersetzung für einen Mod/ein Ressourcenpaket/einen Shader hinzu?

Die Übersetzungsdaten für Mods, Ressourcenpakete und Shader-Pakete sind jeweils in `<locale>/mods.csv`, `<locale>/resourcepacks.csv` und `<locale>/shaderpacks.csv` gespeichert.

`<locale>` ist der Ländercode für die Sprache, die Sie übersetzen möchten. Beispielsweise ist `zh_cn` der Ländercode für Chinesisch.

Sie können eine neue Zeile in der entsprechenden Datei hinzufügen, um eine neue Übersetzung hinzuzufügen. Die Spalten werden durch Komma `,` getrennt.

Die Zeile sollte dem folgenden Format entsprechen:

```
<name>,<modrinthId>,<curseforgeId>,<description>
```

`name` ist der übersetzte lokale Name für den Mod/das Ressourcenpaket/das Shader-Paket. `description` ist die übersetzte Beschreibung für den Mod/das Ressourcenpaket/das Shader-Paket.

Diese beiden werden in XMCL angezeigt.

Wenn Sie die `modrinthId` oder `curseforgeId` nicht kennen, können Sie sie leer lassen, es muss jedoch mindestens eine der beiden IDs `modrinthId` oder `curseforgeId` angegeben werden.
