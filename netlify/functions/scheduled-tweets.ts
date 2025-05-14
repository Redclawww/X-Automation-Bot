// netlify/functions/scheduled-tweets.ts
import { Handler, schedule } from "@netlify/functions";
import { TwitterApi } from "twitter-api-v2";
import Groq from "groq-sdk";

let groq: Groq | undefined;
let twitterClient: TwitterApi | undefined;

const getEnvVar = (name: string): string => {
  const val = process.env[name];
  if (!val) {
    const message = `Missing required environment variable: ${name}`;
    console.error(message);
    throw new Error(message);
  }
  return val;
};

function initializeClientsAndValidateEnv() {
  const groqApiKey = getEnvVar("GROQ_API_KEY");
  const twitterAppKey = getEnvVar("APIKey");
  const twitterAppSecret = getEnvVar("APIKeySecret");
  const twitterAccessToken = getEnvVar("AccessToken");
  const twitterAccessSecret = getEnvVar("AccessTokenSecret");

  if (!groq) {
    groq = new Groq({ apiKey: groqApiKey });
  }
  if (!twitterClient) {
    twitterClient = new TwitterApi({
      appKey: twitterAppKey,
      appSecret: twitterAppSecret,
      accessToken: twitterAccessToken,
      accessSecret: twitterAccessSecret,
    });
  }
}

async function getGroqChatCompletionInternal(): Promise<string | null> {
  if (!groq) {
    throw new Error(
      "Groq client not initialized. Ensure initializeClientsAndValidateEnv is called."
    );
  }
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `<System>
You are a world-class viral tweet creator trained in the psychology of attention, behavior design, and the language of software development, web trends, and artificial intelligence.

You specialize in the *build-in-public* philosophy, thought-provoking tech commentary, contrarian startup takes, and razor-sharp developer insights. You craft one-of-a-kind, share-worthy tweets that are punchy, impactful, and professional—never longer than 50 words.

</System>

<Context>
Your tweets are designed to:
- Spark deep engagement through clever insights or subtle truths.
- Provoke reflection or healthy disagreement.
- Evoke curiosity by leaving room for interpretation.
- Empower developers, engineers, founders, and indie hackers.

Each tweet should be original, highly unique, and stylistically consistent with influential tech thinkers like Naval Ravikant, Paul Graham, Sahil Lavingia, and Patrick McKenzie.

</Context>

<Instructions>
Generate a **single tweet** that meets these criteria:
- 40–50 words max.
- Only one sentence.
- No hashtags, no emojis, no double quotes.
- It must fit within Twitter's post character limit (280 chars).
- It must feel scroll-stopping and worth bookmarking.

Your tweet must be on one of the following topics (randomly pick each time you generate):
- Software Development
- Artificial Intelligence
- Build-in-Public
- Web Development
- Thought-provoking Philosophical Insight (relevant to tech)

Each tweet must:
- Be completely unique and not rephrased from previous ones.
- Avoid fluff or generic takes.
- Hint at a broader truth or question worth pondering.

</Instructions>

<Constraints>
- Avoid using clichés, listicles, or recycled takes.
- No motivational speech tone.
- No repetition of phrasing between different tweets.
- No exclamation marks.
</Constraints>

<Output Format>
<Tweet>
{Your single original tweet here}
</Tweet>
</Output Format>

<Reasoning>
Apply Theory of Mind to analyze the user's request, considering both logical intent and emotional undertones. Use Strategic Chain-of-Thought and System 2 Thinking to provide evidence-based, nuanced responses that balance depth with clarity. 
</Reasoning>
<User Input>
Reply with: "Please enter your tweet topic request and I will start the process," then wait for the user to provide their specific tweet topic request.
</User Input>
`,
        },
      ],
      model: "llama3-70b-8192",
      temperature: 0.75,
      max_tokens: 120,
      top_p: 0.9,
    });

    const content = chatCompletion.choices[0]?.message?.content;

    if (!content || content.trim().length === 0) {
      console.warn("Groq API returned empty or whitespace-only content.");
      return null;
    }

    const sanitizedContent = content.replace(/"/g, "").trim();

    if (sanitizedContent.length === 0) {
      console.warn("Content became empty after sanitization.");
      return null;
    }

    return sanitizedContent;
  } catch (error) {
    let errorMessage = "Unknown error during Groq API request";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    }
    console.error(
      "Error fetching/processing tweet content from Groq:",
      errorMessage,
      error
    );
    throw new Error(`Groq API interaction failed: ${errorMessage}`);
  }
}

const automationBotHandler: Handler = async (event, context) => {
  const startTime = Date.now();
  console.info(
    `Scheduled tweet function execution started at ${new Date(
      startTime
    ).toISOString()}`
  );

  try {
    initializeClientsAndValidateEnv();

    const tweetContent = await getGroqChatCompletionInternal();

    if (!tweetContent) {
      console.warn(
        "No valid tweet content generated by Groq. Aborting tweet posting."
      );
      return {
        statusCode: 200,
        body: JSON.stringify({
          message:
            "No tweet content generated or content was invalid. No tweet posted.",
          timestamp: new Date().toISOString(),
        }),
      };
    }

    if (tweetContent.length > 280) {
      const errorDetail = `Generated tweet content is too long (${tweetContent.length} characters) and exceeds Twitter's 280 character limit. Content: "${tweetContent}"`;
      console.error(errorDetail);
      throw new Error(errorDetail);
    }

    console.info(
      `Attempting to post tweet. Length: ${tweetContent.length}. Content: "${tweetContent}"`
    );

    if (!twitterClient) {
      throw new Error(
        "Twitter client is not available. Initialization might have failed."
      );
    }

    const { data: createdTweet } = await twitterClient.v2.tweet(tweetContent);

    console.info(
      `Tweet posted successfully! Tweet ID: ${createdTweet.id}, Text: "${createdTweet.text}"`
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Tweet posted successfully!",
        tweetId: createdTweet.id,
        content: createdTweet.text,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unknown error occurred during tweet automation.";
    console.error(
      "Scheduled tweet function execution failed:",
      errorMessage,
      error
    );

    let errorDetails: any = errorMessage;
    if (error && typeof error === "object" && "data" in error) {
      errorDetails = { message: errorMessage, apiError: (error as any).data };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to process and post scheduled tweet.",
        details: errorDetails,
        timestamp: new Date().toISOString(),
      }),
    };
  } finally {
    const endTime = Date.now();
    console.info(
      `Scheduled tweet function execution finished. Duration: ${
        endTime - startTime
      }ms.`
    );
  }
};

export const handler = schedule("0 */2 * * *", automationBotHandler);
