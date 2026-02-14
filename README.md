# Your Studio — Netlify Static Site

This is a static multi-page website designed for Netlify hosting (Kickr-style layout).

## What’s included
- Clean multi-page structure with pretty URLs (folder + index.html)
- Netlify Forms contact form at `/contact/` (form name: `project-inquiry`)
- Placeholder hero image at `/assets/img/hero-placeholder.svg` (replace with your own photo)
- Simple CSS + minimal JS (mobile menu close on link tap)

## Customize
1) Replace **site name** and **email**:
   - Search for `Your Studio` and `you@yourdomain.com` across the files.
2) Replace hero image:
   - Put your image at `/assets/img/hero.jpg` and update `index.html` to use it (or overwrite `hero-placeholder.svg`).

## Deploy on Netlify
### Option A: Drag-and-drop
1) Zip the folder output (or use the provided zip).
2) In Netlify: **Add new site → Deploy manually**, then drop the zip.

### Option B: Git-based deploy
1) Push these files to a GitHub repo.
2) In Netlify: **Add new site → Import an existing project**.
3) Build settings:
   - Build command: _(leave blank)_
   - Publish directory: `.`

## Why changes may not appear on GitHub
If an AI agent edits files in a cloud/container workspace, those commits exist only in that workspace until they are pushed to your GitHub repository.

Use this checklist to make sure GitHub gets updated:
1) Confirm you are inside your local cloned repo (not `C:\Users\<you>` root):
   - `cd C:\Users\<you>\brilliant`
   - `git status`
2) Confirm remote is configured:
   - `git remote -v`
   - If missing: `git remote add origin https://github.com/akmandala/brilliant.git`
3) Confirm which branch has commits:
   - `git branch --show-current`
   - `git log --oneline -n 5`
4) Push that branch:
   - `git push -u origin <branch-name>`

If you made commits in a different environment, export/apply them with:
- `git format-patch -1 <commit>` (from source repo)
- `git am <patch-file>` (in your local repo), then push.

## Netlify Forms notes
- Submissions will appear under **Site → Forms**.
- You can enable email notifications inside Netlify settings.
