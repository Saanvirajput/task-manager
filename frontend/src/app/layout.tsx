<<<<<<< HEAD
import { AuthProvider } from "@/components/AuthProvider";
import MainLayout from "@/components/MainLayout";
=======
import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "TaskFlow – The workspace for your tasks",
  description: "Manage tasks the way you think. Your AI-powered task workspace.",
};
>>>>>>> development

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
<<<<<<< HEAD
      <body className="antialiased font-sans">
=======
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
>>>>>>> development
        <AuthProvider>
          <MainLayout>
            {children}
          </MainLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
