import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        vazir: ["Vazirmatn", "Tahoma", "Arial Unicode MS", "sans-serif"],
      },
      direction: {
        rtl: "rtl",
        ltr: "ltr",
      },
      width: {
        "a4": "210mm",
        "a4-px": "794px",
      },
      height: {
        "a4": "297mm",
        "a4-px": "1123px",
      },
      minWidth: {
        "a4": "210mm",
      },
      minHeight: {
        "a4": "297mm",
      },
      maxWidth: {
        "a4": "210mm",
      },
      spacing: {
        "a4-margin": "15mm",
        "a4-margin-x": "12mm",
      },
      print: {
        page: {
          size: "A4 portrait",
          margin: "15mm 12mm",
        },
      },
    },
  },
  plugins: [typography],
} satisfies Config;