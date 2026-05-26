import React, { createContext, useContext, useState, useEffect } from 'react';
import { pb } from '../src/lib/pocketbase';
import { Household } from '../src/lib/household';

interface HouseholdContextType {
  households: Household[];
  activeHousehold: Household | null;
  setActiveHousehold: (household: Household) => void;
  loading: boolean;
  refreshHouseholds: () => Promise<void>;
  joinNewHousehold: (inviteCode: string) => Promise<Household>;
  createNewHousehold: (name: string) => Promise<Household>;
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);

export function HouseholdProvider({ children }: { children: React.ReactNode }) {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [activeHousehold, setActiveHouseholdState] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHouseholds = async () => {
    const userId = pb.authStore.model?.id;
    if (!userId) {
      setHouseholds([]);
      setActiveHouseholdState(null);
      setLoading(false);
      return;
    }

    try {
      const memberships = await pb.collection("household_members").getFullList({
        filter: `user = "${userId}"`,
        sort: '-created',
      });

      if (memberships.length === 0) {
        setHouseholds([]);
        setActiveHouseholdState(null);
        setLoading(false);
        return;
      }

      const householdRecords = await Promise.all(
        memberships.map(async (m) => {
          try {
            return await pb.collection("households").getOne<Household>(m.household);
          } catch (e) {
            console.error(`Error fetching household ${m.household}:`, e);
            return null;
          }
        })
      );

      const validHouseholds = householdRecords.filter((h): h is Household => h !== null);
      setHouseholds(validHouseholds);

      let initialActive: Household | null = null;
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedId = window.localStorage.getItem('active-household-id');
        if (savedId) {
          initialActive = validHouseholds.find((h) => h.id === savedId) || null;
        }
      }

      if (!initialActive && validHouseholds.length > 0) {
        initialActive = validHouseholds[0];
      }

      setActiveHouseholdState(initialActive);
    } catch (error) {
      console.error("Error loading households:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHouseholds();
  }, [pb.authStore.isValid]);

  const setActiveHousehold = (household: Household) => {
    setActiveHouseholdState(household);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('active-household-id', household.id);
    }
  };

  const createNewHousehold = async (name: string): Promise<Household> => {
    const userId = pb.authStore.model?.id;
    if (!userId) throw new Error("Not logged in");

    const generateInviteCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

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

    await fetchHouseholds();
    setActiveHousehold(household);
    return household;
  };

  const joinNewHousehold = async (inviteCode: string): Promise<Household> => {
    const userId = pb.authStore.model?.id;
    if (!userId) throw new Error("Not logged in");

    const normalizedInviteCode = inviteCode.trim().toUpperCase();
    const household = await pb.collection("households").getFirstListItem<Household>(
      `inviteCode = "${normalizedInviteCode}"`
    );

    const existingMemberships = await pb.collection("household_members").getFullList({
      filter: `household = "${household.id}" && user = "${userId}"`,
    });

    if (existingMemberships.length === 0) {
      await pb.collection("household_members").create({
        household: household.id,
        user: userId,
        role: "member",
      });
    }

    await fetchHouseholds();
    setActiveHousehold(household);
    return household;
  };

  return (
    <HouseholdContext.Provider
      value={{
        households,
        activeHousehold,
        setActiveHousehold,
        loading,
        refreshHouseholds: fetchHouseholds,
        createNewHousehold,
        joinNewHousehold,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold() {
  const context = useContext(HouseholdContext);
  if (!context) {
    throw new Error("useHousehold must be used within a HouseholdProvider");
  }
  return context;
}
