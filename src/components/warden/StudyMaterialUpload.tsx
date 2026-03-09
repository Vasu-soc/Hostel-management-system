import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Link as LinkIcon, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface StudyMaterial {
  id: string;
  branch: string;
  year: string;
  subject_name: string;
  file_url: string | null;
  drive_link: string | null;
  created_at: string;
}

interface StudyMaterialUploadProps {
  materials: StudyMaterial[];
  wardenId: string;
  onRefresh: () => void;
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

const StudyMaterialUpload = ({ materials, wardenId, onRefresh }: StudyMaterialUploadProps) => {
  const { toast } = useToast();
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [driveLink, setDriveLink] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!selectedBranch || !selectedYear || !subjectName) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    if (!driveLink && !file) {
      toast({ title: "Error", description: "Please provide either a drive link or upload a file", variant: "destructive" });
      return;
    }

    if (file) {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (!['pdf', 'doc', 'docx'].includes(fileExt || '')) {
        toast({ title: "Invalid format", description: "Only PDF and Word (.doc/.docx) files are allowed.", variant: "destructive" });
        return;
      }
    }

    setIsUploading(true);
    let file_url = null;

    try {
      if (file) {
        const fileExt = file.name.split('.').pop();
        const safeFileName = `${Math.random().toString(36).substring(7)}.${fileExt}`;

        await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = async () => {
            try {
              const res = await fetch('/api/local-upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName: safeFileName, fileData: reader.result })
              });
              const result = await res.json();
              if (result.success) {
                file_url = result.url;
                resolve(true);
              } else {
                reject(new Error(result.error || "Failed to save file locally"));
              }
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = (err) => reject(err);
        });
      }

      const { error: insertError } = await supabase.from('study_materials').insert({
        branch: selectedBranch,
        year: selectedYear,
        subject_name: subjectName,
        drive_link: driveLink || null,
        file_url: file_url,
        warden_id: wardenId,
      });

      if (insertError) throw insertError;

      toast({ title: "Success", description: "Study material processed successfully!" });
      setSelectedBranch("");
      setSelectedYear("");
      setSubjectName("");
      setDriveLink("");
      setFile(null);
      const fileInput = document.getElementById('fileUpload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      onRefresh();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to organize material", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;

    try {
      const { error: deleteError } = await supabase.from('study_materials').delete().eq('id', id);
      if (deleteError) {
        throw deleteError;
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to delete material", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Material deleted successfully" });
    onRefresh();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Upload Form */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Study Material
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
                {branches.map((branch) => (
                  <SelectItem key={branch.value} value={branch.value}>
                    {branch.label}
                  </SelectItem>
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
                {years.map((year) => (
                  <SelectItem key={year.value} value={year.value}>
                    {year.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subjectName">Subject Name *</Label>
            <Input
              id="subjectName"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="e.g., Python Programming"
            />
          </div>

          <div className="space-y-4 pt-2 border-t border-border">
            <Label className="text-sm font-semibold text-primary">Provide Study Material via:</Label>

            <div className="space-y-2">
              <Label htmlFor="fileUpload">1. Upload from Device</Label>
              <Input
                id="fileUpload"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                className="cursor-pointer h-auto py-3 file:mr-4 file:py-2 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
            </div>

            <div className="text-center text-sm text-muted-foreground font-medium">OR</div>

            <div className="space-y-2">
              <Label htmlFor="driveLink">2. Google Drive Link</Label>
              <Input
                id="driveLink"
                value={driveLink}
                onChange={(e) => setDriveLink(e.target.value)}
                placeholder="https://drive.google.com/..."
              />
            </div>
          </div>

          <Button onClick={handleUpload} disabled={isUploading} className="w-full">
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? "Uploading..." : "Upload Material"}
          </Button>
        </CardContent>
      </Card>

      {/* Uploaded Materials List */}
      <Card className="border-2 border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Uploaded Materials
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[400px] overflow-auto">
            {materials.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No materials uploaded yet</p>
              </div>
            ) : (
              materials.map((material) => (
                <Card key={material.id} className="border border-border">
                  <CardContent className="py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{material.subject_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {material.branch.toUpperCase()} • {material.year}
                        </p>
                        {material.file_url && (
                          <a
                            href={material.file_url as string}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="text-sm text-success hover:underline flex items-center gap-1 mt-1"
                          >
                            <FileText className="w-3 h-3" />
                            Open Uploaded File
                          </a>
                        )}
                        {material.drive_link && (
                          <a
                            href={material.drive_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                          >
                            <LinkIcon className="w-3 h-3" />
                            Open Drive Link
                          </a>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(material.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
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

export default StudyMaterialUpload;
