import * as fs from 'fs';

export async function read_file_context(filepath: string): Promise<string> {
    try {
        const content = await fs.promises.readFile(filepath, 'utf-8');
        // Simple context limiting for Phase 2: just return the file content
        // In the future, we could strip comments or extract AST here
        return content;
    } catch (error: any) {
        throw new Error(`Failed to read file ${filepath}: ${error.message}`);
    }
}

export async function run_syntax_check(filepath: string): Promise<boolean> {
    // For now, this is a mock implementation.
    // In Phase 4, we'll implement a real call to `tsc --noEmit` or `eslint`.
    return true; 
}
