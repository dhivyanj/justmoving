const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const entries = [];
const seenHashes = new Set();

// Helper to clean up Markdown titles
function cleanTitle(filename) {
  return filename
    .replace(/\.(md|txt)$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// 1. Get entries from git commits
try {
  // Use a unique marker at the end of each commit to handle multiline messages safely
  const gitLog = execSync('git log --format="%H%n%aI%n%B%n---COMMIT_END---"', { encoding: 'utf8' });
  const commitBlocks = gitLog.split('---COMMIT_END---\n');

  for (const block of commitBlocks) {
    if (!block.trim()) continue;

    const lines = block.split('\n');
    if (lines.length < 3) continue;

    const hash = lines[0].trim();
    const date = lines[1].trim();
    // Combine everything else back as the body
    const body = lines.slice(2).join('\n').trim();

    if (!hash || !date) continue;

    // Check if the commit message has our journal trigger prefixes (case-insensitive)
    const match = body.match(/^(journal|log|post):\s*([\s\S]+)$/i);
    if (match) {
      const content = match[2].trim();
      entries.push({
        id: hash,
        date: date, // ISO format (e.g. 2026-06-21T03:44:21+05:30)
        content: content,
        type: 'commit',
        hash: hash.substring(0, 7)
      });
      seenHashes.add(hash);
    }
  }
} catch (error) {
  console.warn("Could not read git commits (maybe repo is empty or git is missing):", error.message);
}

// 2. Get entries from files in entries/ directory
const entriesDir = path.join(__dirname, 'entries');
if (fs.existsSync(entriesDir)) {
  const files = fs.readdirSync(entriesDir);
  for (const file of files) {
    if (file.endsWith('.md') || file.endsWith('.txt')) {
      const filePath = path.join(entriesDir, file);
      const relativePath = path.relative(__dirname, filePath);
      const content = fs.readFileSync(filePath, 'utf8');

      // Try to determine the creation date and edit status from Git history
      let date;
      let edited = false;
      try {
        // Get all commits that touched this file
        const gitDates = execSync(`git log --follow --format="%aI" -- "${relativePath}"`, { encoding: 'utf8' })
          .trim()
          .split('\n')
          .filter(Boolean);
        
        if (gitDates.length > 0) {
          date = gitDates[gitDates.length - 1]; // Oldest date is the last line
          
          // If there are multiple commits and the latest is different from the oldest
          if (gitDates.length > 1 && gitDates[0] !== gitDates[gitDates.length - 1]) {
            edited = true;
          }
        }
      } catch (e) {
        // Git command failed (e.g., untracked file)
      }

      // Fallback to local filesystem creation time if not in Git yet
      if (!date) {
        try {
          const stats = fs.statSync(filePath);
          date = stats.birthtimeMs > 0 ? stats.birthtime.toISOString() : stats.mtime.toISOString();
        } catch (e) {
          date = new Date().toISOString();
        }
      }

      // Avoid duplicates if the file was somehow already parsed (shouldn't happen, but good safeguard)
      entries.push({
        id: file,
        title: cleanTitle(file),
        date: date,
        content: content,
        type: 'file',
        edited: edited
      });
    }
  }
}

// Sort all entries: newest first (reverse chronological order)
entries.sort((a, b) => new Date(b.date) - new Date(a.date));

// Write to entries.json
fs.writeFileSync(path.join(__dirname, 'entries.json'), JSON.stringify(entries, null, 2));
console.log(`Successfully generated entries.json with ${entries.length} entries.`);
