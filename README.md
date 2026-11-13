# LearnWithCats

Learn the ideas behind coding by writing cats.

You describe a cat in a tiny language, watch it walk across the screen in coloured ASCII art, and see the same program written in Python, JavaScript, C and C++. The cats follow simplified real cat genetics, so some cats are impossible, and the error messages explain why.

> **Status:** prototype. The cat generator works. The shared world (a square where everyone's cats live, have kittens, grow old and end up in a cemetery) is the next step.

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
| `js/app.js` | connects everything and animates the stage |
| `tests/` | tests for the readers, genetics, drawing, translations and mastery |

## How it was made, and the AI inside

This project is part of [My things (with) AI](https://mythingsai.com). The idea, the decisions and the testing are by Ale. The design and the code were written with **Claude** (Anthropic), used through Claude Code in a claude.ai project. Web searches for similar projects were also done by Claude.

<!-- TODO(Ale): say which Claude plan was used and whether it was free. -->

## Licence

[MIT](LICENSE)
