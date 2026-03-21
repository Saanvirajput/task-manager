import { PrismaClient, Status, Priority } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'test@example.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Cleanup existing tasks (optional but good for clean seed)
    await prisma.task.deleteMany({ where: { user: { email } } });

    // 2. Ensure User exists
    const user = await prisma.user.upsert({
        where: { email },
        update: { password: hashedPassword },
        create: {
            email,
            password: hashedPassword,
            name: 'Test Analyst',
        },
    });

    console.log('User verified:', user.email);

    // 3. Generate 20+ Diverse Tasks for Analytics
    const statuses = [Status.TODO, Status.IN_PROGRESS, Status.DONE];
    const priorities = [Priority.LOW, Priority.MEDIUM, Priority.HIGH];
    const titles = [
        'Q1 Revenue Analysis', 'Security Audit', 'Migration to Cloud',
        'Product Roadmap v2', 'API Documentation', 'UX Research',
        'Bug Scrub', 'Team Sync', 'Marketing Campaign', 'Performance Tuning',
        'CI/CD Pipeline Fix', 'Database Indexing', 'Frontend Refactor',
        'Stakeholder Review', 'User Interview #4', 'Competitor Research',
        'OAuth Integration', 'Unit Test Coverage', 'Accessibility Audit',
        'Brand Identity Update'
    ];

    console.log('Generating 20 tasks across last 10 days...');

    for (let i = 0; i < titles.length; i++) {
        const status = i < 8 ? Status.DONE : (i < 15 ? Status.IN_PROGRESS : Status.TODO);
        const priority = priorities[i % 3];

        // Spread across last 10 days
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - (i % 10));

        await prisma.task.create({
            data: {
                title: titles[i],
                description: `Detailed analysis and execution of ${titles[i]} for the Q1 cycle.`,
                status,
                priority,
                userId: user.id,
                createdAt,
                completedAt: status === Status.DONE ? new Date(createdAt.getTime() + 86400000) : null,
            },
        });
    }

    console.log('Successfully seeded 20 enhanced tasks for analysis!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
