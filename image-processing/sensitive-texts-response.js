import vision from "@google-cloud/vision";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { writeFile } from "fs/promises";

async function quickstart() {
  // Creates clients
  const client = new vision.ImageAnnotatorClient();
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI);

  // Performs text detection on the image file
  const fileName = process.env.FILE_NAME;
  const [result] = await client.textDetection(fileName);
  const detections = result.textAnnotations;

  // Extract text into an array
  const textArray = detections
    .map((text, index) => {
      if (index === 0) {
        console.log(`Full Text: ${text.description}`);
      } else {
        return text.description;
      }
    })
    .filter(Boolean);

  console.log("Extracted Text Array:", textArray);

  // Prepare prompt for Generative AI
  const context = textArray.join(", ");
  const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-pro" });

  const prompt = `以下のテキストの中から、ブログ公開時に隠したほうが良い情報を特定してください。隠すべき情報の基準は次の通りです：
1. APIキー：アルファベットと数字が混在する長い文字列。
2. メールアドレス：'@' を含む文字列。
3. 電話番号：数字と '-' が含まれる形式（例: "03-1234-5678"）。
4. クレジットカード番号：16桁の数字。
5. 個人名：明らかに名前と分かるもの。
6. 企業名やサービス名：次のような特徴を持つものを特定してください：
   - 通常1つまたは複数の単語で構成され、記号（例: '-', '.'）やアルファベットが混在する場合が多い。
   - 文脈に基づいて「特定のブランド」「会社名」「プロジェクト名」などと推測されるもの。
   - 一般的な単語（例: 'project', 'dashboard', 'add'）は含まない。
7. 以下の文字列が含まれていたら、それは隠すべき情報としてください。
   - yumemi

以下のテキストに基づいて、隠すべき情報を JSON 形式で返してください。
形式: { "sensitiveTexts": ["隠すべきテキスト1", "隠すべきテキスト2"] }
テキストコンテキスト: ${context}`;

  console.log("Prompt for Generative AI:", prompt);

  // Call Google Generative AI SDK
  try {
    const resultAI = await model.generateContent(prompt);
    console.log("AI Response:", resultAI.response.text());

    const cleanedResponse = model.generateContent(prompt) || "";
    if (cleanedResponse.startsWith("```json")) {
      cleanedResponse = cleanedResponse.replace(/^```json|```$/g, "").trim();
    }

    // Parse AI response
    const sensitiveTexts = JSON.parse(resultAI.response.text()).sensitiveTexts;
    console.log("Sensitive Texts to Mask:", sensitiveTexts);

    // Save sensitive text array to a file
    await writeFile(
      "sensitiveTexts.json",
      JSON.stringify(sensitiveTexts, null, 2)
    );
    console.log("Sensitive text array saved as sensitiveTexts.json");

    // Load the image using @napi-rs/canvas
    const image = await loadImage(fileName);
    const imageWidth = image.width;
    const imageHeight = image.height;

    // Create a canvas to draw the image and bounding boxes
    const canvas = createCanvas(imageWidth, imageHeight);
    const ctx = canvas.getContext("2d");

    // Draw the image onto the canvas
    ctx.drawImage(image, 0, 0, imageWidth, imageHeight);

    // Draw red boxes for sensitive texts only
    detections.forEach((text, index) => {
      if (index !== 0 && sensitiveTexts.includes(text.description)) {
        console.log(`Text to mask: ${text.description}`);

        // Extract and log the bounding box coordinates
        const vertices = text.boundingPoly.vertices;
        const coordinates = vertices.map((v) => ({
          x: v.x || 0, // Default to 0 if x is undefined
          y: v.y || 0, // Default to 0 if y is undefined
        }));

        console.log("Bounding Box Coordinates:", coordinates);

        // Fill the bounding box completely
        ctx.fillStyle = "red"; // Set the fill color to solid red
        ctx.beginPath();
        ctx.moveTo(coordinates[0].x, coordinates[0].y);
        coordinates.forEach((vertex, i) => {
          if (i > 0) ctx.lineTo(vertex.x, vertex.y);
        });
        ctx.closePath();
        ctx.fill();

        // Draw the bounding box outline
        ctx.strokeStyle = "red"; // Set the color of the bounding box
        ctx.lineWidth = 2; // Set the line width
        ctx.beginPath();
        ctx.moveTo(coordinates[0].x, coordinates[0].y);
        coordinates.forEach((vertex, i) => {
          if (i > 0) ctx.lineTo(vertex.x, vertex.y);
        });
        ctx.closePath();
        ctx.stroke();
      } else {
        console.log(`Text not masked: ${text.description}`);
      }
    });

    // Save the annotated image to a file
    const buffer = canvas.toBuffer("image/png");
    await writeFile("output.png", buffer);
    console.log("Annotated image saved as output.png");
  } catch (error) {
    console.error("Error calling Generative AI API:", error);
  }
}

quickstart();
