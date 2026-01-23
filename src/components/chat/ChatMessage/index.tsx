import { memo, useMemo } from "react";
import { getFullUrl } from "../../../utils";
import { TextMessage } from "./TextMessage";
import { ImageMessage } from "./ImageMessage";
import { VideoMessage } from "./VideoMessage";
import { FileMessage } from "./FileMessage";

export const ChatMessage = memo(
  ({
    msg,
    isMe,
    isFirstInSequence,
    isLastInSequence,
  }: {
    msg: any;
    isMe: boolean;
    isFirstInSequence: boolean;
    isLastInSequence: boolean;
  }) => {
    const fullUrl = useMemo(() => {
      return msg.type !== "text" ? getFullUrl(msg.content) : "";
    }, [msg.content, msg.type]);

    switch (msg.type) {
      case "image":
        return (
          <ImageMessage
            msg={msg}
            url={fullUrl}
            isMe={isMe}
            isFirstInSequence={isFirstInSequence}
            isLastInSequence={isLastInSequence}
          />
        );

      case "video":
        return (
          <VideoMessage
            msg={msg}
            url={fullUrl}
            isMe={isMe}
            isFirstInSequence={isFirstInSequence}
            isLastInSequence={isLastInSequence}
          />
        );

      case "file":
        return (
          <FileMessage
            msg={msg}
            url={fullUrl}
            fileName={msg.fileName}
            size={msg.size}
            isMe={isMe}
            isFirstInSequence={isFirstInSequence}
            isLastInSequence={isLastInSequence}
          />
        );

      case "text":
      default:
        return (
          <TextMessage
            msg={msg}
            isMe={isMe}
            isFirstInSequence={isFirstInSequence}
            isLastInSequence={isLastInSequence}
          />
        );
    }
  },
  (prev, next) => {
    return (
      prev.msg._id === next.msg._id &&
      prev.msg.content === next.msg.content &&
      prev.isFirstInSequence === next.isFirstInSequence &&
      prev.isLastInSequence === next.isLastInSequence
    );
  },
);
