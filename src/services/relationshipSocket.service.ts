import io from "socket.io-client";
import type { Socket } from "socket.io-client";
import { SOCKET_RELATIONSHIP_SERVER_URL } from "../config/api.config";

export type RelationshipEventType =
  | "REQUEST_SENT"
  | "REQUEST_ACCEPTED"
  | "REQUEST_REJECTED"
  | "REQUEST_CANCELED"
  | "REQUEST_CANCELLED"
  | "UNFRIENDED"
  | "BLOCKED"
  | "USER_BLOCKED";

export type RelationshipRealtimePayload = {
  type: RelationshipEventType;
  relationshipId: string;
  requesterId?: string | null;
  receiverId?: string | null;
  status?: string | null;
  actorId?: string | null;
  timestamp?: string;
  targetUserIds?: string[];
};

class RelationshipSocketService {
  private socket: Socket | null = null;
  private readonly endpoint = SOCKET_RELATIONSHIP_SERVER_URL;
  private readonly enabled = Boolean(SOCKET_RELATIONSHIP_SERVER_URL);
  private userRoomId: string | null = null;
  private joinedUserRoomKey: string | null = null;

  private emitJoinUserRoom(socket: Socket, userId: string) {
    const joinKey = `${socket.id || "pending"}:${userId}`;
    if (this.joinedUserRoomKey === joinKey) return;

    socket.emit("tham_gia_user_room", userId);
    this.joinedUserRoomKey = joinKey;
    console.log(`Relationship socket joined user room: user:${userId}`);
  }

  joinUserRoom(userId: string) {
    const socket = this.ensureSocket();
    this.userRoomId = userId;

    if (socket && socket.connected) {
      this.emitJoinUserRoom(socket, userId);
    }
  }

  private ensureSocket(): Socket | null {
    return this.socket ?? this.connect();
  }

  connect(): Socket | null {
    if (this.socket) return this.socket;
    if (!this.enabled) return null;

    const token = localStorage.getItem("accessToken");
    const socket = io(this.endpoint, {
      transports: ["polling", "websocket"],
      timeout: 5000,
      reconnection: false,
      auth: {
        token: token,
      },
    });

    socket.on("connect", () => {
      console.log("Relationship socket connection:", socket.id);
      this.joinedUserRoomKey = null;
      if (this.userRoomId) {
        this.emitJoinUserRoom(socket, this.userRoomId);
      }
    });
    socket.on("disconnect", () => {
      console.log("Relationship socket disconnected");
      this.joinedUserRoomKey = null;
    });
    socket.on("connect_error", (err) =>
      console.warn("Relationship socket error:", err.message),
    );

    return (this.socket = socket);
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.userRoomId = null;
    this.joinedUserRoomKey = null;
  }

  onRelationshipUpdate(
    callback: (payload: RelationshipRealtimePayload) => void,
  ) {
    this.ensureSocket()?.on("cap_nhat_quan_he", callback);
  }

  offRelationshipUpdate(
    callback?: (payload: RelationshipRealtimePayload) => void,
  ) {
    if (callback) {
      this.socket?.off("cap_nhat_quan_he", callback);
    } else {
      this.socket?.removeAllListeners("cap_nhat_quan_he");
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  onConnect(callback: () => void) {
    this.ensureSocket()?.on("connect", callback);
  }

  offConnect(callback: () => void) {
    this.socket?.off("connect", callback);
  }
}

export const relationshipSocketService = new RelationshipSocketService();
