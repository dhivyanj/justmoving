# How to Post Entries

Here is a step-by-step guide on how to post entries to your journal.

---

## Method 1: Posting via Markdown/Text Files (Recommended for longer posts)

1. **Create a new file** inside the `entries/` folder. Use any filename you like (e.g., `entries/my-first-log.md`).
2. **Write your content** in the file using standard Markdown syntax. For example:
   ```markdown
   # My First Log

   Today was a productive day. I finally got my journal setup!
   ```
3. **Commit and push** the file to GitHub:
   ```bash
   git add entries/my-first-log.md
   git commit -m "add my first log"
   git push origin main
   ```
   *Note: The posting time will be locked to the exact second you run `git commit`.*

---

## Method 2: Posting via Commit Messages (Best for quick thoughts)

1. **Create an empty commit** (or a normal code commit) starting with `journal:`, `log:`, or `post:`:
   ```bash
   git commit --allow-empty -m "journal: Quick update: today was a beautiful sunny day."
   ```
2. **Push to GitHub**:
   ```bash
   git push origin main
   ```
   *Note: The website will extract the text after `journal:` and post it using the commit timestamp as the entry date.*
