import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/ToastContext";
import { ThemeProvider } from "@/components/ui/ThemeContext";
import { PwaRegister } from "@/components/pwa/PwaRegister";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FinTrack — Personal Expense Tracker & Intelligence",
  description: "Track expenses, visualize trends, monitor category budgets, and optimize your personal cashflow.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FinTrack",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Anti-FOUC inline script to execute before paint
  const themeScript = `
    (function() {
      try {
        var stored = localStorage.getItem('fintrack-theme');
        if (stored === 'light') {
          document.documentElement.classList.remove('dark');
        } else {
          document.documentElement.classList.add('dark');
        }
      } catch (e) {}
    })();
  `;

  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${plusJakartaSans.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans bg-background text-foreground min-h-screen flex flex-col selection:bg-primary/30 selection:text-primary-600 dark:selection:text-white antialiased transition-colors duration-200">
        <ThemeProvider>
          <ToastProvider>
            {children}
            <PwaRegister />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

