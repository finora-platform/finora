'use client'

import React, { useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Upload, X, FileText, AlertCircle, Check } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser, useSession } from '@clerk/nextjs'
import { createClerkSupabaseClient } from '@/utils/supabaseClient';

import Papa from 'papaparse';

export default function CSVUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [csvData, setCSVData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validated, setValidated] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const { toast } = useToast();


  // Define required columns and allowed values
  const requiredColumns = ['name', 'email', 'whatsapp', 'assigned_rn', 'risk', 'ekyc_status', 'plan'];
  const allowedValues = {
    Risk: ['Aggressive', 'Hard', 'Conservative'],
    Plan: ['Elite', 'Premium', 'Standard']
  };


  const { user } = useUser()
  // The `useSession()` hook will be used to get the Clerk `session` object
  const { session } = useSession()

  // Create a custom supabase client that injects the Clerk Supabase token into the request headers
  
  // Validate CSV data
  const validateCSV = (csvText: string) => {
    Papa.parse(csvText, {
      header: true,
      complete: (result) => {
        if (result.data.length === 0 || (result.data.length === 1 && Object.keys(result.data[0]).length === 0)) {
          setError('The file appears to be empty');
          setValidated(false);
          return;
        }
        // Store parsed data for preview
        setCSVData(result.data);
        setPreviewVisible(true);

        const headers = Object.keys(result.data[0]);

        // Check for missing columns
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));
        if (missingColumns.length > 0) {
          setError(`Missing required columns: ${missingColumns.join(', ')}`);
          setValidated(false);
          return;
        }

        // Validate values in Risk and Plan columns
        let invalidRows: string[] = [];
        result.data.forEach((row: any, index: number) => {
          // Skip empty rows or rows without all required fields
          if (Object.keys(row).length === 0 || Object.values(row).every(val => val === "")) return;

          // Check Risk values
          if (row.Risk && !allowedValues.Risk.includes(row.Risk)) {
            invalidRows.push(`Row ${index + 2}: Invalid Risk value "${row.Risk}". Must be one of: ${allowedValues.Risk.join(', ')}`);
          }

          // Check Plan values
          if (row.Plan && !allowedValues.Plan.includes(row.Plan)) {
            invalidRows.push(`Row ${index + 2}: Invalid Plan value "${row.Plan}". Must be one of: ${allowedValues.Plan.join(', ')}`);
          }
        });

        if (invalidRows.length > 0) {
          setError(`CSV has invalid values:\n${invalidRows.join('\n')}`);
          setValidated(false);
        } else {
          setError('');
          setValidated(true);
          toast({
            title: "Success",
            description: "CSV file validated successfully!",
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
    if (droppedFile?.type === 'text/csv' || droppedFile?.name.endsWith('.csv') || droppedFile?.name.endsWith('.tsv')) {
      setFile(droppedFile);
      setError('');
      setValidated(false);

      // Read and validate file
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        validateCSV(text);
      };
      reader.readAsText(droppedFile);
    } else {
      setError('Please upload a CSV or TSV file');
      setValidated(false);
    }
  }, []);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile?.type === 'text/csv' || selectedFile?.name.endsWith('.csv') || selectedFile?.name.endsWith('.tsv')) {
      setFile(selectedFile);
      setError('');
      setValidated(false);

      // Read and validate file
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        validateCSV(text);
      };
      reader.readAsText(selectedFile);
    } else {
      setError('Please upload a CSV or TSV file');
      setValidated(false);
    }
  };

  // Handle pasted text
  const handlePasteText = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setPastedText(text);
    setError('');
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
    setPastedText('');
    setCSVData([]);
    setError('');
    setValidated(false);
    setPreviewVisible(false);
  };

  // Handle data import
  // Handle data import - UPDATED VERSION
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
    const client = await createClerkSupabaseClient(session);
    
    // Prepare data with consistent formatting
    const formattedData = csvData.map(row => ({
      name: row.name || '',
      email: row.email?.toLowerCase() || '', // normalize email
      whatsapp: row.whatsapp || '',
      assigned_rn: row.assigned_rn || '',
      risk: (row.risk || '').toLowerCase(), // normalize risk
      ekyc_status: (row.ekyc_status || 'pending').toLowerCase(), // default pending
      plan: (row.plan || 'standard').toLowerCase(), // default standard
      created_at: new Date().toISOString(), // current timestamp
      user_id: user.id, // add current user ID
      role: row.role || '', // optional field
    }));

    // Insert in batches
    const batchSize = 100;
    for (let i = 0; i < formattedData.length; i += batchSize) {
      const batch = formattedData.slice(i, i + batchSize);
      const { error } = await client
        .from('client3')
        .insert(batch)
        .select(); // Return inserted rows for error checking

      if (error) throw error;
    }

    toast({
      title: "Success",
      description: `${formattedData.length} records imported successfully!`,
    });
    handleRemoveFile();
  } catch (err: any) {
    const errorMsg = err.message || 'Import failed. Please check for duplicate emails.';
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
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Add data to public.client3</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
        <CardFooter className="justify-between">
          <Button variant="outline" onClick={handleRemoveFile}>Cancel</Button>
          <Button
            disabled={(!file && !pastedText) || loading || !validated}
            onClick={handleImport}
          >
            {loading ? 'Importing...' : 'Import data'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}