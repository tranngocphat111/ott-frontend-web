import { apiClient } from './client';
import type {
  PhotoListResponse,
  PresignedUrlResponse,
  UserPhotoResponse,
} from '../../types/response/photo.response';
import type { AddPhotoRequest } from '../../types/request/photo.request';
import type { ApiResponse } from '../../types';
import type { UserProfileResponse } from '../../types';
import { PhotoType } from '../../types/enums/photo.enum';

export const getPresignedUrl = async (
  filename: string,
  type: PhotoType
): Promise<PresignedUrlResponse> => {
  const res = await (apiClient.get as any)('/users/photos/presigned-url', {
    params: { filename, type },
  }) as ApiResponse<PresignedUrlResponse>;
  return res.result!;
};

// ─── 2. Upload file lên S3 trực tiếp (không qua backend) ─────────────────────

export const uploadFileToS3 = async (
  uploadUrl: string,
  file: File,
  contentType: string,
  onProgress?: (percent: number) => void
): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', contentType);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve();
      } else {
        console.error('S3 error:', xhr.responseText);
        reject(new Error(`S3 upload failed: ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error('S3 upload network error'));
    xhr.send(file);
  });
};

// ─── 3. Gallery CRUD ──────────────────────────────────────────────────────────

export const getAllPhotos = async (): Promise<PhotoListResponse> => {
  const res = await (apiClient.get as any)('/users/photos') as ApiResponse<PhotoListResponse>;
  return res.result!;
};

export const addPhotoToGallery = async (
  body: AddPhotoRequest
): Promise<UserPhotoResponse> => {
  const res = await (apiClient.post as any)('/users/photos', body) as ApiResponse<UserPhotoResponse>;
  return res.result!;
};

export const deletePhoto = async (photoId: string): Promise<void> => {
  await (apiClient.delete as any)(`/users/photos/${photoId}`);
};

// ─── 4. Set active từ gallery ─────────────────────────────────────────────────

export const setActiveFromGallery = async (
  photoId: string
): Promise<UserPhotoResponse> => {
  const res = await (apiClient.patch as any)(
    `/users/photos/${photoId}/active`
  ) as ApiResponse<UserPhotoResponse>;
  return res.result!;
};

// ─── 5. Upload mới + set active (avatar / cover) ─────────────────────────────

export const uploadAndSetAvatar = async (
  body: AddPhotoRequest
): Promise<UserProfileResponse> => {
  const res = await (apiClient.patch as any)(
    '/users/photos/avatar', body
  ) as ApiResponse<UserProfileResponse>;
  return res.result!;
};

export const uploadAndSetCover = async (
  body: AddPhotoRequest
): Promise<UserProfileResponse> => {
  const res = await (apiClient.patch as any)(
    '/users/photos/cover', body
  ) as ApiResponse<UserProfileResponse>;
  return res.result!;
};

// ─── 6. Remove active (reset về default) ─────────────────────────────────────

export const removeActiveAvatar = async (): Promise<UserProfileResponse> => {
  const res = await (apiClient.delete as any)(
    '/users/photos/avatar'
  ) as ApiResponse<UserProfileResponse>;
  return res.result!;
};

export const removeActiveCover = async (): Promise<UserProfileResponse> => {
  const res = await (apiClient.delete as any)(
    '/users/photos/cover'
  ) as ApiResponse<UserProfileResponse>;
  return res.result!;
};


export interface UploadPhotoResult {
  profile: UserProfileResponse;
}

export const fullUploadFlow = async (
  file: File,
  type: PhotoType,
  onProgress?: (percent: number) => void
): Promise<UploadPhotoResult> => {

  const { uploadUrl, fileUrl, s3Key, contentType } =
    await getPresignedUrl(file.name, type);


  await uploadFileToS3(uploadUrl, file, contentType, onProgress);

  // Bước 3: gọi backend
  const body: AddPhotoRequest = { fileUrl, s3Key, photoType: type };

  const profile =
    type === PhotoType.AVATAR
      ? await uploadAndSetAvatar(body)
      : await uploadAndSetCover(body);

  return { profile };
};