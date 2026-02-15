import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/App";
import { toast } from "sonner";
import { cn, formatDate } from "@/lib/utils";
import { Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export default function Challans() {
  const navigate = useNavigate();
  const [challans, setChallans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    fetchChallans();
  }, [typeFilter]);

  const fetchChallans = async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter && typeFilter !== "all") {
        params.append("challan_type", typeFilter);
      }
      const res = await api.get(`/challans?${params.toString()}`);
      setChallans(res.data);
    } catch (error) {
      toast.error("Failed to fetch challans");
    } finally {
      setLoading(false);
    }
  };

  const getTypeStyle = (type) => {
    if (type === "Stitching") {
      return "bg-emerald-100 text-emerald-700 border border-emerald-300";
    }
    return "bg-amber-100 text-amber-700 border border-amber-300";
  };

  return (
    <div className="space-y-6" data-testid="challans-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Challans</h1>
          <p className="text-gray-500 mt-1">All generated challans</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40 bg-gray-50 border-gray-200" data-testid="type-filter">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Stitching">Stitching</SelectItem>
            <SelectItem value="Washing">Washing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : challans.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <FileText className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No challans found</p>
            <p className="text-sm">Challans are generated when you create stitching or washing stages</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b">
                  <TableHead className="font-semibold text-gray-600">Challan No</TableHead>
                  <TableHead className="font-semibold text-gray-600">Type</TableHead>
                  <TableHead className="font-semibold text-gray-600">Lot No</TableHead>
                  <TableHead className="font-semibold text-gray-600">Issue Date</TableHead>
                  <TableHead className="font-semibold text-gray-600">Recipient</TableHead>
                  <TableHead className="font-semibold text-gray-600">Pcs</TableHead>
                  <TableHead className="font-semibold text-gray-600">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {challans.map((challan) => (
                  <TableRow
                    key={challan.challan_id}
                    className="hover:bg-gray-50 transition-colors"
                    data-testid={`challan-row-${challan.challan_number}`}
                  >
                    <TableCell className="font-semibold text-gray-800">{challan.challan_number}</TableCell>
                    <TableCell>
                      <span className={cn("px-3 py-1 rounded-full text-xs font-medium", getTypeStyle(challan.challan_type))}>
                        {challan.challan_type}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-600">{challan.lot?.lot_no || "-"}</TableCell>
                    <TableCell className="text-gray-600">{formatDate(challan.issue_date)}</TableCell>
                    <TableCell className="text-gray-600">{challan.recipient_name}</TableCell>
                    <TableCell className="text-gray-600">{challan.pcs_issued}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-blue-600"
                        onClick={() => navigate(`/challan/${challan.challan_type.toLowerCase()}-${challan.lot_id}`)}
                        data-testid={`view-challan-${challan.challan_number}`}
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
    </div>
  );
}
