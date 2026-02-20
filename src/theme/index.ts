import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    tokens: {
      fonts: {
        heading: { value: "'Raleway', sans-serif" },
        body: { value: "'Inter', sans-serif" },
      },
      colors: {
        brand: {
          50: { value: "#f0fdf4" },
          100: { value: "#dcfce7" },
          200: { value: "#bbf7d0" },
          300: { value: "#86efac" },
          400: { value: "#4ade80" },
          500: { value: "#22c55e" },
          600: { value: "#16a34a" },
          700: { value: "#15803d" },
          800: { value: "#166534" },
          900: { value: "#14532d" },
        },
      },
    },
    semanticTokens: {
      colors: {
        bg: {
          canvas: { value: { base: "#ffffff", _dark: "#030303" } },
          surface: { value: { base: "#f8fafc", _dark: "#09090b50" } }, // Solid Zinc-950 for better legibility
          elevated: { value: { base: "#ffffff", _dark: "#18181b" } }, // Solid Zinc-900 for dialogs/popovers
        },
        fg: {
          primary: { value: { base: "#0f172a", _dark: "#ffffff" } }, // Slate-900 in light
          secondary: { value: { base: "#475569", _dark: "#a1a1aa" } }, // Slate-600 in light
          muted: { value: { base: "#64748b", _dark: "#71717a" } }, // Slate-500 in light
        },
        border: {
          primary: { value: { base: "#cbd5e1", _dark: "rgba(255, 255, 255, 0.1)" } }, // Slate-300 in light
          subtle: { value: { base: "#e2e8f0", _dark: "rgba(255, 255, 255, 0.05)" } }, // Slate-200 in light
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
