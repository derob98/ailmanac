# Claude Code チートシート

> Source: https://derob98.github.io/ailmanac/ja/docs/claude-code/cheat-sheet · AILmanac (CC BY 4.0) · last verified 2026-10-13

Claude Code のフラグ、コマンド、ショートカット、権限モード、ファイルの場所を 1 ページにまとめた印刷用シート。すべての行を 2026-10-13 に公式ドキュメントと照合済み。

<LevelBadge level="all" />

<VerifyNote lastVerified="2026-10-13" source="https://code.claude.com/docs/en/cli-reference">
シートのすべての行は、このページ末尾の出典に挙げた公式の Claude Code ドキュメントと 2026-10-13 に照合しました。その日に確認できなかったものは省いています。フラグ、コマンド、ショートカットはリリースごとに変わり、ショートカットはプラットフォームやターミナルによっても異なります。シートと公式ドキュメントが食い違う場合は、公式ドキュメントが優先されます。
</VerifyNote>

日々最もよく手が伸びる Claude Code のフラグ、コマンド、ショートカット、ファイルの場所を 1 ページにまとめました。印刷する、ターミナルの隣に貼る、ダーク版を共有する、いずれも自由です。画像にあるものはすべて、以下にテキストとして繰り返してあるので、検索したり、コピーしたり、スクリーンリーダーで読んだりできます。

<Callout type="objectives" items={["リファレンスを開かずに、必要なフラグ、コマンド、ショートカットを見つける", "各権限モードが確認なしで何を実行するか、そして Plan Mode が何をブロックし何をブロックしないかを知る", "設定、指示、フックがそれぞれどのファイルに属するかを知る"]} />

![Claude Code チートシート: A4 横向き 1 ページ、3 列構成で、セッションの開始と再開、ヘッドレスなスクリプト実行、設定ファイル、セッション内コマンド、キーボードショートカット、チェックポイント、権限モード、Plan Mode、フック、メモリファイルを網羅。同じ内容を以下にテキストで掲載。](/cheatsheets/claude-code-cheat-sheet.png)

## ダウンロード

- [PDF をダウンロード](pathname:///ailmanac/cheatsheets/claude-code-cheat-sheet.pdf) — A4 横向き、1 ページ、選択可能なテキスト。A4 では 100% で印刷、US Letter では「ページに合わせる」で印刷してください。
- [PNG（ライト）をダウンロード](pathname:///ailmanac/cheatsheets/claude-code-cheat-sheet.png) — 幅 2400 px。
- [PNG（ダーク）をダウンロード](pathname:///ailmanac/cheatsheets/claude-code-cheat-sheet-dark.png) — 幅 2400 px、画面やスクリーンショット向け。
- [HTML ソースを開く](pathname:///ailmanac/cheatsheets/claude-code-cheat-sheet.html) — 自己完結型。アドレスに `?theme=dark` を付けるとダーク版になります。

このシートは [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) でライセンスされています。AILmanac のクレジットを付けて、共有、印刷、改変できます。

## テキスト版のシート

### セッションの開始と再開

| コマンドまたはフラグ | 動作 |
| --- | --- |
| `claude` | 対話セッションを開始する |
| `claude "query"` | 最初のプロンプト付きで開始する |
| `claude -c` | このディレクトリで直近の会話を続ける |
| `claude -r "<session>"` | ID または名前で再開する、または選ぶ |
| `claude -n "<name>"` | 後で再開できるようセッションに名前を付ける |
| `--fork-session` | `-c` または `-r` と併用: 新しいセッション ID |
| `claude -w <name>` | 分離された git worktree で作業する |
| `--model <alias\|name>` | モデルを設定する。例: `sonnet` |
| `--permission-mode <mode>` | 指定した権限モードで開始する |
| `claude --bg "<task>"` | バックグラウンドセッションを開始する。`claude agents` で監視する |

さらに詳しく: [claude CLI: 結果を変えるフラグ](/docs/claude-code/cli-flags)と [Git Worktree と並列ワークストリーム](/docs/claude-code/worktrees)。

### ヘッドレスとスクリプト実行

| コマンドまたはフラグ | 動作 |
| --- | --- |
| `claude -p "query"` | 一度実行し、答えを出力して終了する |
| `cat file \| claude -p "…"` | 標準入力で内容をパイプする（10MB 上限） |
| `--output-format <format>` | `text`（デフォルト）、`json`、`stream-json` |
| `--json-schema '<schema>'` | スキーマに対して検証された JSON |
| `--allowedTools "<rule>" …` | 確認なしで実行されるツール。例: `"Bash(git diff *)"` |
| `--max-turns <n>` | エージェントのターン数を制限する |
| `--max-budget-usd <n>` | 推定支出額で停止する |
| `--bare` | フック、スキル、プラグイン、MCP サーバー、自動メモリ、CLAUDE.md をスキップする |
| `claude -c -p "query"` | 直近の会話を続ける |

JSON 出力には `result`、`session_id`、`total_cost_usd` が含まれます。終了コード 0 は成功を意味します。

さらに詳しく: [ヘッドレスモードと Agent SDK](/docs/claude-code/headless-and-agent-sdk)。

### 設定ファイル

優先順位の高いものから順に並べています。二つが同じキーを設定した場合は、表の上にあるほうが勝ちます。

| ファイルまたはフラグ | スコープ |
| --- | --- |
| `managed-settings.json` | 管理: 組織によって設定される |
| `--settings <file-or-json>` | コマンドライン: このセッションのみ |
| `.claude/settings.local.json` | プロジェクトローカル: 自分だけ、git の管理外 |
| `.claude/settings.json` | 共有プロジェクト: チームのためにコミットする |
| `~/.claude/settings.json` | ユーザー: 自分、すべてのプロジェクトで |

`permissions.allow` のようなリスト型のキーはファイル間でマージされます。`/status` は読み込まれたファイルを表示し、`claude doctor` は無効なエントリを報告します。

| ファイル | 内容 |
| --- | --- |
| `.mcp.json` | プロジェクトスコープの MCP サーバー。`/mcp` で管理する |

さらに詳しく: [settings.json: 設定システム](/docs/claude-code/settings)と [Claude Code の MCP サーバー](/docs/claude-code/mcp)。

### セッション内コマンド

| コマンド | 動作 |
| --- | --- |
| `/init` | 出発点となる CLAUDE.md を生成する |
| `/clear` | コンテキストが空の新しい会話 |
| `/compact` | コンテキストを空けるため会話を要約する |
| `/context` | 現在のコンテキスト使用量を可視化する |
| `/resume` | 会話を再開する、またはピッカーを開く |
| `/branch` | この時点で会話を分岐させる |
| `/rewind` | コード、会話、またはその両方を巻き戻す |
| `/model` | モデルを切り替える。デフォルトとして保存される |
| `/plan` | プロンプトから plan モードに入る |
| `/permissions` | allow、ask、deny ルールを管理する |
| `/memory` | CLAUDE.md ファイルを編集し、自動メモリを切り替える |
| `/config` | 設定を開く、または `key=value` を直接設定する |
| `/usage` | セッションのコストとプランの使用上限 |
| `/diff` | 作業ツリーの変更をレビューする |
| `/btw` | 履歴に残らない補足質問 |
| `/code-review` | 現在の diff をバグの観点でレビューする |

さらに詳しく: [コンテキスト管理](/docs/claude-code/context-management)。

### キーボードと入力

| キー | 動作 |
| --- | --- |
| `Esc` | Claude を中断する。ここまでの作業は保持される |
| `Esc Esc` | 巻き戻しメニューを開く（空のプロンプトで） |
| `Shift+Tab` | 権限モードを切り替える |
| `Ctrl+C` | 中断する、またはアイドル時は入力をクリアする |
| `Ctrl+O` | トランスクリプトビューアを切り替える |
| `Ctrl+R` | コマンド履歴を逆方向に検索する |
| `Ctrl+B` | 実行中のコマンドをバックグラウンドにする |
| `Ctrl+G` | テキストエディタでプロンプトを編集する |
| `Ctrl+V` | クリップボードから画像を貼り付ける |
| `Ctrl+J` | 改行。どのターミナルでも |
| `!` | シェルモード: コマンドを直接実行する |
| `@` | ファイルパスをメンションする（オートコンプリート付き） |

### チェックポイントと巻き戻し

| 項目 | 詳細 |
| --- | --- |
| 作成 | ターンを開始するすべてのプロンプトで。直近 100 件が保持される |
| 復元 | コードと会話、またはどちらか一方だけ |
| 要約 | ここから、またはここまで。ファイルには触れない |
| 追跡されない | Bash によるファイルの変更、ほとんどのサブエージェントの編集、セッション外で行われた編集 |

さらに詳しく: [チェックポイントと巻き戻し](/docs/claude-code/checkpoints-and-rewind)。

### 権限モード

| モード | 確認なしで実行されるもの |
| --- | --- |
| `default` | 読み取りのみ。Manual と表示される |
| `acceptEdits` | 読み取り、ファイル編集、一般的なファイルシステムコマンド |
| `plan` | 読み取りに加えて、分類器が承認したコマンド |
| `auto` | すべて。バックグラウンドの安全チェック付き |
| `dontAsk` | 読み取りと事前承認されたツール。残りは拒否される |
| `bypassPermissions` | すべて。分離されたコンテナと VM のみで使う |

`Shift+Tab` は `default`、`acceptEdits`、`plan` を切り替え、有効なら続けて `bypassPermissions` と `auto` も切り替えます。拒否ルールはすべてのモードでブロックします。v2.1.283 から、対話的なターミナルセッションの組み込みの開始モードは `auto` です。変更するには `permissions.defaultMode` を設定します。

さらに詳しく: [権限とパーミッションモード](/docs/claude-code/permissions)。

### Plan モード

| 項目 | 詳細 |
| --- | --- |
| 許可 | 読み取り、探索のためのシェルコマンド、書かれた計画 |
| ブロック | 計画を承認するまで、ソースへの編集 |
| コマンド | 分類器がレビューする、または読み取り専用のセットの外なら確認が出る |
| 強制されない | bypass permissions が利用可能な対話的ターミナルセッション |

さらに詳しく: [Plan モード](/docs/claude-code/plan-mode)。

### フック

| イベントまたは項目 | 詳細 |
| --- | --- |
| 設定場所 | 設定ファイルの `hooks`。`/hooks` で一覧表示 |
| `SessionStart` | セッションが開始または再開する |
| `UserPromptSubmit` | プロンプトが送信される。処理の前 |
| `PreToolUse` | ツール呼び出しの実行前。ブロックできる |
| `PostToolUse` | ツール呼び出しが成功した後 |
| `Stop` | Claude が応答を終える |
| 入力 | 標準入力の JSON としてのイベントデータ |
| 終了コード | 0: 異議なし。2: イベントが許す場合にアクションをブロックする。stderr が理由 |

さらに詳しく: [フック: 決定論的な自動化](/docs/claude-code/hooks)。

### メモリと CLAUDE.md

| ファイルまたは構文 | 動作 |
| --- | --- |
| `./CLAUDE.md` | プロジェクトの指示。git で共有される |
| `./CLAUDE.local.md` | 個人的なプロジェクトメモ。`.gitignore` に追加する |
| `~/.claude/CLAUDE.md` | すべてのプロジェクトに適用される自分の好み |
| `.claude/rules/*.md` | トピック別のルール。必要に応じて `paths:` でスコープを絞る |
| `@path/to/file` | CLAUDE.md に取り込む。最大 4 階層の深さまで |
| `MEMORY.md` | Claude が書く自動メモリのインデックス。先頭 200 行または 25KB が読み込まれる |

さらに詳しく: [CLAUDE.md とメモリファイル](/docs/claude-code/claude-md)。

## 出典と参考資料

各セクションは、2026-10-13 に以下の公式ページと照合しました。

- [CLI reference](https://code.claude.com/docs/en/cli-reference) — セッションの開始と再開、ヘッドレスのフラグ
- [Run Claude Code programmatically](https://code.claude.com/docs/en/headless) — `-p`、出力形式、`--bare`、JSON 結果のフィールドと終了コード
- [Settings files and precedence](https://code.claude.com/docs/en/settings) — 5 つの設定ソース、その順序、リストのマージ
- [Explore the .claude directory](https://code.claude.com/docs/en/claude-directory) — `.mcp.json` とその他のファイルの場所
- [Commands](https://code.claude.com/docs/en/commands) — セッション内コマンド
- [Interactive mode](https://code.claude.com/docs/en/interactive-mode) — キーボードショートカットと入力のプレフィックス
- [Checkpointing](https://code.claude.com/docs/en/checkpointing) — チェックポイントが取り込むもの、巻き戻しメニュー、制限
- [Choose a permission mode](https://code.claude.com/docs/en/permission-modes) — 6 つのモード、`Shift+Tab` の切り替え、Plan モード
- [Hooks reference](https://code.claude.com/docs/en/hooks) と [Automate actions with hooks](https://code.claude.com/docs/en/hooks-guide) — イベント、場所、終了コード
- [How Claude remembers your project](https://code.claude.com/docs/en/memory) — CLAUDE.md の場所、ルール、取り込み、自動メモリ

## 次へ

- [claude CLI: 結果を変えるフラグ](/docs/claude-code/cli-flags) — シートにあるフラグの背後にある考え方
- [権限とパーミッションモード](/docs/claude-code/permissions) — モードを意図的に選ぶ
- [フック: 決定論的な自動化](/docs/claude-code/hooks) — 習慣を保証に変える
