import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api, API } from "@/App";
import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Factory, 
  Package, 
  Loader2, 
  FileSpreadsheet,
  Clock,
  AlertTriangle,
  Eye,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#3b82f6", "#8b5cf6", "#f97316", "#06b6d4", "#10b981", "#ef4444"];

export default function Reports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState(null);
  const [turnaround, setTurnaround] = useState(null);
  const [delayedLots, setDelayedLots] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [summaryRes, turnaroundRes, delayedRes] = await Promise.all([
        api.get("/reports/summary"),
        api.get("/reports/turnaround"),
        api.get("/reports/delayed?days_threshold=7"),
      ]);
      setData(summaryRes.data);
      setTurnaround(turnaroundRes.data);
      setDelayedLots(delayedRes.data);
    } catch (error) {
      toast.error("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  const handleExportReports = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem("fabverse_token");
      const response = await fetch(`${API}/reports/export`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fabverse_reports_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      toast.success("Reports exported successfully");
    } catch (error) {
      toast.error("Failed to export reports");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Prepare chart data
  const stageData = data?.by_stage
    ? Object.entries(data.by_stage).map(([name, value]) => ({ name, value }))
    : [];

  const statusData = data?.by_status
    ? Object.entries(data.by_status).map(([name, value]) => ({ name, value }))
    : [];

  const fabricData = data?.fabric_usage?.slice(0, 6) || [];
  const stitchingData = data?.stitching_load?.slice(0, 6) || [];
  const washingData = data?.washing_load?.slice(0, 6) || [];

  return (
    <div className="space-y-6" data-testid="reports-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">Production insights and statistics</p>
        </div>
        <Button 
          onClick={handleExportReports} 
          disabled={exporting}
          className="bg-blue-600 hover:bg-blue-700"
          data-testid="export-reports-btn"
        >
          {exporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export to Excel
            </>
          )}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Total Lots</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{data?.total_lots || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Total Pieces</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{data?.total_pcs?.toLocaleString() || 0}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Stitching Partners</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stitchingData.length}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <Users className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Washing Partners</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{washingData.length}</p>
              </div>
              <div className="p-3 bg-cyan-100 rounded-lg">
                <Factory className="w-6 h-6 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Turnaround Time Section */}
      {turnaround && (
        <Card className="bg-white border shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg font-semibold text-gray-800">Average Turnaround Times</CardTitle>
            </div>
            <CardDescription>Time taken between production stages (in days)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 uppercase">Cutting → Stitching</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{turnaround.cutting_to_stitching?.average_days || 0}</p>
                <p className="text-xs text-gray-400">days (n={turnaround.cutting_to_stitching?.sample_size || 0})</p>
              </div>
              <div className="flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-gray-300 hidden md:block" />
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 uppercase">Stitching → Bartack</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{turnaround.stitching_to_bartack?.average_days || 0}</p>
                <p className="text-xs text-gray-400">days (n={turnaround.stitching_to_bartack?.sample_size || 0})</p>
              </div>
              <div className="flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-gray-300 hidden md:block" />
              </div>
              <div className="bg-amber-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 uppercase">Bartack → Washing</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{turnaround.bartack_to_washing?.average_days || 0}</p>
                <p className="text-xs text-gray-400">days (n={turnaround.bartack_to_washing?.sample_size || 0})</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-cyan-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 uppercase">Washing → Complete</p>
                <p className="text-2xl font-bold text-cyan-600 mt-1">{turnaround.washing_to_complete?.average_days || 0}</p>
                <p className="text-xs text-gray-400">days (n={turnaround.washing_to_complete?.sample_size || 0})</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-500 uppercase">Total Turnaround (Cutting → Complete)</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{turnaround.total_turnaround?.average_days || 0}</p>
                <p className="text-xs text-gray-400">days (n={turnaround.total_turnaround?.sample_size || 0})</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delayed Lots Section */}
      {delayedLots && delayedLots.total_delayed > 0 && (
        <Card className="bg-white border shadow-sm border-red-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <CardTitle className="text-lg font-semibold text-gray-800">Delayed Lots</CardTitle>
            </div>
            <CardDescription>
              {delayedLots.total_delayed} lot(s) stuck in a stage for more than {delayedLots.threshold_days} days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-red-50">
                    <TableHead className="font-semibold text-gray-600">Lot No</TableHead>
                    <TableHead className="font-semibold text-gray-600">Style</TableHead>
                    <TableHead className="font-semibold text-gray-600">Fabric</TableHead>
                    <TableHead className="font-semibold text-gray-600">Pcs</TableHead>
                    <TableHead className="font-semibold text-gray-600">Current Stage</TableHead>
                    <TableHead className="font-semibold text-gray-600">Days Stuck</TableHead>
                    <TableHead className="font-semibold text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {delayedLots.delayed_lots.slice(0, 10).map((lot) => (
                    <TableRow key={lot.id} className="hover:bg-red-50/50">
                      <TableCell className="font-semibold text-gray-800">{lot.lot_no}</TableCell>
                      <TableCell className="text-gray-600">{lot.style || "-"}</TableCell>
                      <TableCell className="text-gray-600">{lot.fabric_name || "-"}</TableCell>
                      <TableCell className="text-gray-600">{lot.total_pcs_cut}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                          {lot.current_stage}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "font-bold",
                          lot.days_in_stage >= 14 ? "text-red-600" : "text-amber-600"
                        )}>
                          {lot.days_in_stage} days
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/lot/${lot.id}`)}
                          data-testid={`view-delayed-${lot.lot_no}`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {delayedLots.total_delayed > 10 && (
              <p className="text-center text-sm text-gray-500 mt-4">
                Showing top 10 of {delayedLots.total_delayed} delayed lots
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lots by Stage */}
        <Card className="bg-white border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Lots by Stage</CardTitle>
            <CardDescription>Distribution across production stages</CardDescription>
          </CardHeader>
          <CardContent>
            {stageData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={stageData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {stageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lots by Status */}
        <Card className="bg-white border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Lots by Status</CardTitle>
            <CardDescription>Current status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fabric Usage */}
        <Card className="bg-white border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Fabric Usage</CardTitle>
            <CardDescription>Meters/Kgs used by fabric type</CardDescription>
          </CardHeader>
          <CardContent>
            {fabricData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fabricData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="fabric" type="category" tick={{ fontSize: 12 }} width={100} />
                    <Tooltip />
                    <Bar dataKey="meters" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stitching Load */}
        <Card className="bg-white border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Stitching Load</CardTitle>
            <CardDescription>Lots per stitching fabricator</CardDescription>
          </CardHeader>
          <CardContent>
            {stitchingData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stitchingData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="fabricator" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="lots" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Washing Load */}
      {washingData.length > 0 && (
        <Card className="bg-white border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Washing/Dyeing Load</CardTitle>
            <CardDescription>Lots per washing firm</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={washingData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="firm" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="lots" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
