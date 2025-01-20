const { TwitterApi } = require("twitter-api-v2");
const cron = require("node-cron");
require("dotenv").config();
import Groq from "groq-sdk";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });


const client = new TwitterApi({
  appKey: process.env.APIKey,
  appSecret: process.env.APIKeySecret,
  accessToken: process.env.AccessToken,
  accessSecret: process.env.AccessTokenSecret,
});

export async function getGroqChatCompletion() {
  try {
    const result = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content:
            "I want you to act as a masterful viral tweet creator specializing in the domains of software development, build-in-public philosophy, artificial intelligence, thought-provoking quotes, and web development. Your task is to craft highly engaging and shareable single tweet without any double quotes of 40-50 words that capture attention, provoke thought, or inspire action from any of the above topic. Ensure the tweets are concise, impactful, and written in a professional tone without the use of emojis or hashtags. Each tweet should reflect a deep understanding of its subject matter and resonate with an audience passionate about technology, innovation, and learning. Focus on ideas that spark curiosity, encourage discussion, or share actionable insights in a single scroll-stopping sentence.",
        },
      ],
      model: "llama-3.3-70b-versatile",
    });
    await client.v2.tweet(result.choices[0].message.content);
    console.log("Tweet posted successfully!", result.choices[0].message.content);
  } catch (error) {
    console.error(error);
  }
}

// Track the number of executions
let executionCount = 0;
const MAX_EXECUTIONS = 10;

const job = cron.schedule("0 0 */2 * * *", () => {
  const now = new Date();
  executionCount++;

  console.log(`Execution #${executionCount} at ${now.toLocaleString()}`);

  try {
    // Your business logic goes here
    getGroqChatCompletion();

    // Check if we've reached the daily limit
    if (executionCount >= MAX_EXECUTIONS) {
      console.log(
        "Reached maximum executions for the day. Resetting counter..."
      );
      executionCount = 0;
    }
  } catch (error) {
    console.error("Error in cron job:", error);
  }
});


cron.schedule("0 0 0 * * *", () => {
  console.log("Resetting daily execution count at midnight");
  executionCount = 0;
});


function displayNextExecutions() {
  const now = new Date();
  console.log("Next 10 execution times:");

  for (let i = 0; i < 10; i++) {
    const nextExecution = new Date(now);
    const currentHour = now.getHours();
    const hoursToAdd = 2 - (currentHour % 2) + i * 2;
    nextExecution.setHours(currentHour + hoursToAdd, 0, 0, 0);
    console.log(`${i + 1}. ${nextExecution.toLocaleString()}`);
  }
}

// Start the script
console.log("Cron job started. Will run 10 times per day, every 2 hours.");
displayNextExecutions();
console.log("Press Ctrl+C to exit.");
