export const AdminRole = {
  SUPER_ADMIN: "SUPER_ADMIN",
  MODERATOR: "MODERATOR",
  ANALYST: "ANALYST",
} as const;

export type AdminRole = (typeof AdminRole)[keyof typeof AdminRole];

export default AdminRole;
