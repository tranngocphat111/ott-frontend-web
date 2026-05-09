import io from "socket.io-client";
import type { Socket } from "socket.io-client";
import { SOCKET_MEDIA_SERVER_URL } from "../config/api.config";

export type MediaRealtimeUpdate = {
    mediaId?: string | null;
    s3Key?: string | null;
    orderIndex?: number | null;
};

export type MediaRealtimePayload = {
    contentId?: string | null;
    contentTargetType?: string | null;
    operation?: string | null;
    mediaUpdates?: MediaRealtimeUpdate[];
    s3Keys?: string[];
    status?: string;
    timestamp?: string;
};

export type PostActivityPayload = {
    postId: string;
    activityType: "COMMENT" | "REACTION" | "SHARE";
    action: "CREATE" | "UPDATE" | "DELETE";
    data?: any; // Contains Comment or Reaction object depending on activityType
};

class MediaSocketService {
    private socket: Socket | null = null;
    private readonly endpoint = SOCKET_MEDIA_SERVER_URL;
    private readonly enabled = Boolean(SOCKET_MEDIA_SERVER_URL);

    private ensureSocket(): Socket | null {
        return this.socket ?? this.connect();
    }

    connect(): Socket | null {
        if (this.socket) return this.socket;
        if (!this.enabled) return null;

        const token = localStorage.getItem("accessToken");
        const socket = io(this.endpoint, {
            transports: ["websocket", "polling"],
            timeout: 5000,
            reconnection: false,
            auth: {
                token: token,
            },
        });

        socket.on("connect", () =>
            console.log("Media socket connection:", socket.id),
        );
        socket.on("disconnect", () =>
            console.log("Media socket disconnected"),
        );
        socket.on("connect_error", (err) =>
            console.warn("Media socket error:", err.message),
        );

        return (this.socket = socket);
    }

    disconnect() {
        this.socket?.disconnect();
        this.socket = null;
    }

    onMediaUpdate(callback: (payload: MediaRealtimePayload) => void) {
        this.ensureSocket()?.on("media_content_updated", callback);
    }

    offMediaUpdate(callback?: (payload: MediaRealtimePayload) => void) {
        if (callback) {
            this.socket?.off("media_content_updated", callback);
        } else {
            this.socket?.removeAllListeners("media_content_updated");
        }
    }

    onPostActivity(callback: (payload: PostActivityPayload) => void) {
        this.ensureSocket()?.on("post_activity_updated", callback);
    }

    offPostActivity(callback?: (payload: PostActivityPayload) => void) {
        if (callback) {
            this.socket?.off("post_activity_updated", callback);
        } else {
            this.socket?.removeAllListeners("post_activity_updated");
        }
    }
}

export const mediaSocketService = new MediaSocketService();
