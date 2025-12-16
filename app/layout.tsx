import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jira Time Tracking Report",
  description: "Track and visualize time spent on Jira tickets",
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
