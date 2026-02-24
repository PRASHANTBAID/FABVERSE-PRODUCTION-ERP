import { useState, useEffect } from "react";
import { api } from "@/App";
import { useAuth } from "@/App";
import { toast } from "sonner";
import { Settings as SettingsIcon, Key, User, Save, Building2, Upload, Image, Wrench, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Settings() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [savingFirm, setSavingFirm] = useState(false);
  const [loadingFirm, setLoadingFirm] = useState(true);
  const [repairing, setRepairing] = useState(false);
  const [repairDialogOpen, setRepairDialogOpen] = useState(false);
  const [repairResult, setRepairResult] = useState(null);
  
  const [passwords, setPasswords] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [firmSettings, setFirmSettings] = useState({
    firm_name: "",
    address_line1: "",
    address_line2: "",
    address_line3: "",
    city_state_pin: "",
    gst_number: "",
    mobile: "",
    email: "",
    logo_url: "",
  });

  useEffect(() => {
    fetchFirmSettings();
  }, []);

  const fetchFirmSettings = async () => {
    try {
      const response = await api.get("/settings/firm");
      setFirmSettings(response.data);
    } catch (error) {
      toast.error("Failed to fetch firm settings");
    } finally {
      setLoadingFirm(false);
    }
  };

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

  const handleSaveFirmSettings = async (e) => {
    e.preventDefault();
    setSavingFirm(true);
    try {
      await api.put("/settings/firm", firmSettings);
      toast.success("Firm settings saved successfully");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save firm settings");
    } finally {
      setSavingFirm(false);
    }
  };

  const handleFirmChange = (field, value) => {
    setFirmSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleRepairData = async () => {
    setRepairing(true);
    setRepairResult(null);
    try {
      const response = await api.post("/repair/lot-stages");
      setRepairResult(response.data);
      if (response.data.fixed_count > 0) {
        toast.success(`Successfully repaired ${response.data.fixed_count} lots!`);
      } else {
        toast.info("All lots are already in correct state. No repairs needed.");
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to repair data");
    } finally {
      setRepairing(false);
      setRepairDialogOpen(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-slide-in" data-testid="settings-page">
      <div>
        <h1 className="text-4xl font-bold tracking-tight uppercase">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and firm settings</p>
      </div>

      <Tabs defaultValue="firm" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="firm" data-testid="firm-settings-tab">
            <Building2 className="w-4 h-4 mr-2" />
            Firm Details
          </TabsTrigger>
          <TabsTrigger value="account" data-testid="account-settings-tab">
            <User className="w-4 h-4 mr-2" />
            Account
          </TabsTrigger>
          <TabsTrigger value="maintenance" data-testid="maintenance-tab">
            <Wrench className="w-4 h-4 mr-2" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="about" data-testid="about-tab">
            <SettingsIcon className="w-4 h-4 mr-2" />
            About
          </TabsTrigger>
        </TabsList>

        {/* Firm Details Tab */}
        <TabsContent value="firm" className="space-y-6">
          <Card className="industrial-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg uppercase tracking-wide">Firm Details</CardTitle>
                  <CardDescription>These details will appear on all challans</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingFirm ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                <form onSubmit={handleSaveFirmSettings} className="space-y-6">
                  {/* Logo Preview */}
                  <div className="flex items-start gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                        Current Logo
                      </Label>
                      <div className="w-24 h-24 border rounded-lg overflow-hidden bg-muted/50 flex items-center justify-center">
                        {firmSettings.logo_url ? (
                          <img 
                            src={firmSettings.logo_url} 
                            alt="Firm Logo" 
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Image className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                        Logo URL
                      </Label>
                      <Input
                        value={firmSettings.logo_url}
                        onChange={(e) => handleFirmChange("logo_url", e.target.value)}
                        placeholder="https://example.com/logo.png"
                        data-testid="logo-url-input"
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter a direct URL to your logo image (PNG, JPG)
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                        Firm Name *
                      </Label>
                      <Input
                        value={firmSettings.firm_name}
                        onChange={(e) => handleFirmChange("firm_name", e.target.value)}
                        placeholder="Your Firm Name"
                        required
                        data-testid="firm-name-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                        GST Number
                      </Label>
                      <Input
                        value={firmSettings.gst_number}
                        onChange={(e) => handleFirmChange("gst_number", e.target.value)}
                        placeholder="e.g., 07XXXXX1234X1Z5"
                        data-testid="gst-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                      Address Line 1
                    </Label>
                    <Input
                      value={firmSettings.address_line1}
                      onChange={(e) => handleFirmChange("address_line1", e.target.value)}
                      placeholder="Plot No., Lane No."
                      data-testid="address1-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                      Address Line 2
                    </Label>
                    <Input
                      value={firmSettings.address_line2}
                      onChange={(e) => handleFirmChange("address_line2", e.target.value)}
                      placeholder="Area, Locality"
                      data-testid="address2-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                      Address Line 3 (Optional)
                    </Label>
                    <Input
                      value={firmSettings.address_line3}
                      onChange={(e) => handleFirmChange("address_line3", e.target.value)}
                      placeholder="Additional address info"
                      data-testid="address3-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                      City, State - PIN
                    </Label>
                    <Input
                      value={firmSettings.city_state_pin}
                      onChange={(e) => handleFirmChange("city_state_pin", e.target.value)}
                      placeholder="e.g., Gandhi Nagar, Delhi - 110031"
                      data-testid="city-input"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                        Mobile Number
                      </Label>
                      <Input
                        value={firmSettings.mobile}
                        onChange={(e) => handleFirmChange("mobile", e.target.value)}
                        placeholder="e.g., 9999994690"
                        data-testid="mobile-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                        Email (Optional)
                      </Label>
                      <Input
                        type="email"
                        value={firmSettings.email}
                        onChange={(e) => handleFirmChange("email", e.target.value)}
                        placeholder="contact@yourfirm.com"
                        data-testid="email-input"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Preview */}
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                      Challan Preview
                    </p>
                    <div className="flex items-start gap-4">
                      {firmSettings.logo_url && (
                        <img 
                          src={firmSettings.logo_url} 
                          alt="Logo" 
                          className="w-16 h-16 object-contain"
                        />
                      )}
                      <div className="text-sm">
                        <p className="font-bold text-lg">{firmSettings.firm_name || "Your Firm Name"}</p>
                        {firmSettings.address_line1 && <p className="text-muted-foreground">{firmSettings.address_line1}</p>}
                        {firmSettings.address_line2 && <p className="text-muted-foreground">{firmSettings.address_line2}</p>}
                        {firmSettings.address_line3 && <p className="text-muted-foreground">{firmSettings.address_line3}</p>}
                        {firmSettings.city_state_pin && <p className="text-muted-foreground">{firmSettings.city_state_pin}</p>}
                        {firmSettings.gst_number && <p className="text-muted-foreground">GST: {firmSettings.gst_number}</p>}
                        {firmSettings.mobile && <p className="font-medium">Mobile: {firmSettings.mobile}</p>}
                        {firmSettings.email && <p className="text-muted-foreground">Email: {firmSettings.email}</p>}
                      </div>
                    </div>
                  </div>

                  <Button type="submit" disabled={savingFirm} data-testid="save-firm-btn">
                    {savingFirm ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                        Saving...
                      </span>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Firm Details
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
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
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-6">
          <Card className="industrial-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <CardTitle className="text-lg uppercase tracking-wide">Data Maintenance</CardTitle>
                  <CardDescription>Tools to fix and maintain your production data</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Repair Lot Stages */}
              <div className="p-4 border rounded-lg space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <RefreshCw className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base">Repair Lot Stages</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Fix lots that are showing incorrect stages. This will check all lots and correct their stage based on actual data.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <strong>Use this when:</strong>
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside mt-1">
                      <li>A lot shows wrong stage on dashboard (e.g., showing Bartack but should be Washing)</li>
                      <li>Lot status doesn't match the actual production stage</li>
                      <li>After data import or migration issues</li>
                    </ul>
                  </div>
                </div>
                
                {repairResult && (
                  <div className={`p-3 rounded-lg ${repairResult.fixed_count > 0 ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
                    <p className={`text-sm font-medium ${repairResult.fixed_count > 0 ? 'text-green-800' : 'text-blue-800'}`}>
                      {repairResult.fixed_count > 0 
                        ? `✓ Successfully repaired ${repairResult.fixed_count} out of ${repairResult.total_lots} lots`
                        : `✓ All ${repairResult.total_lots} lots are already in correct state`
                      }
                    </p>
                  </div>
                )}
                
                <Button 
                  onClick={() => setRepairDialogOpen(true)} 
                  disabled={repairing}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="repair-data-btn"
                >
                  {repairing ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                      Repairing...
                    </span>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Repair Lot Stages
                    </>
                  )}
                </Button>
              </div>

              {/* Warning Note */}
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800">Important Note</p>
                  <p className="text-amber-700 mt-1">
                    The repair tool will automatically detect and fix stage inconsistencies. It's safe to run and won't delete any data. 
                    If you're experiencing issues with lot stages not updating correctly, run this repair first.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* About Tab */}
        <TabsContent value="about">
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
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stages</span>
                  <span className="font-medium">Cutting → Stitching → Bartack → Washing</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Repair Confirmation Dialog */}
      <AlertDialog open={repairDialogOpen} onOpenChange={setRepairDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Repair Lot Stages</AlertDialogTitle>
            <AlertDialogDescription>
              This will scan all lots and fix any stage inconsistencies. Lots showing incorrect stages 
              (e.g., showing Bartack when they should be in Washing) will be corrected.
              <br /><br />
              <strong>This action is safe and won't delete any data.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={repairing}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRepairData} 
              disabled={repairing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {repairing ? "Repairing..." : "Repair Now"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
