---
id: "dev_docker"
title: "ブログ開発step1_開発環境構築"
date: "2023-04-02"
tags: ["Next.js"]
---

# Next.jsだけでブログ開発 環境構築編

なんでも雑多にアップできるブログサイトが欲しいなと思いつつ、1年が経過したので、

重い腰を上げてサクッと開発していこうと思う。

コンセプトとしては以下の3点

* 使用技術含め、なるべくシンプルに
* 記事追加もメンテナンスもCI/CDもGitHubを起点にしてデプロイまで行える
* サーバーは不要(ランニングコストは0に近い方が望ましい)

この辺を踏まえると

Next.js(TypeScript)で開発し、GitHubで管理してActionsとVercelでCI/CDすればランニングコストも低く抑えることができる。

あとは自身のPC環境をなるべく汚したくないので、Dokcerで開発環境を構築すれば大体のやりたいことは叶えられるかな？と思い決定した。

ということでまずは開発環境を構築していこうと思う

## 開発環境構築

開発にしか使わないので、マルチステージビルドなど使用せずにシンプルな環境構築とする。

まずは開発ディレクトリを切って、

```bash
docker run --rm -it -v $(pwd):/app node:18-alpine sh
```

使い捨て用のコンテナを起動する。現在のディレクトリは先ほど切った開発ディレクトリとして、コンテナ内の/appディレクトリにマウントする。(こうすることでDockerコンテナ内のappディレクトリとローカルのディレクトリが同期されるようになる)

コンテナ内でNext.jsプロジェクトを作成

```bash
npx create-next-app@latest .
```

これで、ローカルにもファイルが同期されて、Dockerfileとcompose.ymlをかけるようになった


### Dockerfileとdocker-compose.ymlの作成

現状は開発ディレクトリ内にNext.js関係のディレクトリやファイルが存在しているはず。ルートにdockerに関するファイルをローカルから作成する

pwd/dockerfile

```yml
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
```


pwd/docker-compose.yml

```yml
version: "3.8"
services:
  nextjs:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    command: npm run dev
```

これで

```bash
docker compose up --build
```

コマンドを打てば、Next.jsが[http://localhost:3000](https://localhost:3000)で立ち上がるようになる。

```php
$yml = 'string';
```

開発環境編は以上です。
