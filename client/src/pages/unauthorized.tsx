import React from "react";
import { useLocation } from "wouter";

export default function UnauthorizedPage() {
  const [, setLocation] = useLocation();

  const handleGoToLogin = () => {
    setLocation("/login");
  };

  return (
    <main
      role="main"
      aria-labelledby="unauthorized-title"
      className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-gray-50 dark:bg-gray-900"
    >
      <h1
        id="unauthorized-title"
        className="text-5xl font-extrabold mb-4 text-red-600 dark:text-red-400"
      >
        403 - Unauthorized
      </h1>
      <p className="mb-8 max-w-md text-lg text-gray-700 dark:text-gray-300">
        Sorry, you don’t have permission to view this page. If you believe this
        is an error, please contact your administrator.
      </p>
      <button
        type="button"
        onClick={handleGoToLogin}
        className="inline-block px-6 py-3 bg-red-600 text-white rounded-md shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition"
        aria-label="Navigate to login page"
      >
        Go to Login
      </button>
    </main>
  );
}
