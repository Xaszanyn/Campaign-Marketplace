"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

export default function Home() {
  const router = useRouter();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const { data: users = [] } = trpc.user.list.useQuery();
  const selectUserMutation = trpc.user.select.useMutation();

  const handleContinue = async () => {
    if (!selectedUserId) return;

    setIsLoading(true);
    try {
      const result = await selectUserMutation.mutateAsync({ userId: selectedUserId });
      const user = users.find((u) => u.id === selectedUserId);

      if (user?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/creator");
      }
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Campaign Marketplace</h1>
          <p className="text-slate-500 mt-2">Select your account to continue</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Account
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select an account</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.email} ({user.role})
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={handleContinue}
            disabled={!selectedUserId || isLoading}
            className="w-full"
          >
            {isLoading ? "Signing in..." : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
