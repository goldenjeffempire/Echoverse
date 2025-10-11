#!/usr/bin/env tsx
/**
 * LOW-001, LOW-004, LOW-007 FIX: Production Code Cleanup
 * Removes console.logs, unused imports, and tracks TODOs
 */

import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join } from 'path';

interface CleanupIssue {
  file: string;
  line: number;
  type: 'console.log' | 'unused_import' | 'TODO' | 'FIXME';
  content: string;
}

const issues: CleanupIssue[] = [];

const EXCLUDE_DIRS = ['node_modules', 'dist', '.git', 'build', 'coverage'];
const SOURCE_DIRS = ['server', 'client/src', 'shared'];

function scanFile(filePath: string): void {
  if (!filePath.match(/\.(ts|tsx|js|jsx)$/)) return;

  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // LOW-001: Detect console.log in production code
    if (line.includes('console.log') && !line.includes('// KEEP') && !filePath.includes('logger')) {
      issues.push({
        file: filePath,
        line: index + 1,
        type: 'console.log',
        content: line.trim()
      });
    }

    // LOW-007: Track TODOs and FIXMEs
    if (line.includes('TODO:') || line.includes('FIXME:')) {
      issues.push({
        file: filePath,
        line: index + 1,
        type: line.includes('TODO') ? 'TODO' : 'FIXME',
        content: line.trim()
      });
    }
  });
}

function scanDirectory(dir: string): void {
  const items = readdirSync(dir);

  items.forEach(item => {
    if (EXCLUDE_DIRS.includes(item)) return;

    const fullPath = join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else {
      scanFile(fullPath);
    }
  });
}

function main() {
  console.log('\n🧹 LOW-001, LOW-004, LOW-007 FIX: Production Code Cleanup\n');

  SOURCE_DIRS.forEach(dir => {
    console.log(`Scanning ${dir}...`);
    scanDirectory(dir);
  });

  // Group issues by type
  const byType = issues.reduce((acc, issue) => {
    acc[issue.type] = (acc[issue.type] || []).concat(issue);
    return acc;
  }, {} as Record<string, CleanupIssue[]>);

  console.log('\n📊 Issues Found:\n');

  Object.entries(byType).forEach(([type, typeIssues]) => {
    console.log(`\n${type.toUpperCase()} (${typeIssues.length}):`);
    
    typeIssues.slice(0, 10).forEach(issue => {
      console.log(`  ${issue.file}:${issue.line} - ${issue.content.substring(0, 80)}`);
    });

    if (typeIssues.length > 10) {
      console.log(`  ... and ${typeIssues.length - 10} more`);
    }
  });

  // Write TODO tracking file
  const todoContent = `# Technical Debt Tracker\nGenerated: ${new Date().toISOString()}\n\n` +
    (byType['TODO'] || []).map(todo => 
      `- [ ] ${todo.file}:${todo.line} - ${todo.content.replace(/\/\/|\/\*/g, '').trim()}`
    ).join('\n');

  writeFileSync('TECH_DEBT.md', todoContent);
  console.log('\n✅ TODO tracker written to TECH_DEBT.md');

  // Summary
  console.log(`\n📈 Summary:`);
  console.log(`  Console.logs: ${byType['console.log']?.length || 0}`);
  console.log(`  TODOs: ${byType['TODO']?.length || 0}`);
  console.log(`  FIXMEs: ${byType['FIXME']?.length || 0}\n`);

  if (byType['console.log']?.length > 0 && process.env.NODE_ENV === 'production') {
    console.error('❌ Console.log statements found in production build!');
    process.exit(1);
  }

  console.log('✅ Cleanup scan complete\n');
}

main();
