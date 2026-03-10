import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

// Custom plugin to handle file uploads and local json saving without a database
const localApiPlugin = () => ({
  name: 'local-api',
  configureServer(server: any) {
    server.middlewares.use((req: any, res: any, next: any) => {
      // 1. Local File Updloads (PDFs/Materials)
      if (req.url === '/api/local-upload' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => body += chunk.toString());
        req.on('end', () => {
          try {
            const { fileName, fileData } = JSON.parse(body);
            const uploadsDir = path.resolve(__dirname, 'public', 'uploads');
            if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

            // Extract base64
            const base64Data = fileData.replace(/^data:.*?;base64,/, '');
            const safeName = Date.now() + '-' + fileName.replace(/[^a-zA-Z0-9.]/g, '');
            const filePath = path.join(uploadsDir, safeName);

            fs.writeFileSync(filePath, base64Data, 'base64');
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, url: `/uploads/${safeName}` }));
          } catch (e: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
        });
        return;
      }

      // 2. Medical Alerts local JSON saving
      const alertsFile = path.resolve(__dirname, 'public', 'medical_alerts.json');

      if (req.url === '/api/local-medical-alerts' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => body += chunk.toString());
        req.on('end', () => {
          try {
            const newAlert = JSON.parse(body);
            newAlert.id = Date.now().toString();
            newAlert.created_at = new Date().toISOString();
            newAlert.status = "pending";

            let alerts = [];
            if (fs.existsSync(alertsFile)) {
              alerts = JSON.parse(fs.readFileSync(alertsFile, 'utf-8') || '[]');
            }
            alerts.unshift(newAlert); // Add to beginning

            fs.writeFileSync(alertsFile, JSON.stringify(alerts, null, 2));
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: newAlert }));
          } catch (e: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
        });
        return;
      }

      if (req.url === '/api/local-medical-alerts' && req.method === 'GET') {
        try {
          if (!fs.existsSync(alertsFile)) fs.writeFileSync(alertsFile, '[]');
          const data = fs.readFileSync(alertsFile, 'utf-8');
          res.setHeader('Content-Type', 'application/json');
          res.end(data);
        } catch (e: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        }
        return;
      }

      if (req.url === '/api/local-medical-alerts' && req.method === 'PUT') {
        let body = '';
        req.on('data', (chunk: any) => body += chunk.toString());
        req.on('end', () => {
          try {
            const { id, status } = JSON.parse(body);
            let alerts = [];
            if (fs.existsSync(alertsFile)) {
              alerts = JSON.parse(fs.readFileSync(alertsFile, 'utf-8') || '[]');
            }
            alerts = alerts.map((a: any) => a.id === id ? { ...a, status } : a);
            fs.writeFileSync(alertsFile, JSON.stringify(alerts, null, 2));
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
          } catch (e: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
        });
        return;
      }

      if (req.url === '/api/local-medical-alerts' && req.method === 'DELETE') {
        try {
          fs.writeFileSync(alertsFile, '[]');
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true }));
        } catch (e: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        }
        return;
      }

      // 3. Study Materials local JSON saving
      const materialsFile = path.resolve(__dirname, 'public', 'local_materials.json');

      if (req.url === '/api/local-materials' && req.method === 'GET') {
        try {
          if (!fs.existsSync(materialsFile)) fs.writeFileSync(materialsFile, '[]');
          const data = fs.readFileSync(materialsFile, 'utf-8');
          res.setHeader('Content-Type', 'application/json');
          res.end(data);
        } catch (e: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        }
        return;
      }

      if (req.url === '/api/local-materials' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => body += chunk.toString());
        req.on('end', () => {
          try {
            const newMaterial = JSON.parse(body);
            newMaterial.id = Date.now().toString();
            newMaterial.created_at = new Date().toISOString();

            let records = [];
            if (fs.existsSync(materialsFile)) {
              records = JSON.parse(fs.readFileSync(materialsFile, 'utf-8') || '[]');
            }
            records.unshift(newMaterial);
            fs.writeFileSync(materialsFile, JSON.stringify(records, null, 2));
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: newMaterial }));
          } catch (e: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
        });
        return;
      }

      if (req.url?.startsWith('/api/local-materials/') && req.method === 'DELETE') {
        const id = req.url.split('/').pop();
        try {
          let records = [];
          if (fs.existsSync(materialsFile)) {
            records = JSON.parse(fs.readFileSync(materialsFile, 'utf-8') || '[]');
          }
          records = records.filter((r: any) => r.id !== id);
          fs.writeFileSync(materialsFile, JSON.stringify(records, null, 2));
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true }));
        } catch (e: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        }
        return;
      }

      // 4. Food Selection local JSON saving
      const foodSelectionFile = path.resolve(__dirname, 'public', 'food_selection.json');

      if (req.url === '/api/local-food-selection' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => body += chunk.toString());
        req.on('end', () => {
          try {
            const newSelection = JSON.parse(body);
            newSelection.id = Date.now().toString();
            newSelection.created_at = new Date().toISOString();

            let selections = [];
            if (fs.existsSync(foodSelectionFile)) {
              selections = JSON.parse(fs.readFileSync(foodSelectionFile, 'utf-8') || '[]');
            }
            // Remove previous selection by the same student today if needed, or just append
            selections.unshift(newSelection);

            fs.writeFileSync(foodSelectionFile, JSON.stringify(selections, null, 2));
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: newSelection }));
          } catch (e: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
        });
        return;
      }

      if (req.url === '/api/local-food-selection' && req.method === 'GET') {
        try {
          if (!fs.existsSync(foodSelectionFile)) fs.writeFileSync(foodSelectionFile, '[]');
          const data = fs.readFileSync(foodSelectionFile, 'utf-8');
          res.setHeader('Content-Type', 'application/json');
          res.end(data);
        } catch (e: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        }
        return;
      }

      if (req.url === '/api/local-food-selection' && req.method === 'DELETE') {
        try {
          fs.writeFileSync(foodSelectionFile, '[]');
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true }));
        } catch (e: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        }
        return;
      }

      // ================================================================
      // 5. LOCAL STUDENTS API (full CRUD - no database needed)
      // ================================================================
      const studentsFile = path.resolve(__dirname, 'public', 'students.json');
      const roomsFile = path.resolve(__dirname, 'public', 'rooms.json');
      const deletedFile = path.resolve(__dirname, 'public', 'deleted_students.json');

      const readStudents = () => {
        if (!fs.existsSync(studentsFile)) fs.writeFileSync(studentsFile, '[]');
        return JSON.parse(fs.readFileSync(studentsFile, 'utf-8') || '[]');
      };
      const writeStudents = (data: any[]) => fs.writeFileSync(studentsFile, JSON.stringify(data, null, 2));
      const readRooms = () => {
        if (!fs.existsSync(roomsFile)) fs.writeFileSync(roomsFile, '[]');
        return JSON.parse(fs.readFileSync(roomsFile, 'utf-8') || '[]');
      };
      const writeRooms = (data: any[]) => fs.writeFileSync(roomsFile, JSON.stringify(data, null, 2));
      const readDeletedIds = (): string[] => {
        if (!fs.existsSync(deletedFile)) fs.writeFileSync(deletedFile, '[]');
        return JSON.parse(fs.readFileSync(deletedFile, 'utf-8') || '[]');
      };
      const addDeletedId = (id: string) => {
        const ids = readDeletedIds();
        if (!ids.includes(id)) { ids.push(id); fs.writeFileSync(deletedFile, JSON.stringify(ids, null, 2)); }
      };

      // GET /api/deleted-students  — return list of deleted student IDs (blocklist)
      if (req.url === '/api/deleted-students' && req.method === 'GET') {
        try {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(readDeletedIds()));
        } catch (e: any) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })); }
        return;
      }

      // POST /api/deleted-students  — add an ID to the blocklist
      if (req.url === '/api/deleted-students' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => body += chunk.toString());
        req.on('end', () => {
          try {
            const { id } = JSON.parse(body);
            addDeletedId(id);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
          } catch (e: any) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })); }
        });
        return;
      }

      // DELETE /api/deleted-students  — clear the blocklist (admin reset)
      if (req.url === '/api/deleted-students' && req.method === 'DELETE') {
        try {
          fs.writeFileSync(deletedFile, '[]');
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true }));
        } catch (e: any) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })); }
        return;
      }

      // GET /api/local-students?gender=female  (list, with optional filter)
      if (req.url?.startsWith('/api/local-students') && !req.url.includes('/api/local-students/') && req.method === 'GET') {
        try {
          const url = new URL(req.url, 'http://localhost');
          const gender = url.searchParams.get('gender');
          let students = readStudents();
          if (gender) students = students.filter((s: any) => s.gender === gender);
          students.sort((a: any, b: any) => (a.student_name || '').localeCompare(b.student_name || ''));
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(students));
        } catch (e: any) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })); }
        return;
      }

      // GET /api/local-students/:id
      if (req.url?.match(/^\/api\/local-students\/[^/]+$/) && req.method === 'GET') {
        try {
          const id = req.url.split('/').pop();
          const students = readStudents();
          const student = students.find((s: any) => s.id === id);
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = student ? 200 : 404;
          res.end(JSON.stringify(student || { error: 'Not found' }));
        } catch (e: any) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })); }
        return;
      }

      // POST /api/local-students  (create)
      if (req.url === '/api/local-students' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => body += chunk.toString());
        req.on('end', () => {
          try {
            const newStudent = JSON.parse(body);
            newStudent.id = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            newStudent.created_at = new Date().toISOString();
            newStudent.updated_at = new Date().toISOString();
            newStudent.room_allotted = newStudent.room_allotted ?? false;
            const students = readStudents();
            // Check for duplicate roll number
            if (students.find((s: any) => s.roll_number === newStudent.roll_number)) {
              res.statusCode = 409;
              res.end(JSON.stringify({ error: 'Roll number already registered' }));
              return;
            }
            students.push(newStudent);
            writeStudents(students);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: newStudent }));
          } catch (e: any) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })); }
        });
        return;
      }

      // PUT /api/local-students/:id  (update)
      if (req.url?.match(/^\/api\/local-students\/[^/]+$/) && req.method === 'PUT') {
        let body = '';
        req.on('data', (chunk: any) => body += chunk.toString());
        req.on('end', () => {
          try {
            const id = req.url!.split('/').pop();
            const updates = JSON.parse(body);
            updates.updated_at = new Date().toISOString();
            let students = readStudents();
            const idx = students.findIndex((s: any) => s.id === id);
            if (idx === -1) { res.statusCode = 404; res.end(JSON.stringify({ error: 'Not found' })); return; }
            students[idx] = { ...students[idx], ...updates };
            writeStudents(students);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: students[idx] }));
          } catch (e: any) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })); }
        });
        return;
      }

      // DELETE /api/local-students/:id  (full cascade delete - no RLS!)
      if (req.url?.match(/^\/api\/local-students\/[^/]+$/) && req.method === 'DELETE') {
        try {
          const id = req.url.split('/').pop();
          const students = readStudents();
          const student = students.find((s: any) => s.id === id);
          if (!student) { res.statusCode = 404; res.end(JSON.stringify({ error: 'Not found' })); return; }

          // Remove student
          const filtered = students.filter((s: any) => s.id !== id);
          writeStudents(filtered);

          // Update room occupancy
          if (student.hostel_room_number) {
            const rooms = readRooms();
            const roomIdx = rooms.findIndex((r: any) => r.room_number === student.hostel_room_number);
            if (roomIdx !== -1) {
              const occupied = filtered.filter((s: any) => s.hostel_room_number === student.hostel_room_number && s.room_allotted).length;
              rooms[roomIdx].occupied_beds = occupied;
              writeRooms(rooms);
            }
          }

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, deleted: student }));
        } catch (e: any) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })); }
        return;
      }

      // ================================================================
      // 6. LOCAL ROOMS API (full CRUD)
      // ================================================================

      // GET /api/local-rooms?type=girls|boys|all
      if (req.url?.startsWith('/api/local-rooms') && !req.url.includes('/api/local-rooms/') && req.method === 'GET') {
        try {
          const url = new URL(req.url, 'http://localhost');
          const type = url.searchParams.get('type'); // 'girls' | 'boys' | null
          let rooms = readRooms();
          if (type === 'girls') rooms = rooms.filter((r: any) => r.room_number.startsWith('GA') || r.room_number.startsWith('GN'));
          else if (type === 'boys') rooms = rooms.filter((r: any) => !r.room_number.startsWith('GA') && !r.room_number.startsWith('GN'));
          rooms.sort((a: any, b: any) => (a.room_number || '').localeCompare(b.room_number || ''));
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(rooms));
        } catch (e: any) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })); }
        return;
      }

      // PUT /api/local-rooms/:id  (update room, e.g. occupied_beds)
      if (req.url?.match(/^\/api\/local-rooms\/[^/]+$/) && req.method === 'PUT') {
        let body = '';
        req.on('data', (chunk: any) => body += chunk.toString());
        req.on('end', () => {
          try {
            const id = req.url!.split('/').pop();
            const updates = JSON.parse(body);
            let rooms = readRooms();
            const idx = rooms.findIndex((r: any) => r.id === id || r.room_number === id);
            if (idx === -1) { res.statusCode = 404; res.end(JSON.stringify({ error: 'Room not found' })); return; }
            rooms[idx] = { ...rooms[idx], ...updates };
            writeRooms(rooms);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: rooms[idx] }));
          } catch (e: any) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })); }
        });
        return;
      }

      next();

    });
  }
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    chunkSizeWarningLimit: 1000,
  },
  plugins: [react(), localApiPlugin(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
