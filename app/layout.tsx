import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MoonSys Business Platform",
  description: "All-in-one business management platform - Projects, Analytics, HR, Finance & Operations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
