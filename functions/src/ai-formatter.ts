import { genkit } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/googleai';

// Initialize Genkit with Google AI plugin
export const ai = genkit({
    plugins: [googleAI()],
    model: gemini15Flash,
});

// Define the article enhancement flow
export const enhanceArticleFlow = ai.defineFlow(
    {
        name: 'enhanceArticle',
        inputSchema: ai.defineSchema('EnhanceInput', {
            html: ai.field('string'),
        }),
        outputSchema: ai.defineSchema('EnhanceOutput', {
            enhancedHtml: ai.field('string'),
        }),
    },
    async (input) => {
        const prompt = `You are an expert technical documentation formatter. You will receive HTML content from automotive repair manuals that may be poorly formatted.

Your task is to enhance the formatting WHILE PRESERVING ALL ORIGINAL CONTENT AND HTML STRUCTURE:

1. **Add Section Headings**: Insert appropriate <h3> headings to break up dense paragraphs into logical sections
2. **Convert Dense Lists**: When you see lists embedded in paragraphs (e.g., "items include: A, B, C"), convert to proper <ul>/<li> structure
3. **Highlight Key Information**: Wrap important items in <strong> tags:
   - Torque specifications
   - Warnings and cautions
   - Critical procedural notes
4. **Preserve All Images**: Keep all <img> tags exactly as they are
5. **Preserve All Tables**: Keep all <table> structures intact
6. **Add Spacing**: Add appropriate paragraph breaks where text is too dense

CRITICAL RULES:
- Keep ALL original content - don't remove or paraphrase anything
- Preserve ALL HTML attributes (class, style, src, etc.)
- Don't change existing headings or lists
- Only enhance areas that are currently plain paragraphs
- Return valid HTML only, no markdown
- Don't add explanations, just return the enhanced HTML

Original HTML:
${input.html}

Enhanced HTML:`;

        const result = await ai.generate({
            model: gemini15Flash,
            prompt,
            config: {
                temperature: 0.3, // Low temperature for consistent formatting
                maxOutputTokens: 8192,
            },
        });

        return {
            enhancedHtml: result.text,
        };
    }
);
