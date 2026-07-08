import bcrypt from 'bcryptjs';

// Isolated from auth.js (which imports next/headers) so plain-Node scripts
// like the seeder can hash passwords without pulling in the Next runtime.
export function hashPassword(plain) {
  return bcrypt.hashSync(plain, 11);
}

export function verifyPassword(plain, hash) {
  try {
    return bcrypt.compareSync(plain, hash);
  } catch {
    return false;
  }
}
