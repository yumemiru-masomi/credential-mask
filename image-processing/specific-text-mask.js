import vision from "@google-cloud/vision";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { writeFile } from "fs/promises";

async function quickstart() {
  // Ensure the target word is passed as a command-line argument
  const targetWord = process.argv[2]?.toLowerCase();
  if (!targetWord) {
    console.error(
      "Error: No target word specified. Usage: node --env-file=.env image-processing/credential-mask.js <target-word>"
    );
    process.exit(1);
  }

  // Creates clients
  const client = new vision.ImageAnnotatorClient();

  // Performs text detection on the image file
  const fileName = process.env.FILE_NAME;
  const [result] = await client.textDetection(fileName);
  const detections = result.textAnnotations;

  console.log("Text:");

  // Load the image using @napi-rs/canvas
  const image = await loadImage(fileName);
  const imageWidth = image.width;
  const imageHeight = image.height;

  // Create a canvas to draw the image and bounding boxes
  const canvas = createCanvas(imageWidth, imageHeight);
  const ctx = canvas.getContext("2d");

  // Draw the image onto the canvas
  ctx.drawImage(image, 0, 0, imageWidth, imageHeight);

  // Draw red boxes only for the specified target word
  detections.forEach((text, index) => {
    if (index !== 0 && text.description.toLowerCase() === targetWord) {
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
}

quickstart();
