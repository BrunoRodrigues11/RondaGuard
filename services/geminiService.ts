import { GoogleGenAI } from "@google/genai";
import { RoundLog } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeRoundReport = async (round: RoundLog): Promise<string> => {
  try {
    const checklistFailures = round.checklistState
      .filter((item) => !item.checked)
      .map((item) => item.label)
      .join(", ");

    const prompt = `
      Você é um especialista em manutenção preditiva e segurança. Analise os dados desta ronda de segurança:
      
      Setor: ${round.sector}
      Atividade: ${round.taskTitle}
      Duração: ${round.durationSeconds} segundos
      Observações do técnico: ${round.observations || "Nenhuma observação registrada."}
      Itens não conformes (Checklist): ${checklistFailures || "Todos os itens conformes."}
      Houve ocorrências marcadas? ${round.issuesDetected ? "Sim" : "Não"}

      Forneça um resumo curto (máximo 50 palavras) sobre o estado desta ronda e sugira uma ação imediata se necessário. Use tom profissional.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Não foi possível gerar a análise.";
  } catch (error) {
    console.error("Erro ao conectar com Gemini:", error);
    return "Erro ao processar análise inteligente.";
  }
};