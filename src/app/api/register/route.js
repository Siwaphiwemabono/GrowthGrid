import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = 'https://hvslygkrqxpaytdkheqt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2c2x5Z2tycXhwYXl0ZGtoZXF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNjM5NTIsImV4cCI6MjA5NjgzOTk1Mn0.xpGKqWOIp29S3r27XGu2X4I3KEzDL1Urm72NJE-Vdxg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(req) {
  console.log("API was called!");
  
  try {
    const body = await req.json();
    console.log("Received data:", body);
    
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

    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          surname: surname,
        },
      },
    });

    if (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    // 2. Insert into profiles table (matches your table structure)
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      name: name,
      surname: surname,
      email: email,
    });

    if (profileError) {
      console.error("Profile error:", profileError);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    // 3. Insert into businesses table (matches your table structure)
    const { error: businessError } = await supabase.from("businesses").insert({
      user_id: userId,
      business_name: businessName,
      industry: industry,
      business_size: businessSize || "Just me (Solo)",
    });

    if (businessError) {
      console.error("Business error:", businessError);
      return NextResponse.json({ error: businessError.message }, { status: 400 });
    }

    // 4. Insert employees if any (matches your table structure)
    if (hasEmployees === "yes" && employeeEmails && employeeEmails.trim()) {
      const emails = employeeEmails
        .split(",")
        .map((e) => e.trim())
        .filter((e) => e.length > 0);

      if (emails.length > 0) {
        const employeesData = emails.map((email) => ({
          business_owner_id: userId,
          email: email,
        }));

        const { error: empError } = await supabase
          .from("employees")
          .insert(employeesData);

        if (empError) {
          console.error("Employee error:", empError);
          // Don't fail registration if employee insert fails
        }
      }
    }

    console.log("✅ Registration successful for user:", userId);
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: "Registration successful! Please check your email to confirm your account.",
      userId: userId,
    });
    
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "API is working! Use POST to register." });
}