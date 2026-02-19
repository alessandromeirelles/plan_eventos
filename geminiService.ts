
import { GoogleGenAI } from "@google/genai";

export const getSmartSummary = async (events: any[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const eventList = events.map(e => `${e.title} em ${e.date} (${e.status})`).join(', ');
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Com base nesses eventos agendados: ${eventList}, gere um resumo motivacional curto (2 frases) em português para o dashboard de um fotógrafo freelancer.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini summary failed", error);
    return "Continue focando no seu crescimento! Você tem eventos importantes chegando.";
  }
};
