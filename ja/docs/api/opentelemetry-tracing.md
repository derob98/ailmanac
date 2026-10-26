# ファーストパーティの OpenTelemetry トレーシング: 2 つの経路、1 つのトレース

> Source: https://derob98.github.io/ailmanac/ja/docs/api/opentelemetry-tracing · AILmanac (CC BY 4.0) · last verified 2026-10-19

2026 年 10 月から、Claude API と Claude SDK は自前の計装なしで OpenTelemetry のスパンを自ら出力します。ただし 2 つの経路は重複しており、両方を合算するとトークン数が二重になります。このページでは、各経路のセットアップ、トークン数を正直に保つ唯一のルール、トレースを黙って消してしまう traceparent のフラグ、そして 24 時間後に送信先を無効にする配信ルールを扱います。

<LevelBadge level="advanced" />

2026 年の大半、Claude API 呼び出しをトレースするとは、スパンを自分で書くことでした。スパンを開き、`messages.create` を呼び、`usage` を属性にコピーし、スパンを閉じる。[エージェントのオブザーバビリティ](/docs/api/agent-observability)はそれを上手にやるためのページであり、名前が*何を意味するか*についてのページであり続けています。

このページは、変わった部分についてです。API と SDK が、ベータとして、それらのスパンを自ら出力するようになり、しかも手書きしていたよりはるかに多くを出力します。1 回の API リクエストの*内部*にあるモデルリクエストごとのスパン、API があなたに代わって実行したサーバーツールごとのスパン、コンパクションごとのスパン、Managed Agents のターンごとのスパン。これらは Anthropic 側で起きることで、手動の計装には構造上見えません。

これを有効にする独立した経路が 2 つあり、最も高くつく誤解は、**両者が重複する**ことです。ドキュメントを一段落も読まずに両方を有効にすると、すべての Messages リクエストが同じスパン名で 2 回現れ、トークンのダッシュボードが二倍になります。

<Callout type="objectives" items={[
  "SDK トレーシング、API トレーシング、あるいは両方の中から選び、それぞれが何を見られて何を見られないかを正確に知る",
  "各経路をセットアップする: コード内のトレーサープロバイダ、Console または Admin API 経由の送信先",
  "重複するスパンをまたいでトークンを正しく合算する: 二重計上を止める唯一のルール",
  "コンテンツモードを意図的に選び、何があなたの選択を上書きするか（HIPAA/FERPA/K-12、ゼロデータ保持）を知る",
  "traceparent で API のスパンをアプリケーションのトレースに結合し、それらを消してしまう sampled フラグを避ける",
  "配信ルールを乗り切る: at-least-once、ベストエフォート、そして 24 時間の失敗後の自動無効化"
]} />

<VerifyNote lastVerified="2026-10-19" source="https://platform.claude.com/docs/en/manage-claude/opentelemetry">
Claude API と SDK の OpenTelemetry エクスポートは、**2026 年 10 月 14 日**にベータとして開始されました。Anthropic は、ベータ期間中にスパン名、属性、SDK オプション、環境変数が変わりうると明示しており、SDK のバージョンを固定することを勧めています。このページの名前はすべてベータの面として扱い、移行の前に再確認してください。
</VerifyNote>

## 2 つの経路

同じことをする 2 つの方法ではありません。実行の異なる半分を見ます。

| 得られるもの | SDK トレーシング | API トレーシング |
| --- | --- | --- |
| Messages API と Sessions API のリクエスト | はい | はい |
| トークン使用量 | はい | はい |
| 1 回の API リクエスト*内部*の各モデルリクエスト | — | はい |
| Managed Agents のターン | — | はい |
| API が実行するサーバーツールと MCP コネクタツール | — | はい |
| ツールランナーが実行する自前のクライアントツール | はい | — |
| セルフホストのサンドボックス内のツール | はい | — |
| ファイルアップロードなど、その他のリクエスト | はい | — |
| セットアップ方法 | コード | Console または Admin API |
| 設定できる人 | 任意の開発者 | **admin** |
| 対象となるクライアント | SDK を使うクライアントのみ | curl を含む任意のクライアント |

区分は一本の線に沿っています。**SDK はあなたのプロセスがすることを見て、API は Anthropic 側がすることを見ます。** Web 検索のようなサーバーツールは API リクエストの内部で動きます。あなたのプロセスはそれを観測できないので、そのスパンを出すのは API トレーシングだけです。あなた自身の `get_weather` 関数はあなたのプロセスで動くので、そのスパンを出すのは SDK トレーシングだけです。

だからほとんどの本番構成では「両方」が本当の答えであり、下の重複ルールが例外的なケースではない理由です。

```mermaid
flowchart TD
  APP["your span: answer_question<br/>(your code)"] --> TR["anthropic.messages.tool_runner<br/>SDK · INTERNAL"]
  TR --> C1["anthropic.messages.create<br/>SDK · CLIENT"]
  C1 --> S1["anthropic.messages.create<br/>API · SERVER"]
  S1 --> M1["anthropic.model_request<br/>API · INTERNAL"]
  S1 --> W1["anthropic.tool_use web_search<br/>API · INTERNAL"]
  S1 --> M2["anthropic.model_request<br/>API · INTERNAL"]
  TR --> CT["anthropic.custom_tool_use get_weather<br/>SDK · INTERNAL"]
  TR --> C2["anthropic.messages.create<br/>SDK · CLIENT"]
  C2 --> S2["anthropic.messages.create<br/>API · SERVER"]
```

この形を注意深く読んでください。罠が含まれているからです。2 リクエストの会話に対して `anthropic.messages.create` は**4 回**現れます。SDK から 2 回（種別 `CLIENT`）、API から 2 回（種別 `SERVER`）で、各 API スパンはその SDK スパンを親に持ちます。再配信という意味での重複ではありません。同じリクエストを両端から行った、2 つの正当な観測です。

## SDK トレーシングをセットアップする

SDK のスパンには権限も Console へのアクセスも要りません。SDK はアプリケーションがすでに登録したトレーサープロバイダを使うので、配線すべき Anthropic 固有のエクスポーターはありません。

<Steps items={[
  {
    "title": "SDK をアップグレードする",
    "body": "スパンは現行の Python、TypeScript、C#、Go、Java、PHP、Ruby の SDK に含まれています。Java では最小バージョンが `anthropic-java` 2.73.0 です。バージョンを固定してください。ベータの注記によると、新しい SDK リリースでスパン、属性、オプション、環境変数の名前が変わることがあります。"
  },
  {
    "title": "最初の呼び出しの前にトレーサープロバイダを登録する",
    "body": "スパンが何も見えない最も一般的な理由です。SDK は呼び出しを行うときにグローバルに登録されたプロバイダを読みます。遅延させず、プロセス開始時に登録してください。まずコンソールエクスポーターで、スパンが存在することを確認し、それから OTLP に切り替えます。"
  },
  {
    "title": "自分のスパンの内側から SDK を呼ぶ",
    "body": "自動で入れ子になるものは何もありません。SDK のスパン（とその下の API スパン）を自分の `handle_request` スパンの下に表示させたいなら、自分のスパンを開き、その内側で SDK を呼びます。そうしないと SDK のスパンはルートスパンになり、どの機能やユーザーが呼び出しを引き起こしたのかをトレースは何も教えてくれません。"
  },
  {
    "title": "コンテンツモードと会話 ID を決める",
    "body": "デフォルトはメタデータのみです。プロンプトと応答を含めるには `traces.content_mode` を `content` に（または `ANTHROPIC_OPEN_TELEMETRY_TRACES_CONTENT_MODE=content`）設定します。複数回の呼び出しからなる会話を一つの `gen_ai.conversation.id` にまとめるには `conversation_id` を設定します。"
  }
]} />

<PromptCard title="最小限の SDK トレーシング — まずコンソールエクスポーターで (Python)">
{`from anthropic import Anthropic
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import ConsoleSpanExporter, SimpleSpanProcessor

# Register BEFORE the first traced call. Swap ConsoleSpanExporter for an
# OTLP exporter once you can see spans in the terminal.
provider = TracerProvider()
provider.add_span_processor(SimpleSpanProcessor(ConsoleSpanExporter()))
trace.set_tracer_provider(provider)

# Record prompts and responses, and label this conversation.
client = Anthropic(open_telemetry={"traces": {"content_mode": "content"}})

tracer = trace.get_tracer("my-service")
with tracer.start_as_current_span("answer_question"):
    message = client.with_options(
        open_telemetry={**client.open_telemetry, "conversation_id": "conv_42"}
    ).messages.create(
        model="claude-opus-5-5",
        max_tokens=1024,
        messages=[{"role": "user", "content": "Hello, Claude"}],
    )`}
</PromptCard>

### 知っておく価値のある SDK オプション

| オプション（Python の綴り） | 環境変数 | デフォルト |
| --- | --- | --- |
| `traces.content_mode` | `ANTHROPIC_OPEN_TELEMETRY_TRACES_CONTENT_MODE` | `metadata_only` |
| `traces.max_content_bytes` | `ANTHROPIC_OPEN_TELEMETRY_TRACES_MAX_CONTENT_BYTES` | 0.75 MB |
| `conversation_id` | — | なし |
| `tracer_provider` | — | 登録済みのグローバルプロバイダ |
| `propagation` | `ANTHROPIC_OPEN_TELEMETRY_PROPAGATION` | オン |
| `open_telemetry`（オフスイッチ） | `ANTHROPIC_OPEN_TELEMETRY` | オン |

初見だとそれぞれ 1 時間を失う挙動が 2 つあります。

- **クライアントに `open_telemetry` を渡すと、環境変数が丸ごと上書きされます**。入れ子のキーも含めて。オブジェクトから省いたキーは、変数が設定されていても、黙って表のデフォルトに戻ります。ゼロから作るのではなく、既存のオブジェクトからオブジェクトを組み立ててください。
- **TypeScript で `@opentelemetry/instrumentation-undici` を使う場合**（`@opentelemetry/auto-instrumentations-node` が取り込みます）は、`propagation: false` を設定してください。そのパッケージのバグが各リクエストに*2 つ目*の `traceparent` ヘッダーを追加し、トレースコンテキストが無効になって、結合が黙って壊れます。

<VerifyNote lastVerified="2026-10-19" source="https://platform.claude.com/docs/en/manage-claude/opentelemetry/sdk">
オプション名、環境変数名、Java の `opentelemetry-api` 1.57.0 という下限、undici の二重ヘッダーの警告は、公式の SDK セットアップページによるものです。言語ごとの綴りは異なります（TypeScript/Java/PHP は camelCase、C# は PascalCase、Go は `option.With…()` 関数）。ご自身の言語についてはページで確認してください。
</VerifyNote>

## API トレーシングをセットアップする

API トレーシングにはコードの変更がまったく要りません。*送信先*、つまりオブザーバビリティ基盤の OTLP エンドポイントと認証情報を登録すると、API がそこへスパンをポストします。

始める前に必要なもの:

- Console 組織の **admin ロール**。developer ロールは送信先を表示できますが、作成も変更もできません。
- **HTTPS の 443 番ポートで protobuf を受け付ける OTLP/HTTP エンドポイント。** セルフホストの人を直撃する要件です。標準的な OpenTelemetry Collector は OTLP/HTTP を**ポート 4318**で待ち受けるので、手前にロードバランサ、リバースプロキシ、または再設定したレシーバが必要です。gRPC の選択肢はなく、443 以外のポートもありません。
- そのエンドポイントの**認証情報**。リクエストヘッダーに入れます。保存後、Console は値を再表示しません。

<PromptCard title="Admin API で telemetry destination を作成する (curl)">
{`curl --fail-with-body -sS "https://api.anthropic.com/v1/organizations/telemetry_destinations" \\
  -H "x-api-key: $ANTHROPIC_ADMIN_KEY" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "anthropic-beta: telemetry-destinations-2026-08-11" \\
  -H "content-type: application/json" \\
  -d '{
    "endpoint_url": "https://gateway.example.com/otlp",
    "headers": {"authorization": "Bearer YOUR_OBSERVABILITY_API_KEY"},
    "traces": {"content_mode": "metadata_only"},
    "workspaces": {"type": "all"}
  }'`}
</PromptCard>

エンドポイント URL の形に注意してください。**ベース**の OTLP URL を渡し、`/v1/traces` は API に付けさせます。パスのプレフィックスは許されます。プラットフォームがまったく別の場所でトレースを受け取る場合は、任意のトレースエンドポイント URL を設定しますが、同じホストでなければなりません。

デフォルトに任せず、意図的に決めるべき設定が 3 つあります。

- **ワークスペース** — `all`、`selected`、`all except`。`all` は後から作成されるワークスペースも含みます。通常は望むことで、ときにまさに望まないことです。送信先は、リクエストやセッションが実際に実行されたワークスペースのスパンだけを受け取ります。
- **コンテンツモード** — 後述します。
- **最大コンテンツサイズ** — フルコンテンツモードでのみ適用されます。Console で掲載されているパートナーを選ぶと、そのプラットフォームが受け付ける値が事前入力されます。**Custom** では自己責任です。

その後、この順序で確認します。送信先のメニューからテストスパンを送り、`anthropic.test` スパンが届くことを確認する。選択したワークスペースで実際のリクエストを送る。**Delivery** 列が **Healthy** になっているか確認する。プラットフォームを `service.name` = `claude-platform` でフィルタする。各ステップで約 1 分見込んでください。送信先の変更も、ヘルス列も、それくらい遅れます。

<VerifyNote lastVerified="2026-10-19" source="https://platform.claude.com/docs/en/manage-claude/opentelemetry/api">
admin ロールの要件、OTLP/HTTP・protobuf・HTTPS・443 というエンドポイントの要件、`telemetry-destinations-2026-08-11` ベータヘッダー、検証用の `anthropic.test` スパン、`service.name` の値 `claude-platform` は、いずれも公式の API セットアップページによるものです。送信先は `ant` CLI でも管理できます。
</VerifyNote>

## コンテンツモードと、何があなたの選択を上書きするか

すべての送信先とすべての SDK クライアントは、2 つのコンテンツモードのどちらかを持ちます。

- **メタデータのみ**（`metadata_only`） — デフォルト。ID、タイミング、ステータス、トークン数、そして自分で選んだテキスト（エージェント名、ツール名と説明、MCP サーバー名）。
- **フルコンテンツ**（`content`） — 上記すべてに加えて、モデルのプロンプトと応答。スパンのリファレンスでは、これらの属性に `Content` バッジが付いています: `gen_ai.system_instructions`、`gen_ai.input.messages`、`gen_ai.output.messages`、`gen_ai.tool.call.arguments`、`anthropic.tool_result.content`。

フルコンテンツは、チームが実際にやりたいこと、つまり失敗した会話を読むことや、実トラフィックから[評価を構築する](/docs/playbooks/evaluating-agents)ことのためにトレースを使えるものにします。同時に、あなたのプロンプトとユーザーの入力を第二のシステムへ移し、あなた自身ではなくそのベンダーの保持とアクセス制御の下に置きます。[エージェントがアップロードするもの](/docs/security/what-your-agent-uploads)と同じ計算です。有効にすることは、あなたのオブザーバビリティ提供者に、アプリケーションデータが持つのとほぼ同じ権限を与えることになります。

2 つの上書きは記憶に値します。どちらも紛らわしいサポートチケットを生むからです。

- **Anthropic との HIPAA、FERPA、K-12 のデータ取り扱い制限があると、送信先はメタデータのみに強制されます**。送信先の設定が何であれ。SDK のスパンは影響を受けません。あなた自身のプロセスはコンテンツを出力できます。症状は「フルコンテンツはオンで、Console もそう言っているのに、プロンプトは CLIENT スパンにしか現れない」です。
- **ゼロデータ保持はフルコンテンツと両立します。** Messages API のリクエストでは、API はエクスポートされるコンテンツを配信まで、メモリ上にのみ保持します。Managed Agents はそもそも ZDR の対象外で、OpenTelemetry を使っても保持は変わりません。

### コンテンツの上限と切り詰め

各スパンはデフォルトで最大 **0.75 MB** のコンテンツを保持します。これは英語テキストの 200k トークンのコンテキストウィンドウに収まり、かつオブザーバビリティ基盤やプロキシに共通の 1 MB のリクエスト上限を下回るように選ばれています。1M トークンのウィンドウ全体には約 **4 MB** が必要です。

コンテンツが上限を超えると、スパンは短縮され、`anthropic.content.truncated` が `true` に設定されます。削除の順序は規定されており、トレースから評価を構築する人には重要です。

- **リクエストスパン**は、まずシステムプロンプトを、次に最も古いメッセージを削除します。
- **ツールスパン**は、結果の末尾からブロックを削除します。
- **画像とドキュメント**は種類としてのみ現れ、バイト列は決して含まれません。

つまり「すべてのトレースを評価ケースとして再生する」という素朴なパイプラインは、`anthropic.content.truncated` でフィルタしない限り、システムプロンプトのない会話を黙って流し込んできます。そのフィルタを、後から発見するのではなく、パイプラインの最初の 1 行にしてください。

## 唯一のルール: 各トークンを一度だけ数える

ここは二度読むべきセクションです。トークン使用量の属性は、リクエストごとに複数のスパンに現れます。意図的です。各スパンが*自分のステップ*を報告するからです。受け取ったものをすべて合算すると過大計上になり、誤ったレベルを合算すると過小計上になります。

<Steps items={[
  {
    "title": "リクエストごとに、ちょうど一つのソースを選ぶ",
    "body": "Messages リクエストに SDK スパンと API スパンの両方がある場合は、API スパンを合算します。どちらも `anthropic.messages.create` という名前なので、名前ではフィルタできません。スパン種別で見分けてください。SDK スパンは CLIENT で、その子の API スパンは SERVER です。`service.name` = `claude-platform` でのフィルタも有効です。"
  },
  {
    "title": "Messages リクエストの API スパン内では、二つではなく一つのレベルを合算する",
    "body": "`anthropic.messages.create` スパンか、その子の `anthropic.model_request` のどちらかで、両方ではありません。3 回のモデルリクエストを含むリクエストは、合計を親に、内訳を子に報告します。"
  },
  {
    "title": "コンパクションのトークンを、一か所からだけ加える",
    "body": "`gen_ai.usage.*` の合計にはコンパクションが含まれません。SDK スパンでは `anthropic.usage.compaction.input_tokens` と `anthropic.usage.compaction.output_tokens` を加えます。API スパンでは、代わりに `anthropic.compaction` の子スパンを加え、親の `anthropic.usage.compaction.*` 属性は同じトークンを保持しているので、それも一緒には加えないでください。"
  },
  {
    "title": "Managed Agents では、モデルリクエストと成果評価を合算する",
    "body": "`anthropic.model_request` スパンと `anthropic.session.outcome_evaluation` スパンを合算します。ターンスパンはコンテナで、トークンはその下にあります。成果評価は、あなたのモデルリクエストが生んだものではないため忘れやすい、実際の支出です。"
  },
  {
    "title": "トレース ID とスパン ID で重複を除く",
    "body": "配信は at-least-once なので、同じスパンが二度届くことがあります。基盤が重複排除をしないなら、あなたがやる必要があります。これは CLIENT/SERVER の重複とは別の問題で、別の対処が必要です。"
  }
]} />

もう一つ、カウントのルールではありませんが、誤った数字から守ってくれることがあります。`gen_ai.usage.input_tokens` は、キャッシュ読み取りとキャッシュ書き込みを**すでに含んでいます**。そこに `gen_ai.usage.cache_read.input_tokens` を足すと、最も安いトークンを二重に数えることになります。それらのトークンが互いにどれだけの費用かは[プロンプトキャッシュ](/docs/api/prompt-caching)を参照してください。

:::warning[トレースは課金記録ではない]
Anthropic は、エクスポートされたスパンが使用量の完全な記録であることを保証しないと明言しています。配信はベストエフォートなのでスパンが失われることがあり、さらに呼び出し側は `traceparent` の sampled フラグをオフにすることで、リクエストのスパンを丸ごと抑制できます。キーごとの会計、たとえば漏洩したキーの発見や請求書の突き合わせには、スパンを一つも生まなかったリクエストも数える Usage API を使ってください。トレースはデバッグとコストの*帰属*のためのもので、台帳ではありません。
:::

## API スパンを自分のトレースに結合する

デフォルトでは、API スパンは独自のトレースに存在します。技術的には正しく、ほとんど役に立ちません。どの機能やユーザーが呼び出しを引き起こしたのか分からないからです。

API は各リクエストから W3C の `traceparent` ヘッダーを読みます。SDK では、自分のスパンの内側で SDK を呼び、W3C トレースコンテキストのプロパゲーターを登録していれば、これは無料で手に入ります。（アプリケーションが B3 などの別のプロパゲーターに標準化している場合は、W3C をそれと並べて追加してください。SDK は*あなたの*プロパゲーターでヘッダーを書きます。）他のクライアントでは、ポストする前に、アクティブなスパンのコンテキストを自分でヘッダーに注入します。

そして、誰もが驚くフラグがあります。

:::warning[sampled フラグはヒントではなく、スパンのオン/オフスイッチ]
受信した `traceparent` の sampled フラグがオフなら、API は**そのリクエストのスパンも、その下のスパンも出力しません**。つまりアプリケーションでのヘッドサンプリングが、Anthropic 側のテレメトリがそもそも存在するかどうかを決めます。1% サンプリングのサービスが API トレーシングを有効にすると、モデルリクエストとサーバーツールのスパンの 1% しか得られず、機能が壊れていると結論づけるでしょう。コレクターでテールサンプリングするか、トレースしたい経路では sampled フラグを強制的にオンにしてください。
:::

伝播は、ほとんどの人が予想するより一歩先まで及びます。Messages API が[MCP コネクタ](/docs/api/mcp)経由であなたの MCP サーバーを呼ぶとき、`params._meta` に W3C の `traceparent` を渡すので、それを読むサーバーは自分のスパンを API のスパンの下に付けられます。`tools/call` リクエストではその親は `anthropic.mcp_tool_use` スパンで、他のメッセージでは `anthropic.messages.create` です。トレースされないリクエストは `traceparent` をまったく送りません。クライアント側は状況がまちまちです。Python の `mcp` パッケージはバージョン 2.0 から、C# の `ModelContextProtocol` パッケージは、トレースコンテキストを `_meta` で転送します。TypeScript、Go、Java、Ruby、PHP の MCP SDK は自力ではそれを行いません。

## 配信ルールと、送信先が死ぬ仕組み

API 側のエクスポートは Anthropic のインフラからあなたのエンドポイントへのプッシュです。つまり独自の失敗のセマンティクスを持ち、プロセス内の OTLP エクスポーターよりもウェブフックに近いものです。

| 性質 | 挙動 |
| --- | --- |
| 重複 | At least once。トレース ID + スパン ID で重複排除する。 |
| 損失 | ベストエフォート。失われたスパンは再送されない。 |
| 圧縮 | 各配信の最初のリクエストは `Content-Encoding: gzip` で gzip 圧縮される。`400` または `415` の場合、同じスパンが圧縮なしですぐに再送される。 |
| リトライ | タイムアウト、接続/TLS/DNS の失敗、`408`、`429`、`5xx` の後に限定的なリトライ。その他の失敗はリトライされない。 |
| タイムアウト | TLS ハンドシェイクは 5 秒以内、レスポンスヘッダーは 5 秒以内、配信ごとに合計 10 秒（圧縮なしの再送を含む）。 |
| User agent | `User-Agent: Claude-Platform`。許可リストのルールに便利。 |

そして、API が送信先を完全に**無効化**し、人が再度有効にするまでエクスポートを止める 3 つのケースがあります。

1. エンドポイントが `3xx` のリダイレクトを返す。リダイレクトは追跡されません。送信先を最終的な URL に向けてください。
2. エンドポイントのホスト名が非パブリックな IP アドレスに解決される。VPC へのトンネルはありません。パブリックなコレクターを公開するか、マネージドなプラットフォームを使ってください。
3. すべての配信が 24 時間失敗する。

3 つ目が運用上の危険です。誰にも気づかれずにローテーションされたオブザーバビリティの API キーは、**Failing** の送信先として 1 日を過ごし、その後 **Disabled** になります。再有効化は Console での手動クリック（ワークスペースフィルタを **All** にした状態）であり、自動復旧ではありません。このページから一つだけアラートを張るなら、Delivery の状態にしてください。

### 組織ごとの上限

| 上限 | 値 |
| --- | --- |
| 送信先（無効なものを含む） | 10 |
| 一つの送信先に選択できるワークスペース | 1,000 |
| 送信先ごとのリクエストヘッダー | 20 |
| ヘッダー名の長さ | 128 バイト |
| ヘッダー値の長さ | 4,096 バイト |
| すべてのヘッダー名と値の合計 | 16,384 バイト |
| エンドポイント URL の長さ | 2,048 文字 |

<VerifyNote lastVerified="2026-10-19" source="https://platform.claude.com/docs/en/manage-claude/opentelemetry/api">
配信のセマンティクス、タイムアウト値、3 つの自動無効化条件、上限の表は、公式の API セットアップページの "Delivery and health" と "Limits" の節によるものです。ベータの面です。これらの数値に基づいて SLO を組む前に再確認してください。
</VerifyNote>

## Managed Agents のセッションを読む

セッションは「1 トレース」という前提を壊し、解決策はトレース ID ではなくグルーピングキーです。

セッションのスパンは**複数のトレース**に落ちることがあります。新しいルートトレースから送られた後続のリクエストは新しいトレースを開始します。またマルチエージェントのオーケストレーションでは、セッションに複数のスレッドがあります。したがって:

- **一つのスレッドをトランスクリプトとして** — `gen_ai.conversation.id`（セッションのスレッド ID）でグループ化し、開始時刻でソートします。
- **セッション全体、すべてのスレッド** — トレースをまたいで `anthropic.session.id` でグループ化します。

スパンの形は、頭に入れておく価値があります。すでにダッシュボードがあるかもしれない汎用の GenAI 規約とは一致しないからです。`anthropic.session.turn` は `gen_ai.operation.name` = `invoke_agent` を持ち、一つのスレッドの `running` 状態にまたがります。リクエストが開始したターンはそのリクエストのスパンの子になり、別のスレッドが返信したために始まったターンには親がまったくありません。フルコンテンツモードでは、ターンスパンがスレッドのコンテンツを保持します。`gen_ai.system_instructions` はスレッドの最初のターンにのみ、`gen_ai.input.messages`、`gen_ai.output.messages` です。アドバイザースレッドは意図的により薄く、`gen_ai.agent.name` は `anthropic.advisor` で、指示と入力の属性はありません。

4 つのケースでは、API のツールスパンがまったく**出ません**。そしてそれぞれが、トレーシングが壊れていると誰かに思わせてきました。アプリケーションが実行するツール（そのスパンは SDK のツールランナーが出します）、セルフホストのサンドボックス内のツール（SDK の環境ワーカーが出し、`anthropic.environment.work` の下にまとまります）、マルチエージェントまたはアドバイザーのツール、そして `auto` の権限ポリシーまたは `user.tool_confirmation` イベントによって拒否されたツール使用です。拒否された呼び出しはツールスパンを残しません。エージェントが*試みた*ことを監査するなら、トレースではなくセッションイベントを読んでください。

## よくある間違い

- **受け取ったすべての `anthropic.messages.create` スパンを合算する。** リクエストごとに正当な観測が 2 つ、同じ名前。まずスパン種別か `service.name` でフィルタしてください。もっともらしく、誤っていて、ちょうど二倍になったコスト値を生む間違いです。
- **普段のサンプリングレートでスパンが来ると期待する。** sampled がオフの `traceparent` は API のスパンを完全に抑制します。あなたのサービスでのヘッドサンプリングは、Anthropic のテレメトリのヘッドサンプリングです。
- **素の Collector を送信先に向ける。** 4318 の OTLP/HTTP は 443 の HTTPS エンドポイントではありません。手前にプロキシを置かないと、送信先は決して配信しません。
- **フルコンテンツをロギングのフラグとして扱う。** プロンプトとユーザー入力をオブザーバビリティのベンダーに移します。データ取り扱いの責任者と決めてください。HIPAA/FERPA/K-12 の制限は、API スパンについてだけ黙ってそれを上書きします。
- **`anthropic.content.truncated` を確認せずにトレースから評価を構築する。** 切り詰めはまずシステムプロンプトを落とします。評価コーパスから、ちょうど挙動を決めた部分が抜け落ちます。
- **`Failing` の送信先を放置する。** 24 時間の失敗で無効化され、再有効化は手動です。スパン量ではなく Delivery の状態でアラートを張ってください。スパン量はゼロになる直前まで問題なさそうに見えます。
- **これらの属性名を 40 枚のパネルにハードコードする。** スパンは、タグ付きリリースのないリポジトリの特定のコミット（`e57c543b`、2026 年 9 月 24 日）の GenAI 規約に従っており、ベータの注記は名前を変更する権利を留保しています。[エージェントのオブザーバビリティ](/docs/api/agent-observability)のマッピング層の習慣は、ここでは一段と強く当てはまります。

## スパンの行き先

OTLP を受け付けるプラットフォームならどれでも動きます。Anthropic は Arize AI、Braintrust、Databricks、Datadog、Grafana Cloud、Honeycomb、Langfuse、LangSmith、New Relic、PostHog、Sentry、Splunk との連携ガイドを文書化しています。Console で掲載されているプロバイダを選ぶと、生のエンドポイントとヘッダーを求める代わりに、そのプラットフォーム自身の認証情報を求め、受け付けるコンテンツサイズを事前入力します。

Claude Code、Agent SDK、Cowork については、これは別のシステムで別のスイッチ（`CLAUDE_CODE_ENABLE_TELEMETRY` など）があり、[エージェントのオブザーバビリティ](/docs/api/agent-observability)で扱っています。ここで送信先を有効にしてもそれらには何も影響せず、逆も同様です。

<Quiz questions={[
  {
    "q": "SDK トレーシングと API トレーシングの両方を有効にし、すべての anthropic.messages.create スパンの gen_ai.usage.input_tokens を合算しました。何が起きますか。",
    "options": [
      "何も起きない。API スパンが SDK スパンを置き換える",
      "SDK（CLIENT）と API（SERVER）の両方がその名前のスパンを出すので、すべてのリクエストが二重に数えられる",
      "ストリーミングリクエストだけが二重に数えられる",
      "合計は正しいが、キャッシュ読み取りが漏れる"
    ],
    "answer": 1,
    "explain": "一つのリクエストには SDK からの CLIENT スパンが一つ、API からの SERVER スパンが一つあり、どちらも anthropic.messages.create という名前で、API スパンは SDK スパンの子です。一つのソースを選び（ドキュメントは API スパンを推奨）、スパン種別か service.name = claude-platform でフィルタします。"
  },
  {
    "q": "サービスはトレースの 1% をヘッドサンプリングしており、telemetry destination を追加したばかりです。なぜモデルリクエストのスパンがほとんど届かないのですか。",
    "options": [
      "送信先がウォームアップするのに 24 時間かかる",
      "モデルリクエストのスパンはフルコンテンツモードでしか出力されない",
      "sampled フラグがオフの traceparent は、そのリクエストのスパンとその下のすべてのスパンを抑制する",
      "API のスパンが現れる前に SDK をアップグレードしなければならない"
    ],
    "answer": 2,
    "explain": "API は受信した traceparent の sampled フラグを尊重します。オフなら、リクエストのスパンもその子も出力しません。あなたのサンプリングの判断は Anthropic のものでもあります。コレクターでテールサンプリングするか、トレースしたい経路ではフラグを強制的にオンにします。"
  },
  {
    "q": "オブザーバビリティの API キーがローテーションされたため、送信先が 1 日 Failing になっています。この後どうなりますか。",
    "options": [
      "API は無期限にリトライし続け、キーが直れば復旧する",
      "失敗した配信が 24 時間続くと送信先は無効化され、手動で再有効化しなければならない",
      "スパンはバッファされ、配信が成功したら再生される",
      "API は自動的に二つ目の送信先にフォールバックする"
    ],
    "answer": 1,
    "explain": "すべての配信が 24 時間失敗すると送信先は無効化されます。3xx のリダイレクトや、非パブリック IP に解決されるホスト名でも同様です。失われたスパンは再送されず、再有効化はワークスペースフィルタを All にした Console での手動操作です。Delivery の状態でアラートを張ってください。"
  }
]} />

<Flashcards cards={[
  { "front": "SDK トレーシング vs API トレーシング — それぞれだけが見えるもの", "back": "SDK のみ: ツールランナー経由の自前のクライアントツール、セルフホストサンドボックスのツール、ファイルアップロードのような Messages 以外のリクエスト。API のみ: 1 回の API リクエスト内の各モデルリクエスト、Managed Agents のターン、サーバーツールと MCP コネクタツール、コンパクション。両方: Messages と Sessions のリクエスト、トークン使用量。" },
  { "front": "重複するスパンの見分け方", "back": "リクエストの SDK スパンと API スパンは anthropic.messages.create という名前を共有します。SDK = 種別 CLIENT で、service.name はあなたのアプリ。API = 種別 SERVER で、service.name は claude-platform、SDK スパンの子です。" },
  { "front": "トークン計数のルール", "back": "リクエストごとに一つのソース（API スパンを優先）。Messages リクエストの API スパン内では、anthropic.messages.create か anthropic.model_request のどちらかを合算し、両方は決して合算しない。コンパクションは一か所からだけ加える。Managed Agents では anthropic.model_request + anthropic.session.outcome_evaluation を合算。トレース ID + スパン ID で重複排除。" },
  { "front": "gen_ai.usage.input_tokens にキャッシュトークンは含まれる？", "back": "はい。キャッシュ読み取りとキャッシュ書き込みはすでに含まれています。gen_ai.usage.cache_read.input_tokens を上乗せすると二重計上になります。" },
  { "front": "コンテンツモード", "back": "metadata_only（デフォルト）: ID、タイミング、ステータス、トークン数、自分で選んだ名前/説明。content: プロンプトと応答を追加 — gen_ai.system_instructions、gen_ai.input.messages、gen_ai.output.messages、gen_ai.tool.call.arguments、anthropic.tool_result.content。" },
  { "front": "フルコンテンツを上書きするもの", "back": "HIPAA、FERPA、K-12 のデータ取り扱い制限は、送信先をメタデータのみに強制します（SDK スパンは影響なし）。ゼロデータ保持はフルコンテンツと両立します。Messages リクエストでは、API はエクスポートされるコンテンツを配信までメモリ上にのみ保持します。" },
  { "front": "コンテンツ上限と切り詰めの順序", "back": "デフォルトはスパンあたり 0.75 MB（英語で約 200k トークン）。1M トークンのウィンドウには約 4 MB。上限を超えると anthropic.content.truncated = true。リクエストスパンはシステムプロンプト、次に最も古いメッセージを削除。ツールスパンは末尾からブロックを削除。画像とドキュメントは種類としてのみ現れる。" },
  { "front": "送信先のエンドポイント要件", "back": "protobuf を受け付ける OTLP/HTTP、HTTPS、ポート 443、IP ではなくホスト名。デフォルトの Collector は 4318 で待ち受けるので、手前にプロキシかロードバランサを置く。ベースの OTLP URL を渡し、API が /v1/traces を付ける。" },
  { "front": "sampled フラグ", "back": "リクエストの traceparent の sampled フラグがオフなら、API はそのリクエストのスパンもその子も出力しない。アプリでのヘッドサンプリングが、Anthropic 側のテレメトリを黙って消す。" },
  { "front": "送信先が無効化される 3 つのケース", "back": "エンドポイントからの 3xx リダイレクト、非パブリック IP に解決されるホスト名、すべての配信が 24 時間失敗。再有効化は手動で、ワークスペースフィルタを All にした Console で行う。" },
  { "front": "Managed Agents のセッションのグルーピング", "back": "一つのスレッドをトランスクリプトとして: gen_ai.conversation.id（スレッド ID）でグループ化し開始時刻でソート。トレースとスレッドをまたぐセッション全体: anthropic.session.id でグループ化。" },
  { "front": "API がツールスパンを出さないケース", "back": "アプリが実行するツール（SDK ツールランナーが出す）、セルフホストサンドボックスのツール（SDK 環境ワーカー、anthropic.environment.work の下）、マルチエージェントとアドバイザーのツール、auto 権限ポリシーまたは user.tool_confirmation で拒否されたツール使用。拒否された試みはトレースではなくセッションイベントにある。" },
  { "front": "telemetry destinations API のベータヘッダー", "back": "anthropic-beta: telemetry-destinations-2026-08-11。admin キーで POST /v1/organizations/telemetry_destinations に対して使う。ant CLI と Console からも利用可能。" },
  { "front": "これらのスパンが従う semconv のリビジョン", "back": "2026 年 9 月 24 日のコミット e57c543b の OpenTelemetry GenAI 規約（タグ付きリリースのないリポジトリ）。加えて anthropic.* プレフィックスの Anthropic 固有の属性。" }
]} />

<Callout type="takeaways" items={[
  "2 つの経路、実行の 2 つの半分: SDK はあなたのプロセスを、API は Anthropic 側を見る。ほとんどの本番構成は両方を望む。",
  "どちらの経路も同じリクエストについて anthropic.messages.create を出力する。何かを合算する前に、スパン種別で一つのソースを選ぶ。",
  "API スパン内では一つのレベル（messages.create か model_request、両方は決して）を合算し、コンパクションはちょうど一か所から加える。",
  "スパンはデバッグと帰属のためのもので、課金のためではない。配信はベストエフォートで、sampled がオフの traceparent はリクエストを丸ごと消す。台帳には Usage API を使う。",
  "sampled フラグはヒントではなくオン/オフスイッチ。1% サンプリングのサービスは、Anthropic 側のスパンの 1% しか得られない。",
  "フルコンテンツはプロンプトをオブザーバビリティのベンダーに移す。HIPAA/FERPA/K-12 の制限は API スパンについてだけそれを上書きする。知らなければ非常に紛らわしい症状になる。",
  "トレースから評価を構築する前に anthropic.content.truncated を確認する。切り詰めはまずシステムプロンプトを落とす。",
  "送信先の Delivery 状態でアラートを張る。24 時間の失敗で無効化され、復旧は手動クリック。"
]} />

## 次へ

- [エージェントのオブザーバビリティ](/docs/api/agent-observability) — `gen_ai.*` の名前の意味、それらがどれも安定していない理由、そしてこのページが扱わない Claude Code のテレメトリスイッチ
- [キャッシュ診断](/docs/api/cache-diagnostics) — スパンに予期しないキャッシュ読み取りが見えたとき、その理由を説明するリクエストごとのフィールド
- [Managed agents](/docs/api/managed-agents) — このページがグループ化の方法を教える、スパンの元となるセッション、ターン、スレッド

## 出典と参考資料

- [OpenTelemetry for the Claude API](https://platform.claude.com/docs/en/manage-claude/opentelemetry) — カバレッジの表、コンテンツモード、コンテンツ上限と切り詰めの順序、サンプルトレースの実例、セッションのグルーピング、トークン計数のルール
- [Set up OpenTelemetry with the Claude API](https://platform.claude.com/docs/en/manage-claude/opentelemetry/api) — 送信先のフィールド、Admin API と `ant` CLI、ワークスペースのスコープ、`traceparent` による結合、配信とヘルスのセマンティクス、上限、トラブルシューティングの表
- [Use OpenTelemetry with the Claude SDK](https://platform.claude.com/docs/en/manage-claude/opentelemetry/sdk) — 言語ごとのインストール、トレーサープロバイダの登録、環境変数を含むオプション表の全体、ストリームのトレーシング、セルフホストサンドボックス、伝播の落とし穴
- [OpenTelemetry span reference](https://platform.claude.com/docs/en/api/opentelemetry/spans) — すべてのスパンとその親子関係、`Content` バッジ付きのすべての属性
- [Claude Platform release notes](https://platform.claude.com/docs/en/release-notes/overview) — 2026 年 10 月 14 日のベータ開始のエントリ
- 関連: [プロンプトキャッシュ](/docs/api/prompt-caching) · [コンパクション](/docs/api/compaction) · [Admin API](/docs/api/admin-api) · [ハードな支出上限](/docs/models/hard-spend-caps) · [エージェントがアップロードするもの](/docs/security/what-your-agent-uploads) · [エージェントの評価](/docs/playbooks/evaluating-agents)
