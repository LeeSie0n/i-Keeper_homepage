import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt-ts";

const prisma = new PrismaClient();

async function main() {
  console.log("===== START SAFE SEEDING =====");

  // 1. PERMISSIONS
  const permissionsCount = await prisma.permission.count();
  if (permissionsCount === 0) {
    console.log("Creating default permissions...");
    await createPermissions();
  } else {
    console.log("Permissions already exist → skipped");
  }

  // 2. ROLES
  const rolesCount = await prisma.role.count();
  if (rolesCount === 0) {
    console.log("Creating default roles...");
    await createRoles();
  } else {
    console.log("Roles already exist → skipped");
  }

  // 3. ADMIN USER
  const admin = await prisma.user.findUnique({
    where: { email: "admin@email.com" },
  });

  if (!admin) {
    console.log("Creating default admin user...");
    await createAdminUser();
  } else {
    console.log("Admin user already exists → skipped");
  }
  const member = await prisma.user.findUnique({
    where: { email: "user@email.com" },
  });

  if (!member) {
    console.log("Creating default member user...");
    await createMemberUser();
  } else {
    console.log("Member user already exists → skipped");
  }
  const oseojin = await prisma.user.findUnique({
    where: { email: "osjin5137@gmail.com" },
  });

  if (!oseojin) {
    console.log("Creating Oseojin...");
    await createOSJUser();
  } else {
    console.log("Oseojin already exists → skipped");
  }

  // 4. CATEGORIES
  const categoriesCount = await prisma.category.count();
  if (categoriesCount === 0) {
    console.log("Creating default categories...");
    await createCategories();
  } else {
    console.log("Categories already exist → skipped");
  }

  console.log("===== SAFE SEEDING COMPLETED =====");
}

/* -------------------------------------------------
    CREATE PERMISSIONS
-------------------------------------------------- */

async function createPermissions() {
  const permissionList = [
    // === USER MANAGEMENT ===
    { action: "view_pending_users", description: "View users pending approval" },
    { action: "approve_users", description: "Approve or reject user registrations" },
    { action: "view_all_users", description: "View all users" },
    { action: "view_user_details", description: "View detailed user information" },
    { action: "update_user", description: "Update user information" },
    { action: "delete_user", description: "Delete users" },

    // === ROLE MANAGEMENT ===
    { action: "view_roles", description: "View all roles" },
    { action: "create_role", description: "Create new roles" },
    { action: "update_role", description: "Update role details and permissions" },
    { action: "delete_role", description: "Delete roles" },
    { action: "transfer_role", description: "Transfer roles between users" },

    // === POST MANAGEMENT ===
    { action: "create_post", description: "Create new posts" },
    { action: "edit_own_post", description: "Edit own posts" },
    { action: "edit_any_post", description: "Edit any post" },
    { action: "delete_own_post", description: "Delete own posts" },
    { action: "delete_any_post", description: "Delete any post" },
    { action: "view_posts", description: "View posts" },

    // === COMMENT MANAGEMENT ===
    { action: "create_comment", description: "Create comments" },
    { action: "view_comments", description: "View comments" },
    { action: "edit_own_comment", description: "Edit own comments" },
    { action: "edit_any_comment", description: "Edit any comment" },
    { action: "delete_own_comment", description: "Delete own comments" },
    { action: "delete_any_comment", description: "Delete any comment" },

    // === CATEGORY MANAGEMENT ===
    { action: "view_categories", description: "View categories" },
    { action: "create_category", description: "Create new categories" },
    { action: "update_category", description: "Update categories" },
    { action: "delete_category", description: "Delete categories" },

    // === BOOK MANAGEMENT ===
    { action: "view_books", description: "View book list" },
    { action: "manage_books", description: "Add, edit, and delete books" },
    { action: "borrow_book", description: "Borrow books" },
    { action: "return_book", description: "Return borrowed books" },

    // === FEE MANAGEMENT ===
    { action: "view_fees", description: "View all fees" },
    { action: "manage_fees", description: "Create and update fees" },
    { action: "view_own_fees", description: "View own fee records" },
    { action: "pay_fee", description: "Pay fees" },

    // === EVENT MANAGEMENT ===
    { action: "view_events", description: "View events" },
    { action: "manage_events", description: "Create, edit, and delete events" },

    // === ATTENDANCE ===
    { action: "view_attendance", description: "View attendance records" },
    { action: "manage_attendance", description: "Manage attendance" },
    { action: "check_in", description: "Check in for events" },
    { action: "view_own_attendance", description: "View own attendance" },

    // === EVALUATION ===
    { action: "view_evaluations", description: "View all evaluations" },
    { action: "manage_evaluations", description: "Create/edit evaluations" },
    { action: "view_own_evaluations", description: "View own evaluations" },

    // === FILES ===
    { action: "upload_file", description: "Upload files" },
    { action: "view_files", description: "View all files" },
    { action: "view_own_files", description: "View own files" },
    { action: "delete_own_file", description: "Delete own files" },
    { action: "delete_any_file", description: "Delete any file" },
    { action: "download_file", description: "Download files" },

    // === AWARDS ===
    { action: "view_all_awards", description: "View all users' awards" },
    { action: "view_awards", description: "View awards" },
    { action: "view_own_awards", description: "View own awards" },
    { action: "create_own_award", description: "Create own award" },
    { action: "update_own_award", description: "Update own award" },
    { action: "delete_own_award", description: "Delete own award" },
    { action: "create_any_award", description: "Create award for any user" },
    { action: "update_any_award", description: "Update any user's award" },
    { action: "delete_any_award", description: "Delete any user's award" },

    // === EDUCATION ===
    { action: "view_all_education", description: "View all education records" },
    { action: "view_education", description: "View education" },
    { action: "view_own_education", description: "View own education" },
    { action: "create_own_education", description: "Create own education" },
    { action: "update_own_education", description: "Update own education" },
    { action: "delete_own_education", description: "Delete own education" },
    { action: "create_any_education", description: "Create for any user" },
    { action: "update_any_education", description: "Update any user's education" },
    { action: "delete_any_education", description: "Delete any user's education" },

    // === CLEANINGS ===
    { action: "view_cleanings", description: "View cleaning schedules" },
    { action: "create_cleanings", description: "Create cleaning schedules" },
    { action: "update_cleanings", description: "Update cleaning schedules" },
    { action: "delete_cleanings", description: "Delete cleaning schedules" },
  ];

  await prisma.permission.createMany({
    data: permissionList,
    skipDuplicates: true,
  });

  console.log("Permissions created.");
}

/* -------------------------------------------------
    ROLES
-------------------------------------------------- */

async function createRoles() {
  const permissions = await prisma.permission.findMany();
  const getIds = (actions: string[]) =>
    permissions.filter((p) => actions.includes(p.action)).map((p) => ({ permissionId: p.id }));

  // Admin → 모든 권한
  await prisma.role.create({
    data: {
      name: "admin",
      description: "Administrator with full permissions",
      permissions: {
        create: permissions.map((p) => ({ permissionId: p.id })),
      },
    },
  });

  // Member
  const memberList = [
    "create_post", "edit_own_post", "delete_own_post",
    "create_comment", "view_posts", "view_comments",
    "view_categories","view_books","borrow_book","return_book",
    "view_own_fees","pay_fee","view_events","check_in",
    "view_own_attendance","view_own_evaluations",
    "upload_file","view_own_files","delete_own_file","download_file",
    "view_own_awards","create_own_award","update_own_award","delete_own_award",
    "view_own_education","create_own_education",
    "update_own_education","delete_own_education",
  ];

  await prisma.role.create({
    data: {
      name: "member",
      description: "Regular member",
      permissions: { create: getIds(memberList) },
    },
  });

  // Non-member
  const nonMemberList = [
    "view_posts","view_comments","view_categories",
    "view_books","view_events","view_awards","view_education",
  ];

  await prisma.role.create({
    data: {
      name: "non-member",
      description: "Non-member with limited access",
      permissions: { create: getIds(nonMemberList) },
    },
  });

  console.log("Roles created.");
}

/* -------------------------------------------------
    ADMIN USER
-------------------------------------------------- */
async function createAdminUser() {
  const hashed = await hash("Admin1234!", 10);

  await prisma.user.create({
    data: {
      email: "admin@email.com",
      password: hashed,
      name: "System Administrator",
      studentId: "ADMIN001",
      status: "active",
      role: { connect: { name: "admin" } },
    },
  });

  console.log("Admin user created.");
}

async function createMemberUser() {
  const hashed = await hash("User1234!", 10);

  await prisma.user.create({
    data: {
      email: "user@email.com",
      password: hashed,
      name: "Member User",
      studentId: "USER001",
      status: "active",
      role: { connect: { name: "member" } },
    },
  });

  console.log("Member user created.");
}

async function createOSJUser() {
  const hashed = await hash("Osj0414!", 10);

  await prisma.user.create({
    data: {
      email: "osjin5137@gmail.com",
      password: hashed,
      name: "오서진",
      studentId: "23114548",
      status: "active",
      role: { connect: { name: "member" } },
    },
  });

  console.log("Oseojin created.");
}

/* -------------------------------------------------
    CATEGORIES
-------------------------------------------------- */
async function createCategories() {
  const categories = [
    { name: "공지", description: "공지" },
    { name: "팀빌딩", description: "팀빌딩" },
    { name: "Keeper 세미나", description: "Keeper 세미나" },
    { name: "정보공유세미나", description: "정보공유세미나" },
    { name: "특강", description: "특강" },
    { name: "문의", description: "문의" },
  ];

  await prisma.category.createMany({
    data: categories,
    skipDuplicates: true,
  });

  console.log("Categories created.");
}

/* ------------------------------------------------- */

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
