# Publishing LearnWithCats on IONOS

The game goes on its own subdomain, **learnwithcats.mythingsai.com**, on the same IONOS hosting as mythingsai.com. The pages are static files; the shared square needs the small PHP API in `api/` and a MySQL database.

You do every step that involves a password yourself. Nothing secret is ever written in the repository.

Names of menus in the IONOS control panel can change a little over time: if one is not where this guide says, look for the closest match.

## 1. Create the subdomain

1. In the IONOS control panel, open **Domains & SSL** and choose `mythingsai.com`.
2. Add the subdomain `learnwithcats`.
3. Point it to a new folder of your webspace, for example `/learnwithcats`. Remember this path: it is `IONOS_SFTP_PATH` in step 4.
4. Turn on the SSL certificate for the subdomain, so the game opens with `https://`.
5. In the PHP settings of the hosting, check that the subdomain uses **PHP 8.1 or newer**.

## 2. Create the database

1. In **Hosting → Databases**, create a new **MySQL** database.
2. Note the host name, database name, user name and password that IONOS shows. Keep them for yourself: they go only in `config.php` (step 3).
3. Open the database in **phpMyAdmin**, go to the **SQL** tab, paste the whole content of [`api/schema.sql`](../api/schema.sql) and run it. It creates two tables, `cats` and `reports`.

## 3. Write `config.php` (on your computer, never in Git)

1. Make a copy of [`api/config.example.php`](../api/config.example.php) and call it `config.php`.
2. Replace `DB_HOST`, `DB_NAME`, `DB_USER` and `DB_PASSWORD` with the values from step 2.
3. Replace the salt with a long random text, for example 40 characters from a password generator. It turns player ids into anonymous codes. Don't change it later, or players lose track of their cats.
4. Keep the file: you upload it in step 6.

`config.php` is listed in `.gitignore`, so Git will not pick it up by mistake.

## 4. Add the SFTP secrets to GitHub

1. In the IONOS control panel, open **Hosting → SFTP & SSH** and look at (or create) an SFTP user.
2. In GitHub, open the repository **Settings → Secrets and variables → Actions** and add four **repository secrets**:

| Secret | Value |
| --- | --- |
| `IONOS_SFTP_HOST` | the SFTP server name shown by IONOS |
| `IONOS_SFTP_USER` | the SFTP user name |
| `IONOS_SFTP_PASSWORD` | the SFTP password |
| `IONOS_SFTP_PATH` | the folder of step 1, for example `/learnwithcats` |

## 5. Upload the game

1. In GitHub, open **Actions → Deploy to IONOS → Run workflow**.
2. The workflow runs the tests and, only if they pass, uploads the game to the folder. It never deletes files on the server, and it never uploads `config.php` or test files.

Run it again whenever you want the server to get the latest version of `main`.

## 6. Upload `config.php` once

With an SFTP program (for example FileZilla, using the SFTP user of step 4), upload your `config.php` into the `api` folder on the server, next to `index.php`:

```
/learnwithcats/api/config.php
```

The `.htaccess` file in `api/` makes sure nobody can download it from the web.

## 7. Check

1. Open <https://learnwithcats.mythingsai.com>.
2. Under **The square**, the grey line should say **"Shared square: everyone who plays sees these cats."** If it says "Preview", the page can't reach the API: see below.
3. Write a cat, press **Run**, write your name and press **Put in the square**. Open the page on another device: the cat should be there too.

### If the square stays in preview mode

Open <https://learnwithcats.mythingsai.com/api/index.php?action=world>:

- `{"error":"not_configured"}`: `config.php` is missing or in the wrong folder (step 6).
- `{"error":"server"}`: the database values in `config.php` are wrong, or `schema.sql` was not run (steps 2 and 3).
- PHP code shown as text, or an error page: PHP is not active on the subdomain, or the version is older than 8.1 (step 1).
- `{"now":…,"cats":[]}`: the API works. Reload the game page.
