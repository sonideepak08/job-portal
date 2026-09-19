/**
 * @openapi
 * /applications/{jobId}:
 *   post:
 *     summary: Apply to an active job
 *     tags:
 *       - Applications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID of the job to apply to
 *     responses:
 *       "201":
 *         description: Job applied successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApplyToJobResponse"
 *
 *       "400":
 *         description: Invalid job ID
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
 *         description: Only candidates can apply to jobs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *
 *       "404":
 *         description: Job or candidate does not exist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *
 *       "409":
 *         description: Job is closed or candidate has already applied
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
 * /applications/{applicationId}/status:
 *   patch:
 *     summary: Update application status
 *     tags:
 *       - Applications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID of the application to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/UpdateApplicationStatusRequest"
 *     responses:
 *       "200":
 *         description: Application status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/UpdateApplicationStatusResponse"
 *
 *       "400":
 *         description: Invalid application ID or application status
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
 *         description: Recruiter is not authorized to update this application
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *
 *       "404":
 *         description: Application does not exist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *
 *       "409":
 *         description: Invalid status transition or application status changed concurrently
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
 * /applications/{applicationId}/resume:
 *   post:
 *     summary: Store and link resume metadata to an application
 *     tags:
 *       - Applications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID of the application
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/ResumeMetadataRequest"
 *     responses:
 *       "201":
 *         description: Resume recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/SaveResumeMetadataResponse"
 *
 *       "400":
 *         description: Invalid application ID, resume metadata, or resume path
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
 *         description: Candidate does not own this application
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *
 *       "404":
 *         description: Application does not exist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *
 *       "409":
 *         description: Resume is already linked to this application
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
