import nextConfig from "eslint-config-next/core-web-vitals";
import reactYouMightNotNeedAnEffect from "eslint-plugin-react-you-might-not-need-an-effect";

const eslintConfig = [
  {
    ignores: [
      "scripts/**",       // Scripts utilitaires (non-production)
      "components/ui/**", // Composants Shadcn (code tiers)
    ],
  },
  ...nextConfig,
  {
    plugins: {
      "react-you-might-not-need-an-effect": reactYouMightNotNeedAnEffect,
    },
    rules: {
      ...reactYouMightNotNeedAnEffect.configs.recommended.rules,
      // Faux positif dans Next.js : les Server Components utilisent try/catch + JSX légitimement
      "react-hooks/error-boundaries": "off",
      // Pattern intentionnel pour lecture SSR-safe depuis localStorage/cookies au montage
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default eslintConfig;
