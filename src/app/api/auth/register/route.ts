import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { hashPassword, signToken, setAuthCookie } from "@/lib/auth";
import { validateRegistrationInput, sanitizeString } from "@/lib/validate";
import { R2_PUBLIC_URL } from "@/lib/r2";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const errors = validateRegistrationInput(body);
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const supabase = createServerClient();

    // Check for duplicate email
    const { data: existing } = await supabase
      .from("customers")
      .select("id")
      .eq("email", body.email.toLowerCase().trim())
      .single();

    if (existing) {
      return NextResponse.json(
        { errors: { email: "An account with this email already exists" } },
        { status: 409 },
      );
    }

    // Hash password
    const password_hash = await hashPassword(body.password);

    // Insert customer
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .insert({
        email: body.email.toLowerCase().trim(),
        password_hash,
        customer_type: body.customer_type,
        contact_name: sanitizeString(body.contact_name),
        business_name: body.business_name
          ? sanitizeString(body.business_name)
          : null,
        slmc_number: body.slmc_number?.trim() || null,
        nmra_license_number: body.nmra_license_number?.trim() || null,
        phone: body.phone.replace(/[\s\-()]/g, ""),
        whatsapp: body.whatsapp
          ? body.whatsapp.replace(/[\s\-()]/g, "")
          : null,
        status: "pending",
        is_active: true,
      })
      .select("id, email, contact_name, customer_type, status")
      .single();

    if (customerError || !customer) {
      console.error("Customer insert error:", customerError);
      return NextResponse.json(
        { error: "Registration failed. Please try again." },
        { status: 500 },
      );
    }

    // Insert address
    const { error: addressError } = await supabase
      .from("customer_addresses")
      .insert({
        customer_id: customer.id,
        label: "Default",
        address_line1: sanitizeString(body.address_line1),
        address_line2: body.address_line2
          ? sanitizeString(body.address_line2)
          : null,
        city: sanitizeString(body.city),
        district: sanitizeString(body.district),
        postal_code: body.postal_code?.trim() || null,
        is_default: true,
      });

    if (addressError) {
      console.error("Address insert error:", addressError);
    }

    // Insert verification document(s) if provided
    if (body.document_url && typeof body.document_url === "string") {
      // Only accept URLs that look like our R2 upload paths (uploads/uuid.ext)
      const isValidUploadUrl =
        /^uploads\/[0-9a-f\-]{36}\.(jpg|jpeg|png|pdf)$/.test(body.document_url) ||
        (R2_PUBLIC_URL && body.document_url.startsWith(R2_PUBLIC_URL + "/uploads/"));

      if (isValidUploadUrl) {
        const docType = ["doctor", "dentist"].includes(body.customer_type)
          ? "slmc_id"
          : "nmra_license";

        const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
        const mimeType =
          typeof body.document_mime_type === "string" &&
          allowedMimeTypes.includes(body.document_mime_type)
            ? body.document_mime_type
            : null;

        const { error: docError } = await supabase
          .from("verification_documents")
          .insert({
            customer_id: customer.id,
            document_type: docType,
            file_url: body.document_url,
            file_name: sanitizeString(
              typeof body.document_file_name === "string"
                ? body.document_file_name.slice(0, 255)
                : "document",
            ),
            file_size:
              typeof body.document_file_size === "number" &&
              body.document_file_size > 0
                ? body.document_file_size
                : null,
            mime_type: mimeType,
          });

        if (docError) {
          console.error("Document insert error:", docError);
        }
      }
    }

    // Sign JWT and set cookie
    const token = signToken(customer.id, customer.email);
    await setAuthCookie(token);

    return NextResponse.json(
      {
        customer: {
          id: customer.id,
          email: customer.email,
          contact_name: customer.contact_name,
          customer_type: customer.customer_type,
          status: customer.status,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 },
    );
  }
}
