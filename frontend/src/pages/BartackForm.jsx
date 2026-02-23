import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/App";
import { toast } from "sonner";
import { getTodayDate } from "@/lib/utils";
import { Sparkles, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function BartackForm() {
  const navigate = useNavigate();
  const { lotId } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lot, setLot] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    bartack_person_name: "",
    lot_issue_to_bartack_date: getTodayDate(),
    pcs_issued_to_bartack: 0,
    bartack_notes: "",
  });

  useEffect(() => {
    fetchLot();
  }, [lotId]);

  const fetchLot = async () => {
    try {
      const response = await api.get(`/lots/${lotId}`);
      setLot(response.data);
      
      // Default pcs to stitching received or total cut
      const defaultPcs = response.data.stitching?.pcs_received_back_from_stitching || response.data.total_pcs_cut || 0;
      
      if (response.data.bartack) {
        setIsEditing(true);
        const b = response.data.bartack;
        setFormData({
          bartack_person_name: b.bartack_person_name || "",
          lot_issue_to_bartack_date: b.lot_issue_to_bartack_date || getTodayDate(),
          pcs_issued_to_bartack: b.pcs_issued_to_bartack || defaultPcs,
          bartack_notes: b.bartack_notes || "",
        });
      } else {
        setFormData((prev) => ({ ...prev, pcs_issued_to_bartack: defaultPcs }));
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

    if (!formData.bartack_person_name.trim()) {
      toast.error("Bartack person name is required");
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        await api.put(`/bartack/${lotId}`, formData);
        toast.success("Bartack stage updated");
      } else {
        await api.post("/bartack", {
          lot_id: lotId,
          ...formData,
        });
        toast.success("Bartack stage started");
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
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-in" data-testid="bartack-form">
      {/* Header */}
      <div className="relative h-32 rounded-lg overflow-hidden bg-gradient-to-r from-orange-600 to-orange-400">
        <div className="absolute inset-0 flex items-center px-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white uppercase tracking-wide">
                {isEditing ? "Update Bartack" : "Start Bartack"}
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
              <p className="text-xs uppercase tracking-widest text-muted-foreground">From Stitching</p>
              <p className="text-2xl font-bold">{lot?.stitching?.pcs_received_back_from_stitching || "-"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Stitching By</p>
              <p className="text-lg font-medium">{lot?.stitching?.stitching_fabricator_name || "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="industrial-card">
          <CardHeader>
            <CardTitle className="text-lg uppercase tracking-wide">Bartack Details</CardTitle>
            <CardDescription>Enter bartack person and issue details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Bartack Person Name *
              </Label>
              <Input
                value={formData.bartack_person_name}
                onChange={(e) => handleChange("bartack_person_name", e.target.value)}
                placeholder="Enter bartack person name"
                required
                data-testid="bartack-person-input"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Issue Date to Bartack *
              </Label>
              <Input
                type="date"
                value={formData.lot_issue_to_bartack_date}
                onChange={(e) => handleChange("lot_issue_to_bartack_date", e.target.value)}
                required
                data-testid="bartack-date-input"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Pieces Issued to Bartack
              </Label>
              <Input
                type="number"
                value={formData.pcs_issued_to_bartack}
                onChange={(e) => handleChange("pcs_issued_to_bartack", parseInt(e.target.value) || 0)}
                placeholder="Enter pieces"
                data-testid="bartack-pcs-input"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Bartack Notes
              </Label>
              <Textarea
                value={formData.bartack_notes}
                onChange={(e) => handleChange("bartack_notes", e.target.value)}
                placeholder="Add notes for bartack..."
                rows={4}
                data-testid="bartack-notes-input"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} data-testid="cancel-btn">
            Cancel
          </Button>
          <Button type="submit" disabled={saving} data-testid="save-bartack-btn">
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                Saving...
              </span>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? "Update" : "Start Bartack"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
