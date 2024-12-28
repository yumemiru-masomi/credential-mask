import vision from "@google-cloud/vision";

async function quickstart() {
  // Creates a client
  const client = new vision.ImageAnnotatorClient();

  // Performs label detection on the image file
  const fileName = process.env.FILE_NAME;
  const [result] = await client.textDetection(fileName);
  const detections = result.textAnnotations;
  console.log("Text:");
  detections.forEach((text) => console.log(text));
}
quickstart();
