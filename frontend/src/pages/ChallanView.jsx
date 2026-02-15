import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/App";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function ChallanView() {
  const { challanId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [challan, setChallan] = useState(null);
  const [lot, setLot] = useState(null);
  const [firmSettings, setFirmSettings] = useState(null);
  const challanRef = useRef(null);

  useEffect(() => {
    fetchChallanData();
  }, [challanId]);

  const fetchChallanData = async () => {
    try {
      const firmRes = await api.get("/settings/firm");
      setFirmSettings(firmRes.data);

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

  const handlePrint = async () => {
    if (!challanRef.current) return;
    
    setDownloading(true);
    try {
      const element = challanRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      const fileName = `${challan.type}_Challan_${challan.challan_number}_Lot_${lot.lot_no}.pdf`;
      pdf.save(fileName);
      
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!challan || !lot || !firmSettings) {
    return null;
  }

  return (
    <div className="space-y-6" data-testid="challan-view">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-800"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Challan {challan.challan_number}</h1>
            <p className="text-gray-500 text-sm">{challan.type} Challan</p>
          </div>
        </div>
        <Button 
          onClick={handlePrint} 
          disabled={downloading}
          className="bg-blue-600 hover:bg-blue-700"
          data-testid="print-challan-btn"
        >
          {downloading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Printer className="w-4 h-4 mr-2" />
              Print Challan
            </>
          )}
        </Button>
      </div>

      {/* Challan Card */}
      <div ref={challanRef} className="bg-white rounded-xl shadow-sm border overflow-hidden max-w-3xl mx-auto">
        {/* Header Section */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-600">$</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{firmSettings.firm_name}</h2>
                <p className="text-sm text-gray-500">
                  {firmSettings.address_line1}
                  {firmSettings.address_line2 && `, ${firmSettings.address_line2}`}
                </p>
                <p className="text-sm text-gray-500">{firmSettings.city_state_pin}</p>
                {firmSettings.mobile && <p className="text-sm text-gray-500">Phone: {firmSettings.mobile}</p>}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Challan No</p>
              <p className="text-2xl font-bold text-blue-600">{challan.challan_number}</p>
              <p className="text-sm text-gray-500">Date: {formatDate(challan.issue_date)}</p>
            </div>
          </div>
        </div>

        {/* Challan Type Badge */}
        <div className="px-6 py-3 border-b">
          <span className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold uppercase tracking-wide ${
            challan.type === "Stitching" 
              ? "bg-emerald-100 text-emerald-700" 
              : "bg-amber-100 text-amber-700"
          }`}>
            {challan.type} Challan
          </span>
        </div>

        {/* Recipient Section */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
            {challan.type === "Stitching" ? "Fabricator" : "Washing/Dyeing Firm"}
          </p>
          <p className="text-xl font-bold text-gray-800">{challan.recipient_name}</p>
        </div>

        {/* Lot Details */}
        <div className="p-6 border-b">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Lot Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Lot No</p>
              <p className="text-lg font-bold text-gray-800">{lot.lot_no}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Pieces Issued</p>
              <p className="text-lg font-bold text-gray-800">{challan.pcs_issued}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Style</p>
              <p className="text-lg font-semibold text-gray-700">{lot.style || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Fabric</p>
              <p className="text-lg font-semibold text-gray-700">{lot.fabric_name || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Sizes</p>
              <p className="text-lg font-semibold text-gray-700">{lot.sizes || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Gender</p>
              <p className="text-lg font-semibold text-gray-700">{lot.gender || "-"}</p>
            </div>
          </div>
        </div>

        {/* Washing/Dyeing Instructions (for Stitching Challan) */}
        {challan.type === "Stitching" && lot.dyeing_or_washing_instructions && (
          <div className="px-6 py-4 border-b">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Washing/Dyeing Instructions</h3>
            <p className="text-gray-700 bg-gray-50 rounded-lg p-3">{lot.dyeing_or_washing_instructions}</p>
          </div>
        )}

        {/* Bartack Done By (for Washing Challan) */}
        {challan.type === "Washing" && challan.bartack_person && (
          <div className="px-6 py-4 bg-amber-50 border-b">
            <p className="text-xs text-amber-600 uppercase tracking-wide mb-1">Bartack Done By</p>
            <p className="text-lg font-bold text-amber-700">{challan.bartack_person}</p>
          </div>
        )}

        {/* Notes */}
        {challan.notes && (
          <div className="px-6 py-4 border-b">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Notes</h3>
            <p className="text-gray-700 bg-gray-50 rounded-lg p-3">{challan.notes}</p>
          </div>
        )}

        {/* Signatures */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-8">
            <div className="text-center">
              <div className="h-16 border-b-2 border-dashed border-gray-300 mb-2" />
              <p className="text-sm text-gray-500">Authorized Signature</p>
              <p className="text-xs text-gray-400">({firmSettings.firm_name})</p>
            </div>
            <div className="text-center">
              <div className="h-16 border-b-2 border-dashed border-gray-300 mb-2" />
              <p className="text-sm text-gray-500">Receiver Signature</p>
              <p className="text-xs text-gray-400">({challan.recipient_name})</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
