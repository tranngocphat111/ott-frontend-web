import { useState, useEffect } from "react";
import type { User } from "../types";
import { UserService } from "../services";

export const useMessageSender = (
  senderId: string | number | undefined,
  isMe: boolean,
  shouldFetch: boolean = true,
) => {
  const [sender, setSender] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (isMe || !senderId || !shouldFetch) return;

      try {
        const userData = await UserService.getUserById(String(senderId));
        setSender(userData);
      } catch (error) {
        console.error("Lỗi lấy user:", error);
      }
    };
    fetchUser();
  }, [senderId, isMe, shouldFetch]);

  return sender;
};
