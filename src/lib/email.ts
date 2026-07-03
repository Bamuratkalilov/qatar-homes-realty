import { Resend } from "resend"

export const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendFollowUpEmail({
  to,
  clientName,
  agentName,
  subject,
  body,
}: {
  to: string
  clientName: string
  agentName: string
  subject: string
  body: string
}) {
  return resend.emails.send({
    from: process.env.EMAIL_FROM || "noreply@youragency.com",
    to,
    subject,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="background: linear-gradient(135deg, #1e3a5f, #2563eb); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${process.env.NEXT_PUBLIC_AGENCY_NAME || "Qatar Homes Realty"}</h1>
            <p style="color: #93c5fd; margin: 5px 0 0;">Your trusted Qatar real estate partner</p>
          </div>
          <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
            <p>Dear ${clientName},</p>
            ${body.split("\n").map((p) => `<p>${p}</p>`).join("")}
            <br/>
            <p style="color: #64748b;">Best regards,<br/><strong>${agentName}</strong><br/>${process.env.NEXT_PUBLIC_AGENCY_NAME || "Qatar Homes Realty"}<br/>${process.env.NEXT_PUBLIC_AGENCY_PHONE || ""}</p>
          </div>
          <div style="background: #1e3a5f; padding: 15px; border-radius: 0 0 8px 8px; text-align: center;">
            <p style="color: #93c5fd; font-size: 12px; margin: 0;">© 2025 ${process.env.NEXT_PUBLIC_AGENCY_NAME || "Qatar Homes Realty"}. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
  })
}

export async function sendAppointmentConfirmation({
  to,
  clientName,
  agentName,
  appointmentDate,
  appointmentTime,
  propertyAddress,
  type,
}: {
  to: string
  clientName: string
  agentName: string
  appointmentDate: string
  appointmentTime: string
  propertyAddress?: string
  type: string
}) {
  return resend.emails.send({
    from: process.env.EMAIL_FROM || "noreply@youragency.com",
    to,
    subject: `Appointment Confirmed - ${type} on ${appointmentDate}`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="background: linear-gradient(135deg, #1e3a5f, #2563eb); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">${process.env.NEXT_PUBLIC_AGENCY_NAME || "Qatar Homes Realty"}</h1>
          </div>
          <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
            <h2 style="color: #1e3a5f;">Appointment Confirmed</h2>
            <p>Dear ${clientName},</p>
            <p>Your appointment has been confirmed. Here are the details:</p>
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p><strong>Type:</strong> ${type}</p>
              <p><strong>Date:</strong> ${appointmentDate}</p>
              <p><strong>Time:</strong> ${appointmentTime}</p>
              ${propertyAddress ? `<p><strong>Location:</strong> ${propertyAddress}</p>` : ""}
              <p><strong>Agent:</strong> ${agentName}</p>
              <p><strong>Contact:</strong> ${process.env.NEXT_PUBLIC_AGENCY_PHONE || ""}</p>
            </div>
            <p>If you need to reschedule, please contact us at least 24 hours in advance.</p>
            <p>Best regards,<br/><strong>${agentName}</strong></p>
          </div>
        </body>
      </html>
    `,
  })
}
