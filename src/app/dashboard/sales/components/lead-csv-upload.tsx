"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText, AlertCircle, Check } from "lucide-react";
import { useToast } from "@/app/dashboard/sales/hooks/use-toast";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Papa from "papaparse";
import { useUser, useSession } from "@clerk/nextjs";
import { createClerkSupabaseClient } from "@/utils/supabaseClient";

// Define the required and optional columns for leads
const requiredColumns = ["name"];
const allowedColumns = [
  "name", "email", "phone", "whatsapp", "source", "disposition", "plan", 
  "is_elite", "rating", "relationship_manager", "notes", "metadata"
];

// Define valid values for certain fields
const validSources = ["Website", "Google Ads", "Meta Ads", "Email Campaign"];
const validDispositions = ["hot", "warm", "cold"];
const validPlans = ["Free", "Basic", "Premium", "Enterprise"];

interface LeadCSVUploadProps {
  // If called directly, it may have these props, but we'll make them optional
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function LeadCSVUpload({ open, onOpenChange }: LeadCSVUploadProps = {}) {
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [csvData, setCSVData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validated, setValidated] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [importStats, setImportStats] = useState<{success: number, failed: number}>({success: 0, failed: 0});
  const { toast } = useToast();
  const { user } = useUser();
  const { session } = useSession();

  // Validate CSV data
  const validateCSV = (csvText: string) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.data.length === 0 || (result.data.length === 1 && Object.keys(result.data[0]).length === 0)) {
          setError("The file appears to be empty");
          setValidated(false);
          return;
        }
        setCSVData(result.data);
        setPreviewVisible(true);

        const headers = Object.keys(result.data[0]);
        // Check for missing required columns
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));
        if (missingColumns.length > 0) {
          setError(`Missing required column: ${missingColumns.join(", ")}`);
          setValidated(false);
          return;
        }

        // Check for unknown columns
        const unknownColumns = headers.filter(col => !allowedColumns.includes(col));
        if (unknownColumns.length > 0) {
          setError(`Unknown columns detected: ${unknownColumns.join(", ")}`);
          setValidated(false);
          return;
        }

        // Validate each row
        let invalidRows: string[] = [];
        result.data.forEach((row: any, index: number) => {
          if (!row.name || row.name.trim() === "") {
            invalidRows.push(`Row ${index + 2}: Missing required field "name"`);
          }
          
          // Validate rating is between 1-5
          if (row.rating && (isNaN(Number(row.rating)) || Number(row.rating) < 1 || Number(row.rating) > 5)) {
            invalidRows.push(`Row ${index + 2}: "rating" must be a number between 1 and 5`);
          }
          
          // Validate is_elite is boolean
          if (row.is_elite && !["TRUE", "FALSE", "true", "false", "1", "0"].includes(row.is_elite.toString())) {
            invalidRows.push(`Row ${index + 2}: "is_elite" must be TRUE or FALSE`);
          }
          
          // Validate source is valid
          if (row.source && !validSources.includes(row.source)) {
            invalidRows.push(`Row ${index + 2}: "source" must be one of: ${validSources.join(", ")}`);
          }
          
          // Validate disposition is valid
          if (row.disposition && !validDispositions.includes(row.disposition.toLowerCase())) {
            invalidRows.push(`Row ${index + 2}: "disposition" must be one of: ${validDispositions.join(", ")}`);
          }
          
          // Validate plan is valid
          if (row.plan && !validPlans.includes(row.plan)) {
            invalidRows.push(`Row ${index + 2}: "plan" must be one of: ${validPlans.join(", ")}`);
          }
        });

        if (invalidRows.length > 0) {
          setError(`CSV has invalid values:\n${invalidRows.join("\n")}`);
          setValidated(false);
        } else {
          setError("");
          setValidated(true);
          toast({
            title: "Success",
            description: `CSV file validated successfully! ${result.data.length} leads ready to import.`,
          });
        }
      },
      error: (error) => {
        setError(`Error parsing the CSV file: ${error}`);
        setValidated(false);
      }
    });
  };

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === "text/csv" || droppedFile?.name.endsWith(".csv") || droppedFile?.name.endsWith(".tsv")) {
      setFile(droppedFile);
      setError("");
      setValidated(false);

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        validateCSV(text);
      };
      reader.readAsText(droppedFile);
    } else {
      setError("Please upload a CSV or TSV file");
      setValidated(false);
    }
  }, []);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile?.type === "text/csv" || selectedFile?.name.endsWith(".csv") || selectedFile?.name.endsWith(".tsv")) {
      setFile(selectedFile);
      setError("");
      setValidated(false);

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        validateCSV(text);
      };
      reader.readAsText(selectedFile);
    } else {
      setError("Please upload a CSV or TSV file");
      setValidated(false);
    }
  };

  // Handle pasted text
  const handlePasteText = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setPastedText(text);
    setError("");
    setValidated(false);

    if (text.trim()) {
      validateCSV(text);
    } else {
      setPreviewVisible(false);
    }
  };

  // Remove file and reset state
  const handleRemoveFile = () => {
    setFile(null);
    setPastedText("");
    setCSVData([]);
    setError("");
    setValidated(false);
    setPreviewVisible(false);
    
    // Close dialog if used as a standalone component
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  // Handle data import
  const handleImport = async () => {
    if (!validated || !user) {
      toast({
        title: "Validation Required",
        description: "Please ensure the data is valid and you're logged in before importing.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const client = await createClerkSupabaseClient(session as any);

      if (!client) {
        throw new Error("Could not create Supabase client.");
      }

      // Prepare data for insertion
      const formattedData = csvData.map((row) => {
        // Convert string fields to null if empty
        const metadataObj: Record<string, any> = {};
        
        // Add any extra columns to metadata
        Object.keys(row).forEach(key => {
          if (!allowedColumns.includes(key) && row[key]) {
            metadataObj[key] = row[key];
          }
        });
        
        return {
          name: row.name.trim(),
          email: row.email?.trim() || null,
          phone: row.phone?.trim() || null,
          whatsapp: row.whatsapp?.trim() || null,
          source: row.source?.trim() || null,
          disposition: row.disposition?.toLowerCase() || null,
          stage: "lead", // Always set initial stage to 'lead'
          relationship_manager: row.relationship_manager?.trim() || null,
          plan: row.plan?.trim() || null,
          is_elite: typeof row.is_elite === "string"
            ? ["TRUE", "true", "1"].includes(row.is_elite)
            : !!row.is_elite,
          rating: row.rating ? Number(row.rating) : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: Object.keys(metadataObj).length > 0 ? metadataObj : row.metadata || null,
          advisor_id: session.user.id,
        };
      });

      // Insert in batches
      const batchSize = 100;
      let successCount = 0;
      let errorCount = 0;
      let errorRows: string[] = [];

      for (let i = 0; i < formattedData.length; i += batchSize) {
        const batch = formattedData.slice(i, i + batchSize);
        const { error } = await client
          .from("leads")
          .insert(batch);

        if (error) {
          errorCount += batch.length;
          errorRows.push(`Batch ${i / batchSize + 1}: ${error.message}`);
        } else {
          successCount += batch.length;
        }
      }

      // After import is complete, also add entries to lead_status_history for audit
      if (successCount > 0) {
        // Get the IDs of the newly inserted leads
        const { data: newLeads } = await client
          .from("leads")
          .select("id, name, relationship_manager")
          .order('created_at', { ascending: false })
          .limit(successCount);
          
        if (newLeads && newLeads.length > 0) {
          // Create history records for the new leads
          const historyRecords = newLeads.map(lead => ({
            lead_id: lead.id,
            old_status: null, // null indicates initial creation
            new_status: "lead",
            changed_by: lead.relationship_manager || user.fullName || user.id,
            changed_at: new Date().toISOString(),
            notes: "Created via CSV import"
          }));
          
          // Insert status history records
          await client.from("lead_status_history").insert(historyRecords);
        }
      }

      setImportStats({
        success: successCount,
        failed: errorCount
      });

      toast({
        title: "Import Complete",
        description: `${successCount} leads imported successfully.${errorCount > 0 ? ` ${errorCount} failed.` : ""}`,
        variant: errorCount > 0 ? "destructive" : "default"
      });

      if (errorRows.length > 0) {
        setError(errorRows.join("\n"));
      } else {
        handleRemoveFile();
      }
      
      // Close dialog if used as a standalone component and import was successful
      if (onOpenChange && errorRows.length === 0) {
        onOpenChange(false);
      }
    } catch (err: any) {
      const errorMsg = err.message || "Import failed. Please check for duplicate emails or phone numbers.";
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Import Leads from CSV</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 text-sm text-gray-600">
            <p className="mb-2">CSV should include these columns:</p>
            <ul className="list-disc pl-5 mb-4">
              <li><strong>Required:</strong> name</li>
              <li><strong>Optional:</strong> email, phone, whatsapp, source, disposition, plan, is_elite, rating, relationship_manager, notes</li>
            </ul>
            <p className="mb-2">Example format:</p>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
              name,email,phone,source,disposition,plan<br/>
              John Smith,john@example.com,9876543210,Website,hot,Premium<br/>
              Jane Doe,jane@example.com,8765432109,Google Ads,warm,Basic
            </pre>
          </div>

          <Tabs defaultValue="upload">
            <TabsList className="mb-4">
              <TabsTrigger value="upload">Upload CSV</TabsTrigger>
              <TabsTrigger value="paste">Paste text</TabsTrigger>
            </TabsList>

            <TabsContent value="upload">
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                {!file ? (
                  <div>
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-sm text-gray-600 mb-2">
                      Drag and drop, or <button className="text-blue-500 hover:text-blue-600" onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}>browse</button> your files
                    </p>
                    <input
                      type="file"
                      accept=".csv,.tsv"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-5 w-5 text-gray-500" />
                    <span className="text-sm text-gray-600">{file.name}</span>
                    {validated && <Check className="h-5 w-5 text-green-500" />}
                    <button
                      onClick={handleRemoveFile}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="paste">
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Copy a table from a spreadsheet program and paste it below. The first row should be the headers.
                </p>
                <textarea
                  className="w-full h-64 p-2 border rounded-lg resize-none"
                  placeholder="Paste your data here..."
                  value={pastedText}
                  onChange={handlePasteText}
                />
                {validated && pastedText && (
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="h-4 w-4" />
                    <span className="text-sm">Data validated successfully</span>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
            </Alert>
          )}
          
          {importStats.success > 0 && (
            <Alert className="mt-4">
              <Check className="h-4 w-4" />
              <AlertDescription>
                Successfully imported {importStats.success} leads.
                {importStats.failed > 0 && ` ${importStats.failed} leads failed to import.`}
              </AlertDescription>
            </Alert>
          )}
          
          {previewVisible && csvData.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-2">Preview (first 3 rows):</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(csvData[0]).map((header) => (
                        <th key={header} className="p-2 text-left border">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.slice(0, 3).map((row, i) => (
                      <tr key={i} className="border-b">
                        {Object.values(row).map((cell: any, j) => (
                          <td key={j} className="p-2 border">{String(cell || '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {csvData.length > 3 && (
                  <p className="text-xs text-gray-500 mt-1">...and {csvData.length - 3} more rows</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-between">
          <Button variant="outline" onClick={handleRemoveFile}>Cancel</Button>
          <Button
            disabled={(!file && !pastedText) || loading || !validated}
            onClick={handleImport}
          >
            {loading ? "Importing..." : `Import ${csvData.length} leads`}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}