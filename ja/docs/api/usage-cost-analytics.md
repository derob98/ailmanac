# Usage & Cost Analytics API: 1 ドルずつ帰属させる

> Source: https://derob98.github.io/ailmanac/ja/docs/api/usage-cost-analytics · AILmanac (CC BY 4.0) · last verified 2026-11-02

Claude の Usage and Cost Analytics API の実践ガイド — 従来の usage_report と cost_report エンドポイントに置き換わったベータ版。行の形、5 次元の制限、actor の意味論、100 倍になるセントの落とし穴、素朴なダッシュボードを壊すデータ鮮度のルール、従来版からの移行表。

<LevelBadge level="advanced" />

<Callout type="objectives" items={[
  "usage_report と cost_report に何が取って代わったのか、そして新しい形が時間バケットではなく行である理由",
  "行の契約: starting_at / ending_at、group、usage または cost — そして、グループ化しない限りディメンションが null になる理由",
  "group_by[] は 5 つのディメンションを取る — ただし cost エンドポイントの 2 つは数に含まれず、limit にも従わない",
  "actor モデル: ユーザー、サービスアカウント、フェデレーテッドなクラウド ID、または API キー自体 — そして api_key_ids[] と actor_ids[] が異なる問いに答える理由",
  "セントの落とし穴: amount は「セント」単位の 10 進数文字列で、\"41280.000000\" は $412.80 であり、素朴なダッシュボードは 100 倍間違える",
  "当日のダッシュボードを無効にするデータ鮮度のルールと、呼び出し間で結果が変わらないようにするコツ",
  "ユーザーごとの Claude Code コストを求める 1 行のレシピ",
]} />

<VerifyNote lastVerified="2026-11-02" source="https://platform.claude.com/docs/en/manage-claude/usage-cost-analytics-api">
Usage and Cost Analytics API は**ベータ**です: すべてのリクエストで `anthropic-beta: analytics-usage-cost-2026-08-24` と `anthropic-version` ヘッダーを送ります。Anthropic は従来の Usage and Cost API と Claude Enterprise Analytics エンドポイントを **2026 年 10 月 29 日にレガシー**としました — 引き続きサポートされており、削除はされていません。エンドポイントのパス、ディメンション名、制限、セント単位の `amount` 形式は、公式ガイドと [usage](https://platform.claude.com/docs/en/api/beta/organization/analytics/usage/list) および [cost](https://platform.claude.com/docs/en/api/beta/organization/analytics/cost/list) の API リファレンスに基づきます。料金そのものは[最新のモデルと料金](/docs/whats-new/models-and-pricing)にあります。
</VerifyNote>

2 つのエンドポイントで、1 つの仕事: Claude の支出が実際にどこへ行ったかを教えます。

- `GET /v1/organizations/analytics/usage` — トークン数とリクエスト数。
- `GET /v1/organizations/analytics/cost` — USD でのコスト。

Claude Console 組織では、Console の **Usage** と **Cost** ページが表示する内容とほぼ同じで、彼らが選んだディメンションの代わりに自分で選んだディメンションが使えます。重要な理由は、Console からは誰も答えられない問いです: *上がった行の原因は、どの顧客、エージェント、API キーなのか?*

:::tip[これはレポーティングであり、強制ではありません]
ここにあるものは請求を止めません。それには [Hard Spend Caps](/docs/models/hard-spend-caps) を参照してください — 両者は補完関係にあります。上限は支出が発生する*かどうか*を決め、この API は*誰が*それを引き起こしたかを教えます。
:::

## 組織の種類別の認証情報

| 組織 | 使うもの |
| --- | --- |
| Claude Console | [Admin API キー](https://platform.claude.com/docs/en/manage-claude/admin-api-keys)、または `org:admin` スコープ付きの OAuth ベアラートークン(`x-api-key` ではなく `authorization: Bearer` として送信) |
| Claude Enterprise | `read:analytics` スコープ付きのキー。組織で Analytics API が有効になった**後**に、claude.ai でプライマリオーナーが作成 |

コレクターサービスには専用のキーを与え、シークレットマネージャーに保管し、[キーの有効期限](https://platform.claude.com/docs/en/manage-claude/authentication#key-expiration)を設定して、ローテーションを記憶頼みではなく強制にしてください。利用できる場合は、`org:admin` を持つ Workload Identity Federation ルールの方が確実に優れています — 短命のトークンで、漏えいし得る長命のシークレットがありません。[Admin API](/docs/api/admin-api) 全般と同じ考え方です。

## クイックスタート

<PromptCard title="モデル別の日次トークン使用量、1 週間分">{`curl --globoff "https://api.anthropic.com/v1/organizations/analytics/usage?\\
starting_at=2026-09-01T00:00:00Z&\\
ending_at=2026-09-08T00:00:00Z&\\
time_bucket_width=1d&\\
group_by[]=model&\\
limit=100" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "anthropic-beta: analytics-usage-cost-2026-08-24" \\
  -H "x-api-key: $ANTHROPIC_API_KEY"`}</PromptCard>

`--globoff` は重要です: これがないと、curl は `group_by[]` の `[]` を glob の範囲として解釈しようとします。

## 行の契約

従来のエンドポイントから移行する人がつまずくのがここです。レスポンスの形は意図的に異なっています。

<Steps items={[
  {title: "すべての行は 3 つの部分でできている", body: "starting_at と ending_at は行が対象とする期間を示し、group はすべてのディメンションを保持し、usage(cost エンドポイントでは cost)はメトリクスを保持します。ディメンションとメトリクスは別々のオブジェクトにあります — 従来のレポートのように横並びではありません。"},
  {title: "グループ化しない限りディメンションは null", body: "group には常にすべてのディメンションが含まれますが、group_by[] に現れない限り、それぞれ null になります。グループ化したディメンションも、その値を持たない行では null になります — たとえばコード実行の使用量は model: null です。group_by[] は最大 5 つのディメンションを取ります。"},
  {title: "データがある組み合わせごとに 1 行", body: "各行はグループ化したディメンションの 1 つの組み合わせであり、使用量またはコストのあるすべての組み合わせは、1 回のクエリのページ全体を通してちょうど 1 回だけ現れます。何もない組み合わせは行を生成しません。group_by[] も time_bucket_width もなければ、範囲全体を合計した 1 行が返ります。"},
  {title: "時間バケットはオプトイン", body: "time_bucket_width を 1m、1h、1d のいずれかに設定すると、各組み合わせが UTC バケットごとに分割されます。その場合、各行の starting_at と ending_at がそのバケットの境界になります。デフォルトはありません — 範囲全体の合計が欲しければ省略します。空のバケットは行を生成しません。"},
  {title: "行は時系列順ではなくランク順", body: "デフォルトでは、行は範囲全体にわたる order_by メトリクスの大きい順で返ります(order=asc で逆順)。時系列にするには、time_bucket_width と order_by=time の両方を設定します: すると行はバケットごとに、デフォルトでは新しい順に届き、各バケット内では大きい行が先になります。空のバケットは自分でゼロ埋めします。"},
  {title: "フィルターはグルーピングと独立", body: "グループ化できるほとんどのディメンションには、対応するブラケット記法のリストフィルターがあります(例: models[]=claude-opus-5-5)。複数の値にはパラメータを繰り返し、1 つのフィルターにつき最大 100 個まで指定できます。1 つのフィルター内の複数の値は OR、異なるフィルター同士は AND です。グループ化せずにディメンションでフィルターすることも、その逆もできます。"},
]} />

usage エンドポイントの `order_by` は、`total_tokens`(デフォルト)、`output_tokens`、`uncached_input_tokens`、`requests`、`time` を受け付けます。cost エンドポイントでは `amount`(デフォルト)、`list_amount`、`time` です。

:::warning[ランク順がデフォルトなのは、ダッシュボードのサイレントバグ]
範囲をリクエストして、届いた順に行をプロットすると、大きさ順に並んだ棒グラフができあがり、それが時系列*に見えてしまいます*。行が時系列順になるのは、`time_bucket_width` と `order_by=time` の**両方**を設定したときだけです。
:::

### すべてのディメンションがあなたに当てはまるわけではない

`model` と `actor` はすべての組織に当てはまります。`api_key_id` は Console 専用です。`slack_channel_id` は Enterprise 専用です。当てはまらないディメンションはすべての行で `null` になり、そのフィルターは**何もマッチしません**(エラーも出ません)。唯一の例外は `rbac_group_id` で、組織でチームが利用できない場合はエラーを返します。

そして、壁に貼っておく価値のある挙動の変更があります: 従来の API では、未知の API キーやワークスペース ID はエラーを返していました。ここでは、スペルミスした `models[]` の値も含めて**何もマッチしません**。空の結果が、タイプミスに対する通常のレスポンスになったのです。

## Actor: 誰に課金されるか

`actor` ディメンションは、リクエストが誰に帰属するかを示します — ユーザー、サービスアカウント、フェデレーテッドなクラウド ID(クラウドプラットフォーム経由で Claude に到達する組織の AWS または Google Cloud プリンシパル)、あるいはそれらのいずれも背後にない場合は**API キー自体**です。`actor` でグループ化すると、各行の `actor` はオブジェクトになり、その `type` が種類を示します。どの ID にも帰属できない使用量は `actor: null` です。

マッピングのルール:

- **個人キーとサービスアカウントキー**は、リンクされているユーザーまたはサービスアカウントとして動作します: ID は `actor` に、キーは `api_key_id` に表示されます。
- **レガシーのワークスペースキー**は ID にリンクされていないため、キーは `actor` と `api_key_id` の**両方**に現れます。
- **サインイン時に Claude Code がメンバーのために作成するキー**は Claude Code ワークスペースに存在し、その使用量はそのメンバーに帰属します。
- **API キーがまったくないリクエスト** — Console から、API キーなしでサインインした後の Claude Code から、または Workload Identity Federation トークンを使ったもの — は `api_key_id: null` になります。`actor` は依然としてサインインしたメンバー、またはフェデレーテッドなワークロードの場合はそのサービスアカウントです。

:::tip[2 つのフィルター、2 つの異なる問い]
`api_key_ids[]=apikey_…` は、誰に帰属するかにかかわらず、**そのキーが認証したすべてのリクエスト**にマッチします。`actor_ids[]=apikey_…` は、**キー自体に帰属するリクエスト**だけにマッチします。両者は交換できず、混同すると監査の結果が足りなくなります。`api_key_ids[]` フィルターにキーなしの使用量も含めるには、**空のエントリ**を追加します: `api_key_ids[]=`。
:::

## cost エンドポイントと 100 倍の落とし穴

cost エンドポイントは、`/usage` と同じフィルター、ディメンション、時間バケットを取ります。各行の `cost` オブジェクトには次が含まれます:

| フィールド | 意味 |
| --- | --- |
| `amount` | 割引後で、クレジット適用**前**のコスト |
| `list_amount` | 定価でのコスト |
| `currency` | 常に `"USD"` |
| `requests` | リクエスト数 |

:::warning[amount はドルではなく「セント」単位]
`currency` は `"USD"` と言っていますが、数値は**小数点以下 6 桁のセント**単位の 10 進数文字列です。`"41280.000000"` は $41,280 ではなく **$412.80** です。従来のコストレポートは `"123.45"` のようなドル相当の文字列を返していましたが、同じ値がここでは `"12345.000000"` になります。何かを表示する前に 100 で割り、テストを書いてください — フィールド名が `amount` で、通貨フィールドがドルと言っているために、コードレビューをすり抜ける 100 倍のエラーです。
:::

2 つのディメンションは cost エンドポイント**だけ**に存在し、どちらも通常のルールをあなたに有利な形で破ります: `group_by[]=cost_type` は各行をコストの種類ごとに分割し、`group_by[]=token_type` はトークンコストをトークンの種類ごとに分割します。どちらも 5 ディメンションの制限に数えられず、どちらも `limit` に従いません — そのため、1 ページが `limit` より**多くの**行を正当に含むことがあります。

<PromptCard title="お金の行き先: 1 か月分のモデル別、コスト種別、トークン種別のコスト">{`curl --globoff "https://api.anthropic.com/v1/organizations/analytics/cost?\\
starting_at=2026-09-01T00:00:00Z&\\
ending_at=2026-10-01T00:00:00Z&\\
group_by[]=model&\\
group_by[]=cost_type&\\
group_by[]=token_type" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "anthropic-beta: analytics-usage-cost-2026-08-24" \\
  -H "x-api-key: $ANTHROPIC_API_KEY"`}</PromptCard>

この 1 つのクエリは、どの組織でも最初に実行する価値があります。多くのチームが推測で済ませている問いに答えるからです: **請求のうち、推論ではない部分はどれだけか。** `cost_type` で分割するとトークン支出とサーバー側ツールが分かれ、`token_type` で分割するとキャッシュ読み取りと非キャッシュ入力、出力が分かれます。入力の行でキャッシュ読み取りが支配的なら、次に見るのは[プロンプトキャッシュ](/docs/api/prompt-caching)と[キャッシュ診断](/docs/api/cache-diagnostics)です。出力トークンが支配的なら、[トークン使用量を削減する](/docs/power-user/token-economy)です。

<PromptCard title="ユーザーごとの Claude Code コストを 1 つのクエリで">{`curl --globoff "https://api.anthropic.com/v1/organizations/analytics/cost?\\
starting_at=2026-10-01T00:00:00Z&\\
ending_at=2026-11-01T00:00:00Z&\\
products[]=claude_code&\\
group_by[]=actor" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "anthropic-beta: analytics-usage-cost-2026-08-24" \\
  -H "x-api-key: $ANTHROPIC_API_KEY"`}</PromptCard>

Console 組織には、この目的のためのもう 1 つの選択肢があります — 専用の [Claude Code Analytics API](https://platform.claude.com/docs/en/manage-claude/claude-code-analytics-api) で、ユーザーごとの Claude Code アクティビティを推定コストとともに報告します。

## 日付範囲と、誰も予想しない丸め

- タイムスタンプは UTC オフセット付きの RFC 3339(`2026-09-01T00:00:00Z`)です。**`starting_at` は含み、`ending_at` は含みません。**
- `starting_at` は **2026 年 1 月 1 日以降**で、かつ**過去 365 日以内**でなければなりません。
- 1 回のリクエストが対象とするのは**最大 31 日**です。`ending_at` のデフォルトは `starting_at` の 31 日後か現在のうち早い方です。それより長い範囲は複数のリクエストに分割してください。
- `time_bucket_width` を設定する場合、`ending_at` は**必須**で、`time_bucket_width=1m` では期間は**最大 24 時間**です。
- **両端とも*切り捨て*られます** — バケットの境界へ、`time_bucket_width` が未設定のときは時間単位へ。`1h` バケットでは、`starting_at=2026-09-01T10:43:00Z` は `10:00:00Z` に、`ending_at=2026-09-01T15:43:00Z` は `15:00:00Z` になるため、レスポンスは 10:00–15:00 UTC を対象とします。素朴に書いた「直近 90 分」のクエリは 1 時間分を返します。

## ダッシュボードを壊すのはデータの鮮度

すべてのレスポンスには `data_refreshed_at` タイムスタンプが付きます。それ以降の使用量は**欠けているか、部分的**です。範囲のどの部分にもまだデータが存在しない場合、`data_refreshed_at` は `null` で `data` は空です。

| プロパティ | 値 |
| --- | --- |
| 典型的な更新の遅れ | 元の使用量から **4 時間**以内 |
| 最悪の場合 | 最大 **24 時間** |
| 改訂ウィンドウ | 遅れて届くイベントや照合により、**暦月の終了から約 7 日後**まで値が変わることがある |
| ページネーション | 1 つのページ分割クエリのすべてのページが**同じスナップショット**を読むため、`data_refreshed_at` はページ間で同一 |

実際には、10 月 1 日の数値は 11 月 7 日頃まで変わり得ます。

これは、データが通常 **5 分以内**に現れていた従来の API からの実質的な後退であり、構築できるものを変えます。そこから 2 つのルールが直接導かれます:

- **呼び出し間で結果が変わらないようにする**には、すでに見た `data_refreshed_at` 以前に `ending_at` を設定します。
- **確定した合計**が必要なら、終了から少なくとも **7 日**経った月だけをクエリします。

:::warning[これを使ってリアルタイムのアラートを作らないでください]
4〜24 時間遅れるコスト急増アラートはアラートではありません。この API は帰属、チャージバック、トレンドのレポートに使ってください。数分で反応が必要な部分には[支出上限](/docs/models/hard-spend-caps)を、ほぼリアルタイムのリクエスト単位の可視性には [OpenTelemetry トレーシング](/docs/api/opentelemetry-tracing)を使います — ただしトレースはベストエフォートかつ at-least-once なので、台帳はトレースではなく Analytics API であることを忘れないでください。
:::

## `usage_report` と `cost_report` からの移行

引き継がれるもの: Admin API キー、`anthropic-version` ヘッダー、`starting_at` / `ending_at`、バケット幅の値(`1m`、`1h`、`1d`)、ブラケット記法、ページネーションのフィールド名、トークンとコストのフィールド名。変わるもの:

| 従来の Usage & Cost API | Usage & Cost Analytics API |
| --- | --- |
| ベータヘッダーなし | すべてのリクエストに `anthropic-beta: analytics-usage-cost-2026-08-24` |
| データは約 5 分以内 | 通常 4 時間、最大 24 時間、月末から約 7 日間は改訂 |
| `data` は時間バケット(古い順、空のバケットも含む)で、それぞれがディメンションとメトリクスが混在する `results` リストを持つ | `data` は `order_by` でランク付けされた行で、それぞれが独自の `starting_at` / `ending_at` を持ち、ディメンションは `group`、メトリクスは `usage` または `cost` に入る。空の組み合わせの行はない |
| `bucket_width`、デフォルトは `1d` | `time_bucket_width`、**デフォルトなし** — 日次の行を維持するには `1d` を渡し、範囲全体の合計が欲しければ省略 |
| `limit` は 1 ページあたりの時間バケット数を数える | `limit` は 1 ページあたりの**行**を数える(1〜1,000、デフォルト 20)ため、ページ数はデータのある組み合わせの数に依存する |
| 任意の日付範囲で、バケット単位で前方へページ送り | `starting_at` ≥ 2026 年 1 月 1 日かつ 365 日以内。1 リクエストあたり 31 日以内。バケットを使う場合 `ending_at` は必須。`1m` では 24 時間以内 |
| `account_ids[]`、`service_account_ids[]`、`group_by[]=account_id`、`group_by[]=service_account_id` | 同じタグ付き ID を使う `actor_ids[]` と、`group_by[]=actor` または `actor_type`。`actor.user_id` または `actor.service_account_id` を読む |
| `context_window[]` | `context_windows[]`(複数形になった) |
| cost レポートの `group_by[]=description`(`description` 文字列付き) | **廃止。** 代わりに構造化されたディメンションでグループ化する — `model`、`cost_type`、`token_type`、`context_window`、`service_tier`、`inference_geo`、`speed`。すべて 1 回のリクエストに収まる |
| 未知の API キーやワークスペース ID → エラー | 何もマッチしない。スペルミスした `models[]` の値も同様 |
| `workspace_id: null` はデフォルトのワークスペースを意味した | デフォルトのワークスペースは**実際の** `wrkspc_` ID を持つ |
| どちらもない使用量で `inference_geo: "not_available"`、`service_tier: "standard"` | 両方とも `null`。`inference_geos[]=not_available` は引き続き geo なしの行にマッチする |
| コストの `service_tier` は `standard` か `batch`。`amount` は `"123.45"` のような形 | 実際のティア。`amount` は小数 6 桁(`"123.450000"`)で、`list_amount` も加わる |
| コード実行は usage レポートに存在せず、リクエスト数もない | コード実行は `model: null` の使用量行として現れる。両エンドポイントに `requests`、usage の行に `total_tokens` |

従来の日次レポートを正確に再現するには: 同じ `group_by[]` で `time_bucket_width=1d` をリクエストし、`limit=1000` でページを送り、日付順にするため `order_by=time&order=asc` を追加し、行を `starting_at` でグループ化して、**欠けている日を自分でゼロ埋め**します。

:::tip[デフォルトのワークスペースは null ではなくなりました — グルーピングのコードを更新してください]
従来の利用側は、`workspace_id: null` を「Default Workspace」として特別扱いしていることがよくありました。そのマッピングはもう間違いで、ここでの `null` は代わりに「それでグループ化していない」を意味します。デフォルトのワークスペースは通常の `wrkspc_` ID を持ちますが、[List Workspaces](https://platform.claude.com/docs/en/api/organization/workspaces/list) は `include_default=true` を渡さない限りそれを**省略**するため、行に現れる見慣れない ID がワークスペース表に載っていないことがあります。Get Workspace で解決してください: デフォルトのものは `"name": "Default"` を返します。
:::

## Claude API 以外

| プラットフォーム | 提供状況 | 違い |
| --- | --- | --- |
| Claude Platform on AWS | 両エンドポイント | Admin API キーの代わりにプラットフォームのベース URL と認証を使用。AWS IAM は `ListAccountUsage` と `ListAccountCost` アクションで認可する。**各リクエストは、そのエンドポイントの AWS リージョン内のワークスペースだけを対象とする** — 組織全体をカバーするにはすべてのリージョンを呼び出す。`user_profile_id`、`claude_tag_category`、`claude_tag_user_id` と Managed Agents のディメンション(`agent_id`、`environment_id`、`deployment_id`、`session_id`)はすべての行で `null` |
| Claude Models on Google Cloud(Anthropic 管理) | 両エンドポイント | Google Cloud の認証情報で、組織レベルのベース URL を通じて呼び出す。`/usage` は `usageAnalytics.list` の IAM 権限、`/cost` は `costAnalytics.list` が必要 |

その `user_profile_id` ディメンションは、Claude API 自体で最も興味深いものです: [ユーザープロファイル](/docs/api/user-profiles-and-enforcement)と組み合わせると、この API がプラットフォームや再販業者向けのエンドカスタマー単位のチャージバックになります — エンフォースメントの影響範囲を限定するのと同じ帰属が、各顧客があなたにいくらかかっているかも教えてくれます。

## よくある間違い

| 間違い | 実際に起こること |
| --- | --- |
| `amount` をドルとして表示する | すべての数値が 100 倍大きくなる。小数 6 桁のセントである |
| レスポンスの順序のまま行を時系列としてプロットする | 行は範囲全体で `order_by` によりランク付けされている。`time_bucket_width` **と** `order_by=time` が必要 |
| curl で `--globoff` を省く | curl が `group_by[]` の `[]` を glob として扱い、リクエストが書いたとおりには送信されない |
| ゼロ埋めされたバケットを期待する | データのないバケットや組み合わせは**行を生成しない**。隙間はクライアント側で埋める |
| これでコスト急増アラートを作る | データは 4〜24 時間遅れで、月末後も 1 週間は改訂される |
| 異なる日に取得した月初来の合計を比較する | 値は月末の約 7 日後まで改訂される。`ending_at` をすでに見た `data_refreshed_at` に固定する |
| 空の結果を「使用量なし」として扱う | 未知のワークスペース ID、API キー ID、スペルミスしたモデル名は、エラーではなく何もマッチしなくなった |
| `workspace_id: null` → 「Default」のマッピングを残す | デフォルトのワークスペースは今や実際の `wrkspc_` ID を持つ。`null` は「このディメンションでグループ化していない」を意味する |
| `limit` が 1 ページあたりの行数を制限すると仮定する | `cost_type` と `token_type` は `limit` を完全に無視する |
| `account_ids[]` / `service_account_ids[]` を使い続ける | `group_by[]=actor` または `actor_type` を伴う `actor_ids[]` に置き換えられた |

## クイズ

<Quiz questions={[
  {
    q: "コストの行が cost.amount = \"41280.000000\"、cost.currency = \"USD\" で返ってきました。ダッシュボードには何を表示すべきですか?",
    options: [
      "$41,280.00",
      "$412.80",
      "$41,280.000000",
      "$4,128.00"
    ],
    answer: 1,
    explain: "currency が USD と読めても、amount は小数 6 桁の「セント」単位の 10 進数文字列です。41280 セントは $412.80 です。そのまま表示すると 100 倍のエラーになり、しかもフィールド名が amount で通貨がドルと言っているために、レビューをすり抜けてしまいます。"
  },
  {
    q: "group_by[]=model で 7 日分の使用量をリクエストし、届いた順に行をプロットして日次の折れ線グラフを期待しました。得られたのは時系列順になっていないものでした。何が足りないのでしょう?",
    options: [
      "time_bucket_width=1d だけ — バケットはデフォルトで時系列順になる",
      "order_by=time だけ — 並び順はバケット化とは独立している",
      "time_bucket_width=1d と order_by=time の両方",
      "何もない。API は時間で並べ替えないので、クライアント側でソートする必要がある"
    ],
    answer: 2,
    explain: "time_bucket_width にはデフォルトがないため、省略すると範囲全体の合計になります。そして行は、order_by=time を設定しない限り order_by メトリクス(大きい順)でランク付けされます。両方が必要です: 範囲を分割するバケットと、それをバケットごとに受け取るための order_by=time です。データのないバケットは行を生成しないため、空のバケットのゼロ埋めは依然として自分で行います。"
  },
  {
    q: "経理が 10 月の月初来コストを 10 月 2 日、10 月 20 日、そして 11 月 10 日に取得し、10 月 1 日について 3 つの異なる合計を得ました。ドキュメントに記された挙動と一致する説明はどれですか?",
    options: [
      "バグ: data_refreshed_at があるタイムスタンプを過ぎれば、その値は確定する",
      "遅れて届くイベントや照合に伴い、暦月の終了から約 7 日後まで値が改訂される",
      "ページ分割クエリの各ページが異なるスナップショットを読むため、合計がずれる",
      "影響を受けるのは cost エンドポイントだけで、usage エンドポイントは即座に確定する"
    ],
    answer: 1,
    explain: "データは通常 4 時間以内に更新され、最大 24 時間かかることがあり、値は暦月の終了から約 7 日後まで改訂され得ます — つまり 10 月 1 日は 11 月 7 日頃まで変わり得ます。確定した合計が必要なら、終了から少なくとも 7 日経った月だけをクエリしてください。(ページネーションは原因ではありません: 1 つのクエリのすべてのページは同じスナップショットを読むため、data_refreshed_at はページ間で同一です。)"
  }
]} />

<Callout type="takeaways" items={[
  "2 つのエンドポイント — /v1/organizations/analytics/usage と /cost — は、どちらも anthropic-beta: analytics-usage-cost-2026-08-24 が必要です。",
  "amount を 100 で割ってください。currency が USD と読めても、小数 6 桁のセントです。",
  "グループ化しない限りディメンションは null で、データのない組み合わせは行をまったく生成しません — そのためクライアント側でゼロ埋めしてください。",
  "デフォルトはランク順: 本物の時系列には time_bucket_width と order_by=time の両方が必要です。",
  "鮮度は 4〜24 時間で、月末から約 7 日間は改訂されます。これは帰属とチャージバックのためのインフラであり、アラート用ではありません。",
  "api_key_ids[](キーが認証したもの)と actor_ids[](キーに帰属するもの)は異なる問いに答えます — 意識して選んでください。",
  "タイプミスはもうエラーになりません。未知のワークスペース、キー、モデル名は、黙って何もマッチしません。",
]} />

## 次へ

- [Admin API: Claude 組織を自動化する](/docs/api/admin-api) — これらのエンドポイントが引き継ぐ認証情報、スコープ、ページネーションの規約。
- [Hard Spend Caps: 請求を実際に止める AI プロバイダーはどれか](/docs/models/hard-spend-caps) — 同じ問題のエンフォースメント側を、プロバイダーをまたいで見たもの。
- [ユーザープロファイルとエンフォースメント](/docs/api/user-profiles-and-enforcement) — この API をエンドカスタマー単位のチャージバックに変える `user_profile_id` ディメンション。
- [ファーストパーティの OpenTelemetry トレーシング](/docs/api/opentelemetry-tracing) — 4 時間の遅れでは遅すぎるときの、リクエスト単位の可視性。
