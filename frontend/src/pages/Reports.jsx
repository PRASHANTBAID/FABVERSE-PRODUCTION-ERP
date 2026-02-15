import { useState, useEffect } from "react";
import { api } from "@/App";
import { toast } from "sonner";
import { BarChart3, PieChart, TrendingUp, Users, Factory, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await api.get("/reports/summary");
      setData(response.data);
    } catch (error) {
      toast.error("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
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
    <div className="space-y-6 animate-slide-in" data-testid="reports-page">
      <div>
        <h1 className="text-4xl font-bold tracking-tight uppercase">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">Production insights and statistics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="industrial-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Total Lots</p>
                <p className="text-4xl font-bold mt-2">{data?.total_lots || 0}</p>
              </div>
              <Package className="w-10 h-10 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="industrial-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Total Pieces</p>
                <p className="text-4xl font-bold mt-2">{data?.total_pcs?.toLocaleString() || 0}</p>
              </div>
              <BarChart3 className="w-10 h-10 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="industrial-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Stitching Partners</p>
                <p className="text-4xl font-bold mt-2">{stitchingData.length}</p>
              </div>
              <Users className="w-10 h-10 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="industrial-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Washing Partners</p>
                <p className="text-4xl font-bold mt-2">{washingData.length}</p>
              </div>
              <Factory className="w-10 h-10 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lots by Stage */}
        <Card className="industrial-card">
          <CardHeader>
            <CardTitle className="text-lg uppercase tracking-wide">Lots by Stage</CardTitle>
            <CardDescription>Distribution of lots across production stages</CardDescription>
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
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lots by Status */}
        <Card className="industrial-card">
          <CardHeader>
            <CardTitle className="text-lg uppercase tracking-wide">Lots by Status</CardTitle>
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
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fabric Usage */}
        <Card className="industrial-card">
          <CardHeader>
            <CardTitle className="text-lg uppercase tracking-wide">Fabric Usage</CardTitle>
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
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Outsourcing Load */}
        <Card className="industrial-card">
          <CardHeader>
            <CardTitle className="text-lg uppercase tracking-wide">Stitching Load</CardTitle>
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
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Washing Load */}
      {washingData.length > 0 && (
        <Card className="industrial-card">
          <CardHeader>
            <CardTitle className="text-lg uppercase tracking-wide">Washing/Dyeing Load</CardTitle>
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
