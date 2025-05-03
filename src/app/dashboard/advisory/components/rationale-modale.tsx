"use client";

import type React from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useState, useRef } from "react";
import { Document, Page } from "react-pdf";
import { pdfjs } from "react-pdf";
import { Upload, Send, Info, PanelRightOpen, PanelRightClose, MousePointer2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Tiptap from "@/components/tiptap";
import Toolbar from "@/components/toolbar";
import DetailPanel from "./detail-panel";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function RationaleModal({trade}) {
  const [isOpen, setIsOpen] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState("editor");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [editorInstance, setEditorInstance] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      setPdfUrl(URL.createObjectURL(file));
      setActiveTab("pdf");
      setShowPreview(true);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      setPdfUrl(URL.createObjectURL(file));
      setActiveTab("pdf");
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const resetModal = () => {
    setEditorContent("");
    setPdfFile(null);
    setPdfUrl(null);
    setShowPreview(false);
    setActiveTab("editor");
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetModal();
    }
  };

  const showUpload = editorContent === "";

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="text-orange-500 bg-white shadow-none hover:bg-white"
          onClick={() => setIsOpen(true)}
        >
        <MousePointer2 />Open Rationale
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[80vw] max-w-none h-[80vh] max-h-[80vh] overflow-auto py-0">
        {false &&<DialogHeader>
          <DialogTitle className="sr-only">Rationale Editor</DialogTitle>
        </DialogHeader>}
        <div className="flex flex-row-reverse gap-4 h-full">
        {isSidebarOpen && <DetailPanel trade={trade}/>}
        {!showPreview ? (
            <div className="flex-1">
              <div
                className="border rounded-md p-4 min-h-[300px] h-[70vh] mt-6"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <div className="relative h-full overflow-y-scroll">
                  <Tiptap
                    value={editorContent}
                    onChange={setEditorContent}
                    setEditorInstance={setEditorInstance}
                  />
                  {showUpload && (
                    <div className="absolute w-full h-full flex flex-col justify-center rounded-md p-8 text-center min-h-[300px] items-center">
                      <>
                        <div className="mb-4 bg-muted rounded-full p-3">
                          <Upload className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-primary font-medium mb-1">
                          Upload file
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Or, Drag and drop a PDF (max. 10 MB)
                        </p>
                        <Button
                          variant="outline"
                          className="z-10"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Select File
                        </Button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="application/pdf"
                          onChange={handleFileChange}
                        />
                      </>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-2 border-t items-center">
                <div className="flex items-center gap-2 pt-2">
                  {editorInstance && <Toolbar editor={editorInstance} />}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={handlePreview}>
                    Preview
                  </Button>
                  <Button onClick={()=>setIsSidebarOpen(!isSidebarOpen)}>
                   {isSidebarOpen ? <PanelRightClose /> : <PanelRightOpen />}
                  </Button>
                </div>
              </div>
            </div>
        ) : (
          <div className=" flex-1 space-y-4">
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowPreview(false);
                  setPdfUrl(null);
                }}
              >
                Back to Edit
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info />
                  </TooltipTrigger>
                  <TooltipContent side="top">Pdf Preview</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button
                size="sm"
                onClick={() => setActiveTab("editor")}
                className={activeTab === "editor" ? "text-orange-500" : ""}
              >
                <Send />
                Send
              </Button>
            </div>

            {activeTab === "pdf" && pdfUrl ? (
              <div className="border rounded-md overflow-auto h-[66vh] flex justify-center">
                <Document
                  file={pdfUrl}
                  className="w-full"
                  loading={
                    <div className="flex items-center justify-center h-full">
                      Loading PDF...
                    </div>
                  }
                  error={
                    <div className="flex items-center justify-center h-full">
                      Failed to load PDF
                    </div>
                  }
                >
                  <Page
                    pageNumber={1}
                    width={800}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="flex justify-center bg-[#E4E7EC]"
                  />
                </Document>
              </div>
            ) : (
              <div className="border rounded-md p-6 min-h-[67vh] bg-white">
                <div className="max-w-[600px] mx-auto">
                  <div className="text-right mb-8">
                    <p>April 8, 2025</p>
                  </div>

                  <div className="mb-8">
                    <p>Dear Sir/Madam,</p>
                  </div>

                  <div className="mb-8 whitespace-pre-wrap prose dark:prose-invert">
                    {editorContent.split("\n").map((line, i) => {
                      if (line.startsWith("### "))
                        return <h3 key={i}>{line.substring(4)}</h3>;
                      if (line.startsWith("## "))
                        return <h2 key={i}>{line.substring(3)}</h2>;
                      if (line.startsWith("# "))
                        return <h1 key={i}>{line.substring(2)}</h1>;
                      if (line.startsWith("**") && line.endsWith("**"))
                        return <strong key={i}>{line.slice(2, -2)}</strong>;
                      if (
                        line.startsWith("*") &&
                        line.endsWith("*") &&
                        !line.startsWith("* ") &&
                        !line.endsWith(" *")
                      )
                        return <em key={i}>{line.slice(1, -1)}</em>;
                      if (line.startsWith("~~") && line.endsWith("~~"))
                        return <s key={i}>{line.slice(2, -2)}</s>;
                      return <p key={i}>{line}</p>;
                    })}
                  </div>

                  <div>
                    <p>Sincerely,</p>
                    <p className="mt-6">Your Name</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
