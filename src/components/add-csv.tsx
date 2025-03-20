'use Client'

import React, { useState, useCallback } from 'react'
import { useUser, useSession } from '@clerk/nextjs'
import { createClient } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Upload, X, FileText, AlertCircle, Check } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Papa from 'papaparse'

export default function CSVUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [pastedText, setPastedText] = useState('')
  const [csvData, setCSVData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validated, setValidated] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(false)
  const { toast } = useToast()
  const { user } = useUser()
  const { session } = useSession()

  // Define required columns and allowed values
  const requiredColumns = ['Name', 'email', 'Whatsapp number', 'assigned RM', 'Risk', 'Ekyc status', 'Plan']
  const allowedValues = {
    Risk: ['Aggressive', 'Hard', 'Conservative'],
    Plan: ['Elite', 'Premium', 'Standard']
  }

  // Create Supabase client with Clerk token
  // const createClerkSupabaseClient = () => {
  //   return createClient(
  //     process.env.NEXT_PUBLIC_SUPABASE_URL!,
  //     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  //     {
  //       global: {
  //         fetch: async (url: string, options: RequestInit = {}) => {
  //           const clerkToken = await session?.getToken({ template: 'supabase' })
  //           const headers = new Headers(options.headers || {})
  //           headers.set('Authorization', `Bearer ${clerkToken}`)
  //           return fetch(url, { ...options, headers })
  //         },
  //       },
  //     }
  //   )
  // }

  // const supabase = createClerkSupabaseClient()

  const validateCSV = (csvText: string) => {
    Papa.parse(csvText, {
      header: true,
      complete: (result) => {
        if (result.data.length === 0 || (result.data.length === 1 && Object.keys(result.data[0]).length === 0)) {
          setError('The file appears to be empty')
          setValidated(false)
          return
        }

        // Store parsed data for preview
        setCSVData(result.data)
        setPreviewVisible(true)
        
        const headers = Object.keys(result.data[0])
        
        // Check for missing columns
        const missingColumns = requiredColumns.filter(col => !headers.includes(col))
        
        if (missingColumns.length > 0) {
          setError(`Missing required columns: ${missingColumns.join(', ')}`)
          setValidated(false)
          return
        }
        
        // Validate values in Risk and Plan columns
        let invalidRows: string[] = []
        
        result.data.forEach((row: any, index: number) => {
          // Skip empty rows or rows without all required fields
          if (Object.keys(row).length === 0 || Object.values(row).every(val => val === "")) return
          
          // Check Risk values
          if (row.Risk && !allowedValues.Risk.includes(row.Risk)) {
            invalidRows.push(`Row ${index + 2}: Invalid Risk value "${row.Risk}". Must be one of: ${allowedValues.Risk.join(', ')}`)
          }
          
          // Check Plan values
          if (row.Plan && !allowedValues.Plan.includes(row.Plan)) {
            invalidRows.push(`Row ${index + 2}: Invalid Plan value "${row.Plan}". Must be one of: ${allowedValues.Plan.join(', ')}`)
          }
        })
        
        if (invalidRows.length > 0) {
          setError(`CSV has invalid values:\n${invalidRows.join('\n')}`)
          setValidated(false)
        } else {
          setError('')
          setValidated(true)
          toast({
            title: "Success",
            description: "CSV file validated successfully!",
          })
        }
      },
      error: (error) => {
        setError(`Error parsing the CSV file: ${error}`)
        setValidated(false)
      }
    })
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile?.type === 'text/csv' || droppedFile?.name.endsWith('.csv') || droppedFile?.name.endsWith('.tsv')) {
      setFile(droppedFile)
      setError('')
      setValidated(false)
      
      // Read and validate file
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        validateCSV(text)
      }
      reader.readAsText(droppedFile)
    } else {
      setError('Please upload a CSV or TSV file')
      setValidated(false)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile?.type === 'text/csv' || selectedFile?.name.endsWith('.csv') || selectedFile?.name.endsWith('.tsv')) {
      setFile(selectedFile)
      setError('')
      setValidated(false)
      
      // Read and validate file
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        validateCSV(text)
      }
      reader.readAsText(selectedFile)
    } else {
      setError('Please upload a CSV or TSV file')
      setValidated(false)
    }
  }

  const handlePasteText = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setPastedText(text)
    setError('')
    setValidated(false)
    
    if (text.trim()) {
      validateCSV(text)
    } else {
      setPreviewVisible(false)
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    setPastedText('')
    setCSVData([])
    setError('')
    setValidated(false)
    setPreviewVisible(false)
  }

  const handleImport = async () => {
    if (!validated) {
      toast({
        title: "Validation Required",
        description: "Please ensure the data is valid before importing.",
        variant: "destructive"
      })
      return
    }
    
    setLoading(true)
    try {
      // Add actual import logic here using supabase
      const { error } = await supabase
        .from('relationship_managers')
        .insert(csvData)
      
      if (error) throw error
      
      setLoading(false)
      toast({
        title: "Success",
        description: "Data imported successfully!",
      })
      
      // Reset the form
      handleRemoveFile()
    } catch (err: any) {
      setError(`Import failed: ${err.message || 'Please try again.'}`)
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Add data to public.relationship_managers</CardTitle>
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

          {previewVisible && csvData.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Preview</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {Object.keys(csvData[0] || {}).map((header) => (
                        <th key={header} className="p-2 border text-left">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.slice(0, 5).map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).map((cell: any, j) => (
                          <td key={j} className="p-2 border">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {csvData.length > 5 && (
                <p className="text-sm text-gray-500 mt-2">
                  Showing 5 of {csvData.length} rows
                </p>
              )}
            </div>
          )} */}
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
  )
}