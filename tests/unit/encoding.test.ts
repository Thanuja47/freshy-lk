import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function walk(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        walk(fullPath, fileList);
      }
    } else if (/\.(tsx?|jsx?|html)$/.test(file)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

describe('UTF-8 Encoding & HTML Charset Suite', () => {
  it('ensures RootLayout contains an explicit <meta charSet="utf-8" />', () => {
    const layoutPath = path.join(process.cwd(), 'src/app/layout.tsx');
    const content = fs.readFileSync(layoutPath, 'utf8');
    expect(content.toLowerCase()).toMatch(/charset=["']?utf-8["']?/);
  });

  it('ensures no mis-encoded characters exist in any source files (Ã, â€, Г, Γ, \\uFFFD)', () => {
    const srcDir = path.join(process.cwd(), 'src');
    const allFiles = walk(srcDir);
    const bannedPatterns = [/Ã/, /â€/, /Г/, /Γ/, /\uFFFD/];

    const violations: { file: string; line: number; match: string }[] = [];

    for (const filePath of allFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        for (const pattern of bannedPatterns) {
          if (pattern.test(line)) {
            violations.push({
              file: path.relative(process.cwd(), filePath),
              line: index + 1,
              match: line.trim(),
            });
            break;
          }
        }
      });
    }

    if (violations.length > 0) {
      console.error('Found encoding violations:', violations);
    }
    expect(violations).toEqual([]);
  });
});
