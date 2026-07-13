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

const PACKAGE = JSON.parse(
  fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'),
);
const PACKAGE_VERSION = PACKAGE.version || '0.0.0';

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
  console.log(`opencode-acceptance-agents installer v${PACKAGE_VERSION}

Usage:
  npx github:Physicalyy/opencode-acceptance-agents [options]

Options:
  --detect             Detect host tools + existing install; print JSON (for AI)
  --human              With --detect: human-readable instead of JSON
  --interactive, -i    Detect, then ask which runtime to install
  --yes, -y            Non-interactive: install detect's recommendedRuntime
  --runtime <name>     opencode | grok | all   (default: opencode)
  --target <project>   Target project directory (default: cwd)
  --force              Overwrite existing agent/skill files
  --dry-run            Print planned changes without writing
  --no-agents-md       Do not update AGENTS.md managed block(s)
  --no-skills          Do not install skill packages
  --no-install-skill   Do not install project skill install-acceptance-agents
  --grok-scope <name>  user | project | both   (default: both)
  --json               Print result JSON after install
  --verify             After install (or alone with --runtime), verify files
  --selfcheck          Verify this package templates are complete; exit 0/1

AI agents (required flow):
  1. node scripts/install.mjs --detect --target <project>
  2. Present choices[] to the user (do NOT dump a copy-paste prompt)
  3. node scripts/install.mjs --runtime <id> --target <project> [--force] --verify --json
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
const templateInstallSkill = path.join(rootDir, 'templates', 'ai', 'install-skill', 'SKILL.md');

const OPENCODE_AGENT_NAMES = [
  'acceptance-agent.md',
  'acceptance-cases.md',
  'acceptance-ui.md',
  'acceptance-review.md',
];

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

function listTemplateHealth() {
  const required = [
    ...OPENCODE_AGENT_NAMES.map((n) => path.join('templates', 'opencode', 'agents', n)),
    path.join('templates', 'opencode', 'skills', 'acceptance-agents', 'SKILL.md'),
    path.join('templates', 'opencode', 'skills', 'test-case-generator', 'SKILL.md'),
    path.join('templates', 'grok', 'agents', 'grok-qa.md'),
    path.join('templates', 'grok', 'skills', 'grok-qa-acceptance', 'SKILL.md'),
    path.join('templates', 'grok', 'skills', 'grok-qa-acceptance', 'references', 'state-machine.md'),
    path.join('templates', 'grok', 'skills', 'grok-qa-acceptance', 'references', 'project-defaults.md'),
    path.join('templates', 'ai', 'install-skill', 'SKILL.md'),
  ];
  const missing = required.filter((rel) => !pathExists(path.join(rootDir, rel)));
  return { ok: missing.length === 0, missing, requiredCount: required.length };
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
  const hasProjectGrokSkill = pathExists(
    path.join(targetDir, '.agents', 'skills', 'grok-qa-acceptance', 'SKILL.md'),
  );
  const hasUserGrokAgent = pathExists(path.join(userGrokDir, 'agents', 'grok-qa.md'));
  const hasUserGrokSkill = pathExists(
    path.join(userGrokDir, 'skills', 'grok-qa-acceptance', 'SKILL.md'),
  );
  const hasOpenCodeAcceptance =
    pathExists(path.join(targetDir, '.opencode', 'agents', 'acceptance-ui.md')) ||
    pathExists(path.join(targetDir, '.opencode', 'agents', 'acceptance-agent.md'));
  const hasInstallSkill = pathExists(
    path.join(targetDir, '.agents', 'skills', 'install-acceptance-agents', 'SKILL.md'),
  );
  const hasAcceptanceDefaults = pathExists(path.join(targetDir, '.trellis', 'acceptance.defaults.md'));

  const hosts = [];
  if (hasGrokCli || hasUserGrokDir || hasProjectGrokAgent || hasUserGrokAgent) hosts.push('grok');
  if (hasOpenCodeCli || hasProjectOpenCode || hasOpenCodeAcceptance) hosts.push('opencode');

  let recommendedRuntime = 'all';
  let recommendReason =
    'Both Grok and OpenCode signals found, or none — default to offering all options.';

  const onlyGrok =
    (hasGrokCli || hasUserGrokDir || hasProjectGrokAgent || hasUserGrokAgent) &&
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

  const gaps = [];
  if (hasProjectGrokAgent && !hasProjectGrokSkill) {
    gaps.push('project grok-qa agent without grok-qa-acceptance skill');
  }
  if (hasUserGrokAgent && !hasUserGrokSkill) {
    gaps.push('user grok-qa agent without grok-qa-acceptance skill');
  }
  if (hasOpenCodeAcceptance) {
    for (const name of OPENCODE_AGENT_NAMES) {
      if (!pathExists(path.join(targetDir, '.opencode', 'agents', name))) {
        gaps.push(`missing OpenCode agent ${name}`);
      }
    }
  }
  if (hasTrellis && !hasAcceptanceDefaults && (hasProjectGrokAgent || hasUserGrokAgent)) {
    gaps.push('Trellis project without .trellis/acceptance.defaults.md (optional but recommended for Grok)');
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

  const templateHealth = listTemplateHealth();

  return {
    packageVersion: PACKAGE_VERSION,
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
      installSkill: hasInstallSkill,
      acceptanceDefaults: hasAcceptanceDefaults,
    },
    gaps,
    templateHealth,
    recommendedRuntime,
    recommendReason,
    choices,
    installCommands: {
      afterUserChooses: `node scripts/install.mjs --runtime <id> --target "${targetDir}" --verify --json`,
      forceRefresh: `node scripts/install.mjs --runtime <id> --target "${targetDir}" --force --verify --json`,
      yesRecommended: `node scripts/install.mjs --yes --target "${targetDir}" --verify --json`,
    },
    aiInstructions: [
      'Do NOT paste a long install prompt for the user to copy elsewhere.',
      'Present the choices[] list and let the user pick one id: grok | opencode | all.',
      'Mark the choice where recommended=true as recommended; explain recommendReason briefly.',
      'If gaps is non-empty, mention incomplete install and offer --force refresh.',
      'After the user chooses, run installCommands.afterUserChooses with <id> replaced.',
      'After install: Grok → new session or /config-agents select grok-qa; OpenCode → restart OpenCode.',
      'Never mix OpenCode and Grok evidence prefixes in one acceptance run.',
    ],
  };
}

function printDetectHuman(report) {
  log(`v${report.packageVersion} detect target: ${report.target}`);
  log(`hosts: ${report.hostsDetected.join(', ') || '(none clear)'}`);
  log(`trellis: ${report.tools.trellis}`);
  log(`recommended: ${report.recommendedRuntime} — ${report.recommendReason}`);
  if (report.gaps?.length) {
    log('gaps:');
    for (const g of report.gaps) log(`  - ${g}`);
  }
  if (report.templateHealth && !report.templateHealth.ok) {
    log(`template package incomplete: missing ${report.templateHealth.missing.join(', ')}`);
  }
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
    console.log(`Install acceptance QA agents v${PACKAGE_VERSION} — pick a runtime:`);
    console.log('');
    report.choices.forEach((c, i) => {
      const mark = c.recommended ? ' <- recommended' : '';
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
    if ((anyInstalled || report.gaps?.length) && !force) {
      const over = (
        await rl.question('Existing/incomplete install detected. Overwrite with --force? [y/N]: ')
      )
        .trim()
        .toLowerCase();
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
    return false;
  }
  if (dryRun) {
    log(`${exists ? 'overwrite' : 'copy'} ${path.relative(rootDir, src)} -> ${dest}`);
    return true;
  }
  ensureDir(path.dirname(dest), dryRun);
  fs.copyFileSync(src, dest);
  log(`${exists ? 'overwrote' : 'installed'} ${path.relative(relBase, dest) || dest}`);
  return true;
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
    log(
      'opencode models could not be checked. After install, run `opencode models` and adjust agent model fields if needed.',
    );
    return;
  }

  const models = result.stdout
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const expected = ['opencode-go/deepseek-v4-pro', 'opencode-go/qwen3.6-plus', 'opencode/gpt-5.5'];
  const missing = expected.filter((m) => !models.includes(m));
  if (missing.length) {
    log(
      `model warning: missing ${missing.join(', ')}. Edit .opencode/agents/acceptance-*.md model fields if needed.`,
    );
  } else {
    log('model check passed: default OpenCode acceptance models are available.');
  }
}

function installProjectInstallSkill(ctx) {
  if (!ctx.installInstallSkill || !ctx.installSkills) return;
  if (!pathExists(templateInstallSkill)) {
    log('install-acceptance-agents skill template missing; skip');
    return;
  }
  const dest = path.join(
    ctx.targetDir,
    '.agents',
    'skills',
    'install-acceptance-agents',
    'SKILL.md',
  );
  copyFile(templateInstallSkill, dest, ctx.targetDir, ctx.force, ctx.dryRun);
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
    copyFile(
      path.join(templateOpenCodeAgentsDir, name),
      path.join(targetAgentsDir, name),
      targetDir,
      force,
      dryRun,
    );
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
Do not mix OpenCode acceptance runs with Grok \`grok-qa\` evidence prefixes in one run.
If the user asks to install or reinstall acceptance agents, prefer skill \`install-acceptance-agents\` (detect → choices → install).`,
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

function maybeWriteAcceptanceDefaultsStub(ctx) {
  if (!ctx.writeDefaultsStub) return;
  const trellisDir = path.join(ctx.targetDir, '.trellis');
  if (!pathExists(trellisDir)) return;
  const dest = path.join(trellisDir, 'acceptance.defaults.md');
  if (pathExists(dest) && !ctx.force) {
    log('skip existing .trellis/acceptance.defaults.md');
    return;
  }
  const body = `# Acceptance Defaults

Project runtime defaults for grok-qa. No real passwords in this file.

## URLs

- \`frontend_url\`: http://localhost:<port>
- \`api_base\`: http://localhost:<port>/<api-prefix>

## Auth

- \`login\`: user-provided | env:QA_USER + env:QA_PASS

## Edit boundary (\`no_edit_globs\`)

- (list product source dirs that QA must not edit)

## Notes

- Fill real ports/routes for this project.
- Optional local override: \`.trellis/acceptance.defaults.local.md\`
`;
  if (ctx.dryRun) {
    log(`write stub ${dest}`);
    return;
  }
  fs.writeFileSync(dest, body, 'utf8');
  log(`wrote ${path.relative(ctx.targetDir, dest)}`);
}

function installGrokRuntime(ctx) {
  const { targetDir, dryRun, updateAgentsMd, grokUser, grokProject } = ctx;

  if (grokUser) {
    installGrokInto(userGrokDir, ['agents'], ['skills'], 'user-global ~/.grok', ctx);
  }
  if (grokProject) {
    installGrokInto(targetDir, ['.grok', 'agents'], ['.agents', 'skills'], 'project', ctx);
    maybeWriteAcceptanceDefaultsStub(ctx);
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
If the user asks to install or reinstall acceptance agents, prefer skill \`install-acceptance-agents\` (detect → choices → install).
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

function verifyInstall(targetDir, runtime, grokScope, dryRun) {
  const checks = [];
  const wantOpenCode = runtime === 'opencode' || runtime === 'all';
  const wantGrok = runtime === 'grok' || runtime === 'all';
  const grokUser = wantGrok && (grokScope === 'user' || grokScope === 'both');
  const grokProject = wantGrok && (grokScope === 'project' || grokScope === 'both');

  const check = (id, p, required = true) => {
    const ok = dryRun ? true : pathExists(p);
    checks.push({ id, path: p, ok, required });
    return ok;
  };

  if (wantOpenCode) {
    for (const name of OPENCODE_AGENT_NAMES) {
      check(`opencode-agent:${name}`, path.join(targetDir, '.opencode', 'agents', name));
    }
    check(
      'opencode-skill:acceptance-agents',
      path.join(targetDir, '.opencode', 'skills', 'acceptance-agents', 'SKILL.md'),
    );
  }

  if (grokUser) {
    check('grok-user-agent', path.join(userGrokDir, 'agents', 'grok-qa.md'));
    check(
      'grok-user-skill',
      path.join(userGrokDir, 'skills', 'grok-qa-acceptance', 'SKILL.md'),
    );
  }
  if (grokProject) {
    check('grok-project-agent', path.join(targetDir, '.grok', 'agents', 'grok-qa.md'));
    check(
      'grok-project-skill',
      path.join(targetDir, '.agents', 'skills', 'grok-qa-acceptance', 'SKILL.md'),
    );
  }

  const requiredFailed = checks.filter((c) => c.required && !c.ok);
  const ok = requiredFailed.length === 0;
  return { ok, dryRun: !!dryRun, checks, failed: requiredFailed.map((c) => c.id) };
}

function runInstall(options) {
  const {
    targetDir,
    runtime,
    force,
    dryRun,
    updateAgentsMd,
    installSkills,
    installInstallSkill,
    writeDefaultsStub,
    grokScope,
    emitJson,
    doVerify,
  } = options;

  if (!fs.existsSync(targetDir)) {
    throw new Error(`Target directory does not exist: ${targetDir}`);
  }

  const health = listTemplateHealth();
  if (!health.ok) {
    throw new Error(`Package templates incomplete: missing ${health.missing.join(', ')}`);
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
    installInstallSkill,
    writeDefaultsStub,
    grokUser,
    grokProject,
  };

  log(`v${PACKAGE_VERSION} target: ${targetDir}`);
  log(`runtime: ${runtime}`);
  if (installGrok) log(`grok-scope: ${grokScope}`);

  if (installOpenCode) installOpenCodeRuntime(ctx);
  if (installGrok) installGrokRuntime(ctx);
  // Always drop install skill into project so future "安装验收 agent" is discoverable
  if (installOpenCode || installGrok) installProjectInstallSkill(ctx);

  let verification = null;
  if (doVerify) {
    verification = verifyInstall(targetDir, runtime, grokScope, dryRun);
    if (verification.ok) {
      log(`verify: OK (${verification.checks.length} checks)`);
    } else {
      log(`verify: FAILED ${verification.failed.join(', ')}`);
    }
  }

  log('done.');

  const result = {
    ok: verification ? verification.ok : true,
    packageVersion: PACKAGE_VERSION,
    target: targetDir,
    runtime,
    grokScope: installGrok ? grokScope : null,
    dryRun,
    verification,
    nextSteps:
      runtime === 'grok'
        ? [
            'New Grok session or /config-agents',
            'Select grok-qa',
            'Fill .trellis/acceptance.defaults.md if Trellis',
            'Ask to accept a Trellis task',
          ]
        : runtime === 'opencode'
          ? ['Restart OpenCode', 'Use acceptance-cases / acceptance-ui / acceptance-review']
          : [
              'Restart OpenCode',
              'New Grok session or /config-agents for grok-qa',
              'Do not mix evidence prefixes',
            ],
  };

  if (emitJson) {
    console.log(JSON.stringify(result, null, 2));
  }

  if (verification && !verification.ok && !dryRun) {
    process.exitCode = 1;
  }

  return result;
}

async function main() {
  const targetDir = path.resolve(readFlag('--target') || process.cwd());
  const force = hasFlag('--force');
  const dryRun = hasFlag('--dry-run');
  const updateAgentsMd = !hasFlag('--no-agents-md');
  const installSkills = !hasFlag('--no-skills');
  const installInstallSkill = !hasFlag('--no-install-skill');
  const writeDefaultsStub = !hasFlag('--no-defaults-stub');
  const emitJson = hasFlag('--json');
  const doVerify = hasFlag('--verify');
  const wantDetect = hasFlag('--detect');
  const wantInteractive = hasFlag('--interactive') || hasFlag('-i');
  const wantYes = hasFlag('--yes') || hasFlag('-y');
  const wantSelfcheck = hasFlag('--selfcheck');

  if (wantSelfcheck) {
    const health = listTemplateHealth();
    const payload = { packageVersion: PACKAGE_VERSION, ...health };
    console.log(JSON.stringify(payload, null, 2));
    process.exit(health.ok ? 0 : 1);
  }

  if (wantDetect) {
    const report = detectEnvironment(targetDir);
    if (hasFlag('--human')) {
      printDetectHuman(report);
    } else {
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
      installInstallSkill,
      writeDefaultsStub,
      grokScope: picked.grokScope,
      emitJson,
      doVerify: true,
    });
    return;
  }

  if (wantYes) {
    const report = detectEnvironment(targetDir);
    log(`--yes: installing recommended runtime=${report.recommendedRuntime}`);
    runInstall({
      targetDir,
      runtime: report.recommendedRuntime,
      force: force || report.gaps.length > 0,
      dryRun,
      updateAgentsMd,
      installSkills,
      installInstallSkill,
      writeDefaultsStub,
      grokScope: (readFlag('--grok-scope') || 'both').toLowerCase(),
      emitJson,
      doVerify: true,
    });
    return;
  }

  // Explicit runtime or legacy default opencode
  const hasRuntimeFlag = hasFlag('--runtime') || readFlag('--runtime') !== undefined;
  let runtimeRaw = (readFlag('--runtime') || 'opencode').toLowerCase();

  // If user only passed --verify without install intent, verify what is there
  if (doVerify && !hasRuntimeFlag && !force && !dryRun) {
    const report = detectEnvironment(targetDir);
    const runtime =
      report.installed.openCodeAcceptance &&
      (report.installed.grokProjectAgent || report.installed.grokUserAgent)
        ? 'all'
        : report.installed.openCodeAcceptance
          ? 'opencode'
          : report.installed.grokProjectAgent || report.installed.grokUserAgent
            ? 'grok'
            : 'all';
    const verification = verifyInstall(
      targetDir,
      runtime,
      (readFlag('--grok-scope') || 'both').toLowerCase(),
      false,
    );
    console.log(JSON.stringify({ packageVersion: PACKAGE_VERSION, runtime, verification }, null, 2));
    process.exit(verification.ok ? 0 : 1);
  }

  // TTY with no explicit runtime → interactive (better UX than silent opencode-only)
  if (!hasRuntimeFlag && process.stdin.isTTY && !hasFlag('--no-auto-interactive')) {
    log('no --runtime on TTY: entering interactive mode (pass --runtime opencode to skip)');
    const report = detectEnvironment(targetDir);
    printDetectHuman(report);
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
      installInstallSkill,
      writeDefaultsStub,
      grokScope: picked.grokScope,
      emitJson,
      doVerify: true,
    });
    return;
  }

  const grokScopeRaw = (readFlag('--grok-scope') || 'both').toLowerCase();

  runInstall({
    targetDir,
    runtime: runtimeRaw,
    force,
    dryRun,
    updateAgentsMd,
    installSkills,
    installInstallSkill,
    writeDefaultsStub,
    grokScope: grokScopeRaw,
    emitJson,
    doVerify: doVerify || false,
  });
}

main().catch((error) => {
  console.error(`[opencode-acceptance-agents] ERROR: ${error.message}`);
  process.exit(1);
});
