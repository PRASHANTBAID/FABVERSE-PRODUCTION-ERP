import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/App";
import { toast } from "sonner";
import { getTodayDate } from "@/lib/utils";
import { Droplets, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function WashingForm() {
  const navigate = useNavigate();
  const { lotId } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lot, setLot] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    dyeing_person_firm_name: "",
    lot_issue_date_to_washing: getTodayDate(),
    pcs_issued_to_washing: 0,
    receive_date_from_washing: "",
    pcs_received_back_from_washing: "",
    washing_notes: "",
  });

  useEffect(() => {
    fetchLot();
  }, [lotId]);

  const fetchLot = async () => {
    try {
      const response = await api.get(`/lots/${lotId}`);
      setLot(response.data);
      
      // Default pcs to bartack issued or stitching received or total cut
      const defaultPcs = response.data.bartack?.pcs_issued_to_bartack || 
                         response.data.stitching?.pcs_received_back_from_stitching || 
                         response.data.total_pcs_cut || 0;
      
      if (response.data.washing) {
        setIsEditing(true);
        const w = response.data.washing;
        setFormData({
          dyeing_person_firm_name: w.dyeing_person_firm_name || "",
          lot_issue_date_to_washing: w.lot_issue_date_to_washing || getTodayDate(),
          pcs_issued_to_washing: w.pcs_issued_to_washing || defaultPcs,
          receive_date_from_washing: w.receive_date_from_washing || "",
          pcs_received_back_from_washing: w.pcs_received_back_from_washing || "",
          washing_notes: w.washing_notes || "",
        });
      } else {
        setFormData((prev) => ({ ...prev, pcs_issued_to_washing: defaultPcs }));
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

    if (!formData.dyeing_person_firm_name.trim()) {
      toast.error("Washing/Dyeing firm name is required");
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        await api.put(`/washing/${lotId}`, formData);
        toast.success("Washing stage updated");
      } else {
        await api.post("/washing", {
          lot_id: lotId,
          ...formData,
        });
        toast.success("Washing stage started - Challan generated");
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
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-in" data-testid="washing-form">
      {/* Header */}
      <div className="relative h-32 rounded-lg overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1770795263583-e2abd887aedc?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzN8MHwxfHNlYXJjaHw0fHxkZW5pbSUyMGZhYnJpYyUyMHRleHR1cmUlMjBibHVlfGVufDB8fHx8MTc3MTExNjA2N3ww&ixlib=rb-4.1.0&q=85"
          alt="Denim fabric"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center px-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-cyan-500 flex items-center justify-center">
              <Droplets className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white uppercase tracking-wide">
                {isEditing ? "Update Washing" : "Start Washing/Dyeing"}
              </h1>
              <p className="text-white/70 text-sm">Lot {lot?.lot_no} - {lot?.fabric_name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lot Summary */}
      <Card className="industrial-card">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Total Pcs</p>
              <p className="text-2xl font-bold">{lot?.total_pcs_cut || 0}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Bartack Person</p>
              <p className="text-lg font-medium">{lot?.bartack?.bartack_person_name || "-"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">From Bartack</p>
              <p className="text-2xl font-bold">{lot?.bartack?.pcs_issued_to_bartack || "-"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Instructions</p>
              <p className="text-sm font-medium">{lot?.dyeing_or_washing_instructions || "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="industrial-card">
          <CardHeader>
            <CardTitle className="text-lg uppercase tracking-wide">Washing/Dyeing Details</CardTitle>
            <CardDescription>Enter washing firm and issue details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Washing/Dyeing Firm Name *
              </Label>
              <Input
                value={formData.dyeing_person_firm_name}
                onChange={(e) => handleChange("dyeing_person_firm_name", e.target.value)}
                placeholder="Enter firm name"
                required
                data-testid="washing-firm-input"
              />
              {isEditing && (
                <p className="text-xs text-muted-foreground">You can update the firm name if needed</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                  Issue Date to Washing *
                </Label>
                <Input
                  type="date"
                  value={formData.lot_issue_date_to_washing}
                  onChange={(e) => handleChange("lot_issue_date_to_washing", e.target.value)}
                  required
                  data-testid="washing-issue-date-input"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                  Pieces Issued to Washing
                </Label>
                <Input
                  type="number"
                  value={formData.pcs_issued_to_washing}
                  onChange={(e) => handleChange("pcs_issued_to_washing", parseInt(e.target.value) || 0)}
                  placeholder="Enter pieces"
                  data-testid="washing-pcs-issued-input"
                />
              </div>
            </div>

            {isEditing && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                    Receive Date from Washing
                  </Label>
                  <Input
                    type="date"
                    value={formData.receive_date_from_washing}
                    onChange={(e) => handleChange("receive_date_from_washing", e.target.value)}
                    data-testid="washing-receive-date-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                    Pieces Received Back
                  </Label>
                  <Input
                    type="number"
                    value={formData.pcs_received_back_from_washing}
                    onChange={(e) => handleChange("pcs_received_back_from_washing", parseInt(e.target.value) || "")}
                    placeholder="Enter pieces received"
                    data-testid="washing-pcs-received-input"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Washing Notes
              </Label>
              <Textarea
                value={formData.washing_notes}
                onChange={(e) => handleChange("washing_notes", e.target.value)}
                placeholder="Add notes for washing (will appear on challan)..."
                rows={4}
                data-testid="washing-notes-input"
              />
              <p className="text-xs text-muted-foreground">
                These notes will be printed on the washing challan along with bartack person name
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} data-testid="cancel-btn">
            Cancel
          </Button>
          <Button type="submit" disabled={saving} data-testid="save-washing-btn">
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                Saving...
              </span>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? "Update" : "Start Washing & Generate Challan"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
