import { useState } from "react";
import { api } from "@/App";
import { useAuth } from "@/App";
import { toast } from "sonner";
import { Settings as SettingsIcon, Key, User, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  const { user, logout } = useAuth();
  const [saving, setSaving] = useState(false);
  const [passwords, setPasswords] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwords.new_password !== passwords.confirm_password) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwords.new_password.length < 4) {
      toast.error("New password must be at least 4 characters");
      return;
    }

    setSaving(true);
    try {
      await api.post("/auth/change-password", {
        old_password: passwords.old_password,
        new_password: passwords.new_password,
      });
      toast.success("Password changed successfully");
      setPasswords({ old_password: "", new_password: "", confirm_password: "" });
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-in" data-testid="settings-page">
      <div>
        <h1 className="text-4xl font-bold tracking-tight uppercase">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings</p>
      </div>

      {/* User Info */}
      <Card className="industrial-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
              <User className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg uppercase tracking-wide">Account Info</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Username</p>
              <p className="text-lg font-medium">{user?.username}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Role</p>
              <p className="text-lg font-medium">Administrator</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="industrial-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Key className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-lg uppercase tracking-wide">Change Password</CardTitle>
              <CardDescription>Update your login password</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Current Password
              </Label>
              <Input
                type="password"
                value={passwords.old_password}
                onChange={(e) => setPasswords({ ...passwords, old_password: e.target.value })}
                placeholder="Enter current password"
                required
                data-testid="old-password-input"
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                New Password
              </Label>
              <Input
                type="password"
                value={passwords.new_password}
                onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                placeholder="Enter new password"
                required
                data-testid="new-password-input"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Confirm New Password
              </Label>
              <Input
                type="password"
                value={passwords.confirm_password}
                onChange={(e) => setPasswords({ ...passwords, confirm_password: e.target.value })}
                placeholder="Confirm new password"
                required
                data-testid="confirm-password-input"
              />
            </div>

            <Button type="submit" disabled={saving} data-testid="change-password-btn">
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Changing...
                </span>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Change Password
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card className="industrial-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
              <SettingsIcon className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg uppercase tracking-wide">About FABVERSE</CardTitle>
              <CardDescription>Application information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Application</span>
              <span className="font-medium">FABVERSE ERP</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium">Garment Production ERP</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
