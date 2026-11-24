import { isRoodiesAdmin } from "@/lib/menu-routing";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isRoodiesAdmin(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const rows = body.rows;

  if (!Array.isArray(rows) || !rows.length) {
    return NextResponse.json({ error: "No rows to import." }, { status: 400 });
  }

  const { error } = await supabase.rpc("pu_birthdays_import", {
    p_rows: rows,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ importedCount: rows.length });
}