const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyDkfajREDQSksrGNcyxl56iuY2-X8LM2z8");

async function listModels() {
  try {
    const models = await genAI.listModels();
    console.log("Available models:");
    for await (const model of models) {
      console.log(`- ${model.name}`);
      console.log(`  Supported methods: ${model.supportedGenerationMethods.join(", ")}`);
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

listModels();
