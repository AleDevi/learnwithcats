# LearnWithCats

Learn the ideas behind coding by writing cats.

You describe a cat in a tiny language, watch it walk across the screen in coloured ASCII art, and see the same program written in Python, JavaScript, C and C++. The cats follow simplified real cat genetics, so some cats are impossible, and the error messages explain why.

> **Status:** prototype. The cat generator and the shared world work; the world is not online yet.

## What it does

```
cat Luna
  sex: female
  colors: orange, black, white
  eyes: happy
  tail: long
```

- **Write a cat.** One line starts a cat, then one property per line. Anything you leave out is picked from the cat's name, so the same name always gives the same cat.
- **Watch it.** The cat is drawn from interchangeable ASCII parts (ears, eyes, mouth, body, tail, legs), filled with its coat colours, and it walks, sits and sleeps.
- **Compare.** The same program is shown in Python, JavaScript, C and C++. Click a line of your program to highlight the matching lines.
- **Learn from errors.** Typos get a "did you mean". Impossible cats get a genetics lesson: for example, a male cat can't be orange and black, because the orange gene is on the X chromosome and males have only one X.
- **Write in a real language.** Switch the editor to Python, JavaScript, C or C++ and you get many more options: eye colour (even odd eyes), tabby type, weight, collar, bell, bow, hat, speed, sleepiness, friendliness, and `meow("…")` for a speech bubble. Mistakes get explanations about the language itself: quotes, `True` vs `true`, semicolons, `new`, enum constants, variables used before they exist.
- **Unlock special felines.** Press Run to count your cats. Five cats and five different advanced options in a language master it: Python unlocks the lion, JavaScript the cheetah, C the lynx, C++ the tiger. Master all four for the snow leopard. Progress is saved in your browser.
- **Put your cats in the square.** After a Run, your cats can join a square shared by everyone who plays, drawn on three planes from far to near. Each player can have 3 living cats there. Cats live 6 to 10 real days, depending on their longevity gene: they start as small kittens, slow down when old, and then rest in the cemetery, under a tombstone with their face, name and dates. Adult couples sometimes have kittens, which inherit one copy of each gene from each parent.
- **Kind names only.** Names of cats and players are checked against a list of swear words and racist, xenophobic and sexist terms in English and Italian (`data/blocked-words.json`), and anyone can report a name. A cat reported by 3 players disappears.
- **English or Italian.** The interface and the language keywords work in both (`cat` / `gatto`, `eyes` / `occhi`…). Switching language rewrites your program.

### The genetics

Each cat has a small DNA string, for example `XO Xo | DD | aa | Ss | L3 L1`:

| Gene | Effect |
| --- | --- |
| O (on the X chromosome) | orange or black-based; a female with one of each is tortoiseshell |
| D | `dd` dilutes black to grey and orange to cream |
| A | tabby stripes, or solid with `aa`; orange cats always show stripes |
| S | white spots, more with `SS`; tortoiseshell plus white is calico |
| L | longevity; lifespan is 4 + L1 + L2 days (used by the shared world) |

## Run it

It is a static web page with no build step and no dependencies.

```sh
git clone https://github.com/AleDevi/learnwithcats.git
cd learnwithcats
python3 -m http.server 8000
```

Then open <http://localhost:8000>. (Opening `index.html` directly from disk does not work, because browsers block JavaScript modules on `file://` pages.)

Without the PHP API, the square works in **preview mode**: it lives only in your browser, with a few pretend neighbours.

### Run it with the shared world

The shared world needs PHP 8.1+ with PDO, and MySQL (or SQLite for a quick local try).

1. Copy `api/config.example.php` to `api/config.php` and fill in the database and a long random salt. This file is never committed.
2. With MySQL, run `api/schema.sql` once (for example in phpMyAdmin). With SQLite, the tables are created on first use.
3. Serve the folder with PHP, for example `php -S localhost:8000`.

All the rules of life (age, death, kittens) are computed from timestamps in `js/world/life.js`, so every browser sees the same world. The server only stores cats and checks that every request follows the rules: valid genes, kind names, 3 living cats per player, kittens whose genes really come from their parents.

### Publishing on IONOS

`.github/workflows/deploy.yml` uploads the game over SFTP. It runs only when started by hand from the Actions tab, after the tests pass, and never deletes files on the server. It needs four repository secrets: `IONOS_SFTP_HOST`, `IONOS_SFTP_USER`, `IONOS_SFTP_PASSWORD`, `IONOS_SFTP_PATH`. Upload `api/config.php` by hand once.

### Tests

Needs Node.js 18 or newer:

```sh
npm test
```

## Project layout

| Path | What it holds |
| --- | --- |
| `index.html`, `css/style.css` | the page |
| `js/words.js` | keywords and values in English and Italian |
| `js/parser.js` | reads the cat language |
| `js/lang/tokens.js`, `js/lang/real.js` | read the small part of Python, JavaScript, C and C++ the game uses |
| `js/program.js` | one entry point for all languages, plus the feline locks |
| `js/progress.js` | mastery and unlocked felines |
| `js/genetics.js` | genes, coat colours, DNA string, lifespan |
| `js/cat.js` | the "cat function": draws a cat from its parts |
| `js/translate.js` | writes the same cats in all five languages |
| `js/i18n.js` | interface text, messages, examples |
| `js/cat.js`, `js/motion.js`, `js/html.js` | drawing and moving cats |
| `js/world/life.js` | age, death, litters and inheritance |
| `js/world/store.js` | the shared world (PHP API) or a preview world in the browser |
| `js/world/view.js` | the square, the list of living cats, the cemetery |
| `js/world/moderation.js`, `data/blocked-words.json` | the name filter |
| `api/` | the PHP API and the database schema |
| `js/app.js` | connects everything and animates the stage |
| `tests/` | tests for the readers, genetics, drawing, translations, mastery, life in the world and the name filter |

## How it was made, and the AI inside

This project is part of [My things (with) AI](https://mythingsai.com). The idea, the decisions and the testing are by Ale. The design and the code were written with **Claude** (Anthropic), used through Claude Code in a claude.ai project. Web searches for similar projects were also done by Claude.

<!-- TODO(Ale): say which Claude plan was used and whether it was free. -->

## Licence

[MIT](LICENSE)
