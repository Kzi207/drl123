/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Criterion {
  id: string;
  content: string;
  maxPoints: number;
  guide: string;
  type: 'number' | 'boolean';
  unit?: string;
}

export interface Section {
  id: string;
  title: string;
  maxPoints: number;
  criteria: Criterion[];
}

export interface User {
  username: string;
  role: 'admin' | 'monitor' | 'student' | 'bch' | 'doankhoa';
  name?: string;
  mssv?: string;
  department?: string;
  classId?: string;
}

export interface Student {
  id: string;
  lastName: string;
  firstName: string;
  dob?: string;
  classId: string;
  email?: string;
  major?: string;
  department?: string;
}

export interface ClassGroup {
  id: string;
  name: string;
  description?: string;
}

export interface GradingPeriod {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
}

export interface DRLScore {
  id?: string;
  studentId: string;
  semester: string;
  selfScore: number;
  classScore: number;
  bchScore: number;
  finalScore: number;
  details: string | any; // JSON string or object
  status: 'draft' | 'submitted' | 'class_approved' | 'bch_approved' | 'finalized';
  updatedAt?: string;
}

export interface DRLDetails {
  [criterionId: string]: {
    self: number;
    class: number;
    proofs: string[];
  };
}
