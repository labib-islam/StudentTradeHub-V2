import Navbar from "@/components/Navbar";
import ReviewPrompt from "@/components/ReviewPrompt";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SearchProvider } from "@/context/SearchContext";

export const metadata = {
  title: "Student Trade Hub",
  description: "A platform for students to buy, sell and trade goods",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className="bg-gradient-to-t from-slate-900 to-slate-700 text-gray-100 min-h-screen font-sans"
      >
        <AuthProvider>
          <SearchProvider>
            <Navbar />
            <ReviewPrompt />
            {children}
          </SearchProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
