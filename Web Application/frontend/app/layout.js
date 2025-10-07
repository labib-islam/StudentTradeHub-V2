import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
