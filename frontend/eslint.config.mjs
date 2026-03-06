import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Disable strict rules that cause issues with common React patterns
  {
    rules: {
      // Allow setState in effects for initial data fetching
      "react-hooks/set-state-in-effect": "off",
      // Allow useEffect dependencies for data fetching callbacks
      "react-hooks/exhaustive-deps": "warn",
    },
  },
]);

export default eslintConfig;
