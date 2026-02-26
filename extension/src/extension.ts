/**
 * extension.ts
 * VS Code extension entry point.
 */

import * as vscode from "vscode";
import * as path from "path";
import { fixIncludes, FixResult } from "./fix_includes";
import { setDebugChannel } from "./compiler";

const SUPPORTED_LANGUAGES = new Set(["c", "cpp"]);
const SUPPORTED_EXTENSIONS = new Set([".c", ".cpp", ".cc", ".cxx", ".h", ".hpp"]);

// Persistent output channel for debug info
let outputChannel: vscode.OutputChannel;

function isSupportedDocument(doc: vscode.TextDocument): boolean {
  if (SUPPORTED_LANGUAGES.has(doc.languageId)) return true;
  const ext = path.extname(doc.uri.fsPath).toLowerCase();
  return SUPPORTED_EXTENSIONS.has(ext);
}

type RunOutcome =
  | { ok: true; result: FixResult }
  | { ok: false; error: Error };

async function runFix(
  _context: vscode.ExtensionContext,
  document: vscode.TextDocument
): Promise<boolean> {
  if (document.isDirty) {
    await document.save();
  }

  outputChannel.clear();
  outputChannel.appendLine(`=== AutoInclude run @ ${new Date().toISOString()} ===`);
  outputChannel.appendLine(`File: ${document.uri.fsPath}`);
  outputChannel.appendLine(`Language: ${document.languageId}`);
  outputChannel.show(true); // show but don't steal focus

  let outcome: RunOutcome | undefined;

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "AutoInclude",
      cancellable: false,
    },
    async (progress: vscode.Progress<{ message?: string }>) => {
      try {
        const result = await fixIncludes(document, progress);
        outcome = { ok: true, result };
      } catch (err) {
        outcome = {
          ok: false,
          error: err instanceof Error ? err : new Error(String(err)),
        };
      }
    }
  );

  if (!outcome) return false;

  if (!outcome.ok) {
    vscode.window.showErrorMessage(`AutoInclude: ${outcome.error.message}`);
    outputChannel.appendLine(`ERROR: ${outcome.error.message}`);
    outputChannel.appendLine(outcome.error.stack ?? "");
    return false;
  }

  const result: FixResult = outcome.result;
  outputChannel.appendLine(`\nResult: changed=${result.changed}, added=[${result.added.join(", ")}]`);
  outputChannel.appendLine(`Unresolved count: ${result.unresolved.length}`);

  if (result.changed) {
    const addedList = result.added.map((h: string) => `<${h}>`).join(", ");
    let msg = `AutoInclude: Added ${addedList}`;
    if (result.unresolved.length > 0) {
      msg += ` (${result.unresolved.length} unresolved)`;
    }
    const action = await vscode.window.showInformationMessage(msg, "Show log");
    if (action === "Show log") {
      outputChannel.show();
    }
  } else {
    const action = await vscode.window.showInformationMessage(
      "AutoInclude: Nothing to fix.",
      "Show log"
    );
    if (action === "Show log") {
      outputChannel.show();
    }
  }

  return result.changed;
}

export function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel("AutoInclude");
  setDebugChannel(outputChannel);

  const fixCmd = vscode.commands.registerCommand(
    "autoinclude.fixIncludes",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage("AutoInclude: No active editor.");
        return;
      }
      const doc = editor.document;
      if (!isSupportedDocument(doc)) {
        vscode.window.showWarningMessage(
          `AutoInclude: File type not supported (${path.extname(doc.uri.fsPath)}). ` +
          "Supported: .c .cpp .cc .cxx .h .hpp"
        );
        return;
      }
      await runFix(context, doc);
    }
  );

  const fixBuildCmd = vscode.commands.registerCommand(
    "autoinclude.fixThenBuild",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage("AutoInclude: No active editor.");
        return;
      }
      const doc = editor.document;
      if (!isSupportedDocument(doc)) {
        vscode.window.showWarningMessage(
          `AutoInclude: File type not supported (${path.extname(doc.uri.fsPath)}).`
        );
        return;
      }
      await runFix(context, doc);
      try {
        await vscode.commands.executeCommand("workbench.action.tasks.build");
      } catch {
        vscode.window.showInformationMessage(
          "AutoInclude: Build task not configured — ran include fix only."
        );
      }
    }
  );

  context.subscriptions.push(fixCmd, fixBuildCmd, outputChannel);
}

export function deactivate() {}