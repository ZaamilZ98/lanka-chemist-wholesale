import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase/server";

interface CsvRow {
  brand_name: string;
  generic_name: string;
  sku: string;
  wholesale_price: string;
  stock_quantity: string;
  category_id?: string;
  manufacturer_id?: string;
  section?: string;
  dosage_form?: string;
  strength?: string;
  pack_size?: string;
  is_prescription?: string;
  description?: string;
  low_stock_threshold?: string;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "CSV file is required" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be under 5MB" }, { status: 400 });
    }

    // Validate file type - accept CSV files or plain text
    const allowedTypes = ["text/csv", "text/plain", "application/csv", "application/vnd.ms-excel"];
    if (file.type && !allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "File must be a CSV file" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json({ error: "File must have a .csv extension" }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim());

    if (lines.length < 2) {
      return NextResponse.json({ error: "CSV must have a header row and at least one data row" }, { status: 400 });
    }

    // Parse header
    const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, "_"));
    const requiredHeaders = ["brand_name", "generic_name", "sku", "wholesale_price"];
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return NextResponse.json(
        { error: `Missing required columns: ${missingHeaders.join(", ")}` },
        { status: 400 },
      );
    }

    const supabase = createServerClient();
    let inserted = 0;
    let updated = 0;
    const errors: { row: number; message: string }[] = [];

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i]);
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] ?? "";
      });

      const csvRow = row as unknown as CsvRow;

      // Validate required fields
      if (!csvRow.brand_name?.trim()) {
        errors.push({ row: i + 1, message: "brand_name is required" });
        continue;
      }
      if (!csvRow.generic_name?.trim()) {
        errors.push({ row: i + 1, message: "generic_name is required" });
        continue;
      }
      if (!csvRow.sku?.trim()) {
        errors.push({ row: i + 1, message: "sku is required" });
        continue;
      }

      const price = parseFloat(csvRow.wholesale_price);
      if (isNaN(price) || price <= 0) {
        errors.push({ row: i + 1, message: "wholesale_price must be a positive number" });
        continue;
      }

      const stockQty = csvRow.stock_quantity ? parseInt(csvRow.stock_quantity, 10) : 0;
      if (isNaN(stockQty) || stockQty < 0) {
        errors.push({ row: i + 1, message: "stock_quantity must be a non-negative integer" });
        continue;
      }

      const productData: Record<string, unknown> = {
        brand_name: csvRow.brand_name.trim(),
        generic_name: csvRow.generic_name.trim(),
        sku: csvRow.sku.trim(),
        wholesale_price: price,
        stock_quantity: stockQty,
        section: csvRow.section?.trim() || "medicines",
      };

      if (csvRow.category_id?.trim()) productData.category_id = csvRow.category_id.trim();
      if (csvRow.manufacturer_id?.trim()) productData.manufacturer_id = csvRow.manufacturer_id.trim();
      if (csvRow.dosage_form?.trim()) productData.dosage_form = csvRow.dosage_form.trim();
      if (csvRow.strength?.trim()) productData.strength = csvRow.strength.trim();
      if (csvRow.pack_size?.trim()) productData.pack_size = csvRow.pack_size.trim();
      if (csvRow.description?.trim()) productData.description = csvRow.description.trim();
      if (csvRow.is_prescription === "true") productData.is_prescription = true;
      if (csvRow.low_stock_threshold) {
        const threshold = parseInt(csvRow.low_stock_threshold, 10);
        if (!isNaN(threshold)) productData.low_stock_threshold = threshold;
      }

      // Check if product with this SKU exists
      const { data: existing } = await supabase
        .from("products")
        .select("id")
        .eq("sku", csvRow.sku.trim())
        .limit(1);

      if (existing && existing.length > 0) {
        // Update existing
        const { error: updateErr } = await supabase
          .from("products")
          .update(productData)
          .eq("id", existing[0].id);

        if (updateErr) {
          errors.push({ row: i + 1, message: `Update failed: ${updateErr.message}` });
        } else {
          updated++;
        }
      } else {
        // Insert new
        const { error: insertErr } = await supabase
          .from("products")
          .insert(productData);

        if (insertErr) {
          errors.push({ row: i + 1, message: `Insert failed: ${insertErr.message}` });
        } else {
          inserted++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      inserted,
      updated,
      errors,
      total_rows: lines.length - 1,
    });
  } catch (error) {
    console.error("CSV import error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
