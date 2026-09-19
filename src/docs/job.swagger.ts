/**
 * @openapi
 * /jobs:
 *   post:
 *     summary: Create a new job
 *     tags:
 *       - Jobs
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/CreateJobRequest"
 *     responses:
 *       "201":
 *         description: Job created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/CreateJobResponse"
 *
 *       "400":
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *
 *       "401":
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *
 *       "403":
 *         description: Only recruiters can create jobs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *
 *       "500":
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */

/**
 * @openapi
 * /jobs:
 *   get:
 *     summary: Get active jobs
 *     tags:
 *       - Jobs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of jobs per page
 *
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *           minLength: 1
 *         description: Filter jobs by location
 *
 *       - in: query
 *         name: experience
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Filter jobs by required experience
 *
 *       - in: query
 *         name: skills
 *         schema:
 *           type: string
 *         description: Comma-separated skills such as Node.js,AWS
 *
 *       - in: query
 *         name: jobType
 *         schema:
 *           type: string
 *           enum:
 *             - FULL_TIME
 *             - PART_TIME
 *             - CONTRACT
 *             - INTERNSHIP
 *         description: Filter jobs by job type
 *
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           minLength: 1
 *         description: Search jobs by title, company, or skill
 *
 *     responses:
 *       "200":
 *         description: Jobs fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/PaginatedJobListResponse"
 *
 *       "400":
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *
 *       "401":
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *
 *       "403":
 *         description: User is not authorized to access this resource
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *
 *       "500":
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */

/**
 * @openapi
 * /jobs/my-jobs:
 *   get:
 *     summary: Get jobs created by the authenticated recruiter
 *     tags:
 *       - Jobs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Jobs fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/JobListResponse"
 *
 *       "401":
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *
 *       "403":
 *         description: Only recruiters can access their jobs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *
 *       "500":
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */

/**
 * @openapi
 * /jobs/{jobId}:
 *   patch:
 *     summary: Update a job
 *     tags:
 *       - Jobs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID of the job to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/UpdateJobRequest"
 *     responses:
 *       "200":
 *         description: Job updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/UpdateJobResponse"
 *
 *       "400":
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *
 *       "401":
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *
 *       "403":
 *         description: Recruiter does not own this job
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *
 *       "404":
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *
 *       "500":
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */

/**
 * @openapi
 * /jobs/{jobId}/close:
 *   patch:
 *     summary: Close a job
 *     tags:
 *       - Jobs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID of the job to close
 *     responses:
 *       "200":
 *         description: Job closed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/JobResponse"
 *
 *       "401":
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *
 *       "403":
 *         description: Recruiter does not own this job
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *
 *       "404":
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *
 *       "500":
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
