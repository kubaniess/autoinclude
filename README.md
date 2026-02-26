# AutoInclude - VS Code Extension

AutoInclude detects and inserts missing `#include` directives in C and C++ files
by running the compiler in syntax-check mode and analysing its diagnostics.

---

## Features

Command:

AutoInclude: Fix includes in current file

- Analyses the active file
- Detects missing headers
- Inserts required `#include` lines automatically
- Runs only when you execute the command (no background actions)

---

## Requirements

You need at least one compiler available in PATH:

C++:
- clang++ (preferred)
- g++ (fallback)

C:
- clang (preferred)
- gcc (fallback)

### Install compiler

macOS:
brew install llvm

Ubuntu / Debian:
sudo apt install clang

Fedora:
sudo dnf install clang

Windows:
Install LLVM from:
https://releases.llvm.org
Enable "Add LLVM to PATH" during installation.

---

## Usage

1. Open a C or C++ file.
2. Open Command Palette (Ctrl+Shift+P).
3. Run:
   AutoInclude: Fix includes in current file

The extension saves the file, analyses compiler errors,
and inserts missing includes if needed.

---

## Supported Files

.c
.cpp
.cc
.cxx
.h
.hpp

---

## compile_commands.json (optional)

If a compile_commands.json file exists, AutoInclude uses it automatically
to load include paths and compiler flags.

Common locations searched:
- workspace root
- build/
- out/
- cmake-build-*
- parent directories of the file

---

## How It Works

1. Save file
2. Detect compiler
3. Run syntax check (no build)
4. Parse diagnostics
5. Detect missing headers
6. Insert includes
7. Show result notification

---

## Extending Symbol Mappings

Edit:

src/mappings.ts

Example:

CPP_MAPPINGS:
vector: "vector"

C_MAPPINGS:
printf: "stdio.h"

Then run:
npm run compile

---

## Limitations

- Works on saved files only
- Complex template errors may not resolve automatically
- MSVC is not supported (clang/gcc recommended)

---

## License