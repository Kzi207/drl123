import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { DRLDetails, Section } from '../types';

export function removeAccents(str: string): string {
  return str.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export function generateStudentEmail(lastName: string, firstName: string, mssv: string): string {
  const fullName = `${lastName.trim()} ${firstName.trim()}`;
  const words = fullName.split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';

  const lastWord = words[words.length - 1];
  const otherWords = words.slice(0, words.length - 1);
  
  const initials = otherWords.map(word => removeAccents(word[0]).toLowerCase()).join('');
  const cleanLastWord = removeAccents(lastWord).toLowerCase();
  const cleanMssv = mssv.trim().toLowerCase();

  return `${initials}${cleanLastWord}${cleanMssv}@student.ctuet.edu.vn`;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatImageUrl(url: string | undefined): string {
  if (!url) return '';
  
  const oldDomain = "database.kzii.site";
  const newDomain = "fmectut.free.nf";
  
  // If it's a data URL, return it as is
  if (url.startsWith('data:')) return url;

  // If it's an absolute URL pointing to one of our domains, convert it to a relative path for proxying
  if (url.includes(oldDomain) || url.includes(newDomain)) {
    const path = url.split(oldDomain).pop()?.split(newDomain).pop() || '';
    return `/api-proxy${path.startsWith('/') ? path : `/${path}`}`;
  }

  // If it's already a proxy URL, return it
  if (url.startsWith('/api-proxy')) return url;
  
  // If it's an absolute URL to another domain, return it as is
  if (url.startsWith('http')) return url;
  
  // Ensure the URL starts with a slash for relative paths
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `/api-proxy${cleanUrl}`;
}

export function parseDRLDetails(details: any): DRLDetails {
  let parsed: any = {};
  if (typeof details === 'string') {
    try {
      parsed = JSON.parse(details);
    } catch (e) {
      console.error('Failed to parse DRL details', e);
      return {};
    }
  } else {
    parsed = details || {};
  }

  // Normalize data structure
  const normalized: DRLDetails = {};
  Object.entries(parsed).forEach(([key, value]) => {
    if (typeof value === 'number' || typeof value === 'string') {
      normalized[key] = { self: Number(value) || 0, class: 0, proofs: [] };
    } else if (value && typeof value === 'object') {
      const v = value as any;
      normalized[key] = {
        self: Number(v.self) || 0,
        class: Number(v.class) || 0,
        proofs: Array.isArray(v.proofs) ? v.proofs : []
      };
    }
  });

  return normalized;
}

export function calculateDRLScore(details: DRLDetails, sections: Section[], type: 'self' | 'class' = 'self'): number {
  return sections.reduce((total, section) => {
    const sectionScore = section.criteria.reduce((sum, crit) => {
      const critData = details[crit.id];
      const score = (critData && typeof critData === 'object') ? (Number(critData[type]) || 0) : 0;
      return sum + score;
    }, 0);
    return total + Math.min(sectionScore, section.maxPoints);
  }, 0);
}
