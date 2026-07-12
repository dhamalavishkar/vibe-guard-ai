import * as vscode from 'vscode';
import { RemediationPlan, RemediationItem } from '../types';
import { DiffService } from '../services/diffService';

export class VibeGuardPanel {
    public static currentPanel: VibeGuardPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, private documentUri: vscode.Uri) {
        this._panel = panel;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        
        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'previewDiff':
                        await DiffService.previewDiff(this.documentUri, message.item);
                        return;
                    case 'applyCategory':
                        await DiffService.applyFixes(this.documentUri, message.items);
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public static render(context: vscode.ExtensionContext, plan: RemediationPlan, documentUri: vscode.Uri) {
        if (VibeGuardPanel.currentPanel) {
            VibeGuardPanel.currentPanel._panel.reveal(vscode.ViewColumn.Two);
        } else {
            const panel = vscode.window.createWebviewPanel(
                'vibeGuard',
                'Vibe-Guard AI Remediation',
                vscode.ViewColumn.Two,
                { enableScripts: true, retainContextWhenHidden: true }
            );
            VibeGuardPanel.currentPanel = new VibeGuardPanel(panel, documentUri);
        }
        
        VibeGuardPanel.currentPanel._panel.webview.html = VibeGuardPanel.currentPanel._getHtmlForWebview(plan);
    }

    public dispose() {
        VibeGuardPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) { x.dispose(); }
        }
    }

    private _getHtmlForWebview(plan: RemediationPlan) {
        const toolkitUri = 'https://cdn.jsdelivr.net/npm/@vscode/webview-ui-toolkit@1.2.2/dist/toolkit.min.js';

        let contentHtml = '';

        if (plan.isSecure || plan.items.length === 0) {
            // THE VICTORY SCREEN
            contentHtml = `
                <div style="text-align: center; margin-top: 4rem; padding: 3rem; background-color: var(--vscode-editorWidget-background); border-radius: 8px; border: 2px solid var(--vscode-testing-iconPassed);">
                    <h1 style="font-size: 3rem; margin-bottom: 1rem;">🎉</h1>
                    <h2 style="color: var(--vscode-testing-iconPassed); margin-bottom: 1rem;">Workspace is Secure!</h2>
                    <p style="font-size: 1.2rem; opacity: 0.9;">${plan.summary}</p>
                </div>
            `;
        } else {
            const security = plan.items.filter(i => i.type === 'Security');
            const reliability = plan.items.filter(i => i.type === 'Reliability');
            const optimization = plan.items.filter(i => i.type === 'Optimization');

            const renderGroup = (title: string, items: RemediationItem[]) => {
                if (items.length === 0) return '';
                
                const itemsHtml = items.map(item => `
                    <div class="issue-card" style="margin-bottom: 1rem; padding: 1rem; border: 1px solid var(--vscode-panel-border); border-radius: 6px; background-color: var(--vscode-editor-background);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <strong style="color: var(--vscode-editorError-foreground);">${item.id} - ${item.severity}</strong>
                            <vscode-badge appearance="secondary">${item.type}</vscode-badge>
                        </div>
                        <div style="margin-bottom: 0.5rem; font-size: 0.9em; opacity: 0.8; font-family: monospace;">
                            📁 ${item.filepath.split(/[\\/]/).pop()} (Lines ${item.startLine}-${item.endLine})
                        </div>
                        <p style="opacity: 0.9;">${item.problem}</p>
                        <vscode-button appearance="secondary" class="preview-btn" data-item="${Buffer.from(JSON.stringify(item)).toString('base64')}">Preview Diff</vscode-button>
                    </div>
                `).join('');

                return `
                    <div class="category-group" style="margin-bottom: 2rem; padding: 1rem; background-color: var(--vscode-editorWidget-background); border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h2 style="margin: 0;">${title} (${items.length})</h2>
                            <vscode-button appearance="primary" class="apply-btn" data-items="${Buffer.from(JSON.stringify(items)).toString('base64')}">Apply All ${title} Fixes</vscode-button>
                        </div>
                        ${itemsHtml}
                    </div>
                `;
            };

            contentHtml = `
                <div class="summary-box">
                    <strong>Summary of Findings:</strong>
                    <p>${plan.summary}</p>
                </div>
                ${renderGroup('Security', security)}
                ${renderGroup('Reliability', reliability)}
                ${renderGroup('Optimization', optimization)}
            `;
        }

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script type="module" src="${toolkitUri}"></script>
            <title>Vibe-Guard AI</title>
            <style>
                body { padding: 2rem; font-family: var(--vscode-font-family); color: var(--vscode-editor-foreground); background-color: var(--vscode-editor-background); line-height: 1.5; }
                .header-section { margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 2px solid var(--vscode-panel-border); }
                h1 { margin-top: 0; }
                .summary-box { padding: 1rem; border-left: 4px solid var(--vscode-terminal-ansiBlue); background-color: var(--vscode-editorWidget-background); margin-bottom: 2rem; }
            </style>
        </head>
        <body>
            <div class="header-section">
                <h1>🛡️ Vibe-Guard AI Results</h1>
            </div>
            
            ${contentHtml}
            
            <script>
                const vscode = acquireVsCodeApi();
                
                document.querySelectorAll('.preview-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const base64 = e.target.getAttribute('data-item');
                        const item = JSON.parse(atob(base64));
                        vscode.postMessage({ command: 'previewDiff', item: item });
                    });
                });

                document.querySelectorAll('.apply-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const base64 = e.target.getAttribute('data-items');
                        const items = JSON.parse(atob(base64));
                        vscode.postMessage({ command: 'applyCategory', items: items });
                        
                        const group = e.target.closest('.category-group');
                        if (group) group.style.display = 'none';
                    });
                });
            </script>
        </body>
        </html>`;
    }
}
