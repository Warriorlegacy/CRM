// Load test environment variables BEFORE anything else
// Plain JS file avoids any ts-jest transform issues in setupFiles
require('dotenv').config({ path: '.env.test', override: true });
