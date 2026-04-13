import io from "socket.io-client-v2";
import type { Socket } from "socket.io-client-v2";
import { SOCKET_RELATIONSHIP_SERVER_URL } from "../config/api.config";

export type RelationshipEventType =
    | "REQUEST_SENT"
    | "REQUEST_ACCEPTED"
    | "REQUEST_REJECTED"
    | "REQUEST_CANCELED"
    | "UNFRIENDED"
    | "BLOCKED";

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

    private ensureSocket(): Socket {
        return this.socket ?? this.connect();
    }

    connect(): Socket {
        if (this.socket) return this.socket;

        const socket = io(SOCKET_RELATIONSHIP_SERVER_URL, {
            transports: ["websocket", "polling"],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socket.on("connect", () =>
            console.log("Relationship socket connection:", socket.id),
        );
        socket.on("disconnect", () =>
            console.log("Relationship socket disconnected"),
        );
        socket.on("connect_error", (err) =>
            console.error("Relationship socket error:", err.message),
        );

        return (this.socket = socket);
    }

    disconnect() {
        this.socket?.disconnect();
        this.socket = null;
    }

    onRelationshipUpdate(callback: (payload: RelationshipRealtimePayload) => void) {
        this.ensureSocket().on("cap_nhat_quan_he", callback);
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
        this.ensureSocket().on("connect", callback);
    }

    offConnect(callback: () => void) {
        this.socket?.off("connect", callback);
    }
}

export const relationshipSocketService = new RelationshipSocketService();
