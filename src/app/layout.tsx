import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GIF Creator - High Performance GIF Generator",
  description: "Overhaul legacy Tkinter to a modern Tauri + Next.js + FastAPI application with advanced image rendering capabilities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased overflow-hidden select-none">
        {children}
      </body>
    </html>
  );
}
