AWS中規模インフラにおけるTerraformモジュール構成とFacadeパターン

本ドキュメントでは、CloudFront、WAF、VPC、ECS Fargate、ElastiCache、RDS、SESといったAWSの中規模アプリケーションインフラをTerraformでモジュール化し、Facadeパターンを適用する方法について解説します。開発(dev)・ステージング(staging)・本番(prod)環境ごとにコードを分離しつつ、再利用性と保守性の高い構成を構築するベストプラクティスを示します。各章でモジュール設計、ディレクトリ構成、依存関係管理、実践例、その他のベストプラクティスについて詳述し、必要に応じてコードブロックやディレクトリ構造の例を示します。

1. TerraformモジュールとFacadeパターンの概要

Facadeパターンとは、内部で複数のコンポーネント（ここではAWSリソースや下位モジュール）を組み合わせて利用する手順を、単一の「窓口」となるインターフェース（モジュール）によってシンプルに提供するデザインパターンです ￼。TerraformにおいてFacadeパターンを適用する場合、複数の下位モジュールを内部で呼び出す**上位のモジュール（Facadeモジュール）**を作成し、利用者（例えば環境ごとの設定コード）はそのFacadeモジュールを1回呼び出すだけで一連のインフラリソースを構築できるようにします。

例えば、VPCやサブネット、セキュリティグループなどネットワーク関連リソースをまとめて作るネットワークFacadeモジュールや、ECSクラスター・サービス・関連IAMロール・ALBなどをまとめて構築するアプリケーションFacadeモジュールを作成できます。Facadeモジュールは内部で複数のAWSリソースや他のモジュールを生成しますが、外部にはシンプルな入力変数と出力だけを公開します。これにより、利用者は詳細を意識せず高レベルなパラメータ（例: 環境名や必要な容量など）を指定するだけで、複雑なインフラを一度に構築できます。

メリット: Facadeパターンを用いることで、モジュール利用者はインフラ構成の詳細を意識せず簡潔にデプロイできます。また共通の設定やベストプラクティスをFacadeモジュール内に隠蔽できるため、一貫性のある構成を強制しやすくなります。

注意点: Terraformモジュール設計においては、モジュールの過度なネストは一般にアンチパターンとされています ￼ ￼。特に汎用的に再利用したいモジュールに他のモジュールを内包してしまうと、あるモジュールだけを使いたい場合にも不要なリソースが付随してしまったり、内部の値を外部に出すための入出力が肥大化したりしてモジュールの再利用性が下がります ￼。そのため、複数のモジュールを一つにまとめるFacadeモジュールを作る場合は、その組み合わせが論理的に一まとまりであり、かつ単独で他から参照されることが無いケースに留めるのが望ましいです ￼。例えばKubernetesクラスタの各ノード構築モジュールをクラスタモジュール内でネストするのは妥当ですが、ネットワークモジュールやデータベースモジュールまで内包してしまうと単一責任の原則に反し避けるべきです ￼ ￼。

つまり、Facadeモジュールは特定の用途に特化したグルーピングに使い、汎用モジュール同士の依存は可能な限りルート（環境ごとの設定）でフラットに管理するのがベストプラクティスです ￼。Terraform公式も「各サブシステム（モジュール）は独立した構成とバックエンドを持つべきで、ワークスペースだけで分離しようとすべきではない」と述べています ￼。その方針に則り、本ガイドでは環境ごとのルートから各モジュールを呼び出す構成を基本としつつ、必要に応じてFacade的な上位モジュールを設計するアプローチを解説します。

2. 各サービス用モジュールの粒度と分割例

中規模アプリケーションのインフラ構成をTerraformでモジュール化する際は、サービスや機能ごとにモジュールを分割し、各モジュールが複数のリソースからなる意味のある単位になるよう設計します。1つのリソースだけを内包する薄いモジュールは避け、複数リソースをまとめて始めて価値がある単位でモジュール化するのがポイントです ￼。以下に、挙げられた各サービスに対応するモジュールの例とその内容を示します。
	•	VPCモジュール: VPCおよび関連するネットワークリソースを構築します。例えばVPC本体、複数のパブリック/プライベートサブネット、インターネットゲートウェイ、ルートテーブル、NATゲートウェイなどをまとめます。一つのVPCモジュール内でこれらを作成し、必要なIDやサブネットリストを出力します。こうすることで、他のモジュール（ECSやRDSなど）がVPCモジュールの出力を参照してサブネットID等を取得できるようになります。VPCモジュールの変数には、CIDRブロックやAZの数、サブネットのCIDRリスト、DNSオプションフラグ、共通のタグ設定などを持たせます。例えば以下のようにVPCとサブネットを定義し、projectやenvironmentを用いてネーミングに反映する実装が考えられます。

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = var.enable_dns_hostnames
  enable_dns_support   = var.enable_dns_support

  tags = merge(
    { Name = "${var.project}-${var.environment}-vpc" },
    var.tags
  )
}

resource "aws_subnet" "public" {
  count             = length(var.public_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.public_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(
    { Name = "${var.project}-${var.environment}-public-${count.index + 1}" },
    var.tags
  )
}
``` [oai_citation:10‡dexall.co.jp](https://dexall.co.jp/articles/?p=2269#:~:text=,enable_dns_support)

*補足:* 上記では`tags`に環境名やプロジェクト名を含めています。各リソースに環境識別できるタグ（例えばNameタグに`${環境名}-...`を付与）を付けることは、本番・開発環境のリソース混在を防ぎ運用管理しやすくするベストプラクティスです。


	•	ECS Fargateモジュール: コンテナ用のECSクラスタおよびサービス、関連リソースを構築します。典型的には、ECSクラスター、タスク定義、サービス（Fargateタイプ）、そしてサービスを外部公開する場合はALB（Application Load Balancer）やターゲットグループ、リスナーもこのモジュールで作成します。またECSタスク実行ロールやタスクロールなどの必要なIAMロールも内部で作成可能です。モジュール入力にはクラスター名、タスク定義のパラメータ（イメージ、CPU/メモリ、環境変数など）、必要ならデプロイ台数、ポート番号、ALB用のドメイン名や証明書ARNなどを渡す設計です。もしWeb用とApp用に別々のサービスがある場合は、ECSサービス単位でモジュール化することも考えられますが、ここでは単一アプリケーションを想定して1つのECSモジュールでクラスタとサービスをまとめて扱う例とします。
	•	RDSモジュール: Amazon RDSのデータベースインスタンスを構築します。内容としては、DBサブネットグループ（先のVPCモジュールから出力されたサブネットIDを利用）、パラメータグループ（必要に応じて）、セキュリティグループ（データベース用のインバウンド規則付き）、そしてRDSインスタンス本体を作成します。モジュール変数としてDBエンジンの種類・バージョン、インスタンスタイプ、マルチAZ可否、ストレージ容量、マスターユーザやパスワード、バックアップ保持期間などを受け付けます。出力としてDBのエンドポイントや識別子、セキュリティグループIDなどを返します。
	•	ElastiCacheモジュール: キャッシュサーバ（例: Redis or Memcached）用にElastiCacheクラスタ（またはリプリケーショングループ）を構築します。キャッシュサブネットグループを作成し（これもVPCモジュールの出力するサブネットを利用）、セキュリティグループを設定、ElastiCacheクラスタ/レプリケーショングループ本体をデプロイします。変数にはノードタイプ（例: cache.t3.microなど）、ノード数、エンジン（redis/memcached）、自動バックアップ設定（Redisの場合）等を含めます。出力はエンドポイントやポート、場合によってはプライマリエンドポイントなど。
	•	CloudFrontモジュール: グローバルなCloudFrontディストリビューションを作成します。オリジンとなるバックエンドを指定し（例えばALBのドメイン名やS3バケットなど）、必要であればACM証明書（カスタムドメインを使う場合）も関連付けます。CloudFrontディストリビューションの設定（キャッシュポリシー、オリジンプロトコル、デフォルトルートオブジェクト、価格クラスなど）を内部で定義します。WAFとの連携については、CloudFrontにWAFのWebACLを関連付けることができるため、WAFモジュールで作成したWebACLのARNをこのCloudFrontモジュールに渡す設計にします（またはCloudFrontとWAFを一体化したFacadeモジュールにする方法もあります）。
	•	WAFモジュール: AWS WAF (v2) のWebACLとルールセットを構築します。例えば特定のIP許可/ブロック、レートリミット、AWSマネージドルールセットの適用などをルールとして定義したWebACLを作成し、そのARNを出力します。WAFはCloudFrontやALBに関連付けて使うため、CloudFrontモジュールやALB設定でこのARNを参照できるようにします。モジュール変数にはWAFを適用するスコープ（CloudFront用のグローバルかリージョンか）、適用するルールの種類やカスタムルールの設定値などを取ります。
	•	SESモジュール: SES(Amazon Simple Email Service)自体はAWSマネージドサービスですが、TerraformでSESの設定をコード化できます。例えば送信ドメインの検証（Identityの作成）やDKIM有効化、受信ルールセットの構築、あるいはコンタクトリストやコンフィギュレーションセットの設定などが考えられます。シンプルな例ではSES用のドメイン認証をTerraformに含め、必要なDNSレコードをRoute53に登録する処理もモジュールに含めます。SESは他のリソースとの依存が薄いですが、アプリケーションからメール送信を行うための認証情報（SMTPクレデンシャル）取得や送信上限解放の設定など、インフラとして準備すべき事項があればTerraform化しておくとよいでしょう。

以上のように各サービスごとにモジュールを分割し、各モジュール内部では関連する複数のAWSリソースをまとめて管理します。この粒度の設計により、例えば「VPC構築処理を変更/拡張したい」といった場合でもVPCモジュールだけを修正すれば済み、他モジュールへの影響が限定されます。また不要になればそのモジュール呼び出しを削除するだけで関連リソース群をまるごと削除できるため、メンテナンス性が高まります。

モジュールディレクトリ構成例:
プロジェクト内でモジュールを扱う場合、一般的にTerraformコードリポジトリ内にmodules/ディレクトリを作り、その配下に各モジュール用のサブディレクトリを配置します。各モジュールディレクトリには、main.tf（リソース定義）, variables.tf（入力変数定義）, outputs.tf（出力値定義）, README.md（モジュールの説明）の4ファイルを置くのが標準的です ￼ ￼。例えば本ケースに対応するモジュール構成は以下のようになります。

modules/
├── vpc/
│   ├── main.tf          # VPC, Subnet, IGW, NATなどの定義
│   ├── variables.tf     # VPCモジュールが受け取る変数 (CIDRやAZ数など)
│   ├── outputs.tf       # VPC IDやSubnet IDs等の出力
│   └── README.md        # モジュール利用方法ドキュメント
├── ecs_fargate/
│   ├── main.tf          # ECSクラスタ、サービス、ALBなどの定義
│   ├── variables.tf     # ECSタスク数やコンテナ設定などの入力
│   ├── outputs.tf       # ALBのDNS名やサービスのARNなど
│   └── README.md
├── rds/
│   ├── main.tf          # DB Subnet Group, Security Group, RDSインスタンス
│   ├── variables.tf
│   ├── outputs.tf
│   └── README.md
├── elasticache/
│   ├── main.tf          # ElastiCacheクラスタおよび関連リソース
│   ├── variables.tf
│   ├── outputs.tf
│   └── README.md
├── cloudfront/
│   ├── main.tf          # CloudFrontディストリビューション定義
│   ├── variables.tf
│   ├── outputs.tf
│   └── README.md
└── waf/
    ├── main.tf          # WAF WebACLとルール定義
    ├── variables.tf
    ├── outputs.tf
    └── README.md

￼

各モジュールのREADME.mdには、モジュールの用途や利用方法（入力変数とその説明、出力値と説明）を記載しておくと、他の開発者が再利用する際に助けになります ￼ ￼。また、モジュールの再利用性を高めるため、変数にはデフォルト値を適切に設定したり、optional属性やvalidationルールを用いて無効な入力を防ぐ仕組みを組み込むと良いでしょう ￼ ￼。

3. 環境別(dev/staging/prod)のディレクトリ構成ベストプラクティス

開発・ステージング・本番といった複数環境をTerraformで管理する場合、環境ごとにディレクトリを分割する方法が一般的でわかりやすいとされています ￼ ￼。環境ごとに独立した構成ディレクトリとTerraform状態管理を持たせることで、環境をまたいだ誤適用を防ぎ、また環境間差分を明確にできます。例えば以下のようなディレクトリ構成です。

environments/
├── production/
│   ├── main.tf            # 本番環境用のTerraform設定（モジュール呼び出し等）
│   └── terraform.tfvars   # 本番環境特有の変数値（例：容量やスケール値）
├── staging/
│   ├── main.tf            # ステージング環境用設定
│   └── terraform.tfvars   # ステージング固有の変数値
└── dev/
    ├── main.tf            # 開発環境用設定
    └── terraform.tfvars   # 開発環境固有の変数値

￼

上記ではenvironments/以下に環境別のフォルダを作り、それぞれにTerraformのエントリポイントとなるmain.tfと環境固有の変数値を定義するterraform.tfvarsを配置しています。**各環境のmain.tf**には、先述の各サービスモジュールを使ってその環境のインフラを構築するためのモジュール呼び出しを記述します。例えばenvironments/dev/main.tfでは、開発環境用にモジュールを参照し、必要な変数（環境名やリソースサイズなど）を指定します。環境ごとの違い（例えばインスタンスタイプやノード数）はterraform.tfvarsに記載し、共通部分はmain.tf内で直接指定するか変数定義で共通化します。

（例）開発環境main.tfのイメージ:

# 開発環境用のVPC構築
module "vpc" {
  source = "../../modules/vpc"
  project     = "myapp"
  environment = "dev"
  vpc_cidr    = "10.0.0.0/16"
  # ...必要に応じて他の変数
}

# 開発環境用のRDS構築（VPCモジュールの出力を利用）
module "rds" {
  source = "../../modules/rds"
  environment    = "dev"
  db_name        = var.db_name
  subnet_ids     = module.vpc.private_subnet_ids  # VPCの出力を参照
  vpc_id         = module.vpc.vpc_id              # 暗黙的にVPCへ依存
  instance_class = "db.t3.micro"
  # ...その他RDSパラメータ（パスワード等は tfvarsで管理）
}

各環境のterraform.tfvarsには、var.db_nameやvar.db_password等、その環境固有の値を設定します。Terraformはディレクトリ内にterraform.tfvarsという名前のファイルがあれば自動的に読み込みます ￼ ￼。例えばenvironments/dev/terraform.tfvarsには開発用のDB名やパスワード、ECSサービスのデプロイ数、SESのテスト用送信先メールアドレス等、環境に固有の設定値を記述できます。同様にstaging/terraform.tfvarsやproduction/terraform.tfvarsにはそれぞれの環境固有値を定義します。

この環境フォルダ分離構成のメリットは、Terraformのコード上に環境の境界が明示されることです ￼。開発環境用の設定はenvironments/dev以下にまとまっており、本番とは明確にフォルダが分かれているため、誤って本番環境に対して開発の変更を適用してしまうリスクが低減します。また、チームで作業する際にも「どのフォルダを変更すればどの環境に影響するか」が直感的に理解できます。

トレードオフ: ディレクトリを環境ごとに分けると一部コードの重複が発生する可能性があります ￼。たとえば各環境のmain.tfで似たようなモジュール呼び出しを記述するため、コードが冗長になる面は否めません。しかし、その代わりに環境ごとに完全に独立した状態管理と構成を持てるため、Terraformの状態ファイルや変数を安全に分離でき、環境間の干渉や設定ミスを防げます ￼ ￼。規模が大きくなり重複が気になる場合は、後述するようにTerragruntなどのツールで共通部分をテンプレート化する方法もありますが、まずはシンプルなディレクトリ分離が理解しやすく事故も起きにくい方法です。

備考: ディレクトリ名については、上記例ではenvironmentsとしましたが、プロジェクトによってはenvやenvs、あるいはGruntwork社の標準に倣ってliveディレクトリとすることもあります ￼。どの名称でも構いませんが、全社横断で共通リソースがある場合（例: 全環境共通のIAMユーザやログ集約用S3バケットなど）は、それらを配置する場所も考慮すると良いでしょう（commonディレクトリを用意する、live/globalを作る等）。

4. モジュール間の依存関係とFacadeモジュール内での扱い

Terraformでは、リソース間・モジュール間の依存関係はリソース属性参照によって自動的に解決されます。具体的には「あるモジュールの出力値」を別のモジュールの入力に渡した場合、Terraformはその参照を解析して適切な順序でリソースを作成します。したがって、モジュール間の依存管理は**「前段モジュールのOutputを後段モジュールのInputに渡す」**という方法で行うのが基本です ￼。Terraformの子モジュールは必要な値をoutputでエクスポートし、呼び出し元（親）モジュール側でmodule.<モジュール名>.<output名>というシンタックスで参照できます ￼。例えば、VPCモジュールがvpc_idというoutputを定義していれば、RDSモジュールの設定で vpc_id = module.vpc.vpc_id のように記述できます。この参照により、TerraformはRDSモジュール内のリソースを作成する前にVPCモジュールのリソース（VPC本体）が存在することを保証します。

前章の例でも示したように、moduleブロック内で他モジュールの出力を参照することで、Terraformは暗黙的に依存関係を解決します。以下に簡単な例を示します。

module "vpc" {
  source = "../../modules/vpc"
  # ...（VPCに必要な変数）
}

module "ecs" {
  source = "../../modules/ecs_fargate"
  vpc_id          = module.vpc.vpc_id            # VPCモジュールの出力を参照
  public_subnets  = module.vpc.public_subnet_ids # これによりECSはVPC作成後に実行される
  # ...（ECSサービスに必要な他の変数）
}

上記のようにmodule.vpc.public_subnet_idsを参照している限り、ECSモジュール内で利用するサブネットIDsはVPCモジュールが作成して出力したものになります。この参照関係そのものがTerraformにとっての依存グラフとなり、module.vpcの完了→module.ecsの適用という順序が守られます。

Facadeモジュール内での依存処理: もしFacadeパターンを適用し、1つの上位モジュール内で複数の下位モジュールを呼び出す場合も、基本的な考え方は同じです。Facadeモジュールのmain.tf内で子モジュール同士の入力出力を繋げます。例えば、ある**「スタック全体」を構築するFacadeモジュール**を作り、その中でまずVPCモジュールを呼び、次にECSやRDSモジュールを呼ぶようにします。この際、Facadeモジュール内でmodule "vpc"→module "ecs"の順に定義し、ECSモジュールの引数にvpc_id = module.vpc.vpc_idを渡せば、Facadeモジュール内でも依存関係が解決されます。Facadeモジュール自体の出力として、必要に応じて内部の子モジュールの出力をさらに上位（環境側）に公開することもできます。例えばFacadeモジュール内でoutput "alb_dns" { value = module.ecs.alb_dns_name }のように書けば、環境側からmodule.app_stack.alb_dnsと参照することができます。

depends_onの利用: 通常は上記のような出力参照で十分ですが、まれに「明示的な依存指定」が必要なケースもあります。Terraformではモジュール呼び出しにもdepends_onメタ引数を指定可能です ￼。例えば、CloudFrontとWAFを別モジュールにした場合、CloudFrontディストリビューション作成時にWAFのWebACL ARNを関連付ける必要があります。このときCloudFrontモジュールにdepends_on = [module.waf]と指定することで、参照がなくてもWAFモジュールの完了を待ってからCloudFrontが実行されるよう強制できます。ただし、可能な限りdepends_onに頼らず、出力を介した依存解決を使う方がTerraformの状態管理上も安全です ￼（実際にARNを引数で渡す形にすればdepends_on不要）。depends_onは循環参照を避ける必要がある場合やどうしても値の受け渡しができない論理的な依存に限り使う、と心得ておくとよいでしょう。

環境間の依存: なお、本構成では各環境（dev/staging/prod）が完全に独立してTerraformを実行し、状態も分かれます。したがって環境を跨いだ依存（例: 開発環境の何かが本番に影響する）は基本ありません。もし「ある環境共通のリソース」（例えば全環境から参照する単一のSNSトピックなど）がある場合、それは別途共通リソース用のモジュール・ディレクトリを作り、個別にTerraformを適用するか、Terraform Cloudなどの別Workspaceとして管理します。1つのterraform applyは1つの環境に閉じるように運用するのが安全です ￼ ￼。

Terraform CloudやリモートStateとの関係: Module間の依存解決自体はTerraformエンジンが行いますが、状態管理においてリモートバックエンドを使うかどうかが関係します。詳細は後述しますが、基本的には環境ごとに別個の状態ファイルを保持するために、バックエンド設定も環境ごとに分ける必要があります ￼ ￼。Terraform CloudのWorkspaceを環境別に用いる場合は、それぞれが独立した状態を持つためこの点は自動的に担保されます。

5. 実践ハンズオン例：コード構成とコマンド実行

以上の構成を踏まえ、実際にTerraformプロジェクトをセットアップする手順の一例を示します。まず、ファイル/ディレクトリ構成は前章までで述べた通りです。ここでは**開発環境(dev)**を例に、具体的なコードとTerraformコマンドの使用例を紹介します。

ディレクトリ構成再掲: （簡略化のため一部のみ記載）

my-terraform-project/
├── modules/
│   ├── vpc/ ...         # VPCモジュール（main.tf, variables.tf, outputs.tf など）
│   ├── ecs_fargate/ ... # ECS Fargateモジュール
│   ├── rds/ ...         # RDSモジュール
│   └── ...              # その他 CloudFront, WAF, ElastiCache, SESモジュール
└── environments/
    ├── dev/
    │   ├── main.tf          # 開発環境用モジュール呼び出し定義
    │   └── terraform.tfvars # 開発環境固有の変数値
    ├── staging/
    │   └── ...（同様の構成）
    └── production/
        └── ...（同様の構成）

開発環境のmain.tfの内容例:

# 開発環境の全インフラを一括構築するFacadeモジュール呼び出し
module "dev_stack" {
  source = "../../modules/app_stack"    # 例えば app_stack というFacadeモジュール
  environment = "dev"
  project     = "myapp"
  # → このFacadeモジュール内部で module.vpc, module.ecs, module.rds 等を呼び出す
  #    必要に応じて環境固有の設定を変数で渡す（無指定ならデフォルト値適用）
}

上記では、開発環境用に「app_stack」というFacadeモジュールをまとめて呼び出しています。Facadeモジュールapp_stack側では、内部で先述の各サービス個別モジュール（vpc, ecs_fargate, rds, etc.）を適切な順序で呼び出し、それぞれの出力を取りまとめて必要なものを外に出す設計になっているとします。もちろん、Facadeを使わず環境main.tf上で複数モジュールをフラットに呼ぶ構成でも問題ありません（その場合、4章の例のようにmodule間で値を渡す）。

terraform.tfvarsの例（dev環境）:

# environments/dev/terraform.tfvars
db_name       = "myapp_dev"           # RDSのDB名（本番では "myapp" など）
db_password   = "dev-secret-pw"       # 機密情報は必要に応じて別管理
instance_type = "t3.small"            # ECSやRDSで利用するインスタンスタイプを小さめに
min_capacity  = 1                     # Autoscaling最小キャパ（例：ECSタスク数など）
max_capacity  = 2                     # Autoscaling最大キャパ

上記のように、開発環境ではスケールを落とすためのパラメータを指定しています。本番環境用のproduction/terraform.tfvarsではinstance_type = "t3.medium"やmin_capacity = 2, max_capacity = 10など、より大きく設定するでしょう。このようにtfvarsファイルを変えるだけで環境ごとの差分を適用できるように、モジュールの変数設計やデフォルト値を工夫します。また、モジュール内で環境名によって挙動を変えることも可能です。例えばオートスケーリング設定を環境ごとに変えたい場合、モジュール内で以下のようなlocalsを定義し環境ごとのマップから値を参照すると、環境名（var.environment）だけ渡せば適切な値を選択できます ￼ ￼。

locals {
  environment_config = {
    production = { instance_type = "t3.medium", min_size = 2, max_size = 10 },
    staging    = { instance_type = "t3.small",  min_size = 1, max_size = 5 },
    dev        = { instance_type = "t3.micro",  min_size = 1, max_size = 3 }
  }
  current = local.environment_config[var.environment]
}

resource "aws_autoscaling_group" "this" {
  # ...省略...
  min_size     = local.current.min_size
  max_size     = local.current.max_size
  instance_type = local.current.instance_type
}

上記のようなパターンを用いると、環境名を渡すだけでモジュール内部でサイズなどを切り替えられます。ただし、環境ごとに大きく構成が異なる場合は、無理に内部で条件分岐するより別々の値を与えるか、場合によっては別モジュールに分けた方が見通しが良くなることもあります。

Terraformコマンド実行例:
環境ごとにディレクトリを分けた場合、Terraformコマンドは各環境ディレクトリに移動してから実行します ￼。例えば開発環境をデプロイするには:

# 開発環境ディレクトリへ移動
$ cd environments/dev

# プロバイダやモジュールを初期化
$ terraform init

# 実行プランの表示（tfvarsは自動読み込みされる）
$ terraform plan

# 適用の実行（対話的に確認してYesを入力）
$ terraform apply

￼

同様に、ステージング環境はcd environments/stagingしてterraform init→plan→applyを行い、本番環境はenvironments/productionで実行します。各環境で別々にterraform initをすることで、それぞれのディレクトリに.terraformフォルダ（プロバイダプラグインなどのキャッシュ）とterraform.tfstate（状態ファイル）が作成されます。状態ファイル(tfstate)は環境ごとに分離されているため、例えば開発環境のapplyによって本番環境のリソースが変更されることはありません ￼ ￼。

注意: 誤って別環境のディレクトリでapplyしないように、Terraform CloudのWorkspaceやCI/CDのジョブを活用して自動化すると安心です。またTerraformの実行計画は念入りに確認し、適用対象のAWSアカウントや環境タグをチェックする運用を徹底しましょう。

6. その他の事例・ベストプラクティス・注意点

最後に、Terraformモジュール活用やマルチ環境管理に関するその他のベストプラクティスや注意点をいくつか紹介します。Terraform Cloudの活用やリモートバックエンド設定、モジュールのバージョン管理についても触れます。
	•	リモートバックエンドの活用: 複数人でTerraformを運用する場合、状態ファイルをローカルに置くのではなくリモートバックエンドに保存することが推奨されます。リモートバックエンドとは、状態ファイル(tfstate)をクラウド上の安全な場所に保管し、かつTerraformコマンド実行時に状態ロックやバージョン管理を提供する仕組みです ￼ ￼。AWSなら一般的にS3バケット + DynamoDBロックを用いるか、HashiCorpのTerraform Cloud/Enterpriseをバックエンドとして使用します ￼。例えば、本番用にはbackend "s3"ブロックで専用のバケットとキーを指定し、開発用には別バケット（または別プレフィックスのキー）を指定することで、環境間で状態データを分離します（Terraformの設定上、CLIワークスペースでは単一バックエンドしか指定できないため、環境ごとにバックエンドごと分けるこの方法が推奨されます ￼ ￼）。Terraform Cloudを使う場合は、各環境ごとにWorkspaceを作成すれば自動的に状態は分離され、かつ競合防止のロックや暗号化も管理してくれます。
	•	Terraform Cloud / Enterpriseの利用: Terraform Cloudを用いると、状態ファイルの安全な保管だけでなくTerraformの実行自体をクラウド上で行い、計画・適用の履歴管理やチームコラボレーション機能（変更のプルリク駆動、承認ステップ、Sentinelポリシーチェック等）を享受できます。小規模チームなら無料枠で十分活用可能です。Terraform CloudではWorkspaceという単位で環境やモジュールを分離します。Workspaceごとに異なる変数やクレデンシャルを設定できるため、ディレクトリ分割と組み合わせて、例えばdev用Workspaceにはenvironments/devディレクトリを接続し、prod用Workspaceにはenvironments/productionを接続するといった運用が可能です。このようにすると、Terraform Cloud上で環境ごとに明確に状態と実行を分離できます。
	•	モジュールのバージョン管理: モジュールを社内で再利用する場合、モジュールのバージョン管理とリリース手法を決めておくことが大切です。開発初期は一つのリポジトリで環境定義とモジュールを一緒に管理（modulesディレクトリを同居）しても良いですが、環境が増えチーム開発になるとモジュールは別リポジトリに切り出してバージョンタグを付ける運用が望ましいです ￼。例えば、GitHub上にterraform-aws-vpc等のモジュールリポジトリを作り、バージョン1.0.0でタグ付けしてリリースしたら、環境のコード側では以下のように参照します。

module "vpc" {
  source  = "git::https://github.com/your-org/terraform-modules.git//modules/vpc?ref=v1.0.0"
  # ...変数定義...
}
``` [oai_citation:48‡dexall.co.jp](https://dexall.co.jp/articles/?p=2269#:~:text=1)

上記のように`?ref=v1.0.0`で特定バージョンを指定することで、本番環境では安定版のv1.0.0を指しつつ、開発環境ではモジュール改修時に一時的にブランチ参照する、という運用も可能です [oai_citation:49‡medium.com](https://medium.com/@AaronKalair/terraform-module-patterns-4ba2996f0b96#:~:text=%60source%20%3D%20) [oai_citation:50‡medium.com](https://medium.com/@AaronKalair/terraform-module-patterns-4ba2996f0b96#:~:text=We%20initially%20switched%20from%20Git,manually%20control%20any%20version%20bumps)。Terraform Module Registry（Terraform Cloudが提供するプライベートモジュールレジストリやTerraform Public Registry）を利用すればバージョン管理がより簡潔になります。例えば`source = "<YOUR_ORG>/vpc/aws"`のように書き、`version = "~> 1.1.0"`と指定すれば、1.1系の最新マイナーバージョンを自動取得する、といった運用も可能です [oai_citation:51‡medium.com](https://medium.com/@AaronKalair/terraform-module-patterns-4ba2996f0b96#:~:text=It%E2%80%99s%20free%20for%205%20users,paid%20plans%20for%20additional%20users)。ただし、Registryは公開前にローカルでの動作確認が難しい点や、モジュールがprivateの場合の認証設定など考慮が必要です [oai_citation:52‡medium.com](https://medium.com/@AaronKalair/terraform-module-patterns-4ba2996f0b96#:~:text=builds%20a%20reference%20version%20of,or%20we%20hit%20API%20limits)。シンプルにGitのタグ運用で始め、必要に応じてレジストリを使うと良いでしょう。


	•	コードのDRYとTerragrunt: 環境ごとディレクトリを分けるとコード重複が増える問題への対処として、Gruntwork社のTerragruntを使う方法もあります。TerragruntはTerraformのラッパーツールで、HCLで記述した共通設定を各環境に継承させたり、モジュール間依存を明示的に書けたりします。Zennの記事の例では、環境×モジュール単位までディレクトリを細かく分けてステートファイルを独立させる構成も紹介されています ￼ ￼。この場合、Terraform単体ではモジュール間の値受け渡しが別State間ではできないため、Terragruntのdependency機能等で他モジュールのアウトプットを参照するといった工夫が必要になります ￼。中規模プロジェクトであればまずシンプルな環境ディレクトリ分割＋モジュール分割で十分ですが、将来的に環境やコンポーネントが増えてStateをさらに分割したくなった場合に備えて、Terragruntの採用も検討するとよいでしょう。
	•	運用上の注意点: Terraform運用では以下の点にも注意してください。
	•	Stateファイルのバックアップとロック: リモートバックエンドを使っている場合でも、万一に備え定期的に状態ファイルのバックアップを取ること、またロック機能（S3+DynamoDBやTerraform Cloudが提供）を必ず有効にして複数人同時実行を防ぐこと ￼ ￼。
	•	機密情報の取り扱い: RDSのパスワードやAPIキーなどはTerraformの変数で扱う際にsensitive = trueを指定する、あるいはTerraform Cloudの変数保管機能やAWS Secrets Managerと連携するなどして、コード上に平文で残さないようにします。
	•	Planの確認: terraform planの出力をCIで自動取得し、変更差分をレビューするプロセスを取り入れると、本番環境への影響を事前に把握できます。特に-destroyが含まれていないか、予期せぬリソース変更がないかをチェックすることが重要です。
	•	Lint/Validation: Terraform用のLintツール（tflintやterraform validate）、ポリシーエンジン（SentinelやOpen Policy Agent）を活用し、コードのベストプラクティス違反やセキュリティ上の不備を早期に検出します ￼。例えば「暗号化フラグがfalseのRDS作成を禁止する」などのルールを設けてミスを防ぐことが可能です。
	•	ドキュメントの整備: モジュールREADMEや環境構成のREADMEを整備し、チーム内で共通認識を持てるようにします。特にモジュールはブラックボックス化しがちなので、inputs/outputsの説明や利用例（examplesディレクトリにサンプルコードを置くなど ￼）を用意するとモジュール利用者が助かります。

以上、TerraformによるAWSインフラ構築におけるモジュール分割とFacadeパターン適用のポイントを総合的に解説しました。適切にモジュール化し環境を分離することで、インフラコードの見通しと再利用性が向上し、dev/staging/prod間の不整合も減らせます。Facadeパターンを用いる場合でも、モジュールの責務範囲を明確に定めて設計・実装することで、利用者にとって扱いやすいインターフェースを提供できます。最後に、本ドキュメントで示した構成は一例ですので、自社の要件や運用体制に合わせて柔軟に調整し、Terraformを活用したインフラ自動化を推進してみてください。

参照情報: 本資料の作成にあたっては公式ドキュメントや有識者の記事を参考にしています。モジュール設計のアンチパターンやベストプラクティスはQiita記事 ￼ ￼やHashiCorp公式ガイド ￼、ディレクトリ構成の例はDexall社ブログ ￼やZenn記事 ￼、Terraform Cloudとバックエンド運用についてはGruntwork社ブログ ￼やEnv0ブログ ￼などを参照しました。各種ベストプラクティスの詳細はこれらの出典も併せてご覧ください。