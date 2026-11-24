import { createAdminClient } from "@/lib/supabase/admin";

export const VERJAARDAG_TEMPLATE_BUCKET = "kerk";
export const VERJAARDAG_TEMPLATE_PATH = "Verjaarsdag Template.pptx";

export async function downloadVerjaarsdagTemplate() {
  const admin = createAdminClient();

  const { data, error } = await admin.storage
    .from(VERJAARDAG_TEMPLATE_BUCKET)
    .download(VERJAARDAG_TEMPLATE_PATH);

  if (error) {
    throw new Error(
      error.message ??
        `Could not download "${VERJAARDAG_TEMPLATE_PATH}" from bucket "${VERJAARDAG_TEMPLATE_BUCKET}".`
    );
  }

  if (!data) {
    throw new Error("Verjaarsdag template download returned no data.");
  }

  return Buffer.from(await data.arrayBuffer());
}