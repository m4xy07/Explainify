import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const publishableKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ??
  "pk_placeholder_clerk_publishable_key";
const usingPlaceholderKey =
  publishableKey === "pk_placeholder_clerk_publishable_key";

export default function App({ Component, pageProps }: AppProps) {
  const appShell = (
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

  if (usingPlaceholderKey && process.env.NODE_ENV !== "production") {
    console.warn(
      "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not defined; using placeholder key for build-time rendering."
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>{appShell}</ClerkProvider>
  );
}
