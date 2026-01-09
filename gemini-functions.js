const { GoogleGenerativeAI } = require("@google/generative-ai");

// Get your free API key from: https://aistudio.google.com/app/apikey
const genAI = new GoogleGenerativeAI("AIzaSyDkfajREDQSksrGNcyxl56iuY2-X8LM2z8");

// Define your functions
function helloWorld(appendString) {
  let hello = "Hello World! " + appendString;
  return hello;
}

function getTimeOfDay(timezone = 'local', format = '12') {
  let date = new Date();
  
  // If timezone is specified, convert to that timezone
  if (timezone !== 'local') {
    const options = { timeZone: timezone, hour12: format === '12' };
    const timeString = date.toLocaleTimeString('en-US', options);
    return {
      timezone: timezone,
      format: format,
      time: timeString
    };
  }
  
  // Local time
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let seconds = date.getSeconds();
  let timeOfDay = "AM";
  
  if (format === '12') {
    if (hours > 12) {
      hours = hours - 12;
      timeOfDay = "PM";
    } else if (hours === 0) {
      hours = 12;
    }
    return {
      hours: hours,
      minutes: minutes,
      seconds: seconds,
      period: timeOfDay,
      formatted: hours + ":" + minutes + ":" + seconds + " " + timeOfDay
    };
  } else {
    // 24-hour format
    return {
      hours: hours,
      minutes: minutes,
      seconds: seconds,
      formatted: hours + ":" + minutes + ":" + seconds
    };
  }
}

//get weather data
function getWeather(location) {
    fetch(
      `https://openweathermap.org/weather-assistant?apikey=cf70dab150bb6591007ff70dc89c2f40`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ location: location }),
      }
    ).then((response) => response.json())
      .then((data) => {
        console.log("Weather data:", data);
        return data;
      })
      .catch((error) => {
        console.error("Error fetching weather data:", error);
      });
}

// Define function declarations for Gemini
const functions = {
  helloWorld: {
    description: "Prints hello world with the string passed to it",
    parameters: {
      type: "object",
      properties: {
        appendString: {
          type: "string",
          description: "The string to append to the hello world message",
        },
      },
      required: ["appendString"],
    },
  },
  getTimeOfDay: {
    description: "Gets and returns the current time of day with optional timezone and format",
    parameters: {
      type: "object",
      properties: {
        timezone: {
          type: "string",
          description: "The timezone to get the time for (e.g., 'America/New_York', 'Europe/London', 'Asia/Tokyo'). Use 'local' for local time. Default is 'local'",
        },
        format: {
          type: "string",
          description: "Time format: '12' for 12-hour format with AM/PM, or '24' for 24-hour format. Default is '12'",
          enum: ["12", "24"],
        },
      },
      required: [],
    },
  },
  getWeather: {
    description: "Gets the current weather for a specified location",
    parameters: {
      type: "object",
      properties: {
        weather: {
          type: "string",
          description: "The current weather condition (e.g., 'sunny', 'rainy', 'cloudy')",
        },
        forecast: {
          type: "string",
          description: "The weather forecast for the next few days",
        },
      },
      required: ["weather", "forecast"],
    },
  }
};

async function callGeminiWithFunctions() {
  // Initialize the model with function calling
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash", // Free model with function calling
    tools: [
      {
        functionDeclarations: [
          {
            name: "helloWorld",
            description: functions.helloWorld.description,
            parameters: functions.helloWorld.parameters,
          },
          {
            name: "getTimeOfDay",
            description: functions.getTimeOfDay.description,
            parameters: functions.getTimeOfDay.parameters,
          },
          {
            name: "getWeather",
            description: functions.getWeather.description,
            parameters: functions.getWeather.parameters,
          }
        ],
      },
    ],
  });

  const chat = model.startChat();

  // Step 1: Send user message
  const userMessage = "Hello, What is the weather now in india ?";
  console.log(`User: ${userMessage}\n`);

  let result = await chat.sendMessage(userMessage);
  let response = result.response;

  // Step 2: Check if model wants to call a function
  const functionCall = response.functionCalls()?.[0];

  if (functionCall) {
    console.log(`Function called: ${functionCall.name}`);
    console.log(`Arguments:`, functionCall.args);

    // Step 3: Execute the function
    let functionResponse;
    if (functionCall.name === "helloWorld") {
      functionResponse = helloWorld(functionCall.args.appendString);
    } else if (functionCall.name === "getTimeOfDay") {
      functionResponse = getTimeOfDay(
        functionCall.args.timezone,
        functionCall.args.format
      );
    } else if (functionCall.name === "getWeather") {
      functionResponse = getWeather(functionCall.args.location);
    }

    console.log(`Function response:`, functionResponse, "\n");

    // Step 4: Send function response back to model
    result = await chat.sendMessage([
      {
        functionResponse: {
          name: functionCall.name,
          response: {
            content: functionResponse,
          },
        },
      },
    ]);

    // Get final response
    const finalResponse = result.response.text();
    console.log(`Assistant: ${finalResponse}`);
  } else {
    // No function call, just return text response
    console.log(`Assistant: ${response.text()}`);
  }
}

callGeminiWithFunctions().catch(console.error);
