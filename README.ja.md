<div align="center">

# AILmanac

### 各ページを最後に確認した日付がわかる、Claude と AI ツールのフィールドガイド。

[English](./README.md) · [简体中文](./README.zh-CN.md) · [日本語](./README.ja.md) · [Español](./README.es.md) · [Italiano](./README.it.md)

**[日本語サイトを読む](https://derob98.github.io/ailmanac/ja/)**

</div>

---

AI ツールは毎週のように変わりますが、ほとんどのガイドはいつ書かれたものかを示していません。AILmanac は、**Claude**(各アプリ、**Claude Code**、**API**)と、その周辺にあるモデルやエージェントを扱う、無料でオープンなガイドです。すべてのページにレベルが付き、平易な言葉で書かれ、情報源と照らし合わせて確認した日付が記載されています。

> [!NOTE]
> AILmanac は独立したプロジェクトです。Anthropic との提携関係はなく、Anthropic による後援や承認も受けていません。「Claude」と「Anthropic」は Anthropic の商標です。AILmanac と[公式ドキュメント](https://docs.anthropic.com)の内容が食い違う場合は、公式ドキュメントが正しいものとします。

## Claude Code の中で使う

2 つのコマンドで、このガイドをプラグインとして Claude Code に追加できます。

```bash
claude plugin marketplace add derob98/ailmanac --sparse .claude-plugin plugins
claude plugin install ailmanac@ailmanac
```

その後は、どのセッションでも次のことができます。

- **質問する**:Claude、Claude Code、API、MCP について尋ねると、`ailmanac` スキルが記憶に頼らずガイドを検索し、該当ページと確認日を添えて回答します。
- **`/ailmanac:claude-md-check` を実行する**:`CLAUDE.md` の内容を、それが説明しているリポジトリや、メモリファイルの読み込まれ方と照らし合わせ、具体的な修正案を示します。
- **役割別の 7 つのスキルパック**が必要に応じて読み込まれます:開発、リサーチ、データ分析、ライティング、マーケティング、学習、日常の生産性。

これらのスキルが読み取るのは、このサイトとこのリポジトリの公開ページだけです。あなたのプロジェクトの内容が AILmanac に送信されることはありません。

## その他

最新の数値、最近追加されたページ、コントリビュートの方法、ライセンスについては[英語版 README](./README.md)をご覧ください。ガイドは 12 言語に翻訳されており、未翻訳のページは英語で表示されます。
