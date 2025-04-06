import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'InstructAI - Personalized Education Platform',
  description: 'Create bespoke education experiences with AI-powered courses',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <main className="">
          <AuthProvider>
             {children}
          </AuthProvider>
        </main>
      </body>
    </html>
  );
}