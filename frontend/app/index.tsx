import { useState } from "react";
import { LoginScreen } from "../src/screens/LoginScreen";
import { ShoppingListScreen } from "../src/screens/ShoppingListScreen";
import { pb } from "../src/lib/pocketbase";

export default function Index() {
  const [loggedIn, setLoggedIn] = useState(pb.authStore.isValid);

  if (!loggedIn) {
    return <LoginScreen onLogin={() => setLoggedIn(true)} />;
  }

  return <ShoppingListScreen />;
}