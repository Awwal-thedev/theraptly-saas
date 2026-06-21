import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Inter_Tight, Roboto } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/auth-context";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Dashboard typography mirrors the Figma, which mixes several families.
const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Theraptly — Healthcare training & compliance",
  description:
    "Theraptly helps healthcare organizations train, educate, and keep their staff compliant with structured learning built for healthcare requirements.",
};

/**
 * Every screen reads auth state from Supabase (via AuthProvider → useAuth)
 * and most also touch the URL or localStorage on first paint. None of that
 * is statically prerenderable, so we opt the whole app out of build-time
 * static generation.
 */
export const dynamic = "force-dynamic"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${interTight.variable} ${inter.variable} ${roboto.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
