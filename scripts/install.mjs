#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { stdin as input, stdout as output } from 'node:process';

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

function printHelp() {
  console.log(`opencode-acceptance-agents installer

Usage:
  npx github:Physicalyy/opencode-acceptance-agents [options]

Options:
  --detect             Detect host tools + existing install; print JSON (for AI / scripts)
  --interactive, -i    Detect, then ask which runtime to install (recommended for humans)
  --runtime <name>     opencode | grok | all   (default: opencode; ignored with --interactive)
  --target <project>   Target project directory. Defaults to current working directory.
  --force              Overwrite existing agent/skill files.
  --dry-run            Print planned changes without writing files.
  --no-agents-md       Do not update AGENTS.md managed block(s).
  --no-skills          Do not install skill packages.
  --grok-scope <name>  user | project | both   (default: both; only for grok runtime)
  --json               With install: also print a small result JSON line at the end

AI agents:
  1. Run: node scripts/install.mjs --detect --target <project>
  2. Present runtime choices to the user (do NOT dump a copy-paste prompt)
  3. After user picks, run install with --runtime <choice>
`);
}

if (hasFlag('--help') || hasFlag('-h')) {
  printHelp();
  process.exit(0);
}

const homeDir = os.homedir();
const userGrokDir = path.join(homeDir, '.grok');

const templateOpenCodeAgentsDir = path.join(rootDir, 'templates', 'opencode', 'agents');
const templateOpenCodeSkillsDir = path.join(rootDir, 'templates', 'opencode', 'skills');
const templateGrokAgentsDir = path.join(rootDir, 'templates', 'grok', 'agents');
const templateGrokSkillsDir = path.join(rootDir, 'templates', 'grok', 'skills');

function log(message) {
  console.log(`[opencode-acceptance-agents] ${message}`);
}

function commandExists(cmd) {
  const probe = process.platform === 'win32' ? 'where' : 'which';
  const result = spawnSync(probe, [cmd], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  return result.status === 0;
}

function pathExists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

/**
 * Detect environment for AI / interactive install.
 * AI should call this first, then ask the user to choose — never only paste a prompt.
 */
function detectEnvironment(targetDir) {
  const hasOpenCodeCli = commandExists('opencode');
  const hasGrokCli = commandExists('grok');
  const hasUserGrokDir = pathExists(userGrokDir);
  const hasTrellis = pathExists(path.join(targetDir, '.trellis'));
  const hasProjectOpenCode = pathExists(path.join(targetDir, '.opencode'));
  const hasProjectGrokAgent = pathExists(path.join(targetDir, '.grok', 'agents', 'grok-qa.md'));
  const hasProjectGrokSkill = pathExists(path.join(targetDir, '.agents', 'skills', 'grok-qa-acceptance', 'SKILL.md'));
  const hasUserGrokAgent = pathExists(path.join(userGrokDir, 'agents', 'grok-qa.md'));
  const hasUserGrokSkill = pathExists(path.join(userGrokDir, 'skills', 'grok-qa-acceptance', 'SKILL.md'));
  const hasOpenCodeAcceptance =
    pathExists(path.join(targetDir, '.opencode', 'agents', 'acceptance-ui.md')) ||
    pathExists(path.join(targetDir, '.opencode', 'agents', 'acceptance-agent.md'));

  const hosts = [];
  if (hasGrokCli || hasUserGrokDir || hasProjectGrokAgent) hosts.push('grok');
  if (hasOpenCodeCli || hasProjectOpenCode || hasOpenCodeAcceptance) hosts.push('opencode');

  // Recommendation
  let recommendedRuntime = 'all';
  let recommendReason = 'Both Grok and OpenCode signals found, or none — default to offering all options.';

  const onlyGrok =
    (hasGrokCli || hasUserGrokDir || hasProjectGrokAgent) &&
    !hasOpenCodeCli &&
    !hasProjectOpenCode &&
    !hasOpenCodeAcceptance;
  const onlyOpenCode =
    (hasOpenCodeCli || hasProjectOpenCode || hasOpenCodeAcceptance) &&
    !hasGrokCli &&
    !hasUserGrokDir &&
    !hasProjectGrokAgent &&
    !hasUserGrokAgent;

  if (onlyGrok) {
    recommendedRuntime = 'grok';
    recommendReason = 'Detected Grok environment without OpenCode acceptance install signals.';
  } else if (onlyOpenCode) {
    recommendedRuntime = 'opencode';
    recommendReason = 'Detected OpenCode environment without Grok agent install signals.';
  } else if (hasGrokCli && hasOpenCodeCli) {
    recommendedRuntime = 'all';
    recommendReason = 'Both grok and opencode CLIs are available.';
  } else if (!hosts.length) {
    recommendedRuntime = 'all';
    recommendReason = 'No host clearly detected; recommend offering all options to the user.';
  }

  const choices = [
    {
      id: 'grok',
      label: 'Grok only (grok-qa)',
      description: 'Single-agent full loop; installs ~/.grok + project .grok/.agents',
      recommended: recommendedRuntime === 'grok',
    },
    {
      id: 'opencode',
      label: 'OpenCode only (acceptance-*)',
      description: 'Multi-agent multi-model; installs project .opencode',
      recommended: recommendedRuntime === 'opencode',
    },
    {
      id: 'all',
      label: 'Both OpenCode + Grok',
      description: 'Install both runtimes; do not mix evidence in one acceptance run',
      recommended: recommendedRuntime === 'all',
    },
  ];

  return {
    target: targetDir,
    hostsDetected: hosts,
    tools: {
      grokCli: hasGrokCli,
      opencodeCli: hasOpenCodeCli,
      userGrokDir: hasUserGrokDir,
      trellis: hasTrellis,
    },
    installed: {
      grokUserAgent: hasUserGrokAgent,
      grokUserSkill: hasUserGrokSkill,
      grokProjectAgent: hasProjectGrokAgent,
      grokProjectSkill: hasProjectGrokSkill,
      openCodeAcceptance: hasOpenCodeAcceptance,
      projectOpenCodeDir: hasProjectOpenCode,
    },
    recommendedRuntime,
    recommendReason,
    choices,
    aiInstructions: [
      'Do NOT paste a long install prompt for the user to copy elsewhere.',
      'Present the choices[] list (or equivalent) and let the user pick one id: grok | opencode | all.',
      'Mark the choice where recommended=true as recommended.',
      'After the user chooses, run: node scripts/install.mjs --runtime <id> --target <target> [--force]',
      'If already installed and user wants refresh, pass --force.',
      'After install: Grok → new session or /config-agents select grok-qa; OpenCode → restart OpenCode.',
    ],
  };
}

function printDetectHuman(report) {
  log(`detect target: ${report.target}`);
  log(`hosts: ${report.hostsDetected.join(', ') || '(none clear)'}`);
  log(`trellis: ${report.tools.trellis}`);
  log(`recommended: ${report.recommendedRuntime} — ${report.recommendReason}`);
  log('choices:');
  for (const c of report.choices) {
    log(`  [${c.id}] ${c.label}${c.recommended ? ' (recommended)' : ''} — ${c.description}`);
  }
  log('installed snapshot:');
  for (const [k, v] of Object.entries(report.installed)) {
    log(`  ${k}: ${v}`);
  }
}

async function promptInteractive(report) {
  const rl = readline.createInterface({ input, output });
  try {
    console.log('');
    console.log('Install acceptance QA agents — pick a runtime:');
    console.log('');
    report.choices.forEach((c, i) => {
      const mark = c.recommended ? ' ← recommended' : '';
      console.log(`  ${i + 1}) ${c.id.padEnd(8)} ${c.label}${mark}`);
      console.log(`      ${c.description}`);
    });
    console.log('  0) cancel');
    console.log('');

    const defaultIdx = report.choices.findIndex((c) => c.recommended) + 1 || 3;
    const answer = (await rl.question(`Your choice [0-3] (default ${defaultIdx}): `)).trim();
    const n = answer === '' ? defaultIdx : Number(answer);
    if (n === 0 || Number.isNaN(n)) {
      return null;
    }
    const choice = report.choices[n - 1];
    if (!choice) {
      throw new Error(`Invalid choice: ${answer}`);
    }

    let force = hasFlag('--force');
    const anyInstalled = Object.values(report.installed).some(Boolean);
    if (anyInstalled && !force) {
      const over = (await rl.question('Existing install detected. Overwrite with --force? [y/N]: ')).trim().toLowerCase();
      force = over === 'y' || over === 'yes';
    }

    let grokScope = readFlag('--grok-scope') || 'both';
    if (choice.id === 'grok' || choice.id === 'all') {
      const scopeAns = (await rl.question('Grok scope: 1) both  2) user  3) project  [1]: ')).trim();
      if (scopeAns === '2') grokScope = 'user';
      else if (scopeAns === '3') grokScope = 'project';
      else grokScope = 'both';
    }

    return { runtime: choice.id, force, grokScope };
  } finally {
    rl.close();
  }
}

function ensureDir(dir, dryRun) {
  if (dryRun) {
    log(`mkdir ${dir}`);
    return;
  }
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest, relBase, force, dryRun) {
  const exists = fs.existsSync(dest);
  if (exists && !force) {
    log(`skip existing ${path.relative(relBase, dest) || dest} (use --force to overwrite)`);
    return;
  }
  if (dryRun) {
    log(`${exists ? 'overwrite' : 'copy'} ${path.relative(rootDir, src)} -> ${dest}`);
    return;
  }
  ensureDir(path.dirname(dest), dryRun);
  fs.copyFileSync(src, dest);
  log(`${exists ? 'overwrote' : 'installed'} ${path.relative(relBase, dest) || dest}`);
}

function copyTree(srcDir, destDir, relBase, force, dryRun) {
  if (!fs.existsSync(srcDir)) return;
  ensureDir(destDir, dryRun);
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const src = path.join(srcDir, entry.name);
    const dest = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyTree(src, dest, relBase, force, dryRun);
    } else if (entry.isFile()) {
      copyFile(src, dest, relBase, force, dryRun);
    }
  }
}

function updateManagedBlock(filePath, start, end, body, relBase, dryRun) {
  const block = `${start}
${body.trim()}

${end}`;

  let current = '';
  if (fs.existsSync(filePath)) {
    current = fs.readFileSync(filePath, 'utf8');
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
    throw new Error(`AGENTS.md has incomplete managed markers: ${filePath}`);
  }

  if (dryRun) {
    log(`update ${filePath} managed block`);
    return;
  }
  fs.writeFileSync(filePath, next, 'utf8');
  log(`updated ${path.relative(relBase, filePath) || filePath}`);
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

function installOpenCodeRuntime(ctx) {
  const { targetDir, force, dryRun, updateAgentsMd, installSkills } = ctx;
  if (!fs.existsSync(templateOpenCodeAgentsDir)) {
    throw new Error(`Template directory missing: ${templateOpenCodeAgentsDir}`);
  }

  const targetAgentsDir = path.join(targetDir, '.opencode', 'agents');
  const targetSkillsDir = path.join(targetDir, '.opencode', 'skills');
  const agentsMdPath = path.join(targetDir, 'AGENTS.md');

  log(`installing OpenCode runtime into ${targetDir}`);
  ensureDir(targetAgentsDir, dryRun);

  for (const name of fs.readdirSync(templateOpenCodeAgentsDir)) {
    if (!name.endsWith('.md')) continue;
    copyFile(path.join(templateOpenCodeAgentsDir, name), path.join(targetAgentsDir, name), targetDir, force, dryRun);
  }

  if (installSkills) {
    copyTree(templateOpenCodeSkillsDir, targetSkillsDir, targetDir, force, dryRun);
  } else {
    log('OpenCode skills skipped by --no-skills');
  }

  if (updateAgentsMd) {
    updateManagedBlock(
      agentsMdPath,
      '<!-- opencode-acceptance-agents:start -->',
      '<!-- opencode-acceptance-agents:end -->',
      `# OpenCode Acceptance Agents

When the user asks to generate acceptance cases, prefer the \`acceptance-cases\` agent.
When generating cases, default to UI-first / Midscene-ready cases and avoid unrelated backend compile, source inspection, configuration, or database-internal cases unless explicitly requested.
When the user asks to execute UI/Midscene acceptance, prefer the \`acceptance-ui\` agent.
When the user asks to review an acceptance report, prefer the \`acceptance-review\` agent.
When the project has \`.trellis/\`, read Trellis task artifacts first; otherwise write acceptance artifacts under \`acceptance-artifacts/\`.
Do not mix OpenCode acceptance runs with Grok \`grok-qa\` evidence prefixes in one run.`,
      targetDir,
      dryRun,
    );
  } else {
    log('AGENTS.md OpenCode block skipped by --no-agents-md');
  }

  showModelHint();
  log('OpenCode runtime done. Restart OpenCode to load new agents.');
}

function installGrokInto(baseDir, agentsSub, skillsSub, label, ctx) {
  const { force, dryRun, installSkills } = ctx;
  if (!fs.existsSync(templateGrokAgentsDir)) {
    throw new Error(`Template directory missing: ${templateGrokAgentsDir}`);
  }

  const agentsDir = path.join(baseDir, ...agentsSub);
  const skillsDir = path.join(baseDir, ...skillsSub);

  log(`installing Grok runtime (${label}) into ${baseDir}`);
  ensureDir(agentsDir, dryRun);

  for (const name of fs.readdirSync(templateGrokAgentsDir)) {
    if (!name.endsWith('.md')) continue;
    copyFile(path.join(templateGrokAgentsDir, name), path.join(agentsDir, name), baseDir, force, dryRun);
  }

  if (installSkills) {
    copyTree(templateGrokSkillsDir, skillsDir, baseDir, force, dryRun);
  } else {
    log('Grok skills skipped by --no-skills');
  }
}

function installGrokRuntime(ctx) {
  const { targetDir, dryRun, updateAgentsMd, grokUser, grokProject } = ctx;

  if (grokUser) {
    installGrokInto(userGrokDir, ['agents'], ['skills'], 'user-global ~/.grok', ctx);
  }
  if (grokProject) {
    installGrokInto(targetDir, ['.grok', 'agents'], ['.agents', 'skills'], 'project', ctx);
  }

  if (updateAgentsMd && grokProject) {
    const agentsMdPath = path.join(targetDir, 'AGENTS.md');
    updateManagedBlock(
      agentsMdPath,
      '<!-- grok-qa-acceptance-agents:start -->',
      '<!-- grok-qa-acceptance-agents:end -->',
      `# Grok QA Acceptance Agent

When the user asks to start testing, run acceptance, generate UI-first cases, run Midscene/UI verification, narrow API smoke, review acceptance reports, or rerun from scratch on a Trellis task, prefer agent \`grok-qa\`.
Full flow: cases -> ui -> api(narrow) -> review -> gate.
Use skill \`grok-qa-acceptance\` contracts. Write \`dispatchMode=grok-agent\` and evidence \`evidence/grok-qa-routing-*.jsonl\`; prefer report \`test-run-*-grok-acceptance.md\`.
When the project has \`.trellis/\`, read task artifacts and optional \`.trellis/acceptance.defaults.md\` first.
Do not call OpenCode \`/local-acceptance/*\` or mix OpenCode routing evidence filenames in a Grok run.
After install, open a new Grok session or use \`/config-agents\` to select \`grok-qa\`.`,
      targetDir,
      dryRun,
    );
  } else if (!updateAgentsMd) {
    log('AGENTS.md Grok block skipped by --no-agents-md');
  }

  log('Grok runtime done. New Grok session or /config-agents to see grok-qa.');
  if (grokUser) log(`user-global agent: ${path.join(userGrokDir, 'agents', 'grok-qa.md')}`);
  if (grokProject) {
    log(`project agent: ${path.join(targetDir, '.grok', 'agents', 'grok-qa.md')}`);
    log(`project skill: ${path.join(targetDir, '.agents', 'skills', 'grok-qa-acceptance')}`);
  }
}

function runInstall(options) {
  const {
    targetDir,
    runtime,
    force,
    dryRun,
    updateAgentsMd,
    installSkills,
    grokScope,
    emitJson,
  } = options;

  if (!fs.existsSync(targetDir)) {
    throw new Error(`Target directory does not exist: ${targetDir}`);
  }

  const validRuntimes = new Set(['opencode', 'grok', 'all']);
  const validGrokScopes = new Set(['user', 'project', 'both']);
  if (!validRuntimes.has(runtime)) {
    throw new Error(`invalid runtime ${runtime}. Use opencode|grok|all`);
  }
  if (!validGrokScopes.has(grokScope)) {
    throw new Error(`invalid grok-scope ${grokScope}. Use user|project|both`);
  }

  const installOpenCode = runtime === 'opencode' || runtime === 'all';
  const installGrok = runtime === 'grok' || runtime === 'all';
  const grokUser = installGrok && (grokScope === 'user' || grokScope === 'both');
  const grokProject = installGrok && (grokScope === 'project' || grokScope === 'both');

  const ctx = {
    targetDir,
    force,
    dryRun,
    updateAgentsMd,
    installSkills,
    grokUser,
    grokProject,
  };

  log(`target: ${targetDir}`);
  log(`runtime: ${runtime}`);
  if (installGrok) log(`grok-scope: ${grokScope}`);

  if (installOpenCode) installOpenCodeRuntime(ctx);
  if (installGrok) installGrokRuntime(ctx);

  log('done.');

  if (emitJson) {
    console.log(
      JSON.stringify({
        ok: true,
        target: targetDir,
        runtime,
        grokScope: installGrok ? grokScope : null,
        dryRun,
        nextSteps:
          runtime === 'grok'
            ? ['New Grok session or /config-agents', 'Select grok-qa', 'Ask to accept a Trellis task']
            : runtime === 'opencode'
              ? ['Restart OpenCode', 'Use acceptance-cases / acceptance-ui / acceptance-review']
              : ['Restart OpenCode', 'New Grok session or /config-agents for grok-qa', 'Do not mix evidence prefixes'],
      }),
    );
  }
}

async function main() {
  const targetDir = path.resolve(readFlag('--target') || process.cwd());
  const force = hasFlag('--force');
  const dryRun = hasFlag('--dry-run');
  const updateAgentsMd = !hasFlag('--no-agents-md');
  const installSkills = !hasFlag('--no-skills');
  const emitJson = hasFlag('--json');
  const wantDetect = hasFlag('--detect');
  const wantInteractive = hasFlag('--interactive') || hasFlag('-i');

  if (wantDetect) {
    const report = detectEnvironment(targetDir);
    if (hasFlag('--human')) {
      printDetectHuman(report);
    } else {
      // Default JSON for AI agents
      console.log(JSON.stringify(report, null, 2));
    }
    return;
  }

  if (wantInteractive) {
    const report = detectEnvironment(targetDir);
    printDetectHuman(report);
    if (!process.stdin.isTTY && !hasFlag('--force-interactive')) {
      log('stdin is not a TTY. For AI: use --detect then ask the user, then --runtime <choice>.');
      console.log(JSON.stringify({ mode: 'non-interactive', report }, null, 2));
      process.exit(2);
    }
    const picked = await promptInteractive(report);
    if (!picked) {
      log('cancelled.');
      process.exit(0);
    }
    runInstall({
      targetDir,
      runtime: picked.runtime,
      force: picked.force || force,
      dryRun,
      updateAgentsMd,
      installSkills,
      grokScope: picked.grokScope,
      emitJson,
    });
    return;
  }

  const runtimeRaw = (readFlag('--runtime') || 'opencode').toLowerCase();
  const grokScopeRaw = (readFlag('--grok-scope') || 'both').toLowerCase();

  runInstall({
    targetDir,
    runtime: runtimeRaw,
    force,
    dryRun,
    updateAgentsMd,
    installSkills,
    grokScope: grokScopeRaw,
    emitJson,
  });
}

main().catch((error) => {
  console.error(`[opencode-acceptance-agents] ERROR: ${error.message}`);
  process.exit(1);
});
