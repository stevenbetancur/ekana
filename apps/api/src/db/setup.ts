import 'dotenv/config';
import { loadConfig } from '../config.js';
import { ensureDatabase } from './database.js';

const config = loadConfig();
await ensureDatabase(config.db);
console.log(`BD "${config.db.database}" lista (utf8mb4_0900_ai_ci)`);
