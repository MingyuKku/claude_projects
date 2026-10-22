import { createContext } from "react";

export const NavigationContext = createContext({
  closeMenu: () => {},
  canAccessCustomerCenter: false,
  isAuthenticated: false,
});
