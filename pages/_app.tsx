import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const FALLBACK_PUBLISHABLE_KEY = "pk_live_Y2xlcmsuZXhwbGFpbmlmeS5kZXYk";

const publishableKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || FALLBACK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error("Missing Clerk publishable key.");
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider publishableKey={publishableKey}>
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
    </ClerkProvider>
  );
}
