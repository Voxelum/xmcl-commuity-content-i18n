# XMCL 社区内容国际化项目

本仓库包含 XMCL 社区内容（如模组、资源包和光影包）的国际化翻译。

[English README is here](./README.en.md)

## 如何贡献

我们使用 Git 来管理翻译。你可以 fork 这个仓库并提交 Pull Request 来贡献你的翻译。

### 如何为模组/资源包/光影包添加翻译？

模组、资源包和光影包的翻译数据分别存储在 `<locale>/mods.csv`、`<locale>/resourcepacks.csv` 和 `<locale>/shaderpacks.csv` 文件中。

`<locale>` 是你想要翻译的语言的区域代码。例如，`en_us` 是美式英语的区域代码。

你可以在相应的文件中添加新行来添加新的翻译。列之间用 `,` 分隔。

行应遵循以下格式：

```
<name>,<modrinthId>,<curseforgeId>,<description>
```

`name` 是模组/资源包/光影包的本地化名称。`description` 是模组/资源包/光影包的本地化描述。

这两个字段将在 XMCL 中显示。

如果你不知道 `modrinthId` 或 `curseforgeId`，可以将其留空，但必须提供 `modrinthId` 或 `curseforgeId` 中的至少一个。
