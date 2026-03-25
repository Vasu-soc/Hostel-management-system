import cseImg from "@/assets/branches/cse.png";
import aimlImg from "@/assets/branches/aiml.png";
import dsImg from "@/assets/branches/ds.png";
import eceImg from "@/assets/branches/ece.png";
import eeeImg from "@/assets/branches/eee.png";
import mechImg from "@/assets/branches/mech.png";
import civilImg from "@/assets/branches/civil.png";
import itImg from "@/assets/branches/it.png";
import csSpecImg from "@/assets/branches/cs_spec.png";

export type CourseType = "BTECH" | "DIPLOMA";

export const COURSES = [
  { value: "BTECH", label: "B.Tech Engineering" },
  { value: "DIPLOMA", label: "Diploma Studies" },
];

export const BRANCHES = [
  // B.Tech Branches
  { value: "cse", label: "CSE - Computer Science Engineering", image: cseImg, course: "BTECH" },
  { value: "aiml", label: "AIML - Artificial Intelligence & Machine Learning", image: aimlImg, course: "BTECH" },
  { value: "ds", label: "DS - Data Science", image: dsImg, course: "BTECH" },
  { value: "ece", label: "ECE - Electronics & Communication Engineering", image: eceImg, course: "BTECH" },
  { value: "eee", label: "EEE - Electrical & Electronics Engineering", image: eeeImg, course: "BTECH" },
  { value: "mech", label: "MECH - Mechanical Engineering", image: mechImg, course: "BTECH" },
  { value: "civil", label: "CIVIL - Civil Engineering", image: civilImg, course: "BTECH" },
  { value: "it", label: "IT - Information Technology", image: itImg, course: "BTECH" },
  { value: "csm", label: "CSM - Computer Science (AI & ML)", image: csSpecImg, course: "BTECH" },
  { value: "csd", label: "CSD - Computer Science (Data Science)", image: csSpecImg, course: "BTECH" },
  
  // Diploma Branches
  { value: "dme", label: "DME - Diploma in Mechanical Engineering", image: mechImg, course: "DIPLOMA" },
  { value: "dece", label: "DECE - Diploma in Electronics & Communication", image: eceImg, course: "DIPLOMA" },
  { value: "deee", label: "DEEE - Diploma in Electrical Engineering", image: eeeImg, course: "DIPLOMA" },
  { value: "dcme", label: "DCME - Diploma in Computer Engineering", image: cseImg, course: "DIPLOMA" },
  { value: "dcivil", label: "DCIVIL - Diploma in Civil Engineering", image: civilImg, course: "DIPLOMA" },
];

export const getBranchesByCourse = (course: string) => {
  return BRANCHES.filter(b => b.course === course);
};

export const getBranchLabel = (value: string) => {
  const branch = BRANCHES.find(b => b.value === value.toLowerCase());
  return branch ? branch.label : value.toUpperCase();
};

export const getBranchImage = (value: string) => {
  const branch = BRANCHES.find(b => b.value === value.toLowerCase());
  return branch ? branch.image : null;
};
