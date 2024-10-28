console.log("Script loaded");

const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
  } = require("@google/generative-ai");
  
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: "You will recieve a csv from a garmin watch along with a description of the workout performed and a pain input of where they are feeling pain if any. You must analyze this and in JSON format export and it should be as follows:\n{\ntreatment exercises{\n     pain treatment exercises{\n          name\n          explanation\n          link to video example\n      }\n}\nworkout recomendation{\n  \"Day 1\": {\n    \"Focus\": \"Upper Body Push (Strength)\",\n    \"Exercises\": [\n      {\n        \"Name\": \"Barbell Bench Press\",\n        \"Sets\": 3,\n        \"Reps\": 8,\n        \"Rest\": \"2 minutes\",\n        \"Intensity\": \"75% 1RM\" \n      },\netc...\n\nMake sure it is like this everytime and should be the same format and make sure there are spacings to make it readable easily. it should have days 1 to 7 and all of the provided inputs should be filled out.\nSome of the more important parts of the csv will be stride length, cadence and such\n",
});
  
  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: "application/json",
  };
  
  async function run(inputMessage) {
    const chatSession = model.startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: [{ text: inputMessage }],
        },
      ],
    });
  
    const result = await chatSession.sendMessage(inputMessage);
    const analysisData = JSON.parse(result.response.text());
    updateCharts(analysisData);
  }
  
  function updateCharts(data) {
    const { treatment_exercises, workout_recommendation } = data;
  
    // Update Treatment Exercises Chart
    const treatmentTableBody = document.getElementById("treatmentTable").querySelector("tbody");
    treatment_exercises.pain_treatment_exercises.forEach(exercise => {
      const row = treatmentTableBody.insertRow();
      row.insertCell(0).textContent = exercise.name;
      row.insertCell(1).textContent = exercise.explanation;
      row.insertCell(2).innerHTML = `<a href="${exercise.link_to_video}" target="_blank">Video</a>`;
    });
  
    // Update Workout Recommendation Chart
    const workoutTableBody = document.getElementById("workoutTable").querySelector("tbody");
    Object.keys(workout_recommendation).forEach(day => {
      const { Focus, Exercises } = workout_recommendation[day];
      Exercises.forEach(exercise => {
        const row = workoutTableBody.insertRow();
        row.insertCell(0).textContent = day;
        row.insertCell(1).textContent = Focus;
        row.insertCell(2).textContent = exercise.Name;
        row.insertCell(3).textContent = exercise.Sets;
        row.insertCell(4).textContent = exercise.Reps;
        row.insertCell(5).textContent = exercise.Rest;
        row.insertCell(6).textContent = exercise.Intensity;
      });
    });
  }
  
  document.getElementById("uploadForm").onsubmit = async (e) => {
    e.preventDefault();
    console.log("Test");
    
    const csvFile = document.getElementById("csvFile").files[0];
    const workoutDescription = document.getElementById("workoutDescription").value;
    const painInput = document.getElementById("painInput").value;

    // Read CSV data
    const csvData = await readCSV(csvFile);

    // Construct input message for analysis
    const inputMessage = `CSV Data:\n${csvData}\n\nWorkout Description:\n${workoutDescription}\n\nPain Input:\n${painInput}`;

    // Call the `run` function with the constructed message
    await run(inputMessage);

    // Redirect to charts.html
    window.location.href = "charts.html";
};