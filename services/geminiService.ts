
import { GoogleGenAI, Type } from "@google/genai";
import { Threat, BenchmarkScore, OWASPCategory } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateThreatModel = async (
  modelName: string,
  architecture: string,
  useCase: string
): Promise<{ threats: Threat[]; scores: BenchmarkScore[]; overallRisk: number }> => {
  const model = "gemini-3-pro-preview";
  
  const prompt = `Perform a comprehensive security threat model and benchmark evaluation for the following LLM deployment:
  Model: ${modelName}
  Architecture: ${architecture}
  Use Case: ${useCase}

  Evaluate this against the OWASP Top 10 for LLMs. 
  For the benchmarking section, provide a security score (0-100) for each of the 10 categories based on typical performance of this model architecture and the specific deployment context.
  
  Return a structured JSON object.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          threats: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                category: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                severity: { type: Type.STRING, enum: ['Critical', 'High', 'Medium', 'Low'] },
                mitigation: { type: Type.STRING },
                impact: { type: Type.STRING }
              },
              required: ['id', 'category', 'title', 'description', 'severity', 'mitigation', 'impact']
            }
          },
          scores: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                score: { type: Type.NUMBER },
                details: { type: Type.STRING }
              },
              required: ['category', 'score', 'details']
            }
          },
          overallRiskScore: { type: Type.NUMBER }
        },
        required: ['threats', 'scores', 'overallRiskScore']
      }
    }
  });

  try {
    const result = JSON.parse(response.text || '{}');
    return {
      threats: result.threats || [],
      scores: result.scores || [],
      overallRisk: result.overallRiskScore || 0
    };
  } catch (error) {
    console.error("Failed to parse Gemini response", error);
    throw new Error("Failed to generate threat model");
  }
};
