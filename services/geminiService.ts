
import { GoogleGenAI, Type } from "@google/genai";
import type { WordDetails } from '../types';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

const schema = {
  type: Type.OBJECT,
  properties: {
    pos: { type: Type.STRING, description: "The primary part of speech of the word, e.g., 'Verb'." },
    syllabification: {
      type: Type.STRING,
      description: "The word divided into syllables, e.g., 'beau-ti-ful'.",
    },
    pronunciation: {
      type: Type.STRING,
      description: "The International Phonetic Alphabet (IPA) pronunciation, e.g., '/ˈbjuːtɪfl/'.",
    },
    commonMeaning: {
      type: Type.STRING,
      description: "A common, easy-to-understand definition of the word in Chinese.",
    },
    etymologicalMeaning: {
      type: Type.STRING,
      description: "An explanation of the word's meaning based on its root and affixes, in Chinese.",
    },
    examples: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          sentence: { type: Type.STRING, description: "The example sentence in English." },
          translation: { type: Type.STRING, description: "The Chinese translation of the example sentence." },
        },
        required: ["sentence", "translation"],
      },
      description: "At least three example sentences using the word in its primary form, with Chinese translations.",
    },
    forms: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          pos: { type: Type.STRING, description: "Part of speech for this form." },
          word: { type: Type.STRING, description: "The word in that form." },
          definition: { type: Type.STRING, description: "The definition of this specific form in Chinese." },
          example: { type: Type.STRING, description: "An example sentence using this form." },
          exampleTranslation: { type: Type.STRING, description: "The Chinese translation of the example for this form." },
        },
        required: ["pos", "word", "definition", "example", "exampleTranslation"],
      },
      description: "Different forms of the word (e.g., noun, verb, adjective, adverb), each with a definition and an example sentence with translation.",
    },
    etymology: {
      type: Type.OBJECT,
      properties: {
        root: { type: Type.STRING, description: "The primary root of the word." },
        rootSource: { type: Type.STRING, description: "The language of origin for the root, e.g., 'Latin', 'Greek'." },
        rootMeaning: { type: Type.STRING, description: "The meaning of the root in Chinese." },
        rootDevelopment: { type: Type.STRING, description: "A brief history in Chinese of the root's development, its evolution, and how it entered English." },
        relatedWords: {
          type: Type.ARRAY,
          description: "Other English words from the same root, with translations and breakdowns.",
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING, description: "The related word." },
              translation: { type: Type.STRING, description: "The Chinese translation of the related word." },
              breakdown: { type: Type.STRING, description: "The morphological breakdown, e.g., 'prefix + root = meaning'." },
            },
            required: ["word", "translation", "breakdown"],
          },
        },
      },
      required: ["root", "rootSource", "rootMeaning", "rootDevelopment", "relatedWords"],
    },
    synonyms: {
      type: Type.ARRAY,
      description: "A list of synonyms. For each synonym, provide its usage difference compared to the searched word and an example sentence with a Chinese translation illustrating that difference.",
      items: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING, description: "The synonym." },
          usageDifference: { type: Type.STRING, description: "Explanation of the nuance or usage difference compared to the original word, in Chinese." },
          example: { type: Type.STRING, description: "An example sentence using the synonym." },
          exampleTranslation: { type: Type.STRING, description: "The Chinese translation of the synonym's example sentence." }
        },
        required: ["word", "usageDifference", "example", "exampleTranslation"],
      },
    },
    confusableWords: {
      type: Type.ARRAY,
      description: "A list of visually or phonetically similar English words that are commonly confused with the primary word. For each, provide its primary part of speech and a concise Chinese definition.",
      items: {
        type: Type.OBJECT,
        properties: {
            word: { type: Type.STRING, description: "The confusable word." },
            pos: { type: Type.STRING, description: "The primary part of speech of the confusable word." },
            definition: { type: Type.STRING, description: "A concise Chinese definition of the confusable word." },
        },
        required: ["word", "pos", "definition"],
      },
    },
  },
  required: ["pos", "syllabification", "pronunciation", "commonMeaning", "etymologicalMeaning", "examples", "forms", "etymology", "synonyms", "confusableWords"],
};

export const fetchWordDetails = async (word: string): Promise<WordDetails> => {
  const prompt = `Analyze the English word "${word}". Provide a detailed linguistic breakdown in a structured JSON format. I need: its primary part of speech; syllabification; IPA pronunciation; a common, easy-to-understand Chinese meaning; an etymological meaning in Chinese that explains how the prefixes, root, and suffixes combine to form the meaning; at least three example sentences with Chinese translations for the primary form; other word forms (noun, adjective, etc.). For each form, provide its definition in Chinese, an example sentence, and its Chinese translation; detailed etymology including the primary root's language of origin, its meaning in Chinese, a brief history in Chinese of the root's development and how it entered English, and a list of related English words. For each related word, provide its Chinese translation and a morphological breakdown. Also include a list of synonyms. For each synonym, provide a clear explanation in Chinese about its usage difference compared to "${word}", and an example sentence (with its Chinese translation) that highlights this difference. Finally, provide a list of visually or phonetically similar English words that are commonly confused with "${word}". For each of these 'confusable' words, give its primary part of speech and a concise Chinese definition. If the word is invalid, return a JSON object with an 'error' key.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });
    
    const text = response.text;
    const data = JSON.parse(text);

    if (data.error) {
      throw new Error(data.error);
    }

    // Basic validation to ensure the response structure matches our expectations
    if (!data.syllabification || !data.etymology || !data.synonyms || !data.forms) {
      throw new Error("Received incomplete data from the API.");
    }
    
    return data as WordDetails;
  } catch (error) {
    console.error("Error fetching word details from Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to fetch details for "${word}": ${error.message}`);
    }
    throw new Error(`An unknown error occurred while fetching details for "${word}".`);
  }
};