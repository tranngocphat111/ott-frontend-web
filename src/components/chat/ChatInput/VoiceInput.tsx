import { useRef, useState, useEffect } from "react";
import { Mic, X, Send } from "lucide-react";

interface VoiceInputProps {
  disabled: boolean;
  onVoiceFile: (file: File) => void;
}

export const VoiceInput = ({ disabled, onVoiceFile }: VoiceInputProps) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  // Cleanup stream on component unmount or when disabled
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        streamRef.current = null;
      }
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const openRecordingModal = () => {
    setIsModalOpen(true);
    startRecording();
  };

  const startRecording = async () => {
    try {
      setRecordingTime(0);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Clear timer
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
        }

        // Ensure stream cleanup in case onstop is triggered from elsewhere
        const currentStream = streamRef.current;
        if (currentStream) {
          currentStream.getTracks().forEach((track) => {
            track.stop();
          });
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Lỗi truy cập micro:", error);
      alert("Không thể truy cập micro. Vui lòng kiểm tra quyền cấp phép.");
      setIsModalOpen(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Clear timer
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }

      // Stop all tracks immediately
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        streamRef.current = null;
      }
      // Then stop the recorder (triggers onstop callback)
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      stopRecording();

      setTimeout(() => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const file = new File([blob], `voice-${timestamp}.webm`, {
          type: "audio/webm",
        });
        onVoiceFile(file);
        setIsModalOpen(false);
        setRecordingTime(0);
      }, 100);
    }
  };

  const cancelRecording = () => {
    stopRecording();

    // Clear timer
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }

    // Clear chunks
    audioChunksRef.current = [];

    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }

    setIsRecording(false);
    setIsModalOpen(false);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <>
      {/* Mic Button */}
      <button
        onClick={openRecordingModal}
        disabled={disabled}
        className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
        title="Ghi âm tin nhắn"
      >
        <Mic size={20} />
      </button>

      {/* Recording Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50 animate-fade-in">
          <div className="bg-white w-full rounded-t-3xl p-6 animate-slide-up">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-semibold text-gray-800">
                Ghi âm tin nhắn
              </h3>
              <button
                onClick={cancelRecording}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            {/* Recording Content */}
            <div className="flex flex-col items-center justify-center py-12">
              {/* Waveform Animation */}
              <div className="flex items-center justify-center gap-1 mb-8 h-16">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`w-1 bg-primary-500 rounded-full transition-all ${
                      isRecording ? "animate-pulse" : ""
                    }`}
                    style={{
                      height: isRecording
                        ? `${20 + Math.random() * 40}px`
                        : "20px",
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>

              {/* Timer */}
              <div className="text-4xl font-bold text-primary-600 mb-4 font-mono">
                {formatTime(recordingTime)}
              </div>

              {/* Recording Status */}
              <p className="text-gray-600 text-sm mb-8">
                {isRecording ? "Đang ghi âm..." : "Đã dừng"}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={cancelRecording}
                disabled={!isRecording}
                className="flex-1 px-6 py-3 rounded-full bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <X size={20} />
                Hủy
              </button>
              <button
                onClick={sendRecording}
                disabled={!isRecording}
                className="flex-1 px-6 py-3 rounded-full bg-primary-500 text-white font-semibold hover:bg-primary-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <Send size={20} />
                Gửi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
