// src/app/components/DocumentUpload.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { db, supabase } from "@/db/db";
import { uploadToSupabaseStorage, getPublicUrl } from "@/app/actions/upload";

interface DocumentUploadProps {
  taskId: number;
  employeeId: string;
  onUploadComplete?: () => void;
  // 👇 New props for pre-populated client info
  clientName?: string;
  clientEmail?: string;
  taskTitle?: string;
}

export default function DocumentUpload({ 
  taskId, 
  employeeId, 
  onUploadComplete,
  clientName: initialClientName = "",
  clientEmail: initialClientEmail = "",
  taskTitle = ""
}: DocumentUploadProps) {
  const [clientName, setClientName] = useState(initialClientName);
  const [clientEmail, setClientEmail] = useState(initialClientEmail);
  const [documentType, setDocumentType] = useState("quotation");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [isPrePopulated, setIsPrePopulated] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const documentTypes = [
    { value: "quotation", label: "📄 Quotation" },
    { value: "proposal", label: "📊 Proposal" },
    { value: "invoice", label: "🧾 Invoice" },
    { value: "contract", label: "📝 Contract" },
    { value: "other", label: "📎 Other" },
  ];

  // Update state when props change
  useEffect(() => {
    if (initialClientName) {
      setClientName(initialClientName);
      setIsPrePopulated(true);
    }
    if (initialClientEmail) {
      setClientEmail(initialClientEmail);
    }
  }, [initialClientName, initialClientEmail]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

 // src/app/components/DocumentUpload.tsx - Updated handleUpload function

const handleUpload = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!clientName || !clientEmail || !file) {
    setMessage("Please fill in all fields and select a file");
    setStatus("error");
    return;
  }

  setUploading(true);
  setStatus("uploading");
  setMessage("");

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${employeeId}/${taskId}/${Date.now()}.${fileExt}`;
    const filePath = `documents/${fileName}`;

    console.log("📤 Uploading to storage:", filePath);
    console.log("👤 Client:", clientName, clientEmail);

    // Upload using Server Action (bypasses RLS)
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filePath', filePath);

    const result = await uploadToSupabaseStorage(formData);

    if (!result.success) {
      throw new Error(result.error);
    }

    console.log("✅ File uploaded successfully");

    // Get public URL
    const documentUrl = await getPublicUrl(filePath);
    console.log("📎 Document URL:", documentUrl);

    // Save to database - document_tasks
    const { data: docData, error: docError } = await db
      .from("document_tasks")
      .insert({
        task_id: taskId,
        employee_id: employeeId,
        client_name: clientName,
        client_email: clientEmail,
        document_type: documentType,
        document_url: documentUrl,
        file_name: file.name,
        file_size: file.size,
        status: "uploaded",
      })
      .select();

    if (docError) {
      console.error("❌ Database error:", docError);
      throw new Error(`Database error: ${docError.message}`);
    }

    // 👇 NEW: Update the task with client information so employees can see it
    const { error: taskUpdateError } = await db
      .from("tasks")
      .update({
        client_name: clientName,
        client_email: clientEmail,
        document_uploaded: true,
        document_url: documentUrl,
        document_type: documentType,
      })
      .eq("id", taskId);

    if (taskUpdateError) {
      console.error("❌ Task update error:", taskUpdateError);
      // Don't throw here - document was saved, just log the error
    } else {
      console.log("✅ Task updated with client info:", clientName, clientEmail);
    }

    console.log("✅ Document saved:", docData);

    setStatus("success");
    setMessage("✅ Document uploaded successfully!");
    setFile(null);
    setClientName("");
    setClientEmail("");
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (onUploadComplete) {
      onUploadComplete();
    }

  } catch (error: any) {
    console.error("❌ Upload error:", error);
    setStatus("error");
    setMessage(`❌ ${error.message}`);
  } finally {
    setUploading(false);
  }
};

  return (
    <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">📎 Upload Document</h3>
      
      {taskTitle && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700">
            <span className="font-semibold">📋 Task:</span> {taskTitle}
          </p>
        </div>
      )}
      
      {isPrePopulated && clientName && (
        <div className="mb-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
          <div className="flex items-center gap-2">
            <span className="text-emerald-600">👤</span>
            <span className="font-medium text-emerald-800">Client:</span>
            <span className="text-emerald-700">{clientName}</span>
            {clientEmail && (
              <>
                <span className="text-emerald-400">|</span>
                <span className="text-emerald-600">{clientEmail}</span>
              </>
            )}
          </div>
          <p className="text-xs text-emerald-600 mt-1">
            This document will be sent to this client
          </p>
        </div>
      )}
      
      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label htmlFor="client-name" className="block text-sm font-medium text-gray-700 mb-1">
            Client Name {!isPrePopulated && "*"}
          </label>
          <input
            id="client-name"
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500 ${
              isPrePopulated ? "bg-gray-50 text-gray-700" : ""
            }`}
            placeholder={isPrePopulated ? "Client name from task" : "Enter client name"}
            required={!isPrePopulated}
            readOnly={isPrePopulated}
            aria-label="Client Name"
          />
          {isPrePopulated && (
            <p className="text-xs text-gray-400 mt-1">Pre-populated from task</p>
          )}
        </div>

        <div>
          <label htmlFor="client-email" className="block text-sm font-medium text-gray-700 mb-1">
            Client Email {!isPrePopulated && "*"}
          </label>
          <input
            id="client-email"
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500 ${
              isPrePopulated ? "bg-gray-50 text-gray-700" : ""
            }`}
            placeholder={isPrePopulated ? "Client email from task" : "client@example.com"}
            required={!isPrePopulated}
            readOnly={isPrePopulated}
            aria-label="Client Email"
          />
          {isPrePopulated && (
            <p className="text-xs text-gray-400 mt-1">Pre-populated from task</p>
          )}
        </div>

        <div>
          <label htmlFor="document-type" className="block text-sm font-medium text-gray-700 mb-1">
            Document Type *
          </label>
          <select
            id="document-type"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
            aria-label="Select document type"
            required
          >
            {documentTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-1">
            Upload Document *
          </label>
          <div className="flex items-center gap-4">
            <input
              id="file-upload"
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              required
              aria-label="Choose file to upload"
            />
            {file && (
              <span className="text-xs text-gray-500">
                {file.name} ({(file.size / 1024).toFixed(0)} KB)
              </span>
            )}
          </div>
        </div>

        {message && (
          <div 
            className={`p-3 rounded-lg text-sm ${
              status === "success" ? "bg-green-50 text-green-700" : 
              status === "error" ? "bg-red-50 text-red-700" : 
              "bg-blue-50 text-blue-700"
            }`}
            role="alert"
            aria-live="polite"
          >
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-2.5 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          aria-label={uploading ? "Uploading document" : "Upload document"}
        >
          {uploading ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              Uploading...
            </>
          ) : (
            "📤 Upload Document"
          )}
        </button>
      </form>
    </div>
  );
}