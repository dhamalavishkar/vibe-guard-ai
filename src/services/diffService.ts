import * as vscode from 'vscode';
import { RemediationItem } from '../types';

export class DiffService {
    public static async previewDiff(workspaceUri: vscode.Uri, item: RemediationItem) {
        const targetUri = vscode.Uri.file(item.filepath);
        const document = await vscode.workspace.openTextDocument(targetUri);
        const originalContent = document.getText();
        const lines = originalContent.split(/\r?\n/);
        
        const startIdx = item.startLine - 1;
        const endIdx = item.endLine; 
        
        const beforeLines = lines.slice(0, startIdx);
        const afterLines = lines.slice(endIdx);
        
        const newContent = [...beforeLines, item.fixSnippet, ...afterLines].join('\n');
        
        const newDoc = await vscode.workspace.openTextDocument({
            content: newContent,
            language: document.languageId
        });
        
        const filename = item.filepath.split(/[\\/]/).pop();
        await vscode.commands.executeCommand('vscode.diff', targetUri, newDoc.uri, `${filename} ↔ Proposed (${item.id})`);
    }

    public static async applyFixes(workspaceUri: vscode.Uri, items: RemediationItem[], isRetry = false) {
        const edit = new vscode.WorkspaceEdit();
        
        // 1. Snapshot the number of syntax errors across all target files BEFORE the edit
        const preDiagnostics = new Map<string, number>();
        const targetUris = new Set<vscode.Uri>();

        for (const item of items) {
            const targetUri = vscode.Uri.file(item.filepath);
            targetUris.add(targetUri);
            
            const errors = vscode.languages.getDiagnostics(targetUri)
                .filter(d => d.severity === vscode.DiagnosticSeverity.Error);
            
            preDiagnostics.set(targetUri.toString(), errors.length);
        }

        // 2. Build the WorkspaceEdit
        const sortedItems = [...items].sort((a, b) => b.startLine - a.startLine);
        for (const item of sortedItems) {
            const targetUri = vscode.Uri.file(item.filepath);
            const document = await vscode.workspace.openTextDocument(targetUri);
            
            const startPos = new vscode.Position(item.startLine - 1, 0);
            const safeEndLine = Math.min(item.endLine - 1, document.lineCount - 1);
            const endLineText = document.lineAt(safeEndLine);
            const endPos = new vscode.Position(safeEndLine, endLineText.text.length);
            
            const range = new vscode.Range(startPos, endPos);
            edit.replace(targetUri, range, item.fixSnippet);
        }
        
        // 3. Apply the edit
        const success = await vscode.workspace.applyEdit(edit);
        if (!success) {
            vscode.window.showErrorMessage('Vibe-Guard AI: Failed to apply fixes.');
            return;
        }

        // 4. Verify Syntax (The Auto-Correction Loop)
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Vibe-Guard AI: Verifying Syntax...",
            cancellable: false
        }, async () => {
            // Wait 2 seconds for VS Code's internal language servers to re-parse the code
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            let brokeSyntax = false;
            let brokenFileUri: vscode.Uri | undefined;
            let compilerErrorMessage = "";

            for (const uri of targetUris) {
                const currentErrors = vscode.languages.getDiagnostics(uri)
                    .filter(d => d.severity === vscode.DiagnosticSeverity.Error);
                
                const preCount = preDiagnostics.get(uri.toString()) || 0;
                
                if (currentErrors.length > preCount) {
                    brokeSyntax = true;
                    brokenFileUri = uri;
                    // Grab the exact compiler errors to send to the LLM
                    compilerErrorMessage = currentErrors.slice(preCount).map(e => e.message).join('\n');
                    break;
                }
            }

            if (brokeSyntax && brokenFileUri) {
                // Instantly revert the workspace edit to protect the file
                await vscode.commands.executeCommand('undo');
                
                if (isRetry) {
                    vscode.window.showErrorMessage(`🛡️ Vibe-Guard AI: The AI failed to fix the syntax error! Changes completely reverted.`);
                    return;
                }
                
                vscode.window.showWarningMessage(`🛡️ Vibe-Guard AI: Syntax error detected! Attempting AI Auto-Correction...`);
                
                // Find the specific item that broke
                const filename = brokenFileUri.fsPath.split(/[\\/]/).pop() || "";
                const brokenItem = items.find(i => i.filepath.includes(filename));
                
                if (brokenItem) {
                    try {
                        const document = await vscode.workspace.openTextDocument(brokenFileUri);
                        const lines = document.getText().split(/\r?\n/);
                        const safeEnd = Math.min(brokenItem.endLine, lines.length);
                        const originalSnippet = lines.slice(brokenItem.startLine - 1, safeEnd).join('\n');
                        
                        const llmService = new (require('./llmService').LLMService)();
                        const correctedSnippet = await llmService.fixSyntaxError(originalSnippet, brokenItem.fixSnippet, compilerErrorMessage);
                        
                        // Update the item and recursively retry once
                        brokenItem.fixSnippet = correctedSnippet;
                        await DiffService.applyFixes(workspaceUri, items, true);
                    } catch (e: any) {
                        vscode.window.showErrorMessage(`Auto-Correction failed: ${e.message}`);
                    }
                }
            } else {
                // SUCCESS! Save all modified files directly to disk
                for (const uri of targetUris) {
                    try {
                        const document = await vscode.workspace.openTextDocument(uri);
                        await document.save();
                    } catch (e) {
                        console.error(`Failed to save ${uri.fsPath}`, e);
                    }
                }
                vscode.window.showInformationMessage(`✅ Vibe-Guard AI: Successfully applied, verified, and saved ${items.length} fixes to disk!`);
            }
        });
    }
}
