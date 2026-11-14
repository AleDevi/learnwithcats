<?php
// LearnWithCats shared world API.
//
//   GET  index.php?action=world&player=ID   living cats + recent tombstones
//   POST index.php?action=add               put a player's cats in the world
//   POST index.php?action=litter            record kittens born today
//   POST index.php?action=report            report a cat with a bad name
//
// The server only stores and checks. Age, death and litters are calculated
// from timestamps by the game itself (js/world/life.js), so no timers are needed.

declare(strict_types=1);

require __DIR__ . '/moderation.php';

const MAX_LIVING_PER_PLAYER = 3;
const MAX_LIVING_TOTAL = 200;
const MAX_ADDS_PER_DAY = 30;
const MAX_LITTERS = 2;
const REPORTS_TO_HIDE = 3;
const DAY = 86400;
const TOMB_DAYS = 30;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function reply(array $data, int $status = 200): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function fail(string $code, array $params = [], int $status = 400): never {
    reply(['error' => $code, 'params' => (object) $params], $status);
}

function config(): array {
    $file = __DIR__ . '/config.php';
    if (!is_file($file)) fail('not_configured', [], 503);
    return require $file;
}

function db(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;
    $c = config();
    $pdo = new PDO($c['dsn'], $c['user'] ?? null, $c['password'] ?? null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    if (str_starts_with($c['dsn'], 'sqlite:')) {
        // local development: create the tables on first use
        $pdo->exec(file_get_contents(__DIR__ . '/schema-sqlite.sql'));
    }
    return $pdo;
}

function owner_hash(string $playerId): string {
    return hash('sha256', (config()['salt'] ?? '') . ':' . $playerId);
}

function body(): array {
    $raw = file_get_contents('php://input');
    if (strlen($raw) > 20000) fail('too_big');
    $data = json_decode($raw, true);
    if (!is_array($data)) fail('bad_request');
    return $data;
}

// ---------- validation ----------

const NAME_RE = '/^[\p{L}\p{N}][\p{L}\p{N} \'-]{0,19}$/u';
const LOOKS = [
    'ears' => ['pointy', 'round', 'folded'],
    'eyes' => ['normal', 'happy', 'sleepy', 'surprised', 'squint'],
    'mouth' => ['neutral', 'smile', 'tongue'],
    'tail' => ['short', 'medium', 'long'],
    'body' => ['small', 'medium', 'long'],
];
const SPECIES = ['lion', 'cheetah', 'lynx', 'tiger', 'snow_leopard'];
const LANGS = ['cat', 'python', 'javascript', 'c', 'cpp'];
const ADV = [
    'eye_color' => ['green', 'amber', 'copper', 'blue', 'odd'],
    'tabby_type' => ['mackerel', 'spotted', 'classic'],
    'collar' => ['red', 'blue', 'green', 'pink', 'yellow'],
    'weight' => [2, 9], 'speed' => [1, 5], 'sleepiness' => [1, 5], 'friendliness' => [1, 5],
    'bell' => 'bool', 'bow' => 'bool', 'hat' => 'bool',
];

function check_name($name, string $what = 'name'): string {
    if (!is_string($name) || !preg_match(NAME_RE, $name)) fail('bad_name', ['name' => is_string($name) ? $name : '']);
    if (lwc_is_blocked($name)) fail('blocked_name', ['what' => $what]);
    return $name;
}

function check_player($p): array {
    if (!is_array($p) || !is_string($p['id'] ?? null) || !preg_match('/^[A-Za-z0-9-]{16,64}$/', $p['id'])) fail('bad_player');
    $name = check_name($p['name'] ?? null, 'player');
    return ['owner' => owner_hash($p['id']), 'name' => $name];
}

function pair_of($v, array $allowed, int $n): bool {
    if (!is_array($v) || count($v) !== $n) return false;
    foreach ($v as $a) if (!in_array($a, $allowed, true)) return false;
    return true;
}

function check_genome($g): array {
    if (!is_array($g)) fail('bad_genome');
    $female = ($g['sex'] ?? null) === 'female';
    if (!$female && ($g['sex'] ?? null) !== 'male') fail('bad_genome');
    $ok = pair_of($g['O'] ?? null, ['O', 'o'], $female ? 2 : 1)
        && pair_of($g['D'] ?? null, ['D', 'd'], 2)
        && pair_of($g['A'] ?? null, ['A', 'a'], 2)
        && pair_of($g['S'] ?? null, ['S', 's'], 2)
        && pair_of($g['L'] ?? null, [1, 2, 3], 2);
    if (!$ok) fail('bad_genome');
    return ['sex' => $g['sex'], 'O' => $g['O'], 'D' => $g['D'], 'A' => $g['A'], 'S' => $g['S'], 'L' => $g['L']];
}

function check_looks($looks): array {
    $out = [];
    foreach ((array) $looks as $k => $v) {
        if (!isset(LOOKS[$k]) || !in_array($v, LOOKS[$k], true)) fail('bad_cat');
        $out[$k] = $v;
    }
    return $out;
}

function check_adv($adv): array {
    $out = [];
    foreach ((array) $adv as $k => $v) {
        $rule = ADV[$k] ?? null;
        if ($rule === null) fail('bad_cat');
        if ($rule === 'bool') {
            if (!is_bool($v)) fail('bad_cat');
        } elseif (is_int($rule[0])) {
            if ((!is_int($v) && !is_float($v)) || $v < $rule[0] || $v > $rule[1]) fail('bad_cat');
        } elseif (!in_array($v, $rule, true)) {
            fail('bad_cat');
        }
        $out[$k] = $v;
    }
    return $out;
}

function check_cat($c): array {
    if (!is_array($c)) fail('bad_cat');
    $name = check_name($c['name'] ?? null);
    $genome = check_genome($c['genome'] ?? null);
    $lifespan = 4 + $genome['L'][0] + $genome['L'][1];
    $species = $c['species'] ?? null;
    if ($species !== null && !in_array($species, SPECIES, true)) fail('bad_cat');
    $lang = $c['srcLang'] ?? 'cat';
    if (!in_array($lang, LANGS, true)) fail('bad_cat');
    return [
        'name' => $name, 'genome' => $genome, 'lifespan' => $lifespan, 'species' => $species,
        'srcLang' => $lang, 'looks' => check_looks($c['looks'] ?? []), 'adv' => check_adv($c['adv'] ?? []),
    ];
}

// ---------- rows ----------

function new_id(): string {
    return bin2hex(random_bytes(8));
}

function insert_cat(array $cat, array $extra): array {
    $row = [
        'id' => new_id(),
        'name' => $cat['name'],
        'name_key' => mb_strtolower($cat['name'], 'UTF-8'),
        'owner' => $extra['owner'],
        'owner_name' => $extra['owner_name'],
        'src_lang' => $cat['srcLang'],
        'born' => $extra['born'],
        'lifespan' => $cat['lifespan'],
        'species' => $cat['species'],
        'mother' => $extra['mother'] ?? null,
        'father' => $extra['father'] ?? null,
        'litter' => $extra['litter'] ?? null,
        'data' => json_encode(['genome' => $cat['genome'], 'looks' => $cat['looks'], 'adv' => $cat['adv']]),
        'created' => time(),
    ];
    $cols = implode(', ', array_keys($row));
    $marks = implode(', ', array_map(fn ($k) => ":$k", array_keys($row)));
    db()->prepare("INSERT INTO cats ($cols) VALUES ($marks)")->execute($row);
    return $row;
}

function to_record(array $row, ?string $me): array {
    $data = json_decode($row['data'], true);
    return [
        'id' => $row['id'],
        'name' => $row['name'],
        'ownerName' => $row['owner_name'],
        'mine' => $me !== null && hash_equals($row['owner'], $me),
        'srcLang' => $row['src_lang'],
        'born' => (int) $row['born'],
        'lifespan' => (int) $row['lifespan'],
        'species' => $row['species'],
        'mother' => $row['mother'],
        'father' => $row['father'],
        'litter' => $row['litter'],
        'genome' => $data['genome'],
        'looks' => (object) $data['looks'],
        'adv' => (object) $data['adv'],
        'props' => (object) [],
    ];
}

// Times are written into the SQL as whole numbers: SQLite would compare a
// bound parameter as text.
function living_where(int $now): string {
    return 'hidden = 0 AND born + lifespan * ' . DAY . ' > ' . $now;
}

// ---------- actions ----------

$action = $_GET['action'] ?? '';
$now = time();

try {
    if ($action === 'world' && $_SERVER['REQUEST_METHOD'] === 'GET') {
        $me = isset($_GET['player']) && preg_match('/^[A-Za-z0-9-]{16,64}$/', $_GET['player']) ? owner_hash($_GET['player']) : null;
        $q = db()->query('SELECT * FROM cats WHERE hidden = 0 AND born + lifespan * ' . DAY . ' > ' . ($now - TOMB_DAYS * DAY) . ' ORDER BY born');
        reply(['now' => $now, 'cats' => array_map(fn ($r) => to_record($r, $me), $q->fetchAll())]);
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail('bad_request', [], 405);
    $in = body();

    if ($action === 'add') {
        $player = check_player($in['player'] ?? null);
        $cats = $in['cats'] ?? null;
        if (!is_array($cats) || count($cats) < 1 || count($cats) > MAX_LIVING_PER_PLAYER) fail('bad_request');
        $cats = array_map('check_cat', $cats);

        $q = db()->prepare('SELECT COUNT(*) FROM cats WHERE owner = :o AND mother IS NULL AND ' . living_where($now));
        $q->execute(['o' => $player['owner']]);
        $living = (int) $q->fetchColumn();
        if ($living + count($cats) > MAX_LIVING_PER_PLAYER) fail('too_many_living', ['max' => MAX_LIVING_PER_PLAYER, 'living' => $living]);

        $q = db()->prepare('SELECT COUNT(*) FROM cats WHERE owner = :o AND created > ' . ($now - DAY));
        $q->execute(['o' => $player['owner']]);
        if ((int) $q->fetchColumn() + count($cats) > MAX_ADDS_PER_DAY) fail('slow_down');

        $q = db()->query('SELECT COUNT(*) FROM cats WHERE ' . living_where($now));
        if ((int) $q->fetchColumn() + count($cats) > MAX_LIVING_TOTAL) fail('world_full');

        foreach ($cats as $c) {
            $q = db()->prepare('SELECT COUNT(*) FROM cats WHERE name_key = :n AND ' . living_where($now));
            $q->execute(['n' => mb_strtolower($c['name'], 'UTF-8')]);
            if ((int) $q->fetchColumn() > 0) fail('name_taken', ['name' => $c['name']]);
        }
        $added = [];
        foreach ($cats as $c) {
            $row = insert_cat($c, ['owner' => $player['owner'], 'owner_name' => $player['name'], 'born' => $now]);
            $added[] = to_record($row, $player['owner']);
        }
        reply(['cats' => $added]);
    }

    if ($action === 'litter') {
        $key = $in['key'] ?? '';
        if (!is_string($key) || !preg_match('/^([0-9a-f]{16}):([0-9a-f]{16}):(\d+)$/', $key, $m)) fail('bad_litter');
        [, $motherId, $fatherId, $day] = $m;
        $day = (int) $day;
        if ($day !== intdiv($now, DAY) && $day !== intdiv($now, DAY) - 1) fail('bad_litter');
        $born = (int) ($in['born'] ?? 0);
        if ($born < $day * DAY || $born >= ($day + 1) * DAY || $born > $now + 60) fail('bad_litter');

        $exists = db()->prepare('SELECT COUNT(*) FROM cats WHERE litter = :k');
        $exists->execute(['k' => $key]);
        if ((int) $exists->fetchColumn() > 0) reply(['cats' => []]); // someone else was faster

        $get = db()->prepare('SELECT * FROM cats WHERE id = :id AND hidden = 0');
        $get->execute(['id' => $motherId]);
        $mother = $get->fetch();
        $get->execute(['id' => $fatherId]);
        $father = $get->fetch();
        if (!$mother || !$father || $mother['species'] || $father['species']) fail('bad_litter');
        foreach ([$mother, $father] as $p) {
            if ($p['born'] + $p['lifespan'] * DAY <= $born) fail('bad_litter');
        }
        $mg = json_decode($mother['data'], true)['genome'];
        $fg = json_decode($father['data'], true)['genome'];
        if ($mg['sex'] !== 'female' || $fg['sex'] !== 'male') fail('bad_litter');

        $past = db()->prepare('SELECT COUNT(DISTINCT litter) FROM cats WHERE mother = :m');
        $past->execute(['m' => $motherId]);
        if ((int) $past->fetchColumn() >= MAX_LITTERS) fail('bad_litter');

        $kittens = $in['kittens'] ?? null;
        if (!is_array($kittens) || count($kittens) < 1 || count($kittens) > 3) fail('bad_litter');
        $added = [];
        foreach ($kittens as $k) {
            $k['srcLang'] = $mother['src_lang'];
            $k['species'] = null;
            $kit = check_cat($k);
            // every allele must come from a parent
            $g = $kit['genome'];
            foreach (['D', 'A', 'S', 'L'] as $gene) {
                if (!in_array($g[$gene][0], array_merge($mg[$gene], $fg[$gene]), true)) fail('bad_litter');
                if (!in_array($g[$gene][1], array_merge($mg[$gene], $fg[$gene]), true)) fail('bad_litter');
            }
            foreach ($g['O'] as $allele) {
                if (!in_array($allele, array_merge($mg['O'], $fg['O']), true)) fail('bad_litter');
            }
            $row = insert_cat($kit, [
                'owner' => $mother['owner'], 'owner_name' => $mother['owner_name'], 'born' => $born,
                'mother' => $motherId, 'father' => $fatherId, 'litter' => $key,
            ]);
            $added[] = to_record($row, null);
        }
        reply(['cats' => $added]);
    }

    if ($action === 'report') {
        $player = check_player($in['player'] ?? null);
        $id = $in['id'] ?? '';
        if (!is_string($id) || !preg_match('/^[0-9a-f]{16}$/', $id)) fail('bad_request');
        $q = db()->prepare('SELECT COUNT(*) FROM reports WHERE cat = :c AND reporter = :r');
        $q->execute(['c' => $id, 'r' => $player['owner']]);
        if ((int) $q->fetchColumn() === 0) {
            db()->prepare('INSERT INTO reports (cat, reporter, created) VALUES (:c, :r, :t)')
                ->execute(['c' => $id, 'r' => $player['owner'], 't' => $now]);
            $q = db()->prepare('SELECT COUNT(*) FROM reports WHERE cat = :c');
            $q->execute(['c' => $id]);
            if ((int) $q->fetchColumn() >= REPORTS_TO_HIDE) {
                db()->prepare('UPDATE cats SET hidden = 1 WHERE id = :c')->execute(['c' => $id]);
            }
        }
        reply(['ok' => true]);
    }

    fail('bad_request', [], 404);
} catch (PDOException $e) {
    error_log('LearnWithCats: ' . $e->getMessage());
    fail('server', [], 500);
}
