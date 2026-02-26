/**
 * fix_includes.ts
 * Core logic: analyses a file, determines missing includes, and inserts them.
 */

import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { resolveCompiler, runSyntaxCheck, isCppFile } from "./compiler";
import { getCompileFlags } from "./compile_db";
import { parseDiagnostics, MissingInclude } from "./diagnostics_parser";

const MAX_ITERATIONS = 2;

export interface FixResult {
  added: string[];
  unresolved: string[];
  changed: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Build compiler flags
// ─────────────────────────────────────────────────────────────────────────────

function buildFlags(
  filePath: string,
  isCpp: boolean,
  workspaceRoot: string | undefined
): string[] {
  // Try compile DB first
  const dbFlags = getCompileFlags(filePath, workspaceRoot);
  if (dbFlags && dbFlags.length > 0) {
    return dbFlags;
  }

  // Fallback: minimal flags
  const flags: string[] = [];
  flags.push(isCpp ? "-std=c++20" : "-std=c11");
  flags.push("-I", path.dirname(filePath));
  if (workspaceRoot && workspaceRoot !== path.dirname(filePath)) {
    flags.push("-I", workspaceRoot);
  }
  // Suppress some noisy warnings to reduce output noise
  flags.push("-w"); // works on both clang and gcc
  return flags;
}

// ─────────────────────────────────────────────────────────────────────────────
// Include insertion
// ─────────────────────────────────────────────────────────────────────────────

function formatInclude(inc: MissingInclude): string {
  return inc.isSystem ? `#include <${inc.header}>` : `#include "${inc.header}"`;
}

function alreadyIncluded(lines: string[], header: string): boolean {
  const patterns = [
    `#include <${header}>`,
    `#include "${header}"`,
    `#include<${header}>`,
  ];
  return lines.some((l) =>
    patterns.some((p) => l.trim() === p || l.includes(p))
  );
}

/**
 * Find the insertion line index (0-based, insert BEFORE this line).
 * Returns the index after which to insert.
 */
function findInsertionPoint(lines: string[]): number {
  // 1. Skip shebang
  let start = 0;
  if (lines[0]?.startsWith("#!")) {
    start = 1;
  }

  // 2. Skip leading block comment / line comments
  let i = start;
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith("/*")) {
      // Skip to end of block comment
      while (i < lines.length && !lines[i].includes("*/")) i++;
      i++;
      continue;
    }
    if (trimmed.startsWith("//")) {
      i++;
      continue;
    }
    // Skip blank lines between header comment and code
    if (trimmed === "") {
      i++;
      continue;
    }
    break;
  }

  // 3. If #pragma once or #ifndef guard in first 10 lines, insert after it
  for (let j = i; j < Math.min(lines.length, i + 15); j++) {
    const trimmed = lines[j].trim();
    if (trimmed.startsWith("#pragma once") || trimmed.startsWith("#ifndef ") || trimmed.startsWith("#if !defined")) {
      // Also skip #define for header guards
      let k = j + 1;
      if (trimmed.startsWith("#ifndef ") && k < lines.length && lines[k].trim().startsWith("#define ")) {
        k++;
      }
      // Skip blank line after pragma/guard if present
      if (k < lines.length && lines[k].trim() === "") k++;
      return k;
    }
  }

  // 4. Find last #include block
  let lastIncludeLine = -1;
  for (let j = 0; j < lines.length; j++) {
    if (lines[j].trim().startsWith("#include")) {
      lastIncludeLine = j;
    }
    // Stop searching if we hit code (function definitions, class declarations)
    if (j > 50 && lastIncludeLine === -1) break;
  }
  if (lastIncludeLine !== -1) {
    return lastIncludeLine + 1;
  }

  // 5. No includes yet — insert at the computed start position
  return i;
}

/**
 * Insert a sorted list of new includes into the source text.
 * Returns the modified text or null if nothing was inserted.
 */
function insertIncludes(
  source: string,
  newIncludes: MissingInclude[]
): string | null {
  if (newIncludes.length === 0) return null;

  const lines = source.split(/\r?\n/);
  const eol = source.includes("\r\n") ? "\r\n" : "\n";

  // Filter out already-present includes
  const toAdd = newIncludes.filter(
    (inc) => !alreadyIncluded(lines, inc.header)
  );
  if (toAdd.length === 0) return null;

  // Sort alphabetically
  toAdd.sort((a, b) => a.header.localeCompare(b.header));

  const insertAt = findInsertionPoint(lines);
  const newLines = toAdd.map(formatInclude);

  // Add blank line after if the next line isn't blank/include
  const afterLines = lines.slice(insertAt);
  const needsTrailingBlank =
    afterLines.length > 0 &&
    afterLines[0].trim() !== "" &&
    !afterLines[0].trim().startsWith("#include");

  const inserted = [
    ...lines.slice(0, insertAt),
    ...newLines,
    ...(needsTrailingBlank ? [""] : []),
    ...lines.slice(insertAt),
  ];

  return inserted.join(eol);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main fix logic
// ─────────────────────────────────────────────────────────────────────────────

export async function fixIncludes(
  document: vscode.TextDocument,
  progress: vscode.Progress<{ message?: string }>
): Promise<FixResult> {
  const filePath = document.uri.fsPath;
  const isCpp = isCppFile(filePath);
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  progress.report({ message: "detecting compiler…" });
  const compiler = await resolveCompiler(isCpp);

  const flags = buildFlags(filePath, isCpp, workspaceRoot);

  const allAdded: string[] = [];
  let unresolvedLines: string[] = [];

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    progress.report({ message: `analysing (pass ${iteration + 1})…` });

    // Save the current in-memory document state to a temp file if dirty
    // For simplicity we analyse the saved file — VS Code saves before running
    const output = await runSyntaxCheck(compiler, filePath, flags);
    const combined = output.stdout + "\n" + output.stderr;

    const result = parseDiagnostics(combined, isCpp, filePath, workspaceRoot);

    // Read current file content
    let source = fs.readFileSync(filePath, "utf8");

    const newIncludes = result.missing.filter(
      (inc) => !allAdded.includes(inc.header)
    );

    if (newIncludes.length === 0) {
      unresolvedLines = result.unresolved.map((u) => u.line);
      break;
    }

    const modified = insertIncludes(source, newIncludes);
    if (!modified) {
      unresolvedLines = result.unresolved.map((u) => u.line);
      break;
    }

    // Write back
    fs.writeFileSync(filePath, modified, "utf8");

    allAdded.push(...newIncludes.map((i) => i.header));
    unresolvedLines = result.unresolved.map((u) => u.line);

    // Reload document in VS Code
    await reloadDocument(document);
  }

  return {
    added: allAdded,
    unresolved: unresolvedLines,
    changed: allAdded.length > 0,
  };
}

async function reloadDocument(document: vscode.TextDocument): Promise<void> {
  // The file was written externally; VS Code should auto-detect, but we
  // can force it by reverting the document.
  try {
    await vscode.commands.executeCommand("workbench.action.files.revert");
  } catch {
    // non-fatal
  }
}
