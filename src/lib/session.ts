/**
 * Secure session management utilities
 * Uses sessionStorage instead of localStorage and never stores passwords
 */

export interface StudentSession {
  id: string;
  roll_number: string;
  student_name: string;
  email: string | null;
  branch: string;
  year: string;
  gender: string;
  hostel_room_number: string | null;
  floor_number: string | null;
  room_allotted: boolean;
  paid_fee: number;
  pending_fee: number;
  total_fee: number;
  validity_from: string | null;
  validity_to: string | null;
  remarks: string | null;
  photo_url: string | null;
  expiresAt: number;
}

export interface WardenSession {
  id: string;
  username: string;
  name: string;
  mobile_number: string | null;
  warden_type: string;
  expiresAt: number;
}

export interface ParentSession {
  id: string;
  parent_name: string;
  mobile_number: string;
  student_roll_number: string;
  expiresAt: number;
}

export interface AdminSession {
  id: string;
  username: string;
  name: string;
  mobile_number: string | null;
  expiresAt: number;
}

const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours

// Remove password from any object
const sanitizeUserData = <T extends Record<string, unknown>>(data: T): Omit<T, 'password'> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...safeData } = data;
  return safeData as Omit<T, 'password'>;
};

// Student session management
export const setStudentSession = (student: Record<string, unknown>): void => {
  const safeData = sanitizeUserData(student);
  const session: StudentSession = {
    id: safeData.id as string,
    roll_number: safeData.roll_number as string,
    student_name: safeData.student_name as string,
    email: safeData.email as string | null,
    branch: safeData.branch as string,
    year: safeData.year as string,
    gender: safeData.gender as string,
    hostel_room_number: safeData.hostel_room_number as string | null,
    floor_number: safeData.floor_number as string | null,
    room_allotted: safeData.room_allotted as boolean,
    paid_fee: Number(safeData.paid_fee || 0),
    pending_fee: Number(safeData.pending_fee || 100000),
    total_fee: Number(safeData.total_fee || 100000),
    validity_from: safeData.validity_from as string | null,
    validity_to: safeData.validity_to as string | null,
    remarks: safeData.remarks as string | null,
    photo_url: safeData.photo_url as string | null,
    expiresAt: Date.now() + SESSION_DURATION,
  };
  sessionStorage.setItem('currentStudent', JSON.stringify(session));
};

export const getStudentSession = (): StudentSession | null => {
  const data = sessionStorage.getItem('currentStudent');
  if (!data) return null;
  
  try {
    const session: StudentSession = JSON.parse(data);
    if (Date.now() > session.expiresAt) {
      clearStudentSession();
      return null;
    }
    return session;
  } catch {
    clearStudentSession();
    return null;
  }
};

export const clearStudentSession = (): void => {
  sessionStorage.removeItem('currentStudent');
};

// Warden session management
export const setWardenSession = (warden: Record<string, unknown>): void => {
  const safeData = sanitizeUserData(warden);
  const session: WardenSession = {
    id: safeData.id as string,
    username: safeData.username as string,
    name: safeData.name as string,
    mobile_number: safeData.mobile_number as string | null,
    warden_type: safeData.warden_type as string,
    expiresAt: Date.now() + SESSION_DURATION,
  };
  sessionStorage.setItem('currentWarden', JSON.stringify(session));
};

export const getWardenSession = (): WardenSession | null => {
  const data = sessionStorage.getItem('currentWarden');
  if (!data) return null;
  
  try {
    const session: WardenSession = JSON.parse(data);
    if (Date.now() > session.expiresAt) {
      clearWardenSession();
      return null;
    }
    return session;
  } catch {
    clearWardenSession();
    return null;
  }
};

export const clearWardenSession = (): void => {
  sessionStorage.removeItem('currentWarden');
};

// Parent session management
export const setParentSession = (parent: Record<string, unknown>): void => {
  const safeData = sanitizeUserData(parent);
  const session: ParentSession = {
    id: safeData.id as string,
    parent_name: safeData.parent_name as string,
    mobile_number: safeData.mobile_number as string,
    student_roll_number: safeData.student_roll_number as string,
    expiresAt: Date.now() + SESSION_DURATION,
  };
  sessionStorage.setItem('currentParent', JSON.stringify(session));
};

export const getParentSession = (): ParentSession | null => {
  const data = sessionStorage.getItem('currentParent');
  if (!data) return null;
  
  try {
    const session: ParentSession = JSON.parse(data);
    if (Date.now() > session.expiresAt) {
      clearParentSession();
      return null;
    }
    return session;
  } catch {
    clearParentSession();
    return null;
  }
};

export const clearParentSession = (): void => {
  sessionStorage.removeItem('currentParent');
};

// Admin session management
export const setAdminSession = (admin: Record<string, unknown>): void => {
  const safeData = sanitizeUserData(admin);
  const session: AdminSession = {
    id: safeData.id as string,
    username: safeData.username as string,
    name: safeData.name as string,
    mobile_number: safeData.mobile_number as string | null,
    expiresAt: Date.now() + SESSION_DURATION,
  };
  sessionStorage.setItem('admin', JSON.stringify(session));
};

export const getAdminSession = (): AdminSession | null => {
  const data = sessionStorage.getItem('admin');
  if (!data) return null;
  
  try {
    const session: AdminSession = JSON.parse(data);
    if (Date.now() > session.expiresAt) {
      clearAdminSession();
      return null;
    }
    return session;
  } catch {
    clearAdminSession();
    return null;
  }
};

export const clearAdminSession = (): void => {
  sessionStorage.removeItem('admin');
};

// Clear all sessions
export const clearAllSessions = (): void => {
  clearStudentSession();
  clearWardenSession();
  clearParentSession();
  clearAdminSession();
};
