import { pb } from "./pocketbase";

export type Household = {
  id: string;
  name: string;
  inviteCode: string;
  createdBy?: string;
};

export type HouseholdMemberRecord = {
  id: string;
  household: string;
  user: string;
  role: "admin" | "member";
};

function generateInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function getCurrentUserHousehold(): Promise<Household | null> {
  const userId = pb.authStore.model?.id;

  if (!userId) {
    return null;
  }

  const memberships = await pb.collection("household_members").getFullList({
    filter: `user = "${userId}"`,
  });

  if (memberships.length === 0) {
    return null;
  }

  const householdId = memberships[0].household;

  if (!householdId) {
    return null;
  }

  const household = await pb.collection("households").getOne<Household>(
    householdId
  );

  return {
    id: household.id,
    name: household.name,
    inviteCode: household.inviteCode,
    createdBy: household.createdBy,
  };
}

export async function createHousehold(name: string): Promise<Household> {
  const userId = pb.authStore.model?.id;

  if (!userId) {
    throw new Error("Not logged in");
  }

  const household = await pb.collection("households").create<Household>({
    name: name.trim(),
    inviteCode: generateInviteCode(),
    createdBy: userId,
  });

  await pb.collection("household_members").create({
    household: household.id,
    user: userId,
    role: "admin",
  });

  return household;
}

export async function joinHousehold(inviteCode: string): Promise<Household> {
  const userId = pb.authStore.model?.id;

  if (!userId) {
    throw new Error("Not logged in");
  }

  const normalizedInviteCode = inviteCode.trim().toUpperCase();

  const household = await pb.collection("households").getFirstListItem<Household>(
    `inviteCode = "${normalizedInviteCode}"`
  );

  const existingMemberships = await pb
    .collection("household_members")
    .getFullList({
      filter: `household = "${household.id}" && user = "${userId}"`,
    });

  if (existingMemberships.length === 0) {
    await pb.collection("household_members").create({
      household: household.id,
      user: userId,
      role: "member",
    });
  }

  return household;
}