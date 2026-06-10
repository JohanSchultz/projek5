import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const userName = body.userName?.trim();
  const password = body.password;
  const appNumberValue = body.appNumber;

  if (!userName) {
    return NextResponse.json({ error: "User Name is required." }, { status: 400 });
  }

  if (appNumberValue === undefined || appNumberValue === null || appNumberValue === "") {
    return NextResponse.json({ error: "App Number is required." }, { status: 400 });
  }

  const appNumber = Number(appNumberValue);

  if (!Number.isInteger(appNumber)) {
    return NextResponse.json(
      { error: "App Number must be a whole number." },
      { status: 400 }
    );
  }

  if (!password) {
    return NextResponse.json({ error: "Password is required." }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      {
        error:
          "Server auth is not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env.local.",
      },
      { status: 500 }
    );
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: userName,
    password,
    email_confirm: true,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { error: piUserError } = await supabase.rpc("pi_user", {
    p_email: userName,
    p_app_number: appNumber,
  });

  if (piUserError) {
    return NextResponse.json(
      {
        error: `User was created in auth, but saving app details failed: ${piUserError.message}`,
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    id: data.user.id,
    email: data.user.email,
    appNumber,
  });
}
