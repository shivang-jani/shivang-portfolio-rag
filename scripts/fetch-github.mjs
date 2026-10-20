// Pull public GitHub repos + READMEs into data/source/github.md, which the
// ingester (npm run ingest) then embeds alongside the resume and profile.
//
// Run:  npm run sync:github
// Optional: set GITHUB_TOKEN to raise the API rate limit (not required for a
// handful of repos). GITHUB_USERNAME overrides the default.

import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "data", "source", "github.md");

const USER = process.env.GITHUB_USERNAME || "shivang-jani";
const TOKEN = process.env.GITHUB_TOKEN;
const MAX_README_CHARS = 1800;

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "portfolio-rag-sync",
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
};

async function gh(path, accept) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: accept ? { ...headers, Accept: accept } : headers,
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub ${path} -> ${res.status} ${await res.text()}`);
  }
  return accept === "application/vnd.github.raw" ? res.text() : res.json();
}

function cleanReadme(md) {
  if (!md) return "";
  return md
    .replace(/<!--[\s\S]*?-->/g, "") // html comments
    .replace(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/g, "") // badge links
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // images
    .replace(/<[^>]+>/g, "") // html tags
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_README_CHARS);
}

async function main() {
  console.log(`Fetching public repos for @${USER}...`);
  const repos = await gh(`/users/${USER}/repos?per_page=100&sort=updated`);
  if (!Array.isArray(repos)) {
    throw new Error(`Unexpected response: ${JSON.stringify(repos).slice(0, 200)}`);
  }

  const own = repos
    .filter((r) => !r.fork)
    .sort((a, b) => b.stargazers_count - a.stargazers_count);

  let out = `# GitHub — github.com/${USER}\n\nShivang's public GitHub projects, synced automatically from the GitHub API.\n`;

  for (const r of own) {
    process.stdout.write(`  · ${r.name} ... `);
    let topics = [];
    try {
      const t = await gh(`/repos/${USER}/${r.name}/topics`, "application/vnd.github+json");
      topics = t?.names || [];
    } catch {
      /* topics optional */
    }
    let readme = "";
    try {
      readme = cleanReadme(await gh(`/repos/${USER}/${r.name}/readme`, "application/vnd.github.raw"));
    } catch {
      /* readme optional */
    }

    out += `\n## ${r.name}\n`;
    if (r.description) out += `${r.description}\n`;
    const meta = [];
    if (r.language) meta.push(`Language: ${r.language}`);
    if (topics.length) meta.push(`Topics: ${topics.join(", ")}`);
    if (r.stargazers_count) meta.push(`Stars: ${r.stargazers_count}`);
    meta.push(`URL: ${r.html_url}`);
    out += `${meta.join(" · ")}\n`;
    if (readme) out += `\nREADME:\n${readme}\n`;
    console.log("done");
  }

  writeFileSync(OUT, out);
  console.log(`\nWrote ${own.length} repos -> data/source/github.md`);
  console.log(`Next: run \`npm run ingest\` to embed them.`);
}

main().catch((err) => {
  console.error("\nGitHub sync failed:", err.message);
  process.exit(1);
});
