type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "owner" | "employee";
};

const users: User[] = [
  {
    id: "owner-1",
    name: "Owner User",
    email: "owner@example.com",
    password: "ownerpassword",
    role: "owner",
  },
  {
    id: "employee-1",
    name: "Employee User",
    email: "employee@example.com",
    password: "employeepassword",
    role: "employee",
  },
];

export function findUserByEmail(email: string) {
  return users.find(
    (user) => user.email.toLowerCase() === email.toLowerCase()
  );
}

export function addUser({
  name,
  email,
  password,
  role,
}: Omit<User, "id">) {
  const user: User = {
    id: `user-${Date.now()}`,
    name,
    email,
    password,
    role,
  };
  users.push(user);
  return user;
}
