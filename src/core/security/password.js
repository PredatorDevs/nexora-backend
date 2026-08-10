import argon2 from 'argon2';

export const dummyPasswordHash =
  '$argon2id$v=19$m=65536,t=3,p=4$YnyIocCWv9KwhwrXeiusIw$8vovc+51tvhFbQkOXo0JBYyWm5kks445qRvBXNyX4Ww';

const passwordOptions = Object.freeze({
  type: argon2.argon2id,
  memoryCost: 65_536,
  timeCost: 3,
  parallelism: 4,
});

export function hashPassword(password) {
  return argon2.hash(password, passwordOptions);
}

export function verifyPassword(passwordHash, password) {
  return argon2.verify(passwordHash, password);
}
