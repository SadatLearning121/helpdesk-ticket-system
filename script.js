// Simple Helpdesk Ticket System
// Data model:
// ticket = {
//   id, title, description, requester, email,
//   category, priority, status, assignee,
//   createdAt
// }

let tickets = [];

// DOM elements
const ticketForm = document.getElementById("ticketForm");
const ticketList = document.getElementById("ticketList");
const ticketStats = document.getElementById("ticketStats");
const formMessage = document.getElementById("formMessage");

const searchInput = document.getElementById("searchInput");
const filterStatus = document.getElementById("filterStatus");
const filterPriority = document.getElementById("filterPriority");

// Load from localStorage on first load
document.addEventListener("DOMContentLoaded", () => {
  const stored = localStorage.getItem("helpdeskTickets");
  if (stored) {
    try {
      tickets = JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse tickets from localStorage", e);
    }
  }
  renderTickets();
});

// Handle form submission
ticketForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const formData = new FormData(ticketForm);
  const title = formData.get("title").trim();
  const requester = formData.get("requester").trim();
  const email = formData.get("email").trim();
  const category = formData.get("category");
  const priority = formData.get("priority");
  const description = formData.get("description").trim();
  const assignee = formData.get("assignee").trim();
  const status = formData.get("status") || "Open";

  if (!title || !requester || !category || !priority || !description) {
    showFormMessage("Please fill in all required fields.", "error");
    return;
  }

  const ticket = {
    id: Date.now().toString(),
    title,
    requester,
    email,
    category,
    priority,
    description,
    assignee,
    status,
    createdAt: new Date().toISOString()
  };

  tickets.unshift(ticket);
  persistTickets();
  renderTickets();
  ticketForm.reset();
  ticketForm.status.value = "Open";
  showFormMessage("Ticket created successfully.", "success");
});

function showFormMessage(text, type) {
  formMessage.textContent = text;
  formMessage.style.color = type === "success" ? "#22c55e" : "#f97316";

  setTimeout(() => {
    formMessage.textContent = "";
  }, 2500);
}

function persistTickets() {
  localStorage.setItem("helpdeskTickets", JSON.stringify(tickets));
}

function renderTickets() {
  // Apply filters
  const searchTerm = searchInput.value.toLowerCase().trim();
  const statusFilter = filterStatus.value;
  const priorityFilter = filterPriority.value;

  let filtered = tickets.filter((t) => {
    const matchesSearch =
      !searchTerm ||
      t.title.toLowerCase().includes(searchTerm) ||
      t.requester.toLowerCase().includes(searchTerm);

    const matchesStatus =
      statusFilter === "all" ? true : t.status === statusFilter;

    const matchesPriority =
      priorityFilter === "all" ? true : t.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Render stats
  renderStats();

  // Render ticket cards
  ticketList.innerHTML = "";

  if (filtered.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "No tickets match the current filters.";
    empty.style.fontSize = "0.85rem";
    empty.style.color = "#9ca3af";
    ticketList.appendChild(empty);
    return;
  }

  filtered.forEach((ticket) => {
    const card = document.createElement("article");
    card.className = "ticket-card";

    // Main content
    const main = document.createElement("div");
    main.className = "ticket-main";

    const titleEl = document.createElement("h3");
    titleEl.textContent = ticket.title;
    main.appendChild(titleEl);

    const meta = document.createElement("div");
    meta.className = "ticket-meta";

    const catBadge = document.createElement("span");
    catBadge.className = "badge badge-category";
    catBadge.textContent = ticket.category;
    meta.appendChild(catBadge);

    const prioBadge = document.createElement("span");
    prioBadge.className = `badge badge-priority-${ticket.priority}`;
    prioBadge.textContent = `Priority: ${ticket.priority}`;
    meta.appendChild(prioBadge);

    const statusBadge = document.createElement("span");
    statusBadge.className = `badge badge-status-${ticket.status.replace(
      " ",
      "\\ "
    )}`;
    statusBadge.textContent = ticket.status;
    meta.appendChild(statusBadge);

    main.appendChild(meta);

    const desc = document.createElement("p");
    desc.className = "ticket-description";
    desc.textContent = ticket.description;
    main.appendChild(desc);

    // Side content
    const side = document.createElement("div");
    side.className = "ticket-side";

    const infoBlock = document.createElement("div");

    const requesterEl = document.createElement("div");
    requesterEl.className = "ticket-requester";
    requesterEl.textContent = `From: ${ticket.requester}`;
    infoBlock.appendChild(requesterEl);

    if (ticket.email) {
      const emailEl = document.createElement("div");
      emailEl.className = "ticket-email";
      emailEl.style.fontSize = "0.75rem";
      emailEl.style.color = "#9ca3af";
      emailEl.textContent = ticket.email;
      infoBlock.appendChild(emailEl);
    }

    const assigneeText = ticket.assignee || "Unassigned";
    const assigneeEl = document.createElement("div");
    assigneeEl.className = "ticket-assignee";
    assigneeEl.textContent = `Assigned to: ${assigneeText}`;
    infoBlock.appendChild(assigneeEl);

    const createdAtEl = document.createElement("div");
    createdAtEl.className = "ticket-date";
    const date = new Date(ticket.createdAt);
    createdAtEl.textContent = `Created: ${date.toLocaleString()}`;
    infoBlock.appendChild(createdAtEl);

    side.appendChild(infoBlock);

    // Actions
    const actions = document.createElement("div");
    actions.className = "ticket-actions";

    const statusSelect = document.createElement("select");
    ["Open", "In Progress", "Resolved"].forEach((status) => {
      const opt = document.createElement("option");
      opt.value = status;
      opt.textContent = status;
      if (ticket.status === status) opt.selected = true;
      statusSelect.appendChild(opt);
    });

    statusSelect.addEventListener("change", (e) => {
      updateTicketStatus(ticket.id, e.target.value);
    });

    actions.appendChild(statusSelect);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "btn";
    deleteBtn.style.fontSize = "0.7rem";
    deleteBtn.style.padding = "0.3rem 0.7rem";
    deleteBtn.style.background = "rgba(248, 113, 22, 0.1)";
    deleteBtn.style.border = "1px solid rgba(248, 113, 22, 0.6)";
    deleteBtn.style.color = "#fed7aa";

    deleteBtn.addEventListener("click", () => {
      const confirmDelete = confirm("Delete this ticket?");
      if (confirmDelete) {
        deleteTicket(ticket.id);
      }
    });

    actions.appendChild(deleteBtn);
    side.appendChild(actions);

    card.appendChild(main);
    card.appendChild(side);

    ticketList.appendChild(card);
  });
}

// Update status
function updateTicketStatus(id, newStatus) {
  const t = tickets.find((ticket) => ticket.id === id);
  if (!t) return;
  t.status = newStatus;
  persistTickets();
  renderTickets();
}

// Delete ticket
function deleteTicket(id) {
  tickets = tickets.filter((ticket) => ticket.id !== id);
  persistTickets();
  renderTickets();
}

// Stats
function renderStats() {
  const total = tickets.length;
  const open = tickets.filter((t) => t.status === "Open").length;
  const inProgress = tickets.filter((t) => t.status === "In Progress").length;
  const resolved = tickets.filter((t) => t.status === "Resolved").length;

  ticketStats.innerHTML = "";

  const stats = [
    { label: "Total", value: total },
    { label: "Open", value: open },
    { label: "In Progress", value: inProgress },
    { label: "Resolved", value: resolved }
  ];

  stats.forEach((s) => {
    const pill = document.createElement("div");
    pill.className = "stat-pill";
    const label = document.createElement("span");
    label.textContent = s.label;
    const value = document.createElement("span");
    value.className = "value";
    value.textContent = s.value;
    pill.appendChild(label);
    pill.appendChild(value);
    ticketStats.appendChild(pill);
  });
}

// Re-render on filters/search change
searchInput.addEventListener("input", renderTickets);
filterStatus.addEventListener("change", renderTickets);
filterPriority.addEventListener("change", renderTickets);
