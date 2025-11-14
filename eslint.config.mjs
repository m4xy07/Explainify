import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Files and globs to ignore (replacement for deprecated .eslintignore)
  {
    ignores: [
      "pages/sign-in/**",
      "pages/sign-up/**",
      "pages/app/**",
      "pages/_app.tsx",
      "components/HeroAnimSource.tsx",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
