export function getAIConfig() {
    return {
        primary: process.env.AI_PROVIDER_PRIMARY || 'local',
        fallback: process.env.AI_PROVIDER_FALLBACK || 'openai',
        localModelEndpoint: process.env.LOCAL_AI_ENDPOINT || 'http://localhost:11434',
        localModel: process.env.LOCAL_AI_MODEL || 'llama3.2:latest',
    };
}
