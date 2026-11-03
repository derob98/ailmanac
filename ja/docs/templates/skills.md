# スキルパックと SKILL.md テンプレート

> Source: https://derob98.github.io/ailmanac/ja/docs/templates/skills · AILmanac (CC BY 4.0) · last verified 2026-07-20

ユーザー種別ごとのすぐ使える Agent Skills、加えて自作の方法。

<LevelBadge level="all" />

<VerifyNote lastVerified="2026-07-20" source="https://code.claude.com/docs/en/skills">
スキルファイルのレイアウトや、スキルを使える場所（Claude Code、Claude.ai、Cowork、クラウドセッション）は変化します。詳細は公式の Skills ドキュメントで確認してください。カスタムコマンドはスキルに統合されました。`.claude/commands/` 配下のファイルも引き続き動作しますが、推奨される形式はスキルです。
</VerifyNote>

**スキル** は、あなたのリクエストに合致したときに*オンデマンド*で読み込まれる、的を絞った専門知識を Claude に与えるものです — おかげで毎回ニーズを説明し直す必要がなくなります。AILmanac は、ユーザーの種類ごとに 1 つずつ、**すぐ使えるスキルパック**のセットを同梱しています。コンセプトを深く学ぶには [Skills](/docs/claude-code/skills) のページを参照してください。

## 既製のパック

これらはリポジトリの
[`plugins/ailmanac/skills`](https://github.com/derob98/ailmanac/tree/main/plugins/ailmanac/skills) フォルダにあります:

| パック | 対象 | 何をするか |
|---|---|---|
| `ailmanac` | Claude やその他の AI ツールについて質問するすべての人 | このガイドから答えを探し、検証日付きでページを引用する |
| `claude-md-check` | Claude Code ユーザー | `CLAUDE.md` をリポジトリの内容と、メモリファイルの読み込まれ方に照らして確認する |
| `writing-content-pro` | ライター、マーケター、クリエイター | ブリーフ → 段階を踏んで下書き → あなたの声に合わせる → 再利用 |
| `developer-workflow` | 開発者 | コンテキストを最優先したコーディング、レビュー、テスト、明確なコミット |
| `research-analyst` | リサーチャー、アナリスト | 引用の規律を伴う、出典に基づいた統合 |
| `data-analyst` | データ・スプレッドシートのユーザー | SQL/数式 + 平易な言葉での読み解き + 統計の妥当性チェック |
| `business-marketing` | 創業者、中小企業オーナー | ポジショニング、コピー、顧客コミュニケーション、軽めの計画立案 |
| `student-learning` | 学生・学習者 | ソクラテス式の指導 + 教え返し（ただ写すのではなく学ぶ） |
| `everyday-productivity` | すべての人 | メール、要約、計画、意思決定 |

それぞれが共通の流儀を織り込んでいます: **コンテキストを与え、反復し、重要なことは検証する。**

## インストールする（Claude Code）

すべてをまとめて、プラグインとして:

```bash
claude plugin marketplace add derob98/ailmanac --sparse .claude-plugin plugins
claude plugin install ailmanac@ailmanac
```

または、リポジトリのクローンから 1 つのパックだけをコピーします:

```bash
# personal — available in all your projects
mkdir -p ~/.claude/skills && cp -r plugins/ailmanac/skills/writing-content-pro ~/.claude/skills/

# or per-project — shareable with your team via the repo
mkdir -p .claude/skills && cp -r plugins/ailmanac/skills/writing-content-pro .claude/skills/
```

Claude は、リクエストがスキルの `description` に合致すると、そのスキルを自動的に有効化します。Claude.ai / Cowork では、スキルを作成してパックの `SKILL.md` を貼り付けてください（利用可否はプランによって異なります）。

## 自作する — 最小テンプレート

スキルとは、`SKILL.md` を含むフォルダのことです。YAML フロントマター + 指示で構成されます。`description` が**トリガー**です — 「Use when…」の形で書いてください。必須なのは `description` だけで、コマンド名はフォルダ名から決まります。

```markdown
---
description: Use when the user is doing X — be specific about the trigger so Claude knows when to load this and when not to.
---

# My Skill

Short statement of the role/goal.

## Workflow
1. Step one…
2. Step two…

## Rules
- The non-negotiables (accuracy, privacy, output format).

## Default output
What a good response looks like.
```

### 妥当性チェックリスト

- [ ] フォルダ名がケバブケースになっている — それが `/command-name` になる。
- [ ] `description` が、それが何であるかだけでなく、**いつ使うか**（トリガー）を述べている。主要なユースケースを先頭に置く（`description` と `when_to_use` を合わせた文字列は、スキル一覧で 1,536 文字に切り詰められる）。
- [ ] 指示が具体的で範囲が限定されている — 明確な 1 つの仕事に絞られている。
- [ ] シークレット、認証情報、個人・顧客データが含まれていない。
- [ ] 不確実性の扱い方を明記している（捏造しない。検証する）。

## 関連

- [Skills: オンデマンドの専門知識](/docs/claude-code/skills) — 全体のコンセプト
- [カスタムスラッシュコマンド](/docs/claude-code/slash-commands) — これらはオンデマンドで自分で起動するもの
- [サブエージェント](/docs/claude-code/subagents) — 作業のまとまり全体を委任する


## 次へ

- [MCP 設定とサーバーのひな形](/docs/templates/mcp-config)
