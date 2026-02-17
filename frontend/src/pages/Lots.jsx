import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/App";
import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";
import { Search, Plus, Eye, Trash2, CheckSquare, Square, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

export default function Lots() {
  const navigate = useNavigate();
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [lotToDelete, setLotToDelete] = useState(null);
  
  // Bulk operations state
  const [selectedLots, setSelectedLots] = useState([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  useEffect(() => {
    fetchLots();
  }, [search, stageFilter, statusFilter]);

  const fetchLots = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (stageFilter && stageFilter !== "all") params.append("stage", stageFilter);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);

      const res = await api.get(`/lots?${params.toString()}`);
      setLots(res.data);
    } catch (error) {
      toast.error("Failed to fetch lots");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!lotToDelete) return;
    try {
      await api.delete(`/lots/${lotToDelete.id}`);
      toast.success("Lot deleted successfully");
      fetchLots();
    } catch (error) {
      toast.error("Failed to delete lot");
    } finally {
      setDeleteDialogOpen(false);
      setLotToDelete(null);
    }
  };

  const getStageStyle = (stage) => {
    const styles = {
      "Cutting": "bg-blue-100 text-blue-700 border-l-4 border-l-blue-500",
      "Stitching": "bg-purple-100 text-purple-700 border-l-4 border-l-purple-500",
      "Bartack": "bg-orange-100 text-orange-700 border-l-4 border-l-orange-500",
      "Washing/Dyeing": "bg-cyan-100 text-cyan-700 border-l-4 border-l-cyan-500",
      "Completed": "bg-green-100 text-green-700 border-l-4 border-l-green-500",
    };
    return styles[stage] || "bg-gray-100 text-gray-700";
  };

  const getStatusStyle = (status) => {
    const styles = {
      "Pending": "bg-amber-100 text-amber-700 border border-amber-300",
      "In Progress": "bg-green-100 text-green-700 border border-green-300",
      "Completed": "bg-blue-100 text-blue-700 border border-blue-300",
      "Delayed": "bg-red-100 text-red-700 border border-red-300",
    };
    return styles[status] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-6" data-testid="lots-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Lots</h1>
          <p className="text-gray-500 mt-1">Manage all production lots</p>
        </div>
        <Button 
          onClick={() => navigate("/cutting/new")} 
          className="bg-blue-600 hover:bg-blue-700"
          data-testid="new-lot-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Lot
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search lot, fabric, style..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200"
              data-testid="search-input"
            />
          </div>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-full md:w-40 bg-gray-50 border-gray-200" data-testid="stage-filter">
              <SelectValue placeholder="All Stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              <SelectItem value="Cutting">Cutting</SelectItem>
              <SelectItem value="Stitching">Stitching</SelectItem>
              <SelectItem value="Bartack">Bartack</SelectItem>
              <SelectItem value="Washing/Dyeing">Washing/Dyeing</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-40 bg-gray-50 border-gray-200" data-testid="status-filter">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Delayed">Delayed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : lots.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <p className="text-lg font-medium">No lots found</p>
            <p className="text-sm">Create a new lot to get started</p>
            <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={() => navigate("/cutting/new")}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Lot
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b">
                  <TableHead className="font-semibold text-gray-600">Lot No</TableHead>
                  <TableHead className="font-semibold text-gray-600">Date</TableHead>
                  <TableHead className="font-semibold text-gray-600">Pcs</TableHead>
                  <TableHead className="font-semibold text-gray-600">Sizes</TableHead>
                  <TableHead className="font-semibold text-gray-600">Fabric</TableHead>
                  <TableHead className="font-semibold text-gray-600">Style</TableHead>
                  <TableHead className="font-semibold text-gray-600">Stage</TableHead>
                  <TableHead className="font-semibold text-gray-600">Status</TableHead>
                  <TableHead className="font-semibold text-gray-600">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lots.map((lot) => (
                  <TableRow
                    key={lot.id}
                    className="hover:bg-gray-50 transition-colors"
                    data-testid={`lot-row-${lot.lot_no}`}
                  >
                    <TableCell className="font-semibold text-gray-800">{lot.lot_no}</TableCell>
                    <TableCell className="text-gray-600">{formatDate(lot.cutting_date)}</TableCell>
                    <TableCell className="text-gray-600">{lot.total_pcs_cut}</TableCell>
                    <TableCell className="text-gray-600">{lot.sizes || "-"}</TableCell>
                    <TableCell className="text-gray-600 max-w-32 truncate">{lot.fabric_name || "-"}</TableCell>
                    <TableCell className="text-gray-600">{lot.style || "-"}</TableCell>
                    <TableCell>
                      <span className={cn("px-2 py-1 rounded text-xs font-medium", getStageStyle(lot.current_stage))}>
                        {lot.current_stage}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={cn("px-2 py-1 rounded text-xs font-medium", getStatusStyle(lot.overall_status))}>
                        {lot.overall_status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-blue-600"
                          onClick={() => navigate(`/lot/${lot.id}`)}
                          data-testid={`view-lot-${lot.lot_no}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-red-600"
                          onClick={() => {
                            setLotToDelete(lot);
                            setDeleteDialogOpen(true);
                          }}
                          data-testid={`delete-lot-${lot.lot_no}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lot</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete lot "{lotToDelete?.lot_no}"? This will also delete all associated stitching, bartack, washing data and challans. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
