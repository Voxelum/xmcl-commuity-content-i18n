# XMCL コミュニティコンテンツ国際化プロジェクト

このリポジトリは、XMCLのモッド、リソースパック、シェーダーなどのコミュニティコンテンツの国際化（i18n）翻訳を含んでいます。

[English READMEはこちら](./README.en.md) [Русский README здесь](./README.ru.md) [Українська README тут](./README.uk.md) [Deutsches README hier](./README.de.md) [Polskie README tutaj](./README.pl.md) [Version française ici](./README.fr.md) [简体中文 README](./README.md)

## なぜこのリポジトリが必要なのか？

多くのユーザーは英語の原文名よりも、ローカライズされた翻訳名を見ることに慣れているためです。このリポジトリの目的は、より多くのユーザーがXMCLをより快適に使用できるようにし、さらには他の開発者への参考資料を提供することです。

## 貢献方法

翻訳の管理にはGitを使用しています。このリポジトリをフォークし、プルリクエストを送信して翻訳に貢献することができます。

### モッド/リソースパック/シェーダーの翻訳を追加する方法

モッド、リソースパック、およびシェーダーパックの翻訳データは、それぞれ `<locale>/mods.csv`、`<locale>/resourcepacks.csv`、および `<locale>/shaderpacks.csv` ファイルに保存されています。

`<locale>` は翻訳したい言語のロケールコードです。たとえば、`zh_cn` は中国語のロケールコードです。

対応するファイルに新しい行を追加することで、新しい翻訳を追加できます。列はカンマ `,` で区切られます。

行は以下の形式に従う必要があります：

```
<name>,<modrinthId>,<curseforgeId>,<description>
```

`name` は、モッド/リソースパック/シェーダーパックのローカライズされた名前です。`description` は、モッド/リソースパック/シェーダーパックのローカライズされた説明です。

これら2つのフィールドはXMCLに表示されます。

`modrinthId` または `curseforgeId` がわからない場合は空のままにできますが、`modrinthId` または `curseforgeId` のうち少なくとも一方は提供する必要があります。
