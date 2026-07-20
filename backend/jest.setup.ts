// Load test environment variables BEFORE anything else
// This must use require (not import) to ensure it runs before imports are hoisted
require('dotenv').config({ path: '.env.test', override: true });
