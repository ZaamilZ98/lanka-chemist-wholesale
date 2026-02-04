import { Resend } from "resend";
import { getStoreSettings } from "@/lib/store-settings";

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (resendClient) return resendClient;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  resendClient = new Resend(apiKey);
  return resendClient;
}

function getFromAddress(): string | null {
  return process.env.EMAIL_FROM || null;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer }[];
}

export async function sendEmail({ to, subject, html, attachments }: SendEmailOptions): Promise<boolean> {
  const resend = getResend();
  const from = getFromAddress();

  if (!resend || !from) {
    console.warn("[email] Skipping email send — RESEND_API_KEY or EMAIL_FROM not configured");
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      attachments: attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
      })),
    });

    if (error) {
      console.error("[email] Send failed:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[email] Send error:", err);
    return false;
  }
}

export async function sendAdminNotification({ subject, html }: { subject: string; html: string }): Promise<boolean> {
  const settings = await getStoreSettings();
  if (!settings.admin_email) {
    console.warn("[email] No admin_email configured in store_settings — skipping admin notification");
    return false;
  }
  return sendEmail({ to: settings.admin_email, subject, html });
}
