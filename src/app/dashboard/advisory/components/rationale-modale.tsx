"use client";

import type React from "react";

import { useState, useRef } from "react";
import {
  Upload,
  Send,
  Bold,
  Italic,
  Heading,
  Quote,
  List,
  ListOrdered,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Tiptap from "./tiptap";
import Toolbar from "./toolbar";

export default function RationaleModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState("editor");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editorInstance, setEditorInstance] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      setPdfUrl(URL.createObjectURL(file));
      setActiveTab("pdf");
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

  const handleSend = () => {
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

  const showUpload = editorContent === '<p></p>' || editorContent === '';

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="text-orange-500 bg-white shadow-none hover:bg-white"
          onClick={() => setIsOpen(true)}
        >
          Open Rationale
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[80vw] max-w-none h-[80vh] max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Rationale Editor</DialogTitle>
        </DialogHeader>
        {!showPreview ? (
          <>
            <div className="border rounded-md p-4 min-h-[300px] h-[66vh]"
            onDrop={handleDrop}
            onDragOver={handleDragOver}>
              <div className="relative h-full">
                <Tiptap 
                    value={editorContent}
                    onChange={setEditorContent}
                    setEditorInstance={setEditorInstance}
                  />
                {/* <textarea
                  className="absolute w-full h-full resize-none focus:outline-none z-10 bg-transparent"
                  placeholder="Start typing"
                  value={editorContent}
                  onChange={(e) => setEditorContent(e.target.value)}
                /> */}
                {showUpload && (
                  <div className="absolute w-full h-full flex flex-col justify-center rounded-md p-8 text-center min-h-[300px] items-center">
                    {pdfFile ? (
                    <div className="space-y-2">
                      <p className="font-medium">{pdfFile.name}</p>
                      <p className="text-sm text-muted-foreground">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPdfFile(null)
                          setPdfUrl(null)
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ):(<>
                  <div className="mb-4 bg-muted rounded-full p-3">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-primary font-medium mb-1">Upload file</p>
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
                      )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-2 border-t items-center">
              <div className="flex items-center gap-2 pt-2">
              {editorInstance && <Toolbar editor={editorInstance} />}
              </div>
              <Button onClick={handleSend}>
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Preview</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(false)}
              >
                Back to Edit
              </Button>
            </div>

            {activeTab === "pdf" && pdfUrl ? (
              <div className="border rounded-md overflow-hidden h-[500px]">
                <iframe
                  src={pdfUrl}
                  className="w-full h-full"
                  title="PDF Preview"
                />
              </div>
            ) : (
              <div className="border rounded-md p-6 min-h-[500px] bg-white">
                <div className="max-w-[600px] mx-auto">
                  <div className="text-right mb-8">
                    <p>April 8, 2025</p>
                  </div>

                  <div className="mb-8">
                    <p>Dear Sir/Madam,</p>
                  </div>

                  <div className="mb-8 whitespace-pre-wrap">
                    {editorContent}
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
      </DialogContent>
    </Dialog>
  );
}
