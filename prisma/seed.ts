import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import { Role } from "../src/generated/prisma/enums.ts";
import { ApplicationStatus } from "../src/generated/prisma/enums.ts";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!
});

const prisma = new PrismaClient({
  adapter
});

/* I ran the command "npx prisma db seed" without defining job and application, so it created the user,
   so second time when I ran the command after defining job and application, I was getting 'duplicate key value violates unique constraint "User_email_key"'
   So I wrote the findUnique method to first fetch the email of Rahul, Amit and Rohit and then executed the command.
*/

// const recruiter1 = await prisma.user.create({
//   data: {
//     name: "Rahul",
//     email: "rahul123@gmail.com",
//     password: "Rahul123",
//     role: Role.RECRUITER,
//   },
// });

const recruiter1 = await prisma.user.findUnique({
  where: {
    email: "rahul123@gmail.com"
  }
})

// const recruiter2 = await prisma.user.create({
//   data: {
//     name: "Amit",
//     email: "amit@gmail.com",
//     password: "Amit123",
//     role: Role.RECRUITER,
//   },
// });

const recruiter2 = await prisma.user.findUnique({
  where: {
    email: "amit@gmail.com"
  }
})

// const candidate = await prisma.user.create({
//   data: {
//     name: "Rohit",
//     email: "rohit@gmail.com",
//     password: "Rohit123",
//     role: Role.CANDIDATE,
//   },
// });

const candidate = await prisma.user.findUnique({
  where: {
    email: "rohit@gmail.com"
  }
})

if (!recruiter1 || !recruiter2 || !candidate) {
  throw new Error("Required users not found");
}

const job = await prisma.job.create({
  data: {
    title: "Node.js Developer",
    description: "We are looking for experienced Node.js developer",
    company: "XYZ",
    location: "Pune",
    experience: 3,
    skills: "Node.js",
    recruiterId: recruiter1.id
  }
})

const application = await prisma.application.create({
  data: {
    candidateId: candidate.id,
    jobId: job.id,
    status: ApplicationStatus.APPLIED,
    appliedAt: new Date()
  }
})
