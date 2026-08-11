// ============================================================
// SmartStay - Staff Dashboard
// static/js/staff_dashboard.js
// ============================================================

const HASURA_URL =
    "https://smarthostel.hasura.app/v1/graphql";

// If your existing project uses a Hasura admin secret,
// keep it here exactly as you already had it.

// ============================================================
// GLOBAL DATA
// ============================================================

let allComplaints = [];
let currentComplaint = null;
let currentStaff = null;


// ============================================================
// GRAPHQL HELPER
// ============================================================
async function sendGraphQL(query, variables = {}) {

    try {

        const response = await fetch(HASURA_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "x-hasura-role": "anonymous"
            },

            body: JSON.stringify({
                query,
                variables
            })

        });


        const result = await response.json();

        console.log("GraphQL:", result);


        if (result.errors) {

            console.error(
                "GraphQL Error:",
                result.errors
            );

            throw new Error(
                result.errors
                    .map(error => error.message)
                    .join(", ")
            );

        }


        return result.data;


    } catch (error) {

        console.error(
            "sendGraphQL ERROR:",
            error
        );

        throw error;

    }

}
// ============================================================
// GET SAVED USER
// ============================================================

function getSavedUser() {

    const possibleKeys = [
        "user",
        "currentUser",
        "loggedInUser",
        "staff",
        "staffUser",
        "smartstay_user",
        "smartstayUser"
    ];


    for (const key of possibleKeys) {

        try {

            const localValue =
                localStorage.getItem(key);

            if (localValue) {

                const parsed =
                    JSON.parse(localValue);

                if (parsed) {
                    return parsed;
                }

            }

        } catch (error) {

            console.warn(
                "Invalid localStorage value:",
                key
            );

        }


        try {

            const sessionValue =
                sessionStorage.getItem(key);

            if (sessionValue) {

                const parsed =
                    JSON.parse(sessionValue);

                if (parsed) {
                    return parsed;
                }

            }

        } catch (error) {

            console.warn(
                "Invalid sessionStorage value:",
                key
            );

        }

    }


    return null;

}


// ============================================================
// GET USER ID FROM SAVED DATA
// ============================================================

function getStaffId() {

    const user = getSavedUser();


    if (!user) {
        return null;
    }


    return (
        user.id ||
        user.user_id ||
        user.staff_id ||
        user.userId ||
        null
    );

}


// ============================================================
// GET STAFF NAME
// ============================================================

function getStoredStaffName() {

    const user = getSavedUser();


    if (!user) {
        return "";
    }


    return (
        user.full_name ||
        user.fullName ||
        user.name ||
        user.username ||
        ""
    );

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ============================================================
// STATUS CLASS
// ============================================================

function statusClass(status) {

    const value =
        String(status || "")
            .toLowerCase()
            .replace(/\s+/g, "-");


    return `status-${value}`;

}


// ============================================================
// PRIORITY CLASS
// ============================================================

function priorityClass(priority) {

    const value =
        String(priority || "")
            .toLowerCase();


    return `priority-${value}`;

}


// ============================================================
// LOAD STAFF
// ============================================================

async function loadStaff() {

    const staffId =
        getStaffId();


    console.log(
        "Logged staff ID:",
        staffId
    );


    // --------------------------------------------------------
    // If ID is available, get exact user
    // --------------------------------------------------------

    if (staffId) {

        const query = `

            query GetStaff($id: uuid!) {

                users_by_pk(id: $id) {

                    id
                    full_name
                    email
                    phone
                    role

                }

            }

        `;


        try {

            const data =
                await sendGraphQL(
                    query,
                    {
                        id: staffId
                    }
                );


            if (data.users_by_pk) {

                currentStaff =
                    data.users_by_pk;

                updateStaffUI(
                    currentStaff
                );

                return currentStaff;

            }

        } catch (error) {

            console.warn(
                "Could not load staff by ID:",
                error
            );

        }

    }


    // --------------------------------------------------------
    // Fallback: get staff from stored name
    // --------------------------------------------------------

    const staffName =
        getStoredStaffName();


    if (staffName) {

        try {

            const query = `

                query GetStaffByName($name: String!) {

                    users(
                        where: {
                            full_name: {
                                _eq: $name
                            }
                        }
                        limit: 1
                    ) {

                        id
                        full_name
                        email
                        phone
                        role

                    }

                }

            `;


            const data =
                await sendGraphQL(
                    query,
                    {
                        name: staffName
                    }
                );


            if (
                data.users &&
                data.users.length > 0
            ) {

                currentStaff =
                    data.users[0];

                updateStaffUI(
                    currentStaff
                );

                return currentStaff;

            }

        } catch (error) {

            console.warn(
                "Could not load staff by name:",
                error
            );

        }

    }


    return null;

}


// ============================================================
// UPDATE STAFF UI
// ============================================================

function updateStaffUI(staff) {

    if (!staff) {
        return;
    }


    const name =
        staff.full_name ||
        "Staff";


    // Top name

    const topStaffName =
        document.getElementById(
            "topStaffName"
        );

    if (topStaffName) {
        topStaffName.textContent =
            name;
    }


    // Welcome

    const welcomeName =
        document.getElementById(
            "welcomeName"
        );

    if (welcomeName) {

        welcomeName.textContent =
            `Welcome, ${name} 👋`;

    }


    // Profile

    const profileName =
        document.getElementById(
            "profileName"
        );

    if (profileName) {
        profileName.textContent =
            name;
    }


    const profileEmail =
        document.getElementById(
            "profileEmail"
        );

    if (profileEmail) {

        profileEmail.textContent =
            staff.email || "-";

    }


    const profilePhone =
        document.getElementById(
            "profilePhone"
        );

    if (profilePhone) {

        profilePhone.textContent =
            staff.phone || "-";

    }


    // Form

    const fullName =
        document.getElementById(
            "fullName"
        );

    if (fullName) {

        fullName.value =
            staff.full_name || "";

    }


    const email =
        document.getElementById(
            "email"
        );

    if (email) {

        email.value =
            staff.email || "";

    }


    const phone =
        document.getElementById(
            "phone"
        );

    if (phone) {

        phone.value =
            staff.phone || "";

    }

}


// ============================================================
// LOAD ASSIGNED COMPLAINTS
// ============================================================
//
// IMPORTANT:
// complaint_assignment:
//     id
//     complaint_id
//     staff_id
//     assigned_at
//     status
//
// complaints:
//     id
//     student_id
//     room_id
//     category
//     title
//     description
//     priority
//     status
//     created_at
//
// NO complaint_id inside complaints
// NO updated_at
//
// ============================================================

async function loadAssignedComplaints() {

    console.log(
        "======================================"
    );

    console.log(
        "Loading assigned complaints..."
    );


    const recentTable =
        document.getElementById(
            "recentComplaintTable"
        );

    const complaintTable =
        document.getElementById(
            "complaintTable"
        );


    if (recentTable) {

        recentTable.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="loading"
                >
                    Loading complaints...
                </td>

            </tr>

        `;

    }


    if (complaintTable) {

        complaintTable.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="loading"
                >
                    Loading complaints...
                </td>

            </tr>

        `;

    }


    try {

        // ----------------------------------------------------
        // IMPORTANT:
        // We load complaint_assignment first.
        // Then use its complaint relationship.
        //
        // This avoids the OLD WRONG query:
        //
        // complaints(where: { complaint_id: ... })
        //
        // ----------------------------------------------------

        const query = `

            query GetAssignments {

                complaint_assignment(
                    order_by: {
                        assigned_at: desc
                    }
                ) {

                    id
                    complaint_id
                    staff_id
                    assigned_at
                    status

                    complaint {

                        id
                        student_id
                        room_id
                        category
                        title
                        description
                        priority
                        status
                        created_at

                    }

                    user {

                        id
                        full_name
                        email
                        role

                    }

                }

            }

        `;


        const data =
            await sendGraphQL(
                query
            );


        const assignments =
            data.complaint_assignment || [];


        console.log(
            "All assignments:",
            assignments
        );


        // ----------------------------------------------------
        // Find current staff
        // ----------------------------------------------------

        const staffId =
            currentStaff?.id ||
            getStaffId();


        const staffName =
            currentStaff?.full_name ||
            getStoredStaffName();


        console.log(
            "Current staff ID:",
            staffId
        );


        console.log(
            "Current staff name:",
            staffName
        );


        // ----------------------------------------------------
        // Filter assignments
        // ----------------------------------------------------

        let myAssignments = [];


        if (staffId) {

            myAssignments =
                assignments.filter(
                    assignment =>
                        assignment.staff_id === staffId
                );

        }


        // ----------------------------------------------------
        // If ID wasn't found, use staff name
        // ----------------------------------------------------

        if (
            myAssignments.length === 0 &&
            staffName
        ) {

            myAssignments =
                assignments.filter(
                    assignment =>
                        assignment.user &&
                        String(
                            assignment.user.full_name || ""
                        ).toLowerCase() ===
                        String(staffName).toLowerCase()
                );

        }


        // ----------------------------------------------------
        // Last fallback:
        // if only ONE staff is returned by assignment data,
        // don't hide the complaint.
        // ----------------------------------------------------

        if (
            myAssignments.length === 0 &&
            assignments.length > 0 &&
            !staffId &&
            !staffName
        ) {

            myAssignments =
                assignments;

        }


        console.log(
            "My assignments:",
            myAssignments
        );


        // ----------------------------------------------------
        // Convert assignment -> complaint object
        // ----------------------------------------------------

        allComplaints =
            myAssignments
                .filter(
                    assignment =>
                        assignment.complaint
                )
                .map(
                    assignment => {

                        const complaint =
                            assignment.complaint;


                        return {

                            assignment_id:
                                assignment.id,

                            complaint_id:
                                complaint.id,

                            staff_id:
                                assignment.staff_id,

                            assignment_status:
                                assignment.status,

                            assigned_at:
                                assignment.assigned_at,

                            student_id:
                                complaint.student_id,

                            room_id:
                                complaint.room_id,

                            category:
                                complaint.category,

                            title:
                                complaint.title,

                            description:
                                complaint.description,

                            priority:
                                complaint.priority,

                            status:
                                complaint.status ||
                                assignment.status ||
                                "Pending",

                            created_at:
                                complaint.created_at,

                            staff_name:
                                assignment.user?.full_name ||
                                ""

                        };

                    }
                );


        console.log(
            "Final complaints:",
            allComplaints
        );


        updateStatistics();


        renderRecentComplaints();


        renderComplaints();


        if (
            allComplaints.length === 0
        ) {

            showNoComplaints();

        }


    } catch (error) {

        console.error(
            "======================================"
        );

        console.error(
            "COMPLAINT LOADING ERROR:",
            error
        );

        console.error(
            "======================================"
        );


        showComplaintError(
            error.message
        );

    }

}


// ============================================================
// SHOW NO COMPLAINTS
// ============================================================

function showNoComplaints() {

    const recentTable =
        document.getElementById(
            "recentComplaintTable"
        );


    const complaintTable =
        document.getElementById(
            "complaintTable"
        );


    if (recentTable) {

        recentTable.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="empty-state"
                >

                    📝

                    <br>

                    <strong>
                        No assigned complaints
                    </strong>

                    <br>

                    <span>
                        You currently have no assigned complaints.
                    </span>

                </td>

            </tr>

        `;

    }


    if (complaintTable) {

        complaintTable.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="empty-state"
                >

                    📝

                    <br>

                    <strong>
                        No assigned complaints
                    </strong>

                    <br>

                    <span>
                        You currently have no assigned complaints.
                    </span>

                </td>

            </tr>

        `;

    }

}


// ============================================================
// SHOW ERROR
// ============================================================

function showComplaintError(message) {

    const recentTable =
        document.getElementById(
            "recentComplaintTable"
        );


    const complaintTable =
        document.getElementById(
            "complaintTable"
        );


    const text =
        escapeHtml(
            message ||
            "Unable to load complaints"
        );


    if (recentTable) {

        recentTable.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="empty-state"
                >

                    ⚠️

                    <br>

                    <strong>
                        Unable to load complaints
                    </strong>

                    <br>

                    <small>
                        ${text}
                    </small>

                </td>

            </tr>

        `;

    }


    if (complaintTable) {

        complaintTable.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="empty-state"
                >

                    ⚠️

                    <br>

                    <strong>
                        Unable to load complaints
                    </strong>

                    <br>

                    <small>
                        ${text}
                    </small>

                </td>

            </tr>

        `;

    }

}


// ============================================================
// UPDATE STATISTICS
// ============================================================

function updateStatistics() {

    const total =
        allComplaints.length;


    const pending =
        allComplaints.filter(
            complaint =>
                normalizeStatus(
                    complaint.status
                ) === "pending"
        ).length;


    const progress =
        allComplaints.filter(
            complaint =>
                normalizeStatus(
                    complaint.status
                ) === "in progress"
        ).length;


    const resolved =
        allComplaints.filter(
            complaint =>
                normalizeStatus(
                    complaint.status
                ) === "resolved"
        ).length;


    setText(
        "totalComplaints",
        total
    );


    setText(
        "pendingComplaints",
        pending
    );


    setText(
        "progressComplaints",
        progress
    );


    setText(
        "resolvedComplaints",
        resolved
    );

}


// ============================================================
// NORMALIZE STATUS
// ============================================================

function normalizeStatus(status) {

    return String(
        status || ""
    )
        .trim()
        .toLowerCase();

}


// ============================================================
// SET TEXT
// ============================================================

function setText(id, value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;

    }

}


// ============================================================
// RENDER RECENT COMPLAINTS
// ============================================================

function renderRecentComplaints() {

    const table =
        document.getElementById(
            "recentComplaintTable"
        );


    if (!table) {
        return;
    }


    const complaints =
        allComplaints.slice(
            0,
            5
        );


    if (complaints.length === 0) {

        showNoComplaints();

        return;

    }


    table.innerHTML =
        complaints
            .map(
                (complaint, index) =>
                    `

                    <tr>

                        <td>
                            ${index + 1}
                        </td>

                        <td>
                            ${escapeHtml(
                                complaint.student_id ||
                                "-"
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                complaint.room_id ||
                                "-"
                            )}
                        </td>

                        <td>
                            <strong>
                                ${escapeHtml(
                                    complaint.title ||
                                    "Untitled Complaint"
                                )}
                            </strong>
                        </td>

                        <td>

                            <span
                                class="priority-badge ${priorityClass(
                                    complaint.priority
                                )}"
                            >
                                ${escapeHtml(
                                    complaint.priority ||
                                    "-"
                                )}
                            </span>

                        </td>

                        <td>

                            <span
                                class="status-badge ${statusClass(
                                    complaint.status
                                )}"
                            >
                                ${escapeHtml(
                                    complaint.status ||
                                    "Pending"
                                )}
                            </span>

                        </td>

                        <td>

                            <button
                                type="button"
                                class="btn btn-primary btn-sm"
                                onclick="viewComplaint('${complaint.complaint_id}')"
                            >
                                👁 View
                            </button>

                        </td>

                    </tr>

                    `
            )
            .join("");

}


// ============================================================
// RENDER ALL COMPLAINTS
// ============================================================

function renderComplaints() {

    const table =
        document.getElementById(
            "complaintTable"
        );


    if (!table) {
        return;
    }


    let complaints =
        [...allComplaints];


    // --------------------------------------------------------
    // Search
    // --------------------------------------------------------

    const search =
        document.getElementById(
            "searchInput"
        )?.value
        ?.trim()
        .toLowerCase() || "";


    if (search) {

        complaints =
            complaints.filter(
                complaint => {

                    const text = [

                        complaint.student_id,
                        complaint.room_id,
                        complaint.title,
                        complaint.description,
                        complaint.category,
                        complaint.priority,
                        complaint.status

                    ]
                        .join(" ")
                        .toLowerCase();


                    return text.includes(
                        search
                    );

                }
            );

    }


    // --------------------------------------------------------
    // Status filter
    // --------------------------------------------------------

    const statusFilter =
        document.getElementById(
            "statusFilter"
        )?.value || "all";


    if (
        statusFilter !== "all"
    ) {

        complaints =
            complaints.filter(
                complaint =>
                    String(
                        complaint.status
                    ).toLowerCase() ===
                    String(
                        statusFilter
                    ).toLowerCase()
            );

    }


    // --------------------------------------------------------
    // Empty
    // --------------------------------------------------------

    if (complaints.length === 0) {

        table.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="empty-state"
                >

                    📝

                    <br>

                    No complaints found.

                </td>

            </tr>

        `;

        return;

    }


    // --------------------------------------------------------
    // Render
    // --------------------------------------------------------

    table.innerHTML =
        complaints
            .map(
                (complaint, index) =>
                    `

                    <tr>

                        <td>
                            ${index + 1}
                        </td>

                        <td>
                            ${escapeHtml(
                                complaint.student_id ||
                                "-"
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                complaint.room_id ||
                                "-"
                            )}
                        </td>

                        <td>

                            <strong>
                                ${escapeHtml(
                                    complaint.title ||
                                    "Untitled"
                                )}
                            </strong>

                        </td>

                        <td>
                            ${escapeHtml(
                                complaint.category ||
                                "-"
                            )}
                        </td>

                        <td>

                            <span
                                class="priority-badge ${priorityClass(
                                    complaint.priority
                                )}"
                            >
                                ${escapeHtml(
                                    complaint.priority ||
                                    "-"
                                )}
                            </span>

                        </td>

                        <td>

                            <select
                                class="status-select"
                                onchange="changeComplaintStatus(
                                    '${complaint.assignment_id}',
                                    '${complaint.complaint_id}',
                                    this.value
                                )"
                            >

                                <option
                                    value="Pending"
                                    ${normalizeStatus(
                                        complaint.status
                                    ) === "pending"
                                        ? "selected"
                                        : ""}
                                >
                                    Pending
                                </option>

                                <option
                                    value="In Progress"
                                    ${normalizeStatus(
                                        complaint.status
                                    ) === "in progress"
                                        ? "selected"
                                        : ""}
                                >
                                    In Progress
                                </option>

                                <option
                                    value="Resolved"
                                    ${normalizeStatus(
                                        complaint.status
                                    ) === "resolved"
                                        ? "selected"
                                        : ""}
                                >
                                    Resolved
                                </option>

                            </select>

                        </td>

                        <td>

                            <button
                                type="button"
                                class="btn btn-primary btn-sm"
                                onclick="viewComplaint('${complaint.complaint_id}')"
                            >
                                👁 View
                            </button>

                        </td>

                    </tr>

                    `
            )
            .join("");

}


// ============================================================
// VIEW COMPLAINT
// ============================================================

function viewComplaint(complaintId) {

    const complaint =
        allComplaints.find(
            item =>
                item.complaint_id ===
                complaintId
        );


    if (!complaint) {

        console.warn(
            "Complaint not found:",
            complaintId
        );

        return;

    }


    currentComplaint =
        complaint;


    setText(
        "popupStudent",
        complaint.student_id || "-"
    );


    setText(
        "popupRoom",
        complaint.room_id || "-"
    );


    setText(
        "popupTitle",
        complaint.title || "-"
    );


    setText(
        "popupCategory",
        complaint.category || "-"
    );


    setText(
        "popupPriority",
        complaint.priority || "-"
    );


    setText(
        "popupStatus",
        complaint.status || "-"
    );


    setText(
        "popupDescription",
        complaint.description || "-"
    );


    openPopup();

}


// ============================================================
// OPEN POPUP
// ============================================================

function openPopup() {

    const popup =
        document.querySelector(
            ".popup"
        );


    if (!popup) {
        return;
    }


    popup.classList.add(
        "show"
    );


    popup.style.display =
        "block";

}


// ============================================================
// CLOSE POPUP
// ============================================================

function closePopup() {

    const popup =
        document.querySelector(
            ".popup"
        );


    if (!popup) {
        return;
    }


    popup.classList.remove(
        "show"
    );


    popup.style.display =
        "none";


    currentComplaint =
        null;

}


// ============================================================
// CHANGE COMPLAINT STATUS
// ============================================================

async function changeComplaintStatus(
    assignmentId,
    complaintId,
    newStatus
) {

    if (
        !assignmentId ||
        !complaintId
    ) {

        console.error(
            "Missing assignment ID or complaint ID"
        );

        return;

    }


    try {

        // ----------------------------------------------------
        // Update assignment status
        // ----------------------------------------------------

        const assignmentMutation = `

            mutation UpdateAssignment(
                $id: uuid!,
                $status: String!
            ) {

                update_complaint_assignment_by_pk(
                    pk_columns: {
                        id: $id
                    }
                    _set: {
                        status: $status
                    }
                ) {

                    id
                    status

                }

            }

        `;


        await sendGraphQL(
            assignmentMutation,
            {
                id: assignmentId,
                status: newStatus
            }
        );


        // ----------------------------------------------------
        // Update complaint status
        // ----------------------------------------------------

        const complaintMutation = `

            mutation UpdateComplaint(
                $id: uuid!,
                $status: String!
            ) {

                update_complaints_by_pk(
                    pk_columns: {
                        id: $id
                    }
                    _set: {
                        status: $status
                    }
                ) {

                    id
                    status

                }

            }

        `;


        await sendGraphQL(
            complaintMutation,
            {
                id: complaintId,
                status: newStatus
            }
        );


        // ----------------------------------------------------
        // Update local data
        // ----------------------------------------------------

        const complaint =
            allComplaints.find(
                item =>
                    item.complaint_id ===
                    complaintId
            );


        if (complaint) {

            complaint.status =
                newStatus;

            complaint.assignment_status =
                newStatus;

        }


        updateStatistics();

        renderRecentComplaints();

        renderComplaints();


        // Popup status

        if (
            currentComplaint &&
            currentComplaint.complaint_id ===
            complaintId
        ) {

            setText(
                "popupStatus",
                newStatus
            );

        }


        console.log(
            "Status updated:",
            newStatus
        );


    } catch (error) {

        console.error(
            "Status update error:",
            error
        );


        alert(
            "Unable to update complaint status."
        );


        await loadAssignedComplaints();

    }

}


// ============================================================
// PROFILE UPDATE
// ============================================================

async function updateProfile(event) {

    event.preventDefault();


    if (!currentStaff?.id) {

        alert(
            "Staff account not found."
        );

        return;

    }


    const fullName =
        document.getElementById(
            "fullName"
        )?.value.trim();


    const email =
        document.getElementById(
            "email"
        )?.value.trim();


    const phone =
        document.getElementById(
            "phone"
        )?.value.trim();


    if (!fullName || !email) {

        alert(
            "Name and email are required."
        );

        return;

    }


    try {

        const mutation = `

            mutation UpdateStaff(
                $id: uuid!,
                $fullName: String!,
                $email: String!,
                $phone: String
            ) {

                update_users_by_pk(
                    pk_columns: {
                        id: $id
                    }
                    _set: {
                        full_name: $fullName
                        email: $email
                        phone: $phone
                    }
                ) {

                    id
                    full_name
                    email
                    phone
                    role

                }

            }

        `;


        const data =
            await sendGraphQL(
                mutation,
                {
                    id: currentStaff.id,
                    fullName,
                    email,
                    phone: phone || null
                }
            );


        if (
            data.update_users_by_pk
        ) {

            currentStaff =
                data.update_users_by_pk;


            updateStaffUI(
                currentStaff
            );


            // Update stored user

            const user =
                getSavedUser();


            if (user) {

                user.id =
                    currentStaff.id;

                user.full_name =
                    currentStaff.full_name;

                user.email =
                    currentStaff.email;

                user.phone =
                    currentStaff.phone;


                localStorage.setItem(
                    "user",
                    JSON.stringify(user)
                );

            }


            alert(
                "Profile updated successfully."
            );

        }

    } catch (error) {

        console.error(
            "Profile update error:",
            error
        );


        alert(
            "Unable to update profile."
        );

    }

}


// ============================================================
// NAVIGATION
// ============================================================

function setupNavigation() {

    const links =
        document.querySelectorAll(
            ".nav-link"
        );


    links.forEach(
        link => {

            link.addEventListener(
                "click",
                event => {

                    event.preventDefault();


                    const page =
                        link.dataset.page;


                    showPage(
                        page
                    );


                    history.replaceState(
                        null,
                        "",
                        `#${page}`
                    );

                }
            );

        }
    );

}


// ============================================================
// SHOW PAGE
// ============================================================

function showPage(page) {

    document
        .querySelectorAll(
            ".page-section"
        )
        .forEach(
            section => {

                section.classList.remove(
                    "active-page"
                );

                section.style.display =
                    "none";

            }
        );


    const target =
        document.getElementById(
            `${page}Page`
        );


    if (target) {

        target.classList.add(
            "active-page"
        );

        target.style.display =
            "block";

    }


    document
        .querySelectorAll(
            ".nav-link"
        )
        .forEach(
            link => {

                link.classList.remove(
                    "active"
                );


                if (
                    link.dataset.page ===
                    page
                ) {

                    link.classList.add(
                        "active"
                    );

                }

            }
        );


    const pageTitle =
        document.getElementById(
            "pageTitle"
        );


    const pageSubtitle =
        document.getElementById(
            "pageSubtitle"
        );


    if (page === "dashboard") {

        if (pageTitle) {
            pageTitle.textContent =
                "Staff Dashboard";
        }

        if (pageSubtitle) {
            pageSubtitle.textContent =
                "Manage your assigned hostel complaints";
        }

    }


    else if (page === "complaints") {

        if (pageTitle) {
            pageTitle.textContent =
                "My Complaints";
        }

        if (pageSubtitle) {
            pageSubtitle.textContent =
                "View and manage complaints assigned to you";
        }


        renderComplaints();

    }


    else if (page === "profile") {

        if (pageTitle) {
            pageTitle.textContent =
                "My Profile";
        }

        if (pageSubtitle) {
            pageSubtitle.textContent =
                "View and manage your staff account";
        }

    }

}


// ============================================================
// SEARCH
// ============================================================

function setupSearch() {

    const searchInput =
        document.getElementById(
            "searchInput"
        );


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            renderComplaints
        );

    }


    const statusFilter =
        document.getElementById(
            "statusFilter"
        );


    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            renderComplaints
        );

    }

}


// ============================================================
// REFRESH BUTTONS
// ============================================================

function setupRefreshButtons() {

    const refreshButton =
        document.getElementById(
            "refreshButton"
        );


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            async () => {

                await loadAssignedComplaints();

            }
        );

    }


    const dashboardRefresh =
        document.getElementById(
            "dashboardRefresh"
        );


    if (dashboardRefresh) {

        dashboardRefresh.addEventListener(
            "click",
            async () => {

                await loadAssignedComplaints();

            }
        );

    }

}


// ============================================================
// POPUP EVENTS
// ============================================================

function setupPopup() {

    const closeTop =
        document.getElementById(
            "popupClose"
        );


    const closeBottom =
        document.getElementById(
            "popupCloseBottom"
        );


    if (closeTop) {

        closeTop.addEventListener(
            "click",
            closePopup
        );

    }


    if (closeBottom) {

        closeBottom.addEventListener(
            "click",
            closePopup
        );

    }


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                closePopup();

            }

        }
    );

}


// ============================================================
// LOGOUT
// ============================================================

function setupLogout() {

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );


    if (!logoutButton) {
        return;
    }


    logoutButton.addEventListener(
        "click",
        () => {

            localStorage.clear();

            sessionStorage.clear();


            window.location.href =
                "../login.html";

        }
    );

}


// ============================================================
// PROFILE FORM
// ============================================================

function setupProfileForm() {

    const form =
        document.getElementById(
            "profileForm"
        );


    if (form) {

        form.addEventListener(
            "submit",
            updateProfile
        );

    }

}


// ============================================================
// HASH NAVIGATION
// ============================================================

function setupHashNavigation() {

    const hash =
        window.location.hash
            .replace("#", "")
            .trim();


    if (
        hash === "complaints" ||
        hash === "profile" ||
        hash === "dashboard"
    ) {

        showPage(
            hash
        );

    }

}


// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "======================================"
        );

        console.log(
            "SmartStay Staff Dashboard"
        );

        console.log(
            "Dashboard initializing..."
        );

        console.log(
            "======================================"
        );


        setupNavigation();

        setupSearch();

        setupRefreshButtons();

        setupPopup();

        setupLogout();

        setupProfileForm();


        // Load staff first

        await loadStaff();


        // Then load assignments

        await loadAssignedComplaints();


        // Finally handle hash

        setupHashNavigation();


        console.log(
            "Dashboard ready."
        );

    }
);


// ============================================================
// MAKE FUNCTIONS AVAILABLE TO HTML
// ============================================================

window.loadAssignedComplaints =
    loadAssignedComplaints;

window.viewComplaint =
    viewComplaint;

window.changeComplaintStatus =
    changeComplaintStatus;

window.closePopup =
    closePopup;

window.openPopup =
    openPopup;