"use client";
import { logout } from "@/libs/auth";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

const handleLogout = async () => {
  logout();
  window.location.href = '/login';
}

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800"
            >
              Logout
            </button>
          </div>
          <p>Welcome: {user?.email}</p>
        </div>
      </div>
    </ProtectedRoute>
  );
}

