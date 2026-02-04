import { createServerClient } from "@/lib/supabase/server";
import { sendEmail, sendAdminNotification } from "@/lib/email";
import {
  orderConfirmationEmail,
  orderStatusUpdateEmail,
  customerApprovedEmail,
  customerRejectedEmail,
  customerSuspendedEmail,
  adminNewOrderEmail,
  adminNewRegistrationEmail,
} from "@/lib/email-templates";
import { generateInvoice, type InvoiceResult } from "@/lib/invoice";

// Fire-and-forget wrapper that never throws
function fireAndForget(fn: () => Promise<void>): void {
  Promise.resolve()
    .then(fn)
    .catch((err) => console.error("[notification] Unhandled error:", err));
}

// --- New Order ---

interface ProcessNewOrderParams {
  orderId: string;
  orderNumber: string;
  customerId: string;
}

export function processNewOrder({ orderId, orderNumber, customerId }: ProcessNewOrderParams): void {
  fireAndForget(async () => {
    const supabase = createServerClient();

    // Fetch order details for email
    const { data: order } = await supabase
      .from("orders")
      .select(
        `id, order_number, subtotal, delivery_fee, total, delivery_method, payment_method, order_notes, created_at,
         customers(contact_name, business_name, email, customer_type),
         delivery_address:customer_addresses(address_line1, address_line2, city, district, postal_code),
         order_items(product_name, product_generic_name, product_sku, quantity, unit_price, total_price)`,
      )
      .eq("id", orderId)
      .single();

    if (!order) {
      console.error(`[notification] Order not found: ${orderId}`);
      return;
    }

    const customer = order.customers as unknown as {
      contact_name: string;
      business_name: string | null;
      email: string;
      customer_type: string;
    };
    const items = order.order_items as unknown as {
      product_name: string;
      product_generic_name: string | null;
      product_sku: string | null;
      quantity: number;
      unit_price: number;
      total_price: number;
    }[];
    const address = order.delivery_address as unknown as {
      address_line1: string;
      address_line2: string | null;
      city: string;
      district: string;
      postal_code: string | null;
    } | null;

    // 1. Generate invoice PDF (independent try/catch)
    let invoiceResult: InvoiceResult | null = null;
    try {
      invoiceResult = await generateInvoice(orderId);
      console.log(`[notification] Invoice generated for order ${orderNumber}`);
    } catch (err) {
      console.error(`[notification] Invoice generation failed for order ${orderNumber}:`, err);
    }

    // 2. Email customer (independent try/catch)
    try {
      const addressStr = address
        ? [address.address_line1, address.address_line2, address.city, address.district, address.postal_code]
            .filter(Boolean)
            .join(", ")
        : null;

      const html = orderConfirmationEmail({
        orderNumber: order.order_number,
        customerName: customer.contact_name,
        items: items.map((i) => ({
          name: i.product_name,
          genericName: i.product_generic_name,
          sku: i.product_sku,
          quantity: i.quantity,
          unitPrice: i.unit_price,
          totalPrice: i.total_price,
        })),
        subtotal: order.subtotal,
        deliveryFee: order.delivery_fee,
        total: order.total,
        deliveryMethod: order.delivery_method,
        paymentMethod: order.payment_method,
        deliveryAddress: addressStr,
        orderNotes: order.order_notes,
      });

      await sendEmail({
        to: customer.email,
        subject: `Order Confirmed — ${order.order_number}`,
        html,
        attachments: invoiceResult
          ? [{ filename: `INV-${order.order_number}.pdf`, content: invoiceResult.buffer }]
          : undefined,
      });
    } catch (err) {
      console.error(`[notification] Customer email failed for order ${orderNumber}:`, err);
    }

    // 3. Notify admin (independent try/catch)
    try {
      const html = adminNewOrderEmail({
        orderNumber: order.order_number,
        customerName: customer.contact_name,
        customerType: customer.customer_type,
        itemCount: items.length,
        total: order.total,
        orderId: order.id,
      });

      await sendAdminNotification({
        subject: `New Order — ${order.order_number} (${items.length} items)`,
        html,
      });
    } catch (err) {
      console.error(`[notification] Admin notification failed for order ${orderNumber}:`, err);
    }
  });
}

// --- Order Status Change ---

interface ProcessOrderStatusChangeParams {
  orderId: string;
  newStatus: string;
  notes?: string | null;
}

export function processOrderStatusChange({ orderId, newStatus, notes }: ProcessOrderStatusChangeParams): void {
  fireAndForget(async () => {
    const supabase = createServerClient();

    const { data: order } = await supabase
      .from("orders")
      .select("order_number, customers(contact_name, email)")
      .eq("id", orderId)
      .single();

    if (!order) {
      console.error(`[notification] Order not found for status update: ${orderId}`);
      return;
    }

    const customer = order.customers as unknown as { contact_name: string; email: string };

    try {
      const html = orderStatusUpdateEmail({
        orderNumber: order.order_number,
        customerName: customer.contact_name,
        newStatus,
        notes,
      });

      await sendEmail({
        to: customer.email,
        subject: `Order ${order.order_number} — Status Update`,
        html,
      });
    } catch (err) {
      console.error(`[notification] Status update email failed for order ${order.order_number}:`, err);
    }
  });
}

// --- Customer Status Change ---

interface ProcessCustomerStatusChangeParams {
  customerId: string;
  newStatus: string;
  reason?: string | null;
}

export function processCustomerStatusChange({ customerId, newStatus, reason }: ProcessCustomerStatusChangeParams): void {
  fireAndForget(async () => {
    const supabase = createServerClient();

    const { data: customer } = await supabase
      .from("customers")
      .select("contact_name, email")
      .eq("id", customerId)
      .single();

    if (!customer) {
      console.error(`[notification] Customer not found: ${customerId}`);
      return;
    }

    try {
      let html: string;
      let subject: string;

      if (newStatus === "approved") {
        html = customerApprovedEmail({ customerName: customer.contact_name });
        subject = "Your Lanka Chemist account has been approved!";
      } else if (newStatus === "rejected") {
        html = customerRejectedEmail({
          customerName: customer.contact_name,
          reason: reason || "No reason provided",
        });
        subject = "Lanka Chemist account verification update";
      } else if (newStatus === "suspended") {
        html = customerSuspendedEmail({
          customerName: customer.contact_name,
          reason: reason || "No reason provided",
        });
        subject = "Lanka Chemist account suspended";
      } else {
        return; // Unknown status, skip
      }

      await sendEmail({ to: customer.email, subject, html });
    } catch (err) {
      console.error(`[notification] Customer status email failed for ${customerId}:`, err);
    }
  });
}

// --- New Registration ---

interface ProcessNewRegistrationParams {
  customerId: string;
  customerName: string;
  customerType: string;
  email: string;
}

export function processNewRegistration({ customerId, customerName, customerType, email }: ProcessNewRegistrationParams): void {
  fireAndForget(async () => {
    try {
      const html = adminNewRegistrationEmail({
        customerName,
        customerType,
        email,
        customerId,
      });

      await sendAdminNotification({
        subject: `New Registration — ${customerName}`,
        html,
      });
    } catch (err) {
      console.error(`[notification] Admin registration notification failed for ${customerId}:`, err);
    }
  });
}
