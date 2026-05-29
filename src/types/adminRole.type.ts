export const AdminRole = {
  ADMIN: "ADMIN",
} as const;

export type AdminRole = (typeof AdminRole)[keyof typeof AdminRole];

export default AdminRole;
