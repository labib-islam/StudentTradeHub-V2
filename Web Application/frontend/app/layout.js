import Navbar from "@/components/Navbar";
import ReviewPrompt from "@/components/ReviewPrompt";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SearchProvider } from "@/context/SearchContext";
import Loading from "@/components/Loading";
import { Suspense } from "react";

export const metadata = {
  title: "Student Trade Hub",
  description: "A platform for students to buy, sell and trade goods",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className="bg-slate-50 text-slate-900 min-h-screen font-sans"
      >
        <AuthProvider>
          <SearchProvider>
            <Navbar />
            <ReviewPrompt />
            <Suspense fallback={<Loading fullScreen />}>{children}</Suspense>
          </SearchProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
