import { pb } from "./pocketbase";

export type Household = {
  id: string;
  name: string;
  inviteCode: string;
};

export async function getCurrentUserHousehold(): Promise<Household | null> {
  const userId = pb.authStore.model?.id;

  console.log("Current user id:", userId);
  console.log("Current user:", pb.authStore.model);

  if (!userId) {
    return null;
  }

  const memberships = await pb.collection("household_members").getFullList({
    filter: `user = "${userId}"`,
  });

  console.log("Memberships:", memberships);

  if (memberships.length === 0) {
    return null;
  }

  const householdId = memberships[0].household;

  console.log("Household id:", householdId);

  if (!householdId) {
    return null;
  }

  const household = await pb.collection("households").getOne<Household>(
    householdId
  );

  console.log("Loaded household:", household);

  return {
    id: household.id,
    name: household.name,
    inviteCode: household.inviteCode,
  };
}