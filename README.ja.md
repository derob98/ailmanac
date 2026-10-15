<div align="center">

# AILmanac

### 各ページを最後に確認した日付がわかる、Claude と AI ツールのフィールドガイド。

[English](./README.md) · [简体中文](./README.zh-CN.md) · [日本語](./README.ja.md) · [Español](./README.es.md) · [Italiano](./README.it.md)

**[日本語サイトを読む](https://derob98.github.io/ailmanac/ja/)**

</div>

---

**新しい調査：[Claude は Claude Code ドキュメントの 68% を一度も見たことがない](https://derob98.github.io/ailmanac/docs/whats-new/unread-manual)**（英語）。公式ドキュメントの 15 か月分の履歴を 1 週間ずつ再生しました。現在の内容の 3 分の 2 は、現行のすべての Claude モデルの学習データのカットオフである 2026 年 6 月より後に書かれたものです。プラグイン [`since-cutoff`](./plugins/since-cutoff) は、見逃した内容をセッションの開始時に Claude に伝えます。

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

これらのスキルが読み取るのは、このサイトの公開ページだけです。あなたのプロジェクトの内容が AILmanac に送信されることはありません。

## その他

最新の数値、最近追加されたページ、コントリビュートの方法、ライセンスについては[英語版 README](./README.md)をご覧ください。ガイドは 12 言語に翻訳されており、未翻訳のページは英語で表示されます。
