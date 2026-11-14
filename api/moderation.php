<?php
// Checks names against data/blocked-words.json. The browser uses the same list.

function lwc_normalize(string $text): string {
    $t = mb_strtolower($text, 'UTF-8');
    $t = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $t) ?: $t;
    $t = strtr($t, ['4' => 'a', '@' => 'a', '3' => 'e', '1' => 'i', '!' => 'i', '0' => 'o', '5' => 's', '$' => 's', '7' => 't']);
    $t = preg_replace('/[^a-z ]+/', ' ', $t);
    $t = preg_replace('/(.)\1+/', '$1', $t); // "cazzzzo" -> "cazo"
    return trim(preg_replace('/\s+/', ' ', $t));
}

function lwc_is_blocked(string $text): bool {
    static $list = null;
    if ($list === null) {
        $list = json_decode(file_get_contents(__DIR__ . '/../data/blocked-words.json'), true);
    }
    $norm = lwc_normalize($text);
    $joined = str_replace(' ', '', $norm);
    foreach ($list['contains'] as $w) {
        if (str_contains($joined, lwc_normalize($w))) return true;
    }
    $words = explode(' ', $norm);
    foreach ($list['words'] as $w) {
        if (in_array(lwc_normalize($w), $words, true)) return true;
    }
    return false;
}
