import StatusBadge from "./StatusBadge";

function ClearanceTable({
  requests,
  loading,
  deletingId,
  onEdit,
  onView,
  onDelete,
}) {
  if (loading) {
    return (
      <div className="table-state">
        <div className="spinner"></div>
        <p>Loading requests...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="table-state empty-state">
        <div className="empty-icon">📋</div>

        <h3>No requests found</h3>

        <p>
          Try changing your search or status filter, or add a new document
          request.
        </p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Resident</th>
            <th>Document Type</th>
            <th>Purpose</th>
            <th>Request Date</th>
            <th>Status</th>
            <th>Attachment</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {requests.map((request) => (
            <tr key={request.id}>
              <td>
                <strong>#{request.id}</strong>
              </td>

              <td>
                <div className="resident-cell">
                  <strong>{request.residentName}</strong>

                  <span>{request.address}</span>
                </div>
              </td>

              <td>
                <span className="document-type">{request.documentType}</span>
              </td>

              <td>
                <div className="purpose-cell">{request.purpose}</div>
              </td>

              <td>{request.requestDate}</td>

              <td>
                <StatusBadge status={request.status} />
              </td>

              <td>
                {request.attachment ? (
                  <span className="attachment-available">📎 Attached</span>
                ) : (
                  <span className="no-file">No file</span>
                )}
              </td>

              <td>
                <div className="table-actions">
                  <button
                    className="view-button"
                    onClick={() => onView(request)}
                    title="View details"
                  >
                    View
                  </button>

                  <button
                    className="edit-button"
                    onClick={() => onEdit(request)}
                  >
                    Edit
                  </button>

                  <button
                    className="delete-button"
                    onClick={() => onDelete(request.id)}
                    disabled={deletingId === request.id}
                  >
                    {deletingId === request.id ? "..." : "Delete"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ClearanceTable;
