// api/cron.ts
import { TwitterApi } from "twitter-api-v2";
import Groq from "groq-sdk";
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

export const config = {
  runtime: 'edge',
};

export default async function handler(request: NextRequest) {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get('authorization');
    
    // Verify the cron job secret (optional but recommended)
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get tweet content from Groq
    const tweetContent = await getGroqChatCompletion();
    
    if (tweetContent) {
      // Post to Twitter
      await twitterClient.v2.tweet(tweetContent);
    } else {
      throw new Error('Failed to generate tweet content');
    }

    // Return success response
    return new NextResponse(JSON.stringify({
      success: true,
      message: 'Tweet posted successfully!',
      content: tweetContent,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new NextResponse(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}