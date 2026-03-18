import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BranchMark {
  id: string;
  branch: string;
  year: string;
  title: string;
  date: string;
  file_url: string;
  created_at: string;
}

interface BranchMarksUploadProps {
  wardenId: string;
}

const branches = [
  { value: "cse", label: "Computer Science (CSE)" },
  { value: "ece", label: "Electronics (ECE)" },
  { value: "eee", label: "Electrical (EEE)" },
  { value: "mech", label: "Mechanical" },
  { value: "civil", label: "Civil" },
  { value: "aiml", label: "AI & ML" },
  { value: "it", label: "Information Technology (IT)" },
];

const years = [
  { value: "1st Year", label: "1st Year" },
  { value: "2nd Year", label: "2nd Year" },
  { value: "3rd Year", label: "3rd Year" },
  { value: "4th Year", label: "4th Year" },
];

const BranchMarksUpload = ({ wardenId }: BranchMarksUploadProps) => {
  const { toast } = useToast();
  const [marks, setMarks] = useState<BranchMark[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchMarks = async () => {
    try {
      const { data, error } = await supabase
        .from('branch_marks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Failed to fetch marks:", error.message);
        return;
      }
      setMarks(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMarks();
  }, []);

  const handleUpload = async () => {
    if (!selectedBranch || !selectedYear || !title || !date || !file) {
      toast({ title: "Error", description: "Please fill all required fields and upload a PDF file", variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Error", description: "File size must be less than 10MB", variant: "destructive" });
      return;
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (fileExt !== 'pdf') {
      toast({ title: "Invalid format", description: "Only PDF files are allowed.", variant: "destructive" });
      return;
    }

    setIsUploading(true);

    try {
      const safeFileName = `${selectedBranch}_${selectedYear}_${Math.random().toString(36).substring(7)}_${Date.now()}.pdf`;
      const filePath = `${safeFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('branch-marks')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('branch-marks')
        .getPublicUrl(filePath);

      const file_url = urlData.publicUrl;

      const { error: insertError } = await supabase.from('branch_marks').insert({
        branch: selectedBranch,
        year: selectedYear,
        title,
        date,
        file_url,
        warden_id: wardenId,
      });

      if (insertError) throw insertError;

      // Optional: Notify students of this branch/year
      const { data: studentsToNotify } = await supabase
        .from("students")
        .select("id")
        .eq("branch", selectedBranch)
        .eq("year", selectedYear);

      if (studentsToNotify && studentsToNotify.length > 0) {
        const notifications = studentsToNotify.map(s => ({
          student_id: s.id,
          title: "New Marks Uploaded",
          message: `New marks sheet (${title}) has been uploaded for your branch.`,
          type: "marks_report"
        }));

        const { error: notifError } = await supabase.from("notifications").insert(notifications);
        if (notifError) console.error("Failed to send notifications:", notifError);
      }

      toast({ title: "Success", description: "Marks uploaded successfully!" });
      
      setSelectedBranch("");
      setSelectedYear("");
      setTitle("");
      setDate("");
      setFile(null);
      const fileInput = document.getElementById('pdfUpload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      fetchMarks();
    } catch (error: any) {
      console.error(error);
      toast({ title: "Error", description: error.message || "Failed to upload marks", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string, fileUrl: string) => {
    if (!confirm("Are you sure you want to delete this marks report?")) return;

    try {
      const { error } = await supabase.from('branch_marks').delete().eq('id', id);
      if (error) throw error;
      
      toast({ title: "Success", description: "Marks report deleted successfully" });
      fetchMarks();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete report" });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Branch Marks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select Branch *</Label>
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger>
                <SelectValue placeholder="Choose branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Select Year *</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="Choose year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Report Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Midterm 1 Exam Marks"
            />
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
            <Label htmlFor="pdfUpload">Upload PDF *</Label>
            <Input
              id="pdfUpload"
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">Max 10MB. PDF format only.</p>
          </div>

          <Button onClick={handleUpload} disabled={isUploading || !selectedBranch || !selectedYear || !title || !date || !file} className="w-full">
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? "Uploading..." : "Upload Marks"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-2 border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Uploaded Marks Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[500px] overflow-auto">
            {marks.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No marks reports uploaded yet</p>
              </div>
            ) : (
              marks.map((mark) => (
                <Card key={mark.id} className="border border-border">
                  <CardContent className="py-3 flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{mark.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {mark.branch.toUpperCase()} • {mark.year} • {mark.date}
                      </p>
                      <a
                        href={mark.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1 mt-1 font-semibold"
                      >
                        <FileText className="w-3 h-3" />
                        View PDF Report
                      </a>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(mark.id, mark.file_url)}
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

export default BranchMarksUpload;
