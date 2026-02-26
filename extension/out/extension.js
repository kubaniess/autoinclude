"use strict";
/**
 * extension.ts
 * VS Code extension entry point.
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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fix_includes_1 = require("./fix_includes");
const compiler_1 = require("./compiler");
const SUPPORTED_LANGUAGES = new Set(["c", "cpp"]);
const SUPPORTED_EXTENSIONS = new Set([".c", ".cpp", ".cc", ".cxx", ".h", ".hpp"]);
// Persistent output channel for debug info
let outputChannel;
function isSupportedDocument(doc) {
    if (SUPPORTED_LANGUAGES.has(doc.languageId))
        return true;
    const ext = path.extname(doc.uri.fsPath).toLowerCase();
    return SUPPORTED_EXTENSIONS.has(ext);
}
async function runFix(_context, document) {
    if (document.isDirty) {
        await document.save();
    }
    outputChannel.clear();
    outputChannel.appendLine(`=== AutoInclude run @ ${new Date().toISOString()} ===`);
    outputChannel.appendLine(`File: ${document.uri.fsPath}`);
    outputChannel.appendLine(`Language: ${document.languageId}`);
    outputChannel.show(true); // show but don't steal focus
    let outcome;
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "AutoInclude",
        cancellable: false,
    }, async (progress) => {
        try {
            const result = await (0, fix_includes_1.fixIncludes)(document, progress);
            outcome = { ok: true, result };
        }
        catch (err) {
            outcome = {
                ok: false,
                error: err instanceof Error ? err : new Error(String(err)),
            };
        }
    });
    if (!outcome)
        return false;
    if (!outcome.ok) {
        vscode.window.showErrorMessage(`AutoInclude: ${outcome.error.message}`);
        outputChannel.appendLine(`ERROR: ${outcome.error.message}`);
        outputChannel.appendLine(outcome.error.stack ?? "");
        return false;
    }
    const result = outcome.result;
    outputChannel.appendLine(`\nResult: changed=${result.changed}, added=[${result.added.join(", ")}]`);
    outputChannel.appendLine(`Unresolved count: ${result.unresolved.length}`);
    if (result.changed) {
        const addedList = result.added.map((h) => `<${h}>`).join(", ");
        let msg = `AutoInclude: Added ${addedList}`;
        if (result.unresolved.length > 0) {
            msg += ` (${result.unresolved.length} unresolved)`;
        }
        const action = await vscode.window.showInformationMessage(msg, "Show log");
        if (action === "Show log") {
            outputChannel.show();
        }
    }
    else {
        const action = await vscode.window.showInformationMessage("AutoInclude: Nothing to fix.", "Show log");
        if (action === "Show log") {
            outputChannel.show();
        }
    }
    return result.changed;
}
function activate(context) {
    outputChannel = vscode.window.createOutputChannel("AutoInclude");
    (0, compiler_1.setDebugChannel)(outputChannel);
    const fixCmd = vscode.commands.registerCommand("autoinclude.fixIncludes", async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage("AutoInclude: No active editor.");
            return;
        }
        const doc = editor.document;
        if (!isSupportedDocument(doc)) {
            vscode.window.showWarningMessage(`AutoInclude: File type not supported (${path.extname(doc.uri.fsPath)}). ` +
                "Supported: .c .cpp .cc .cxx .h .hpp");
            return;
        }
        await runFix(context, doc);
    });
    const fixBuildCmd = vscode.commands.registerCommand("autoinclude.fixThenBuild", async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage("AutoInclude: No active editor.");
            return;
        }
        const doc = editor.document;
        if (!isSupportedDocument(doc)) {
            vscode.window.showWarningMessage(`AutoInclude: File type not supported (${path.extname(doc.uri.fsPath)}).`);
            return;
        }
        await runFix(context, doc);
        try {
            await vscode.commands.executeCommand("workbench.action.tasks.build");
        }
        catch {
            vscode.window.showInformationMessage("AutoInclude: Build task not configured — ran include fix only.");
        }
    });
    context.subscriptions.push(fixCmd, fixBuildCmd, outputChannel);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map