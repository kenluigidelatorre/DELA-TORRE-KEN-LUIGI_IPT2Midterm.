import { useEffect, useState } from "react";

const initialForm = {
  residentName: "",
  address: "",
  documentType: "Barangay Clearance",
  purpose: "",
  requestDate: "",
  status: "Pending",
  attachment: null,
};

function ClearanceForm({ editingRequest, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (editingRequest) {
      setForm({
        residentName: editingRequest.residentName || "",
        address: editingRequest.address || "",
        documentType: editingRequest.documentType || "Barangay Clearance",
        purpose: editingRequest.purpose || "",
        requestDate: editingRequest.requestDate || "",
        status: editingRequest.status || "Pending",
        attachment: null,
      });
    } else {
      setForm(initialForm);
    }
  }, [editingRequest]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  }

  function handleFileChange(event) {
    const file = event.target.files[0] || null;

    setForm((previousForm) => ({
      ...previousForm,
      attachment: file,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    await onSave(form);
  }

  return (
    <section className="form-content">
      <div className="section-heading modal-heading">
        <div>
          <p className="eyebrow">
            {editingRequest ? "UPDATE RECORD" : "NEW RECORD"}
          </p>

          <h2>
            {editingRequest ? "Edit Document Request" : "New Document Request"}
          </h2>

          <p>
            {editingRequest
              ? "Update the resident's document request information."
              : "Enter the resident's information below."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="request-form">
        {/* Resident Name */}
        <label>
          Resident Name
          <input
            type="text"
            name="residentName"
            value={form.residentName}
            onChange={handleChange}
            placeholder="Enter full name"
            maxLength={100}
            required
          />
        </label>

        {/* Address */}
        <label>
          Address
          <input
            type="text"
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Enter complete address"
            maxLength={255}
            required
          />
        </label>

        {/* Document Type */}
        <label>
          Document Type
          <select
            name="documentType"
            value={form.documentType}
            onChange={handleChange}
            required
          >
            <option value="Barangay Clearance">Barangay Clearance</option>

            <option value="Certificate of Residency">
              Certificate of Residency
            </option>

            <option value="Certificate of Indigency">
              Certificate of Indigency
            </option>

            <option value="Business Clearance">Business Clearance</option>
          </select>
        </label>

        {/* Purpose */}
        <label>
          Purpose
          <input
            type="text"
            name="purpose"
            value={form.purpose}
            onChange={handleChange}
            placeholder="e.g. Local Employment, Bank Requirement"
            maxLength={255}
            required
          />
        </label>

        {/* Request Date */}
        <label>
          Request Date
          <input
            type="date"
            name="requestDate"
            value={form.requestDate}
            onChange={handleChange}
            required
          />
        </label>

        {/* Status */}
        <label>
          Status
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            required
          >
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Approved">Approved</option>
            <option value="Released">Released</option>
            <option value="Rejected">Rejected</option>
          </select>
        </label>

        {/* Optional file upload */}
        <label>
          Valid ID / Proof of Residency
          <input
            type="file"
            name="attachment"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileChange}
          />
          <small>
            Optional. Accepted files: JPG, PNG, or PDF. Maximum size: 5 MB.
          </small>
          {editingRequest?.attachment && (
            <small>Existing attachment: {editingRequest.attachment}</small>
          )}
        </label>

        {/* Form buttons */}
        <div className="form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>

          <button type="submit" disabled={saving}>
            {saving
              ? "Saving..."
              : editingRequest
                ? "Update Request"
                : "Add Request"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default ClearanceForm;
