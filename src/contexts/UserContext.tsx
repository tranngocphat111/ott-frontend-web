import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { User } from "../types";

interface UserContextType {
  currentUser: User | null;
  secondUser: User | null;
  allLoggedInUsers: User[];
  setCurrentUser: (user: User | null) => void;
  setSecondUser: (user: User | null) => void;
  switchToUser: (userId: string) => void;
  isAuthenticated: boolean;
  logout: () => void;
  logoutAll: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [secondUser, setSecondUserState] = useState<User | null>(null);

  // Load users from localStorage on mount
  useEffect(() => {
    const savedCurrentUser = localStorage.getItem("currentUser");
    const savedSecondUser = localStorage.getItem("secondUser");

    if (savedCurrentUser) {
      try {
        setCurrentUserState(JSON.parse(savedCurrentUser));
      } catch (error) {
        console.error("Failed to parse saved current user:", error);
        localStorage.removeItem("currentUser");
      }
    }

    if (savedSecondUser) {
      try {
        setSecondUserState(JSON.parse(savedSecondUser));
      } catch (error) {
        console.error("Failed to parse saved second user:", error);
        localStorage.removeItem("secondUser");
      }
    }
  }, []);

  const setCurrentUser = (user: User | null) => {
    setCurrentUserState(user);
    if (user) {
      localStorage.setItem("currentUser", JSON.stringify(user));
    } else {
      localStorage.removeItem("currentUser");
    }
  };

  const setSecondUser = (user: User | null) => {
    setSecondUserState(user);
    if (user) {
      localStorage.setItem("secondUser", JSON.stringify(user));
    } else {
      localStorage.removeItem("secondUser");
    }
  };

  const switchToUser = (userId: string) => {
    if (currentUser?._id === userId) {
      return; // Already current user
    }
    if (secondUser?._id === userId) {
      // Swap users
      const temp = currentUser;
      setCurrentUser(secondUser);
      setSecondUser(temp);
    }
  };

  const logout = () => {
    // Only logout current user, keep second user
    if (secondUser) {
      setCurrentUser(secondUser);
      setSecondUser(null);
    } else {
      setCurrentUser(null);
    }
  };

  const logoutAll = () => {
    setCurrentUser(null);
    setSecondUser(null);
  };

  const allLoggedInUsers = [currentUser, secondUser].filter(
    (u): u is User => u !== null,
  );

  const value: UserContextType = {
    currentUser,
    secondUser,
    allLoggedInUsers,
    setCurrentUser,
    setSecondUser,
    switchToUser,
    isAuthenticated: !!currentUser,
    logout,
    logoutAll,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
};
