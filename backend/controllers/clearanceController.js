const pool = require("../config/db");

// Allowed document types for the request form.
const allowedDocumentTypes = [
  "Barangay Clearance",
  "Certificate of Residency",
  "Certificate of Indigency",
  "Business Clearance",
];

// Allowed statuses for clearance requests.
const allowedStatuses = [
  "Pending",
  "Processing",
  "Approved",
  "Released",
  "Rejected",
];

// Validate the request data before saving it to PostgreSQL.
function validateRequest({
  residentName,
  address,
  documentType,
  purpose,
  requestDate,
  status,
}) {
  if (
    !residentName ||
    !address ||
    !documentType ||
    !purpose ||
    !requestDate ||
    !status
  ) {
    return "All required fields must be completed.";
  }

  if (!allowedDocumentTypes.includes(documentType)) {
    return "Invalid document type.";
  }

  if (!allowedStatuses.includes(status)) {
    return "Invalid status.";
  }

  // Check that the date follows YYYY-MM-DD.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(requestDate)) {
    return "Request date must use YYYY-MM-DD format.";
  }

  // Check that the date is actually valid.
  const date = new Date(`${requestDate}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "Invalid request date.";
  }

  return null;
}

// Handle unexpected server/database errors.
function handleError(res, error) {
  console.error(error);

  return res.status(500).json({
    message: "An unexpected server error occurred.",
  });
}

// GET all clearance/document requests.
async function getAllRequests(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        id,
        resident_name AS "residentName",
        address,
        document_type AS "documentType",
        purpose,
        TO_CHAR(request_date, 'YYYY-MM-DD') AS "requestDate",
        status,
        attachment
      FROM clearance_requests
      ORDER BY id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    handleError(res, error);
  }
}

// GET one request by ID.
async function getRequestById(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: "Invalid request ID.",
    });
  }

  try {
    const result = await pool.query(
      `
      SELECT
        id,
        resident_name AS "residentName",
        address,
        document_type AS "documentType",
        purpose,
        TO_CHAR(request_date, 'YYYY-MM-DD') AS "requestDate",
        status,
        attachment
      FROM clearance_requests
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Clearance request not found.",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    handleError(res, error);
  }
}

// POST a new clearance/document request.
async function createRequest(req, res) {
  const {
    residentName,
    address,
    documentType,
    purpose,
    requestDate,
    status,
  } = req.body;

  const validationError = validateRequest({
    residentName,
    address,
    documentType,
    purpose,
    requestDate,
    status,
  });

  if (validationError) {
    return res.status(400).json({
      message: validationError,
    });
  }

  // If a file was uploaded, save its generated filename.
  const attachment = req.file ? req.file.filename : null;

  try {
    const result = await pool.query(
      `
      INSERT INTO clearance_requests
      (
        resident_name,
        address,
        document_type,
        purpose,
        request_date,
        status,
        attachment
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id,
        resident_name AS "residentName",
        address,
        document_type AS "documentType",
        purpose,
        TO_CHAR(request_date, 'YYYY-MM-DD') AS "requestDate",
        status,
        attachment
      `,
      [
        residentName.trim(),
        address.trim(),
        documentType,
        purpose.trim(),
        requestDate,
        status,
        attachment,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    handleError(res, error);
  }
}

// PUT/update an existing request.
async function updateRequest(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: "Invalid request ID.",
    });
  }

  const {
    residentName,
    address,
    documentType,
    purpose,
    requestDate,
    status,
  } = req.body;

  const validationError = validateRequest({
    residentName,
    address,
    documentType,
    purpose,
    requestDate,
    status,
  });

  if (validationError) {
    return res.status(400).json({
      message: validationError,
    });
  }

  try {
    // Get the existing attachment first.
    const existing = await pool.query(
      `
      SELECT attachment
      FROM clearance_requests
      WHERE id = $1
      `,
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        message: "Clearance request not found.",
      });
    }

    // Keep the old file if no new file was uploaded.
    const attachment = req.file
      ? req.file.filename
      : existing.rows[0].attachment;

    const result = await pool.query(
      `
      UPDATE clearance_requests
      SET
        resident_name = $1,
        address = $2,
        document_type = $3,
        purpose = $4,
        request_date = $5,
        status = $6,
        attachment = $7
      WHERE id = $8
      RETURNING
        id,
        resident_name AS "residentName",
        address,
        document_type AS "documentType",
        purpose,
        TO_CHAR(request_date, 'YYYY-MM-DD') AS "requestDate",
        status,
        attachment
      `,
      [
        residentName.trim(),
        address.trim(),
        documentType,
        purpose.trim(),
        requestDate,
        status,
        attachment,
        id,
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    handleError(res, error);
  }
}

// DELETE a request.
async function deleteRequest(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: "Invalid request ID.",
    });
  }

  try {
    const result = await pool.query(
      `
      DELETE FROM clearance_requests
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Clearance request not found.",
      });
    }

    res.json({
      message: "Clearance request deleted successfully.",
    });
  } catch (error) {
    handleError(res, error);
  }
}

module.exports = {
  getAllRequests,
  getRequestById,
  createRequest,
  updateRequest,
  deleteRequest,
};