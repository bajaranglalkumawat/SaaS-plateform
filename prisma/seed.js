const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial SaaS subscription plans...');

  const plans = [
    {
      name: 'Free Trial',
      code: 'free_trial',
      description: '14-Day Full Access Trial for small sellers & startups',
      monthlyPrice: 0,
      yearlyPrice: 0,
      maxInvoices: 25,
      maxProducts: 50,
      maxUsers: 1,
      maxCustomers: 50,
      hasInventory: true,
      hasAdvancedReports: false,
      hasMultipleBranches: false,
    },
    {
      name: 'Basic Plan',
      code: 'basic',
      description: 'Essential billing and customer management for small businesses',
      monthlyPrice: 499,
      yearlyPrice: 4999,
      maxInvoices: 200,
      maxProducts: 300,
      maxUsers: 2,
      maxCustomers: 500,
      hasInventory: true,
      hasAdvancedReports: false,
      hasMultipleBranches: false,
    },
    {
      name: 'Professional Plan',
      code: 'pro',
      description: 'Full invoicing, inventory control, PDF generation & advanced reports',
      monthlyPrice: 999,
      yearlyPrice: 9999,
      maxInvoices: -1,
      maxProducts: -1,
      maxUsers: 5,
      maxCustomers: -1,
      hasInventory: true,
      hasAdvancedReports: true,
      hasMultipleBranches: false,
    },
    {
      name: 'Business Plan',
      code: 'business',
      description: 'Multi-user, multi-branch, high volume commercial enterprise solution',
      monthlyPrice: 1999,
      yearlyPrice: 19999,
      maxInvoices: -1,
      maxProducts: -1,
      maxUsers: 25,
      maxCustomers: -1,
      hasInventory: true,
      hasAdvancedReports: true,
      hasMultipleBranches: true,
    },
  ];

  for (const planData of plans) {
    await prisma.plan.upsert({
      where: { code: planData.code },
      update: planData,
      create: planData,
    });
  }

  const adminEmail = 'admin@saasplatform.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  const adminProfile = {
    name: 'Platform Administrator',
    mobile: '+91 9000000001',
    whatsapp: '+91 9000000001',
    alternatePhone: null,
    address: 'BillFlow HQ, Tech Park',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    pincode: '560001',
    designation: 'Super Admin',
    gender: 'PREFER_NOT_TO_SAY',
    profileImageUrl: null,
  };

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('AdminPass123!', 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: 'SUPER_ADMIN',
        isActive: true,
        ...adminProfile,
      },
    });
    console.log('Super Admin user created: admin@saasplatform.com / AdminPass123!');
  } else {
    await prisma.user.update({
      where: { email: adminEmail },
      data: {
        ...adminProfile,
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    });
    console.log('Super Admin already exists — profile details refreshed: admin@saasplatform.com');
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
