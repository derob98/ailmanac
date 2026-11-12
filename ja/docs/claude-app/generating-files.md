# 実ファイルの生成（docx/pptx/xlsx/pdf）

> Source: https://derob98.github.io/ailmanac/ja/docs/claude-app/generating-files · AILmanac (CC BY 4.0) · last verified 2026-10-20

Claude はサンドボックス内でコードを書いて実行し、完成した Word ドキュメント、デッキ、スプレッドシート、PDF を渡してくれます。指示書の書き方、30MB の上限、オンにしなければならないトグル、そしてモデルにコンピューターを与えることに伴うプロンプトインジェクションのリスクを解説します。

<LevelBadge level="beginner" />

<VerifyNote lastVerified="2026-10-20" source="https://support.claude.com/en/articles/12111783-create-and-edit-files-with-claude">
Anthropic のヘルプセンターによれば: *"Code execution and file creation is available to all Claude users (Free, Pro, Max, Team, and Enterprise) on the web, Claude Desktop, and Claude Mobile."* Claude は **.xlsx、.pptx、.docx、PDF** ファイルを作成でき、上限は**アップロードもダウンロードも 1 ファイルあたり 30MB** です。Free、Pro、Max では **Settings → Capabilities** で自分でオンにする必要があり、Team と Enterprise ではオーナーが組織設定で管理します。これらの管理項目は変わるので、ヘルプセンターで確認してください。
</VerifyNote>

画面上のテキストにとどまらず、Claude は**実際にダウンロードできるファイル**、つまり Word ドキュメント、PowerPoint のデッキ、Excel のスプレッドシート、PDF を、書式付きですぐ使える状態で作成できます。仕組みを知っておく価値があります。力とリスクの両方を説明するからです。Claude は**サンドボックス化された計算環境でコードを書いて実行**し、そのコードが生んだものを渡しています。

<Callout type="objectives" items={[
  "この機能をオンにし、どのサーフェスとプランで使えるかを知る",
  "3 回目ではなく 1 回目から使えるように、ファイルの指示書を書く",
  "生成ファイル、Claude Doc、ダッシュボードの中から正しく選ぶ",
  "30MB の上限の中に収め、ファイルの行き先を知る",
  "サンドボックスに伴うプロンプトインジェクションのリスクを理解し、それを抑える方法を知る"
]} />

## まずオンにする

<Steps items={[
  {title: "Free、Pro、Max — トグルを切り替える", body: "Settings → Capabilities を開き、\"Code execution and file creation\" をオンにします。Claude がスプレッドシートを作る代わりに説明ばかりしているなら、ほぼ確実にこれが原因です。"},
  {title: "Team と Enterprise — オーナーに依頼する", body: "この機能は組織設定で一元管理されています。個々のメンバーが自分で有効にすることはできません。"},
  {title: "サーフェスを確認する", body: "Web 版 Claude、Claude Desktop、Claude Mobile で動作します。Web とデスクトップだけではない数少ない作成機能の一つです。"}
]} />

## 依頼できるもの

- **Word（.docx）** — レポート、手紙、提案書、書式付きドキュメント。
- **PowerPoint（.pptx）** — アウトラインやメモからのスライドデッキ。
- **Excel（.xlsx）** — データ、数式、シンプルなモデルを含むスプレッドシート。
- **PDF** — 上記の印刷用バージョン。

完成したファイルは**ダウンロードするか、Google Drive に直接保存**できます。

## ファイル、Doc、ダッシュボード、どれにするか

人が選択を誤るのがここで、Claude Docs と Slides が[すべてのプランで一般提供](/docs/claude-app/one-claude-docs-and-slides)になってから、その区別はさらに鋭くなりました。

| 欲しいもの | 選ぶもの | 理由 |
| --- | --- | --- |
| 引き渡して、Claude 内では二度と触らない成果物 | **生成ファイル**（このページ） | 一度きりのダウンロード。URL も、共同編集者も、コメントもありません。 |
| 同僚も加わって変更が続くドキュメント | **Claude Doc または Slides** | URL、リアルタイム共同編集、コメントを備えた生きたアーティファクト。終わったらファイルにエクスポートします。 |
| データの変化に合わせて最新に保たれる数値 | **Claude Dashboard** | 各チャートはスナップショットではなくライブクエリに裏付けられます。[Dashboards と Motion](/docs/claude-app/dashboards-and-motion)を参照。 |

便利な目安: **来週もう一度ダウンロードし直すのが面倒だと思うなら、欲しかったのは Doc です。**

## 良いファイルを得る方法

<Steps items={[
  {title: "トピックではなく、成果物を説明する", body: "種類、対象読者、長さ、セクション、トーン。「価格に関するデッキ」では当て推量になりますが、「役員会向けの 6 枚のスライド、1 枚につきチャート 1 つ、箇条書きなし」なら編集できる下書きが得られます。"},
  {title: "コンテンツやソースを提供する", body: "メモを貼り付ける、データを添付する、アウトラインを渡す。あるいはまず Claude に内容を下書きさせ、それからファイルを依頼します。2 段階のほうが、混乱した 1 段階に勝ります。"},
  {title: "チャットで磨き、エクスポートは最後に", body: "完成した .pptx の中で直すより、会話の中で構成を直すほうがはるかに簡単です。アウトラインを繰り返し調整してから、ファイルを依頼します。"},
  {title: "計算されたすべての数値を検証する", body: "Claude が作ったスプレッドシートには、微妙に間違った数式が含まれていることがあり、自信ありげな合計は最も気づきにくいエラーです。重要なセルを抜き取りで確認しましょう。ハルシネーションを参照してください。"}
]} />

<PromptCard title="1 回で決まるだけの構造を持ったファイルの指示書">{`Turn these notes into a 6-slide investor update deck (.pptx).

Slides, in order: traction, revenue, roadmap, team, the ask, appendix.
Audience: existing seed investors, read on a laptop, not presented live.

Rules:
- One idea per slide. No slide gets more than 25 words of body text.
- Revenue slide: a single chart, monthly, last 12 months.
- Clean and minimal: one accent color, no stock imagery, no icons.
- Use only numbers from my notes. If a figure I need isn't there,
  leave the placeholder [TBD] and list what's missing at the end.

Notes:
[paste your notes here]`}</PromptCard>

最後のルールがあなたを救います。これがないと、欠けている数字はもっともらしいもので埋められます。あれば、欠落の一覧が得られます。確認していない、生成されたスプレッドシートの数値は決して出荷しないでください。[ハルシネーション](/docs/foundations/hallucinations)を参照してください。

## 知っておく価値のある制限

<Callout type="warning" items={[
  "1 ファイルあたり 30MB、双方向。アップロードするものにも、Claude が返すものにも当てはまる上限です。大きなデータセットは、投入前にサンプリング、集計、または分割する必要があります。",
  "サンドボックスで本物のコードを実行する。Claude には \"a sandboxed computing environment\"、つまりあなたのシステムから分離された隔離コンテナが与えられます。動く Excel の数式を可能にするのはこれであり、同時に攻撃対象面でもあります。",
  "ネットワークアクセスは設定であって、当たり前ではない。構成は、無効（プリインストールされたパッケージのみ）から、パッケージマネージャーのみ（Team と Enterprise のデフォルト）、特定の許可ドメイン、法的なブロックリストを除くすべてのドメインまで幅があります。どれを使っているかで、Claude が作業の途中で取得できるものが変わります。",
  "ここでの本当のリスクはプロンプトインジェクション。Anthropic 自身の警告: 悪意ある者が、外部のファイルや Web サイトを通じて目立たない形で指示を紛れ込ませ、Claude を騙して悪意あるコードを実行させたりデータを漏洩させたりすることが可能です。そのガイダンスは、この機能の使用中は Claude を監視し、予期しないデータに触れているのを見たら止めることです。"
]} />

実践的な習慣: **自分で書いていないファイルや URL は、信頼できない入力として扱う。** 一つのリクエストが外部ドキュメントを読む*うえに*ネットワークアクセスも持つ場合は、特に注意してください。隠された指示を流出に変える組み合わせです。同じ考え方を詳しく扱っているのが[プロンプトインジェクション](/docs/security/prompt-injection)と[サードパーティコードのレビュー](/docs/security/reviewing-third-party-code)です。

## 内部の仕組み

これらの機能は[スキル](/docs/claude-code/skills)で動いています。自分で作成できるのと同じ仕組みです。それを知っておくと二つの意味で役立ちます。モデルのリリースがなくてもファイル出力の品質が向上する理由を説明し、説明を繰り返しがちなハウススタイルを、毎回のプロンプトに貼り付ける代わりにスキルとして一度にまとめられることを意味します。

## クイズ

<Quiz questions={[
  {q: "Pro プランで Claude に .xlsx を依頼したところ、ファイルを作る代わりにスプレッドシートをテキストで説明してきました。最も可能性の高い原因は何ですか。", options: ["ファイル作成は Max、Team、Enterprise のみ", "Settings → Capabilities で \"Code execution and file creation\" がオフになっている", "スプレッドシートは Claude Desktop から依頼しなければならない", "会話が長すぎる"], answer: 1, explain: "ファイル作成は Free、Pro、Max、Team、Enterprise のすべてのプランで、Web、Desktop、Mobile で利用できますが、Free、Pro、Max では Settings → Capabilities で \"Code execution and file creation\" を自分で有効にする必要があります。Team と Enterprise ではオーナーが一元管理します。"},
  {q: "チームがこれから 3 週間共同で編集し続ける四半期レポートが必要です。何を依頼すべきですか。", options: ["生成された .docx。本来の成果物の形式だから", "Claude Doc を作り、最終版になったら .docx にエクスポートする", "Claude Dashboard", "PDF を作り、変更のたびに再生成する"], answer: 1, explain: "生成ファイルは URL も共同編集者もコメントもない、一度きりのダウンロードです。Claude Doc はリアルタイム共同編集のできる生きたアーティファクトで、内容が固まったら Word、PDF、Markdown、Google Docs にエクスポートできます。変更が終わったときにだけ、ファイルを選びます。"},
  {q: "ファイル作成で明示されているファイルサイズの上限はいくつですか。", options: ["1 ファイルあたり 10MB", "アップロードもダウンロードも 1 ファイルあたり 30MB", "1 会話あたり 100MB", "文書化された上限はない"], answer: 1, explain: "文書化されている最大値は 1 ファイルあたり 30MB で、双方向、つまりアップロードするものにも Claude が生成するものにも適用されます。大きな元データは、投入前にサンプリングか集計が必要です。"},
  {q: "ファイル作成中は Claude を監視するよう Anthropic が警告するのはなぜですか。", options: ["生成ファイルが警告なしに使用上限を超えることがあるから", "サンドボックスがローカルのファイルシステムにアクセスできるから", "外部のファイルや Web サイトに隠された指示が含まれ、Claude を騙して悪意あるコードを実行させたりデータを漏洩させたりしうるから", ".xlsx の数式が検証なしに生成されるから"], answer: 2, explain: "この機能は Claude に本物のコードを実行するサンドボックス環境を与えます。Anthropic は、悪意ある者が外部のファイルや Web サイトに目立たない形で指示を埋め込めると指摘しています。そのガイダンスは、実行を見守り、Claude が予期せずデータを使ったりアクセスしたりし始めたら止めることです。サンドボックスはあなた自身のシステムから隔離されています。リスクは注入された指示であり、ローカルのファイルシステムへのアクセスではありません。"}
]} />

<Callout type="takeaways" items={[
  "ファイル作成はすべてのプラン、すべてのサーフェス（Web、Desktop、Mobile）で使えるが、Free、Pro、Max のユーザーはまず Settings → Capabilities で有効にする必要がある。",
  "隔離されたサンドボックスでコードを書いて実行して動く。Excel の数式が実際に計算されるのはそのため、セキュリティのガイダンスがあるのもそのため。",
  "トピックではなく成果物を指示する: 種類、対象読者、長さ、構成、そして欠落は作り話で埋めずに報告するという明示的なルール。",
  "意図的に選ぶ: ファイルは一度きりのダウンロード、Claude Doc は生きたドキュメント、Dashboard はライブクエリ。選び間違えると作り直しになる。",
  "1 ファイルあたり 30MB、双方向。それより大きいものは投入前にサンプリングか集計する。",
  "外部のファイルや URL は信頼できない入力として扱い、実行を見守る。隠された指示が文書化されたリスクであり、ネットワークアクセスが広く開いているときが最悪。"
]} />

## 次へ

- [Claude Dashboards と Claude Motion](/docs/claude-app/dashboards-and-motion) — スナップショットではなくライブの数値が必要なとき
- [One Claude: 統合、Claude Docs、Claude Slides](/docs/claude-app/one-claude-docs-and-slides) — ダウンロードに代わる、生きたドキュメントという選択肢
- [アーティファクト: ライブで実行できる出力](/docs/claude-app/artifacts) — すべてがレンダリングされるパネル
- [ライティングとコンテンツ制作](/docs/playbooks/writing) · [ビジネス、マーケティング、戦略](/docs/playbooks/business)
