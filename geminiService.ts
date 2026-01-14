
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Resource, Exam, ExamConfig } from "./types.ts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a full exam using balanced reasoning.
 */
export const generateExamFromResources = async (
  resources: Resource[],
  config: ExamConfig
): Promise<Exam> => {
  const model = "gemini-3-pro-preview";
  
  const parts: any[] = [];
  
  resources.forEach(res => {
    if (res.isBinary) {
      parts.push({
        inlineData: {
          mimeType: res.mimeType,
          data: res.content
        }
      });
      parts.push({ text: `Context Material (File: ${res.name}, Category: ${res.type})` });
    } else {
      parts.push({ text: `Context Material [${res.type}]: ${res.name}\nContent:\n${res.content}` });
    }
  });

  const prompt = `
    You are an elite academic board examiner. Generate a comprehensive practice exam based strictly on the provided resources.
    
    Difficulty: ${config.difficulty}
    Questions: ${config.numQuestions}
    Focus: ${config.focusTopics || "Comprehensive"}

    CRITICAL INSTRUCTIONS:
    1. Cross-reference 'TEXTBOOK' facts with 'SPECIFICATION' standards.
    2. Emulate 'SAMPLE' phrasing/structure.
    3. MANDATORY: Include a diverse mix of the following question types: 
       - multiple_choice: Standard 4-option questions.
       - true_false: Questions where the answer is either True or False.
       - fill_blank: A sentence with one or more underscores representing missing terms.
       - matching: Two columns of items to be paired. Provide 'matchingPairs'.
       - ordering: A list of items that must be placed in a specific logical sequence (chronological, process steps, size, etc.). Provide 'orderedItems' in the CORRECT sequence.
       - short_answer: Concise written responses.
       - essay: Long-form analysis.
    4. Provide detailed 'Explanation' and 'CorrectAnswer' for everything.
    5. Output valid JSON matching the schema precisely.
  `;

  parts.push({ text: prompt });

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        thinkingConfig: { thinkingBudget: 16384 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            durationMinutes: { type: Type.NUMBER },
            totalMarks: { type: Type.NUMBER },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  text: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['multiple_choice', 'short_answer', 'essay', 'true_false', 'fill_blank', 'matching', 'ordering'] },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  matchingPairs: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        left: { type: Type.STRING },
                        right: { type: Type.STRING }
                      },
                      required: ['left', 'right']
                    }
                  },
                  orderedItems: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  marks: { type: Type.NUMBER },
                  sourceReference: { type: Type.STRING }
                },
                required: ['id', 'text', 'type', 'correctAnswer', 'marks']
              }
            }
          },
          required: ['id', 'title', 'description', 'questions', 'totalMarks']
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("Thinking failed to produce a response.");
    
    try {
      return JSON.parse(resultText) as Exam;
    } catch (parseError) {
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as Exam;
      }
      throw parseError;
    }
  } catch (error: any) {
    console.error("Exam Generation Error:", error);
    throw new Error(error.message || "Failed to forge the exam. Try reducing question count.");
  }
};

/**
 * Analyzes a specific resource with minimal latency.
 */
export const analyzeResourceContent = async (resource: Resource): Promise<string> => {
  const model = "gemini-3-pro-preview";
  
  const parts: any[] = [];
  if (resource.isBinary) {
    parts.push({
      inlineData: {
        mimeType: resource.mimeType,
        data: resource.content
      }
    });
  } else {
    parts.push({ text: resource.content });
  }

  parts.push({ 
    text: "Briefly analyze this study material. Summarize key concepts and identify possible exam topics. Be concise." 
  });

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        thinkingConfig: { thinkingBudget: 2048 }
      }
    });

    return response.text || "Analysis unavailable.";
  } catch (error: any) {
    console.error("Analysis Error:", error);
    return "Error analyzing this resource.";
  }
};
