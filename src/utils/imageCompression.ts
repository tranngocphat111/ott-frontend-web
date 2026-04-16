import imageCompression from "browser-image-compression";

export type ImageCompressionOptions = {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    fileType?: string;
    useWebWorker?: boolean;
    initialQuality?: number;
};

export const compressImageFile = async (
    file: File,
    options: ImageCompressionOptions = {},
): Promise<File> => {
    if (!file.type.startsWith("image/")) {
        return file;
    }

    const {
        maxSizeMB = 1.5,
        maxWidthOrHeight = 1920,
        fileType,
        useWebWorker = true,
        initialQuality = 0.8,
    } = options;

    try {
        const compressed = await imageCompression(file, {
            maxSizeMB,
            maxWidthOrHeight,
            useWebWorker,
            initialQuality,
            fileType: fileType ?? file.type,
        });

        if (compressed instanceof File) {
            return compressed;
        }

        return new File([compressed], file.name, {
            type: fileType ?? file.type,
            lastModified: Date.now(),
        });
    } catch (error) {
        console.error("compressImageFile failed", error);
        return file;
    }
};
