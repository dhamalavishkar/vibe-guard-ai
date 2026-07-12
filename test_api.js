async function run() {
    console.log("Fetching available models for your exact API key...");
    try {
        const key = process.env.GEMINI_API_KEY;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();
        
        if (data.error) {
            console.error("API Error:", data.error.message);
            return;
        }

        const models = data.models
            .filter(m => m.supportedGenerationMethods.includes('generateContent'))
            .map(m => m.name.replace('models/', ''));
            
        console.log("\n=== AVAILABLE MODELS FOR YOUR KEY ===");
        console.log(models.join('\n'));
        console.log("=====================================\n");
    } catch (e) {
        console.error("Network failed:", e.message);
    }
}
run();
