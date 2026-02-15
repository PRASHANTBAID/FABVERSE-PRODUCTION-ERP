import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useTheme } from "@/App";
import { Sun, Moon, Scissors, Factory } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1660980041852-230420b8f99f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBnYXJtZW50JTIwZmFjdG9yeSUyMGludGVyaW9yfGVufDB8fHx8MTc3MTExNjA2M3ww&ixlib=rb-4.1.0&q=85')`,
        }}
      />
      <div className="absolute inset-0 bg-black/70 dark:bg-black/80" />

      {/* Theme Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="absolute top-4 right-4 z-20 text-white hover:bg-white/20"
        data-testid="theme-toggle-btn"
      >
        {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>

      {/* Login Card */}
      <Card className="relative z-10 w-full max-w-md bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl" data-testid="login-card">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary flex items-center justify-center">
            <Factory className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-4xl font-bold tracking-wider uppercase logo-text" data-testid="app-title">
              FABVERSE
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Garment Production ERP
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs uppercase tracking-widest text-muted-foreground">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                className="h-12 bg-background/50"
                data-testid="username-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs uppercase tracking-widest text-muted-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="h-12 bg-background/50"
                data-testid="password-input"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold uppercase tracking-wider"
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
          <p className="text-center text-xs text-muted-foreground mt-6">
            Default: admin / admin
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
