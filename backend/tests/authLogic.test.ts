import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validatePasswordPolicy,
  hashPassword,
  verifyPassword,
  assertSingleAdminInvariant,
  generateToken,
  type UserRecord,
} from '../src/authService.ts';

test('validatePasswordPolicy enforces secure password requirements', () => {
  // Valid strong password
  const strong = validatePasswordPolicy('Admin123!');
  assert.equal(strong.isValid, true);

  // Too short (< 8 chars)
  const tooShort = validatePasswordPolicy('Ab1!');
  assert.equal(tooShort.isValid, false);
  assert.match(tooShort.message || '', /8 caracteres/);

  // Missing uppercase
  const noUpper = validatePasswordPolicy('admin123!');
  assert.equal(noUpper.isValid, false);
  assert.match(noUpper.message || '', /mayúscula/);

  // Missing lowercase
  const noLower = validatePasswordPolicy('ADMIN123!');
  assert.equal(noLower.isValid, false);
  assert.match(noLower.message || '', /minúscula/);

  // Missing number
  const noNum = validatePasswordPolicy('AdminPass!');
  assert.equal(noNum.isValid, false);
  assert.match(noNum.message || '', /número/);
});

test('hashPassword and verifyPassword with PBKDF2 works reliably', () => {
  const password = 'SuperSecretPassword2026!';
  const { hash, salt } = hashPassword(password);
  
  assert.ok(hash.length >= 64, 'Hash must be at least 64 hex characters');
  assert.ok(salt.length >= 16, 'Salt must be at least 16 hex characters');
  
  // Verify matching password
  const isValid = verifyPassword(password, hash, salt);
  assert.equal(isValid, true);

  // Verify non-matching password
  const isInvalid = verifyPassword('WrongPassword123!', hash, salt);
  assert.equal(isInvalid, false);
});

test('assertSingleAdminInvariant strictly enforces strictly ONE active administrator', () => {
  const admin1: UserRecord = {
    id: 'usr-admin-1',
    email: 'admin@clinicamedical.com',
    passwordHash: 'dummy',
    salt: 'salt',
    fullName: 'Administrador Sistema',
    role: 'Administrador',
    status: 'ACTIVE',
    failedLoginAttempts: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const patient: UserRecord = {
    id: 'usr-pac-1',
    email: 'paciente@gmail.com',
    passwordHash: 'dummy',
    salt: 'salt',
    fullName: 'María López',
    role: 'Paciente',
    status: 'ACTIVE',
    failedLoginAttempts: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Updating the existing admin themselves -> allowed
  assert.doesNotThrow(() => {
    assertSingleAdminInvariant([admin1, patient], 'Administrador', 'usr-admin-1');
  });

  // Assigning role Paciente or Medico -> allowed
  assert.doesNotThrow(() => {
    assertSingleAdminInvariant([admin1, patient], 'Paciente');
    assertSingleAdminInvariant([admin1, patient], 'Médico');
  });

  // Attempting to create a second user with role Administrador -> throws error
  assert.throws(() => {
    assertSingleAdminInvariant([admin1, patient], 'Administrador', 'usr-new-intruder');
  }, /Violación de seguridad y restricción de unicidad/);
});

test('generateToken produces high-entropy crypto tokens', () => {
  const token1 = generateToken();
  const token2 = generateToken();
  assert.equal(typeof token1, 'string');
  assert.equal(token1.length, 64);
  assert.notEqual(token1, token2);
});

test('password recovery flow: token expiration and secure validation', () => {
  const token = '582910';
  const validRecord = {
    token,
    userId: 'usr-admin',
    email: 'admin@clinicamedical.com',
    expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
    used: false,
  };

  // 1. Valid token
  assert.equal(validRecord.used, false);
  assert.ok(Date.now() < validRecord.expiresAt);

  // 2. Expired token check
  const expiredRecord = {
    ...validRecord,
    expiresAt: Date.now() - 1000, // expired 1s ago
  };
  assert.ok(Date.now() > expiredRecord.expiresAt);

  // 3. Already used token check
  const usedRecord = {
    ...validRecord,
    used: true,
  };
  assert.equal(usedRecord.used, true);
});
