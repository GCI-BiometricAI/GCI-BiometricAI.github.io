require('dotenv').config();
const express = require('express');
const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

const port = 3000;
const apiKey = process.env.GEMINI_API_KEY;

// Serve static files from the current directory
app.use(express.static(__dirname));

if (!apiKey) {
  throw new Error("API key is missing. Make sure GEMINI_API_KEY is set in your environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: "You will recieve a csv from a garmin watch along with a description of the workout performed and a pain input of where they are feeling pain if any. You must analyze this and in JSON format export and it should be as follows:\n{\ntreatment exercises{\n     pain treatment exercises{\n          name\n          explanation\n          link to video example\n      }\n}\nworkout recomendation{\n  \"Day 1\": {\n    \"Focus\": \"Upper Body Push (Strength)\",\n    \"Exercises\": [\n      {\n        \"Name\": \"Barbell Bench Press\",\n        \"Sets\": 3,\n        \"Reps\": 8,\n        \"Rest\": \"2 minutes\",\n        \"Intensity\": \"75% 1RM\" \n      },\netc...\n\nMake sure it is like this everytime and should be the same format and make sure there are spacings to make it readable easily. it should have days 1 to 7 and all of the provided inputs should be filled out.\nSome of the more important parts of the csv will be stride length, cadence and such. Make sure reps are always just a number\n",
  });


  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: "application/json",
  };

  const chatSession = model.startChat({
    generationConfig,
    history: [],
  });

  const result = await chatSession.sendMessage("Give me a workout plan for 7 days of the week. I have pain in my right hamstring, provide exercises to address this. Make sure to give the result in the format provided and make it a readable JSON");
  return result.response.text();
}

app.use(express.json());

app.post('/generate-workout', async (req, res) => {
  try {
    const output = await run();
    fs.writeFileSync('workout-plan.json', output);

    res.json({ success: true, data: JSON.parse(output) });
  } catch (error) {
    console.error("Error generating workout plan:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
