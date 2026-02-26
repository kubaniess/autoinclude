"use strict";
/**
 * fix_includes.ts
 * Core logic: analyses a file, determines missing includes, and inserts them.
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
exports.fixIncludes = fixIncludes;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const compiler_1 = require("./compiler");
const compile_db_1 = require("./compile_db");
const diagnostics_parser_1 = require("./diagnostics_parser");
const MAX_ITERATIONS = 2;
// ─────────────────────────────────────────────────────────────────────────────
// Build compiler flags
// ─────────────────────────────────────────────────────────────────────────────
function buildFlags(filePath, isCpp, workspaceRoot) {
    // Try compile DB first
    const dbFlags = (0, compile_db_1.getCompileFlags)(filePath, workspaceRoot);
    if (dbFlags && dbFlags.length > 0) {
        return dbFlags;
    }
    // Fallback: minimal flags
    const flags = [];
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
function formatInclude(inc) {
    return inc.isSystem ? `#include <${inc.header}>` : `#include "${inc.header}"`;
}
function alreadyIncluded(lines, header) {
    const patterns = [
        `#include <${header}>`,
        `#include "${header}"`,
        `#include<${header}>`,
    ];
    return lines.some((l) => patterns.some((p) => l.trim() === p || l.includes(p)));
}
/**
 * Find the insertion line index (0-based, insert BEFORE this line).
 * Returns the index after which to insert.
 */
function findInsertionPoint(lines) {
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
            while (i < lines.length && !lines[i].includes("*/"))
                i++;
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
            if (k < lines.length && lines[k].trim() === "")
                k++;
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
        if (j > 50 && lastIncludeLine === -1)
            break;
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
function insertIncludes(source, newIncludes) {
    if (newIncludes.length === 0)
        return null;
    const lines = source.split(/\r?\n/);
    const eol = source.includes("\r\n") ? "\r\n" : "\n";
    // Filter out already-present includes
    const toAdd = newIncludes.filter((inc) => !alreadyIncluded(lines, inc.header));
    if (toAdd.length === 0)
        return null;
    // Sort alphabetically
    toAdd.sort((a, b) => a.header.localeCompare(b.header));
    const insertAt = findInsertionPoint(lines);
    const newLines = toAdd.map(formatInclude);
    // Add blank line after if the next line isn't blank/include
    const afterLines = lines.slice(insertAt);
    const needsTrailingBlank = afterLines.length > 0 &&
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
async function fixIncludes(document, progress) {
    const filePath = document.uri.fsPath;
    const isCpp = (0, compiler_1.isCppFile)(filePath);
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    progress.report({ message: "detecting compiler…" });
    const compiler = await (0, compiler_1.resolveCompiler)(isCpp);
    const flags = buildFlags(filePath, isCpp, workspaceRoot);
    const allAdded = [];
    let unresolvedLines = [];
    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
        progress.report({ message: `analysing (pass ${iteration + 1})…` });
        // Save the current in-memory document state to a temp file if dirty
        // For simplicity we analyse the saved file — VS Code saves before running
        const output = await (0, compiler_1.runSyntaxCheck)(compiler, filePath, flags);
        const combined = output.stdout + "\n" + output.stderr;
        const result = (0, diagnostics_parser_1.parseDiagnostics)(combined, isCpp, filePath, workspaceRoot);
        // Read current file content
        let source = fs.readFileSync(filePath, "utf8");
        const newIncludes = result.missing.filter((inc) => !allAdded.includes(inc.header));
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
async function reloadDocument(document) {
    // The file was written externally; VS Code should auto-detect, but we
    // can force it by reverting the document.
    try {
        await vscode.commands.executeCommand("workbench.action.files.revert");
    }
    catch {
        // non-fatal
    }
}
//# sourceMappingURL=fix_includes.js.map