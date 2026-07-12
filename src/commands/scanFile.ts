import * as vscode from 'vscode';
import * as path from 'path';
import { LLMService } from '../services/llmService';
import { read_file_context } from '../services/agentTools';
import { VibeGuardPanel } from '../panels/VibeGuardPanel';

export async function scanCurrentFile(context: vscode.ExtensionContext) {
    let filepath: string | undefined;
    let documentUri: vscode.Uri | undefined;

    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        filepath = activeEditor.document.fileName;
        documentUri = activeEditor.document.uri;
    } else {
        const selectedFiles = await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: 'Select file to scan',
            canSelectFiles: true,
            canSelectFolders: false
        });

        if (selectedFiles && selectedFiles.length > 0) {
            filepath = selectedFiles[0].fsPath;
            documentUri = selectedFiles[0];
        }
    }

    if (!filepath || !documentUri) {
        vscode.window.showErrorMessage('Vibe-Guard AI: No file selected for scanning.');
        return;
    }
    
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Vibe-Guard AI: Analyzing...",
        cancellable: false
    }, async (progress) => {
        try {
            progress.report({ message: `Reading ${path.basename(filepath!)}` });
            const fileContext = await read_file_context(filepath!);
            
            progress.report({ message: "Running LLM analysis..." });
            const llmService = new LLMService();
            const plan = await llmService.analyzeSecurityRisks(fileContext, filepath!);
            
            // Instead of logging, launch the Webview Panel!
            VibeGuardPanel.render(context, plan, documentUri!);
            
        } catch (error: any) {
            vscode.window.showErrorMessage(`Vibe-Guard AI Error: ${error.message}`);
        }
    });
}
