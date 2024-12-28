import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyAKpLmE2gvWzwZYX8mt134kkOQVsvRnJNg");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const prompt = "こんにちは！ゆめみだお！";

const result = await model.generateContent(prompt);
console.log(result.response.text());
