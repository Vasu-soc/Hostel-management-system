import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get current date
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    
    // Fetch all students
    const { data: students, error: fetchError } = await supabase
      .from("students")
      .select("*");
    
    if (fetchError) {
      throw new Error(`Failed to fetch students: ${fetchError.message}`);
    }
    
    const updates: { id: string; newYear: string; action: string }[] = [];
    const deletions: { id: string; rollNumber: string; reason: string }[] = [];
    
    for (const student of students || []) {
      const validityFrom = student.validity_from;
      if (!validityFrom) continue;
      
      // Parse validity_from (could be "2024", "2024-01", or "Jan 2024")
      let startYear: number;
      let startMonth: number = 1;
      
      if (/^\d{4}$/.test(validityFrom)) {
        // Just year: "2024"
        startYear = parseInt(validityFrom);
      } else if (/^\d{4}-\d{2}$/.test(validityFrom)) {
        // Year-month: "2024-01"
        const [y, m] = validityFrom.split('-').map(Number);
        startYear = y;
        startMonth = m;
      } else {
        // Try to parse as "Month Year" format
        const parts = validityFrom.split(' ');
        if (parts.length >= 2) {
          startYear = parseInt(parts[parts.length - 1]);
          const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
          const monthIdx = months.findIndex(m => parts[0].toLowerCase().startsWith(m));
          if (monthIdx >= 0) startMonth = monthIdx + 1;
        } else {
          startYear = parseInt(validityFrom);
        }
      }
      
      if (isNaN(startYear)) continue;
      
      // Calculate years elapsed
      let yearsElapsed = currentYear - startYear;
      if (currentMonth < startMonth) {
        yearsElapsed--;
      }
      
      // Determine expected year based on elapsed time
      let expectedYear: string;
      if (yearsElapsed < 0) {
        expectedYear = "1st Year";
      } else if (yearsElapsed === 0) {
        expectedYear = "1st Year";
      } else if (yearsElapsed === 1) {
        expectedYear = "2nd Year";
      } else if (yearsElapsed === 2) {
        expectedYear = "3rd Year";
      } else if (yearsElapsed === 3) {
        expectedYear = "4th Year";
      } else {
        // More than 4 years - mark for deletion/archive
        deletions.push({
          id: student.id,
          rollNumber: student.roll_number,
          reason: `Completed 4 years (started ${validityFrom})`
        });
        continue;
      }
      
      // Update if year changed
      if (student.year !== expectedYear) {
        updates.push({
          id: student.id,
          newYear: expectedYear,
          action: `${student.year} -> ${expectedYear}`
        });
      }
    }
    
    // Apply year updates
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from("students")
        .update({ year: update.newYear })
        .eq("id", update.id);
      
      if (updateError) {
        console.error(`Failed to update student ${update.id}:`, updateError);
      }
    }
    
    // Archive/delete students who completed 4 years
    // For now, we'll just delete them - could be changed to archive if needed
    for (const deletion of deletions) {
      // First, delete related records (gate passes, issues, etc.)
      await supabase.from("gate_passes").delete().eq("roll_number", deletion.rollNumber);
      await supabase.from("electrical_issues").delete().eq("roll_number", deletion.rollNumber);
      await supabase.from("food_issues").delete().eq("roll_number", deletion.rollNumber);
      
      // Then delete the student
      const { error: deleteError } = await supabase
        .from("students")
        .delete()
        .eq("id", deletion.id);
      
      if (deleteError) {
        console.error(`Failed to delete student ${deletion.id}:`, deleteError);
      }
    }
    
    console.log(`Year promotion completed: ${updates.length} updated, ${deletions.length} removed`);
    
    return new Response(
      JSON.stringify({
        success: true,
        updated: updates.length,
        removed: deletions.length,
        details: { updates, deletions }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in auto-year-promotion:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
