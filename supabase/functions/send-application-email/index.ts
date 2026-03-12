// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// @ts-ignore
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ApplicationEmailRequest {
  email: string;
  studentName: string;
  status: "accepted" | "rejected";
  roomType?: string;
  acType?: string;
  username?: string;
  password?: string;
}

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000; // 1 second

// Sleep helper function
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Send email with retry logic
async function sendEmailWithRetry(
  emailPayload: { from: string; to: string[]; subject: string; html: string },
  retryCount = 0
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailPayload),
    });

    const emailResponse: any = await res.json();

    // Handle rate limiting (429)
    if (res.status === 429 && retryCount < MAX_RETRIES) {
      const delay = INITIAL_DELAY_MS * Math.pow(2, retryCount); // Exponential backoff
      console.log(`Rate limited. Retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await sleep(delay);
      return sendEmailWithRetry(emailPayload, retryCount + 1);
    }

    if (!res.ok) {
      console.error("Resend API error:", emailResponse);
      return { 
        success: false, 
        error: emailResponse.message || "Failed to send email" 
      };
    }

    console.log("Email sent successfully:", emailResponse);
    return { success: true, data: emailResponse };
  } catch (error: any) {
    console.error("Error sending email:", error);
    
    // Retry on network errors
    if (retryCount < MAX_RETRIES) {
      const delay = INITIAL_DELAY_MS * Math.pow(2, retryCount);
      console.log(`Network error. Retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await sleep(delay);
      return sendEmailWithRetry(emailPayload, retryCount + 1);
    }
    
    return { success: false, error: error.message };
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, studentName, status, roomType, acType, username, password } = await req.json() as ApplicationEmailRequest;

    if (!email || !studentName || !status) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let subject: string;
    let htmlContent: string;

    if (status === "accepted") {
      subject = "🎉 Hostel Application Accepted - GIST";
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #16a34a, #22c55e); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .highlight { background: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Application Accepted!</h1>
            </div>
            <div class="content">
              <p>Dear <strong>${studentName}</strong>,</p>
              
              <p>Congratulations! We are pleased to inform you that your hostel application has been <strong>ACCEPTED</strong>.</p>
              
              <div class="highlight">
                <h3>📋 Application Details:</h3>
                <p><strong>Room Type:</strong> ${roomType || "As per your selection"}</p>
                <p><strong>AC/Non-AC:</strong> ${acType === "ac" ? "AC Room" : "Non-AC Room"}</p>
              </div>

              ${username && password ? `
              <div class="highlight" style="background: #e0f2fe; border: 1px solid #bae6fd;">
                <h3>🔐 Login Credentials:</h3>
                <p>You can now login to the student portal using these credentials:</p>
                <p><strong>Username:</strong> ${username}</p>
                <p><strong>Password:</strong> ${password}</p>
                <p><i>Note: You will be prompted to change your password upon your first login.</i></p>
              </div>
              ` : ''}
              
              <h3>📌 Next Steps:</h3>
              <ol>
                <li>Visit the hostel office to complete your registration</li>
                <li>Pay the hostel fee at the accounts department</li>
                <li>Collect your room key from the warden</li>
                <li>Submit required documents (ID proof, 2 passport photos)</li>
              </ol>
              
              <p>Please complete the formalities within <strong>7 working days</strong> to secure your room.</p>
              
              <p>If you have any questions, please contact the hostel warden.</p>
              
              <p>Welcome to the hostel family!</p>
              
              <p>Best Regards,<br>
              <strong>Hostel Management</strong><br>
              Geethanjali Institute of Science & Technology</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply directly to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      subject = "Hostel Application Status - GIST";
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #dc2626, #ef4444); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .highlight { background: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Application Status Update</h1>
            </div>
            <div class="content">
              <p>Dear <strong>${studentName}</strong>,</p>
              
              <p>Thank you for your interest in our hostel accommodation at Geethanjali Institute of Science & Technology.</p>
              
              <div class="highlight">
                <p>We regret to inform you that your hostel application could not be approved at this time.</p>
              </div>
              
              <h3>📋 Possible Reasons:</h3>
              <ul>
                <li>All rooms of your selected type are currently occupied</li>
                <li>The hostel capacity for the current semester has been reached</li>
                <li>Incomplete or missing documentation</li>
              </ul>
              
              <h3>🔄 What You Can Do:</h3>
              <ol>
                <li>Apply again when vacancies open up</li>
                <li>Consider selecting a different room type</li>
                <li>Contact the hostel office for more information</li>
                <li>Join the waiting list for future vacancies</li>
              </ol>
              
              <p>We appreciate your understanding and encourage you to reapply when rooms become available.</p>
              
              <p>For any queries, please contact the hostel warden office.</p>
              
              <p>Best Regards,<br>
              <strong>Hostel Management</strong><br>
              Geethanjali Institute of Science & Technology</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply directly to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    // Send email with retry logic
    const result = await sendEmailWithRetry({
      from: "Hostel Management <onboarding@resend.dev>",
      to: [email],
      subject,
      html: htmlContent,
    });

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: result.error }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(JSON.stringify(result.data), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-application-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
