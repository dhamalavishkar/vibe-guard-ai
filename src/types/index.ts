import { z } from "zod";

export const RemediationItemSchema = z.object({
    id: z.string().describe("A unique identifier for this issue"),
    type: z.enum(["Security", "Reliability", "Optimization"]).describe("The category of the issue"),
    severity: z.enum(["High", "Medium", "Low"]).describe("The severity level of the issue"),
    problem: z.string().describe("A plain-English explanation of why the code is risky or redundant"),
    fixSnippet: z.string().describe("The exact code snippet modification to fix the issue"),
    startLine: z.number().describe("The starting line number of the issue"),
    endLine: z.number().describe("The ending line number of the issue"),
    filepath: z.string().describe("The absolute file path this issue belongs to")
});

export const RemediationPlanSchema = z.object({
    summary: z.string().describe("A high-level summary of the findings"),
    isSecure: z.boolean().describe("True if no vulnerabilities, bugs, or bloat are found. False otherwise."),
    items: z.array(RemediationItemSchema).describe("The list of remediation items")
});

export type RemediationItem = z.infer<typeof RemediationItemSchema>;
export type RemediationPlan = z.infer<typeof RemediationPlanSchema>;
