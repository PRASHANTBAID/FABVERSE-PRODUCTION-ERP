import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/App";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { FileText, Printer, Download, Factory } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ChallanView() {
  const { challanId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [challan, setChallan] = useState(null);
  const [lot, setLot] = useState(null);
  const [firmSettings, setFirmSettings] = useState(null);

  useEffect(() => {
    fetchChallanData();
  }, [challanId]);

  const fetchChallanData = async () => {
    try {
      // Fetch firm settings
      const firmRes = await api.get("/settings/firm");
      setFirmSettings(firmRes.data);

      // Parse challanId format: "stitching-{lotId}" or "washing-{lotId}"
      // lotId is a UUID so we need to split only on first hyphen
      const firstHyphen = challanId.indexOf("-");
      const type = challanId.substring(0, firstHyphen);
      const lotId = challanId.substring(firstHyphen + 1);
      
      const lotRes = await api.get(`/lots/${lotId}`);
      setLot(lotRes.data);

      if (type === "stitching" && lotRes.data.stitching) {
        setChallan({
          type: "Stitching",
          challan_number: lotRes.data.stitching.stitching_challan_no,
          issue_date: lotRes.data.stitching.lot_issue_date_to_stitching,
          recipient_name: lotRes.data.stitching.stitching_fabricator_name,
          pcs_issued: lotRes.data.total_pcs_cut,
          notes: lotRes.data.stitching.stitching_notes,
        });
      } else if (type === "washing" && lotRes.data.washing) {
        setChallan({
          type: "Washing",
          challan_number: lotRes.data.washing.washing_challan_no,
          issue_date: lotRes.data.washing.lot_issue_date_to_washing,
          recipient_name: lotRes.data.washing.dyeing_person_firm_name,
          pcs_issued: lotRes.data.washing.pcs_issued_to_washing,
          notes: lotRes.data.washing.washing_notes,
          bartack_person: lotRes.data.bartack?.bartack_person_name || "",
        });
      } else {
        toast.error("Challan not found");
        navigate(-1);
      }
    } catch (error) {
      toast.error("Failed to fetch challan");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!challan || !lot || !firmSettings) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6" data-testid="challan-view">
      {/* Actions - Hidden on print */}
      <div className="flex justify-between items-center no-print">
        <h1 className="text-2xl font-bold uppercase tracking-wide">
          {challan.type} Challan
        </h1>
        <Button onClick={handlePrint} data-testid="print-challan-btn">
          <Printer className="w-4 h-4 mr-2" />
          Print Challan
        </Button>
      </div>

      {/* Challan Document */}
      <Card className="industrial-card print:shadow-none print:border-2 print:border-black">
        <CardContent className="p-8 print:p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              <img 
                src="https://customer-assets.emergentagent.com/job_fresh-start-208/artifacts/wh0wtqse_2.jpg" 
                alt="FABVERSE Logo" 
                className="w-20 h-20 object-contain print:w-16 print:h-16"
              />
              <div>
                <h1 className="text-3xl font-bold tracking-wider uppercase logo-text">FABVERSE</h1>
                <p className="text-sm text-muted-foreground print:text-gray-600">Garment Production</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-widest text-muted-foreground print:text-gray-600">
                {challan.type} Challan
              </p>
              <p className="text-3xl font-bold text-primary print:text-black mt-1">
                {challan.challan_number}
              </p>
            </div>
          </div>

          {/* Firm Details */}
          <div className="grid grid-cols-2 gap-8 mb-8 p-4 bg-muted/30 rounded-lg print:bg-gray-100">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2 print:text-gray-600">From</p>
              <p className="font-bold text-lg">FABVERSE</p>
              <p className="text-sm text-muted-foreground print:text-gray-600">Plot No. 2312, Lane No. 12</p>
              <p className="text-sm text-muted-foreground print:text-gray-600">Raghubar Pura No. 2</p>
              <p className="text-sm text-muted-foreground print:text-gray-600">Gandhi Nagar, Delhi - 31</p>
              <p className="text-sm font-medium print:text-gray-700">Mobile: 9999994690</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2 print:text-gray-600">To</p>
              <p className="font-bold text-lg">{challan.recipient_name}</p>
              <p className="text-sm text-muted-foreground print:text-gray-600">{challan.type} Partner</p>
            </div>
          </div>

          <Separator className="my-6 print:border-gray-300" />

          {/* Challan Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground print:text-gray-600">Date</p>
              <p className="font-bold text-lg">{formatDate(challan.issue_date)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground print:text-gray-600">Lot No</p>
              <p className="font-bold text-lg">{lot.lot_no}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground print:text-gray-600">Stage</p>
              <p className="font-bold text-lg">{challan.type}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground print:text-gray-600">Pieces</p>
              <p className="font-bold text-lg">{challan.pcs_issued}</p>
            </div>
          </div>

          {/* Product Details */}
          <div className="border rounded-lg overflow-hidden mb-8 print:border-gray-300">
            <table className="w-full">
              <thead className="bg-muted print:bg-gray-200">
                <tr>
                  <th className="text-left p-3 text-xs uppercase tracking-widest font-bold">Item</th>
                  <th className="text-left p-3 text-xs uppercase tracking-widest font-bold">Details</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t print:border-gray-300">
                  <td className="p-3 font-medium">Style</td>
                  <td className="p-3">{lot.style || "-"}</td>
                </tr>
                <tr className="border-t print:border-gray-300 bg-muted/30 print:bg-gray-50">
                  <td className="p-3 font-medium">Fabric</td>
                  <td className="p-3">{lot.fabric_name || "-"}</td>
                </tr>
                <tr className="border-t print:border-gray-300">
                  <td className="p-3 font-medium">Fabric Grade</td>
                  <td className="p-3">{lot.fabric_grade || "-"}</td>
                </tr>
                <tr className="border-t print:border-gray-300 bg-muted/30 print:bg-gray-50">
                  <td className="p-3 font-medium">Gender</td>
                  <td className="p-3">{lot.gender || "-"}</td>
                </tr>
                <tr className="border-t print:border-gray-300">
                  <td className="p-3 font-medium">Sizes</td>
                  <td className="p-3">{lot.sizes || "-"}</td>
                </tr>
                <tr className="border-t print:border-gray-300 bg-muted/30 print:bg-gray-50">
                  <td className="p-3 font-medium">Total Pieces</td>
                  <td className="p-3 font-bold text-lg">{challan.pcs_issued}</td>
                </tr>
                {challan.type === "Washing" && challan.bartack_person && (
                  <tr className="border-t print:border-gray-300">
                    <td className="p-3 font-medium">Bartack Done By</td>
                    <td className="p-3 font-bold text-primary print:text-black">{challan.bartack_person}</td>
                  </tr>
                )}
                {lot.dyeing_or_washing_instructions && (
                  <tr className="border-t print:border-gray-300 bg-muted/30 print:bg-gray-50">
                    <td className="p-3 font-medium">Washing Instructions</td>
                    <td className="p-3">{lot.dyeing_or_washing_instructions}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Notes Section */}
          {challan.notes && (
            <div className="mb-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg print:bg-yellow-50 print:border-yellow-300">
              <p className="text-xs uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-2 font-bold print:text-yellow-800">
                Important Notes
              </p>
              <p className="text-amber-900 dark:text-amber-100 print:text-yellow-900">{challan.notes}</p>
            </div>
          )}

          <Separator className="my-6 print:border-gray-300" />

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 mt-12">
            <div className="text-center">
              <div className="h-16 border-b border-dashed border-border print:border-gray-400" />
              <p className="text-sm text-muted-foreground mt-2 print:text-gray-600">Authorized Signature</p>
              <p className="text-xs text-muted-foreground print:text-gray-500">(FABVERSE)</p>
            </div>
            <div className="text-center">
              <div className="h-16 border-b border-dashed border-border print:border-gray-400" />
              <p className="text-sm text-muted-foreground mt-2 print:text-gray-600">Receiver Signature</p>
              <p className="text-xs text-muted-foreground print:text-gray-500">({challan.recipient_name})</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-border print:border-gray-300 text-center">
            <p className="text-xs text-muted-foreground print:text-gray-500">
              This is a computer generated challan from FABVERSE ERP System
            </p>
            <p className="text-xs text-muted-foreground print:text-gray-500">
              Generated on: {new Date().toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
