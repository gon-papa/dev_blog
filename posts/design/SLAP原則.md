---
id: de026472-c3b3-4b06-94b4-8829ab2eaf56
title: SLAP原則
date: '2025-12-11'
tags:
  - SOLID原則
---

# SLAP原則

## SLAP原則とは？

SLAP原則(Single Level of Abstraction Principle)とは、関数を抽象レベルに沿って分割していき、同じ関数に属するコードの抽象レベルを統一することである。

SLAPを満たすことで、要約性と閲覧性を得ることができる。
抽象度の高い関数を高水準=何をするか?
抽象度の低い関数を低水準=どうやるか?
とすると、
高水準の関数は低水準の関数を呼び出すことが関数内のメインの記述になり、結果として高水準の関数は要約性を持つこととなる。
要は何をする？がまとまっていれば、どうする？を見なくても大枠の理解はしやすくなる。
このような関数を複合関数(composedMethod)という。

```php
public function highLevel()
{
    lowLevel1();
    lowLevel2();
}

public function lowLevel1()
{
    // 処理
}

public function lowLevel2()
{
    // 処理
}

```

また関数を分割することにより、個々の関数は小さくなり閲覧性も得ることができる。この際に階層は高水準と低水準の2つだけでなく、複数の階層に分けて構造化する場合もある。

### 複合関数の注意点

複合関数の中で、異なる抽象レベルの処理を混在させないこと に注意する必要がある。
例えば、1つの関数の中で DB接続(非常に具体的な低水準の処理)とビジネスロジック(より高い抽象度の処理)が存在すると抽象レベルが揃わず構造が崩れる。
この注意点を破ると、高水準の関数が何を表しているのか分かりにくくなり、コード全体の構造の理解を妨げる。
結果として要約性と閲覧性が低下し、変更に弱いコードになってしまう。
SLAP原則は、関数を読む人の思考の流れを途切れさせないための重要な考え方である。

## もう少しコードで理解しやすくしてみる

給与計算をベースにして見てみる。
まずはSLAPを満たしていない例を挙げる。

- DB接続・SQL（超低水準）
- 勤怠集計・残業時間計算（ビジネスロジック）
- 所得税・社会保険料計算（ビジネスロジック）
- 結果のINSERT（低水準）
- メール通知（インフラ）

```php
class PayrollService
{
    public function processMonthlyPayroll(int $employeeId, string $month): void
    {
        // --- DB接続（低水準） ---
        $pdo = new PDO('mysql:host=localhost;dbname=payroll', 'user', 'pass');
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // --- 勤怠取得（SQL + ドメインが混在） ---
        $stmt = $pdo->prepare('
            SELECT work_date, work_hours, overtime_hours
            FROM attendances
            WHERE employee_id = :employee_id
              AND DATE_FORMAT(work_date, "%Y-%m") = :month
        ');
        $stmt->execute([
            'employee_id' => $employeeId,
            'month'       => $month,
        ]);
        $attendances = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($attendances)) {
            throw new RuntimeException('勤務実績がありません');
        }

        // --- 給与計算（ビジネスロジック） ---
        // 本当は社員ごとに給与テーブルや時給があるはずだが、ここでは仮で固定
        $baseMonthlySalary = 300_000;
        $overtimeRate      = 1.25;

        $totalWorkHours    = 0;
        $totalOvertimeHours = 0;

        foreach ($attendances as $attendance) {
            $totalWorkHours     += $attendance['work_hours'];
            $totalOvertimeHours += $attendance['overtime_hours'];
        }

        // 残業代の計算（かなり具体的な計算）
        $hourlyBase   = $baseMonthlySalary / 160; // 超雑: 月160時間と仮定
        $overtimePay  = $hourlyBase * $overtimeRate * $totalOvertimeHours;

        $grossSalary  = $baseMonthlySalary + $overtimePay;

        // --- 税金・社会保険の計算（ビジネスルール） ---
        $incomeTax      = (int) floor($grossSalary * 0.1);    // ざっくり10%
        $socialSecurity = (int) floor($grossSalary * 0.15);   // ざっくり15%

        $netSalary = $grossSalary - $incomeTax - $socialSecurity;

        // --- 結果を給与テーブルへ保存（低水準） ---
        $stmt = $pdo->prepare('
            INSERT INTO payrolls (employee_id, month, gross_salary, net_salary, income_tax, social_security)
            VALUES (:employee_id, :month, :gross_salary, :net_salary, :income_tax, :social_security)
        ');
        $stmt->execute([
            'employee_id'      => $employeeId,
            'month'            => $month,
            'gross_salary'     => $grossSalary,
            'net_salary'       => $netSalary,
            'income_tax'       => $incomeTax,
            'social_security'  => $socialSecurity,
        ]);

        // --- メール通知（インフラ詳細） ---
        $stmt = $pdo->prepare('SELECT email FROM employees WHERE id = :id');
        $stmt->execute(['id' => $employeeId]);
        $employee = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($employee && $employee['email']) {
            mail(
                $employee['email'],
                "{$month} の給与明細が確定しました",
                "支給額: {$grossSalary} / 手取り: {$netSalary}"
            );
        }
    }
}
```

手続き型のコードとなり、要約性、閲覧性が著しく低い状態である。
逆にSLAPを意識したコードは以下

```php
class PayrollService
{
    public function processMonthlyPayroll(int $employeeId, string $month): void
    {
        // 高水準：何をしているかだけが見える
        $attendances = $this->loadAttendances($employeeId, $month);

        $grossSalary = $this->calculateGrossSalary($employeeId, $attendances);
        [$incomeTax, $socialSecurity] = $this->calculateDeductions($employeeId, $grossSalary);

        $netSalary = $this->calculateNetSalary($grossSalary, $incomeTax, $socialSecurity);

        $this->savePayroll($employeeId, $month, $grossSalary, $netSalary, $incomeTax, $socialSecurity);

        $this->notifyEmployeePayrollFixed($employeeId, $month, $grossSalary, $netSalary);
    }

    // =========================================
    // ここから下が「より低い抽象レベル」の実装
    // =========================================

    /**
     * 勤怠をDBから読み込む（永続化 + ドメイン寄り）
     */
    private function loadAttendances(int $employeeId, string $month): array
    {
        $pdo = $this->getPdo();

        $stmt = $pdo->prepare('
            SELECT work_date, work_hours, overtime_hours
            FROM attendances
            WHERE employee_id = :employee_id
              AND DATE_FORMAT(work_date, "%Y-%m") = :month
        ');
        $stmt->execute([
            'employee_id' => $employeeId,
            'month'       => $month,
        ]);

        $attendances = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($attendances)) {
            throw new RuntimeException('勤務実績がありません');
        }

        return $attendances;
    }

    /**
     * 支給額（基本給 + 残業代）を計算する（ビジネスロジック）
     */
    private function calculateGrossSalary(int $employeeId, array $attendances): int
    {
        // 本当は社員テーブルなどから取得する
        $baseMonthlySalary = 300_000;
        $overtimeRate      = 1.25;

        $totalOvertimeHours = array_sum(array_column($attendances, 'overtime_hours'));

        $hourlyBase  = $baseMonthlySalary / 160;
        $overtimePay = (int) floor($hourlyBase * $overtimeRate * $totalOvertimeHours);

        return $baseMonthlySalary + $overtimePay;
    }

    /**
     * 控除（所得税・社会保険料）を計算する（ビジネスロジック）
     */
    private function calculateDeductions(int $employeeId, int $grossSalary): array
    {
        // 本来は等級表や扶養人数などを考慮する
        $incomeTax      = (int) floor($grossSalary * 0.1);
        $socialSecurity = (int) floor($grossSalary * 0.15);

        return [$incomeTax, $socialSecurity];
    }

    private function calculateNetSalary(int $grossSalary, int $incomeTax, int $socialSecurity): int
    {
        return $grossSalary - $incomeTax - $socialSecurity;
    }

    /**
     * 給与データの保存（永続化の責務）
     */
    private function savePayroll(
        int $employeeId,
        string $month,
        int $grossSalary,
        int $netSalary,
        int $incomeTax,
        int $socialSecurity
    ): void {
        $pdo = $this->getPdo();

        $stmt = $pdo->prepare('
            INSERT INTO payrolls (employee_id, month, gross_salary, net_salary, income_tax, social_security)
            VALUES (:employee_id, :month, :gross_salary, :net_salary, :income_tax, :social_security)
        ');
        $stmt->execute([
            'employee_id'      => $employeeId,
            'month'            => $month,
            'gross_salary'     => $grossSalary,
            'net_salary'       => $netSalary,
            'income_tax'       => $incomeTax,
            'social_security'  => $socialSecurity,
        ]);
    }

    /**
     * 給与確定の通知（インフラ寄り）
     */
    private function notifyEmployeePayrollFixed(
        int $employeeId,
        string $month,
        int $grossSalary,
        int $netSalary
    ): void {
        $pdo = $this->getPdo();

        $stmt = $pdo->prepare('SELECT email FROM employees WHERE id = :id');
        $stmt->execute(['id' => $employeeId]);
        $employee = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$employee || !$employee['email']) {
            return;
        }

        mail(
            $employee['email'],
            "{$month} の給与明細が確定しました",
            "支給額: {$grossSalary} / 手取り: {$netSalary}"
        );
    }

    private function getPdo(): PDO
    {
        $pdo = new PDO('mysql:host=localhost;dbname=payroll', 'user', 'pass');
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        return $pdo;
    }
}
```

ここで注目すべきは高水準な関数(何をしたいか？)と低水準な関数(どうしたいか？)がはっきり分かれており、高水準な関数さえ読めば、何をしているかが要約的に理解できることである。

```php
public function processMonthlyPayroll(int $employeeId, string $month): void
{
    // 高水準：何をしているかだけが見える
    // 勤怠を読み込む
    $attendances = $this->loadAttendances($employeeId, $month);
    // 支給額を計算する
    $grossSalary = $this->calculateGrossSalary($employeeId, $attendances);
    // 控除を計算する
    [$incomeTax, $socialSecurity] = $this->calculateDeductions($employeeId, $grossSalary);
    // 手取りを計算する
    $netSalary = $this->calculateNetSalary($grossSalary, $incomeTax, $socialSecurity);
    // 結果を保存する
    $this->savePayroll($employeeId, $month, $grossSalary, $netSalary, $incomeTax, $socialSecurity);
    // 従業員に通知する
    $this->notifyEmployeePayrollFixed($employeeId, $month, $grossSalary, $netSalary);
}
```

何をしたいか？のステップしか記載していないため、PDOやSQL、mailなどの実装の詳細が隠蔽されている。
これがSLAPで実現したいことである。

悪い例では様々な粒度の処理が記載されており、全てを読まなければ処理の理解が難しい。
しかし良い例では、`processMonthlyPayroll`メソッドが複合関数となり、これだけ読めば処理全体が理解できるのである。
結果として、流れが読みやすくなり、どこを変更すれば何が変わるかを負いやすくなり、低水準の変更が高水準に漏れにくい設計となり、変更にも強くなる。

## まとめ

SLAP原則(Single Level of Abstraction Principle)とは、関数を抽象レベルに沿って分割していき、同じ関数に属するコードの抽象レベルを統一することであり、
関数の抽象レベルが整理され、高水準の関数はシナリオ（目的）を簡潔に表現し、低水準の関数は実装の詳細に集中できる構造になる。
今は1クラス内で関数として定義したが、これがクラスでもモジュールでも同じ原則を当てはめることができる。

また高水準な関数ほど外部に公開されやすいという点もある。

- コントローラやユースケース層から呼ばれるメソッド
- APIのエンドポイント
- 他クラスから利用される公開メソッド
など、外部へ公開される関数であることが多い。(目的を公開して詳細を隠すとなると最上位は複合関数となる)
そのため、高水準な関数に低水準な関数の処理の詳細まで記載されているとコードベース全体の見通しに大きく影響を与えてしまう。

コードの読み手の脳のリソースを奪わずにクリーンなコードを心がけたい。(最後はお気持ち表明)