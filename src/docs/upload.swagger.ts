/**
 * @openapi
 * /uploads/resume-url:
 *   post:
 *     summary: Generate a pre-signed S3 resume upload URL
 *     description: Generates a temporary pre-signed URL that allows a candidate to upload a PDF resume directly to Amazon S3. The URL expires after 5 minutes.
 *     tags:
 *       - Uploads
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/ResumeUploadUrlRequest"
 *     responses:
 *       "200":
 *         description: Upload URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ResumeUploadUrlResponse"
 *
 *       "400":
 *         description: Invalid resume file details
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
 *         description: Only candidates can request a resume upload URL
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
