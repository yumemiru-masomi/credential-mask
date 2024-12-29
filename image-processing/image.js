import { GoogleGenerativeAI } from "@google/generative-ai";

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI);

const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-pro" });

const imageResp = await fetch(
  "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Palace_of_Westminster_from_the_dome_on_Methodist_Central_Hall.jpg/2560px-Palace_of_Westminster_from_the_dome_on_Methodist_Central_Hall.jpg"
).then((response) => response.arrayBuffer());

const result = await model.generateContent([
  {
    inlineData: {
      data: Buffer.from(imageResp).toString("base64"),
      mimeType: "image/jpeg",
    },
  },
  `観覧車の左上と右下の座標を教えて。次のJSON形式で出力して。 {"left_up": [0, 0], "right_down": [100, 100]}`,
]);
console.log(result.response.text());
