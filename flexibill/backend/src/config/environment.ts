import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

/**
 * Application configuration type definition
 */
interface AppConfig {
  env: string;
  port: number;
  database: {
    url: string;
    key: string;
  };
  plaid: {
    clientId: string;
    secret: string;
    env: string;
    webhookUrl: string | null;
  };
  openai: {
    apiKey: string;
    endpoint: string;
    deployment: string;
    model: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  logging: {
    level: string;
  };
  encryption: {
    key: string;
  };
}

// Define required environment variables
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_KEY',
  'PLAID_CLIENT_ID',
  'PLAID_SECRET',
  'AZURE_OPENAI_API_KEY',
  'AZURE_OPENAI_ENDPOINT',
  'JWT_SECRET'
];

// Check for missing required environment variables
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Configure app settings based on environment variables
const config: AppConfig = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    url: process.env.SUPABASE_URL!,
    key: process.env.SUPABASE_KEY!
  },
  plaid: {
    clientId: process.env.PLAID_CLIENT_ID!,
    secret: process.env.PLAID_SECRET!,
    env: process.env.PLAID_ENV || 'sandbox',
    webhookUrl: process.env.PLAID_WEBHOOK_URL || null
  },
  openai: {
    apiKey: process.env.AZURE_OPENAI_API_KEY!,
    endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4',
    model: process.env.AZURE_OPENAI_MODEL || 'gpt-4'
  },
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY || ''
  }
};

// In production, ensure critical configuration is set
if (config.env === 'production') {
  // JWT secret must be set and strong
  if (!config.jwt.secret || config.jwt.secret.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters long in production environment');
  }
  
  // Encryption key must be set
  if (!config.encryption.key) {
    throw new Error('ENCRYPTION_KEY must be set in production environment');
  }
  
  // Plaid webhook URL should be set
  if (!config.plaid.webhookUrl) {
    console.warn('PLAID_WEBHOOK_URL is not set in production. Webhooks from Plaid will not work.');
  }
}

export default config;