// src/app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db/db";

interface RegisterRequest {
  name: string;
  surname: string;
  email: string;
  password: string;
  businessName: string;
  industry: string;
  businessSize?: string;
  hasEmployees?: string;
  employeeEmails?: string;
}

export async function POST(req: Request) {
  console.log("📝 ===== REGISTRATION START =====");
  
  try {
    const body: RegisterRequest = await req.json();
    
    console.log("📧 Email:", body.email);
    console.log("👤 Name:", body.name);
    console.log("🔑 Password provided:", body.password ? "YES (length: " + body.password.length + ")" : "NO");
    
    const {
      name,
      surname,
      email,
      password,
      businessName,
      industry,
      businessSize,
      hasEmployees,
      employeeEmails,
    } = body;

    // Validate required fields
    if (!name || !surname || !email || !password || !businessName || !industry) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await db
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Generate IDs
    const userId = crypto.randomUUID();
    const businessId = crypto.randomUUID();

    // ✅ STEP 1: Create business FIRST
    const { error: businessError } = await db
      .from("businesses")
      .insert({
        id: businessId,
        userId: userId,
        businessName: businessName,
        industry: industry,
        businessSize: businessSize || "Just me (Solo)",
      });

    if (businessError) {
      console.error("❌ Business error:", businessError);
      return NextResponse.json(
        { error: businessError.message || "Failed to create business" },
        { status: 400 }
      );
    }

    console.log("✅ Business created successfully!");

    // ✅ STEP 2: Create profile with the business_id
    const { data: profileData, error: profileError } = await db
      .from("profiles")
      .insert({
        id: userId,
        name: name,
        surname: surname,
        email: email,
        password: password,
        password_changed: false,
        role: "owner",
        business_id: businessId,  // Now this exists!
      })
      .select();

    if (profileError) {
      console.error("❌ Profile insert error:", profileError);
      // Optional: Delete the business if profile creation fails
      await db.from("businesses").delete().eq("id", businessId);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    console.log("✅ Profile created successfully!");

    // ✅ STEP 3: Create employee record for the owner
    const { error: employeeError } = await db
      .from("employees")
      .insert({
        id: crypto.randomUUID(),
        businessOwnerId: userId,
        businessId: businessId,
        profileId: userId,
        email: email,
        name: name,
        surname: surname,
        role: "owner",
      });

    if (employeeError) {
      console.error("❌ Employee error:", employeeError);
      // Don't fail registration if employee creation fails
    } else {
      console.log("✅ Employee created successfully!");
    }

    // ✅ STEP 4: Create additional employees if any
    if (hasEmployees === "yes" && employeeEmails && employeeEmails.trim()) {
      const emails = employeeEmails
        .split(",")
        .map((e: string) => e.trim())
        .filter((e: string) => e.length > 0);

      if (emails.length > 0) {
        const employeesData = emails.map((email: string) => ({
          id: crypto.randomUUID(),
          businessOwnerId: userId,
          businessId: businessId,
          profileId: null,
          email: email,
          name: "",
          surname: "",
          role: "employee",
        }));

        const { error: empError } = await db
          .from("employees")
          .insert(employeesData);

        if (empError) {
          console.error("❌ Additional employees error:", empError);
        } else {
          console.log(`✅ ${emails.length} additional employees created!`);
        }
      }
    }

    console.log("✅ Registration successful for user:", userId);
    
    return NextResponse.json({
      success: true,
      message: "Registration successful! Please log in.",
      userId: userId,
      businessId: businessId,
    });
    
  } catch (error) {
    console.error("❌ Registration error:", error);
    const errorMessage = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "API is working! Use POST to register." });
}