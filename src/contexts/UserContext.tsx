import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { User } from "../types";
import {
  relationshipSocketService,
  type RelationshipRealtimePayload,
} from "../services/relationshipSocket.service";
import { useToast } from "./ToastContext";

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
  const { showToast } = useToast();

  const getNormalizedUserId = (user: User | null) => {
    const raw = user as { user_id?: string; _id?: string; id?: string } | null;
    return raw?.user_id || raw?._id || raw?.id || "";
  };

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

  useEffect(() => {
    const normalizedUserId = getNormalizedUserId(currentUser);
    if (!normalizedUserId) {
      relationshipSocketService.disconnect();
      return;
    }
    relationshipSocketService.connect();

    const relSocket = relationshipSocketService.getSocket();
    const handleRelConnect = () =>
      showToast("Ket noi realtime ket ban thanh cong", "success");
    const handleRelDisconnect = () =>
      showToast("Mat ket noi realtime ket ban", "warning");

    relSocket?.on("connect", handleRelConnect);
    relSocket?.on("disconnect", handleRelDisconnect);

    return () => {
      relSocket?.off("connect", handleRelConnect);
      relSocket?.off("disconnect", handleRelDisconnect);
    };
  }, [currentUser, showToast]);

  useEffect(() => {
    const normalizedUserId = getNormalizedUserId(currentUser);
    if (!normalizedUserId) return;

    const handleRelationshipUpdate = (payload: RelationshipRealtimePayload) => {
      if (!payload) return;

      const targetIds = payload.targetUserIds || [];
      const isTarget =
        targetIds.includes(normalizedUserId) ||
        payload.requesterId === normalizedUserId ||
        payload.receiverId === normalizedUserId;

      if (!isTarget) return;

      const isActor = payload.actorId === normalizedUserId;

      switch (payload.type) {
        case "REQUEST_SENT":
          if (payload.receiverId === normalizedUserId) {
            showToast("Ban co loi moi ket ban moi", "info");
          }
          break;
        case "REQUEST_ACCEPTED":
          if (!isActor && payload.requesterId === normalizedUserId) {
            showToast("Loi moi ket ban da duoc chap nhan", "success");
          }
          break;
        case "REQUEST_REJECTED":
          if (!isActor && payload.requesterId === normalizedUserId) {
            showToast("Loi moi ket ban bi tu choi", "warning");
          }
          break;
        case "REQUEST_CANCELED":
          if (payload.receiverId === normalizedUserId) {
            showToast("Loi moi ket ban da bi huy", "info");
          }
          break;
        case "UNFRIENDED":
          if (!isActor) {
            showToast("Quan he ban be da bi huy", "info");
          }
          break;
        case "BLOCKED":
          if (!isActor) {
            showToast("Ban da bi chan", "warning");
          }
          break;
        default:
          break;
      }
    };

    relationshipSocketService.onRelationshipUpdate(handleRelationshipUpdate);
    return () =>
      relationshipSocketService.offRelationshipUpdate(handleRelationshipUpdate);
  }, [currentUser, showToast]);

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
    relationshipSocketService.disconnect();
  };

  const logoutAll = () => {
    setCurrentUser(null);
    setSecondUser(null);
    relationshipSocketService.disconnect();
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
