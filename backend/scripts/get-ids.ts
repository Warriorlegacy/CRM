const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('\n=== USERS ===');
  const users = await prisma.user.findMany();
  users.forEach((u: any) => console.log(`ID: ${u.id} | Email: ${u.email} | Name: ${u.name}`));

  console.log('\n=== WORKSPACES ===');
  const workspaces = await prisma.workspace.findMany();
  workspaces.forEach((w: any) => console.log(`ID: ${w.id} | Name: ${w.name}`));

  console.log('\n=== WORKSPACE MEMBERS ===');
  const members = await prisma.workspaceMember.findMany({
    include: { user: true, workspace: true }
  });
  members.forEach((m: any) => console.log(`Workspace: ${m.workspace.name} | User: ${m.user.name} | Role: ${m.role}`));

  console.log('\n=== CONTACTS ===');
  const contacts = await prisma.contact.findMany();
  contacts.forEach((c: any) => console.log(`ID: ${c.id} | Name: ${c.name} | Phone: ${c.phone}`));

  console.log('\n=== CONVERSATIONS ===');
  const conversations = await prisma.conversation.findMany({
    include: { contact: true }
  });
  conversations.forEach((c: any) => console.log(`ID: ${c.id} | Contact: ${c.contact.name}`));

  console.log('\n=== SAMPLE API HEADERS ===');
  if (users[0] && workspaces[0]) {
    console.log(`x-user-id: ${users[0].id}`);
    console.log(`x-workspace-id: ${workspaces[0].id}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
