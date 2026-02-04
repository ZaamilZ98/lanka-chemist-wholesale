import PDFDocument from "pdfkit";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getR2Client, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2";
import { getStoreSettings } from "@/lib/store-settings";
import { createServerClient } from "@/lib/supabase/server";
import { DELIVERY_METHOD_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/constants";

interface InvoiceOrderItem {
  product_name: string;
  product_generic_name: string | null;
  product_sku: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface InvoiceCustomer {
  contact_name: string;
  business_name: string | null;
  slmc_number: string | null;
  nmra_license_number: string | null;
  email: string;
  phone: string;
}

interface InvoiceAddress {
  address_line1: string;
  address_line2: string | null;
  city: string;
  district: string;
  postal_code: string | null;
}

interface InvoiceOrder {
  id: string;
  order_number: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  delivery_method: string;
  payment_method: string;
  created_at: string;
  customer: InvoiceCustomer;
  delivery_address: InvoiceAddress | null;
  items: InvoiceOrderItem[];
}

function formatCurrency(amount: number): string {
  return `Rs ${amount.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function collectPdfBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    doc.on("data", (chunk: Uint8Array) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

export interface InvoiceResult {
  url: string;
  buffer: Buffer;
  orderNumber: string;
}

export async function generateInvoice(orderId: string): Promise<InvoiceResult> {
  const supabase = createServerClient();
  const settings = await getStoreSettings();

  // Fetch order with related data
  const { data: orderRaw, error } = await supabase
    .from("orders")
    .select(
      `id, order_number, subtotal, delivery_fee, total, delivery_method, payment_method, created_at,
       customers(contact_name, business_name, slmc_number, nmra_license_number, email, phone),
       delivery_address:customer_addresses(address_line1, address_line2, city, district, postal_code),
       order_items(product_name, product_generic_name, product_sku, quantity, unit_price, total_price)`,
    )
    .eq("id", orderId)
    .single();

  if (error || !orderRaw) {
    throw new Error(`Order not found: ${orderId}`);
  }

  const order: InvoiceOrder = {
    id: orderRaw.id,
    order_number: orderRaw.order_number,
    subtotal: orderRaw.subtotal,
    delivery_fee: orderRaw.delivery_fee,
    total: orderRaw.total,
    delivery_method: orderRaw.delivery_method,
    payment_method: orderRaw.payment_method,
    created_at: orderRaw.created_at,
    customer: orderRaw.customers as unknown as InvoiceCustomer,
    delivery_address: orderRaw.delivery_address as unknown as InvoiceAddress | null,
    items: orderRaw.order_items as unknown as InvoiceOrderItem[],
  };

  // Create PDF
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const bufferPromise = collectPdfBuffer(doc);

  const pageWidth = doc.page.width - 100; // 50px margins each side

  // --- Header ---
  doc.fontSize(18).font("Helvetica-Bold").fillColor("#1a5632").text(settings.store_name || "Lanka Chemist Wholesale", 50, 50);
  doc.fontSize(9).font("Helvetica").fillColor("#555555");
  let headerY = 72;
  if (settings.nmra_license_number) {
    doc.text(`NMRA License: ${settings.nmra_license_number}`, 50, headerY);
    headerY += 12;
  }
  if (settings.store_address) {
    doc.text(settings.store_address, 50, headerY);
    headerY += 12;
  }
  if (settings.store_phone) {
    doc.text(`Phone: ${settings.store_phone}`, 50, headerY);
    headerY += 12;
  }
  if (settings.store_email) {
    doc.text(`Email: ${settings.store_email}`, 50, headerY);
    headerY += 12;
  }

  // Invoice title + number on the right
  doc.fontSize(24).font("Helvetica-Bold").fillColor("#111111").text("INVOICE", 350, 50, { align: "right", width: pageWidth - 300 });
  doc.fontSize(10).font("Helvetica").fillColor("#555555");
  doc.text(`Invoice: INV-${order.order_number}`, 350, 80, { align: "right", width: pageWidth - 300 });
  doc.text(`Order: ${order.order_number}`, 350, 94, { align: "right", width: pageWidth - 300 });
  doc.text(`Date: ${new Date(order.created_at).toLocaleDateString("en-LK", { year: "numeric", month: "long", day: "numeric" })}`, 350, 108, { align: "right", width: pageWidth - 300 });

  // Separator
  const sepY = Math.max(headerY + 8, 128);
  doc.moveTo(50, sepY).lineTo(50 + pageWidth, sepY).strokeColor("#e5e7eb").lineWidth(1).stroke();

  // --- Bill To ---
  let billY = sepY + 16;
  doc.fontSize(10).font("Helvetica-Bold").fillColor("#333333").text("BILL TO", 50, billY);
  billY += 16;
  doc.fontSize(10).font("Helvetica").fillColor("#111111");
  doc.text(order.customer.contact_name, 50, billY);
  billY += 14;
  if (order.customer.business_name) {
    doc.fontSize(9).fillColor("#555555").text(order.customer.business_name, 50, billY);
    billY += 12;
  }
  if (order.customer.slmc_number) {
    doc.fontSize(9).fillColor("#555555").text(`SLMC No: ${order.customer.slmc_number}`, 50, billY);
    billY += 12;
  }
  if (order.customer.nmra_license_number) {
    doc.fontSize(9).fillColor("#555555").text(`NMRA License: ${order.customer.nmra_license_number}`, 50, billY);
    billY += 12;
  }
  if (order.delivery_address) {
    const addr = order.delivery_address;
    const addrParts = [addr.address_line1, addr.address_line2, addr.city, addr.district, addr.postal_code].filter(Boolean);
    doc.fontSize(9).fillColor("#555555").text(addrParts.join(", "), 50, billY, { width: 250 });
    billY += doc.heightOfString(addrParts.join(", "), { width: 250 }) + 4;
  }

  // --- Items Table ---
  const tableTop = billY + 16;
  const colX = { num: 50, product: 75, sku: 280, qty: 350, price: 400, total: 475 };
  const colW = { num: 25, product: 200, sku: 65, qty: 45, price: 70, total: 70 };

  // Table header
  doc.rect(50, tableTop, pageWidth, 22).fill("#f3f4f6");
  doc.fontSize(8).font("Helvetica-Bold").fillColor("#6b7280");
  doc.text("#", colX.num + 4, tableTop + 6, { width: colW.num });
  doc.text("Product", colX.product, tableTop + 6, { width: colW.product });
  doc.text("SKU", colX.sku, tableTop + 6, { width: colW.sku });
  doc.text("Qty", colX.qty, tableTop + 6, { width: colW.qty, align: "center" });
  doc.text("Unit Price", colX.price, tableTop + 6, { width: colW.price, align: "right" });
  doc.text("Total", colX.total, tableTop + 6, { width: colW.total, align: "right" });

  let rowY = tableTop + 22;
  order.items.forEach((item, idx) => {
    // Check page overflow
    if (rowY > doc.page.height - 180) {
      doc.addPage();
      rowY = 50;
    }

    const rowHeight = item.product_generic_name ? 30 : 20;

    // Alternating row background
    if (idx % 2 === 1) {
      doc.rect(50, rowY, pageWidth, rowHeight).fill("#f9fafb");
    }

    doc.fontSize(9).font("Helvetica").fillColor("#111111");
    doc.text(`${idx + 1}`, colX.num + 4, rowY + 5, { width: colW.num });
    doc.text(item.product_name, colX.product, rowY + 5, { width: colW.product, lineBreak: false });
    if (item.product_generic_name) {
      doc.fontSize(7).fillColor("#9ca3af").text(item.product_generic_name, colX.product, rowY + 17, { width: colW.product, lineBreak: false });
    }
    doc.fontSize(8).fillColor("#6b7280").text(item.product_sku || "—", colX.sku, rowY + 5, { width: colW.sku });
    doc.fontSize(9).fillColor("#111111").text(`${item.quantity}`, colX.qty, rowY + 5, { width: colW.qty, align: "center" });
    doc.text(formatCurrency(item.unit_price), colX.price, rowY + 5, { width: colW.price, align: "right" });
    doc.font("Helvetica-Bold").text(formatCurrency(item.total_price), colX.total, rowY + 5, { width: colW.total, align: "right" });
    doc.font("Helvetica");

    rowY += rowHeight;
  });

  // Table bottom line
  doc.moveTo(50, rowY).lineTo(50 + pageWidth, rowY).strokeColor("#e5e7eb").lineWidth(0.5).stroke();

  // --- Totals ---
  const totalsX = 380;
  const totalsW = pageWidth - 330;
  rowY += 10;

  doc.fontSize(10).font("Helvetica").fillColor("#555555");
  doc.text("Subtotal", totalsX, rowY, { width: totalsW - 80 });
  doc.text(formatCurrency(order.subtotal), totalsX + totalsW - 80, rowY, { width: 80, align: "right" });
  rowY += 16;

  if (order.delivery_fee > 0) {
    doc.text("Delivery Fee", totalsX, rowY, { width: totalsW - 80 });
    doc.text(formatCurrency(order.delivery_fee), totalsX + totalsW - 80, rowY, { width: 80, align: "right" });
    rowY += 16;
  }

  // Total line
  doc.moveTo(totalsX, rowY).lineTo(totalsX + totalsW, rowY).strokeColor("#1a5632").lineWidth(1).stroke();
  rowY += 6;
  doc.fontSize(13).font("Helvetica-Bold").fillColor("#1a5632");
  doc.text("Total", totalsX, rowY, { width: totalsW - 80 });
  doc.text(formatCurrency(order.total), totalsX + totalsW - 80, rowY, { width: 80, align: "right" });
  rowY += 28;

  // --- Payment Info ---
  if (rowY > doc.page.height - 160) {
    doc.addPage();
    rowY = 50;
  }

  doc.fontSize(10).font("Helvetica-Bold").fillColor("#333333").text("Payment Information", 50, rowY);
  rowY += 16;
  doc.fontSize(9).font("Helvetica").fillColor("#555555");
  doc.text(`Method: ${PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method}`, 50, rowY);
  rowY += 14;
  doc.text(`Delivery: ${DELIVERY_METHOD_LABELS[order.delivery_method] || order.delivery_method}`, 50, rowY);
  rowY += 14;

  if (order.payment_method === "bank_transfer" && settings.bank_name) {
    rowY += 8;
    doc.rect(50, rowY, 250, 72).fillAndStroke("#f9fafb", "#e5e7eb");
    rowY += 8;
    doc.fontSize(8).font("Helvetica-Bold").fillColor("#333333").text("Bank Transfer Details", 60, rowY);
    rowY += 14;
    doc.fontSize(9).font("Helvetica").fillColor("#555555");
    doc.text(`Bank: ${settings.bank_name}`, 60, rowY);
    rowY += 12;
    doc.text(`Account: ${settings.bank_account_name}`, 60, rowY);
    rowY += 12;
    doc.text(`A/C No: ${settings.bank_account_number}`, 60, rowY);
    rowY += 12;
    if (settings.bank_branch) {
      doc.text(`Branch: ${settings.bank_branch}`, 60, rowY);
      rowY += 12;
    }
  }

  // --- Footer ---
  rowY += 24;
  if (rowY > doc.page.height - 80) {
    doc.addPage();
    rowY = 50;
  }
  doc.moveTo(50, rowY).lineTo(50 + pageWidth, rowY).strokeColor("#e5e7eb").lineWidth(0.5).stroke();
  rowY += 12;
  doc.fontSize(10).font("Helvetica-Bold").fillColor("#1a5632").text("Thank you for your order!", 50, rowY, { align: "center", width: pageWidth });
  rowY += 20;
  doc.fontSize(7).font("Helvetica").fillColor("#9ca3af");
  doc.text(`Generated: ${new Date().toISOString()}`, 50, rowY, { align: "center", width: pageWidth });
  rowY += 10;
  doc.text("Computer-generated document — no signature required", 50, rowY, { align: "center", width: pageWidth });

  doc.end();

  const buffer = await bufferPromise;

  // Upload to R2
  const r2Key = `invoices/${order.order_number}.pdf`;
  const r2 = getR2Client();
  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: r2Key,
      Body: buffer,
      ContentType: "application/pdf",
      ContentDisposition: `inline; filename="INV-${order.order_number}.pdf"`,
    }),
  );

  const publicUrl = R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${r2Key}` : r2Key;

  // Update order with invoice URL
  await supabase.from("orders").update({ invoice_url: publicUrl }).eq("id", orderId);

  return { url: publicUrl, buffer, orderNumber: order.order_number };
}
