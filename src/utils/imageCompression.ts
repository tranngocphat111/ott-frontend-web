import imageCompression from "browser-image-compression";

export type ImageCompressionOptions = {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    fileType?: string;
    useWebWorker?: boolean;
    initialQuality?: number;
};

const renameWithExtension = (fileName: string, fileType: string) => {
    const extensionByType: Record<string, string> = {
        "image/webp": "webp",
        "image/jpeg": "jpg",
        "image/png": "png",
    };
    const extension = extensionByType[fileType] || fileName.split(".").pop() || "";
    if (!extension) return fileName;

    const baseName = fileName.replace(/\.[^.]+$/, "");
    return `${baseName || "image"}.${extension}`;
};

export const compressImageFile = async (
    file: File,
    options: ImageCompressionOptions = {},
): Promise<File> => {
    if (!file.type.startsWith("image/")) {
        return file;
    }
    if (file.type.toLowerCase() === "image/svg+xml" || /\.svg$/i.test(file.name)) {
        return file;
    }

    const {
        maxSizeMB = 1.5,
        maxWidthOrHeight = 1920,
        fileType,
        useWebWorker = true,
        initialQuality = 0.8,
    } = options;
    const outputType = fileType ?? file.type;

    try {
        const compressed = await imageCompression(file, {
            maxSizeMB,
            maxWidthOrHeight,
            useWebWorker,
            initialQuality,
            fileType: outputType,
        });

        const outputName =
            outputType !== file.type ? renameWithExtension(file.name, outputType) : file.name;

        if (compressed instanceof File) {
            return new File([compressed], outputName, {
                type: compressed.type || outputType,
                lastModified: file.lastModified || Date.now(),
            });
        }

        return new File([compressed], outputName, {
            type: outputType,
            lastModified: file.lastModified || Date.now(),
        });
    } catch (error) {
        console.error("compressImageFile failed", error);
        return file;
    }
};
