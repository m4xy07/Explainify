import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="theme-color" content="#040308" />
      </Head>
      <body className="antialiased bg-[#040308] text-foreground">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
