// Groq SDK - Free API with function calling support
// Get your free API key from: https://console.groq.com/

const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: "YOUR_GROQ_API_KEY_HERE",
});

// Define your functions
function helloWorld(appendString) {
  let hello = "Hello World! " + appendString;
  return hello;
}

function getTimeOfDay() {
  let date = new Date();
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let seconds = date.getSeconds();
  let timeOfDay = "AM";
  if (hours > 12) {
    hours = hours - 12;
    timeOfDay = "PM";
  }
  return hours + ":" + minutes + ":" + seconds + " " + timeOfDay;
}

async function callGroqWithFunctions() {
  let messages = [
    {
      role: "system",
      content: "Perform function requests for the user",
    },
    {
      role: "user",
      content: "Hello, I am a user, what is the time now?",
    },
  ];

  // Step 1: Call Groq with function definitions
  let chat = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile", // Free model with function calling
    messages,
    tools: [
      {
        type: "function",
        function: {
          name: "helloWorld",
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
      },
      {
        type: "function",
        function: {
          name: "getTimeOfDay",
          description: "Get the current time of day",
          parameters: {
            type: "object",
            properties: {},
          },
        },
      },
    ],
    tool_choice: "auto",
  });

  let wantsToUseFunction = chat.choices[0].finish_reason === "tool_calls";

  // Step 2: Check if model wants to use a function
  if (wantsToUseFunction) {
    const toolCall = chat.choices[0].message.tool_calls[0];
    console.log(`Function called: ${toolCall.function.name}`);

    // Step 3: Execute the function
    let functionResponse;
    const args = JSON.parse(toolCall.function.arguments);

    if (toolCall.function.name === "helloWorld") {
      functionResponse = helloWorld(args.appendString);
    } else if (toolCall.function.name === "getTimeOfDay") {
      functionResponse = getTimeOfDay();
    }

    console.log(`Function response: ${functionResponse}`);

    // Add assistant message and function result to messages
    messages.push(chat.choices[0].message);
    messages.push({
      role: "tool",
      tool_call_id: toolCall.id,
      content: functionResponse,
    });

    // Step 4: Call Groq again with function response
    let step4response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
    });

    console.log("\nFinal response:");
    console.log(step4response.choices[0].message.content);
  } else {
    console.log(chat.choices[0].message.content);
  }
}

callGroqWithFunctions().catch(console.error);
