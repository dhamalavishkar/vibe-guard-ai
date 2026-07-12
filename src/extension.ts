import * as vscode from 'vscode';
import { scanCurrentFile } from './commands/scanFile';
import { scanWorkspace } from './commands/scanWorkspace';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "Vibe-Guard AI" is now active!');

    let scanFileCmd = vscode.commands.registerCommand('vibeguard.scanCurrentFile', () => {
        scanCurrentFile(context);
    });

    let scanWorkspaceCmd = vscode.commands.registerCommand('vibeguard.scanWorkspace', () => {
        scanWorkspace(context);
    });

    context.subscriptions.push(scanFileCmd, scanWorkspaceCmd);
}

export function deactivate() {}
