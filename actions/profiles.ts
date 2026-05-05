// actions/profiles.ts
"use server";

import { db } from "@/db";
import { roleProfiles, users } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

// Define the exact shape of our form state
export type ProfileFormState = {
  error: string | null;
  success: boolean;
  timestamp: number;
};

const ProfileSchema = z.object({
  name: z.string().min(2, "Profile name is required"),
  description: z.string().optional(),
  department: z.string().min(2, "Department is required"),
});

export async function createProfileAction(
  prevState: ProfileFormState, 
  formData: FormData
): Promise<ProfileFormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "Unauthorized", success: false, timestamp: 0 };
  }

  const hrUser = await db.query.users.findFirst({
    where: eq(users.authId, user.id),
  });
  
  if (!hrUser) {
    return { error: "Tenant not found", success: false, timestamp: 0 };
  }

  const payload = {
    name: formData.get("name")?.toString() || "",
    department: formData.get("department")?.toString() || "",
  };

  const parsed = ProfileSchema.safeParse(payload);
  if (!parsed.success) {
    return { 
      error: parsed.error.issues?.[0]?.message || "Invalid input", 
      success: false, 
      timestamp: 0 
    };
  }

  try {
    await db.insert(roleProfiles).values({
      orgId: hrUser.orgId,
      name: parsed.data.name,
      description: parsed.data.description,
      department: parsed.data.department,
    });

    revalidatePath("/app/profiles");
    return { success: true, timestamp: Date.now(), error: null };
  } catch (error) {
    console.error("Failed to create profile:", error);
    return { error: "Database error. Could not create profile.", success: false, timestamp: 0 };
  }
}