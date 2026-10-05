import { useCallback, useEffect, useMemo, useState } from "react";
import ClearanceForm from "./components/ClearanceForm";
import ClearanceTable from "./components/ClearanceTable";
import StatusBadge from "./components/StatusBadge";
import barangayLogo from "./assets/LOGO.png";

const API_URL = "http://localhost:5000/api/clearance-requests";
const UPLOAD_URL = "http://localhost:5000/uploads";

function App() {
  const [requests, setRequests] = useState([]);
  const [editingRequest, setEditingRequest] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");

  const addNotification = useCallback((message, type = "success") => {
    const notification = {
      id: Date.now() + Math.random(),
      message,
      type,
    };

    setNotifications((previous) => [notification, ...previous]);

    setTimeout(() => {
      setNotifications((previous) =>
        previous.filter((item) => item.id !== notification.id),
      );
    }, 5000);
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Failed to load requests.");
      }

      const data = await response.json();
      setRequests(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  function handleNewRequest() {
    setEditingRequest(null);
    setShowForm(true);
  }

  async function handleSave(formData) {
    try {
      setSaving(true);
      setError("");

      const data = new FormData();

      data.append("residentName", formData.residentName);
      data.append("address", formData.address);
      data.append("documentType", formData.documentType);
      data.append("purpose", formData.purpose);
      data.append("requestDate", formData.requestDate);
      data.append("status", formData.status);

      if (formData.attachment) {
        data.append("attachment", formData.attachment);
      }

      const url = editingRequest ? `${API_URL}/${editingRequest.id}` : API_URL;

      const method = editingRequest ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        body: data,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to save request.");
      }

      if (editingRequest) {
        setRequests((previous) =>
          previous.map((request) =>
            request.id === result.id ? result : request,
          ),
        );

        addNotification(`Request #${result.id} was successfully updated.`);
      } else {
        setRequests((previous) => [result, ...previous]);

        addNotification(`New ${result.documentType} request was added.`);
      }

      setShowForm(false);
      setEditingRequest(null);
    } catch (err) {
      setError(err.message);
      addNotification(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(request) {
    setEditingRequest(request);
    setShowForm(true);
  }

  function handleView(request) {
    setSelectedRequest(request);
  }

  function handleCloseForm() {
    if (!saving) {
      setShowForm(false);
      setEditingRequest(null);
    }
  }

  function handleCloseDetails() {
    setSelectedRequest(null);
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this request?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to delete request.");
      }

      setRequests((previous) =>
        previous.filter((request) => request.id !== id),
      );

      if (selectedRequest?.id === id) {
        setSelectedRequest(null);
      }

      addNotification(`Request #${id} was deleted.`);
    } catch (err) {
      setError(err.message);
      addNotification(err.message, "error");
    } finally {
      setDeletingId(null);
    }
  }

  const filteredRequests = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return requests.filter((request) => {
      const matchesSearch =
        search === "" ||
        request.residentName.toLowerCase().includes(search) ||
        request.documentType.toLowerCase().includes(search) ||
        request.purpose.toLowerCase().includes(search) ||
        request.address.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "All" || request.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, searchTerm, statusFilter]);

  const statistics = useMemo(() => {
    return {
      total: requests.length,

      pending: requests.filter((request) => request.status === "Pending")
        .length,

      processing: requests.filter((request) => request.status === "Processing")
        .length,

      approved: requests.filter((request) => request.status === "Approved")
        .length,

      released: requests.filter((request) => request.status === "Released")
        .length,

      rejected: requests.filter((request) => request.status === "Rejected")
        .length,
    };
  }, [requests]);

  const unreadNotifications = notifications.length;

  return (
    <div className="app">
      {/* HEADER */}
      <header className="topbar">
        <div className="brand">
          <div className="brand-logo">
            <img src={barangayLogo} alt="Barangay Logo" />
          </div>

          <div>
            <h1>Barangay Document Request</h1>
            <p>Management System</p>
          </div>
        </div>

        <div className="header-actions">
          <div className="notification-wrapper">
            <button
              className="notification-button"
              onClick={() => setShowNotifications((previous) => !previous)}
              aria-label="Notifications"
            >
              🔔
              {unreadNotifications > 0 && (
                <span className="notification-count">
                  {unreadNotifications}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="notification-panel">
                <div className="notification-header">
                  <div>
                    <strong>Notifications</strong>
                    <span>{notifications.length} recent</span>
                  </div>

                  {notifications.length > 0 && (
                    <button
                      className="clear-notifications"
                      onClick={() => setNotifications([])}
                    >
                      Clear
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div className="notification-empty">
                    <span>🔔</span>
                    <p>No new notifications.</p>
                  </div>
                ) : (
                  <div className="notification-list">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`notification-item ${notification.type}`}
                      >
                        <span>
                          {notification.type === "error" ? "⚠️" : "✓"}
                        </span>

                        <p>{notification.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button className="primary-button" onClick={handleNewRequest}>
            + New Request
          </button>
        </div>
      </header>

      <main className="page-container">
        {/* PAGE INTRO */}
        <section className="page-intro">
          <div>
            <p className="eyebrow">BARANGAY SERVICES</p>

            <h2>Document Requests</h2>

            <p>Manage and monitor resident document requests in one place.</p>
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <div className="alert error-alert">
            <span>⚠️</span>
            <p>{error}</p>

            <button onClick={() => setError("")}>×</button>
          </div>
        )}

        {/* DASHBOARD STATISTICS */}
        <section className="statistics-grid">
          <div className="stat-card">
            <div className="stat-icon total-icon">📋</div>

            <div>
              <p>Total Requests</p>
              <h3>{statistics.total}</h3>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon pending-icon">⏳</div>

            <div>
              <p>Pending</p>
              <h3>{statistics.pending}</h3>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon processing-icon">⚙️</div>

            <div>
              <p>Processing</p>
              <h3>{statistics.processing}</h3>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon approved-icon">✓</div>

            <div>
              <p>Approved</p>
              <h3>{statistics.approved}</h3>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon released-icon">📄</div>

            <div>
              <p>Released</p>
              <h3>{statistics.released}</h3>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon rejected-icon">✕</div>

            <div>
              <p>Rejected</p>
              <h3>{statistics.rejected}</h3>
            </div>
          </div>
        </section>

        {/* SEARCH + FILTER */}
        <section className="request-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">REQUEST MANAGEMENT</p>

              <h2>All Document Requests</h2>

              <p>Search, filter, view, edit, and manage requests.</p>
            </div>
          </div>

          <div className="request-toolbar">
            <div className="search-box">
              <span>🔎</span>

              <input
                type="text"
                placeholder="Search resident, document, purpose..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />

              {searchTerm && (
                <button
                  className="clear-search"
                  onClick={() => setSearchTerm("")}
                >
                  ×
                </button>
              )}
            </div>

            <div className="filter-box">
              <label htmlFor="statusFilter">Status</label>

              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Approved">Approved</option>
                <option value="Released">Released</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          {(searchTerm || statusFilter !== "All") && (
            <div className="filter-summary">
              Showing <strong>{filteredRequests.length}</strong> of{" "}
              <strong>{requests.length}</strong> requests
            </div>
          )}

          <ClearanceTable
            requests={filteredRequests}
            loading={loading}
            deletingId={deletingId}
            onEdit={handleEdit}
            onView={handleView}
            onDelete={handleDelete}
          />
        </section>
      </main>

      {/* ADD / EDIT MODAL */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <button
              className="modal-close"
              onClick={handleCloseForm}
              disabled={saving}
            >
              ×
            </button>

            <ClearanceForm
              editingRequest={editingRequest}
              onSave={handleSave}
              onCancel={handleCloseForm}
              saving={saving}
            />
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {selectedRequest && (
        <div className="modal-overlay">
          <div className="details-modal">
            <button className="modal-close" onClick={handleCloseDetails}>
              ×
            </button>

            <div className="details-header">
              <div>
                <p className="eyebrow">REQUEST DETAILS</p>

                <h2>{selectedRequest.documentType}</h2>

                <p>Request ID #{selectedRequest.id}</p>
              </div>

              <StatusBadge status={selectedRequest.status} />
            </div>

            <div className="details-grid">
              <div className="detail-item">
                <span>Resident Name</span>
                <strong>{selectedRequest.residentName}</strong>
              </div>

              <div className="detail-item">
                <span>Document Type</span>
                <strong>{selectedRequest.documentType}</strong>
              </div>

              <div className="detail-item full-width">
                <span>Address</span>
                <strong>{selectedRequest.address}</strong>
              </div>

              <div className="detail-item full-width">
                <span>Purpose</span>
                <strong>{selectedRequest.purpose}</strong>
              </div>

              <div className="detail-item">
                <span>Request Date</span>
                <strong>{selectedRequest.requestDate}</strong>
              </div>

              <div className="detail-item">
                <span>Status</span>
                <StatusBadge status={selectedRequest.status} />
              </div>
            </div>

            {/* ATTACHMENT PREVIEW */}
            <div className="attachment-section">
              <div className="attachment-heading">
                <div>
                  <span className="eyebrow">ATTACHMENT</span>

                  <h3>Valid ID / Proof of Residency</h3>
                </div>
              </div>

              {!selectedRequest.attachment ? (
                <div className="no-attachment">
                  <span>📎</span>
                  <p>No attachment uploaded.</p>
                </div>
              ) : (
                <AttachmentPreview
                  attachment={selectedRequest.attachment}
                  uploadUrl={UPLOAD_URL}
                />
              )}
            </div>

            <div className="details-actions">
              <button className="secondary-button" onClick={handleCloseDetails}>
                Close
              </button>

              <button
                className="primary-button"
                onClick={() => {
                  handleCloseDetails();
                  handleEdit(selectedRequest);
                }}
              >
                Edit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATIONS */}
      <div className="toast-container">
        {notifications.slice(0, 3).map((notification) => (
          <div key={notification.id} className={`toast ${notification.type}`}>
            <span>{notification.type === "error" ? "⚠️" : "✓"}</span>

            <p>{notification.message}</p>

            <button
              onClick={() =>
                setNotifications((previous) =>
                  previous.filter((item) => item.id !== notification.id),
                )
              }
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <footer>
        <p>Barangay Document Request Management System</p>
      </footer>
    </div>
  );
}

/* ATTACHMENT PREVIEW COMPONENT */
function AttachmentPreview({ attachment, uploadUrl }) {
  const fileUrl = `${uploadUrl}/${attachment}`;

  const extension = attachment.split(".").pop().toLowerCase();

  const isImage =
    extension === "jpg" || extension === "jpeg" || extension === "png";

  const isPdf = extension === "pdf";

  if (isImage) {
    return (
      <div className="attachment-preview">
        <img src={fileUrl} alt="Uploaded document" />

        <a
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          className="attachment-link"
        >
          Open Full Image
        </a>
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className="pdf-preview">
        <div className="pdf-icon">📄</div>

        <div>
          <strong>PDF Document</strong>
          <p>{attachment}</p>
        </div>

        <a
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          className="primary-button"
        >
          View PDF
        </a>
      </div>
    );
  }

  return (
    <div className="pdf-preview">
      <div className="pdf-icon">📎</div>

      <div>
        <strong>Uploaded File</strong>
        <p>{attachment}</p>
      </div>

      <a
        href={fileUrl}
        target="_blank"
        rel="noreferrer"
        className="primary-button"
      >
        Open File
      </a>
    </div>
  );
}

export default App;
