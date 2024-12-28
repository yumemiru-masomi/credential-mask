import vision from "@google-cloud/vision";

async function quickstart() {
  // Creates a client
  const client = new vision.ImageAnnotatorClient();

  // Performs label detection on the image file
  const fileName = process.env.FILE_NAME;
  const [result] = await client.textDetection(fileName);
  const detections = result.textAnnotations;
  console.log("Text:");
  // Loop through each detected text and log its description and boundingPoly

  detections.forEach((text, index) => {
    if (index === 0) {
      // The first annotation contains the full text detected
      console.log(`Full Text: ${text.description}`);
    } else {
      console.log(`Text: ${text.description}`);

      // Extract and log the bounding box coordinates
      const vertices = text.boundingPoly.vertices;
      const coordinates = vertices.map((v) => ({
        x: v.x || 0, // Default to 0 if x is undefined
        y: v.y || 0, // Default to 0 if y is undefined
      }));

      console.log("Bounding Box Coordinates:", coordinates);
    }
  });
}
quickstart();
