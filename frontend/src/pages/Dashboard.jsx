import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/App";
import { toast } from "sonner";
import { cn, formatDate, getStatusClass, getStageClass } from "@/lib/utils";
import { 
  Scissors, 
  Search, 
  Plus, 
  Filter, 
  ChevronRight,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Layers,
  FileSpreadsheet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <Card className="industrial-card">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {trend && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> {trend}
            </p>
          )}
        </div>
        <div className={cn("p-3 rounded-lg", color)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const [lots, setLots] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

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

  const handleRowClick = (lotId) => {
    navigate(`/lot/${lotId}`);
  };

  return (
    <div className="space-y-6 animate-slide-in" data-testid="dashboard">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight uppercase">Production Pipeline</h1>
          <p className="text-muted-foreground mt-1">Track all lots from cutting to completion</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/import-export")} data-testid="import-export-btn">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Import/Export
          </Button>
          <Button onClick={() => navigate("/cutting/new")} data-testid="new-lot-btn">
            <Plus className="w-4 h-4 mr-2" />
            New Lot
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Lots"
            value={stats.total_lots}
            icon={Package}
            color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={Clock}
            color="bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400"
          />
          <StatCard
            title="In Progress"
            value={stats.in_progress}
            icon={Layers}
            color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
          />
          <StatCard
            title="Completed"
            value={stats.completed}
            icon={CheckCircle2}
            color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
          />
        </div>
      )}

      {/* Pipeline Visual */}
      <Card className="industrial-card overflow-hidden">
        <div className="h-2 pipeline-line" />
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Cutting</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span>Stitching</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span>Bartack</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-500" />
              <span>Washing</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Completed</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="industrial-card">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by lot no, fabric, style..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="search-input"
              />
            </div>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="stage-filter">
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
              <SelectTrigger className="w-full md:w-48" data-testid="status-filter">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Delayed">Delayed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lots Table */}
      <Card className="industrial-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold uppercase tracking-wide">
            Production Lots ({lots.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : lots.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Scissors className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No lots found</p>
              <p className="text-sm">Create a new lot to get started</p>
              <Button className="mt-4" onClick={() => navigate("/cutting/new")}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Lot
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold uppercase text-xs tracking-wider">Date</TableHead>
                    <TableHead className="font-bold uppercase text-xs tracking-wider">Lot No</TableHead>
                    <TableHead className="font-bold uppercase text-xs tracking-wider">Pcs</TableHead>
                    <TableHead className="font-bold uppercase text-xs tracking-wider">Fabric</TableHead>
                    <TableHead className="font-bold uppercase text-xs tracking-wider">Style</TableHead>
                    <TableHead className="font-bold uppercase text-xs tracking-wider">Stitching</TableHead>
                    <TableHead className="font-bold uppercase text-xs tracking-wider">Bartack</TableHead>
                    <TableHead className="font-bold uppercase text-xs tracking-wider">Washing</TableHead>
                    <TableHead className="font-bold uppercase text-xs tracking-wider">Stage</TableHead>
                    <TableHead className="font-bold uppercase text-xs tracking-wider">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lots.map((lot, idx) => (
                    <TableRow
                      key={lot.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleRowClick(lot.id)}
                      data-testid={`lot-row-${lot.lot_no}`}
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      <TableCell className="font-mono text-sm">{formatDate(lot.cutting_date)}</TableCell>
                      <TableCell className="font-bold">{lot.lot_no}</TableCell>
                      <TableCell>{lot.total_pcs_cut}</TableCell>
                      <TableCell className="max-w-32 truncate">{lot.fabric_name}</TableCell>
                      <TableCell>{lot.style}</TableCell>
                      <TableCell className="text-xs">
                        {lot.stitching ? (
                          <div>
                            <div className="font-medium">{lot.stitching.stitching_fabricator_name}</div>
                            <div className="text-muted-foreground">{lot.stitching.stitching_challan_no}</div>
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {lot.bartack ? lot.bartack.bartack_person_name : "-"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {lot.washing ? (
                          <div>
                            <div className="font-medium">{lot.washing.dyeing_person_firm_name}</div>
                            <div className="text-muted-foreground">{lot.washing.washing_challan_no}</div>
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-xs", getStageClass(lot.current_stage))}>
                          {lot.current_stage}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-xs border", getStatusClass(lot.overall_status))}>
                          {lot.overall_status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
