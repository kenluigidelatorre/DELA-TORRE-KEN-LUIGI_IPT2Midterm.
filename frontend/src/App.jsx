import { useCallback, useEffect, useMemo, useState } from "react";

import ClearanceForm from "./components/ClearanceForm";
import ClearanceTable from "./components/ClearanceTable";
import StatusBadge from "./components/StatusBadge";

import barangayLogo from "./assets/LOGO.png";

const API_URL = "http://localhost:5000/api/clearance-requests";

const UPLOAD_URL = "http://localhost:5000/uploads";

/* =========================================
   NOTIFICATION DATE FORMAT
========================================= */

function formatNotificationDate(date) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

/* =========================================
   MAIN APP
========================================= */

function App() {
  /* =========================================
     REQUEST STATES
  ========================================= */

  const [requests, setRequests] = useState([]);

  const [editingRequest, setEditingRequest] = useState(null);

  const [selectedRequest, setSelectedRequest] = useState(null);

  const [showForm, setShowForm] = useState(false);

  /* =========================================
     SEARCH AND FILTER
  ========================================= */

  const [searchTerm, setSearchTerm] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");

  /* =========================================
     LOADING / ERROR STATES
  ========================================= */

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");

  /* =========================================
     NOTIFICATION STATES

     Notifications are loaded from localStorage
     so they remain after refreshing the page.
  ========================================= */

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem("barangayNotifications");

      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showNotifications, setShowNotifications] = useState(false);

  /* =========================================
     SAVE NOTIFICATIONS TO LOCAL STORAGE
  ========================================= */

  useEffect(() => {
    localStorage.setItem(
      "barangayNotifications",
      JSON.stringify(notifications),
    );
  }, [notifications]);

  /* =========================================
     ADD NOTIFICATION
  ========================================= */

  function addNotification(message, type = "success") {
    const notification = {
      id: Date.now() + Math.random(),

      message,

      type,

      date: new Date().toISOString(),

      selected: false,
    };

    setNotifications((previous) => [notification, ...previous]);
  }

  /* =========================================
     SELECT / UNSELECT NOTIFICATION
  ========================================= */

  function toggleNotification(id) {
    setNotifications((previous) =>
      previous.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              selected: !notification.selected,
            }
          : notification,
      ),
    );
  }

  /* =========================================
     SELECT ALL NOTIFICATIONS
  ========================================= */

  function toggleSelectAll() {
    const allSelected =
      notifications.length > 0 &&
      notifications.every((notification) => notification.selected);

    setNotifications((previous) =>
      previous.map((notification) => ({
        ...notification,

        selected: !allSelected,
      })),
    );
  }

  /* =========================================
     CLEAR SELECTED NOTIFICATIONS
  ========================================= */

  function clearSelectedNotifications() {
    setNotifications((previous) =>
      previous.filter((notification) => !notification.selected),
    );
  }

  /* =========================================
     CLEAR ALL NOTIFICATIONS
  ========================================= */

  function clearAllNotifications() {
    setNotifications([]);
  }

  /* =========================================
     FETCH REQUESTS
  ========================================= */

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

  /* =========================================
     LOAD REQUESTS WHEN PAGE STARTS
  ========================================= */

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  /* =========================================
     NEW REQUEST
  ========================================= */

  function handleNewRequest() {
    setEditingRequest(null);
    setShowForm(true);
  }

  /* =========================================
     SAVE REQUEST
     Handles both POST and PUT.
  ========================================= */

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

      /* Add attachment only when a new file
         was selected. */
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

      /* =====================================
         UPDATE EXISTING REQUEST
      ===================================== */

      if (editingRequest) {
        setRequests((previous) =>
          previous.map((request) =>
            request.id === result.id ? result : request,
          ),
        );

        addNotification(
          `Request #${result.id} was successfully updated.`,
          "success",
        );
      } else {

      /* =====================================
         ADD NEW REQUEST
      ===================================== */
        setRequests((previous) => [result, ...previous]);

        addNotification(
          `New ${result.documentType} request was added for ${result.residentName}.`,
          "success",
        );
      }

      setShowForm(false);
      setEditingRequest(null);
    } catch (err) {
      setError(err.message);

      addNotification(err.message || "Unable to save request.", "error");
    } finally {
      setSaving(false);
    }
  }

  /* =========================================
     EDIT REQUEST
  ========================================= */

  function handleEdit(request) {
    setEditingRequest(request);
    setShowForm(true);
  }

  /* =========================================
     VIEW REQUEST DETAILS
  ========================================= */

  function handleView(request) {
    setSelectedRequest(request);
  }

  /* =========================================
     CLOSE FORM
  ========================================= */

  function handleCloseForm() {
    if (!saving) {
      setShowForm(false);
      setEditingRequest(null);
    }
  }

  /* =========================================
     CLOSE DETAILS
  ========================================= */

  function handleCloseDetails() {
    setSelectedRequest(null);
  }

  /* =========================================
     DELETE REQUEST
  ========================================= */

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

      addNotification(`Request #${id} was deleted.`, "success");
    } catch (err) {
      setError(err.message);

      addNotification(err.message || "Unable to delete request.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  /* =========================================
     SEARCH + STATUS FILTER
  ========================================= */

  const filteredRequests = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return requests.filter((request) => {
      const residentName = request.residentName || "";

      const documentType = request.documentType || "";

      const purpose = request.purpose || "";

      const address = request.address || "";

      const matchesSearch =
        search === "" ||
        residentName.toLowerCase().includes(search) ||
        documentType.toLowerCase().includes(search) ||
        purpose.toLowerCase().includes(search) ||
        address.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "All" || request.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, searchTerm, statusFilter]);

  /* =========================================
     DASHBOARD STATISTICS
  ========================================= */

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

  /* =========================================
     RENDER
  ========================================= */

  return (
    <div className="app">
      {/* =====================================
          HEADER
      ===================================== */}

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
          {/* =================================
              NOTIFICATION BUTTON
          ================================= */}

          <div className="notification-wrapper">
            <button
              type="button"
              className="notification-button"
              onClick={() => setShowNotifications((previous) => !previous)}
              aria-label="Notifications"
            >
              🔔
              {notifications.length > 0 && (
                <span className="notification-count">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* =================================
                NOTIFICATION PANEL
            ================================= */}

            {showNotifications && (
              <div className="notification-panel">
                {/* PANEL HEADER */}

                <div className="notification-header">
                  <div>
                    <strong>Notifications</strong>

                    <span>
                      {notifications.length} notification
                      {notifications.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {notifications.length > 0 && (
                    <button
                      type="button"
                      className="clear-all-button"
                      onClick={clearAllNotifications}
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* SELECT CONTROLS */}

                {notifications.length > 0 && (
                  <div className="notification-controls">
                    <label className="select-all">
                      <input
                        type="checkbox"
                        checked={
                          notifications.length > 0 &&
                          notifications.every(
                            (notification) => notification.selected,
                          )
                        }
                        onChange={toggleSelectAll}
                      />

                      <span>Select All</span>
                    </label>

                    <button
                      type="button"
                      className="clear-selected-button"
                      onClick={clearSelectedNotifications}
                      disabled={
                        !notifications.some(
                          (notification) => notification.selected,
                        )
                      }
                    >
                      Clear Selected
                    </button>
                  </div>
                )}

                {/* NOTIFICATION LIST */}

                <div className="notification-list">
                  {notifications.length === 0 ? (
                    <div className="notification-empty">
                      <span>🔔</span>

                      <p>No notifications yet.</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`notification-item ${
                          notification.type === "error" ? "error" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(notification.selected)}
                          onChange={() => toggleNotification(notification.id)}
                        />

                        <div className="notification-content">
                          <div className="notification-message">
                            <span className="notification-icon">
                              {notification.type === "error" ? "⚠️" : "✓"}
                            </span>

                            <p>{notification.message}</p>
                          </div>

                          <time>
                            {formatNotificationDate(notification.date)}
                          </time>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* =================================
              NEW REQUEST BUTTON
          ================================= */}

          <button
            type="button"
            className="primary-button"
            onClick={handleNewRequest}
          >
           New Request
          </button>
        </div>
      </header>

      {/* =====================================
          MAIN CONTENT
      ===================================== */}

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

            <button type="button" onClick={() => setError("")}>
              ×
            </button>
          </div>
        )}

        {/* =================================
            DASHBOARD STATISTICS
        ================================= */}

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

        {/* =================================
            REQUEST MANAGEMENT
        ================================= */}

        <section className="request-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">REQUEST MANAGEMENT</p>

              <h2>All Document Requests</h2>

              <p>Search, filter, view, edit, and manage requests.</p>
            </div>
          </div>

          {/* SEARCH + FILTER */}

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
                  type="button"
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
                <option value="All">All Status</option>

                <option value="Pending">Pending</option>

                <option value="Processing">Processing</option>

                <option value="Approved">Approved</option>

                <option value="Released">Released</option>

                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* FILTER RESULT COUNT */}

          {(searchTerm || statusFilter !== "All") && (
            <div className="filter-summary">
              Showing <strong>{filteredRequests.length}</strong> of{" "}
              <strong>{requests.length}</strong> requests
            </div>
          )}

          {/* REQUEST TABLE */}

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

      {/* =====================================
          ADD / EDIT MODAL
      ===================================== */}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <button
              type="button"
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

      {/* =====================================
          VIEW DETAILS MODAL
      ===================================== */}

      {selectedRequest && (
        <div className="modal-overlay">
          <div className="details-modal">
            <button
              type="button"
              className="modal-close"
              onClick={handleCloseDetails}
            >
              ×
            </button>

            {/* DETAILS HEADER */}

            <div className="details-header">
              <div>
                <p className="eyebrow">REQUEST DETAILS</p>

                <h2>{selectedRequest.documentType}</h2>

                <p>Request ID #{selectedRequest.id}</p>
              </div>

              <StatusBadge status={selectedRequest.status} />
            </div>

            {/* DETAILS GRID */}

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

            {/* =================================
                ATTACHMENT PREVIEW
            ================================= */}

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

            {/* DETAILS ACTIONS */}

            <div className="details-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={handleCloseDetails}
              >
                Close
              </button>

              <button
                type="button"
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

      {/* =====================================
          FOOTER
      ===================================== */}

      <footer>
        <p>Barangay Document Request Management System</p>
      </footer>
    </div>
  );
}

/* =========================================
   ATTACHMENT PREVIEW COMPONENT
========================================= */

function AttachmentPreview({ attachment, uploadUrl }) {
  const fileUrl = `${uploadUrl}/${attachment}`;

  const extension = attachment.split(".").pop().toLowerCase();

  const isImage =
    extension === "jpg" || extension === "jpeg" || extension === "png";

  const isPdf = extension === "pdf";

  /* IMAGE PREVIEW */

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

  /* PDF PREVIEW */

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

  /* OTHER FILE */

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
