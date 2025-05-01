"use client";

import { useState, useRef } from "react";
import * as mammoth from "mammoth";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface ReplacementPair {
  find: string;
  replace: string;
  found?: boolean;
}

export function WordDocumentEditor() {
  const [docxFile, setDocxFile] = useState<File | null>(null);
  const [docxContent, setDocxContent] = useState<string>("");
  const [docxArrayBuffer, setDocxArrayBuffer] = useState<ArrayBuffer | null>(
    null
  );
  const [replacements, setReplacements] = useState<ReplacementPair[]>([
    { find: "", replace: "", found: undefined },
  ]);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDocxUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setStatus("Processing document...");
      setError("");

      setDocxFile(file);
      const arrayBuffer = await file.arrayBuffer();
      setDocxArrayBuffer(arrayBuffer);

      // Convert DOCX to HTML for preview
      const result = await mammoth.extractRawText({ arrayBuffer });
      setDocxContent(result.value);

      setStatus("Document loaded successfully!");
    } catch (err) {
      setStatus("");
      setError(`Error processing document: ${err instanceof Error ? err.message : String(err)}`);
      console.error(err);
    }
  };

  const addReplacePair = () => {
    setReplacements([...replacements, { find: "", replace: "", found: undefined }]);
  };

  const updateReplacement = (index: number, field: keyof ReplacementPair, value: string) => {
    const newReplacements = [...replacements];
    newReplacements[index] = { ...newReplacements[index], [field]: value };
    setReplacements(newReplacements);
  };

  const removeReplacement = (index: number) => {
    if (replacements.length <= 1) return;
    const newReplacements = [...replacements];
    newReplacements.splice(index, 1);
    setReplacements(newReplacements);
  };

  const checkPair = (index: number) => {
    const pair = replacements[index];
    if (!pair.find.trim()) {
      const newReplacements = [...replacements];
      newReplacements[index].found = undefined;
      setReplacements(newReplacements);
      return;
    }

    const newReplacements = [...replacements];
    newReplacements[index].found = docxContent.includes(pair.find.trim());
    setReplacements(newReplacements);
  };

  const checkAllPairs = () => {
    const newReplacements = replacements.map(pair => ({
      ...pair,
      found: pair.find.trim() ? docxContent.includes(pair.find.trim()) : undefined
    }));
    setReplacements(newReplacements);
  };

  const performReplaceAll = () => {
    let modifiedContent = docxContent;
    let changesMade = false;

    const newReplacements = replacements.map(pair => {
      const findText = pair.find.trim();
      const replaceText = pair.replace.trim();
      let found = false;

      if (findText && docxContent.includes(findText)) {
        const regex = new RegExp(escapeRegExp(findText), "g");
        modifiedContent = modifiedContent.replace(regex, replaceText);
        found = true;
        changesMade = true;
      }

      return { ...pair, found };
    });

    setReplacements(newReplacements);

    if (changesMade) {
      setDocxContent(modifiedContent);
      setStatus("All replacements applied to preview!");
    } else {
      setStatus("No replacements were made (text not found)");
    }
  };

  const downloadModifiedDocx = async () => {
    if (!docxFile || !docxArrayBuffer) {
      setError("No document to download");
      return;
    }

    try {
      setStatus("Generating modified document...");
      setError("");

      if (replacements.every(pair => !pair.found)) {
        setError("No replacements have been made. Please perform replacements first.");
        return;
      }

      // Create a new JSZip instance
      const zip = new JSZip();

      // Load the original DOCX file (which is a ZIP archive)
      const docxZip = await zip.loadAsync(docxArrayBuffer);

      // Get the document.xml file which contains the main content
      const documentXml = await docxZip.file("word/document.xml")?.async("text");
      if (!documentXml) {
        throw new Error("Could not find document.xml in the Word file");
      }

      // Perform replacements in the XML content
      let modifiedXml = documentXml;
      replacements.forEach(pair => {
        if (pair.found && pair.find.trim()) {
          const regex = new RegExp(escapeRegExp(pair.find.trim()), "g");
          modifiedXml = modifiedXml.replace(regex, pair.replace.trim());
        }
      });

      // Update the document.xml in the ZIP
      docxZip.file("word/document.xml", modifiedXml);

      // Generate the modified DOCX file
      const content = await docxZip.generateAsync({ type: "blob" });

      // Save the file
      saveAs(content, `modified_${docxFile.name}`);

      setStatus("Document downloaded successfully with original formatting!");
    } catch (err) {
      setStatus("");
      setError(`Error generating document: ${err instanceof Error ? err.message : String(err)}`);
      console.error(err);
    }
  };

  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  const getFoundStatus = (found?: boolean) => {
    if (found === undefined) return "-";
    return found ? "Found" : "Not found";
  };

  const getFoundClass = (found?: boolean) => {
    if (found === undefined) return "text-gray-500";
    return found ? "text-green-500" : "text-red-500";
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* <h1 className="text-2xl font-bold">Advanced Word Document Editor</h1> */}

      <Card>
        <CardHeader>
          <CardTitle>1. Upload Word Document</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="file"
            accept=".docx"
            onChange={handleDocxUpload}
            ref={fileInputRef}
          />
          {status && <p className="mt-2 text-sm text-green-600">{status}</p>}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>

      {docxFile && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>2. Find and Replace Text</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Find Text</TableHead>
                    <TableHead>Replace With</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {replacements.map((pair, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          type="text"
                          placeholder="Text to find"
                          value={pair.find}
                          onChange={(e) =>
                            updateReplacement(index, "find", e.target.value)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          placeholder="Replacement text"
                          value={pair.replace}
                          onChange={(e) =>
                            updateReplacement(index, "replace", e.target.value)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm ${getFoundClass(pair.found)}`}>
                          {getFoundStatus(pair.found)}
                        </span>
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => checkPair(index)}
                        >
                          Check
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeReplacement(index)}
                          disabled={replacements.length <= 1}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex flex-wrap gap-2 mt-4">
                <Button onClick={addReplacePair}>Add More Replacements</Button>
                <Button variant="secondary" onClick={checkAllPairs}>
                  Check All
                </Button>
                <Button onClick={performReplaceAll}>Replace All</Button>
                <Button variant="default" onClick={downloadModifiedDocx}>
                  Download Modified Document
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Document Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md p-4 min-h-[200px] whitespace-pre-wrap">
                {docxContent}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}