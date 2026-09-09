# web — Akifumi Sekihara

4言語の静的ポートフォリオ。AstroがHTML・CSS・画像を生成し、Cloudflare Workers Static Assetsが配信します。ページのSSR、DB、認証、クライアントJavaScriptは不要です。Workerは入口の言語判定を担当します。

## 構成

- `apps/portfolio/src/content/`: 日本語・英語・韓国語・簡体字中国語のプロフィールとプロジェクト。Content Collections/Zodで検査。
- `src/pages/[locale]/`: `/ja/`、`/en/`、`/ko/`、`/zh-cn/` の静的ページ。
- `src/components/`: 翻訳データから独立した共通表示。
- `src/layouts/layout.astro`: canonical、hreflang、OGP、ProfilePage/PersonのJSON-LD。
- `src/styles/`: StyleXとMaterial Color Utilitiesによる外部CSS。
- `worker/index.ts`: Accept-Languageによる入口の302転送。
- `packages/config/`: 共有TypeScript設定。
- `tests/`、`scripts/`: 単体・ブラウザー・アクセシビリティ・HTML・内部リンク・翻訳・サイズ検査。
- `.github/workflows/`: CIと検証済み成果物の手動デプロイ。

## 言語

入口 `/` はAccept-Languageの優先度と地域付き言語を判定し、対応言語がなければ英語へ誘導します。中国語は簡体字を提供し、zh-TWなどもzh-cnへ対応付けます。所在地や国籍の推測ではありません。明示的な言語URLは自動転送せず、ページ内で手動選択できます。Cookieによる記憶はありません。判定結果は共有キャッシュに保存しません。

Astro開発サーバーや通常の静的ホストではWorkerが動かず、入口は英語になります。自動判定の確認にはビルド後の `pnpm preview` を使用します。

## 開発と検査

Node.js 24.21.0、pnpm 11.15.1を固定しています。miseではNode同梱のstandalone版ではなく `npm:pnpm` を使用します。

```sh
mise install
mise exec -- pnpm install --frozen-lockfile
mise exec -- pnpm dev
```

miseを使わない場合は同じNode.js・pnpmを用意してください。

```sh
pnpm check             # lint、整形、Astro/設定の型検査、Knip
pnpm test              # 言語判定とWorkerの単体テスト
pnpm build             # apps/portfolio/distへ静的生成
pnpm check:site        # HTML、内部リンク、4言語、資産サイズ
pnpm exec playwright install chromium
pnpm test:browser      # ローカルWorker、4言語、360/1280px、axe
pnpm check:performance # Lighthouse。Chrome/Chromiumが必要
pnpm audit:deps        # 依存脆弱性監査。ネットワークが必要
pnpm preview           # Workersでローカル配信
pnpm deploy:dry-run    # 公開せず設定とバンドルを検証
```

品質管理はVite+のOxlint/Oxfmt、Ultracite、型情報付きlint。Lefthookはコミット前にpnpm checkを実行します。Dependabotは週次更新を提案します。間接依存のセキュリティ修正はpnpm-workspace.yamlで固定し、上流更新時に解除を検討します。

## 画像・メディア・SEO

Astro PictureとsharpでAVIF/WebPと幅別画像を生成し、寸法をHTMLに指定します。元画像は `apps/portfolio/public/avatar.png`。Roboto FlexのLatinサブセットを自己配信し、CJKはシステムフォントを使用します。動画・音声はまだなく、変換ジョブや有料サービスは導入していません。追加時はポスター、字幕、遅延読み込み、容量に応じた外部ストレージを検討します。

各言語にcanonicalと相互hreflang、入口にx-defaultを指定します。sitemapとrobots.txtを生成し、テーマ見本はnoindex・サイトマップ対象外です。JSON-LDは表示プロフィールと同じ内容を使用します。検索結果の特別表示は保証されません。

## CIと公開

CIはmainへのpushとPRで、品質検査→単体テスト→ビルド→HTML/内部リンク→Playwright/axe→Lighthouseを実行し、サイト成果物とレポートを保存します。レポートを外部公開サービスへアップロードしません。性能・SEOの閾値未達は警告、アクセシビリティは失敗とします。

公開先は https://portfolio.sekihara.dev 、Workerはakifumi-sekihara-portfolio。事業用sekihara.devは変更対象外です。workers.devとバージョンプレビューURLは無効です。

GitHub Environment `production` と `upload-only` に以下を設定します。

- Secret `CLOUDFLARE_API_TOKEN`: 対象アカウントのWorker公開に限定したトークン。
- Variable `CLOUDFLARE_ACCOUNT_ID`: 対象アカウントID。
- 本番は必要に応じて承認者を設定し、mainに限定してください。

「Deploy verified site」を手動実行し、成功済みmainのCI run IDを指定します。リポジトリ・ブランチ・CI定義・成功状態を検証し、そのコミットと成果物を使用します。`upload-only` は未公開バージョンの保存で、閲覧URLは作りません。`production` が本番反映です。ローカルではWrangler認証と対象アカウントを指定して公開できます。

認証情報、.env、Wrangler状態、個人メールをGitに保存しないでください。公開履歴は新規作成し、移行前のローカル履歴はpushしないでください。

## Rootless Docker / Dev Containers

.devcontainerはrootless Docker専用です。対応エディターの「Reopen in Container」またはDev Containers CLIを使用します。

```sh
docker context use rootless
devcontainer up --workspace-folder .
devcontainer exec --workspace-folder . pnpm check
devcontainer exec --workspace-folder . pnpm build
devcontainer exec --workspace-folder . pnpm dev --host 0.0.0.0
```

Astroはlocalhost:14321。Wranglerはコンテナ内で `pnpm exec wrangler dev --ip 0.0.0.0` を起動後localhost:18787。ホスト側は127.0.0.1のみへ公開します。複数checkoutではポートとボリューム名を分けてください。

DebianのdigestとNode配布物のSHA-256を固定していますが、OSパッケージまでは完全固定ではありません。rootful Dockerを拒否し、ホーム全体・Dockerソケット・認証情報はマウントしません。エディター独自の認証転送は別途確認してください。node_modulesとpnpm storeは専用ボリューム、ソースとdistは共有します。lockfile更新後はコンテナ内でも再インストールしてください。

LTS更新時は.node-version、mise.toml、package.jsonのengines、Dockerfileを揃えて再ビルド・検証します。ホストのランタイム管理はリポジトリ設定とは別です。

## デザインと拡張

Irisが標準で、以前のテーマは/themes/以下に保持します。Material Color UtilitiesのSchemeVibrant、specification 2025、light、contrast 0から色を生成し、StyleXで静的CSSへコンパイルします。Google公式Webコンポーネントではありません。

`pnpm --filter portfolio-web tokens:generate` で再生成します。入力はapps/portfolio/scripts/generate-colors.ts、生成物はmaterial-palettes.jsonとmaterial.generated.stylex.tsです。個別の生成色を直接編集しないでください。

大規模化では翻訳キーとコレクションの検査を維持し、ビルド時間・ページ数・容量を測定します。記事が増えたら静的検索（Pagefind等）、編集者が増えたらCMS/翻訳管理、動画が増えたら専用配信を導入します。事業サイトはapps/businessと別Workerに分離できます。現段階では不要なDBや検索サーバーは追加しません。

参考: [Astro i18n](https://docs.astro.build/en/guides/internationalization/)、[Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)、[Preview URLs](https://developers.cloudflare.com/workers/versions-and-deployments/preview-urls/)。
