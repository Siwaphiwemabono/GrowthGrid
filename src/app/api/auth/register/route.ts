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
    console.log("🔑 Password provided:", body.password ? "YES" : "NO");
    
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

    // Check if user already exists - using maybeSingle to avoid errors
    const { data: existingUser, error: checkError } = await db
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Generate IDs
    const userId = crypto.randomUUID();
    const businessId = crypto.randomUUID();

    console.log("🆔 Generated IDs:", { userId, businessId });

    // ✅ STEP 1: Create business FIRST with snake_case column names
    const { data: businessData, error: businessError } = await db
      .from("businesses")
      .insert({
        id: businessId,
        user_id: userId,
        business_name: businessName,
        industry: industry,
        business_size: businessSize || "Just me (Solo)",
      })
      .select();

    if (businessError) {
      console.error("❌ Business error:", businessError);
      return NextResponse.json(
        { error: `Failed to create business: ${businessError.message}` },
        { status: 400 }
      );
    }

    console.log("✅ Business created successfully:", businessData);

    // ✅ STEP 2: Create profile with snake_case column names
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
        business_id: businessId,
      })
      .select();

    if (profileError) {
      console.error("❌ Profile insert error:", profileError);
      
      // 🔴 FIXED: DO NOT delete the business - keep it for debugging
      // The business will remain in the database so you can investigate
      
      return NextResponse.json({ 
        error: profileError.message,
        // Include businessId so you can manually fix or delete it later
        businessId: businessId,
        userId: userId
      }, { status: 400 });
    }

    console.log("✅ Profile created successfully:", profileData);

    // ✅ STEP 3: Create employee record for the owner
    const { data: employeeData, error: employeeError } = await db
      .from("employees")
      .insert({
        id: crypto.randomUUID(),
        business_owner_id: userId,
        business_id: businessId,
        profile_id: userId,
        email: email,
        name: name,
        surname: surname,
        role: "owner",
      })
      .select();

    if (employeeError) {
      console.error("❌ Employee error:", employeeError);
      // Don't fail registration if employee creation fails
    } else {
      console.log("✅ Employee created successfully:", employeeData);
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
          business_owner_id: userId,
          business_id: businessId,
          profile_id: null,
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