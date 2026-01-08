import { request, API_BASE } from "./client";
import type {
  EvidenceItem,
  ProcessedEvidence,
  FileSelectResult,
} from "@/types/api";

export const evidenceService = {
  getEvidence: async (
    caseId?: string,
    page: number = 1,
    pageSize: number = 20,
    query?: string,
  ): Promise<{ items: EvidenceItem[]; total: number }> => {
    const params = new URLSearchParams();
    if (caseId) params.append("case_id", caseId);
    if (query) params.append("q", query);
    params.append("page", page.toString());
    params.append("page_size", pageSize.toString());

    return request(`/evidence?${params.toString()}`);
  },

  getEvidenceById: async (id: string): Promise<EvidenceItem> => {
    return request(`/evidence/${id}`);
  },

  uploadEvidence: async (
    caseId: string,
    file: File,
    metadata?: Record<string, string>,
  ): Promise<EvidenceItem> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("case_id", caseId);
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const response = await fetch(`${API_BASE}/evidence/upload`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Upload failed");
    }
    return response.json();
  },

  deleteEvidence: async (id: string): Promise<void> => {
    await request(`/evidence/${id}`, { method: "DELETE" });
  },

  processEvidence: async (_filePath: string): Promise<ProcessedEvidence> => {
    return { fileType: "unknown", sizeBytes: 0 };
  },

  analyzeFile: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append("file", file);

    formData.append("enable_ocr", "true");
    formData.append("enable_forensics", "true");

    const response = await fetch(`${API_BASE}/multimodal/analyze/upload`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Analysis failed");
    }
    return response.json();
  },

  analyzeEvidencePath: async (
    filePath: string,
    options: {
      ocr?: boolean;
      forensics?: boolean;
      faces?: boolean;
      objects?: boolean;
    } = {},
  ): Promise<any> => {
    const formData = new FormData();
    formData.append("file_path", filePath);

    formData.append("enable_ocr", String(options.ocr ?? true));
    formData.append("enable_forensics", String(options.forensics ?? true));
    formData.append("enable_face_detection", String(options.faces ?? false));
    formData.append(
      "enable_object_detection",
      String(options.objects ?? false),
    );

    const response = await fetch(`${API_BASE}/multimodal/analyze/path`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Analysis failed");
    }
    return response.json();
  },

  selectFile: async (): Promise<FileSelectResult> => {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.onchange = () =>
        resolve({ filePaths: input.files ? [input.files[0].name] : [] });
      input.click();
    });
  },

  getHighlights: async (evidenceId: string): Promise<any[]> => {
    return request(`/evidence/${evidenceId}/highlights`);
  },

  saveHighlight: async (evidenceId: string, highlight: any): Promise<any> => {
    const response = await fetch(
      `${API_BASE}/evidence/${evidenceId}/highlights`,
      {
        method: "POST",
        body: JSON.stringify(highlight),
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      },
    );

    if (!response.ok) throw new Error("Failed to save highlight");
    return response.json();
  },
};
