import {
  ORDER_STATUS_LABELS,
  DELIVERY_METHOD_LABELS,
  PAYMENT_METHOD_LABELS,
  CUSTOMER_TYPE_LABELS,
} from "@/lib/constants";

function formatCurrency(amount: number): string {
  return `Rs ${amount.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Escape HTML special characters to prevent XSS in email templates */
function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function emailLayout(content: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Lanka Chemist Wholesale</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;">
<tr><td align="center" style="padding:24px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;">
<!-- Header -->
<tr>
<td style="background-color:#1a5632;padding:24px 32px;text-align:center;">
<h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">Lanka Chemist Wholesale</h1>
<p style="margin:4px 0 0;font-size:12px;color:#a3d9b1;">Trusted Pharmaceutical Supplier</p>
</td>
</tr>
<!-- Body -->
<tr>
<td style="padding:32px;">
${content}
</td>
</tr>
<!-- Footer -->
<tr>
<td style="padding:20px 32px;background-color:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
<p style="margin:0;font-size:12px;color:#9ca3af;">
This email was sent by Lanka Chemist Wholesale.<br>
<a href="${appUrl}" style="color:#1a5632;text-decoration:none;">${appUrl}</a>
</p>
</td>
</tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// --- Order Confirmation ---

interface OrderConfirmationData {
  orderNumber: string;
  customerName: string;
  items: { name: string; genericName?: string | null; sku?: string | null; quantity: number; unitPrice: number; totalPrice: number }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryMethod: string;
  paymentMethod: string;
  deliveryAddress?: string | null;
  orderNotes?: string | null;
}

export function orderConfirmationEmail(data: OrderConfirmationData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const itemRows = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151;">
        ${escHtml(item.name)}${item.genericName ? `<br><span style="font-size:11px;color:#9ca3af;">${escHtml(item.genericName)}</span>` : ""}
      </td>
      <td style="padding:10px 8px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;text-align:center;">${item.quantity}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;text-align:right;">${formatCurrency(item.unitPrice)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111827;text-align:right;font-weight:600;">${formatCurrency(item.totalPrice)}</td>
    </tr>`,
    )
    .join("");

  const content = `
<h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">Order Confirmed</h2>
<p style="margin:0 0 24px;font-size:14px;color:#6b7280;">Hi ${escHtml(data.customerName)}, thank you for your order!</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;">
<tr>
<td style="padding:14px 16px;">
<p style="margin:0;font-size:13px;color:#166534;">Order Number: <strong>${escHtml(data.orderNumber)}</strong></p>
</td>
</tr>
</table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;margin-bottom:20px;">
<thead>
<tr style="background-color:#f9fafb;">
<th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;">Product</th>
<th style="padding:10px 8px;text-align:center;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;">Qty</th>
<th style="padding:10px 8px;text-align:right;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;">Price</th>
<th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;">Total</th>
</tr>
</thead>
<tbody>
${itemRows}
</tbody>
<tfoot>
<tr style="background-color:#f9fafb;">
<td colspan="3" style="padding:8px 12px;text-align:right;font-size:13px;color:#6b7280;">Subtotal</td>
<td style="padding:8px 12px;text-align:right;font-size:13px;font-weight:600;color:#111827;">${formatCurrency(data.subtotal)}</td>
</tr>
${
  data.deliveryFee > 0
    ? `<tr style="background-color:#f9fafb;">
<td colspan="3" style="padding:8px 12px;text-align:right;font-size:13px;color:#6b7280;">Delivery Fee</td>
<td style="padding:8px 12px;text-align:right;font-size:13px;font-weight:600;color:#111827;">${formatCurrency(data.deliveryFee)}</td>
</tr>`
    : ""
}
<tr style="background-color:#f0fdf4;">
<td colspan="3" style="padding:10px 12px;text-align:right;font-size:14px;font-weight:700;color:#111827;">Total</td>
<td style="padding:10px 12px;text-align:right;font-size:16px;font-weight:700;color:#166534;">${formatCurrency(data.total)}</td>
</tr>
</tfoot>
</table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
<tr>
<td style="padding:0 0 8px;">
<p style="margin:0;font-size:13px;color:#6b7280;">Delivery: <strong style="color:#111827;">${DELIVERY_METHOD_LABELS[data.deliveryMethod] || data.deliveryMethod}</strong></p>
${data.deliveryAddress ? `<p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">${escHtml(data.deliveryAddress)}</p>` : ""}
</td>
</tr>
<tr>
<td>
<p style="margin:0;font-size:13px;color:#6b7280;">Payment: <strong style="color:#111827;">${PAYMENT_METHOD_LABELS[data.paymentMethod] || data.paymentMethod}</strong></p>
</td>
</tr>
</table>

${data.orderNotes ? `<p style="margin:0 0 20px;font-size:12px;color:#9ca3af;font-style:italic;">Note: ${escHtml(data.orderNotes)}</p>` : ""}

<p style="margin:0 0 16px;font-size:13px;color:#6b7280;">We may contact you to confirm your order. An invoice is attached to this email.</p>

<table role="presentation" cellpadding="0" cellspacing="0">
<tr>
<td style="background-color:#1a5632;border-radius:6px;">
<a href="${appUrl}/account/orders" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">View My Orders</a>
</td>
</tr>
</table>
`;

  return emailLayout(content);
}

// --- Order Status Update ---

interface OrderStatusUpdateData {
  orderNumber: string;
  customerName: string;
  newStatus: string;
  notes?: string | null;
}

export function orderStatusUpdateEmail(data: OrderStatusUpdateData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const statusLabel = ORDER_STATUS_LABELS[data.newStatus] || data.newStatus;

  const statusColors: Record<string, { bg: string; border: string; text: string }> = {
    confirmed: { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534" },
    packing: { bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af" },
    ready: { bg: "#fefce8", border: "#fef08a", text: "#854d0e" },
    dispatched: { bg: "#f5f3ff", border: "#ddd6fe", text: "#5b21b6" },
    delivered: { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534" },
    cancelled: { bg: "#fef2f2", border: "#fecaca", text: "#991b1b" },
  };
  const colors = statusColors[data.newStatus] || { bg: "#f9fafb", border: "#e5e7eb", text: "#374151" };

  const content = `
<h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">Order Update</h2>
<p style="margin:0 0 24px;font-size:14px;color:#6b7280;">Hi ${escHtml(data.customerName)}, your order <strong>${escHtml(data.orderNumber)}</strong> has been updated.</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;background-color:${colors.bg};border:1px solid ${colors.border};border-radius:6px;">
<tr>
<td style="padding:16px;text-align:center;">
<p style="margin:0;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">New Status</p>
<p style="margin:6px 0 0;font-size:18px;font-weight:700;color:${colors.text};">${statusLabel}</p>
</td>
</tr>
</table>

${data.notes ? `<p style="margin:0 0 20px;font-size:13px;color:#6b7280;"><strong>Note:</strong> ${escHtml(data.notes)}</p>` : ""}

<table role="presentation" cellpadding="0" cellspacing="0">
<tr>
<td style="background-color:#1a5632;border-radius:6px;">
<a href="${appUrl}/account/orders" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">View Order Details</a>
</td>
</tr>
</table>
`;

  return emailLayout(content);
}

// --- Customer Approved ---

interface CustomerApprovedData {
  customerName: string;
}

export function customerApprovedEmail(data: CustomerApprovedData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const content = `
<h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">Account Approved!</h2>
<p style="margin:0 0 20px;font-size:14px;color:#6b7280;">Hi ${escHtml(data.customerName)},</p>
<p style="margin:0 0 20px;font-size:14px;color:#374151;">
Your Lanka Chemist Wholesale account has been verified and approved. You can now browse our catalog and place orders.
</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;">
<tr>
<td style="padding:16px;text-align:center;">
<p style="margin:0;font-size:15px;font-weight:600;color:#166534;">Your account is now active</p>
</td>
</tr>
</table>

<table role="presentation" cellpadding="0" cellspacing="0">
<tr>
<td style="background-color:#1a5632;border-radius:6px;">
<a href="${appUrl}/auth/login" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">Log In &amp; Start Ordering</a>
</td>
</tr>
</table>
`;

  return emailLayout(content);
}

// --- Customer Rejected ---

interface CustomerRejectedData {
  customerName: string;
  reason: string;
}

export function customerRejectedEmail(data: CustomerRejectedData): string {
  const content = `
<h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">Account Verification Update</h2>
<p style="margin:0 0 20px;font-size:14px;color:#6b7280;">Hi ${escHtml(data.customerName)},</p>
<p style="margin:0 0 16px;font-size:14px;color:#374151;">
Unfortunately, we were unable to verify your account at this time.
</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;background-color:#fef2f2;border:1px solid #fecaca;border-radius:6px;">
<tr>
<td style="padding:14px 16px;">
<p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#991b1b;text-transform:uppercase;">Reason</p>
<p style="margin:0;font-size:13px;color:#7f1d1d;">${escHtml(data.reason)}</p>
</td>
</tr>
</table>

<p style="margin:0;font-size:13px;color:#6b7280;">
If you believe this is an error, please contact us and we will review your application.
</p>
`;

  return emailLayout(content);
}

// --- Customer Suspended ---

interface CustomerSuspendedData {
  customerName: string;
  reason: string;
}

export function customerSuspendedEmail(data: CustomerSuspendedData): string {
  const content = `
<h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">Account Suspended</h2>
<p style="margin:0 0 20px;font-size:14px;color:#6b7280;">Hi ${escHtml(data.customerName)},</p>
<p style="margin:0 0 16px;font-size:14px;color:#374151;">
Your Lanka Chemist Wholesale account has been suspended.
</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;background-color:#fef2f2;border:1px solid #fecaca;border-radius:6px;">
<tr>
<td style="padding:14px 16px;">
<p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#991b1b;text-transform:uppercase;">Reason</p>
<p style="margin:0;font-size:13px;color:#7f1d1d;">${escHtml(data.reason)}</p>
</td>
</tr>
</table>

<p style="margin:0;font-size:13px;color:#6b7280;">
If you have questions about this action, please contact us.
</p>
`;

  return emailLayout(content);
}

// --- Admin: New Order Notification ---

interface AdminNewOrderData {
  orderNumber: string;
  customerName: string;
  customerType: string;
  itemCount: number;
  total: number;
  orderId: string;
}

export function adminNewOrderEmail(data: AdminNewOrderData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const content = `
<h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">New Order Received</h2>
<p style="margin:0 0 24px;font-size:14px;color:#6b7280;">A new order has been placed.</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
<tr style="background-color:#f9fafb;">
<td style="padding:10px 14px;font-size:12px;color:#6b7280;font-weight:600;width:40%;">Order Number</td>
<td style="padding:10px 14px;font-size:14px;color:#111827;font-weight:700;">${escHtml(data.orderNumber)}</td>
</tr>
<tr>
<td style="padding:10px 14px;font-size:12px;color:#6b7280;font-weight:600;border-top:1px solid #f3f4f6;">Customer</td>
<td style="padding:10px 14px;font-size:13px;color:#374151;border-top:1px solid #f3f4f6;">${escHtml(data.customerName)} (${CUSTOMER_TYPE_LABELS[data.customerType] || escHtml(data.customerType)})</td>
</tr>
<tr>
<td style="padding:10px 14px;font-size:12px;color:#6b7280;font-weight:600;border-top:1px solid #f3f4f6;">Items</td>
<td style="padding:10px 14px;font-size:13px;color:#374151;border-top:1px solid #f3f4f6;">${data.itemCount} item${data.itemCount !== 1 ? "s" : ""}</td>
</tr>
<tr style="background-color:#f0fdf4;">
<td style="padding:10px 14px;font-size:12px;color:#6b7280;font-weight:600;border-top:1px solid #f3f4f6;">Total</td>
<td style="padding:10px 14px;font-size:16px;color:#166534;font-weight:700;border-top:1px solid #f3f4f6;">${formatCurrency(data.total)}</td>
</tr>
</table>

<table role="presentation" cellpadding="0" cellspacing="0">
<tr>
<td style="background-color:#1a5632;border-radius:6px;">
<a href="${appUrl}/admin/orders/${data.orderId}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">View Order</a>
</td>
</tr>
</table>
`;

  return emailLayout(content);
}

// --- Admin: New Registration Notification ---

interface AdminNewRegistrationData {
  customerName: string;
  customerType: string;
  email: string;
  customerId: string;
}

export function adminNewRegistrationEmail(data: AdminNewRegistrationData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const content = `
<h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">New Registration</h2>
<p style="margin:0 0 24px;font-size:14px;color:#6b7280;">A new customer has registered and is pending verification.</p>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
<tr style="background-color:#f9fafb;">
<td style="padding:10px 14px;font-size:12px;color:#6b7280;font-weight:600;width:40%;">Name</td>
<td style="padding:10px 14px;font-size:14px;color:#111827;font-weight:600;">${escHtml(data.customerName)}</td>
</tr>
<tr>
<td style="padding:10px 14px;font-size:12px;color:#6b7280;font-weight:600;border-top:1px solid #f3f4f6;">Type</td>
<td style="padding:10px 14px;font-size:13px;color:#374151;border-top:1px solid #f3f4f6;">${CUSTOMER_TYPE_LABELS[data.customerType] || escHtml(data.customerType)}</td>
</tr>
<tr>
<td style="padding:10px 14px;font-size:12px;color:#6b7280;font-weight:600;border-top:1px solid #f3f4f6;">Email</td>
<td style="padding:10px 14px;font-size:13px;color:#374151;border-top:1px solid #f3f4f6;">${escHtml(data.email)}</td>
</tr>
</table>

<table role="presentation" cellpadding="0" cellspacing="0">
<tr>
<td style="background-color:#1a5632;border-radius:6px;">
<a href="${appUrl}/admin/customers/${data.customerId}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">Review Application</a>
</td>
</tr>
</table>
`;

  return emailLayout(content);
}
