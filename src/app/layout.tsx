// ─── src/app/layout.tsx ─────────────────────────────────────
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { FileUploadProvider } from "@/components/FileUploadContext";
import Navbar from "@/components/Navbar";
import UploadBanner from "@/components/UploadBanner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mumbai Weather Analytics",
  description: "Applied Data Science — Weather ML Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <FileUploadProvider>
          <Navbar />
          <UploadBanner />
          <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
        </FileUploadProvider>
      </body>
    </html>
  );
}


// ─── src/app/globals.css ────────────────────────────────────
/*
@tailwind base;
@tailwind components;
@tailwind utilities;
*/

