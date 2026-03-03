import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface GatePassEmailRequest {
  email: string;
  studentName: string;
  status: "approved" | "rejected";
  outDate: string;
  inDate: string;
  purpose: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { email, studentName, status, outDate, inDate, purpose }: GatePassEmailRequest = await req.json();

    if (!email || !studentName || !status) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Sending gate pass ${status} email to: ${email}`);

    let subject: string;
    let htmlContent: string;

    if (status === "approved") {
      subject = "Gate Pass Approved - Geethanjali Institute of Science & Technology";
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
            .status-badge { display: inline-block; background: #d1fae5; color: #065f46; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
            .details { background: white; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-row:last-child { border-bottom: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Gate Pass Approved!</h1>
              <p>Geethanjali Institute of Science & Technology</p>
            </div>
            <div class="content">
              <p>Dear <strong>${studentName}</strong>,</p>
              <p>Great news! Your gate pass request has been <span class="status-badge">APPROVED</span></p>
              
              <div class="details">
                <h3>Gate Pass Details:</h3>
                <div class="detail-row"><span>Out Date:</span><span><strong>${outDate}</strong></span></div>
                <div class="detail-row"><span>Return Date:</span><span><strong>${inDate}</strong></span></div>
                <div class="detail-row"><span>Purpose:</span><span><strong>${purpose}</strong></span></div>
              </div>
              
              <p><strong>Important Instructions:</strong></p>
              <ul>
                <li>Please carry this email or show it at the hostel gate</li>
                <li>Ensure you return by the specified date and time</li>
                <li>Report to the hostel warden upon your return</li>
                <li>Keep your parents/guardians informed about your travel</li>
              </ul>
              
              <p>Have a safe journey!</p>
              <p>Best regards,<br><strong>Hostel Administration</strong></p>
            </div>
            <div class="footer">
              <p>Geethanjali Institute of Science & Technology</p>
              <p>3rd Mile, Nellore-Bombay Highway, Gangavaram (V), Kovur (M), Nellore District, Andhra Pradesh</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      subject = "Gate Pass Rejected - Geethanjali Institute of Science & Technology";
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
            .status-badge { display: inline-block; background: #fee2e2; color: #991b1b; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
            .details { background: white; padding: 15px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Gate Pass Status Update</h1>
              <p>Geethanjali Institute of Science & Technology</p>
            </div>
            <div class="content">
              <p>Dear <strong>${studentName}</strong>,</p>
              <p>We regret to inform you that your gate pass request has been <span class="status-badge">REJECTED</span></p>
              
              <div class="details">
                <h3>Request Details:</h3>
                <p><strong>Out Date:</strong> ${outDate}</p>
                <p><strong>Return Date:</strong> ${inDate}</p>
                <p><strong>Purpose:</strong> ${purpose}</p>
              </div>
              
              <p><strong>Possible reasons for rejection:</strong></p>
              <ul>
                <li>Incomplete or insufficient information provided</li>
                <li>Academic commitments during the requested period</li>
                <li>Previous pending gate passes not completed</li>
                <li>Other administrative reasons</li>
              </ul>
              
              <p>If you have any questions or need clarification, please contact your hostel warden directly.</p>
              
              <p>Best regards,<br><strong>Hostel Administration</strong></p>
            </div>
            <div class="footer">
              <p>Geethanjali Institute of Science & Technology</p>
              <p>3rd Mile, Nellore-Bombay Highway, Gangavaram (V), Kovur (M), Nellore District, Andhra Pradesh</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "GIST Hostel <onboarding@resend.dev>",
        to: [email],
        subject: subject,
        html: htmlContent,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailData);

      // Handle Resend testing restriction gracefully
      const message = (emailData?.message || "Failed to send email") as string;
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
            intendedRecipient: email,
            hint: "To send emails to any student, verify your domain (hostel-ihub.com) at resend.com/domains with proper DNS records (MX, TXT, DKIM).",
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      return new Response(
        JSON.stringify({ error: message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Gate pass email sent successfully to:", email, emailData);

    return new Response(JSON.stringify({ ok: true, ...emailData }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-gate-pass-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
