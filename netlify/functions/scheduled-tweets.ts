// netlify/functions/scheduled-tweets.ts
import { Handler, schedule } from "@netlify/functions";
import { TwitterApi } from "twitter-api-v2";
import Groq from "groq-sdk";

// Configure API clients
const groq = new Groq({ 
  apiKey: process.env.GROQ_API_KEY as string 
});

const twitterClient = new TwitterApi({
  appKey: process.env.APIKey as string,
  appSecret: process.env.APIKeySecret as string,
  accessToken: process.env.AccessToken as string,
  accessSecret: process.env.AccessTokenSecret as string,
});

async function getGroqChatCompletion() {
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

  return result.choices[0].message.content;
}

const AutomationBot: Handler = async (event, context) => {
  try {
    // Get tweet content from Groq
    const tweetContent = await getGroqChatCompletion();
    
    // Post to Twitter
    if (tweetContent) {
      await twitterClient.v2.tweet(tweetContent);
    } else {
      throw new Error("Tweet content is null");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Tweet posted successfully!",
        content: tweetContent,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
};

// Schedule the function to run every 2 hours
export const handler = schedule("0 */2 * * *", AutomationBot);