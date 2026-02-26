"use strict";
/**
 * compiler.ts
 * Handles compiler detection and running -fsyntax-only analysis.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDebugChannel = setDebugChannel;
exports.resolveCompiler = resolveCompiler;
exports.runSyntaxCheck = runSyntaxCheck;
exports.isCppFile = isCppFile;
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const TIMEOUT_MS = 15000;
/** Output channel reference set by extension.ts */
let _debugChannel = null;
function setDebugChannel(ch) {
    _debugChannel = ch;
}
function log(msg) {
    _debugChannel?.appendLine(msg);
}
/** Probe whether a binary exists in PATH. */
function probeCompiler(bin) {
    return new Promise((resolve) => {
        const checkCmd = process.platform === "win32" ? "where" : "which";
        const child = (0, child_process_1.execFile)(checkCmd, [bin], { timeout: 4000 }, (err) => {
            resolve(!err);
        });
        child.on("error", () => resolve(false));
    });
}
/** Resolve the best compiler for the given file type. */
async function resolveCompiler(isCpp) {
    const candidates = isCpp
        ? ["clang++", "g++", "clang++.exe", "g++.exe"]
        : ["clang", "gcc", "clang.exe", "gcc.exe"];
    for (const bin of candidates) {
        if (await probeCompiler(bin)) {
            log(`[AutoInclude] Compiler found: ${bin}`);
            return bin;
        }
    }
    throw new Error(`No C/C++ compiler found in PATH.\n` +
        `Install clang (https://releases.llvm.org) or GCC and ensure it is in PATH.\n` +
        `  macOS:   brew install llvm\n` +
        `  Ubuntu:  sudo apt install clang\n` +
        `  Windows: https://releases.llvm.org  (check "Add LLVM to PATH")`);
}
/**
 * Run the compiler in -fsyntax-only mode.
 */
async function runSyntaxCheck(compiler, filePath, extraFlags) {
    const args = ["-fsyntax-only", ...extraFlags, filePath];
    log(`[AutoInclude] Running: ${compiler} ${args.join(" ")}`);
    return new Promise((resolve) => {
        (0, child_process_1.execFile)(compiler, args, { timeout: TIMEOUT_MS, maxBuffer: 2 * 1024 * 1024 }, (err, stdout, stderr) => {
            log(`[AutoInclude] STDOUT:\n${stdout || "(empty)"}`);
            log(`[AutoInclude] STDERR:\n${stderr || "(empty)"}`);
            if (err) {
                log(`[AutoInclude] Exit code: ${err.code ?? "unknown"}`);
            }
            resolve({ stdout: stdout ?? "", stderr: stderr ?? "" });
        });
    });
}
/** Determine whether a file path refers to a C++ file. */
function isCppFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return [".cpp", ".cc", ".cxx", ".hpp"].includes(ext);
}
//# sourceMappingURL=compiler.js.map