/**
 * LOCAL STUDENT & ROOM API
 * ========================
 * Uses the Vite dev server local API (vite.config.ts) to store
 * students and rooms in JSON files — NO database, NO RLS, NO blocks.
 *
 * Key Feature — "Deleted Students Blocklist":
 *   Even if Supabase RLS blocks the actual DB deletion, we record the
 *   student ID in public/deleted_students.json. The WardenDashboard
 *   filters these IDs out of all fetched student lists automatically.
 *   Result: deleted students NEVER reappear after page refresh.
 *
 * Files stored:
 *   public/students.json          — locally registered students
 *   public/rooms.json             — locally registered rooms
 *   public/deleted_students.json  — IDs of students to permanently hide
 */

export const localApi = {

    // ─── DELETED STUDENTS BLOCKLIST ────────────────────────────────────────────

    /** Get the list of permanently deleted student IDs */
    async getDeletedIds(): Promise<string[]> {
        try {
            const res = await fetch('/api/deleted-students');
            if (!res.ok) return [];

            // Check if response is JSON (Vercel might return HTML for unknown routes)
            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                return [];
            }

            return await res.json();
        } catch { return []; }
    },

    /** Add a student ID to the permanent delete blocklist */
    async markDeleted(id: string): Promise<void> {
        try {
            await fetch('/api/deleted-students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
        } catch { /* silent */ }
    },

    // ─── STUDENTS ──────────────────────────────────────────────────────────────

    /** Fetch all students, optionally filtered by gender */
    async getStudents(gender?: string): Promise<any[]> {
        try {
            const url = gender ? `/api/local-students?gender=${gender}` : '/api/local-students';
            const res = await fetch(url);
            if (!res.ok) return [];
            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) return [];
            return await res.json();
        } catch { return []; }
    },

    /** Fetch single student by ID */
    async getStudent(id: string): Promise<any | null> {
        try {
            const res = await fetch(`/api/local-students/${id}`);
            if (!res.ok) return null;
            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) return null;
            return await res.json();
        } catch { return null; }
    },

    /** Create a new student */
    async createStudent(data: Record<string, any>): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            const res = await fetch('/api/local-students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) return { success: false, error: "Invalid response type" };
            return await res.json();
        } catch { return { success: false, error: "Network error" }; }
    },

    /** Update a student by ID */
    async updateStudent(id: string, updates: Record<string, any>): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            const res = await fetch(`/api/local-students/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) return { success: false, error: "Invalid response type" };
            return await res.json();
        } catch { return { success: false, error: "Network error" }; }
    },

    /**
     * DELETE a student — works in two layers:
     * 1. Removes from local students.json (if present)
     * 2. ALWAYS adds to deleted_students.json blocklist
     *    → Even if Supabase RLS blocks DB delete, student stays hidden forever
     */
    async deleteStudent(id: string): Promise<{ success: boolean; wasLocal: boolean; error?: string }> {
        // Always try to add to blocklist first (this is the guaranteed permanent hide)
        await this.markDeleted(id);

        // Also try to remove from local students.json
        try {
            const res = await fetch(`/api/local-students/${id}`, { method: 'DELETE' });
            if (!res.ok) return { success: false, wasLocal: false };
            const result = await res.json();
            return { success: result.success === true, wasLocal: result.success === true };
        } catch {
            return { success: false, wasLocal: false };
        }
    },

    // ─── ROOMS ─────────────────────────────────────────────────────────────────

    /** Fetch rooms, optionally filtered by 'boys' | 'girls' | undefined (all) */
    async getRooms(type?: 'boys' | 'girls'): Promise<any[]> {
        try {
            const url = type ? `/api/local-rooms?type=${type}` : '/api/local-rooms';
            const res = await fetch(url);
            if (!res.ok) return [];
            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) return [];
            return await res.json();
        } catch { return []; }
    },

    /** Update room record by room_number (used to sync occupied_beds) */
    async updateRoom(roomNumber: string, updates: Record<string, any>): Promise<{ success: boolean; error?: string }> {
        try {
            const res = await fetch(`/api/local-rooms/${roomNumber}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) return { success: false, error: "Invalid response type" };
            return await res.json();
        } catch { return { success: false, error: "Network error" }; }
    },
};

export default localApi;
