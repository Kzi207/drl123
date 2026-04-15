/**
 * API Service - Handles all API requests with JWT token support
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3004';
const API_KEY = import.meta.env.VITE_API_KEY || 'kzi207-khoaktck-cncd2511';

/**
 * Normalize a DRL score record to always use camelCase keys.
 * Handles both old snake_case responses and new camelCase responses,
 * so the frontend works regardless of whether the backend has been restarted.
 */
function normalizeDRLScore(s: any): any {
  if (!s) return s;
  // If already camelCase (has studentId), return as-is
  const studentId = s.studentId ?? s.student_id ?? '';
  const selfScore = s.selfScore ?? s.self_score ?? 0;
  const classScore = s.classScore ?? s.class_score ?? 0;
  const finalScore = s.finalScore ?? s.final_score ?? 0;
  let details = s.details;
  // Normalize details: unwrap double-stringify if needed
  for (let i = 0; i < 3; i++) {
    if (typeof details === 'string') {
      try { details = JSON.parse(details); } catch { break; }
    } else { break; }
  }
  return {
    id: s.id,
    studentId,
    semester: s.semester,
    selfScore: Number(selfScore) || 0,
    classScore: Number(classScore) || 0,
    finalScore: Number(finalScore) || 0,
    details,
    status: s.status,
    completedAt: s.completedAt ?? s.completed_at ?? null,
    returnedAt: s.returnedAt ?? s.returned_at ?? null,
    rejectionFeedback: s.rejectionFeedback ?? s.rejection_feedback ?? null,
    rejectedAt: s.rejectedAt ?? s.rejected_at ?? null,
    submissionAttempt: Number(s.submissionAttempt ?? s.submission_attempt) || 1,
    updatedAt: s.updatedAt ?? s.updated_at ?? null,
  };
}


/**
 * Fetch wrapper with JWT token and API key fallback
 */
export async function apiFetch(endpoint: string, options?: RequestInit): Promise<Response> {
  const url = `${API_BASE}${endpoint}`;
  
  const headers = new Headers(options?.headers || {});
  
  // Pick token by endpoint scope to avoid sending student token to admin APIs
  const isAdminEndpoint = endpoint.startsWith('/admin-api');
  const adminToken = localStorage.getItem('drl_admin_token');
  const studentToken = localStorage.getItem('drl_token');
  let token = isAdminEndpoint
    ? (adminToken || studentToken)
    : (studentToken || adminToken);
  
  if (token && token.trim() && token.startsWith('eyJ')) {
    // If we have a valid JWT token (starts with eyJ which is the base64 for {), use it
    headers.set('Authorization', `Bearer ${token}`);
  } else {
    // Always fall back to API key - REQUIRED for authentication
    if (API_KEY && API_KEY.trim()) {
      headers.set('x-api-key', API_KEY);
    }
  }
  
  // Ensure content type is set for JSON
  if (!headers.has('Content-Type') && options?.body) {
    headers.set('Content-Type', 'application/json');
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  return response;
}

/**
 * API Service with common HTTP methods
 */
export const apiService = {
  /**
   * GET request
   */
  async get<T = any>(endpoint: string): Promise<T> {
    const response = await apiFetch(endpoint);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  },

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    const response = await apiFetch(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      let errorMsg = `API Error: ${response.status} ${response.statusText}`;
      let errorCode: string | undefined;
      try {
        const errorBody = await response.json();
        if (errorBody?.error) errorMsg = errorBody.error;
        if (errorBody?.code) errorCode = errorBody.code;
      } catch {}
      const err: any = new Error(errorMsg);
      if (errorCode) err.code = errorCode;
      throw err;
    }
    return response.json();
  },

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    const response = await apiFetch(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      let errorMsg = `API Error: ${response.status} ${response.statusText}`;
      let errorCode: string | undefined;
      try {
        const errorBody = await response.json();
        if (errorBody?.error) errorMsg = errorBody.error;
        if (errorBody?.code) errorCode = errorBody.code;
      } catch {}
      const err: any = new Error(errorMsg);
      if (errorCode) err.code = errorCode;
      throw err;
    }
    return response.json();
  },

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string): Promise<T> {
    const response = await apiFetch(endpoint, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * PATCH request
   */
  async patch<T = any>(endpoint: string, data?: any): Promise<T> {
    const response = await apiFetch(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  },
};

/**
 * Authentication Service for Students
 */
export const authService = {
  /**
   * Login with student username and password
   */
  async login(username: string, password: string) {
    const response = await apiFetch('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    if (!response.ok) {
      throw new Error('Đăng nhập thất bại');
    }
    
    const data = await response.json();
    
    // Store JWT token if provided
    if (data.token) {
      localStorage.setItem('drl_token', data.token);
    }
    
    return {
      username: data.username || username,
      role: data.role || 'student',
      token: data.token,
      ...data
    };
  },

  /**
   * Get current user profile
   */
  async getProfile() {
    return apiService.get('/profile');
  },

  /**
   * Change student password
   */
  async changePassword(oldPassword: string, newPassword: string) {
    return apiService.post('/change-password', {
      oldPassword,
      newPassword,
    });
  },

  /**
   * Logout
   */
  logout() {
    localStorage.removeItem('drl_token');
    localStorage.removeItem('drl_admin_token');
  },
};

/**
 * Admin Authentication Service
 */
export const adminAuthService = {
  /**
   * Admin login
   */
  async login(username: string, password: string) {
    const response = await apiFetch('/admin-api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error || 'Đăng nhập thất bại',
      };
    }
    
    const data = await response.json();
    
    // Store JWT token if provided
    if (data.token) {
      // Ensure admin context does not accidentally use stale student token
      localStorage.removeItem('drl_token');
      localStorage.setItem('drl_admin_token', data.token);
    }
    
    return {
      success: true,
      username: data.username,
      token: data.token,
      ...data
    };
  },

  /**
   * Get admin profile
   */
  async getProfile() {
    return apiService.get('/admin-api/profile');
  },

  /**
   * Change admin password
   */
  async changePassword(passwordOrOldPassword: string | any, newPassword?: string) {
    if (typeof passwordOrOldPassword === 'object') {
      // Called with (data: { oldPassword, newPassword })
      const data = passwordOrOldPassword;
      return apiService.post('/admin-api/change-password', {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
    }
    // Called with (oldPassword, newPassword)
    return apiService.post('/admin-api/change-password', {
      oldPassword: passwordOrOldPassword,
      newPassword,
    });
  },

  /**
   * Logout admin
   */
  logout() {
    localStorage.removeItem('drl_admin_token');
    localStorage.removeItem('drl_token');
  },
};

/**
 * DRL Service - Student DRL scores operations
 */
export const drlService = {
  /**
   * Get student's DRL scores with optional pagination
   */
  async getScores(studentId?: string, page?: number, limit?: number) {
    let url = '/drl_scores';
    const params: string[] = [];
    if (studentId) params.push(`student_id=${studentId}`);
    if (page) params.push(`page=${page}`);
    if (limit) params.push(`limit=${limit}`);
    if (params.length) url += '?' + params.join('&');
    
    const response = await apiService.get<any>(url);
    // Handle both array response and paginated { data, pagination } response
    let rows: any[];
    if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
      rows = response.data;
    } else {
      rows = Array.isArray(response) ? response : [];
    }
    // Normalize: handle both snake_case (old server) and camelCase (new server)
    return rows.map(normalizeDRLScore);
  },

  /**
   * Get all DRL scores (admin) with optional pagination
   */
  async getAllScores(classIdOrPage?: string | number, page?: number, limit?: number) {
    let url = '/drl_scores';
    
    // Handle overloaded parameters
    if (typeof classIdOrPage === 'string') {
      url += `?class_id=${classIdOrPage}`;
      if (page) url += `&page=${page}`;
      if (limit) url += `&limit=${limit}`;
    } else if (typeof classIdOrPage === 'number') {
      url += `?page=${classIdOrPage}&limit=${page || 20}`;
    }
    
    const response = await apiService.get<any>(url);
    // Handle both array response and paginated { data, pagination } response
    if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
      return response.data;
    }
    return response || [];
  },

  /**
   * Submit DRL score for approval
   */
  async submitScore(data: any) {
    return apiService.post('/drl_scores', data);
  },

  /**
   * Save/Update DRL score (admin approval)
   * Can be called as: saveScore(updatedScore) or saveScore(scoreId, data)
   */
  async saveScore(scoreIdOrData: string | any, data?: any) {
    if (typeof scoreIdOrData === 'string' && data) {
      // Called with (scoreId, data)
      // We use POST /drl_scores for upserting, backend checks id in body
      return apiService.post('/drl_scores', { ...data, id: scoreIdOrData });
    } else if (typeof scoreIdOrData === 'object') {
      // Called with (scoreObject) - scoreObject should have an 'id' field
      return apiService.post('/drl_scores', scoreIdOrData);
    }
    throw new Error('Invalid arguments for saveScore');
  },

  /**
   * Update DRL score (admin approval) - alias for saveScore
   */
  async updateScore(scoreIdOrData: string | any, data?: any) {
    return this.saveScore(scoreIdOrData, data);
  },

  /**
   * Get proofs for a student
   */
  async getProofs(studentId: string) {
    const response = await apiService.get<any>(`/drl_scores/proofs/${studentId}`);

    // Backend may return either:
    // - { success: true, proofs: { ... } }
    // - { "I.1": [url1, ...], "II.2": [url2, ...] }
    if (response && typeof response === 'object' && 'proofs' in response) {
      return {
        success: Boolean((response as any).success ?? true),
        proofs: (response as any).proofs || {}
      };
    }

    return {
      success: true,
      proofs: (response && typeof response === 'object') ? response : {}
    };
  },

  /**
   * Get trang thai (status) summary
   */
  async getTrangThaiSummary(period?: string) {
    const url = period ? `/trang-thai-summary?period=${period}` : '/trang-thai-summary';
    return apiService.get(url);
  },

  /**
   * Send approval/rejection email
   */
  async sendApprovalEmail(
    studentEmail: string,
    studentName: string,
    rejectedCount: number,
    totalCriteria: number,
    studentId?: string,
    semester?: string,
    classId?: string,
    rejectionFeedback?: string,
    adminName?: string,
    periodEndDate?: string,
    reportData?: {
      details?: any;
      selfScore?: number;
      classScore?: number;
      finalScore?: number;
      status?: string;
      criteria?: Array<{
        id: string;
        content: string;
        sectionTitle: string;
        maxPoints: number;
      }>;
    }
  ) {
    return apiService.post('/send-approval-email', {
      studentEmail,
      studentName,
      rejectedCount,
      totalCriteria,
      studentId,
      semester,
      classId,
      rejectionFeedback,
      adminName,
      periodEndDate,
      reportData,
    });
  },

  /**
   * Get grading periods - what AdminApprovalPage calls
   */
  async getPeriods() {
    return apiService.get('/grading_periods');
  },

  /**
   * Get grading periods - alias
   */
  async getGradingPeriods() {
    return this.getPeriods();
  },

  /**
   * Get trang thai summary by class
   */
  async getTrangThaiByClass(classId?: string) {
    const url = classId ? `/trang-thai-by-class?class_id=${classId}` : '/trang-thai-by-class';
    return apiService.get(url);
  },

  /**
   * Update grading period
   */
  async updatePeriod(periodId: string | any, data?: any) {
    if (typeof periodId === 'object') {
      // Called with (periodObject)
      const periodData = periodId;
      const id = periodData.id;
      if (!id) throw new Error('Period object must have an id field');
      return apiService.post('/grading_periods', periodData); // Use POST for upsert
    }
    return apiService.post('/grading_periods', { ...data, id: periodId }); // Use POST for upsert
  },

  /**
   * Save/Create grading period
   */
  async savePeriod(data: any) {
    return apiService.post('/grading_periods', data);
  },

  /**
   * Delete grading period
   */
  async deletePeriod(periodId: string) {
    return apiService.delete(`/grading_periods/${periodId}`);
  },

  /**
   * Upload proof/evidence
   * Can be called with various argument patterns:
   * - uploadProof(studentId, category, file)
   * - uploadProof(fileName, base64Data, username, critId, period, sectionLabel, sectionId, mssv)
   */
  async uploadProof(...args: any[]): Promise<any> {
    if (args.length === 3 && args[2] instanceof File) {
      // Pattern: (studentId, category, file)
      const [studentId, category, file] = args;
      const formData = new FormData();
      formData.append('student_id', studentId);
      formData.append('category', category);
      formData.append('file', file);
      
      const url = `${API_BASE}/upload`;
      const headers =new Headers();
      
      let token = localStorage.getItem('drl_token') || localStorage.getItem('drl_admin_token');
      if (token && token.trim() && token.startsWith('eyJ')) {
        headers.set('Authorization', `Bearer ${token}`);
      } else if (API_KEY && API_KEY.trim()) {
        headers.set('x-api-key', API_KEY);
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }
      
      return response.json();
    } else if (args.length >= 4) {
      // Pattern: (fileName, base64Data, username, critId, period, sectionLabel, sectionId, mssv)
      const [fileName, base64Data, username, critId, period, sectionLabel, sectionId, mssv] = args;
      
      const url = `${API_BASE}/upload`;
      const headers = new Headers();
      headers.set('Content-Type', 'application/json');
      
      let token = localStorage.getItem('drl_token') || localStorage.getItem('drl_admin_token');
      if (token && token.trim() && token.startsWith('eyJ')) {
        headers.set('Authorization', `Bearer ${token}`);
      } else if (API_KEY && API_KEY.trim()) {
        headers.set('x-api-key', API_KEY);
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          fileData: base64Data,
          fileName,
          studentId: mssv || username,
          category: critId,
          semester: period,
          sectionLabel,
          sectionId,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }
      
      return response.json();
    }
    
    throw new Error('Invalid arguments for uploadProof');
  },

  /**
   * Delete proof/evidence
   * Can be called with various patterns:
   * - deleteProof(studentId, category, fileName)
   * - deleteProof(studentId, category, critId, sectionLabel, sectionId, mssv, ...)
   */
  async deleteProof(...args: any[]): Promise<any> {
    if (args.length === 2) {
      // Pattern: (studentId, category) or (tk_sv, muc_danh_gia)
      const [studentId, category] = args;
      const params = new URLSearchParams({
        tk_sv: studentId,
        muc_danh_gia: category,
      });
      return apiService.get(`/delimg?${params.toString()}`);
    } else if (args.length === 3 && typeof args[2] === 'string') {
      // Pattern: (studentId, category, fileName)
      const [studentId, category, fileName] = args;
      const params = new URLSearchParams({
        tk_sv: studentId,
        muc_danh_gia: category,
        file_name: fileName,
      });
      return apiService.get(`/delimg?${params.toString()}`);
    } else if (args.length >= 4) {
      // Pattern: (studentId, category, critId, ...)
      const [studentId, category] = args;
      const params = new URLSearchParams({
        tk_sv: studentId,
        muc_danh_gia: category,
      });
      return apiService.get(`/delimg?${params.toString()}`);
    }
    throw new Error('Invalid arguments for deleteProof');
  },

  /**
   * Delete all proofs for a student
   */
  async deleteAllProofs(studentId: string) {
    return apiService.delete(`/drl_scores/${studentId}/proofs`);
  },
};

/**
 * Approval Service - Score approval operations
 */
export const approvalService = {
  /**
   * Get scores pending approval
   */
  async getPending() {
    return apiService.get('/approval/pending');
  },

  /**
   * Get approval stats
   */
  async getStats(token?: string) {
    const url = token ? `/approval/stats?token=${token}` : '/approval/stats';
    return apiService.get(url);
  },

  /**
   * Get scores for approval
   */
  async getScoresForApproval() {
    return apiService.get('/approval/scores');
  },

  /**
   * Approve a score
   */
  async approveScore(scoreId: string, feedback?: string) {
    return apiService.post(`/approval/${scoreId}/approve`, { feedback });
  },

  /**
   * Reject a score
   */
  async rejectScore(scoreId: string, feedback: string) {
    return apiService.post(`/approval/${scoreId}/reject`, { feedback });
  },
};

/**
 * Student Service - Student operations
 */
export const studentService = {
  /**
   * Get all students
   */
  async getAll(classId?: string) {
    const url = classId ? `/students?class_id=${classId}` : '/students';
    return apiService.get(url);
  },

  /**
   * Get student by ID
   */
  async getById(studentId: string) {
    return apiService.get(`/students/${studentId}`);
  },

  /**
   * Get student's DRL scores
   */
  async getScores(studentId: string) {
    return apiService.get(`/drl_scores?student_id=${studentId}`);
  },

  /**
   * Create new student
   */
  async create(data: any) {
    return apiService.post('/students', data);
  },

  /**
   * Update student
   * Can be called as: update(studentId, data) or update(studentObject)
   */
  async update(studentIdOrData: string | any, data?: any) {
    if (typeof studentIdOrData === 'string' && data) {
      // Called with (studentId, data)
      return apiService.put(`/students/${studentIdOrData}`, data);
    } else if (typeof studentIdOrData === 'object') {
      // Called with (studentObject) - should have an 'id' field
      const studentData = studentIdOrData;
      const studentId = studentData.id;
      if (!studentId) {
        throw new Error('Student object must have an id field');
      }
      return apiService.put(`/students/${studentId}`, studentData);
    }
    throw new Error('Invalid arguments for update');
  },

  /**
   * Create or update student (upsert)
   */
  async upsert(studentIdOrData: string | any, data?: any) {
    if (typeof studentIdOrData === 'object') {
      // Called with (studentObject)
      const studentData = studentIdOrData;
      const studentId = studentData.id;
      if (!studentId) {
        throw new Error('Student object must have an id field');
      }
      return apiService.put(`/students/${studentId}`, studentData);
    }
    return apiService.put(`/students/${studentIdOrData}`, data);
  },

  /**
   * Delete student
   */
  async delete(studentId: string) {
    return apiService.delete(`/students/${studentId}`);
  },

  /**
   * Change student password
   */
  async changePassword(studentId: string, oldPassword: string, newPassword: string) {
    return apiService.post(`/students/${studentId}/change-password`, {
      oldPassword,
      newPassword,
    });
  },
};

/**
 * Admin Service - Admin operations
 */
export const adminService = {
  /**
   * Get dashboard statistics
   */
  async getStats(token?: string) {
    return apiService.get('/admin-api/stats');
  },

  /**
   * Get all grades/scores for approval
   */
  async getScoresForApproval() {
    return apiService.get('/admin-api/scores');
  },

  /**
   * Approve score submission
   */
  async approveScore(scoreId: string, feedback?: string) {
    return apiService.post(`/admin-api/approve/${scoreId}`, { feedback });
  },

  /**
   * Reject score submission with feedback
   */
  async rejectScore(scoreId: string, feedback: string) {
    return apiService.post(`/admin-api/reject/${scoreId}`, { feedback });
  },

  /**
   * Delete all proofs for a student
   */
  async deleteAllProofs(studentIdOrParams: string | any) {
    if (typeof studentIdOrParams === 'string') {
      return apiService.delete(`/drl_scores/${studentIdOrParams}/proofs`);
    }
    // Called with params object
    const { student_id } = studentIdOrParams;
    return apiService.delete(`/drl_scores/${student_id}/proofs`);
  },

  /**
   * Get all admin accounts
   */
  async getAdminAccounts() {
    return apiService.get('/admin-api/admin-accounts');
  },

  /**
   * Create new admin account
   */
  async createAdminAccount(data: { username: string; password: string; name?: string; email?: string }) {
    return apiService.post('/admin-api/admin-accounts', data);
  },

  /**
   * Delete admin account
   */
  async deleteAdminAccount(username: string) {
    return apiService.delete(`/admin-api/admin-accounts/${encodeURIComponent(username)}`);
  },
  /**
   * Reset student password (admin)
   */
  async resetStudentPassword(username: string, newPassword: string) {
    return apiService.post('/users-reset-pass', [{ username, password: newPassword }]);
  },
};

/**
 * Class Service - Class/Grade operations
 */
export const classService = {
  /**
   * Get all classes
   */
  async getAll() {
    return apiService.get('/classes');
  },

  /**
   * Get class by ID
   */
  async getById(classId: string) {
    return apiService.get(`/classes/${classId}`);
  },

  /**
   * Get students in class
   */
  async getStudents(classId: string) {
    return apiService.get(`/classes/${classId}/students`);
  },

  /**
   * Create new class
   */
  async create(data: any) {
    return apiService.post('/classes', data);
  },

  /**
   * Update class
   */
  async update(classIdOrData: string | any, data?: any) {
    if (typeof classIdOrData === 'object') {
      // Called with (classObject)
      return apiService.put(`/classes`, classIdOrData);
    }
    return apiService.put(`/classes`, { ...data, id: classIdOrData });
  },

  /**
   * Delete class
   */
  async delete(classId: string) {
    return apiService.delete(`/classes/${classId}`);
  },
};

export default apiService;
