
import { GoogleGenAI } from "@google/genai";
import { InventoryItem, Transaction } from "../types";

export class GeminiService {
  async getInventoryInsights(inventory: InventoryItem[], transactions: Transaction[], query: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // 彙整成易讀的庫存摘要
    const inventoryText = inventory.map(item => 
      `${item.name}(${item.sku}): 現貨 ${item.quantity} 件 / 存放於 ${item.warehouse} / 狀態: ${item.quantity < item.minThreshold ? "⚠️ 缺貨中" : "正常"}`
    ).join('\n');

    const systemInstruction = `
      你是一位親切、專業的「智慧倉管小幫手」。
      
      【當前倉庫情況】:
      ${inventoryText}
      
      【任務】:
      請用最簡單、白話的方式回答使用者的問題。
      如果是要檢查庫存，請直接告訴我「哪幾個東西快沒了」。
      如果是要分析營運，請告訴我「哪個東西賣最快」。
      不要使用工程師術語，請使用倉管人員聽得懂的語言。
      
      語氣：熱情、有幫助、條理分明。使用繁體中文。
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: query,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });
      return response.text;
    } catch (error) {
      return "系統忙碌中，請先檢查您的庫存列表，或稍後再詢問我。";
    }
  }
}

export const geminiService = new GeminiService();
