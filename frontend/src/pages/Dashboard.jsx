import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/App";
import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";
import { 
  Search, 
  Plus, 
  Package,
  Scissors,
  Settings2,
  Droplets,
  CheckCircle2,
  LayoutGrid,
  List,
  Eye,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const STAGES = ["Cutting", "Stitching", "Bartack", "Washing/Dyeing", "Completed"];

const StatCard = ({ title, value, icon: Icon, iconBg, iconColor }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
    <div className={cn("p-3 rounded-lg", iconBg)}>
      <Icon className={cn("w-6 h-6", iconColor)} />
    </div>
    <div>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
    </div>
  </div>
);

// Draggable Lot Card for Kanban
const DraggableLotCard = ({ lot, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lot.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
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
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-gray-50 rounded-lg p-3 border transition-all",
        isDragging ? "shadow-lg border-blue-400" : "hover:bg-gray-100"
      )}
      data-testid={`kanban-lot-${lot.lot_no}`}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 touch-none"
          data-testid={`drag-handle-${lot.lot_no}`}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 cursor-pointer" onClick={() => onClick(lot.id)}>
          <p className="font-semibold text-gray-800 text-sm">{lot.lot_no}</p>
          <p className="text-xs text-gray-500 mt-1">{lot.style || "No style"}</p>
          <p className="text-xs text-gray-500">{lot.total_pcs_cut} pcs</p>
          <div className="mt-2">
            <span className={cn("px-2 py-0.5 rounded text-xs font-medium", getStatusStyle(lot.overall_status))}>
              {lot.overall_status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Droppable Column for Kanban
const KanbanColumn = ({ stage, lots, onLotClick }) => {
  const stageLots = lots.filter((lot) => lot.current_stage === stage);

  return (
    <div className="bg-white rounded-xl border p-4 min-h-[300px]">
      <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide flex items-center justify-between">
        <span>{stage}</span>
        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
          {stageLots.length}
        </span>
      </h3>
      <SortableContext
        items={stageLots.map((lot) => lot.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2 min-h-[200px]" data-stage={stage}>
          {stageLots.map((lot) => (
            <DraggableLotCard
              key={lot.id}
              lot={lot}
              onClick={onLotClick}
            />
          ))}
          {stageLots.length === 0 && (
            <div className="text-center text-gray-400 text-sm py-8 border-2 border-dashed border-gray-200 rounded-lg">
              Drop lots here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [lots, setLots] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("table");
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    fetchData();
  }, [search, stageFilter, statusFilter]);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (stageFilter && stageFilter !== "all") params.append("stage", stageFilter);
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);

      const [lotsRes, statsRes] = await Promise.all([
        api.get(`/lots?${params.toString()}`),
        api.get("/dashboard/stats"),
      ]);
      setLots(lotsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const draggedLot = lots.find((lot) => lot.id === active.id);
    if (!draggedLot) return;

    // Find the target stage from the drop area
    const overElement = document.querySelector(`[data-stage]`);
    let targetStage = null;

    // Check if dropped on another lot or empty column
    if (over.id !== active.id) {
      const overLot = lots.find((lot) => lot.id === over.id);
      if (overLot) {
        targetStage = overLot.current_stage;
      }
    }

    // If we couldn't find target from over lot, check the container
    if (!targetStage) {
      const containers = document.querySelectorAll("[data-stage]");
      for (const container of containers) {
        const rect = container.getBoundingClientRect();
        const clientX = event.activatorEvent?.clientX || 0;
        const clientY = event.activatorEvent?.clientY || 0;
        
        if (
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom
        ) {
          targetStage = container.getAttribute("data-stage");
          break;
        }
      }
    }

    // If still no target or same stage, do nothing
    if (!targetStage || targetStage === draggedLot.current_stage) return;

    // Update the lot's stage
    try {
      await api.put(`/lots/${draggedLot.id}/stage`, { stage: targetStage });
      
      // Update local state
      setLots((prevLots) =>
        prevLots.map((lot) =>
          lot.id === draggedLot.id
            ? { 
                ...lot, 
                current_stage: targetStage,
                overall_status: targetStage === "Completed" ? "Completed" : 
                               (targetStage === "Cutting" ? "Pending" : "In Progress")
              }
            : lot
        )
      );

      toast.success(`Lot ${draggedLot.lot_no} moved to ${targetStage}`);
      
      // Refresh data to get accurate stats
      fetchData();
    } catch (error) {
      toast.error("Failed to update lot stage");
    }
  };

  const handleDragOver = (event) => {
    const { over } = event;
    if (!over) return;

    // Find target stage
    const overLot = lots.find((lot) => lot.id === over.id);
    if (overLot) {
      // Dragging over another lot
      return;
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

  const getStageCount = (stage) => {
    if (!lots) return 0;
    return lots.filter(lot => lot.current_stage === stage).length;
  };

  const activeLot = activeId ? lots.find((lot) => lot.id === activeId) : null;

  return (
    <div className="space-y-6" data-testid="dashboard">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 mt-1">Production pipeline overview</p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Lots"
          value={stats?.total_lots || lots.length}
          icon={Package}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Cutting"
          value={getStageCount("Cutting")}
          icon={Scissors}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatCard
          title="Stitching/Bartack"
          value={getStageCount("Stitching") + getStageCount("Bartack")}
          icon={Settings2}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Washing"
          value={getStageCount("Washing/Dyeing")}
          icon={Droplets}
          iconBg="bg-cyan-100"
          iconColor="text-cyan-600"
        />
        <StatCard
          title="Completed"
          value={getStageCount("Completed")}
          icon={CheckCircle2}
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search lot, fabric, style, fabricator..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200"
              data-testid="search-input"
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-full md:w-36 bg-gray-50 border-gray-200" data-testid="stage-filter">
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
              <SelectTrigger className="w-full md:w-36 bg-gray-50 border-gray-200" data-testid="status-filter">
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
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "px-3 h-8",
                  viewMode === "table" ? "bg-white shadow-sm" : "hover:bg-gray-200"
                )}
                onClick={() => setViewMode("table")}
                data-testid="table-view-btn"
              >
                <List className="w-4 h-4 mr-1" />
                Table
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "px-3 h-8",
                  viewMode === "kanban" ? "bg-white shadow-sm" : "hover:bg-gray-200"
                )}
                onClick={() => setViewMode("kanban")}
                data-testid="kanban-view-btn"
              >
                <LayoutGrid className="w-4 h-4 mr-1" />
                Kanban
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === "table" ? (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : lots.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Package className="w-12 h-12 mb-4 opacity-50" />
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
                    <TableHead className="font-semibold text-gray-600">Fabric</TableHead>
                    <TableHead className="font-semibold text-gray-600">Style</TableHead>
                    <TableHead className="font-semibold text-gray-600">Fabricator</TableHead>
                    <TableHead className="font-semibold text-gray-600">Stage</TableHead>
                    <TableHead className="font-semibold text-gray-600">Status</TableHead>
                    <TableHead className="font-semibold text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lots.map((lot) => (
                    <TableRow
                      key={lot.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      data-testid={`lot-row-${lot.lot_no}`}
                    >
                      <TableCell className="font-semibold text-gray-800">{lot.lot_no}</TableCell>
                      <TableCell className="text-gray-600">{formatDate(lot.cutting_date)}</TableCell>
                      <TableCell className="text-gray-600">{lot.total_pcs_cut}</TableCell>
                      <TableCell className="text-gray-600 max-w-32 truncate">{lot.fabric_name || "-"}</TableCell>
                      <TableCell className="text-gray-600">{lot.style || "-"}</TableCell>
                      <TableCell className="text-gray-600">
                        {lot.stitching?.stitching_fabricator_name || "-"}
                      </TableCell>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-blue-600"
                          onClick={() => navigate(`/lot/${lot.id}`)}
                          data-testid={`view-lot-${lot.lot_no}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      ) : (
        // Kanban View with Drag and Drop
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {STAGES.map((stage) => (
              <KanbanColumn
                key={stage}
                stage={stage}
                lots={lots}
                onLotClick={(lotId) => navigate(`/lot/${lotId}`)}
              />
            ))}
          </div>
          <DragOverlay>
            {activeLot ? (
              <div className="bg-white rounded-lg p-3 border shadow-xl opacity-90 w-48">
                <p className="font-semibold text-gray-800 text-sm">{activeLot.lot_no}</p>
                <p className="text-xs text-gray-500 mt-1">{activeLot.style || "No style"}</p>
                <p className="text-xs text-gray-500">{activeLot.total_pcs_cut} pcs</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Kanban Help Text */}
      {viewMode === "kanban" && (
        <p className="text-center text-sm text-gray-500">
          Drag and drop lots between columns to change their production stage
        </p>
      )}
    </div>
  );
}
