import * as path from "path";
import * as fs from "fs";
import { lookupHeader } from "./mappings";

export interface MissingInclude {
  header: string;
  isSystem: boolean;
}

export interface UnresolvedDiagnostic {
  line: string;
  symbol?: string;
}

export interface ParseResult {
  missing: MissingInclude[];
  unresolved: UnresolvedDiagnostic[];
}

// A) file not found
const FILE_NOT_FOUND_RE =
  /(?:fatal )?error:\s+['"]?([^'"]+?)['"]?\s+(?:file not found|no such file)/i;

// B) GCC note: 'X' is defined in header '<stdio.h>'
// Must capture just "stdio.h" from inside the angle brackets
const GCC_NOTE_HEADER_RE =
  /note:.*?is defined in header\s+['"]?<([^>]+)>/i;

// C) symbol error patterns (clang + gcc)
const SYMBOL_PATTERNS: Array<{ re: RegExp }> = [
  { re: /error:\s+use of undeclared identifier\s+'([^']+)'/i },
  { re: /error:\s+unknown type name\s+'([^']+)'/i },
  { re: /error:\s+no template named\s+'([^']+)'/i },
  { re: /error:\s+'([^']+)' was not declared in this scope/i },
  { re: /error:\s+identifier\s+'([^']+)'\s+is undefined/i },
  { re: /error:\s+'([^']+)'\s+undeclared/i },
  { re: /error:\s+implicit declaration of function\s+'([^']+)'/i },
  { re: /error:\s+'([^']+)'\s+does not name a type/i },
  { re: /error C2065:\s+'([^']+)'\s*:\s+undeclared identifier/i },
];

const KNOWN_SYSTEM_HEADERS = new Set([
  "stdio.h", "stdlib.h", "string.h", "math.h", "ctype.h", "time.h",
  "assert.h", "errno.h", "limits.h", "float.h", "stdint.h", "stddef.h",
  "stdbool.h", "signal.h", "setjmp.h", "locale.h", "wchar.h", "wctype.h",
  "iso646.h", "stdarg.h", "uchar.h",
  "iostream", "ostream", "istream", "fstream", "sstream",
  "vector", "list", "deque", "queue", "stack", "map", "set",
  "unordered_map", "unordered_set", "array", "bitset", "forward_list", "span",
  "string", "string_view", "algorithm", "numeric", "functional",
  "memory", "utility", "tuple", "optional", "variant", "any",
  "type_traits", "iterator", "ranges",
  "thread", "mutex", "shared_mutex", "condition_variable", "future", "atomic",
  "random", "chrono", "filesystem",
  "exception", "stdexcept",
  "cstdio", "cstdlib", "cstring", "cmath", "cstdint", "cstddef",
  "climits", "cfloat", "cassert", "csignal", "ctime", "cerrno",
  "iomanip", "iosfwd", "locale", "format", "expected",
]);

function isSystemHeader(name: string): boolean {
  return !name.includes("/") && !name.includes("\\") && KNOWN_SYSTEM_HEADERS.has(name);
}

function fileExistsInWorkspace(
  headerName: string,
  workspaceRoot: string | undefined,
  filePath: string
): boolean {
  const candidates = [
    path.join(path.dirname(filePath), headerName),
    ...(workspaceRoot ? [path.join(workspaceRoot, headerName)] : []),
  ];
  return candidates.some((c) => fs.existsSync(c));
}

export function parseDiagnostics(
  output: string,
  isCpp: boolean,
  filePath: string,
  workspaceRoot: string | undefined
): ParseResult {
  const lines = output.split(/\r?\n/);
  const missing: MissingInclude[] = [];
  const unresolved: UnresolvedDiagnostic[] = [];
  const seenHeaders = new Set<string>();

  const addInclude = (header: string, isSystem: boolean) => {
    if (!seenHeaders.has(header)) {
      seenHeaders.add(header);
      missing.push({ header, isSystem });
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // A) file not found
    const fnfMatch = FILE_NOT_FOUND_RE.exec(line);
    if (fnfMatch) {
      const headerName = fnfMatch[1].trim();
      if (isSystemHeader(headerName)) {
        addInclude(headerName, true);
      } else if (
        headerName.includes("/") ||
        headerName.endsWith(".h") ||
        headerName.endsWith(".hpp") ||
        fileExistsInWorkspace(headerName, workspaceRoot, filePath)
      ) {
        addInclude(headerName, false);
      } else {
        addInclude(headerName, true);
      }
      continue;
    }

    // B) GCC note: directly gives us the header name — most reliable
    const noteMatch = GCC_NOTE_HEADER_RE.exec(line);
    if (noteMatch) {
      addInclude(noteMatch[1].trim(), true);
      continue;
    }

    // C) symbol error — look up in mappings table
    for (const { re } of SYMBOL_PATTERNS) {
      const m = re.exec(line);
      if (m) {
        const symbol = m[1].trim().replace(/^std::/, "");
        const header = lookupHeader(symbol, isCpp);
        if (header) {
          addInclude(header, true);
        } else {
          // Look ahead a few lines for a GCC note with the header
          let resolved = false;
          for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
            const noteM = GCC_NOTE_HEADER_RE.exec(lines[j]);
            if (noteM) {
              addInclude(noteM[1].trim(), true);
              resolved = true;
              break;
            }
          }
          if (!resolved) {
            unresolved.push({ line: line.trim(), symbol });
          }
        }
        break;
      }
    }
  }

  return { missing, unresolved };
}