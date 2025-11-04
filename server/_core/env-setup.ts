/**
 * Environment Setup
 * Load environment variables BEFORE any other imports
 * This must be the first thing executed
 */

import dotenv from "dotenv";
import path from "path";

// Load .env.local first (takes precedence), then .env as fallback
dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });
