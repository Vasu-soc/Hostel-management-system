import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Trash2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AttendanceReport {
  id: string;
  student_name: string;
  roll_number: string;
  date: string;
  status: string;
  file_url: string | null;
  created_at: string;
}

interface AttendanceReportsProps {
  students: any[];
  wardenId: string;
  wardenType: string;
}

const AttendanceReports = ({ students, wardenId, wardenType }: AttendanceReportsProps) => {
  const { toast } = useToast();
  const [reports, setReports] = useState<AttendanceReport[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("Present");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // Only log, don't show toast for schema errors if user hasn't run the SQL yet
        console.error("Failed to fetch reports:", error.message);
        return;
      }
      setReports(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleUpload = async () => {
    if (!selectedStudentId || !date || !status) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    if (!file) {
      toast({ title: "Error", description: "Please upload an attendance report file", variant: "destructive" });
      return;
    }

    // Validate file size and type
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "File size must be less than 5MB", variant: "destructive" });
      return;
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'jpg', 'jpeg', 'png'].includes(fileExt || '')) {
      toast({ title: "Invalid format", description: "Only PDF and Image (.jpg, .jpeg, .png) files are allowed.", variant: "destructive" });
      return;
    }

    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return;

    setIsUploading(true);
    let file_url = null;

    try {
      const safeFileName = `${Math.random().toString(36).substring(7)}_${Date.now()}.${fileExt}`;
      const filePath = `${student.roll_number}/${safeFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('attendance-reports')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('attendance-reports')
        .getPublicUrl(filePath);

      file_url = urlData.publicUrl;

      const { error: insertError } = await supabase.from('attendance_reports').insert({
        student_id: selectedStudentId,
        student_name: student.student_name,
        roll_number: student.roll_number,
        date,
        status,
        file_url,
        warden_type: wardenType,
      });

      if (insertError) throw insertError;

      toast({ title: "Success", description: "Attendance report uploaded successfully!" });
      
      setSelectedStudentId("");
      setDate("");
      setStatus("Present");
      setFile(null);
      const fileInput = document.getElementById('reportUpload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      fetchReports();
    } catch (error: any) {
      console.error(error);
      toast({ title: "Error", description: error.message || "Failed to upload report. Check if schema/bucket exists.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string, fileUrl: string | null) => {
    if (!confirm("Are you sure you want to delete this report?")) return;

    try {
      const { error } = await supabase.from('attendance_reports').delete().eq('id', id);
      if (error) throw error;
      
      // Optionally delete from storage as well here if you want
      
      toast({ title: "Success", description: "Report deleted successfully" });
      fetchReports();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete report" });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Upload Form */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Attendance Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select Student *</Label>
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger>
                <SelectValue placeholder="Search or select student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.student_name} ({student.roll_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date *</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Status *</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Present">Present</SelectItem>
                <SelectItem value="Absent">Absent</SelectItem>
                <SelectItem value="Late">Late</SelectItem>
                <SelectItem value="On Leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reportUpload">Upload File (PDF/Image) *</Label>
            <Input
              id="reportUpload"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">Max 5MB. PDF or Image format.</p>
          </div>

          <Button onClick={handleUpload} disabled={isUploading || !selectedStudentId || !file || !date} className="w-full">
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? "Uploading..." : "Upload Report"}
          </Button>
        </CardContent>
      </Card>

      {/* Reports List */}
      <Card className="border-2 border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Recent Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[400px] overflow-auto">
            {reports.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No reports uploaded yet</p>
              </div>
            ) : (
              reports.map((report) => (
                <Card key={report.id} className="border border-border">
                  <CardContent className="py-3 flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{report.student_name} ({report.roll_number})</p>
                      <p className="text-sm text-muted-foreground">
                        Date: {report.date} • Status: <span className="font-semibold">{report.status}</span>
                      </p>
                      {report.file_url && (
                        <a
                          href={report.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                        >
                          <FileText className="w-3 h-3" />
                          View Document
                        </a>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(report.id, report.file_url)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceReports;
