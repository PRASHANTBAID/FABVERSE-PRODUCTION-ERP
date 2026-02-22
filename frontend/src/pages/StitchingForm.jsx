import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/App";
import { toast } from "sonner";
import { getTodayDate } from "@/lib/utils";
import { Shirt, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function StitchingForm() {
  const navigate = useNavigate();
  const { lotId } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lot, setLot] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    stitching_fabricator_name: "",
    lot_issue_date_to_stitching: getTodayDate(),
    receive_date_from_stitching: "",
    pcs_received_back_from_stitching: "",
    stitching_notes: "",
  });

  useEffect(() => {
    fetchLot();
  }, [lotId]);

  const fetchLot = async () => {
    try {
      const response = await api.get(`/lots/${lotId}`);
      setLot(response.data);
      
      if (response.data.stitching) {
        setIsEditing(true);
        const s = response.data.stitching;
        setFormData({
          stitching_fabricator_name: s.stitching_fabricator_name || "",
          lot_issue_date_to_stitching: s.lot_issue_date_to_stitching || getTodayDate(),
          receive_date_from_stitching: s.receive_date_from_stitching || "",
          pcs_received_back_from_stitching: s.pcs_received_back_from_stitching || "",
          stitching_notes: s.stitching_notes || "",
        });
      }
    } catch (error) {
      toast.error("Failed to fetch lot details");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.stitching_fabricator_name.trim()) {
      toast.error("Fabricator name is required");
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        await api.put(`/stitching/${lotId}`, formData);
        toast.success("Stitching stage updated");
      } else {
        await api.post("/stitching", {
          lot_id: lotId,
          ...formData,
        });
        toast.success("Stitching stage started - Challan generated");
      }
      navigate(`/lot/${lotId}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-in" data-testid="stitching-form">
      {/* Header */}
      <div className="relative h-32 rounded-lg overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1625479144604-ae69462778b7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwyfHxpbmR1c3RyaWFsJTIwc2V3aW5nJTIwbWFjaGluZSUyMGNsb3NldXB8ZW58MHx8fHwxNzcxMTE2MDY1fDA&ixlib=rb-4.1.0&q=85"
          alt="Sewing machine"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center px-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center">
              <Shirt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white uppercase tracking-wide">
                {isEditing ? "Update Stitching" : "Start Stitching"}
              </h1>
              <p className="text-white/70 text-sm">Lot {lot?.lot_no} - {lot?.fabric_name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lot Summary */}
      <Card className="industrial-card">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Total Pcs</p>
              <p className="text-2xl font-bold">{lot?.total_pcs_cut || 0}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Style</p>
              <p className="text-lg font-medium">{lot?.style || "-"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Sizes</p>
              <p className="text-lg font-medium">{lot?.sizes || "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="industrial-card">
          <CardHeader>
            <CardTitle className="text-lg uppercase tracking-wide">Stitching Details</CardTitle>
            <CardDescription>Enter fabricator and issue details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Stitching Fabricator Name {!isEditing && "*"}
              </Label>
              <Input
                value={formData.stitching_fabricator_name}
                onChange={(e) => handleChange("stitching_fabricator_name", e.target.value)}
                placeholder="Enter fabricator name"
                required={!isEditing}
                disabled={isEditing}
                className={isEditing ? "bg-gray-100 cursor-not-allowed" : ""}
                data-testid="fabricator-name-input"
              />
              {isEditing && (
                <p className="text-xs text-muted-foreground">Fabricator name cannot be changed after challan is generated</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Issue Date to Stitching {!isEditing && "*"}
              </Label>
              <Input
                type="date"
                value={formData.lot_issue_date_to_stitching}
                onChange={(e) => handleChange("lot_issue_date_to_stitching", e.target.value)}
                min={!isEditing ? getTodayDate() : undefined}
                required={!isEditing}
                disabled={isEditing}
                className={isEditing ? "bg-gray-100 cursor-not-allowed" : ""}
                data-testid="issue-date-input"
              />
              {isEditing ? (
                <p className="text-xs text-muted-foreground">Issue date cannot be changed after challan is generated</p>
              ) : (
                <p className="text-xs text-muted-foreground">Future dates only for new entries</p>
              )}
            </div>

            {isEditing && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                    Receive Date from Stitching
                  </Label>
                  <Input
                    type="date"
                    value={formData.receive_date_from_stitching}
                    onChange={(e) => handleChange("receive_date_from_stitching", e.target.value)}
                    data-testid="receive-date-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                    Pieces Received Back
                  </Label>
                  <Input
                    type="number"
                    value={formData.pcs_received_back_from_stitching}
                    onChange={(e) => handleChange("pcs_received_back_from_stitching", parseInt(e.target.value) || "")}
                    placeholder="Enter pieces received"
                    data-testid="pcs-received-input"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Stitching Notes
              </Label>
              <Textarea
                value={formData.stitching_notes}
                onChange={(e) => handleChange("stitching_notes", e.target.value)}
                placeholder="Add notes for stitching (will appear on challan)..."
                rows={4}
                data-testid="stitching-notes-input"
              />
              <p className="text-xs text-muted-foreground">These notes will be printed on the stitching challan</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} data-testid="cancel-btn">
            Cancel
          </Button>
          <Button type="submit" disabled={saving} data-testid="save-stitching-btn">
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                Saving...
              </span>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? "Update" : "Start Stitching & Generate Challan"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
