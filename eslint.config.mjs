import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      // Foundation Spec Guardrails
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { 
        "argsIgnorePattern": "^_", 
        "varsIgnorePattern": "^_" 
      }],
      
      // Performance Guardrails
      "@next/next/no-img-element": "warn",
      "@next/next/no-html-link-for-pages": "error",
      
      // Foundation Spec: Prevent populate=* regression
      "no-restricted-syntax": [
        "error",
        { 
          "selector": "Literal[value='populate=*']", 
          "message": "Do not use populate=*; use fields[] and minimal populate[...][fields][]=url" 
        }
      ],
      
      // Additional helpful rules
      "prefer-const": "warn",
      "react/no-unescaped-entities": "warn",
    },
  },
];

export default eslintConfig;
