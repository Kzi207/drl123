/// <reference types="vite/client" />
import { User, Student, ClassGroup, GradingPeriod, DRLScore } from '../types';

// Priority: 1. Environment variable VITE_API_BASE (from .env)
//           2. Fallback to /api-proxy for development
const API_BASE = import.meta.env.VITE_API_BASE || '/api-proxy';
const API_KEY = import.meta.env.VITE_API_KEY || '';

// Log configuration on startup
if (typeof window !== 'undefined') {
  console.log('[API Config]', {
    BASE: API_BASE,
    KEY_PRESENT: !!API_KEY,
    MODE: import.meta.env.MODE
  });
}

async function apiFetch(path: string, options: any = {}) {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Add API key from environment (required for regular endpoints)
  if (API_KEY && !headers.has('x-api-key')) {
    headers.set('x-api-key', API_KEY);
  }

  const token = localStorage.getItem('drl_admin_token');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Sanitize body if present
  let body = options.body;
  
  const sanitizeData = (data: any): any => {
    if (data === undefined) return null;
    if (data === null) return null;
    if (Array.isArray(data)) return data.map(sanitizeData);
    if (typeof data === 'object' && !(data instanceof FormData) && !(data instanceof Blob)) {
      const sanitized: any = {};
      for (const key in data) {
        sanitized[key] = sanitizeData(data[key]);
      }
      return sanitized;
    }
    return data;
  };

  if (body !== undefined && body !== null) {
    if (typeof body === 'string') {
      try {
        const parsed = JSON.parse(body);
        body = JSON.stringify(sanitizeData(parsed));
      } catch (e) {
        // Not JSON, ignore
      }
    } else if (typeof body === 'object' && !(body instanceof FormData) && !(body instanceof Blob)) {
      body = JSON.stringify(sanitizeData(body));
    }
  }

  if (path.includes('delete-proof')) {
    console.log(`API Request to ${path}:`, body);
  }

  if (path.includes('upload')) {
    // IMPORTANT: Do not log raw base64 payloads (can freeze DevTools / browser)
    // Log only safe metadata.
    try {
      const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
      const fileDataLen = typeof parsedBody?.fileData === 'string' ? parsedBody.fileData.length : undefined;
      console.log(`API Request to ${path}:`, {
        fileName: parsedBody?.fileName || parsedBody?.filename || parsedBody?.file_name,
        studentId: parsedBody?.studentId || parsedBody?.tk_sv || parsedBody?.mssv || parsedBody?.ma_sv,
        category: parsedBody?.category || parsedBody?.crit_id || parsedBody?.ma_tieuchi,
        periodId: parsedBody?.periodId || parsedBody?.period_id || parsedBody?.semester,
        fileDataLength: fileDataLen,
      });
    } catch {
      console.log(`API Request to ${path}:`, {
        bodyType: typeof body,
        bodyLength: typeof body === 'string' ? body.length : undefined,
      });
    }
  }

  // Set timeout based on request type
  const isUpload = path.includes('upload');
  const timeoutMs = isUpload ? 60000 : 30000; // 60s for uploads, 30s for others
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE}${path}`, { 
      ...options, 
      headers,
      body,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        if (isJson) {
          const errorData = await response.json();
          if (errorData.snippet) {
            // This is our proxy returning a 502 with an HTML snippet
            errorMessage = `Server returned HTML instead of JSON. Status: ${errorData.status || response.status}. Snippet: ${errorData.snippet.substring(0, 200)}...`;
          } else {
            errorMessage = errorData.error || errorData.message || errorMessage;
          }
        } else {
          const text = await response.text();
          if (text.trim().startsWith('<!')) {
            errorMessage = `Server returned HTML instead of JSON. Status: ${response.status}`;
          } else {
            errorMessage = text.substring(0, 100) || errorMessage;
          }
        }
      } catch (e) {
        // Ignore parsing error
      }
      throw new Error(errorMessage);
    }

    if (isJson) {
      return response.json();
    } else {
      const text = await response.text();
      if (text.trim().startsWith('<!')) {
        throw new Error("Server returned HTML instead of JSON. Please check if the backend URL is correct and accessible.");
      }
      try {
        return JSON.parse(text);
      } catch (e) {
        return text;
      }
    }
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        const timeoutSec = isUpload ? '60' : '30';
        throw new Error(`Yêu cầu vượt quá thời gian chờ (${timeoutSec}s). Vui lòng kiểm tra kết nối mạng hoặc thử lại với tệp nhỏ hơn.`);
      }
      throw error;
    }
    throw new Error('Unknown error occurred');
  }
}

export const authService = {
  login: async (username: string, password: string): Promise<User> => {
    return apiFetch('/login', {
      method: 'POST',
      body: { username, password },
    });
  },
  changePassword: async (username: string, newPassword: string) => {
    return apiFetch('/change-password', {
      method: 'POST',
      body: { username, newPassword },
    });
  },
};

export const adminAuthService = {
  login: async (username: string, password: string) => {
    return apiFetch('/admin-api/login', {
      method: 'POST',
      body: { username, password },
    });
  },
};

export const studentService = {
  getAll: async (classId?: string): Promise<Student[]> => {
    const query = classId ? `?classId=${classId}` : '';
    return apiFetch(`/students${query}`);
  },
  upsert: async (student: Student | Student[]) => {
    return apiFetch('/students', {
      method: 'POST',
      body: student,
    });
  },
  update: async (student: Partial<Student> & { id: string }) => {
    return apiFetch('/students', {
      method: 'PUT',
      body: student,
    });
  },
  delete: async (id: string) => {
    return apiFetch('/students', {
      method: 'DELETE',
      body: { id },
    });
  },
};

export const classService = {
  getAll: async (): Promise<ClassGroup[]> => {
    return apiFetch('/classes');
  },
  create: async (classGroup: ClassGroup) => {
    return apiFetch('/classes', {
      method: 'POST',
      body: classGroup,
    });
  },
  update: async (classGroup: ClassGroup) => {
    return apiFetch('/classes', {
      method: 'PUT',
      body: classGroup,
    });
  },
  delete: async (id: string) => {
    return apiFetch('/classes', {
      method: 'DELETE',
      body: { id },
    });
  },
};

export const drlService = {
  getScores: async (): Promise<DRLScore[]> => {
    return apiFetch('/drl_scores');
  },
  saveScore: async (score: DRLScore) => {
    return apiFetch('/drl_scores', {
      method: 'POST',
      body: score,
    });
  },
  uploadProof: async (fileName: string, fileData: string, studentId: string, category: string, periodId?: string, sectionLabel?: string, sectionId?: string, mssv?: string) => {
    let hoc_ky = '';
    let nam_hoc = '';
    let hk_number = '';
    if (periodId) {
      const parts = periodId.split('-');
      hoc_ky = parts[0];
      nam_hoc = parts.slice(1).join('-');
      hk_number = hoc_ky.replace('HK', '');
    }
    
    let baseFileName = fileName;
    if (fileName.includes('.')) {
      baseFileName = fileName.split('.')[0];
    }

    const tk_sv = mssv || studentId;
    const hk = hoc_ky;
    const nh = nam_hoc;
    const query = `tk_sv=${tk_sv}&ma_sv=${tk_sv}&mssv=${tk_sv}&ma_hk=${hk}&ma_nh=${nh}&hk=${hk}&nh=${nh}&hk_number=${hk_number}&ma_tieuchi=${category}&id_tieuchi=${category}&crit_id=${category}`;
    
    return apiFetch(`/upload?${query}`, {
      method: 'POST',
      body: { 
        fileName, 
        filename: fileName,
        file_name: fileName,
        base_filename: baseFileName,
        fileData, 
        studentId, 
        student_id: studentId,
        tk_sv: tk_sv,
        mssv: tk_sv,
        ma_sv: tk_sv,
        id_sv: tk_sv,
        user_id: tk_sv,
        id_user: tk_sv,
        category,
        crit_id: category,
        id_tieuchi: category,
        ma_tieuchi: category,
        section_label: sectionLabel,
        section_id: sectionId,
        period_id: periodId,
        periodId: periodId,
        hoc_ky,
        nam_hoc,
        ma_hk: hk,
        ma_nh: nh,
        hk: hoc_ky,
        nh: nam_hoc,
        hk_number,
        semester: periodId,
        action: 'upload'
      },
    });
  },
  deleteProof: async (fileName: string, studentId: string, category: string, periodId?: string, path?: string, scoreId?: string, sectionLabel?: string, sectionId?: string, mssv?: string) => {
    // Simplified delete proof - use main endpoints with fallback
    const tk_sv = mssv || studentId;
    
    const deleteBody = { 
      tk_sv,
      studentId,
      student_id: studentId,
      mssv: tk_sv,
      ma_sv: tk_sv,
      category,
      muc_danh_gia: category,
      crit_id: category,
      fileName,
      path,
      scoreId
    };

    // Primary endpoints to try (in order of preference)
    const endpoints = [
      { method: 'DELETE', path: '/delete-proof' },
      { method: 'DELETE', path: '/api/delete-proof' },
      { method: 'POST', path: '/api/delete-proof' },
    ];

    let lastError: any = null;

    for (const endpoint of endpoints) {
      try {
        console.log(`[deleteProof] Trying ${endpoint.method} ${endpoint.path}`);
        const response = await apiFetch(endpoint.path, {
          method: endpoint.method,
          body: deleteBody,
        });
        
        if (response && response.success !== false) {
          console.log(`[deleteProof] Success with ${endpoint.method} ${endpoint.path}`);
          return response;
        }
      } catch (e: any) {
        lastError = e;
        console.warn(`[deleteProof] Failed ${endpoint.method} ${endpoint.path}:`, e.message);
        // Continue to next endpoint
      }
    }

    // If all fail, throw last error
    throw lastError || new Error('Failed to delete proof - all endpoint attempts failed');
  },
  getProofs: async (studentId: string): Promise<{ success: boolean; proofs: Record<string, string[]> }> => {
    return apiFetch(`/api/get-proofs?tk_sv=${studentId}`);
  },
  getPeriods: async (): Promise<GradingPeriod[]> => {
    return apiFetch('/grading_periods');
  },
  savePeriod: async (period: GradingPeriod) => {
    return apiFetch('/grading_periods', {
      method: 'POST',
      body: period,
    });
  },
  deletePeriod: async (id: string) => {
    return apiFetch('/grading_periods', {
      method: 'DELETE',
      body: { id },
    });
  },
};

export const adminService = {
  getStats: async (token: string) => {
    return apiFetch('/admin-api/stats', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  getProofUploads: async (token: string, params: { classId?: string; studentId?: string; category?: string }) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/admin-api/proof-uploads?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  deleteAllProofs: async (params?: { classId?: string; periodId?: string }) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiFetch(`/admin-api/proofs/delete-all${query}`, {
      method: 'DELETE',
    });
  },
};
