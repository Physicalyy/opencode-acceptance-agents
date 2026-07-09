#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const args = process.argv.slice(2);

function readFlag(name) {
  const idx = args.indexOf(name);
  if (idx === -1) return undefined;
  return args[idx + 1];
}

function hasFlag(name) {
  return args.includes(name);
}

if (hasFlag('--help') || hasFlag('-h')) {
  console.log(`opencode-acceptance-agents installer

Usage:
  npx github:Physicalyy/opencode-acceptance-agents [--target <project>] [--force] [--dry-run] [--no-agents-md] [--no-skills]

Options:
  --target <project>   Target project directory. Defaults to current working directory.
  --force              Overwrite existing agent files.
  --dry-run            Print planned changes without writing files.
  --no-agents-md       Do not update AGENTS.md managed block.
  --no-skills          Do not install OpenCode skill trigger hints.
`);
  process.exit(0);
}

const targetDir = path.resolve(readFlag('--target') || process.cwd());
const force = hasFlag('--force');
const dryRun = hasFlag('--dry-run');
const updateAgentsMd = !hasFlag('--no-agents-md');
const installSkills = !hasFlag('--no-skills');

const templateAgentsDir = path.join(rootDir, 'templates', 'opencode', 'agents');
const templateSkillsDir = path.join(rootDir, 'templates', 'opencode', 'skills');
const targetAgentsDir = path.join(targetDir, '.opencode', 'agents');
const targetSkillsDir = path.join(targetDir, '.opencode', 'skills');
const agentsMdPath = path.join(targetDir, 'AGENTS.md');

function log(message) {
  console.log(`[opencode-acceptance-agents] ${message}`);
}

function ensureDir(dir) {
  if (dryRun) {
    log(`mkdir ${dir}`);
    return;
  }
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  const exists = fs.existsSync(dest);
  if (exists && !force) {
    log(`skip existing ${path.relative(targetDir, dest)} (use --force to overwrite)`);
    return;
  }
  if (dryRun) {
    log(`${exists ? 'overwrite' : 'copy'} ${path.relative(rootDir, src)} -> ${dest}`);
    return;
  }
  fs.copyFileSync(src, dest);
  log(`${exists ? 'overwrote' : 'installed'} ${path.relative(targetDir, dest)}`);
}

function copyTree(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  ensureDir(destDir);
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const src = path.join(srcDir, entry.name);
    const dest = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyTree(src, dest);
    } else if (entry.isFile()) {
      copyFile(src, dest);
    }
  }
}

function updateAgentsBlock() {
  const start = '<!-- opencode-acceptance-agents:start -->';
  const end = '<!-- opencode-acceptance-agents:end -->';
  const block = `${start}
# OpenCode Acceptance Agents

When the user asks to generate acceptance cases, prefer the \`acceptance-cases\` agent.
When generating cases, default to UI-first / Midscene-ready cases and avoid unrelated backend compile, source inspection, configuration, or database-internal cases unless explicitly requested.
When the user asks to execute UI/Midscene acceptance, prefer the \`acceptance-ui\` agent.
When the user asks to review an acceptance report, prefer the \`acceptance-review\` agent.
When the project has \`.trellis/\`, read Trellis task artifacts first; otherwise write acceptance artifacts under \`acceptance-artifacts/\`.

${end}`;

  let current = '';
  if (fs.existsSync(agentsMdPath)) {
    current = fs.readFileSync(agentsMdPath, 'utf8');
  }

  let next;
  const startIdx = current.indexOf(start);
  const endIdx = current.indexOf(end);

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    next = current.slice(0, startIdx) + block + current.slice(endIdx + end.length);
  } else if (startIdx === -1 && endIdx === -1) {
    next = current.trimEnd();
    next += `${next ? '\n\n' : ''}${block}\n`;
  } else {
    throw new Error(`AGENTS.md has incomplete managed markers: ${agentsMdPath}`);
  }

  if (dryRun) {
    log(`update ${agentsMdPath} managed block`);
    return;
  }
  fs.writeFileSync(agentsMdPath, next, 'utf8');
  log(`updated ${path.relative(targetDir, agentsMdPath)}`);
}

function showModelHint() {
  const result = spawnSync('opencode', ['models'], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    log('opencode models could not be checked. After install, run `opencode models` and adjust agent model fields if needed.');
    return;
  }

  const models = result.stdout.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  const expected = ['opencode-go/deepseek-v4-pro', 'opencode-go/qwen3.6-plus', 'opencode/gpt-5.5'];
  const missing = expected.filter((m) => !models.includes(m));
  if (missing.length) {
    log(`model warning: missing ${missing.join(', ')}. Edit .opencode/agents/acceptance-*.md model fields if needed.`);
  } else {
    log('model check passed: default OpenCode acceptance models are available.');
  }
}

function main() {
  if (!fs.existsSync(targetDir)) {
    throw new Error(`Target directory does not exist: ${targetDir}`);
  }
  if (!fs.existsSync(templateAgentsDir)) {
    throw new Error(`Template directory missing: ${templateAgentsDir}`);
  }

  log(`target: ${targetDir}`);
  ensureDir(targetAgentsDir);

  for (const name of fs.readdirSync(templateAgentsDir)) {
    if (!name.endsWith('.md')) continue;
    copyFile(path.join(templateAgentsDir, name), path.join(targetAgentsDir, name));
  }

  if (installSkills) {
    copyTree(templateSkillsDir, targetSkillsDir);
  } else {
    log('OpenCode skills skipped by --no-skills');
  }

  if (updateAgentsMd) {
    updateAgentsBlock();
  } else {
    log('AGENTS.md update skipped by --no-agents-md');
  }

  showModelHint();
  log('done. Restart OpenCode to load new agents.');
}

try {
  main();
} catch (error) {
  console.error(`[opencode-acceptance-agents] ERROR: ${error.message}`);
  process.exit(1);
}
