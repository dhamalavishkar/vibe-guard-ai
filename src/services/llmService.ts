import { RemediationPlan } from '../types';
import * as vscode from 'vscode';

export class LLMService {
    // 🛡️ All AI logic is now securely offloaded to the Proxy Server!
    // When you deploy your proxy, you just change this URL to "https://api.vibe-guard.com"
    private readonly proxyUrl = 'http://localhost:3000/api';

    constructor() {
        // No API key needed in the extension anymore!
    }

    private async handleProxyError(response: Response) {
        const text = await response.text();
        try {
            const err = JSON.parse(text) as { error: string };
            throw new Error(`Proxy Error: ${err.error || response.statusText}`);
        } catch {
            // If Vercel returns an HTML 404 or 502 page instead of JSON
            throw new Error(`Proxy HTTP Error ${response.status}: ${text.substring(0, 100)}`);
        }
    }

    public async analyzeSecurityRisks(codeSnippet: string, filepath: string): Promise<RemediationPlan> {
        const response = await fetch(`${this.proxyUrl}/scan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codeSnippet, filepath })
        });

        if (!response.ok) await this.handleProxyError(response);

        return await response.json() as RemediationPlan;
    }

    public async analyzeWorkspaceRisks(workspaceContext: string): Promise<RemediationPlan> {
        const response = await fetch(`${this.proxyUrl}/scan-workspace`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ workspaceContext })
        });

        if (!response.ok) await this.handleProxyError(response);

        return await response.json() as RemediationPlan;
    }

    public async fixSyntaxError(originalCode: string, failedFix: string, compilerError: string): Promise<string> {
        const response = await fetch(`${this.proxyUrl}/fix-syntax`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ originalCode, failedFix, compilerError })
        });

        if (!response.ok) await this.handleProxyError(response);

        const data = await response.json() as { correctedFixSnippet: string };
        return data.correctedFixSnippet;
    }
}
