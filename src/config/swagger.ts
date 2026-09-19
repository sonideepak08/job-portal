import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Job Portal Backend API",
      version: "1.0.0",
      description: "REST API for the Job Portal backend",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        RegisterRequest: {
          type: "object",
          required: ["name", "email", "password", "role"],
          properties: {
            name: {
              type: "string",
            },
            email: {
              type: "string",
              format: "email",
            },
            password: {
              type: "string",
              minLength: 8,
            },
            role: {
              type: "string",
              enum: ["RECRUITER", "CANDIDATE"],
            },
          },
        },
        RegisterResponse: {
          type: "object",
          required: ["success", "message", "data"],
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
            },
            data: {
              type: "object",
              required: ["id", "name", "email", "role"],
              properties: {
                id: {
                  type: "integer",
                },
                name: {
                  type: "string",
                },
                email: {
                  type: "string",
                  format: "email",
                },
                role: {
                  type: "string",
                  enum: ["RECRUITER", "CANDIDATE"],
                },
              },
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
            },
            password: {
              type: "string",
              minLength: 8,
            },
          },
        },
        LoginResponse: {
          type: "object",
          required: ["success", "message", "data"],
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
            },
            data: {
              type: "object",
              required: ["accessToken", "refreshToken"],
              properties: {
                accessToken: {
                  type: "string",
                },
                refreshToken: {
                  type: "string",
                },
              },
            },
          },
        },
        RefreshTokenRequest: {
          type: "object",
          required: ["refreshToken"],
          properties: {
            refreshToken: {
              type: "string",
            },
          },
        },
        LogoutRequest: {
          type: "object",
          required: ["refreshToken"],
          properties: {
            refreshToken: {
              type: "string",
            },
          },
        },
        RefreshTokenResponse: {
          type: "object",
          required: ["success", "message", "data"],
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
            },
            data: {
              type: "object",
              required: ["accessToken", "refreshToken"],
              properties: {
                accessToken: {
                  type: "string",
                },
                refreshToken: {
                  type: "string",
                },
              },
            },
          },
        },
        LogoutResponse: {
          type: "object",
          required: ["success", "message", "data"],
          properties: {
            success: {
              type: "boolean",
            },
            message: {
              type: "string",
            },
            data: {
              type: "object",
              nullable: true,
              example: null,
            },
          },
        },
        CreateJobRequest: {
          type: "object",
          required: [
            "title",
            "description",
            "company",
            "location",
            "experience",
            "skills",
            "jobType",
          ],
          properties: {
            title: {
              type: "string",
              minLength: 1,
            },
            description: {
              type: "string",
              minLength: 1,
            },
            company: {
              type: "string",
              minLength: 1,
            },
            location: {
              type: "string",
              minLength: 1,
            },
            experience: {
              type: "integer",
              minimum: 0,
            },
            skills: {
              type: "array",
              minItems: 1,
              uniqueItems: true,
              items: {
                type: "string",
                minLength: 1,
              },
            },
            jobType: {
              type: "string",
              enum: ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"],
            },
          },
        },
        CreateJobResponse: {
          type: "object",
          required: ["success", "message", "data"],
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
            },
            data: {
              type: "object",
              required: [
                "id",
                "company",
                "description",
                "experience",
                "location",
                "skills",
                "title",
                "recruiterId",
                "jobType",
              ],
              properties: {
                id: {
                  type: "integer",
                },
                company: {
                  type: "string",
                },
                description: {
                  type: "string",
                },
                experience: {
                  type: "integer",
                },
                location: {
                  type: "string",
                },
                skills: {
                  type: "array",
                  items: {
                    type: "object",
                    required: ["id", "name"],
                    properties: {
                      id: {
                        type: "integer",
                      },
                      name: {
                        type: "string",
                      },
                    },
                  },
                },
                title: {
                  type: "string",
                },
                recruiterId: {
                  type: "integer",
                },
                jobType: {
                  type: "string",
                  enum: ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"],
                },
              },
            },
          },
        },
        UpdateJobRequest: {
          type: "object",
          minProperties: 1,
          properties: {
            title: {
              type: "string",
              minLength: 1,
            },
            description: {
              type: "string",
              minLength: 1,
            },
            company: {
              type: "string",
              minLength: 1,
            },
            location: {
              type: "string",
              minLength: 1,
            },
            experience: {
              type: "integer",
              minimum: 0,
            },
            skills: {
              type: "array",
              minItems: 1,
              uniqueItems: true,
              items: {
                type: "string",
                minLength: 1,
              },
            },
            jobType: {
              type: "string",
              enum: ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"],
            },
          },
        },
        JobWithSkills: {
          allOf: [
            {
              $ref: "#/components/schemas/Job",
            },
            {
              type: "object",
              required: ["skills"],
              properties: {
                skills: {
                  type: "array",
                  items: {
                    type: "object",
                    required: ["id", "name"],
                    properties: {
                      id: {
                        type: "integer",
                      },
                      name: {
                        type: "string",
                      },
                    },
                  },
                },
              },
            },
          ],
        },
        UpdateJobResponse: {
          type: "object",
          required: ["success", "message", "data"],
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Job updated successfully",
            },
            data: {
              $ref: "#/components/schemas/JobWithSkills",
            },
          },
        },
        Job: {
          type: "object",
          required: [
            "id",
            "title",
            "description",
            "company",
            "location",
            "experience",
            "jobType",
            "status",
            "recruiterId",
          ],
          properties: {
            id: {
              type: "integer",
            },
            title: {
              type: "string",
            },
            description: {
              type: "string",
            },
            company: {
              type: "string",
            },
            location: {
              type: "string",
            },
            experience: {
              type: "integer",
            },
            jobType: {
              type: "string",
              enum: ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"],
            },
            status: {
              type: "string",
              enum: ["ACTIVE", "CLOSED"],
            },
            recruiterId: {
              type: "integer",
            },
          },
        },
        JobResponse: {
          type: "object",
          required: ["success", "message", "data"],
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
            },
            data: {
              $ref: "#/components/schemas/Job",
            },
          },
        },
        JobListResponse: {
          type: "object",
          required: ["success", "message", "data"],
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
            },
            data: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Job",
              },
            },
          },
        },
        PaginatedJobListResponse: {
          type: "object",
          required: ["success", "message", "data", "meta"],
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
            },
            data: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Job",
              },
            },
            meta: {
              type: "object",
              required: ["pagination"],
              properties: {
                pagination: {
                  type: "object",
                  required: [
                    "currentPage",
                    "limit",
                    "totalRecords",
                    "totalPages",
                  ],
                  properties: {
                    currentPage: {
                      type: "integer",
                    },
                    limit: {
                      type: "integer",
                    },
                    totalRecords: {
                      type: "integer",
                    },
                    totalPages: {
                      type: "integer",
                    },
                  },
                },
              },
            },
          },
        },
        Application: {
          type: "object",
          required: ["id", "candidateId", "jobId", "status", "appliedAt"],
          properties: {
            id: {
              type: "integer",
            },
            candidateId: {
              type: "integer",
            },
            jobId: {
              type: "integer",
            },
            status: {
              type: "string",
              enum: ["APPLIED", "SHORTLISTED", "REJECTED", "HIRED"],
            },
            appliedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        UpdateApplicationStatusRequest: {
          type: "object",
          required: ["status"],
          properties: {
            status: {
              type: "string",
              enum: ["SHORTLISTED", "REJECTED", "HIRED"],
            },
          },
        },
        ApplyToJobResponse: {
          type: "object",
          required: ["success", "message", "data"],
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
            },
            data: {
              $ref: "#/components/schemas/Application",
            },
          },
        },
        UpdateApplicationStatusResponse: {
          type: "object",
          required: ["success", "message", "data"],
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
            },
            data: {
              $ref: "#/components/schemas/Application",
            },
          },
        },
        ResumeMetadataRequest: {
          type: "object",
          required: ["resumeKey", "fileName", "contentType", "fileSize"],
          properties: {
            resumeKey: {
              type: "string",
              minLength: 1,
            },
            fileName: {
              type: "string",
              minLength: 1,
              example: "resume.pdf",
            },
            contentType: {
              type: "string",
              enum: ["application/pdf"],
            },
            fileSize: {
              type: "integer",
              minimum: 1,
              maximum: 5 * 1024 * 1024,
            },
          },
        },
        Resume: {
          type: "object",
          required: [
            "id",
            "candidateId",
            "applicationId",
            "resumeKey",
            "fileName",
            "contentType",
            "fileSize",
            "createdAt",
            "updatedAt",
          ],
          properties: {
            id: {
              type: "integer",
            },
            candidateId: {
              type: "integer",
            },
            applicationId: {
              type: "integer",
            },
            resumeKey: {
              type: "string",
            },
            fileName: {
              type: "string",
            },
            contentType: {
              type: "string",
              enum: ["application/pdf"],
            },
            fileSize: {
              type: "integer",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        SaveResumeMetadataResponse: {
          type: "object",
          required: ["success", "message", "data"],
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
            },
            data: {
              $ref: "#/components/schemas/Resume",
            },
          },
        },
        ResumeUploadUrlRequest: {
          type: "object",
          required: ["fileName", "contentType"],
          properties: {
            fileName: {
              type: "string",
              minLength: 1,
              example: "resume.pdf",
            },
            contentType: {
              type: "string",
              enum: ["application/pdf"],
              example: "application/pdf",
            },
          },
        },
        ResumeUploadUrlResponse: {
          type: "object",
          required: ["success", "message", "data"],
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
            },
            data: {
              type: "object",
              required: ["uploadUrl", "key"],
              properties: {
                uploadUrl: {
                  type: "string",
                  format: "uri",
                },
                key: {
                  type: "string",
                  example: "resumes/6/550e8400-e29b-41d4-a716-446655440000.pdf",
                },
              },
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
            },
            details: {
              nullable: true,
            },
          },
        },
      },
    },
  },
  apis: ["./src/docs/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);
