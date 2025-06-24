---
id: 6cd82051-f259-3ede-7688-c40c81a53cb3
title: Terraformをちょっと本格的に触ってみる(ECSデプロイ)
date: 2025-06-25
tags:
  - AWS
  - ECS
  - IaC
  - terraform
---
## Terraformをちょっと本格的に触ってみる
Terraformでちょっと本格的な構成でインフラを構成してみようと思う

### 今回やらないこと
各セットアップは行わない。terraform applyで実際にAWS環境にリソースを配置できる前提で進める。
- AWSのSSOアカウントの用意(最初の権限はほぼフルで与えてOK->あとで絞る)
- AWS CLIのセットアップ
- Terraformのダウンロードとセットアップ
- Pikeの説明とセットアップ(AWSのロール周りが楽なので使う)

妥協ポイント
非推奨ではあるが、今回はIaC対象AWSアカウントの中でS3を使用し、
tfStateファイルを管理することとする。

では早速やっていく。