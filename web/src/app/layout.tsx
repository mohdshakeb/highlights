import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Highlight",
  description: "Your internet highlights, organized.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
