import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "EncryptChat - Secure Encrypted Messaging",
  description: "EncryptChat - Secure encrypted messaging using FHE technology",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`encrypt-chat-bg text-foreground antialiased`}>
        <div className="fixed inset-0 w-full h-full encrypt-chat-bg z-[-20]"></div>
        <main className="flex flex-col max-w-screen-xl mx-auto pb-20">
          <Providers>{children}</Providers>
        </main>
      </body>
    </html>
  );
}
