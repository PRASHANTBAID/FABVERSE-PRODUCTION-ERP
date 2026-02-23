import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api } from "@/App";
import { toast } from "sonner";
import { cn, formatDate, getStatusClass, getStageClass } from "@/lib/utils";
import {
  Scissors,
  Shirt,
  Sparkles,
  Droplets,
  CheckCircle2,
  ChevronRight,
  Edit,
  Trash2,
  FileText,
  Package,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const StageCard = ({ stage, icon: Icon, title, isActive, isCompleted, children, actionLabel, actionPath, lotId, hasData }) => {
  const navigate = useNavigate();
  
  return (
    <Card className={cn(
      "industrial-card transition-all duration-300",
      isActive && "ring-2 ring-primary",
      isCompleted && "opacity-90"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              isCompleted ? "bg-emerald-500" : isActive ? "bg-primary" : "bg-muted"
            )}>
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-white" />
              ) : (
                <Icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
              )}
            </div>
            <div>
              <CardTitle className="text-lg uppercase tracking-wide">{title}</CardTitle>
              <Badge variant="outline" className={cn("text-xs", isCompleted ? "status-completed" : isActive ? "status-in-progress" : "status-pending")}>
                {isCompleted ? "Completed" : isActive ? "Current Stage" : "Pending"}
              </Badge>
            </div>
          </div>
          {actionPath && (
            <Button
              size="sm"
              variant={isActive ? "default" : "outline"}
              onClick={() => navigate(actionPath)}
              data-testid={`${stage}-action-btn`}
            >
              {isCompleted && hasData ? (
                <>
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </>
              ) : actionLabel}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between py-2 border-b border-border/50 last:border-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-medium">{value || "-"}</span>
  </div>
);

export default function LotDetail() {
  const navigate = useNavigate();
  const { lotId } = useParams();
  const [lot, setLot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchLot();
  }, [lotId]);

  const fetchLot = async () => {
    try {
      const response = await api.get(`/lots/${lotId}`);
      setLot(response.data);
    } catch (error) {
      toast.error("Failed to fetch lot details");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/lots/${lotId}`);
      toast.success("Lot deleted successfully");
      navigate("/");
    } catch (error) {
      toast.error("Failed to delete lot");
    } finally {
      setDeleting(false);
    }
  };

  const getStageIndex = (stage) => {
    const stages = ["Cutting", "Stitching", "Bartack", "Washing/Dyeing", "Completed"];
    return stages.indexOf(stage);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!lot) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <p className="text-lg font-medium">Lot not found</p>
        <Button className="mt-4" onClick={() => navigate("/")}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const currentStageIndex = getStageIndex(lot.current_stage);

  return (
    <div className="space-y-6 animate-slide-in" data-testid="lot-detail">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight uppercase">Lot {lot.lot_no}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={cn("text-sm", getStageClass(lot.current_stage))}>
              {lot.current_stage}
            </Badge>
            <Badge variant="outline" className={cn("text-sm border", getStatusClass(lot.overall_status))}>
              {lot.overall_status}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/cutting/${lotId}`)} data-testid="edit-lot-btn">
            <Edit className="w-4 h-4 mr-2" />
            Edit Cutting
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" data-testid="delete-lot-btn">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Lot {lot.lot_no}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this lot and all its stage data. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                  {deleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Pipeline Progress */}
      <Card className="industrial-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {["Cutting", "Stitching", "Bartack", "Washing/Dyeing", "Completed"].map((stage, index) => (
              <div key={stage} className="flex items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                  index < currentStageIndex ? "bg-emerald-500 text-white" :
                  index === currentStageIndex ? "bg-primary text-primary-foreground" :
                  "bg-muted text-muted-foreground"
                )}>
                  {index < currentStageIndex ? "✓" : index + 1}
                </div>
                <span className={cn(
                  "ml-2 text-sm hidden md:block",
                  index === currentStageIndex ? "font-bold" : "text-muted-foreground"
                )}>
                  {stage}
                </span>
                {index < 4 && (
                  <ChevronRight className="w-4 h-4 mx-2 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cutting Details */}
      <StageCard
        stage="cutting"
        icon={Scissors}
        title="Cutting"
        isActive={currentStageIndex === 0}
        isCompleted={currentStageIndex > 0}
        actionLabel="Edit"
        actionPath={`/cutting/${lotId}`}
        lotId={lotId}
        hasData={true}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <InfoRow label="Cutting Date" value={formatDate(lot.cutting_date)} />
          <InfoRow label="Total Pieces" value={lot.total_pcs_cut} />
          <InfoRow label="Gender" value={lot.gender} />
          <InfoRow label="Sizes" value={lot.sizes} />
          <InfoRow label="Style" value={lot.style} />
          <InfoRow label="Fabric" value={lot.fabric_name} />
          <InfoRow label="Fabric Grade" value={lot.fabric_grade} />
          <InfoRow label="Total Meters/Kgs" value={`${lot.total_meters_or_kgs_used?.toFixed(2) || 0}`} />
          <InfoRow label="Avg Fabric/Pc" value={`${lot.avg_fabric_used_per_pc?.toFixed(4) || 0} m`} />
          <InfoRow label="Fabric Cost/Pc" value={`₹${lot.fabric_cost_per_pc?.toFixed(2) || 0}`} />
        </div>
        {lot.cutting_notes && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Notes</p>
            <p className="text-sm">{lot.cutting_notes}</p>
          </div>
        )}
      </StageCard>

      {/* Stitching Details */}
      <StageCard
        stage="stitching"
        icon={Shirt}
        title="Stitching"
        isActive={currentStageIndex === 1}
        isCompleted={currentStageIndex > 1}
        actionLabel={lot.stitching ? "Update" : "Start Stitching"}
        actionPath={`/lot/${lotId}/stitching`}
        lotId={lotId}
        hasData={!!lot.stitching}
      >
        {lot.stitching ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <InfoRow label="Fabricator" value={lot.stitching.stitching_fabricator_name} />
              <InfoRow label="Challan No" value={lot.stitching.stitching_challan_no} />
              <InfoRow label="Issue Date" value={formatDate(lot.stitching.lot_issue_date_to_stitching)} />
              <InfoRow label="Receive Date" value={formatDate(lot.stitching.receive_date_from_stitching)} />
              <InfoRow label="Pcs Received" value={lot.stitching.pcs_received_back_from_stitching} />
            </div>
            {lot.stitching.stitching_notes && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Notes</p>
                <p className="text-sm">{lot.stitching.stitching_notes}</p>
              </div>
            )}
            {lot.stitching.stitching_challan_no && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => navigate(`/challan/stitching-${lotId}`)}
                data-testid="view-stitching-challan-btn"
              >
                <FileText className="w-4 h-4 mr-2" />
                View Challan
              </Button>
            )}
          </>
        ) : (
          <p className="text-muted-foreground text-sm">Stitching stage not started yet</p>
        )}
      </StageCard>

      {/* Bartack Details */}
      <StageCard
        stage="bartack"
        icon={Sparkles}
        title="Bartack"
        isActive={currentStageIndex === 2}
        isCompleted={currentStageIndex > 2}
        actionLabel={lot.bartack ? "Update" : "Start Bartack"}
        actionPath={`/lot/${lotId}/bartack`}
        lotId={lotId}
        hasData={!!lot.bartack}
      >
        {lot.bartack ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <InfoRow label="Bartack Person" value={lot.bartack.bartack_person_name} />
              <InfoRow label="Issue Date" value={formatDate(lot.bartack.lot_issue_to_bartack_date)} />
              <InfoRow label="Pcs Issued" value={lot.bartack.pcs_issued_to_bartack} />
            </div>
            {lot.bartack.bartack_notes && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Notes</p>
                <p className="text-sm">{lot.bartack.bartack_notes}</p>
              </div>
            )}
          </>
        ) : (
          <p className="text-muted-foreground text-sm">
            {currentStageIndex >= 1 ? "Bartack stage not started yet" : "Complete stitching first"}
          </p>
        )}
      </StageCard>

      {/* Washing/Dyeing Details */}
      <StageCard
        stage="washing"
        icon={Droplets}
        title="Washing / Dyeing"
        isActive={currentStageIndex === 3}
        isCompleted={currentStageIndex > 3}
        actionLabel={lot.washing ? "Update" : "Start Washing"}
        actionPath={`/lot/${lotId}/washing`}
        lotId={lotId}
        hasData={!!lot.washing}
      >
        {lot.washing ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <InfoRow label="Washing Firm" value={lot.washing.dyeing_person_firm_name} />
              <InfoRow label="Challan No" value={lot.washing.washing_challan_no} />
              <InfoRow label="Issue Date" value={formatDate(lot.washing.lot_issue_date_to_washing)} />
              <InfoRow label="Pcs Issued" value={lot.washing.pcs_issued_to_washing} />
              <InfoRow label="Receive Date" value={formatDate(lot.washing.receive_date_from_washing)} />
              <InfoRow label="Pcs Received" value={lot.washing.pcs_received_back_from_washing} />
            </div>
            {lot.washing.washing_notes && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Notes</p>
                <p className="text-sm">{lot.washing.washing_notes}</p>
              </div>
            )}
            {lot.washing.washing_challan_no && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => navigate(`/challan/washing-${lotId}`)}
                data-testid="view-washing-challan-btn"
              >
                <FileText className="w-4 h-4 mr-2" />
                View Challan
              </Button>
            )}
          </>
        ) : (
          <p className="text-muted-foreground text-sm">
            {currentStageIndex >= 2 ? "Washing stage not started yet" : "Complete bartack first"}
          </p>
        )}
      </StageCard>
    </div>
  );
}
