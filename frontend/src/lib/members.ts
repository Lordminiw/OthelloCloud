import { pb } from "./pocketbase";

export type HouseholdMember = {
  id: string;
  userId: string;
  email: string;
  name?: string;
};

export async function loadHouseholdMembers(
  householdId: string
): Promise<HouseholdMember[]> {
  const records = await pb.collection("household_members").getFullList({
    filter: `household = "${householdId}"`,
    expand: "user",
  });

  return records.map((record: any) => {
  const user = record.expand?.user;

  return {
    id: record.id,
    userId: record.user,
    email: user?.email ?? "Unbekannt",
    name: user?.name,
  };
});
}