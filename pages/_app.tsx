import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`${inter.variable} font-sans`}>
      <Component {...pageProps} />
      <Toaster
        richColors
        theme="dark"
        position="top-center"
        toastOptions={{
          style: {
            background: "rgba(8, 12, 24, 0.85)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#f7f8ff",
          },
        }}
      />
    </div>
  );
}
