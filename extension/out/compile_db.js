"use strict";
/**
 * compile_db.ts
 * Reads compile_commands.json and extracts compiler flags for a given file.
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
exports.getCompileFlags = getCompileFlags;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/** Flags we don't want when doing -fsyntax-only. */
const REMOVE_FLAGS = new Set(["-c", "-o", "-MF", "-MT", "-MQ", "-MD", "-MMD"]);
function parseCommandToArgs(command) {
    // Simple shell-like split (handles quoted strings but not escapes)
    const args = [];
    let current = "";
    let inQuote = false;
    let quoteChar = "";
    for (const ch of command) {
        if (inQuote) {
            if (ch === quoteChar) {
                inQuote = false;
            }
            else {
                current += ch;
            }
        }
        else if (ch === '"' || ch === "'") {
            inQuote = true;
            quoteChar = ch;
        }
        else if (ch === " " || ch === "\t") {
            if (current.length > 0) {
                args.push(current);
                current = "";
            }
        }
        else {
            current += ch;
        }
    }
    if (current.length > 0)
        args.push(current);
    return args;
}
function extractUsefulFlags(rawArgs) {
    const useful = [];
    let skip = false;
    for (let i = 0; i < rawArgs.length; i++) {
        const arg = rawArgs[i];
        if (skip) {
            skip = false;
            continue;
        }
        // Remove the compiler itself (first token) and input file (last)
        if (i === 0)
            continue; // compiler binary
        if (REMOVE_FLAGS.has(arg)) {
            // Some flags consume the next argument too (e.g. -o output.o)
            if (arg === "-o" || arg === "-MF" || arg === "-MT" || arg === "-MQ") {
                skip = true;
            }
            continue;
        }
        // Keep -I, -D, -std, -isystem, -include, -m*, -W*, -f*
        if (arg.startsWith("-I") ||
            arg.startsWith("-D") ||
            arg.startsWith("-std") ||
            arg.startsWith("-isystem") ||
            arg.startsWith("-include") ||
            arg.startsWith("-m") ||
            arg.startsWith("-arch") ||
            arg === "--target" ||
            arg === "-target") {
            useful.push(arg);
            // Handle space-separated forms: -I /path
            if ((arg === "-I" ||
                arg === "-D" ||
                arg === "-isystem" ||
                arg === "-include" ||
                arg === "--target" ||
                arg === "-target") &&
                i + 1 < rawArgs.length) {
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
function getCompileFlags(filePath, workspaceRoot) {
    const dbPath = findCompileDb(filePath, workspaceRoot);
    if (!dbPath)
        return null;
    try {
        const raw = fs.readFileSync(dbPath, "utf8");
        const db = JSON.parse(raw);
        const normalised = path.normalize(filePath);
        const entry = db.find((e) => path.normalize(e.file) === normalised) ??
            db.find((e) => path.basename(e.file) === path.basename(filePath));
        if (!entry)
            return null;
        const rawArgs = entry.arguments
            ? entry.arguments
            : parseCommandToArgs(entry.command ?? "");
        return extractUsefulFlags(rawArgs);
    }
    catch {
        return null;
    }
}
function findCompileDb(filePath, workspaceRoot) {
    // Check workspace root first
    if (workspaceRoot) {
        const candidate = path.join(workspaceRoot, "compile_commands.json");
        if (fs.existsSync(candidate))
            return candidate;
        // Also check build subdirectory
        for (const sub of ["build", "out", "cmake-build-debug", "cmake-build-release", ".build"]) {
            const c2 = path.join(workspaceRoot, sub, "compile_commands.json");
            if (fs.existsSync(c2))
                return c2;
        }
    }
    // Walk up from file directory
    let dir = path.dirname(filePath);
    for (let i = 0; i < 6; i++) {
        const candidate = path.join(dir, "compile_commands.json");
        if (fs.existsSync(candidate))
            return candidate;
        const parent = path.dirname(dir);
        if (parent === dir)
            break;
        dir = parent;
    }
    return null;
}
//# sourceMappingURL=compile_db.js.map