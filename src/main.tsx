import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Preload carousel images immediately on app start
import hostelBuilding from "@/assets/hostel-building.png";
import hostelCorridor from "@/assets/hostel-corridor.png";
import hostelMess from "@/assets/hostel-mess.png";
import roomSingle from "@/assets/room-single.png";
import roomDoubleNew from "@/assets/room-double-new.png";
import roomTriple from "@/assets/room-triple.png";
import roomFourNew from "@/assets/room-four-new.png";
import roomDormNew from "@/assets/room-dorm-new.png";
import hostelAi1 from "@/assets/hostel-ai-1.png";
import hostelAi2 from "@/assets/hostel-ai-2.png";
import hostelAi3 from "@/assets/hostel-ai-3.png";
import hostelAi4 from "@/assets/hostel-ai-4.png";
import hostelAi5 from "@/assets/hostel-ai-5.png";
import hostelAi6 from "@/assets/hostel-ai-6.png";
import hostelAi7 from "@/assets/hostel-ai-7.png";
import hostelAi8 from "@/assets/hostel-ai-8.png";

// Preload all images during splash screen
const imagesToPreload = [
  hostelBuilding, hostelCorridor, hostelMess, roomSingle, roomDoubleNew,
  roomTriple, roomFourNew, roomDormNew, hostelAi1, hostelAi2, hostelAi3,
  hostelAi4, hostelAi5, hostelAi6, hostelAi7, hostelAi8
];

imagesToPreload.forEach((src) => {
  const img = new Image();
  img.src = src;
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
