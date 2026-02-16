import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/App";
import { toast } from "sonner";
import { getTodayDate } from "@/lib/utils";
import { Scissors, Plus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function CuttingForm() {
  const navigate = useNavigate();
  const { lotId } = useParams();
  const isEditing = !!lotId;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    lot_no: "",
    cutting_date: getTodayDate(),
    gender: "Male",
    sizes: "",
    style: "",
    fabric_name: "",
    fabric_grade: "Fresh",
    dyeing_or_washing_instructions: "",
    rolls: [{ roll_no: "1", meters_or_kgs: 0 }],
    total_pcs_cut: 0,
    fabric_price_per_meter_or_kg: 0,
    cutting_notes: "",
  });

  // Calculated values
  const totalMeters = formData.rolls.reduce((sum, r) => sum + (parseFloat(r.meters_or_kgs) || 0), 0);
  const avgFabricPerPc = formData.total_pcs_cut > 0 ? (totalMeters / formData.total_pcs_cut).toFixed(4) : 0;
  const fabricCostPerPc = (avgFabricPerPc * formData.fabric_price_per_meter_or_kg).toFixed(2);

  useEffect(() => {
    if (isEditing) {
      fetchLot();
    }
  }, [lotId]);

  const fetchLot = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/lots/${lotId}`);
      const lot = response.data;
      setFormData({
        lot_no: lot.lot_no || "",
        cutting_date: lot.cutting_date || getTodayDate(),
        gender: lot.gender || "Male",
        sizes: lot.sizes || "",
        style: lot.style || "",
        fabric_name: lot.fabric_name || "",
        fabric_grade: lot.fabric_grade || "Fresh",
        dyeing_or_washing_instructions: lot.dyeing_or_washing_instructions || "",
        rolls: lot.rolls?.length > 0 ? lot.rolls : [{ roll_no: "1", meters_or_kgs: 0 }],
        total_pcs_cut: lot.total_pcs_cut || 0,
        fabric_price_per_meter_or_kg: lot.fabric_price_per_meter_or_kg || 0,
        cutting_notes: lot.cutting_notes || "",
      });
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

  const handleRollChange = (index, field, value) => {
    const newRolls = [...formData.rolls];
    newRolls[index] = { ...newRolls[index], [field]: field === "meters_or_kgs" ? parseFloat(value) || 0 : value };
    setFormData((prev) => ({ ...prev, rolls: newRolls }));
  };

  const addRoll = () => {
    const nextRollNo = (formData.rolls.length + 1).toString();
    setFormData((prev) => ({
      ...prev,
      rolls: [...prev.rolls, { roll_no: nextRollNo, meters_or_kgs: 0 }],
    }));
  };

  const removeRoll = (index) => {
    if (formData.rolls.length === 1) {
      toast.error("At least one roll is required");
      return;
    }
    const newRolls = formData.rolls.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, rolls: newRolls }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.lot_no.trim()) {
      toast.error("Lot number is required");
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        await api.put(`/lots/${lotId}`, formData);
        toast.success("Lot updated successfully");
      } else {
        const response = await api.post("/lots", formData);
        toast.success("Lot created successfully");
        navigate(`/lot/${response.data.id}`);
        return;
      }
      navigate(`/lot/${lotId}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save lot");
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
    <div className="max-w-4xl mx-auto space-y-6 animate-slide-in" data-testid="cutting-form">
      {/* Header Image */}
      <div className="relative h-32 rounded-lg overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1632932580949-3182167aaebb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHw0fHxyb2xscyUyMG9mJTIwZmFicmljJTIwdGV4dGlsZSUyMGZhY3Rvcnl8ZW58MHx8fHwxNzcxMTE2MDY0fDA&ixlib=rb-4.1.0&q=85"
          alt="Fabric rolls"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center px-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
              <Scissors className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white uppercase tracking-wide">
                {isEditing ? "Edit Cutting Details" : "New Cutting Lot"}
              </h1>
              <p className="text-white/70 text-sm">Enter fabric and cutting details</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card className="industrial-card">
          <CardHeader>
            <CardTitle className="text-lg uppercase tracking-wide">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="lot_no" className="text-xs uppercase tracking-widest text-muted-foreground">
                Lot Number *
              </Label>
              <Input
                id="lot_no"
                value={formData.lot_no}
                onChange={(e) => handleChange("lot_no", e.target.value)}
                placeholder="e.g., 1050"
                required
                data-testid="lot-no-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cutting_date" className="text-xs uppercase tracking-widest text-muted-foreground">
                Cutting Date
              </Label>
              <Input
                id="cutting_date"
                type="date"
                value={formData.cutting_date}
                onChange={(e) => handleChange("cutting_date", e.target.value)}
                data-testid="cutting-date-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender" className="text-xs uppercase tracking-widest text-muted-foreground">
                Gender
              </Label>
              <Select value={formData.gender} onValueChange={(v) => handleChange("gender", v)}>
                <SelectTrigger id="gender" data-testid="gender-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mens">Mens</SelectItem>
                  <SelectItem value="Womens">Womens</SelectItem>
                  <SelectItem value="Kids">Kids</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sizes" className="text-xs uppercase tracking-widest text-muted-foreground">
                Sizes
              </Label>
              <Input
                id="sizes"
                value={formData.sizes}
                onChange={(e) => handleChange("sizes", e.target.value)}
                placeholder="e.g., S, M, L, XL"
                data-testid="sizes-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="style" className="text-xs uppercase tracking-widest text-muted-foreground">
                Style
              </Label>
              <Input
                id="style"
                value={formData.style}
                onChange={(e) => handleChange("style", e.target.value)}
                placeholder="e.g., Jogger"
                data-testid="style-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fabric_name" className="text-xs uppercase tracking-widest text-muted-foreground">
                Fabric Name
              </Label>
              <Input
                id="fabric_name"
                value={formData.fabric_name}
                onChange={(e) => handleChange("fabric_name", e.target.value)}
                placeholder="e.g., Rome Black"
                data-testid="fabric-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fabric_grade" className="text-xs uppercase tracking-widest text-muted-foreground">
                Fabric Grade
              </Label>
              <Select value={formData.fabric_grade} onValueChange={(v) => handleChange("fabric_grade", v)}>
                <SelectTrigger id="fabric_grade" data-testid="fabric-grade-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fresh">Fresh</SelectItem>
                  <SelectItem value="Second">Second</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="dyeing_instructions" className="text-xs uppercase tracking-widest text-muted-foreground">
                Dyeing or Washing Instructions
              </Label>
              <Input
                id="dyeing_instructions"
                value={formData.dyeing_or_washing_instructions}
                onChange={(e) => handleChange("dyeing_or_washing_instructions", e.target.value)}
                placeholder="e.g., Light wash, no bleach"
                data-testid="dyeing-instructions-input"
              />
            </div>
          </CardContent>
        </Card>

        {/* Rolls Table */}
        <Card className="industrial-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg uppercase tracking-wide">Fabric Rolls</CardTitle>
              <CardDescription>Add all rolls used in this lot</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addRoll} data-testid="add-roll-btn">
              <Plus className="w-4 h-4 mr-2" />
              Add Roll
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold uppercase text-xs tracking-wider">Roll No</TableHead>
                  <TableHead className="font-bold uppercase text-xs tracking-wider">Meters / Kgs</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.rolls.map((roll, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Input
                        value={roll.roll_no}
                        onChange={(e) => handleRollChange(index, "roll_no", e.target.value)}
                        className="w-24"
                        data-testid={`roll-no-${index}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={roll.meters_or_kgs}
                        onChange={(e) => handleRollChange(index, "meters_or_kgs", e.target.value)}
                        className="w-32"
                        data-testid={`roll-meters-${index}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRoll(index)}
                        className="text-destructive hover:text-destructive"
                        data-testid={`remove-roll-${index}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">
                Total Meters/Kgs Used: <span className="font-bold text-lg">{totalMeters.toFixed(2)}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Production & Cost */}
        <Card className="industrial-card">
          <CardHeader>
            <CardTitle className="text-lg uppercase tracking-wide">Production & Cost</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="total_pcs" className="text-xs uppercase tracking-widest text-muted-foreground">
                Total Pieces Cut
              </Label>
              <Input
                id="total_pcs"
                type="number"
                value={formData.total_pcs_cut}
                onChange={(e) => handleChange("total_pcs_cut", parseInt(e.target.value) || 0)}
                placeholder="e.g., 600"
                data-testid="total-pcs-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fabric_price" className="text-xs uppercase tracking-widest text-muted-foreground">
                Fabric Price per Meter/Kg (₹)
              </Label>
              <Input
                id="fabric_price"
                type="number"
                step="0.01"
                value={formData.fabric_price_per_meter_or_kg}
                onChange={(e) => handleChange("fabric_price_per_meter_or_kg", parseFloat(e.target.value) || 0)}
                placeholder="e.g., 150"
                data-testid="fabric-price-input"
              />
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Avg Fabric per Piece</p>
              <p className="text-xl font-bold">{avgFabricPerPc} m/kg</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Fabric Cost per Piece</p>
              <p className="text-xl font-bold">₹{fabricCostPerPc}</p>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="industrial-card">
          <CardHeader>
            <CardTitle className="text-lg uppercase tracking-wide">Cutting Notes</CardTitle>
            <CardDescription>Add any notes specific to this cutting stage</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.cutting_notes}
              onChange={(e) => handleChange("cutting_notes", e.target.value)}
              placeholder="Enter notes about the cutting process..."
              rows={4}
              data-testid="cutting-notes-input"
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} data-testid="cancel-btn">
            Cancel
          </Button>
          <Button type="submit" disabled={saving} data-testid="save-lot-btn">
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                Saving...
              </span>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? "Update Lot" : "Create Lot"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
