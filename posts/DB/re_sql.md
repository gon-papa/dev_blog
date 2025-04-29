---
id: 935e7071-1ed5-a934-61f3-2c7789823a2b
title: SQL学び直してみた
date: '2025-04-02'
tags:
  - SQL
---

業務で普段MySQLを使用しているが、PostgreSQLと差分をパッとみたいのと、学び直しも兼ねて記載していく。ただ、飛ばす部分はガッツリ飛ばしてるので注意されたし。
(随時更新してく)
## データベース関連

### データベース一覧表示

#### PostgreSQL:
```sql
\l
```

```sql
user=# \l
                             List of databases
   Name    | Owner | Encoding |  Collate   |   Ctype    | Access privileges
-----------+-------+----------+------------+------------+-------------------
 postgres  | user  | UTF8     | en_US.utf8 | en_US.utf8 |
 shop      | user  | UTF8     | en_US.utf8 | en_US.utf8 |
 template0 | user  | UTF8     | en_US.utf8 | en_US.utf8 | =c/user          +
           |       |          |            |            | user=CTc/user
 template1 | user  | UTF8     | en_US.utf8 | en_US.utf8 | =c/user          +
           |       |          |            |            | user=CTc/user
 user      | user  | UTF8     | en_US.utf8 | en_US.utf8 |
```

#### MySQL:
```sql
SHOW DATABASES;
```

```sql
mysql> SHOW DATABASES;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| performance_schema |
| shop               |
| test               |
+--------------------+
```

### データベース作成

#### 共通:
```sql
CREATE DATABASE AAAA;
```

#### PostgreSQL:
```sql
user=# CREATE DATABASE shop;
CREATE DATABASE
```

#### MySQL:
```sql
mysql> CREATE DATABASE shop;
Query OK, 1 row affected (0.00 sec)
```

### データベースの選択

#### PostgreSQL:
```sql
\c AAAA;
```

```sql
user=# \c shop;
You are now connected to database "shop" as user "user".
shop=#
```

#### MySQL:
```sql
USE AAAA;
```

```sql
mysql> USE shop;
Database changed
```

## テーブル関連

### テーブル一覧表示

#### PostgreSQL:
```sql
\dt
```

```sql
shop=# \dt
 public | shohin | table | user
```

#### MySQL:
```sql
SHOW TABLES;
```

```sql
mysql> SHOW TABLES;
+---------------------+
| Tables_in_shop      |
+---------------------+
| shohin              |
+---------------------+
```

### テーブル作成

#### 共通:
```sql
CREATE TABLE テーブル名 (
    カラム名1 データ型1 [制約],
    カラム名2 データ型2 [制約],
    ...
    PRIMARY KEY (カラム名)
);
```

#### PostgreSQL:
```sql
shop=# CREATE TABLE Shohin
(
    shohin_id     CHAR(4) NOT NULL,
    shohin_mei    VARCHAR(100) NOT NULL,
    shohin_bunrui VARCHAR(32) NOT NULL,
    hanbai_tanka  INTEGER,
    shiire_tanka  INTEGER,
    torokubi      DATE,
    PRIMARY KEY (shohin_id)
);
CREATE TABLE
```

#### MySQL:
```sql
mysql> CREATE TABLE Shohin
    (
        shohin_id     CHAR(4) NOT NULL,
        shohin_mei    VARCHAR(100) NOT NULL,
        shohin_bunrui VARCHAR(32) NOT NULL,
        hanbai_tanka  INTEGER,
        shiire_tanka  INTEGER,
        torokubi      DATE,
        PRIMARY KEY (shohin_id)
    );
Query OK, 0 rows affected (0.01 sec)
```

### テーブル削除

#### 共通:
```sql
DROP TABLE テーブル名;
```

#### PostgreSQL:
```sql
shop=# DROP TABLE shohin;
DROP TABLE
```

#### MySQL:
```sql
mysql> DROP TABLE shohin;
Query OK, 0 rows affected (0.01 sec)
```

### カラム追加

#### 共通:
```sql
ALTER TABLE テーブル名 ADD COLUMN カラム名 データ型;
```

#### PostgreSQL:
```sql
shop=# ALTER TABLE shohin ADD COLUMN shohin_mei_kana VARCHAR(100);
ALTER TABLE
```

#### MySQL:
```sql
mysql> ALTER TABLE shohin ADD COLUMN shohin_mei_kana VARCHAR(100);
Query OK, 0 rows affected (0.01 sec)
```

### カラム削除

#### 共通:
```sql
ALTER TABLE テーブル名 DROP COLUMN カラム名;
```

#### PostgreSQL:
```sql
shop=# ALTER TABLE shohin DROP COLUMN shohin_mei_kana;
ALTER TABLE
```

#### MySQL:
```sql
mysql> ALTER TABLE shohin DROP COLUMN shohin_mei_kana;
Query OK, 0 rows affected (0.01 sec)
```

### テーブル定義の確認

#### PostgreSQL:
```sql
\d テーブル名
```

```sql
shop=# \d shohin
 shohin_id       | character(4)           |           | not null |
 shohin_mei      | character varying(100) |           | not null |
 shohin_bunrui   | character varying(32)  |           | not null |
 hanbai_tanka    | integer                |           |          |
 shiire_tanka    | integer                |           |          |
 torokubi        | date                   |           |          |
 shohin_mei_kana | character varying(100) |           |          |
```

#### MySQL:
```sql
DESCRIBE テーブル名;
```

```sql
mysql> DESCRIBE shohin;
+----------------+---------------------+------+-----+---------+-------+
| Field          | Type                | Null | Key | Default | Extra |
+----------------+---------------------+------+-----+---------+-------+
| shohin_id      | char(4)             | NO   | PRI | NULL    |       |
| shohin_mei     | varchar(100)        | NO   |     | NULL    |       |
| shohin_bunrui  | varchar(32)         | NO   |     | NULL    |       |
| hanbai_tanka   | int(11)             | YES  |     | NULL    |       |
| shiire_tanka   | int(11)             | YES  |     | NULL    |       |
| torokubi       | date                | YES  |     | NULL    |       |
| shohin_mei_kana| varchar(100)        | YES  |     | NULL    |       |
+----------------+---------------------+------+-----+---------+-------+
```

### SQLでのテーブル定義確認

#### 共通:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'テーブル名';
```

#### PostgreSQL:
```sql
shop=# SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'shohin';
 hanbai_tanka    | integer           | YES
 shiire_tanka    | integer           | YES
 torokubi        | date              | YES
 shohin_id       | character         | NO
 shohin_mei_kana | character varying | YES
 shohin_mei      | character varying | NO
 shohin_bunrui   | character varying | NO
```

#### MySQL:
```sql
mysql> SELECT column_name, data_type, is_nullable
    -> FROM information_schema.columns
    -> WHERE table_name = 'shohin';
+----------------+---------------------+------------+
| column_name    | data_type            | is_nullable|
+----------------+---------------------+------------+
| shohin_id      | char                 | NO         |
| shohin_mei     | varchar              | NO         |
| shohin_bunrui  | varchar              | NO         |
| hanbai_tanka   | int                  | YES        |
| shiire_tanka   | int                  | YES        |
| torokubi       | date                 | YES        |
| shohin_mei_kana| varchar              | YES        |
+----------------+---------------------+------------+
```

### データ挿入

#### 共通:
```sql
INSERT INTO テーブル名 (カラム1, カラム2, ...) VALUES 
(値1, 値2, ...), 
(値1, 値2, ...), 
...;
```

#### PostgreSQL:
```sql
shop=# BEGIN TRANSACTION;
INSERT INTO Shohin (shohin_id, shohin_mei, shohin_bunrui, hanbai_tanka, shiire_tanka, torokubi) VALUES 
('0001', 'Tシャツ', '衣服', 1000, 500, '2009-09-20'),
('0002', '穴あけパンチ', '事務用品', 500, 320, '2009-09-11'),
('0003', 'カッターシャツ', '衣服', 4000, 2800, NULL),
('0004', '包丁', 'キッチン用品', 3000, 2800, '2009-09-20'),
('0005', '圧力鍋', 'キッチン用品', 6800, 5000, '2009-01-15'),
('0006', 'フォーク', 'キッチン用品', 500, NULL, '2009-09-20'),
('0007', 'おろしがね', 'キッチン用品', 880, 790, '2008-04-28'),
('0008', 'ボールペン', '事務用品', 100, NULL, '2009-11-11');
COMMIT;
```

#### MySQL:
```sql
START TRANSACTION;
INSERT INTO Shohin (shohin_id, shohin_mei, shohin_bunrui, hanbai_tanka, shiire_tanka, torokubi) VALUES 
('0001', 'Tシャツ', '衣服', 1000, 500, '2009-09-20'),
('0002', '穴あけパンチ', '事務用品', 500, 320, '2009-09-11'),
('0003', 'カッターシャツ', '衣服', 4000, 2800, NULL),
('0004', '包丁', 'キッチン用品', 3000, 2800, '2009-09-20'),
('0005', '圧力鍋', 'キッチン用品', 6800, 5000, '2009-01-15'),
('0006', 'フォーク', 'キッチン用品', 500, NULL, '2009-09-20'),
('0007', 'おろしがね', 'キッチン用品', 880, 790, '2008-04-28'),
('0008', 'ボールペン', '事務用品', 100, NULL, '2009-11-11');
COMMIT;
```

### トランザクション

#### 共通:
- **開始**: `BEGIN` (PostgreSQL) または `START TRANSACTION` (MySQL)
- **コミット**: `COMMIT`
- **ロールバック**: `ROLLBACK`

### DISTINCT
重複行を省くことができる
値の種類を知りたい場合や集計関数などと併用したりもする

#### 共通:
```sql
SELECT DISTINCT カラム名 FROM テーブル名;
```

#### PostgreSQL:
```sql
shop=# select DISTINCT shiire_tanka from shohin;
                -- nullも1種類のデータとして扱われる
          320
          500
         2800
         5000
          790
```

### 算術演算子とNull
`+ - * /`の
算術演算子を使用する場合にはnullと計算すると、結果は全てnullとみなされる。

#### PostgreSQL:
```sql
shop=# select (100 + 3) as keisan;
    103

shop=# select (100 + 3) * null as keisan;
        -- nullなので表示されない
```
その場合はnullを`COALESCE`を使ってnullを置き換えてやればいい。/
`COALESCE`の引数は可変調で左から順に引数を確認してnullでない値を返す関数である。
下記はあまり意味がないが、実際のレコード内にいる場合は置き換えて正しい結果を取得できるようにすることができる。
```sql
shop=# select (100 + 3) * COALESCE(NULL, 1) AS keisan;
    103
```

### 比較演算子
比較演算子はnullを使用できないため、結果から省かれる。\
使用したい場合は`IS NULL`や`IS NOT NULL`を使用すること

| 演算子    | 説明                                    | 例                             |
|-----------|-----------------------------------------|--------------------------------|
| `=`       | 2つの値が等しいかどうかを比較           | `SELECT * FROM table WHERE col = 1;` |
| `<>` または `!=` | 2つの値が等しくないかどうかを比較 | `SELECT * FROM table WHERE col <> 1;` |
| `>`       | 左側の値が右側の値より大きいかを比較     | `SELECT * FROM table WHERE col > 10;` |
| `<`       | 左側の値が右側の値より小さいかを比較     | `SELECT * FROM table WHERE col < 10;` |
| `>=`      | 左側の値が右側の値以上かを比較           | `SELECT * FROM table WHERE col >= 10;` |
| `<=`      | 左側の値が右側の値以下かを比較           | `SELECT * FROM table WHERE col <= 10;` |

### SQLの論理演算子

SQLの論理演算子は、条件を組み合わせたり、条件の結果を論理的に操作するために使用される。主な論理演算子は以下の通りである。

| 演算子   | 説明                                                                          | 例                                      |
|----------|-------------------------------------------------------------------------------|-----------------------------------------|
| `AND`    | すべての条件が真である場合に結果が真になる                                     | `SELECT * FROM table WHERE col1 = 1 AND col2 = 2;` |
| `OR`     | いずれかの条件が真であれば結果が真になる                                       | `SELECT * FROM table WHERE col1 = 1 OR col2 = 2;`  |
| `NOT`    | 条件の結果を反転する。条件が真の場合に偽を返し、偽の場合に真を返す             | `SELECT * FROM table WHERE NOT col1 = 1;`  |
| `IN`     | 列の値が指定した複数の値のリストの中に含まれているかを確認する                 | `SELECT * FROM table WHERE col1 IN (1, 2, 3);`  |
| `BETWEEN`| 列の値が指定した範囲内に含まれているかを確認する                               | `SELECT * FROM table WHERE col1 BETWEEN 10 AND 20;`  |
| `LIKE`   | 列の値が指定したパターンに一致するかを確認する                                 | `SELECT * FROM table WHERE col1 LIKE 'A%';`  |
| `IS NULL`| 列の値が`NULL`であるかを確認する                                               | `SELECT * FROM table WHERE col1 IS NULL;`  |
| `IS NOT NULL` | 列の値が`NULL`でないかを確認する                                          | `SELECT * FROM table WHERE col1 IS NOT NULL;`  |

#### 論理演算子の説明

- **`AND`**: すべての条件が満たされる場合にのみ結果が返される。複数の条件を組み合わせて1つの条件として評価する際に使用される。
  - 例: `col1`が1であり、かつ`col2`が2の場合に行を返す。

- **`OR`**: いずれかの条件が満たされれば結果が返される。条件のうち、どれか1つでも真であれば結果が真となる。
  - 例: `col1`が1または`col2`が2の場合に行を返す。

- **`NOT`**: 条件の結果を反転させる。条件が真なら偽を、偽なら真を返す。
  - 例: `col1`が1でない場合に行を返す。

- **`IN`**: 複数の値の中に列の値が含まれているかを確認する。指定したリスト内のいずれかの値に一致するかどうかを調べる。
  - 例: `col1`が1、2、または3のいずれかであれば行を返す。

- **`BETWEEN`**: 列の値が指定した範囲内にあるかを確認する。範囲は両端の値を含む。
  - 例: `col1`が10以上20以下の場合に行を返す。

- **`LIKE`**: 文字列が特定のパターンに一致するかを確認する。ワイルドカード（`%`や`_`）を使って部分一致を行う。
  - 例: `col1`が`A`で始まる文字列を持つ場合に行を返す。

- **`IS NULL`**: 列の値が`NULL`かどうかを確認する。`NULL`はデータが存在しないことを示す特別な値である。
  - 例: `col1`が`NULL`である行を返す。

- **`IS NOT NULL`**: 列の値が`NULL`でないことを確認する。データが存在する行を取得したい場合に使用される。
  - 例: `col1`が`NULL`でない行を返す。

### `LIKE`演算子の補足説明

`LIKE`演算子は、文字列が特定のパターンに一致するかどうかを確認するために使用される。特に部分一致検索に便利であり、次の2つのワイルドカードがサポートされている。

- `%`：0文字以上の任意の文字列に一致する。
- `_`：任意の1文字に一致する。

#### 前方一致
`LIKE '文字列%'`の形式で使用され、文字列の先頭が特定の文字列で始まるものを検索する。  
例：`SELECT * FROM table WHERE col LIKE 'A%';`  
このクエリは、`A`で始まるすべてのレコードを返す。

#### 後方一致
`LIKE '%文字列'`の形式で使用され、文字列の末尾が特定の文字列で終わるものを検索する。  
例：`SELECT * FROM table WHERE col LIKE '%Z';`  
このクエリは、`Z`で終わるすべてのレコードを返す。

#### 任意一致
`LIKE '%文字列%'`の形式で使用され、文字列の任意の場所に特定の部分文字列が含まれるものを検索する。  
例：`SELECT * FROM table WHERE col LIKE '%abc%';`  
このクエリは、`abc`を含むすべてのレコードを返す。

#### 特定の位置に1文字の任意の文字を含む検索
`LIKE '文字列_文字列'`の形式で使用され、指定した位置に任意の1文字が含まれるものを検索する。  
例：`SELECT * FROM table WHERE col LIKE 'A_e';`  
このクエリは、`A`で始まり、任意の1文字を挟んで`e`で終わるすべてのレコードを返す。

`LIKE`演算子は、特に文字列の部分一致や柔軟なパターンマッチングにおいて非常に有用である。

### SQLの集約関数

SQLの集約関数は、複数の行に対して計算を行い、1つの結果を返す関数である。データの集計や統計的な分析に使用される。

| 関数         | 説明                                                                              | 例                                         |
|--------------|-----------------------------------------------------------------------------------|--------------------------------------------|
| `COUNT()`    | 指定した列や行の数をカウントする。`NULL`値はカウントされない                        | `SELECT COUNT(*) FROM table;`              |
| `SUM()`      | 指定した列の数値を合計する。`NULL`値は無視される                                    | `SELECT SUM(col) FROM table;`              |
| `AVG()`      | 指定した列の数値の平均値を返す。`NULL`値は無視される                                | `SELECT AVG(col) FROM table;`              |
| `MAX()`      | 指定した列の最大値を返す。文字列の場合、アルファベット順で比較される                | `SELECT MAX(col) FROM table;`              |
| `MIN()`      | 指定した列の最小値を返す。文字列の場合、アルファベット順で比較される                | `SELECT MIN(col) FROM table;`              |
| `GROUP_CONCAT()` (MySQL) | 複数の行の値を1つの文字列に連結して返す。カンマや任意の区切り文字が使える | `SELECT GROUP_CONCAT(col) FROM table;`     |

#### 集約関数の説明

- **`COUNT()`**: 行数や特定の列に含まれる非`NULL`値の数をカウントする。`*`を使用するとすべての行をカウントできる。
  - 例: `SELECT COUNT(*) FROM employees;` → `employees`テーブルの全行数を返す。

- **`SUM()`**: 指定した数値列の合計値を計算する。数値以外のデータ型に対しては使用できない。
  - 例: `SELECT SUM(salary) FROM employees;` → `salary`列の合計を返す。

- **`AVG()`**: 指定した数値列の平均値を計算する。`NULL`値は無視される。
  - 例: `SELECT AVG(salary) FROM employees;` → `salary`列の平均値を返す。

- **`MAX()`**: 指定した列の最大値を返す。数値列の場合は最大の数値を、文字列の場合はアルファベット順で最後の値を返す。
  - 例: `SELECT MAX(salary) FROM employees;` → `salary`列の最大値を返す。

- **`MIN()`**: 指定した列の最小値を返す。数値列の場合は最小の数値を、文字列の場合はアルファベット順で最初の値を返す。
  - 例: `SELECT MIN(salary) FROM employees;` → `salary`列の最小値を返す。

- **`GROUP_CONCAT()`** (MySQL専用): 複数の行を1つの文字列に連結して返す。通常はカンマで区切られるが、任意の区切り文字を指定できる。
  - 例: `SELECT GROUP_CONCAT(name) FROM employees;` → `name`列のすべての値をカンマで連結して返す。

#### `DISTINCT`と集約関数の組み合わせ
`DISTINCT`は、集約関数と組み合わせることで、重複を除いた結果を計算することができる。

- 例: `SELECT COUNT(DISTINCT department) FROM employees;`  
  このクエリは、`employees`テーブルにおける一意な`department`の数を返す。



### GROUP BY
`GROUP BY`句は、テーブルのデータを特定の列に基づいていくつかのグループに切り分けるために使用される。たとえば、部署ごと、商品ごとなどの単位でグループ化を行い、各グループに対して集計関数を使って集計結果を取得することができる。

#### 共通：
```sql
SELECT 列1, 列2, 集約関数(列3)
FROM テーブル名
GROUP BY 列1, 列2;
```

#### 共通：
部署ごとに部署名と従業員数を表示するクエリ
```sql
SELECT department, COUNT(*)
FROM employees
GROUP BY department;
```

### 注意点
- **`NULL`の扱い**: `NULL`値も1つのグループとしてまとめられる。つまり、`NULL`は`NULL`としてグループ化される。
  
- **`SELECT`句で使用できる要素の限定**:
  - `定数`
  - `集約関数`（例：`COUNT()`、`SUM()`、`AVG()`など）
  - `GROUP BY`で指定した列（集約キー）  
  これ以外の列は`SELECT`句に含めることができない。`GROUP BY`で指定されていない列を`SELECT`に含めるとエラーになる。

- **`AS`が使用できない**:
  `GROUP BY`句は`SELECT`句よりも先に実行されるため、`AS`句で指定したエイリアスは`GROUP BY`句で使用できない。代わりに、元の列名や集約キーを直接使用する必要がある。

  ```sql
  -- AS句のエイリアスはGROUP BYで使用不可
  SELECT department AS dept, COUNT(*) 
  FROM employees
  GROUP BY department;
  ```

- **`GROUP BY`はソートを行わない**: `GROUP BY`句を使用しても、結果の表示順序は保証されない。結果を特定の順序で並べ替えたい場合は、`ORDER BY`句を使用する必要がある。

  ```sql
  -- 従業員数の多い順に並べ替え
  SELECT department, COUNT(*)
  FROM employees
  GROUP BY department
  ORDER BY COUNT(*) DESC;
  ```

### 補足:
- **`HAVING`句**: `GROUP BY`の後に、グループ化されたデータに条件を適用したい場合、`HAVING`句を使用する。`WHERE`句はグループ化前の行に適用されるため、グループ化後に条件を設定する場合には`HAVING`が必要。

  ```sql
  -- 従業員数が10人以上の部署のみ表示
  SELECT department, COUNT(*)
  FROM employees
  GROUP BY department
  HAVING COUNT(*) >= 10;
  ```
