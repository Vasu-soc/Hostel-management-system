import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email?: string;
  mobileNumber?: string;
  rollNumber?: string;
  username?: string;
  userType: "student" | "warden" | "parent" | "admin";
  baseUrl: string;
}

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Required environment variables are not configured");
      return new Response(
        JSON.stringify({ error: "Service not configured properly" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { email, mobileNumber, rollNumber, username, userType, baseUrl }: PasswordResetRequest = await req.json();

    console.log(`Password reset request for ${userType}:`, { email, mobileNumber, rollNumber, username });

    let userEmail: string | null = null;
    let userIdentifier: string = "";
    let userName: string = "";

    // Find user based on type
    if (userType === "student") {
      // For students, we need email - they can provide roll number OR email
      if (!email && !rollNumber) {
        return new Response(
          JSON.stringify({ error: "Email is required" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      
      // Find by email first
      let student = null;
      if (email) {
        const { data, error } = await supabase
          .from("students")
          .select("email, student_name, roll_number")
          .eq("email", email.toLowerCase().trim())
          .maybeSingle();
        if (!error) student = data;
      }
      
      // If not found by email and rollNumber provided, try rollNumber
      if (!student && rollNumber) {
        const { data, error } = await supabase
          .from("students")
          .select("email, student_name, roll_number")
          .eq("roll_number", rollNumber.toUpperCase())
          .maybeSingle();
        if (!error) student = data;
      }

      if (!student) {
        return new Response(
          JSON.stringify({ error: "Student not found with this email" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (!student.email) {
        return new Response(
          JSON.stringify({ error: "No email registered for this student. Please contact the hostel office." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      userEmail = student.email;
      userIdentifier = student.roll_number;
      userName = student.student_name;

    } else if (userType === "warden") {
      if (!username) {
        return new Response(
          JSON.stringify({ error: "Username is required" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      
      // For warden, we need to use the email they provide since wardens table doesn't have email
      if (!email) {
        return new Response(
          JSON.stringify({ error: "Email is required for password reset" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const { data: warden, error } = await supabase
        .from("wardens")
        .select("name, username")
        .eq("username", username)
        .maybeSingle();

      if (error || !warden) {
        return new Response(
          JSON.stringify({ error: "Warden not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      userEmail = email;
      userIdentifier = warden.username;
      userName = warden.name;

    } else if (userType === "parent") {
      if (!mobileNumber) {
        return new Response(
          JSON.stringify({ error: "Mobile number is required" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      
      if (!email) {
        return new Response(
          JSON.stringify({ error: "Email is required for password reset" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const { data: parent, error } = await supabase
        .from("parents")
        .select("parent_name, mobile_number")
        .eq("mobile_number", mobileNumber)
        .maybeSingle();

      if (error || !parent) {
        return new Response(
          JSON.stringify({ error: "Parent not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      userEmail = email;
      userIdentifier = parent.mobile_number;
      userName = parent.parent_name;

    } else if (userType === "admin") {
      if (!username) {
        return new Response(
          JSON.stringify({ error: "Username is required" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      
      if (!email) {
        return new Response(
          JSON.stringify({ error: "Email is required for password reset" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const { data: admin, error } = await supabase
        .from("admins")
        .select("name, username")
        .eq("username", username)
        .maybeSingle();

      if (error || !admin) {
        return new Response(
          JSON.stringify({ error: "Admin not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      userEmail = email;
      userIdentifier = admin.username;
      userName = admin.name;
    }

    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: "Could not find email for user" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate token and expiry
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token in database
    const { error: insertError } = await supabase
      .from("password_reset_tokens")
      .insert({
        user_type: userType,
        user_identifier: userIdentifier,
        token: token,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error storing reset token:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to generate reset token" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create reset link
    const resetLink = `${baseUrl}/reset-password?token=${token}&type=${userType}`;

    // Send email using fetch to Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "GIST Hostel <onboarding@resend.dev>",
        to: [userEmail],
        subject: "Password Reset - Geethanjali Institute of Science & Technology",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
              .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
              .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Password Reset Request</h1>
                <p>Geethanjali Institute of Science & Technology</p>
              </div>
              <div class="content">
                <p>Dear <strong>${userName}</strong>,</p>
                <p>We received a request to reset your password for your hostel management account.</p>
                
                <p style="text-align: center;">
                  <a href="${resetLink}" class="button">Reset My Password</a>
                </p>
                
                <div class="warning">
                  <strong>⚠️ Important:</strong>
                  <ul style="margin: 10px 0;">
                    <li>This link will expire in <strong>1 hour</strong></li>
                    <li>If you didn't request this, please ignore this email</li>
                    <li>Never share this link with anyone</li>
                  </ul>
                </div>
                
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px; font-size: 12px;">${resetLink}</p>
                
                <p>Best regards,<br><strong>Hostel Administration</strong></p>
              </div>
              <div class="footer">
                <p>Geethanjali Institute of Science & Technology</p>
                <p>3rd Mile, Nellore-Bombay Highway, Gangavaram (V), Kovur (M), Nellore District, Andhra Pradesh</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const emailData = await emailResponse.json();

    console.log("Password reset email sent successfully:", emailData);

    // Mask email for response
    const maskedEmail = userEmail.replace(/(.{2})(.*)(@.*)/, "$1***$3");

    return new Response(
      JSON.stringify({ success: true, message: `Password reset link sent to ${maskedEmail}` }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in send-password-reset-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
