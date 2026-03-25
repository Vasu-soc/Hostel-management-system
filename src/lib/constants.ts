import cseImg from "@/assets/branches/cse.png";
import aimlImg from "@/assets/branches/aiml.png";
import dsImg from "@/assets/branches/ds.png";
import eceImg from "@/assets/branches/ece.png";
import eeeImg from "@/assets/branches/eee.png";
import mechImg from "@/assets/branches/mech.png";
import civilImg from "@/assets/branches/civil.png";
import itImg from "@/assets/branches/it.png";
import csSpecImg from "@/assets/branches/cs_spec.png";

export const BRANCHES = [
  { value: "cse", label: "CSE - Computer Science Engineering", image: cseImg },
  { value: "aiml", label: "AIML - Artificial Intelligence & Machine Learning", image: aimlImg },
  { value: "ds", label: "DS - Data Science", image: dsImg },
  { value: "ece", label: "ECE - Electronics & Communication Engineering", image: eceImg },
  { value: "eee", label: "EEE - Electrical & Electronics Engineering", image: eeeImg },
  { value: "mech", label: "MECH - Mechanical Engineering", image: mechImg },
  { value: "civil", label: "CIVIL - Civil Engineering", image: civilImg },
  { value: "it", label: "IT - Information Technology", image: itImg },
  { value: "csm", label: "CSM - Computer Science (AI & ML)", image: csSpecImg },
  { value: "csd", label: "CSD - Computer Science (Data Science)", image: csSpecImg },
  { value: "dme", label: "DME - Diploma in Mechanical Engineering", image: mechImg },
  { value: "dece", label: "DECE - Diploma in Electronics & Communication", image: eceImg },
  { value: "deee", label: "DEEE - Diploma in Electrical Engineering", image: eeeImg },
  { value: "dcme", label: "DCME - Diploma in Computer Engineering", image: cseImg },
  { value: "dcivil", label: "DCIVIL - Diploma in Civil Engineering", image: civilImg },
];

export const getBranchLabel = (value: string) => {
  const branch = BRANCHES.find(b => b.value === value.toLowerCase());
  return branch ? branch.label : value.toUpperCase();
};

export const getBranchImage = (value: string) => {
  const branch = BRANCHES.find(b => b.value === value.toLowerCase());
  return branch ? branch.image : null;
};
