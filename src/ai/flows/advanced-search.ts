// src/ai/flows/advanced-search.ts
'use server';

/**
 * @fileOverview Implements AI-powered search functionality to find relevant questions based on keywords, tags, or phrases.
 *
 * - advancedSearch - A function that performs the advanced search using AI.
 * - AdvancedSearchInput - The input type for the advancedSearch function.
 * - AdvancedSearchOutput - The return type for the advancedSearch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdvancedSearchInputSchema = z.object({
  query: z.string().describe('The search query provided by the user.'),
});
export type AdvancedSearchInput = z.infer<typeof AdvancedSearchInputSchema>;

const AdvancedSearchOutputSchema = z.object({
  results: z.array(
    z.object({
      title: z.string().describe('The title of the question.'),
      content: z.string().describe('A snippet of the question content.'),
      tags: z.array(z.string()).describe('Tags associated with the question.'),
      link: z.string().describe('A link to the question details page.'),
    })
  ).describe('A list of search results.'),
});
export type AdvancedSearchOutput = z.infer<typeof AdvancedSearchOutputSchema>;

export async function advancedSearch(input: AdvancedSearchInput): Promise<AdvancedSearchOutput> {
  return advancedSearchFlow(input);
}

const advancedSearchPrompt = ai.definePrompt({
  name: 'advancedSearchPrompt',
  input: {schema: AdvancedSearchInputSchema},
  output: {schema: AdvancedSearchOutputSchema},
  prompt: `You are an AI-powered search assistant designed to find relevant questions based on user queries.

  Given the following search query:
  "{{query}}"

  Return a JSON array of relevant question results. Each result should include the question's title, a content snippet, associated tags, and a link to the question details page.
  The results should be concise and directly relevant to the search query.

  Make sure the response is a valid JSON.
  `,
});

const advancedSearchFlow = ai.defineFlow(
  {
    name: 'advancedSearchFlow',
    inputSchema: AdvancedSearchInputSchema,
    outputSchema: AdvancedSearchOutputSchema,
  },
  async input => {
    const {output} = await advancedSearchPrompt(input);
    return output!;
  }
);
