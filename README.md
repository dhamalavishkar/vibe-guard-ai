# 🛡️ Vibe-Guard AI

**Vibe-Guard AI** is an Agentic AI extension for VS Code that acts as your automated Principal Security Engineer. As developers increasingly rely on AI tools to generate code ("vibe coding"), it's easy to accidentally introduce security vulnerabilities, dead code, and unoptimized logic. 

Vibe-Guard AI systematically audits your code, explains the risks, and provides interactive, native side-by-side diffs so you can securely patch your codebase with a single click.

## ✨ Features

- **Multi-File Workspace Scanning:** Automatically gathers context across your entire project and analyzes relationships between files.
- **Strict Structured Outputs:** Powered by Gemini models and Zod schemas, ensuring deterministic, machine-readable vulnerability reports.
- **Human-in-the-Loop (HITL) Diff Engine:** The AI *never* modifies code without your consent. It generates in-memory virtual URIs to show native side-by-side diffs before executing a single `WorkspaceEdit`.
- **Categorized Triage Dashboard:** A custom VS Code Webview UI Toolkit dashboard to easily review and apply fixes by category (Security, Reliability, Optimization).

## 🚀 Usage

1. Open a workspace or file in VS Code.
2. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).
3. Run **`VibeGuard: Scan Workspace`** (to scan the entire project) or **`VibeGuard: Scan Current File`**.
4. Review the issues in the Vibe-Guard AI Dashboard tab.
5. Click **Preview Diff** to see the exact changes proposed.
6. Click **Apply All** to patch the issues natively across your workspace.

## ⚙️ Requirements

You will need a Gemini API Key.
Set your key in your system environment variables as `GEMINI_API_KEY`.

## 🔒 Privacy & Security

Vibe-Guard AI is designed with the Human-in-the-Loop philosophy. All edits are pushed through VS Code's native `WorkspaceEdit` API, meaning they behave identically to typing them yourself—you can easily undo (`Ctrl+Z`) any applied fix.

---
**Enjoy writing secure code at the speed of thought!**
