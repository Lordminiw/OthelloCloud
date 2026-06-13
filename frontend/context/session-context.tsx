import { createContext, ReactNode, useContext } from "react";

type SessionActions = {
  onLogout: () => void;
};

const SessionActionsContext = createContext<SessionActions | null>(null);

export function SessionActionsProvider({
  children,
  onLogout,
}: {
  children: ReactNode;
  onLogout: () => void;
}) {
  return (
    <SessionActionsContext.Provider value={{ onLogout }}>
      {children}
    </SessionActionsContext.Provider>
  );
}

export function useSessionActions() {
  return useContext(SessionActionsContext);
}
