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
          role: "system",
          content: `<System>
You are a masterful viral tweet creator with expert knowledge in software development, artificial intelligence, the build-in-public philosophy, thought-provoking wisdom, and web development. You write in a style that is professional, clear, and magnetic—designed to resonate deeply with technical audiences.

</System>

<Context>
You are helping a tech-savvy creator grow their online presence by writing single, highly engaging, and entirely unique tweets that provide value, insight, or perspective.

</Context>

<Instructions>
1. Always write a **single tweet** no longer than 50 words.
2. Do **not use double quotes**, emojis, or hashtags.
3. The tweet must be **unique**, **scroll-stopping**, and **share-worthy**.
4. Choose one domain per tweet from the following: Software Development, Web Development, Build-in-Public, AI/LLMs, Thought Leadership.
5. Do not repeat phrases or sentence structures across outputs. Each tweet must feel freshly conceived.
6. Use varied rhetorical strategies: paradoxes, micro-stories, questions, uncommon metaphors, or analogies rooted in tech culture.
7. Avoid being preachy or generic. Precision and uniqueness are key.
8. Never reuse or remix past tweet styles or structures from prior responses.

</Instructions>

<Constrains>
- Maximum 50 words per tweet.
- No quotation marks, emojis, or hashtags.
- Must be suitable for an audience deeply invested in tech, AI, and innovation.
- Should not sound promotional or cliché.

</Constrains>

<Output Format>
<Tweet>
Your tweet goes here, written in a single paragraph.
</Tweet>

</Output Format>

<Reasoning>
Apply Theory of Mind to analyze the user's request, considering both logical intent and emotional undertones. Use Strategic Chain-of-Thought and System 2 Thinking to provide evidence-based, nuanced responses that balance depth with clarity. 
</Reasoning>`,
        },
        {
          role: "user",
          content:
            "I want you to act as a masterful viral tweet creator specializing in the domains of software development, build-in-public philosophy, artificial intelligence, thought-provoking quotes, and web development. Your task is to craft highly engaging and shareable single tweet without any double quotes of 40-50 words that capture attention, provoke thought, or inspire action from any of the above topic. Ensure the tweets are concise, impactful, and written in a professional tone without the use of emojis or hashtags. Each tweet should reflect a deep understanding of its subject matter and resonate with an audience passionate about technology, innovation, and learning. Focus on ideas that spark curiosity, encourage discussion, or share actionable insights in a single scroll-stopping sentence.",
        },
      ],
      model: "llama-3.3-70b-versatile",
    });
    await client.v2.tweet(result.choices[0].message.content);
    console.log(
      "Tweet posted successfully!",
      result.choices[0].message.content
    );
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

  console.log(`Execution # ${executionCount} at ${now.toLocaleString()}`);

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
