/**
 * compiler.ts
 * Handles compiler detection and running -fsyntax-only analysis.
 */

import { execFile } from "child_process";
import * as path from "path";

export type CompilerOutput = {
  stdout: string;
  stderr: string;
};

const TIMEOUT_MS = 15_000;

/** Output channel reference set by extension.ts */
let _debugChannel: { appendLine: (s: string) => void } | null = null;

export function setDebugChannel(ch: { appendLine: (s: string) => void }) {
  _debugChannel = ch;
}

function log(msg: string) {
  _debugChannel?.appendLine(msg);
}

/** Probe whether a binary exists in PATH. */
function probeCompiler(bin: string): Promise<boolean> {
  return new Promise((resolve) => {
    const checkCmd = process.platform === "win32" ? "where" : "which";
    const child = execFile(checkCmd, [bin], { timeout: 4000 }, (err) => {
      resolve(!err);
    });
    child.on("error", () => resolve(false));
  });
}

/** Resolve the best compiler for the given file type. */
export async function resolveCompiler(isCpp: boolean): Promise<string> {
  const candidates = isCpp
    ? ["clang++", "g++", "clang++.exe", "g++.exe"]
    : ["clang", "gcc", "clang.exe", "gcc.exe"];

  for (const bin of candidates) {
    if (await probeCompiler(bin)) {
      log(`[AutoInclude] Compiler found: ${bin}`);
      return bin;
    }
  }

  throw new Error(
    `No C/C++ compiler found in PATH.\n` +
    `Install clang (https://releases.llvm.org) or GCC and ensure it is in PATH.\n` +
    `  macOS:   brew install llvm\n` +
    `  Ubuntu:  sudo apt install clang\n` +
    `  Windows: https://releases.llvm.org  (check "Add LLVM to PATH")`
  );
}

/**
 * Run the compiler in -fsyntax-only mode.
 */
export async function runSyntaxCheck(
  compiler: string,
  filePath: string,
  extraFlags: string[]
): Promise<CompilerOutput> {
  const args = ["-fsyntax-only", ...extraFlags, filePath];

  log(`[AutoInclude] Running: ${compiler} ${args.join(" ")}`);

  return new Promise((resolve) => {
    execFile(
      compiler,
      args,
      { timeout: TIMEOUT_MS, maxBuffer: 2 * 1024 * 1024 },
      (err, stdout, stderr) => {
        log(`[AutoInclude] STDOUT:\n${stdout || "(empty)"}`);
        log(`[AutoInclude] STDERR:\n${stderr || "(empty)"}`);
        if (err) {
          log(`[AutoInclude] Exit code: ${(err as NodeJS.ErrnoException & { code?: number }).code ?? "unknown"}`);
        }
        resolve({ stdout: stdout ?? "", stderr: stderr ?? "" });
      }
    );
  });
}

/** Determine whether a file path refers to a C++ file. */
export function isCppFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return [".cpp", ".cc", ".cxx", ".hpp"].includes(ext);
}