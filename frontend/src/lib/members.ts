import { pb } from "./pocketbase";

export type HouseholdMemberRole = "admin" | "member";

export type HouseholdMember = {
  id: string;
  userId: string;
  email: string;
  name?: string;
  role: HouseholdMemberRole;
};

export async function loadHouseholdMembers(
  householdId: string
): Promise<HouseholdMember[]> {
  const records = await pb.collection("household_members").getFullList({
    filter: `household = "${householdId}"`,
    expand: "user",
    sort: "role,-created",
  });

  return records.map((record: any) => {
    const user = record.expand?.user;

    return {
      id: record.id,
      userId: record.user,
      email: user?.email ?? "Unbekannt",
      name: user?.name,
      role: record.role === "admin" ? "admin" : "member",
    };
  });
}

export async function updateHouseholdMemberRole(
  memberId: string,
  role: HouseholdMemberRole
) {
  return await pb.collection("household_members").update(memberId, {
    role,
  });
}

export async function removeHouseholdMember(memberId: string) {
  return await pb.collection("household_members").delete(memberId);
}
