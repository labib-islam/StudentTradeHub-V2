"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import UserRoute from "@/components/UserRoute";


export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      router.push('/buy');
    }
  }, [loading, router]);

  // Show loading state while redirecting
  return (
    <UserRoute>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Redirecting...</div>
      </div>
    </UserRoute>
  );
}