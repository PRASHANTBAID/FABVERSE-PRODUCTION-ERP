import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await login(username, password);
    setLoading(false);
    if (success) {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-[#1e3a8a]">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Login Card */}
      <Card className="relative z-10 w-full max-w-md bg-white shadow-2xl border-0 rounded-xl" data-testid="login-card">
        <CardHeader className="text-center space-y-4 pb-2 pt-8">
          <div className="mx-auto">
            <div className="w-16 h-16 bg-[#1e3a8a] rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-3xl">$</span>
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold tracking-wide text-gray-800" data-testid="app-title">
              FABVERSE
            </CardTitle>
            <CardDescription className="text-gray-500 mt-1">
              Production ERP
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4 pb-8 px-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                className="h-11 bg-gray-50 border-gray-200"
                data-testid="username-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="h-11 bg-gray-50 border-gray-200"
                data-testid="password-input"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold bg-[#1e3a8a] hover:bg-[#1e3a8a]/90"
              disabled={loading}
              data-testid="login-submit-btn"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Signing In...
                </span>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
          <p className="text-center text-xs text-gray-400 mt-6">
            Default credentials: admin / admin
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
