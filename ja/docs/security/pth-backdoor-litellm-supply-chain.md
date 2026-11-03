# .pth バックドア: LiteLLM 1.107.0 と、import より先に実行されるコード

> Source: https://derob98.github.io/ailmanac/ja/docs/security/pth-backdoor-litellm-supply-chain · AILmanac (CC BY 4.0) · last verified 2026-10-22

2026 年 10 月 21 日、litellm 1.107.0 は約 100 分間、毒入りの wheel 7 個と Docker タグ 4 個を配布した。ペイロードは誰かが litellm を import する必要すらなかった — Python がインタープリタの起動のたびに実行する .pth ファイルとして届いたからだ。そのメカニズム、「wheel はインストール時にコードを実行できない」が正しくて役に立たなかった理由、AI ゲートウェイを運用するすべての人を怖がらせるべき根本原因(プロキシのログに残っていた開発者の GitHub トークン)、Trusted Publishing とイメージ署名が役に立たなかった理由、検証済みの監査コマンド、そして実際に止められた対策の一覧表。

<LevelBadge level="advanced" />

<Callout type="objectives" items={["誰も litellm を import していないホストでペイロードが実行された理由を理解する — Python の site モジュールは、import で始まる .pth の行を、インタープリタの起動のたびに、あなたのコードより先に実行する", "「wheel はインストール時にコードを実行しない」という安心できるルールが、完全に正しく、かつ完全に無関係だった理由を知る", "AI ゲートウェイを運用する人にとって重要な根本原因をたどる: コーディングエージェントが GitHub の OAuth トークンをレスポンスボディに入れ、プロキシがレスポンスボディをログに記録していた", "3 月から導入済みだった Trusted Publishing、Docker イメージ署名、イミュータブルタグが、そっくりなリポジトリからビルドされたリリースを止められなかった理由を理解する", "攻撃者がこのプリミティブをリアルタイムで取り入れる様子を見る: 2026 年 3 月の litellm 1.82.7 はパッケージを使うことが必要だったが、次のリリースの 1.82.8 は .pth に切り替えた", "自分のマシンで実行可能な .pth の行を検証済みの方法で監査し、結果を正しく読む(setuptools は正当なものを 1 つ同梱している)", "対策表を適用する: 一般的なサプライチェーン防御 15 個のうち、実際にこれをブロックできたのはどれか、マルウェアに署名してしまったのはどれか、そして 2 件の LiteLLM インシデントの両方を止められたはずの 1 行の設定"]} />

**2026 年 10 月 21 日**、約 **100 分間**、`pip install litellm` は認証情報スティーラーと、1 時間ごとに動くリモートコードローダーをインストールしました。Hacker News のスレッドは 519 ポイントでフロントページに到達しました。お決まりのアドバイスが続きました: バージョンを固定せよ、鍵をローテーションせよ。

そのアドバイスは正しいのですが、このインシデントの中で最も面白くない部分でもあります。1 ページを割く価値があるのは、次の 3 点です。

1. **ペイロードは import される必要がなかった。** `.pth` ファイルとして配布され、Python の `site` モジュールがその環境で**インタープリタの起動のたびに**実行します。LiteLLM を共有 virtualenv にインストールし、その後に無関係なスクリプトを実行したホストでも、認証情報は漏れました。
2. **最初のアクセスは AI ゲートウェイのログ経由だった。** LiteLLM 自身のポストモーテムによれば、Claude Code はユーザーの GitHub CLI の OAuth トークンをレスポンスボディに埋め込み、LiteLLM の社内デプロイはレスポンスボディをログに記録し、そのデプロイは公開インターネットから到達可能でした。攻撃者はプロキシのログから 3 人の開発者の GitHub 認証情報を読み取りました。
3. **リリースは署名され、Trusted Publishing で公開され、本物のリポジトリに帰属していた** — 攻撃者はパブリッシャーを偽装しなかったからです。パブリッシャーのワークフローを編集して、`BerriAI/litellm` の代わりに `Berri-AI/litellm` からビルドさせました。

コーディングエージェントの前段に LLM プロキシを置いているなら、2 点目は二度読む価値があります。ゲートウェイのリクエストログとレスポンスログは、おそらく一度も認証情報ストアとして分類したことがないであろう認証情報ストアです。

<VerifyNote lastVerified="2026-10-22" source="LiteLLM's incident post (docs.litellm.ai/blog/security-incident-oct-21-2026), plus StepSecurity, SafeDep, JFrog and Wiz technical analyses, The Hacker News, and the Python 3 site module documentation. Timestamps, the credential-theft chain and the remediation steps are the maintainers' own account, which was still being updated at the time of writing — expect the root-cause wording to be refined. The sdist omitting the payload is SafeDep's and JFrog's finding; the March 2026 Trivy-driven first compromise is JFrog's. Independently verified on 2026-10-22: litellm 1.107.0 is absent from the PyPI JSON API and the newest release is 1.106.2 (7 wheels + 1 sdist, consistent with the maintainers' 'seven wheels'; Wiz's writeup counts eight distributions); PyPI's integrity endpoint returns 'No provenance available' for litellm 1.106.2; github.com/BerriAI/litellm returns 200 and github.com/Berri-AI/litellm returns 404. The .pth execution behaviour, the duplicate firing in a venv and the -S suppression were reproduced locally on CPython 3.14.6, as was setuptools shipping a legitimate executable .pth line. The claim that a provenance attestation would have verified correctly is this page's inference from the maintainers' description of the workflow change, not a published finding." />

## タイムライン

すべて UTC、2026 年 10 月 21 日、メンテナーのポストモーテムより。

| 時刻 | 起きたこと |
|---|---|
| 10:08:29 | ブランチ保護が、リリースワークフローへの無許可の変更を**拒否** |
| 10:08:34 | 5 秒後、**組織オーナー**の認証情報がブランチ保護を無効化し、強制 push |
| 10:46:39 | 改変されたワークフローが、そっくりなリポジトリ `Berri-AI/litellm` に対するステージング実行を開始 |
| 11:08:53 | 本番リリースパイプラインが開始 |
| 11:11:18 | **2 人目**の開発者の認証情報が、本番の承認ゲートを通過させる |
| 11:39:51–11:40:13 | `litellm==1.107.0` の**毒入り wheel 7 個**が PyPI に登場 |
| 11:46:56 | 毒入りイメージが公開される。Docker タグ `v1.107.0`、`latest`、`main-latest`、`main-stable` がすべてそれを指す |
| 11:53:49 | **3 人目**の認証情報が、リリースワークフローの実行記録を削除 |
| 12:09–12:24 | 無許可のワークフローが削除され、本物が復元される |
| 13:23 まで | PyPI が `litellm==1.107.0` を削除 |
| 13:51 | GHCR のタグが利用不可であることを確認 |
| 14:20 | Docker Hub のタグが削除されるか、検証済みのアーティファクトを指すよう戻される |

注目すべき点が 2 つあります。**承認ゲートは設計どおりに機能しました** — 2 人目の人間を要求し、攻撃者は 2 人目の人間のトークンを持っていたのです。そして Docker の露出期間は PyPI より長く、**約 2 時間半**で、その間 `latest` と `main-stable` の両方が汚染されていました。その期間に浮動タグをプルしたデプロイはすべて被害を受けました。`main-stable` に何か意味があると信じていた人も含めて。

## パート 1 — メカニズム: import より先に実行されるコード

### .pth ファイルとは何か、何ができるか

`site-packages` の中の `.pth` ファイルは、通常は退屈なものです: `sys.path` に追加するディレクトリのリストです。editable インストールはこの仕組みで動きます。しかしこの形式には、あまり知られていないもう 1 つの動作があり、標準ライブラリのドキュメントに書かれています。

> `.pth` ファイルの中で、**`import` で始まり**、その後にスペースまたはタブが続く行は、**`exec()` で実行される**。

攻撃者の `cook.pth` は **12 バイト**です。内容全体が `import cook` だけ。それで十分です。インタープリタの起動時に自動的に import される Python の `site` モジュールがそのファイルを見つけ、`import` で始まっているのを確認して実行します — それが `cook.py` を import します。これは、スティーラーを含む 1 行の base64 と zlib の塊です。

同時に wheel は **`sitecustomize.py`** も配置しました。これは `.pth` を一切必要としません: `site` モジュールは、管理者向けのフックとして、設計上、起動のたびにまさにその名前のモジュールを import しようとするからです。そしてドキュメントには、攻撃者が直接恩恵を受ける細部があります — `sitecustomize` の import で、該当する `ImportError` 以外の例外が発生した場合、**その失敗は黙って握りつぶされる**のです。誤動作するペイロードは、トレースバックも警告も出しません。

つまり、**誰も litellm を import する必要がありません。** その環境の Python プロセスはすべて、両方のペイロードを実行します。cron ジョブも。`--version` のチェックも。同じコンテナ内の無関係なスクリプトも。

### 自分で検証する

これはドキュメント化された動作であり脆弱性ではないので、使い捨ての virtualenv で 30 秒で確認できます。CPython 3.14.6 で再現しました。

<PromptCard title="使い捨て venv で .pth のメカニズムを証明する">
{`python3 -m venv /tmp/pthdemo
SP=$(/tmp/pthdemo/bin/python -c "import site;print(site.getsitepackages()[0])")
printf 'import sys; sys.stderr.write("[pth ran: no import needed]\\n")\\n' > "$SP/zz_demo.pth"

# A command that imports nothing at all:
/tmp/pthdemo/bin/python -c "print('hello')"
#   [pth ran: no import needed]
#   hello

# -S skips the site module entirely, so nothing runs:
/tmp/pthdemo/bin/python -S -c "print('hello')"
#   hello

rm -rf /tmp/pthdemo`}
</PromptCard>

実行して得られた有用な観察が 2 つあります。1 つ目、`-S` はメカニズム全体を抑制します — これは以下で重要になります。ペイロードを**実行せずに**監査したいからです。2 つ目、デモの行はインタープリタの起動ごとに**2 回**出力されました: virtualenv では同じ site ディレクトリが複数回列挙されることがあり、ドキュメントは、パスのエントリは重複が除去される一方で**実行可能なエントリポイントは除去されない**と明記しています。ペイロードは 1 プロセスあたり複数回発火しうるのです。

### インシデントより長生きする部分

このページから 1 つだけ長く使える事実を覚えるなら、これにしてください: **`.pth` の import 行は Python 3.15 で非推奨となり、Python 3.20 で削除される予定です。** 代替は明示的な `.start` エントリポイントファイルで、対応する `.name.start` ファイルが存在する場合、`.pth` の import 行は**黙って無視されます**。

これはこの特定の攻撃プリミティブの、日付のある現実的な終わりです — そして、環境内の実行可能な `.pth` の行を今のうちに見つけておく理由でもあります。その一部は、依存されていて壊れるものだからです。

知っておく価値のあるドキュメント化された動作がさらに 2 つあり、どちらも静かなペイロードに有利です: 3.15 以降は、1 つの `.pth` の行でのエラーが残りの行の処理を**中断しなくなり**、非推奨期間中は、実行された import 行についての診断が**`-v` のときにしか出力されません**。

### 「wheel はインストール時のコードを実行しない」が誰も救わなかった理由

Python のパッケージングにおいて、広く繰り返され、実際に正しい知識があります: **sdist** は `setup.py` を通じてインストール時に任意のコードを実行できますが、**wheel** はインストーラーがファイルをコピーして展開するだけの zip アーカイブです。wheel のほうが安全な形式です。wheel を優先せよ。

これはすべて真実です。何の役にも立ちませんでした。**ペイロードにインストール時の実行は不要だった**からです。攻撃者は `pyproject.toml` の maturin ビルド設定に 1 行を追加しました —

```toml
[tool.maturin]
data = "cook"
```

— これはビルドバックエンドに、`cook/` ディレクトリを wheel の**データ**としてパッケージ化し、インストール時にその中身を `site-packages` のルートに配置するよう指示します。フックも、スクリプトも、`setup.py` もなし。ただ 3 つのファイルが所定の場所にコピーされ、そのうち 1 つを Python がその後の起動のたびに実行します。

この教訓はインシデントを超えて一般化できます: 「このパッケージはインストール時にコードを実行するか?」は誤った問いです。正しい問いは**「このパッケージは環境にどんなファイルを置き、ランタイムはそのうちのどれかを自動で実行するか?」**です。

<Callout type="warning" items={["wheel の中の .pth ファイルは、インストール時スクリプトと同等のものとして扱うこと。それは厳密にはさらに強力だ: インストールスクリプトは、あなたが目にするかもしれないインストーラーの下で一度だけ実行される。.pth の行は、インタープリタが起動するたびに、永遠に、次に Python を起動したプロセスの下で実行される。"]} />

## パート 2 — wheel とソースが食い違っていた

リリースのレビューのしかたを変えるべき発見がここにあります。**ソース配布物にはペイロードが含まれていませんでした。** SafeDep と JFrog によれば、`cook/` ディレクトリは sdist にありません — しかし sdist の `pyproject.toml` には `data = "cook"` の行があり、その行は `BerriAI/litellm` の**どの公開コミットにも**現れません。それは改ざんの唯一の目に見える痕跡で、ビルド設定の中にあり、アーティファクトにしかありませんでした。

その帰結をたどりましょう。

- `v1.107.0` の git タグを `v1.106.2` と diff した人は、何もおかしいところを見なかった — タグはクリーンだから。
- GitHub のリリースページを読んだ人は、何もおかしいところを見なかった。
- `--no-binary :all:` でインストールした人は、3 つのペイロードファイルを受け取れなかった。sdist がそれらを含んでいないから。
- `pip install litellm` — wheel を優先する通常のやり方 — を実行した人は、スティーラーを受け取った。

JFrog は、知っておく価値のある法医学的な細部を付け加えています: ペイロードファイルの ZIP エントリのタイムスタンプは、wheel 内の正当なファイルのものと**一致**しており、これはマルウェアがアーカイブの後からの再パッケージではなく、通常の wheel ビルド中に含められたことを示します。アーティファクトは、毒入りのビルドが生み出したものそのままです — そして、居心地の悪い部分に話は移ります。

## パート 3 — 堅牢化が役に立たなかった理由

LiteLLM はリリースのセキュリティに無頓着だったわけではなく、無頓着でなかった理由そのものがストーリーの一部です。**これは 2026 年の LiteLLM に対する 2 回目の侵害でした。** **3 月**に、JFrog によれば、プロジェクトのビルドパイプラインが悪意ある **ピン留めされていない Trivy 0.69.4** のリリースを実行し、CI/CD と公開用の認証情報が露出して、バックドア入りのバージョン **1.82.7 と 1.82.8** につながりました。JFrog は 10 月のペイロードとインフラは別物であり、2 つのキャンペーンの間に明らかな関連はないと述べています。

3 月の堅牢化は、その最初のインシデントへの答えでした。メンテナー自身の説明では、その後リリースを**プライベートリポジトリ**に移し、**Trusted GitHub Publishers** を採用し、Docker タグを**イミュータブル**にし、**Docker イメージ署名**を有効にしていました。これは同規模のほとんどのプロジェクトより良い態勢です — そして、最初の侵害は**ビルドパイプラインのピン留めされていない依存関係**で始まったことに注意してください。これは、下の対策表の最後に行き着く教訓と同じです。

それらの対策はすべて、10 月のリリースによって満たされていました。理由はこうです。

<Steps items={[
  {title: "攻撃者はパブリッシャーになりすましたのではなく、パブリッシャーを使った", body: "悪意あるワークフローは、正規のリポジトリの中で、正規のリリースパイプラインを通じて、正規の公開用アイデンティティで実行された。変わったのは、どのソースをチェックアウトしたかだけ。Trusted Publishing はアーティファクトを、それを生み出したワークフローとリポジトリに結びつける。そのワークフローが何をビルドすると選んだかについては何も言わない。"},
  {title: "そっくりな組織名が残りを片付けた", body: "ワークフローは BerriAI/litellm の代わりに Berri-AI/litellm を指していた。ハイフン 1 つ。ワークフローファイルの diff では、ほとんど見えない — そしてレビューを強制したはずのブランチ保護のチェックは、それが発火した 5 秒後に、組織オーナーの認証情報で無効化された。"},
  {title: "署名がマルウェアに署名した", body: "イメージ署名は、アーティファクトが期待どおりのパイプラインから来て、その後改変されていないことを証明する。アーティファクトはそのとおりだった。署名は有効で、イメージは毒入り。この二つは矛盾しない。署名が証明するのは出所であって、意図ではないからだ。"},
  {title: "イミュータブルタグは守る対象を間違えていた", body: "イミュータブルタグは、v1.107.0 が指すものを黙って差し替えられるのを防ぐ。ここでは、毒入りイメージがそのタグで最初に、そして唯一公開されたものだった — したがって不変性はマルウェアを固定した。浮動タグはもっとひどかった: latest、main-latest、main-stable がすべてそれを指すよう付け替えられた。"},
  {title: "コミットの「Verified」は見かけほど意味がなかった", body: "悪意あるコミットは Berri-AI <protonmail のアドレス> の名義で作成され、GitHub の Verified バッジが付いていた。そのバッジが意味するのは、GitHub が認証済みセッション(通常は Web エディタ)の代理でコミットに署名したということであり、名前の挙がった作者が見かけどおりの人物だということではない。もっともらしい組織名の隣の Verified バッジは、本人確認ではない。"},
  {title: "そしてクリーンなリリースにも、確認できるアテステーションがまだない", body: "2026-10-22 に確認: PyPI の integrity エンドポイントは litellm 1.106.2 に対して 'No provenance available' を返す。つまりインシデント後でさえ、現行リリースには利用者が検証できるものが何もない — これは PyPI 全体で一般的なケースであり、このプロジェクトに特有の批判ではない。"}
]} />

正直なまとめは、主流のソフトウェアサプライチェーンのツールチェーンは*「このアーティファクトはプロジェクトの本物のパイプラインから来たか?」*に答えるために作られている、ということです。それは**はい**と、正しく答えました。*「プロジェクトの本物のパイプラインは、プロジェクトの本物のソースをビルドしたか?」*に答えるように作られたものはほとんどありません — そして、この攻撃が拠り所にしたのはその問いでした。

## パート 4 — 根本原因: ゲートウェイのログは認証情報ストアである

ここからは AI インフラ特有の部分で、このインシデントが、パッケージングのニュースレターだけでなくこのサイトにも属する理由です。

攻撃者はメンテナーをフィッシングしたり、パスワードを破ったりしたのではありません。メンテナーのポストモーテムによれば、連鎖はこうでした。

<Steps items={[
  {title: "社内の LiteLLM デプロイが公開インターネットから到達可能だった", body: "調査で、そのデプロイに「予期しない、無害そうな名前のユーザーアカウント」が見つかった。チームは、最近パッチされた脆弱性経由でアクセスされたと疑ったが、執筆時点でその経路は確認されていなかった。"},
  {title: "コーディングエージェントのトラフィックがそこを通り、OAuth トークンを運んでいた", body: "ポストモーテムを引用すると: Claude Code はユーザーの GitHub CLI の OAuth トークンをレスポンスボディに埋め込み、レスポンスボディがログに記録されている場合、それらのトークンが LiteLLM のログに現れうる。ゲートウェイは、ゲートウェイが設定されるとおりのこと — デバッグ、コスト按分、評価のためにリクエストとレスポンスのペイロードを保持すること — をしていた。"},
  {title: "ログから 3 人の開発者の GitHub 認証情報が得られた", body: "そのうち 1 つは、組織の 2 人のオーナーの一人のものだった。その一点が、「ログテーブルへの読み取りアクセス」を「ブランチ保護を無効化してリリースワークフローを強制 push する」に変えた。"},
  {title: "マルウェアはその後、同じ種類のシークレットを探しに行った", body: "自らを privcollect と名乗るスティーラーは、16 のカテゴリを収集する: ブラウザのパスワードと Cookie、SSH 鍵と GPG 鍵、AWS/Azure/GCP の認証情報、Kubernetes の設定、CI のシークレット(GitLab Runner、Jenkins、Vault、Terraform)、シェルとデータベースの履歴、/proc/<pid>/environ 経由のすべてのプロセスの環境変数、AI コーディングツールのトークン(Claude、Cursor、Copilot、Gemini ほか)— そして DATABASE_URL が設定されていれば、LiteLLM プロキシのデータベース自体の Prisma ダンプ。そこには、それが仲介するために作られたプロバイダーの鍵が入っている。"}
]} />

最後の項目がループを閉じ、これが構造的なポイントです。**LLM ゲートウェイは、構造上、あなたの環境の中で、すべてのプロバイダー鍵を持ち、すべてのプロンプトと補完を見る唯一のホストです。** レスポンスボディのログを加えれば、エージェントがたまたまそこを通したあらゆるシークレットも保持します。1 台を侵害することは、開発者のノート PC を侵害するより価値があり、マルウェアの買い物リストは、攻撃者がそれを知っていたことを示しています。

<Callout type="key" items={["AI ゲートウェイを運用しているなら、このインシデントから得るアクションアイテムは「litellm をピン留めする」だけではない。ゲートウェイがリクエストやレスポンスのボディを永続化しているかを調べ、そうすべきかを判断し、そうせざるを得ないなら認証情報の形をした文字列をリダクトすることだ。エージェントのトラフィックは普通の API トラフィックではない — コーディングエージェントは GitHub、クラウドプロバイダー、パッケージレジストリのトークンを帯域内で運ぶ。"]} />

### ペイロードがホスト上で行ったこと

念のため、2 つ目のファイルについて。`sitecustomize.py` は切り離されたデーモンを fork しました — `setsid()`、I/O は `/dev/null`、作業ディレクトリは `/` で、親が終了しても生き残ります — それは**3,600 秒ごと**に起き、デッドドロップ(その後削除された GitHub アカウントの `domain.txt`)から次のコマンド&コントロールのホストを解決し、そこから `/codepy` を平文の HTTP で取得して `exec()` で実行しました。持ち出しは `www.litellm[.]dev/healthcheck` へ、こちらも平文の HTTP で、ボディは RSA-4096 でラップした鍵による AES-256-CBC で暗号化されていました — これはプロジェクトの本物の `litellm.ai` に似せたドメインで、リリースの 8 日前の **2026 年 10 月 13 日**に登録されました。(このページではドメインを無害化しています。名前解決しないでください。)

StepSecurity は、デーモン化のパスが `fcntl` と `os.fork` に依存するため **Windows では黙って失敗する**と指摘しています。Windows 向けの wheel は公開されていたので、スティーラーはそこで実行されたものとし、1 時間ごとのローダーはおそらく動かなかった部分として扱ってください。

<Callout type="warning" items={["パッケージをアンインストールしてもインシデントは終わらない。理由は互いに独立した 4 つある。盗まれた認証情報はすでに出て行った。fork されたデーモンは別のプロセスで、パッケージとの関係はもう残っていない。その間にそのホストで Python が起動するたびに、スティーラーが新たに実行された。そして — JFrog が指摘するように — pip 自体が Python プロセスなので、修復コマンドは出ていく途中でもう一度ペイロードを実行する。メンテナー自身のガイダンスは、ホストを侵害されたものとして扱うこと: デーモンを kill し、ファイルを削除し、再構築し、すべてをローテーションする。"]} />

## パート 5 — 7 か月前の同じパッケージと、攻撃者自身のエスカレーション

3 月のインシデントはよく見る価値があります。2 つの悪意あるバージョンは、`.pth` の手法がたった 1 回のバージョンアップで*取り入れられる*様子を示しているからです。

Datadog Security Labs は、これを **TeamPCP** キャンペーンとして追跡しており、それによれば:

- **`litellm` 1.82.7** は、ペイロードを `litellm/proxy/proxy_server.py` の中に持っていた。発火させるには、被害者がパッケージをインストールし、**さらに実際に使う**必要があった。
- **`litellm` 1.82.8** — まさに次のリリース — は **`litellm_init.pth`** を追加した。同じプロジェクト、同じキャンペーン、数日違いで、今やペイロードは**インタープリタの起動時**に発火し、LiteLLM の import は不要になった。

これはまさに、このページ全体が扱うプリミティブを攻撃者が発見したということであり、10 月のペイロードが注入されたモジュールではなく 12 バイトの `.pth` で始まった理由です。自分の依存関係をトリアージするなら、「モジュールレベルのコード」から「`.pth` ドロッパー」へのエスカレーションは、一回限りの手口ではなく、予期すべきパターンです。

3 月のペイロードも、10 月のものと見まがうほど同じ*手口*です: RSA-4096 でラップした鍵による AES-256、**プロジェクト自身の名前から作ったそっくりなドメイン**への持ち出し(当時は `models.litellm[.]cloud`、10 月は `litellm[.]dev`)、環境変数、SSH 鍵、クラウドの認証情報、Kubernetes にわたる認証情報の収集 — さらに 3 月は、`~/.config/sysmon/sysmon.py` による systemd での永続化、`checkmarx[.]zone/raw` でのコマンドのポーリング、クラスタ全体に広がるための Kubernetes の Pod 作成機能もありました。3 月のキャンペーンは **3 月 19 日の Trivy** から外へと連鎖し、npm(CanisterWorm)と Checkmarx のツールを経て、**3 月 24 日**(`litellm`)と **3 月 27 日**(`telnyx`)に PyPI に達しました。

<Callout type="note" items={["2 件の LiteLLM インシデントが関連しているかどうかについて、情報源の見解は割れており、このページはそれを解決しない。JFrog は、10 月のペイロードとインフラは別物で、3 月のキャンペーンとの明らかな関連はないと述べている。それに対して: 両方とも .pth ドロッパーを使い、両方とも RSA-4096 でラップした鍵による AES-256 を使い、両方ともプロジェクト名に由来するそっくりなドメインに持ち出した — 一方で Datadog のキャンペーン名(TeamPCP)と 10 月のスティーラーが自ら選んだ名前(privcollect、マーカー PRIVCOLLECT_ACTIVE)は、まだ誰も結論を公表していない比較を誘う。帰属は研究者に委ねられる。類似点は、発見ではなく、説明のつかないものとして扱うこと。"]} />

### 両方を止められたはずの 1 つの対策

3 月に関する PyPI 自身のインシデントレポートに、最も有用な数字があります: **LiteLLM は毎分約 1,700 回インストールされ**、3 月の露出期間中に **119,000 回**ダウンロードされました。PyPI は 3 月のリリースを、アップロードから **2 時間 32 分**後に隔離し、10 月は wheel が約 **1 時間 43 分**で消えました。対応は速くなっています — そして、決して十分には速くなりません。そのインストール速度では、最初の 10 分がすでに大規模侵害だからです。

だからこそ、PyPI が利用者に向けて掲げる主要な推奨は「コードを読め」ではありません。**依存関係のクールダウン**です: N 日より新しいリリースは解決しない。LiteLLM の 2 回の侵害はどちらも数時間以内に検知されて取り下げられました。**3 日間のクールダウンがあれば、どちらも、それを設定していた人にとっては何事もなく終わっていた**でしょう。

これはリストの中で最も採用が少ない高価値の対策で、設定は 1 行です。

<PromptCard title="クールダウンをサポートする 3 つのツールでの依存関係クールダウン">
{`# --- uv: pyproject.toml (or uv.toml at the root) ---
# exclude-newer accepts an RFC 3339 timestamp, a friendly duration,
# or an ISO 8601 duration. Relative durations landed in uv 0.9.17.
[tool.uv]
exclude-newer = "7 days"     # equivalently: "P7D"

# --- Renovate: renovate.json ---
# The oldest implementation of the idea (formerly stabilityDays).
{
  "minimumReleaseAge": "7 days"
}

# --- Dependabot: .github/dependabot.yml ---
# Note: Dependabot already applies a DEFAULT 3-day cooldown to version
# updates even with no cooldown block at all -- and never to security
# updates. Configure it only to lengthen or target the window.
updates:
  - package-ecosystem: "pip"
    directory: "/"
    schedule: { interval: "weekly" }
    cooldown:
      default-days: 7
      semver-patch-days: 3`}
</PromptCard>

トレードオフは明快で小さい: セキュリティ以外のアップデートを最大 1 週間遅れで受け取ります。その代わり、毒入りリリースがあなたに届きうる期間は、「誰かが気づくまでの長さ」から、「クールダウン内に誰かが気づくなら、ゼロ」へと縮みます — そして LiteLLM の両方のケースで、誰かが数時間以内に気づきました。

<Callout type="tip" items={["クールダウンはセキュリティパッチを遅らせてはならない。さもなければ、リスクを別のリスクと交換しただけになる。Dependabot はこれを構造的に正しく扱っている: クールダウンはバージョンアップデート専用のオプションで、セキュリティアップデートには適用されないと文書化されている。自分でクールダウンを実装する場合 — たとえば CI で uv の exclude-newer を使う — 既知のアドバイザリを修正するリリースのために、文書化された上書きの経路を残しておくこと。", "設定を追加する前に、すでに持っているものを確認する。Dependabot の 3 日間のデフォルトにより、誰かが選んだわけでもなく部分的にカバーされているリポジトリは多い。一方、浮動タグをプルする Dockerfile や、pip install -U を実行する CI のステップは、このどれにもカバーされない。"]} />

## トリアージ: 自分が該当するか?

順番に実行してください。最初の質問は手軽で、ほとんどの人はこれで答えが出ます。

<PromptCard title="1. 1.107.0 はどこかで解決されたことがあるか?">
{`# Lockfiles, requirement files, constraints — anywhere a resolver wrote a version down
grep -rniE "litellm[=<>~! ]*1\\.107\\.0([^0-9rc]|$)" . \\
  --include="requirements*.txt" --include="*.lock" --include="*.txt" \\
  --include="poetry.lock" --include="Pipfile.lock" --include="uv.lock" 2>/dev/null

# Installed right now, in this environment
pip list 2>/dev/null | grep -i litellm

# Container images you are actually running (compare against the poisoned digest)
docker images --digests | grep -i litellm`}
</PromptCard>

<PromptCard title="2. 配置された 3 つのファイルとランタイムのマーカーを探す">
{`# The payload files, at the ROOT of site-packages (not inside a litellm/ directory)
find / -name "cook.pth" -path "*site-packages*" 2>/dev/null
find / -name "cook.py" -path "*site-packages*" 2>/dev/null
find / -name "sitecustomize.py" -path "*site-packages*" 2>/dev/null

# Known SHA-256 of the three files
#   cook.pth          7f191632e7320705d154b85204f1ae546b543acbd7e8861229b76f5042b92bdb
#   cook.py           9dd0a3926f96a37eb86cf1ee2310d9be93139cc4ebef3ef9e2efe9531390be25
#   sitecustomize.py  34bef04fe88ac9d0aae0475630b1738681d15b94f233ac8aa46eacf5968305fa

# Execution markers
ls -la /tmp/.pc_once_72129118c59f5636c0bb /tmp/remote_code_loader.lock 2>/dev/null
ls -d /tmp/.pc_sq_* /tmp/.pc_e_* 2>/dev/null

# The live hourly loader: whatever process holds the lock (parent PID 1, cwd /)
lsof /tmp/remote_code_loader.lock 2>/dev/null`}
</PromptCard>

<PromptCard title="3. ネットワーク側(egress や DNS のログを保持している場合)">
{`# Exfiltration, dead drop, and the fetched payload path
#   litellm.dev                                    (NOT litellm.ai — the lookalike)
#   www.litellm.dev/healthcheck                    plain HTTP POST, encrypted body
#   raw.githubusercontent.com/letters9813/...      dead drop for the next C2 host
#   any request path ending in /codepy             the fetched code

grep -hiE "litellm\\.dev|letters9813|/codepy" /var/log/**/*.log 2>/dev/null | head`}
</PromptCard>

どれかに該当したら: デーモンを kill し、`cook.pth`、`cook.py`、`sitecustomize.py` とその `__pycache__` のエントリを削除し、`litellm==1.106.2`(または `v1.106.2` のイメージを**ダイジェストで**)にピン留めし、その後ホストを再構築して**すべてをローテーション**します — クラウドの IAM 認証情報、プロバイダーの API キー、データベースのパスワード、SSH 鍵、CI のシークレット、エージェントのツールトークン — そして、見慣れない送信元からそれらの認証情報が使われていないか、CloudTrail など同等のものを監査してください。メンテナーは、プライベートなエンタープライズリリースの顧客は影響を受けなかったと述べています。

## 残しておく価値のある監査: どの .pth ファイルがコードを実行するか?

このインシデントとは別に、気にかけているマシンで Python の起動時に何が実行されるかを把握しておくべきです。`-S` に注意 — 監査が、探しているものを引き起こしてはいけません。

<PromptCard title="環境内の実行可能な .pth の行をすべて列挙する (-S を付けて実行)">
{`cat > /tmp/audit_pth.py <<'EOF'
import glob, os, site, sys
dirs = list(site.getsitepackages())
try:
    if site.ENABLE_USER_SITE:
        dirs.append(site.getusersitepackages())
except Exception:
    pass
seen, hits = set(), 0
for d in dirs:
    if d in seen or not os.path.isdir(d):
        continue
    seen.add(d)
    for p in sorted(glob.glob(os.path.join(d, "*.pth"))):
        for n, line in enumerate(open(p, encoding="utf-8", errors="replace"), 1):
            s = line.strip()
            if s[:6] == "import" and s[6:7] in (" ", "\\t"):
                hits += 1
                print(f"{p}:{n}: {s}")
print(f"\\n{hits} executable line(s) across {len(seen)} site dir(s): {sys.executable}")
EOF

python3 -S /tmp/audit_pth.py`}
</PromptCard>

**出力を正しく読んでください。** ヒットは発見ではありません。`setuptools` だけが入った新品の virtualenv では、これは実行可能な行を **1 つ**報告し、それは正当なものです。

```
.../site-packages/distutils-precedence.pth:1: import os; var = 'SETUPTOOLS_USE_DISTUTILS'; ...
```

これは `setuptools` が distutils のシムをインストールしているもので、このメカニズムの最も一般的な正当な使い方です。editable インストール(`__editable__*.pth`)もその一つです。探すべきシグナルは、**自分が意図的にインストールしたパッケージに帰属させられない実行可能な行**です — そして、名前が思いつくどの配布物にも一致しない、`site-packages` のルートにあるファイルは、そのシグナルの最も強い形です。侵害されたホストでは、その名前は `cook` でした。

## 実際に何が止められたか

自分のセットアップに持ち帰るべき表です。「Yes」は、その対策がこの特定の攻撃をブロックするという意味で、一般的に十分だという意味ではありません。

| 対策 | これを止めたか? | 理由 |
|---|---|---|
| **依存関係のクールダウン** (3〜7 日) | **Yes — 3 月も** | どちらのリリースも数時間以内に取り下げられた。次のインシデントもカバーするのは、この表の中でこれだけ。 |
| 厳密なバージョン固定 (`litellm==1.106.2`) | **Yes** | 1.107.0 は解決の対象にならない。ここで最も価値の高い単一の対策。 |
| ハッシュ固定 (`pip install --require-hashes`) | **Yes** | 同じ理由に加え、既存のバージョン番号での再アップロードも捕捉する。 |
| ロックファイルをコミットし CI で守る | **Yes** | 100 分の窓は、新しいバージョンを選ぶことが許された resolver にしか届かない。 |
| その期間の `pip install -U` / 固定なしのインストール | **No** | まさにこれが被害を受けた人たち。 |
| Docker の `latest` / `main-latest` / `main-stable` | **No** | 3 つとも約 2.5 時間、毒入りダイジェストを指すよう付け替えられた。 |
| Docker を**ダイジェストで**固定 | **Yes** | ダイジェストは付け替えられない。 |
| Trusted Publishing / PyPI アテステーション | **No** *(推論)* | 本物のリポジトリの本物のワークフローが公開した。出所の証明も、それらを正しく名指ししたはず。 |
| Docker イメージ署名 | **No** | 署名は有効。それが証明するのは出所であって、意図ではない。 |
| イミュータブルな Docker タグ | **No** | 毒入りイメージが、そのタグで最初に公開されたアーティファクトだった。 |
| 「sdist を避け、wheel を優先」 | **No** | ここでは逆転した: wheel が毒入りで、sdist はペイロードを含んでいなかった。 |
| 「インストール時スクリプトのあるパッケージをブロック」 | **No** | インストールフックはなかった。ペイロードはデータファイルだった。 |
| ソースからビルド (`--no-binary :all:`) | ここでは **Yes** | sdist がペイロードファイルを含んでいなかったからに過ぎない。一般的な対策ではない。 |
| 開発/CI ホストへの厳格な egress 許可リスト | **一部** | 平文 HTTP で作ったばかりのドメインに持ち出すのは、まさに許可リストが拒否するもの。 |
| ゲートウェイでレスポンスボディをログに残さない | **初期アクセス** | 攻撃者が最初に使った認証情報がなくなっていた。 |
| 短命で、狭くスコープされた GitHub トークン | **初期アクセス** | ログに残っていた長命の組織オーナー用 OAuth トークンが、ピボットのすべて。 |

安価で退屈な対策が勝ちます。**クールダウンを設定し、厳密に固定し、固定をロックし、イメージはダイジェストでプルし、ゲートウェイに必要のないものを持たせない。** これらのうちコードの検査を伴うものがどれほど少ないかに注目してください: 表の上位 3 つの対策は、誰も何にも気づく必要がないからこそ機能するのです。

<Callout type="takeaways" items={[".pth ファイルはパスのリストではなく、コード実行のプリミティブだ。Python の site モジュールは、import で始まる行を、インタープリタの起動のたびに、パッケージの import なしで exec する。インストール時スクリプトより厳密に危険だと扱うこと。", "「wheel を優先」というアドバイスはインストール時の実行についてのもので、ランタイム起動時の実行はカバーしない。ビルド設定の 1 行 — data = 「cook」 — が、フックなしで site-packages のルートに 3 つのファイルを置いた。", "ソースとアーティファクトは食い違いうる。git タグはクリーンで、sdist はペイロードを含んでいなかった。wheel だけが運んだので、リポジトリを diff しても何も見つからなかった。目に見える唯一の痕跡は、どの公開コミットにも存在しないビルド設定の 1 行だった。", "サプライチェーンの署名は「これは本物のパイプラインから来たか?」に答える — そしてここでは、答えは正当に「はい」だった。それは「本物のパイプラインは本物のソースをビルドしたか?」には答えない。ハイフン 1 つのそっくりな組織がすり抜けたのはそこだ。", "AI ゲートウェイは AI スタックの中で最も価値の高いホストだ: すべてのプロバイダー鍵、すべてのプロンプト、そして — レスポンスボディをログに残すなら — コーディングエージェントが帯域内で運ぶあらゆるトークン。そのログをシークレットとして分類するか、保持をやめること。", "実行可能な .pth の import 行は Python 3.15 で非推奨となり 3.20 で削除され、明示的な .start ファイルに置き換えられる。今、python -S で自分のものを監査し、setuptools が正当なヒットになると予想しておくこと。", "これは 2026 年の LiteLLM に対する 2 回目の侵害で、最初のものはビルドパイプラインのピン留めされていない依存関係から始まった。固定は、毒入りリリースから身を守る方法であるだけでなく、プロジェクトがそれを公開しないための方法でもある。", "最良の単一の対策は依存関係のクールダウンだ。誰かが気づくことに依存しない唯一のものだから。LiteLLM の両方のリリースは数時間以内に取り下げられた。3 日間のクールダウンがあれば、どちらも何事もなく終わっていた。Dependabot はすでにデフォルトで 3 日間を適用し、セキュリティアップデートには決して適用しない。"]} />

<Flashcards title="このインシデントの 9 つの用語" cards={[
  {front: ".pth ファイル", back: "site-packages にあるファイルで、通常は sys.path に追加するディレクトリのリスト。'import' と空白で始まる行は、代わりに site モジュールがインタープリタの起動のたびに exec() で実行する。Python 3.15 で非推奨、3.20 で削除予定。"},
  {front: "sitecustomize.py", back: "site モジュールが、管理者向けのフックとして、設計上、起動のたびに import を試みるモジュール名。発火に .pth ファイルを必要とせず、import 中のあらゆる例外は黙って握りつぶされる。"},
  {front: "python -S", back: "site モジュールの自動 import を抑制する: .pth の処理も、sitecustomize も、usercustomize もなし。疑わしい環境を監査するときに使い、監査がペイロードを実行しないようにする。"},
  {front: "wheel のデータディレクトリ", back: "wheel がデータとして宣言したファイルは環境のルートにコピーされる — purelib の場合、それは site-packages そのもの。ここでは、maturin のビルド設定の下の 1 行 (data = \"cook\") が、インストール時のコードなしで cook.pth、cook.py、sitecustomize.py を配布した。"},
  {front: "privcollect", back: "スティーラーが自分につけた名前。16 のカテゴリ: ブラウザのパスワードと Cookie、SSH 鍵と GPG 鍵、AWS/Azure/GCP の認証情報、Kubernetes の設定、CI のシークレット、シェルと DB の履歴、/proc 経由のすべてのプロセスの環境変数、AI コーディングツールのトークン、そして LiteLLM プロキシのデータベースの Prisma ダンプ。"},
  {front: "そっくりなリポジトリ", back: "Berri-AI/litellm。BerriAI/litellm からハイフン 1 つ違い。本物のリポジトリのリリースワークフローが、そこからビルドするよう強制 push されたため、公開用アイデンティティ、署名、出所の証明はすべて本物のままで、ソースだけが本物ではなかった。"},
  {front: "Trusted Publishing", back: "公開されたアーティファクトを、それを生み出した特定のワークフローとリポジトリに結びつけ、長命の API トークンに置き換える。導入済みで、満たされていた: 本物のリポジトリの本物のワークフローがマルウェアを公開した。"},
  {front: "イミュータブルタグ", back: "公開済みのコンテナタグが後から付け替えられるのを防ぐ。そのタグの最初のアーティファクトがすでに悪意あるものなら役に立たず — それを指すよう付け替えられた浮動タグ (latest、main-stable) とも無関係。"},
  {front: "リモートコードローダー", back: "sitecustomize のペイロード: 切り離されたデーモン (setsid、cwd /、I/O は /dev/null) が 1 時間ごとに起き、GitHub のデッドドロップから次の C2 ホストを解決し、/codepy を平文 HTTP で取得して exec() で実行する。/tmp/remote_code_loader.lock でガードされる。"}
]} />

<Quiz title="理解度チェック" questions={[
  {q: "あるホストが 11:50 UTC に litellm 1.107.0 を virtualenv にインストールし、そのホストでは誰も litellm を import しませんでした。露出はどの程度ですか?", options: ["なし — ペイロードは import 時にしか実行されない", "全面的 — cook.pth はインタープリタの起動のたびに Python の site モジュールによって実行されるため、その環境のすべての Python プロセスがスティーラーを実行した", "LiteLLM プロキシを起動した場合のみ", "Windows の場合のみ"], answer: 1, explain: "これが中心となるメカニズムです。'import cook' を含む 12 バイトの .pth ファイルは、インタープリタの起動時に site モジュールによって exec されます。その環境のあらゆる Python プロセス — cron ジョブ、--version のチェック、無関係なスクリプト — が両方のペイロードを実行しました。メンテナーのガイダンスは、ホストを完全に侵害されたものとして扱うことです。"},
  {q: "あなたのポリシーは「sdist はインストール時に setup.py を実行できるので、sdist より wheel を優先する」です。このポリシーはここでどうなりましたか?", options: ["侵害を防いだ", "事実としては正しかったが、結果は逆転した: ペイロードを運んだのは wheel だけで、sdist は含んでいなかった", "間違っている — wheel もインストール時にコードを実行する", "どちらでも違いはなかった"], answer: 1, explain: "この知識は正確です: wheel はファイルをコピーして展開されるだけで、インストール時の実行はありません。ペイロードはそれを必要としなかっただけです。maturin のビルド設定の 1 行が、wheel のデータとして 3 つのファイルを site-packages に配置しました — そして sdist には cook/ ディレクトリがそもそもなかったので、ソースからビルドしていればペイロードはインストールされなかったでしょう。"},
  {q: "LiteLLM は 3 月から Trusted Publishing、Docker イメージ署名、イミュータブルタグを導入していました。なぜどれもこのリリースをブロックしなかったのですか?", options: ["設定が誤っていた", "攻撃者が PyPI の API トークンを盗んだ", "攻撃者は本物のパイプラインを使い、ビルドするソースだけを変えた — 出所の証明と署名は、毒入りのアーティファクトに対して本物の出所を正しく証明した", "署名は sdist しかカバーしない"], answer: 2, explain: "悪意あるワークフローは本物のリポジトリで本物の公開用アイデンティティを使って実行され、そっくりな Berri-AI/litellm をチェックアウトしました。これらの対策は「これはプロジェクトの本物のパイプラインから来たか?」に答えるもので、正直な答えは「はい」でした。「本物のパイプラインは本物のソースをビルドしたか?」に答えるようには設計されていません。"},
  {q: "メンテナーのポストモーテムによると、攻撃者は最初にどうやって開発者の GitHub 認証情報を入手しましたか?", options: ["メンテナーに対するフィッシングキャンペーン", "公開コミットに含まれていた .env ファイルの漏洩", "インターネットに公開されていた社内の LiteLLM デプロイのログから。コーディングエージェントの GitHub CLI の OAuth トークンが、ログに記録されたレスポンスボディに現れていた", "2FA の突破"], answer: 2, explain: "ポストモーテムは、Claude Code がユーザーの GitHub CLI の OAuth トークンをレスポンスボディに埋め込み、レスポンスボディがログに記録されている場合、それらのトークンが LiteLLM のログに現れうると述べています。攻撃者は、その公開されていた社内デプロイに到達し、ログから 3 人の開発者の認証情報 — 1 人は組織オーナー — を読み取りました。"},
  {q: "この攻撃を最も安価にブロックできたのは、次のどの組み合わせですか?", options: ["PyPI アテステーションとイメージ署名", "コミット済みのロックファイルでの厳密なバージョン固定と、コンテナイメージのダイジェストでのプル", "パッケージのソースの静的解析", "インストール時スクリプトを宣言するパッケージのブロック"], answer: 1, explain: "署名ベースの対策はどちらも毒入りのリリースによって満たされ、ブロックすべきインストール時スクリプトもなく、ソース解析は公開ソースがクリーンだったので何も見つけられなかったでしょう。退屈な対策が勝ちます: 固定されたロックファイルなら 1.107.0 は解決の対象にならず、ダイジェストは latest、main-latest、main-stable のように付け替えることができません。"},
  {q: "LiteLLM の 2 回の侵害はどちらも数時間以内に検知されて取り下げられました — 3 月は 2 時間 32 分、10 月は約 1 時間 43 分。これをほぼ完全な保護に変える、利用者側の対策はどれですか?", options: ["依存関係のアップデートのたびに diff を読む", "依存関係のクールダウン: 3〜7 日より新しいリリースは解決しない", "CI で脆弱性スキャナーを実行する", "セキュリティのメーリングリストを購読する"], answer: 1, explain: "これは利用者に向けた PyPI 自身の主要な推奨であり、この表の中で、これら 2 件に加えて次のインシデントもカバーする唯一の対策です。毎分約 1,700 回のインストールでは、検知が露出に追いつくことはありませんが、3 日間のクールダウンは、数時間で収束するインシデントをあなたにとって無関係にします。uv の exclude-newer、Renovate の minimumReleaseAge、Dependabot の cooldown がいずれもこれを実装しており、Dependabot は未設定でも 3 日間のデフォルトを適用し、セキュリティアップデートには決して適用しません。"},
  {q: "2026 年 3 月、litellm 1.82.7 はペイロードを proxy_server.py に入れ、1.82.8 は代わりに litellm_init.pth を同梱しました。この変更は何を示していますか?", options: ["攻撃者がアクセスを失い、やり直すことになった", "攻撃者が、被害者がパッケージを使うことを必要とするペイロードから、インタープリタの起動のたびに発火するものへとエスカレートした", "1.82.8 は失敗した試みだった", "何も — 両者は同等"], answer: 1, explain: "同じキャンペーンがプリミティブを発見したということです。モジュールレベルのペイロードは、誰かが LiteLLM を import して使ったときにしか実行されませんが、.pth はその環境で Python が起動するたびに実行されます。10 月の 12 バイトの cook.pth は 3 月が終わったところから始まっており、だから「モジュールレベルのコード」から「.pth ドロッパー」への進行は一回限りではなく、予期すべきものなのです。"},
  {q: "開発者のマシンで .pth の監査を実行すると、distutils-precedence.pth に実行可能な行が 1 つ報告されました。どう結論づけるべきですか?", options: ["マシンは侵害されている", "何も問題ない — それは setuptools の distutils のシムで、このメカニズムの最も一般的な正当な使い方", "ファイルをすぐに削除しなければならない", "Python を再インストールする必要がある"], answer: 1, explain: "ヒットは発見ではありません。setuptools は本物の実行可能な import 行を持つ distutils-precedence.pth を同梱しており、editable インストールは __editable__*.pth を追加します。シグナルは、自分がインストールしようと選んだパッケージに帰属させられない実行可能な行です — たとえば、システム上のどの配布物にも一致しない cook という名前のファイルのように。"}
]} />

## 出典と参考文献

- **LiteLLM** — *Contained: Oct 21, 2026 LiteLLM release v1.107.0 Compromised*: https://docs.litellm.ai/blog/security-incident-oct-21-2026 — メンテナーのポストモーテム。タイムライン、認証情報窃取の連鎖、そっくりなリポジトリ、以前の堅牢化、修復手順の一次情報源。
- **Python ドキュメント** — `site` — *Site-specific configuration hook*: https://docs.python.org/3/library/site.html — `.pth` の処理、`import` 行のルール、3.15 での非推奨と 3.20 での削除、`.start` ファイル、`sitecustomize`/`usercustomize`、`-S` フラグについての正式な説明。
- **StepSecurity** — *litellm 1.107.0 Compromised on PyPI: Backdoored Wheels Drop a Credential Stealer and an Hourly Remote Code Loader*: https://www.stepsecurity.io/blog/litellm-1-107-0-compromised-pypi-backdoored-wheels-credential-stealer — ファイルサイズとハッシュ、スティーラーの 16 カテゴリ、ローダーのデーモン化とデッドドロップ、持ち出しのヘッダー、IOC のリスト。
- **SafeDep** — *Compromised LiteLLM 1.107.0 on PyPI Installs a Credential Stealer and Backdoor*: https://safedep.io/litellm-pypi-compromise-credential-stealer-backdoor/ — sdist が `cook/` フォルダを含まないこと、どの公開コミットにも `data = "cook"` がないことの発見。Hacker News のフロントページに到達した記事。
- **JFrog Security Research** — *LiteLLM Hijacked Again: Malicious 1.107.0 Wheels Steal Credentials*: https://research.jfrog.com/post/litellm-hijacked-again/ — 2026 年 3 月の最初の侵害(ビルドパイプラインのピン留めされていない Trivy 0.69.4、バックドア入りの 1.82.7/1.82.8、XRAY-955589)、ビルド時の注入を示す一致する ZIP のタイムスタンプ、`pip` コマンドでさえペイロードを発火させるという観察。
- **Wiz** — *LiteLLM Compromised, Steals Credentials*: https://www.wiz.io/blog/litellm-compromised-steals-credentials — 露出期間、影響を受けた配布物、コンテナタグについての独立した説明。
- **The Hacker News** — *LiteLLM Suspects GitHub Token Leak in AI Gateway Logs Behind Malicious Package Release*: https://thehackernews.com/2026/10/litellm-suspects-github-token-leak-in.html — ゲートウェイのログという根本原因についての独立した報道。
- **Hacker News のディスカッション** — *Compromised LiteLLM 1.107.0 on PyPI Installs a Credential Stealer and Backdoor*: https://news.ycombinator.com/item?id=50181114 — フロントページのスレッド。2026-10-22 時点で 519 ポイント、170 コメント。
- **Datadog Security Labs** — *LiteLLM compromised on PyPI: the TeamPCP supply-chain campaign*: https://securitylabs.datadoghq.com/articles/litellm-compromised-pypi-teampcp-supply-chain-campaign/ — 2026 年 3 月のインシデント。1.82.8 の `litellm_init.pth` と 1.82.7 のモジュールレベルのペイロード、持ち出し先ドメイン、systemd での永続化を含む。
- **PyPI ブログ** — *Incident report: LiteLLM and Telnyx supply-chain attack* (2026-04-02): https://blog.pypi.org/posts/2026-04-02-incident-report-litellm-telnyx-supply-chain-attack/ — 毎分約 1,700 インストールと 119,000 ダウンロードという数字、隔離のタイミング、依存関係のクールダウンという PyPI 自身の推奨。
- **LiteLLM** — *Security Update: Suspected Supply Chain Incident* (2026 年 3 月): https://docs.litellm.ai/blog/security-update-march-2026 — メンテナーによる最初のインシデント記事。
- **uv** — `exclude-newer` 設定リファレンス: https://docs.astral.sh/uv/reference/settings/ — RFC 3339 のタイムスタンプ、分かりやすい期間、`P7D` のような ISO 8601 の期間を受け付ける。
- **GitHub Docs** — Dependabot オプションリファレンス、`cooldown`: https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference — サブキー、未設定でも適用される 3 日間のデフォルト、クールダウンはセキュリティアップデートに適用されないと文書化されていること。
- **Renovate** — `minimumReleaseAge` 設定オプション: https://docs.renovatebot.com/configuration-options/#minimumreleaseage — このアイデアの最も古くからある実装。
- **PyPI** — `litellm` プロジェクトページ: https://pypi.org/project/litellm/ — 1.107.0 は存在せず、1.106.2 が最新。特定のファイルに対する PyPI の provenance API: https://docs.pypi.org/api/integrity/
- **BerriAI/litellm**(本物のリポジトリ): https://github.com/BerriAI/litellm

## 次へ

- [サードパーティコードのレビュー](/docs/security/reviewing-third-party-code) — リポジトリを読むことがアーティファクトを読むことと同じではないとこのインシデントが示した後の、依存関係に対する一般的なレビューの規律
- [AI ゲートウェイ: LiteLLM、OpenRouter、Portkey](/docs/models/ai-gateways-litellm-openrouter-portkey) — ゲートウェイが何のためにあるのか、そしてこのページが見直すべきだと論じるログと鍵の扱いの判断
- [GemStuffer: OpenAI のエージェントはいかにして RubyGems を攻撃したか](/docs/security/rubygems-gemstuffer-rogue-agents) — 2026 年のもう一つのレジストリ侵害。レジストリが標的ではなく配布手段だったケース
