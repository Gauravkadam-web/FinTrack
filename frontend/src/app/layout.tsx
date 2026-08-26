import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/ToastContext";

export const metadata: Metadata = {
  title: "FinTrack — Personal Expense Tracker",
  description: "Track your daily expenses, visualize monthly trends, and monitor budgets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans bg-background text-slate-100 min-h-screen flex flex-col selection:bg-primary/30 selection:text-white">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
