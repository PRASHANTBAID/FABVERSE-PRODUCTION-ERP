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
        onclone: (clonedDoc) => {
          // Ensure all styles are computed in the cloned document
          const clonedElement = clonedDoc.querySelector('[data-challan-card]');
          if (clonedElement) {
            clonedElement.style.width = '700px';
          }
        }
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

  // Inline styles for reliable PDF rendering
  const badgeStyle = {
    display: 'inline-block',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    backgroundColor: challan.type === "Stitching" ? '#d1fae5' : '#fef3c7',
    color: challan.type === "Stitching" ? '#047857' : '#b45309',
  };

  const badgeText = challan.type === "Stitching" ? "STITCHING CHALLAN" : "WASHING CHALLAN";

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

      {/* Challan Card - Using inline styles for PDF compatibility */}
      <div 
        ref={challanRef} 
        data-challan-card
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          maxWidth: '700px',
          margin: '0 auto',
        }}
      >
        {/* Header Section */}
        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                backgroundColor: '#f3f4f6', 
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#4b5563' }}>$</span>
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 4px 0' }}>
                  {firmSettings.firm_name}
                </h2>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>
                  {firmSettings.address_line1}
                  {firmSettings.address_line2 && `, ${firmSettings.address_line2}`}
                </p>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>{firmSettings.city_state_pin}</p>
                {firmSettings.mobile && (
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>Phone: {firmSettings.mobile}</p>
                )}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0' }}>
                Challan No
              </p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb', margin: '0' }}>
                {challan.challan_number}
              </p>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>Date: {formatDate(challan.issue_date)}</p>
            </div>
          </div>
        </div>

        {/* Challan Type Badge - Using inline styles */}
        <div style={{ padding: '12px 24px', borderBottom: '1px solid #e5e7eb' }}>
          {challan.type === "Stitching" ? (
            <span style={{
              display: 'inline-block',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '700',
              letterSpacing: '0.1em',
              backgroundColor: '#10b981',
              color: '#ffffff',
            }}>
              STITCHING CHALLAN
            </span>
          ) : (
            <span style={{
              display: 'inline-block',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '700',
              letterSpacing: '0.1em',
              backgroundColor: '#f59e0b',
              color: '#ffffff',
            }}>
              WASHING CHALLAN
            </span>
          )}
        </div>

        {/* Recipient Section */}
        <div style={{ padding: '16px 24px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>
            {challan.type === "Stitching" ? "Fabricator" : "Washing/Dyeing Firm"}
          </p>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: '0' }}>
            {challan.recipient_name}
          </p>
        </div>

        {/* Lot Details */}
        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px 0' }}>
            Lot Details
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0' }}>Lot No</p>
              <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', margin: '0' }}>{lot.lot_no}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0' }}>Pieces Issued</p>
              <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', margin: '0' }}>{challan.pcs_issued}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0' }}>Style</p>
              <p style={{ fontSize: '18px', fontWeight: '600', color: '#374151', margin: '0' }}>{lot.style || "-"}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0' }}>Fabric</p>
              <p style={{ fontSize: '18px', fontWeight: '600', color: '#374151', margin: '0' }}>{lot.fabric_name || "-"}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0' }}>Sizes</p>
              <p style={{ fontSize: '18px', fontWeight: '600', color: '#374151', margin: '0' }}>{lot.sizes || "-"}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0' }}>Gender</p>
              <p style={{ fontSize: '18px', fontWeight: '600', color: '#374151', margin: '0' }}>{lot.gender || "-"}</p>
            </div>
          </div>
        </div>

        {/* Washing/Dyeing Instructions (for Stitching Challan) */}
        {challan.type === "Stitching" && lot.dyeing_or_washing_instructions && (
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px 0' }}>
              Washing/Dyeing Instructions
            </h3>
            <p style={{ color: '#374151', backgroundColor: '#f9fafb', borderRadius: '8px', padding: '12px', margin: '0' }}>
              {lot.dyeing_or_washing_instructions}
            </p>
          </div>
        )}

        {/* Bartack Done By (for Washing Challan) */}
        {challan.type === "Washing" && challan.bartack_person && (
          <div style={{ padding: '16px 24px', backgroundColor: '#fffbeb', borderBottom: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: '12px', color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>
              Bartack Done By
            </p>
            <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#b45309', margin: '0' }}>
              {challan.bartack_person}
            </p>
          </div>
        )}

        {/* Notes */}
        {challan.notes && (
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px 0' }}>
              Notes
            </h3>
            <p style={{ color: '#374151', backgroundColor: '#f9fafb', borderRadius: '8px', padding: '12px', margin: '0' }}>
              {challan.notes}
            </p>
          </div>
        )}

        {/* Signatures */}
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: '64px', borderBottom: '2px dashed #d1d5db', marginBottom: '8px' }} />
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>Authorized Signature</p>
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0' }}>({firmSettings.firm_name})</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: '64px', borderBottom: '2px dashed #d1d5db', marginBottom: '8px' }} />
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>Receiver Signature</p>
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0' }}>({challan.recipient_name})</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
