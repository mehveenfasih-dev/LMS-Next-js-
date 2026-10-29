import "server-only";
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.EMAIL_FROM ?? "Book Hub <notifications@bookhub.library>";

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export type SendEmailOptions = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

/**
 * Dispatches an email using Resend or falls back to standard SMTP / logging.
 */
export async function sendEmail(options: SendEmailOptions) {
  if (resend) {
    try {
      const response = await resend.emails.send({
        from: fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      return { success: true, id: response.data?.id };
    } catch (err) {
      console.error("[Email Error] Failed to send email via Resend:", err);
      return { success: false, error: err };
    }
  }

  // Development / Test fallback: Log formatted email
  console.info(`[Email Fallback - Dev Mode] To: ${options.to}`);
  console.info(`Subject: ${options.subject}`);
  console.info(`Body preview: ${options.text ?? options.html.slice(0, 120)}...`);
  return { success: true, id: "simulated-dev-id" };
}

/**
 * Transactional Email: Welcome & Account Activation
 */
export async function sendWelcomeEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}) {
  return sendEmail({
    to,
    subject: "Welcome to Book Hub Library",
    text: `Hello ${name}, welcome to Book Hub! Your member account is active and you can now browse titles and request books.`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #0284c7;">Welcome to Book Hub, ${name}!</h2>
        <p>Your library member account is now active.</p>
        <p>You can discover classic and modern literature, request copies, and track your loans directly from the member portal.</p>
        <p style="margin-top: 24px;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/catalog" 
             style="background: #0284c7; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px;">
            Browse the Catalog
          </a>
        </p>
      </div>
    `,
  });
}

/**
 * Transactional Email: Borrowing Request Status Notification
 */
export async function sendBorrowRequestStatusEmail({
  to,
  name,
  bookTitle,
  status,
}: {
  to: string;
  name: string;
  bookTitle: string;
  status: "approved" | "rejected" | "returned";
}) {
  const statusMessages = {
    approved: "Your borrowing request has been approved! The title is now reserved for pickup at the front desk.",
    rejected: "Unfortunately, your borrowing request could not be approved at this time.",
    returned: "Thank you for returning the book. It has been checked back into the library collection.",
  };

  return sendEmail({
    to,
    subject: `Update on your loan request: ${bookTitle}`,
    text: `Hello ${name},\n\n${statusMessages[status]}\n\nTitle: ${bookTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h3 style="color: #1e293b;">Loan Status Update</h3>
        <p>Hello <strong>${name}</strong>,</p>
        <p>${statusMessages[status]}</p>
        <div style="background: #f1f5f9; border-left: 4px solid #0284c7; padding: 12px; margin: 16px 0;">
          <strong>Book:</strong> ${bookTitle}<br/>
          <strong>Status:</strong> ${status.toUpperCase()}
        </div>
        <p><a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/my-requests">View your active loans</a></p>
      </div>
    `,
  });
}

/**
 * Transactional Email: Payment Receipt
 */
export async function sendPaymentReceiptEmail({
  to,
  name,
  amount,
  description,
  receiptUrl,
}: {
  to: string;
  name: string;
  amount: string;
  description: string;
  receiptUrl?: string;
}) {
  return sendEmail({
    to,
    subject: `Receipt for ${description}`,
    text: `Hello ${name}, thank you for your payment of ${amount} for ${description}.`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h3 style="color: #0f172a;">Payment Confirmation</h3>
        <p>Hello ${name},</p>
        <p>Thank you for your payment of <strong>${amount}</strong> for <em>${description}</em>.</p>
        ${
          receiptUrl
            ? `<p><a href="${receiptUrl}" style="color: #0284c7;">View Online Receipt</a></p>`
            : ""
        }
      </div>
    `,
  });
}
