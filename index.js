import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const prompt = "こんにちは！";

const result = await model.generateContent(prompt);
console.log(result.response.text());
