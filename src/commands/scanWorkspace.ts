import * as vscode from 'vscode';
import { LLMService } from '../services/llmService';
import { read_file_context } from '../services/agentTools';
import { VibeGuardPanel } from '../panels/VibeGuardPanel';

export async function scanWorkspace(context: vscode.ExtensionContext) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('Vibe-Guard AI: No active workspace found to scan.');
        return;
    }

    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Vibe-Guard AI: Scanning Workspace...",
        cancellable: false
    }, async (progress) => {
        try {
            // Find code files, excluding massive dependencies
            const files = await vscode.workspace.findFiles(
                '**/*.{js,ts,py,html}', 
                '**/{node_modules,.git,out,dist,.vscode}/**', 
                30 // Hard limit for safety
            );

            if (files.length === 0) {
                vscode.window.showInformationMessage("Vibe-Guard AI: No supported code files found in workspace.");
                return;
            }

            let workspaceContext = "";
            let processed = 0;
            
            for (const file of files) {
                progress.report({ message: `Reading file ${++processed}/${files.length}` });
                const content = await read_file_context(file.fsPath);
                workspaceContext += `\n\n=== FILE: ${file.fsPath} ===\n${content}`;
            }
            
            progress.report({ message: "Running Deep Workspace AI Analysis..." });
            const llmService = new LLMService();
            const plan = await llmService.analyzeWorkspaceRisks(workspaceContext);
            
            console.log("=== REMEDIATION PLAN ===");
            console.log(JSON.stringify(plan, null, 2));

            VibeGuardPanel.render(context, plan, workspaceFolders[0].uri);
            
        } catch (error: any) {
            vscode.window.showErrorMessage(`Vibe-Guard AI Error: ${error.message}`);
        }
    });
}
