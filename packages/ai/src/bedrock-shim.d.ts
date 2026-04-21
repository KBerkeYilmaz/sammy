// Minimal type shim for @ai-sdk/amazon-bedrock.
// Used for scaffold-time type checking when node_modules are not installed.
// Remove once `pnpm install` is run and real types are available.
declare module "@ai-sdk/amazon-bedrock" {
  interface BedrockProviderConfig {
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
  }

  interface LanguageModel {
    readonly modelId: string;
  }

  interface EmbeddingModel {
    readonly modelId: string;
  }

  interface BedrockProvider {
    (modelId: string): LanguageModel;
    embedding(modelId: string): EmbeddingModel;
  }

  export function createAmazonBedrock(
    config: BedrockProviderConfig,
  ): BedrockProvider;
}

// Node.js process global shim
declare const process: {
  env: Record<string, string | undefined>;
};
