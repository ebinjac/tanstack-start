import { drizzle } from 'drizzle-orm/node-postgres';

// Create a function to get the database instance
// This ensures environment variables are loaded when the function is called
function getDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  return drizzle(databaseUrl);
}

// Export the database instance as a singleton
export const db = getDatabase();