import { buildVerjaarsdaePowerpoint } from "@/lib/verjaarsdae-powerpoint";
import { downloadVerjaarsdagTemplate } from "@/lib/verjaarsdae-template";
import { isRoodiesAdmin } from "@/lib/menu-routing";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isRoodiesAdmin(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("pr_meetings");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const rows = data ?? [];

  try {
    const templateBuffer = await downloadVerjaarsdagTemplate();
    const buffer = await buildVerjaarsdaePowerpoint(rows, templateBuffer);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": 'attachment; filename="Verjaarsdae.pptx"',
      },
    });
  } catch (exportError) {
    const message =
      exportError instanceof Error
        ? exportError.message
        : "Could not create PowerPoint file.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}