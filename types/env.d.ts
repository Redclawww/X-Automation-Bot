declare namespace NodeJS {
    interface ProcessEnv {
      GROQ_API_KEY: string;
      APIKey: string;
      APIKeySecret: string;
      AccessToken: string;
      AccessTokenSecret: string;
      CRON_SECRET?: string;
    }
  }