import { useState, useRef } from "react";
import { api, API } from "@/App";
import { toast } from "sonner";
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function ImportExport() {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error("Please select an Excel file (.xlsx or .xls)");
      return;
    }

    setImporting(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/import/excel", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImportResult(response.data);
      toast.success(`Import completed: ${response.data.imported} new, ${response.data.updated} updated`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Import failed");
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem("fabverse_token");
      const response = await fetch(`${API}/export/excel`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "fabverse_export.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      toast.success("Export completed - File downloaded");
    } catch (error) {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-slide-in" data-testid="import-export-page">
      <div>
        <h1 className="text-4xl font-bold tracking-tight uppercase">Import / Export</h1>
        <p className="text-muted-foreground mt-1">Import from Excel or export your production data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Import Card */}
        <Card className="industrial-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-xl uppercase tracking-wide">Import Data</CardTitle>
                <CardDescription>Upload Excel file to import lots</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
              <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Upload your Excel file (.xlsx or .xls)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImport}
                className="hidden"
                id="file-upload"
                data-testid="file-upload-input"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                data-testid="select-file-btn"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Select File
                  </>
                )}
              </Button>
            </div>

            {/* Import Result */}
            {importResult && (
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="font-medium">Import Completed</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">New Records:</span>
                    <span className="ml-2 font-bold">{importResult.imported}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Updated:</span>
                    <span className="ml-2 font-bold">{importResult.updated}</span>
                  </div>
                </div>
                {importResult.errors?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-destructive flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {importResult.errors.length} errors
                    </p>
                    <ul className="text-xs text-muted-foreground mt-1 max-h-32 overflow-auto">
                      {importResult.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      {importResult.errors.length > 5 && (
                        <li>...and {importResult.errors.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Expected Format */}
            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">Expected columns:</p>
              <p>Date, Lot No, Pcs, Size, Fabric, Style, Stitching fabricator, etc.</p>
            </div>
          </CardContent>
        </Card>

        {/* Export Card */}
        <Card className="industrial-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Download className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-xl uppercase tracking-wide">Export Data</CardTitle>
                <CardDescription>Download all production data as Excel</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Export all lots and stage data to Excel
              </p>
              <Button
                onClick={handleExport}
                disabled={exporting}
                data-testid="export-btn"
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export to Excel
                  </>
                )}
              </Button>
            </div>

            {/* Export Info */}
            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">Exported data includes:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>All lot details (cutting date, fabric, style, etc.)</li>
                <li>Stitching stage data with challan numbers</li>
                <li>Bartack stage data</li>
                <li>Washing/Dyeing stage data with challan numbers</li>
                <li>Current stage and overall status</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="industrial-card">
        <CardHeader>
          <CardTitle className="text-lg uppercase tracking-wide">Import Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-bold mb-2">Column Mapping</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li><span className="font-mono text-xs bg-muted px-1 rounded">Date</span> → Cutting Date</li>
                <li><span className="font-mono text-xs bg-muted px-1 rounded">Lot No</span> → Lot Number (required)</li>
                <li><span className="font-mono text-xs bg-muted px-1 rounded">Pcs</span> → Total Pieces Cut</li>
                <li><span className="font-mono text-xs bg-muted px-1 rounded">Size</span> → Sizes</li>
                <li><span className="font-mono text-xs bg-muted px-1 rounded">Fabric</span> → Fabric Name</li>
                <li><span className="font-mono text-xs bg-muted px-1 rounded">Style</span> → Style</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-2">Notes</h4>
              <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                <li>Existing lots will be updated based on Lot No</li>
                <li>Past dates are allowed in import (for historical data)</li>
                <li>Challan numbers will be auto-generated if missing</li>
                <li>Stage data will be created if fabricator/firm names exist</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
