const OpenAI = require("openai");
// import scraper from "./scraper.js";

const openai = new OpenAI({
  organization: "org-3Z5L7MLmLA0FUlGcz1h60uZu",
  apiKey:
    "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",
});

// Define your function
function helloWorld(appendString) {
  let hello = "Hello World! " + appendString;
  return hello;
}

// Get the current time of day
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

// Define your ChatGPT Function
async function callChatGPTWithFunctions(appendString) {
  let messages = [
    {
      role: "system",
      content: "Perform function requests for the user",
    },
    {
      role: "user",
      content:
        "Hello, I am a user, what is the time now?",
    },
  ];
  // Step 1: Call ChatGPT with the function name
  let chat = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages,
    functions: [
      {
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
          require: ["appendString"],
        },
      },
    //   {
    //     name: "scraper",
    //     description:
    //       "Scraps the book website goodreads for books with the keyword passed to it",
    //     parameters: {
    //       type: "object",
    //       properties: {
    //         keyword: {
    //           type: "string",
    //           description: "The keyword to search for",
    //         },
    //       },
    //       require: ["keyword"],
    //     },
    //   },
      {
        name: "getTimeOfDay",
        description: "Get the time of day.",
        parameters: {
          type: "object",
          properties: {},
          require: [],
        },
      },
    ],
    function_call: "auto",
  });

  let wantsToUseFunction =
    chat.choices[0].finish_reason == "function_call";

  let content = "";
  // Step 2: Check if ChatGPT wants to use a function
  if (wantsToUseFunction) {
    // Step 3: Use ChatGPT arguments to call your function
    if (chat.choices[0].message.function_call.name == "helloWorld") {
      let argumentObj = JSON.parse(
        chat.choices[0].message.function_call.arguments
      );
      content = helloWorld(argumentObj.appendString);
      messages.push(chat.choices[0].message);
      messages.push({
        role: "function",
        name: "helloWorld",
        content,
      });
    }
    // if (chat.choices[0].message.function_call.name == "scraper") {
    //   let argumentObj = JSON.parse(
    //     chat.choices[0].message.function_call.arguments
    //   );
    //   content = await scraper(argumentObj.keyword);
    //   messages.push(chat.choices[0].message);
    //   messages.push({
    //     role: "function",
    //     name: "scraper",
    //     content,
    //   });
    // }
    if (chat.choices[0].message.function_call.name == "getTimeOfDay") {
      content = getTimeOfDay();
      messages.push(chat.choices[0].message);
      messages.push({
        role: "function",
        name: "getTimeOfDay",
        content,
      });
    }
  }

  // Step 4: Call ChatGPT again with the function response
  let step4response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages,
  });
  console.log(step4response.choices[0]);
}

callChatGPTWithFunctions();
