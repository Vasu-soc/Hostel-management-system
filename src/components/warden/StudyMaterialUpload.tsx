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
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!selectedBranch || !selectedYear || !subjectName) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    if (!driveLink) {
      toast({ title: "Error", description: "Please provide a drive link", variant: "destructive" });
      return;
    }

    setIsUploading(true);

    const { error } = await supabase.from("study_materials").insert({
      branch: selectedBranch,
      year: selectedYear,
      subject_name: subjectName,
      drive_link: driveLink,
      warden_id: wardenId,
    });

    setIsUploading(false);

    if (error) {
      toast({ title: "Error", description: "Failed to upload material", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Study material uploaded successfully" });
    setSelectedBranch("");
    setSelectedYear("");
    setSubjectName("");
    setDriveLink("");
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;

    const { error } = await supabase.from("study_materials").delete().eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to delete material", variant: "destructive" });
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

          <div className="space-y-2">
            <Label htmlFor="driveLink">Google Drive Link</Label>
            <Input
              id="driveLink"
              value={driveLink}
              onChange={(e) => setDriveLink(e.target.value)}
              placeholder="https://drive.google.com/..."
            />
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
