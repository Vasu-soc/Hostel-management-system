import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
// Make recipient configurable so you can change it without redeploying.
// NOTE: Resend testing accounts can only send to the account owner's email.
const WARDEN_EMAIL = Deno.env.get("WARDEN_EMAIL") || "immarajuvasu2@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestNotificationPayload {
  type: "hostel_application" | "gate_pass" | "electrical_issue" | "food_issue";
  studentName: string;
  rollNumber?: string;
  gender?: string;
  roomType?: string;
  acType?: string;
  purpose?: string;
  outDate?: string;
  inDate?: string;
  description?: string;
  roomNumber?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const payload: RequestNotificationPayload = await req.json();
    const { type, studentName, rollNumber, gender, roomType, acType, purpose, outDate, inDate, description, roomNumber } = payload;

    let subject: string;
    let htmlContent: string;

    switch (type) {
      case "hostel_application":
        subject = `🏠 New Hostel Application - ${studentName}`;
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 20px; border-radius: 0 0 10px 10px; }
              .info-box { background: #e0e7ff; padding: 15px; border-radius: 8px; margin: 15px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🏠 New Hostel Application</h1>
              </div>
              <div class="content">
                <p>A new hostel application has been submitted.</p>
                <div class="info-box">
                  <p><strong>Student Name:</strong> ${studentName}</p>
                  <p><strong>Gender:</strong> ${gender === "boy" ? "Male (Boys Hostel)" : "Female (Girls Hostel)"}</p>
                  <p><strong>Room Type:</strong> ${roomType}</p>
                  <p><strong>AC/Non-AC:</strong> ${acType === "ac" ? "AC Room" : "Non-AC Room"}</p>
                </div>
                <p>Please login to the Warden Dashboard to review and take action on this application.</p>
                <p style="margin-top: 20px;">
                  <a href="https://hostel-ihub.lovable.app/warden-login" style="background: #3b82f6; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">Go to Dashboard</a>
                </p>
              </div>
              <div class="footer">
                <p>GIST Hostel Management System</p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      case "gate_pass":
        subject = `🎫 New Gate Pass Request - ${studentName} (${rollNumber})`;
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f59e0b, #ef4444); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 20px; border-radius: 0 0 10px 10px; }
              .info-box { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 15px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎫 New Gate Pass Request</h1>
              </div>
              <div class="content">
                <p>A student has submitted a gate pass request.</p>
                <div class="info-box">
                  <p><strong>Student Name:</strong> ${studentName}</p>
                  <p><strong>Roll Number:</strong> ${rollNumber}</p>
                  <p><strong>Out Date:</strong> ${outDate}</p>
                  <p><strong>In Date:</strong> ${inDate}</p>
                  <p><strong>Purpose:</strong> ${purpose}</p>
                </div>
                <p>Please login to the Warden Dashboard to approve or reject this request.</p>
                <p style="margin-top: 20px;">
                  <a href="https://hostel-ihub.lovable.app/warden-login" style="background: #f59e0b; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">Go to Dashboard</a>
                </p>
              </div>
              <div class="footer">
                <p>GIST Hostel Management System</p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      case "electrical_issue":
        subject = `⚡ Electrical Issue Reported - Room ${roomNumber}`;
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #eab308, #f59e0b); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 20px; border-radius: 0 0 10px 10px; }
              .info-box { background: #fef9c3; padding: 15px; border-radius: 8px; margin: 15px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⚡ Electrical Issue Report</h1>
              </div>
              <div class="content">
                <p>A student has reported an electrical issue.</p>
                <div class="info-box">
                  <p><strong>Student Name:</strong> ${studentName}</p>
                  <p><strong>Roll Number:</strong> ${rollNumber}</p>
                  <p><strong>Room Number:</strong> ${roomNumber}</p>
                  <p><strong>Issue:</strong> ${description}</p>
                </div>
                <p>Please take necessary action to resolve this issue.</p>
              </div>
              <div class="footer">
                <p>GIST Hostel Management System</p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      case "food_issue":
        subject = `🍽️ Food Issue Reported - ${studentName}`;
        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 20px; border-radius: 0 0 10px 10px; }
              .info-box { background: #fee2e2; padding: 15px; border-radius: 8px; margin: 15px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🍽️ Food Issue Report</h1>
              </div>
              <div class="content">
                <p>A student has reported a food issue.</p>
                <div class="info-box">
                  <p><strong>Student Name:</strong> ${studentName}</p>
                  <p><strong>Roll Number:</strong> ${rollNumber}</p>
                  <p><strong>Issue:</strong> ${description}</p>
                </div>
                <p>Please take necessary action to resolve this issue.</p>
              </div>
              <div class="footer">
                <p>GIST Hostel Management System</p>
              </div>
            </div>
          </body>
          </html>
        `;
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Invalid notification type" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "GIST Hostel <onboarding@resend.dev>",
        to: [WARDEN_EMAIL],
        subject,
        html: htmlContent,
      }),
    });

    const emailResponse = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", emailResponse);

      // Resend free/testing limitation: can only send to your own Resend account email.
      // Don't crash the UI with a 500; return a 200 with a clear warning instead.
      const message = (emailResponse?.message || "Failed to send email") as string;
      const isTestingRestriction =
        typeof message === "string" &&
        message.includes("You can only send testing emails to your own email address");

      if (isTestingRestriction) {
        return new Response(
          JSON.stringify({
            ok: false,
            skipped: true,
            reason: "resend_testing_restriction",
            message,
            intendedRecipient: WARDEN_EMAIL,
            hint:
              "Verify your sending domain in Resend and use a from-address on that domain, or set WARDEN_EMAIL to your Resend account email for testing.",
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      return new Response(
        JSON.stringify({ error: message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Notification email sent successfully:", emailResponse);
    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-request-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
