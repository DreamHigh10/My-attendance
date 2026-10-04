export const AUTHORIZED_ADMIN_EMAILS = [
  'ogungbadekehinde19@gmail.com',
  'aduoluwaseyi33@gmail.com',
  'paulstanleytobechukwu01@gmail.com',
  'chiemelab166@gmail.com',
];

export const isAuthorizedAdmin = (email?: string | null): boolean => {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return AUTHORIZED_ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === normalized);
};
