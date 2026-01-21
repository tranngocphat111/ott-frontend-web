import { io, Socket } from "socket.io-client";
import { SOCKET_CHAT_SERVER_URL } from "../config/api.config";

class SocketService {
  private socket: Socket | null = null;

  // Kết nối socket
  connect(): Socket {
    if (!this.socket) {
      this.socket = io(SOCKET_CHAT_SERVER_URL, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      this.socket.on("connect", () => {
        console.log("✅ Socket connected:", this.socket?.id);
      });

      this.socket.on("disconnect", () => {
        console.log("❌ Socket disconnected");
      });

      this.socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });
    }

    return this.socket;
  }

  // Ngắt kết nối socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log("Socket disconnected manually");
    }
  }

  // Tham gia vào room conversation
  joinConversation(conversationId: string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit("tham_gia_nhom", conversationId);
      console.log(
        `🚪 [SocketService] Joined conversation room: ${conversationId}`,
      );
    } else if (this.socket && !this.socket.connected) {
      console.warn("⚠️ Socket exists but not connected yet, waiting...");
      this.socket.once("connect", () => {
        this.socket?.emit("tham_gia_nhom", conversationId);
        console.log(
          `🚪 [SocketService] Joined conversation room after reconnect: ${conversationId}`,
        );
      });
    } else {
      console.error("❌ Socket not initialized, cannot join conversation");
    }
  }

  // Lắng nghe tin nhắn mới
  onNewMessage(callback: (message: any) => void) {
    if (this.socket) {
      console.log("🔔 Setting up listener for 'tin_nhan' event");
      this.socket.on("tin_nhan", (message) => {
        console.log("🔥 [SocketService] Event 'tin_nhan' received:", message);
        callback(message);
      });
    } else {
      console.warn("⚠️ Socket not connected, cannot setup listener");
    }
  }

  // Hủy lắng nghe tin nhắn
  offNewMessage(callback?: (message: any) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off("tin_nhan", callback);
      } else {
        this.socket.off("tin_nhan");
      }
      console.log("🔕 Removed listener for 'tin_nhan' event");
    }
  }

  // Get socket instance
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Export singleton instance
export const socketService = new SocketService();
