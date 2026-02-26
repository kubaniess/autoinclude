/**
 * compile_db.ts
 * Reads compile_commands.json and extracts compiler flags for a given file.
 */

import * as fs from "fs";
import * as path from "path";

interface CompileEntry {
  file: string;
  directory?: string;
  command?: string;
  arguments?: string[];
}

/** Flags we don't want when doing -fsyntax-only. */
const REMOVE_FLAGS = new Set(["-c", "-o", "-MF", "-MT", "-MQ", "-MD", "-MMD"]);

function parseCommandToArgs(command: string): string[] {
  // Simple shell-like split (handles quoted strings but not escapes)
  const args: string[] = [];
  let current = "";
  let inQuote = false;
  let quoteChar = "";
  for (const ch of command) {
    if (inQuote) {
      if (ch === quoteChar) {
        inQuote = false;
      } else {
        current += ch;
      }
    } else if (ch === '"' || ch === "'") {
      inQuote = true;
      quoteChar = ch;
    } else if (ch === " " || ch === "\t") {
      if (current.length > 0) {
        args.push(current);
        current = "";
      }
    } else {
      current += ch;
    }
  }
  if (current.length > 0) args.push(current);
  return args;
}

function extractUsefulFlags(rawArgs: string[]): string[] {
  const useful: string[] = [];
  let skip = false;

  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i];

    if (skip) {
      skip = false;
      continue;
    }

    // Remove the compiler itself (first token) and input file (last)
    if (i === 0) continue; // compiler binary

    if (REMOVE_FLAGS.has(arg)) {
      // Some flags consume the next argument too (e.g. -o output.o)
      if (arg === "-o" || arg === "-MF" || arg === "-MT" || arg === "-MQ") {
        skip = true;
      }
      continue;
    }

    // Keep -I, -D, -std, -isystem, -include, -m*, -W*, -f*
    if (
      arg.startsWith("-I") ||
      arg.startsWith("-D") ||
      arg.startsWith("-std") ||
      arg.startsWith("-isystem") ||
      arg.startsWith("-include") ||
      arg.startsWith("-m") ||
      arg.startsWith("-arch") ||
      arg === "--target" ||
      arg === "-target"
    ) {
      useful.push(arg);
      // Handle space-separated forms: -I /path
      if (
        (arg === "-I" ||
          arg === "-D" ||
          arg === "-isystem" ||
          arg === "-include" ||
          arg === "--target" ||
          arg === "-target") &&
        i + 1 < rawArgs.length
      ) {
        useful.push(rawArgs[++i]);
      }
      continue;
    }
  }

  return useful;
}

/**
 * Try to find compile_commands.json by walking up from the file's directory
 * or from workspaceRoot, and return flags for filePath.
 */
export function getCompileFlags(
  filePath: string,
  workspaceRoot: string | undefined
): string[] | null {
  const dbPath = findCompileDb(filePath, workspaceRoot);
  if (!dbPath) return null;

  try {
    const raw = fs.readFileSync(dbPath, "utf8");
    const db: CompileEntry[] = JSON.parse(raw);

    const normalised = path.normalize(filePath);

    const entry =
      db.find((e) => path.normalize(e.file) === normalised) ??
      db.find((e) => path.basename(e.file) === path.basename(filePath));

    if (!entry) return null;

    const rawArgs = entry.arguments
      ? entry.arguments
      : parseCommandToArgs(entry.command ?? "");

    return extractUsefulFlags(rawArgs);
  } catch {
    return null;
  }
}

function findCompileDb(
  filePath: string,
  workspaceRoot: string | undefined
): string | null {
  // Check workspace root first
  if (workspaceRoot) {
    const candidate = path.join(workspaceRoot, "compile_commands.json");
    if (fs.existsSync(candidate)) return candidate;
    // Also check build subdirectory
    for (const sub of ["build", "out", "cmake-build-debug", "cmake-build-release", ".build"]) {
      const c2 = path.join(workspaceRoot, sub, "compile_commands.json");
      if (fs.existsSync(c2)) return c2;
    }
  }

  // Walk up from file directory
  let dir = path.dirname(filePath);
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(dir, "compile_commands.json");
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return null;
}
