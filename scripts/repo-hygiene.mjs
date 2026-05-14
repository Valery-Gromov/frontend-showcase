#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const failures = [];
const warnings = [];

function fail(message) {
  failures.push(message);
}

function warn(message) {
  warnings.push(message);
}

function rel(path) {
  return relative(root, path) || '.';
}

function read(path) {
  return readFileSync(path, 'utf8');
}

function listDirs(path) {
  if (!existsSync(path)) return [];
  return readdirSync(path)
    .map((name) => join(path, name))
    .filter((entry) => statSync(entry).isDirectory());
}

function listFilesRecursive(path) {
  if (!existsSync(path)) return [];
  const result = [];
  const stack = [path];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    const entries = readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'coverage') continue;
        stack.push(fullPath);
      } else if (entry.isFile()) {
        result.push(fullPath);
      }
    }
  }

  return result;
}

function gitTrackedFiles() {
  const output = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' });
  return output.split('\n').filter(Boolean);
}

function checkForbiddenTrackedArtifacts() {
  const forbidden = [
    /(^|\/)node_modules\//,
    /(^|\/)dist\//,
    /(^|\/)coverage\//,
    /(^|\/)\.DS_Store$/,
  ];
  const offenders = gitTrackedFiles().filter((file) => forbidden.some((pattern) => pattern.test(file)));
  for (const offender of offenders) {
    fail(`Forbidden tracked artifact: ${offender}`);
  }
}

function checkWorkspaceDirs() {
  for (const workspaceRoot of ['apps', 'packages']) {
    for (const dir of listDirs(join(root, workspaceRoot))) {
      const packageJson = join(dir, 'package.json');
      if (!existsSync(packageJson)) {
        const files = listFilesRecursive(dir);
        const message = `${rel(dir)} has no package.json`;
        if (files.length === 0) fail(`${message} and appears to be empty/stale`);
        else fail(message);
      }
    }
  }
}

function checkReadmes() {
  const missing = [];
  for (const workspaceRoot of ['apps', 'packages']) {
    for (const dir of listDirs(join(root, workspaceRoot))) {
      if (!existsSync(join(dir, 'package.json'))) continue;
      if (!existsSync(join(dir, 'README.md'))) missing.push(rel(join(dir, 'README.md')));
    }
  }
  for (const readme of missing) {
    fail(`Missing workspace README: ${readme}`);
  }

  const rootReadme = read(join(root, 'README.md'));
  for (const requiredLink of [
    'docs/architecture.md',
    'docs/comparison.md',
    'docs/performance.md',
    'docs/decisions/',
  ]) {
    if (!rootReadme.includes(requiredLink)) {
      fail(`Root README does not link ${requiredLink}`);
    }
  }
}

function checkRequiredDocsAndRules() {
  for (const required of [
    'docs/agent-handoff.md',
    'docs/architecture.md',
    'docs/dependency-graph.md',
    'docs/comparison.md',
    'docs/performance.md',
    'docs/decisions',
    '.cursor/rules/context-management.mdc',
    '.cursor/rules/agent-handoff.mdc',
  ]) {
    if (!existsSync(join(root, required))) fail(`Missing required project guide: ${required}`);
  }
}

function checkRawAppCssColors() {
  const colorPattern = /#[0-9a-fA-F]{3,8}\b|rgba?\(/;
  const cssFiles = listFilesRecursive(join(root, 'apps')).filter((file) => file.endsWith('.css'));
  for (const file of cssFiles) {
    const text = read(file);
    if (colorPattern.test(text)) {
      fail(`Raw color literal in app CSS: ${rel(file)}. Use UI tokens instead.`);
    }
  }
}

function checkImportBoundaries() {
  const sourceFiles = [
    ...listFilesRecursive(join(root, 'apps')).filter((file) => /\.[tj]sx?$/.test(file)),
    ...listFilesRecursive(join(root, 'packages')).filter((file) => /\.[tj]sx?$/.test(file)),
  ];

  for (const file of sourceFiles) {
    const path = rel(file);
    const text = read(file);

    if (path.startsWith('packages/sdk/') && /from ['"](@frontend-showcase\/ui|@frontend-showcase\/hooks|react)/.test(text)) {
      fail(`Import boundary violation in ${path}: sdk must not import UI, hooks, or React`);
    }

    if (path.startsWith('packages/hooks/') && /from ['"]@frontend-showcase\/ui/.test(text)) {
      fail(`Import boundary violation in ${path}: hooks must not import UI`);
    }

    if (path.startsWith('packages/ui/') && /from ['"]@frontend-showcase\/sdk/.test(text)) {
      fail(`Import boundary violation in ${path}: ui must not import SDK`);
    }

    if (path.startsWith('apps/') && /from ['"](?:\.\.\/)*\.\.\/(?:\.\.\/)*apps\//.test(text)) {
      fail(`Import boundary violation in ${path}: apps must not import other apps`);
    }
  }
}

function checkHandoffFreshness() {
  const handoff = join(root, 'docs/agent-handoff.md');
  if (!existsSync(handoff)) return;
  const text = read(handoff);
  if (!text.includes('Recent Agent Entries')) {
    fail('docs/agent-handoff.md is missing Recent Agent Entries section');
  }
  if (text.includes('Verification: not yet run')) {
    warn('docs/agent-handoff.md contains an entry with verification not yet run');
  }
}

checkForbiddenTrackedArtifacts();
checkWorkspaceDirs();
checkReadmes();
checkRequiredDocsAndRules();
checkRawAppCssColors();
checkImportBoundaries();
checkHandoffFreshness();

for (const message of warnings) {
  console.warn(`WARN ${message}`);
}

if (failures.length > 0) {
  console.error('\nRepo hygiene failed:\n');
  for (const message of failures) {
    console.error(`- ${message}`);
  }
  process.exit(1);
}

console.log('Repo hygiene passed.');
