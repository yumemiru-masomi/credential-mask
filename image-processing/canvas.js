import { GoogleGenerativeAI } from "@google/generative-ai";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { writeFile } from "fs/promises";

// Google Generative AI APIのセットアップ
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI);
const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-pro" });

(async () => {
  // 画像URL
  const imageUrl =
    "https://docs.expo.dev/static/images/tutorial/eas/github-01.png";

  // 画像をロードしてサイズを取得
  const image = await loadImage(imageUrl);
  const imageWidth = image.width; // 画像の幅
  const imageHeight = image.height; // 画像の高さ
  console.log(`Image dimensions: ${imageWidth}x${imageHeight}`);

  // モデルで座標を取得
  const imageResp = await fetch(imageUrl).then((response) =>
    response.arrayBuffer()
  );

  // プロンプトに画像サイズを含める
  const prompt = `画像内の'Discor'文字をを囲む4点の座標を、画像の幅が${imageWidth}px、高さが${imageHeight}pxであることを考慮して次のJSON形式で出力してください。  {"top_left": [0, 0], "top_right": [100, 0], "bottom_left": [0, 100], "bottom_right": [100, 100]}`;

  const result = await model.generateContent([
    {
      inlineData: {
        data: Buffer.from(imageResp).toString("base64"),
        mimeType: "image/jpeg",
      },
    },
    prompt,
  ]);

  // AI応答を取得
  const responseText = result.response.text();
  console.log("AI Response:", responseText);

  // JSON部分を抽出
  let coordinates;
  try {
    const jsonMatch = responseText.match(/```json\n({[\s\S]*})\n```/);
    if (jsonMatch) {
      coordinates = JSON.parse(jsonMatch[1]); // JSON部分を解析
    } else {
      throw new Error("Failed to extract JSON data.");
    }
  } catch (error) {
    console.error("Error parsing AI response:", error.message);
    return;
  }

  // AIが返した座標
  const { top_left, top_right, bottom_left, bottom_right } = coordinates;

  // キャンバスのサイズを画像のサイズに合わせる
  const canvas = createCanvas(imageWidth, imageHeight);
  const ctx = canvas.getContext("2d");

  // 画像をCanvasに描画
  ctx.drawImage(image, 0, 0, imageWidth, imageHeight);

  // 座標を繋いで矩形を描画
  ctx.strokeStyle = "red"; // 線の色
  ctx.lineWidth = 1; // 線の幅
  ctx.beginPath();
  ctx.moveTo(top_left[0], top_left[1]); // 左上の座標に移動
  ctx.lineTo(top_right[0], top_right[1]); // 右上
  ctx.lineTo(bottom_right[0], bottom_right[1]); // 右下
  ctx.lineTo(bottom_left[0], bottom_left[1]); // 左下
  ctx.closePath(); // 矩形を閉じる
  ctx.stroke();

  // 結果をファイルに保存
  const buffer = canvas.toBuffer("image/png");
  await writeFile("output.png", buffer);
  console.log("Annotated image saved as output.png");
})();
