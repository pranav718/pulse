// Your new tailwind.config.ts (Corrected)
import type { Config } from "tailwindcss";

// 1. Import the plugins at the top
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  plugins: [
    // 2. Use the imported variables here
    tailwindcssAnimate,
  ],
};
export default config;