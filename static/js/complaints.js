// =====================================================
// SmartStay - Admin Complaints
// static/js/complaints.js
// COMPLETE VERSION
// =====================================================

const HASURA_URL =
    "https://smarthostel.hasura.app/v1/graphql";

// =====================================================
// GLOBAL DATA
// =====================================================

let allComplaints = [];
let allAssignments = [];
let allStaff = [];
let allStudents = [];
let allRooms = [];


// =====================================================
// GRAPHQL HELPER
// =====================================================

async function adminGraphQL(query, variables = {}) {

    try {

        const response = await fetch(
            HASURA_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    query: query,
                    variables: variables
                })
            }
        );

        const result = await response.json();

        console.log(
            "SmartStay GraphQL:",
            result
        );

        if (result.errors) {

            console.error(
                "GraphQL Error:",
                result.errors
            );

            throw new Error(
                result.errors[0]?.message ||
                "GraphQL Error"
            );
        }

        return result.data;

    } catch (error) {

        console.error(
            "GraphQL Request Failed:",
            error
        );

        throw error;
    }
}


// =====================================================
// LOAD COMPLAINTS
// =====================================================

async function loadComplaints() {

    const table =
        document.getElementById(
            "complaintTable"
        );

    if (table) {

        table.innerHTML = `
            <tr>
                <td colspan="9" class="empty-message">
                    Loading complaints...
                </td>
            </tr>
        `;
    }


    const query = `

        query GetComplaints {

            complaints(
                order_by: {
                    created_at: desc
                }
            ) {

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

        }

    `;


    try {

        const data =
            await adminGraphQL(query);


        allComplaints =
            data?.complaints || [];


        console.log(
            "Complaints:",
            allComplaints
        );


        await loadRelatedDetails();


        updateStatistics();


        displayComplaints(
            allComplaints
        );


    } catch (error) {

        console.error(
            "Load complaints error:",
            error
        );


        if (table) {

            table.innerHTML = `
                <tr>
                    <td colspan="9" class="empty-message">
                        Unable to load complaints.
                    </td>
                </tr>
            `;
        }
    }
}


// =====================================================
// LOAD RELATED DETAILS
// =====================================================

async function loadRelatedDetails() {

    allAssignments = [];
    allStaff = [];
    allStudents = [];
    allRooms = [];


    // =================================================
    // IDS
    // =================================================

    const studentIds = [
        ...new Set(
            allComplaints
                .map(
                    complaint =>
                        complaint.student_id
                )
                .filter(Boolean)
        )
    ];


    const roomIds = [
        ...new Set(
            allComplaints
                .map(
                    complaint =>
                        complaint.room_id
                )
                .filter(Boolean)
        )
    ];


    const complaintIds = [
        ...new Set(
            allComplaints
                .map(
                    complaint =>
                        complaint.id
                )
                .filter(Boolean)
        )
    ];


    // =================================================
    // LOAD STUDENTS
    // =================================================

    if (studentIds.length > 0) {

        const studentQuery = `

            query GetStudents(
                $ids: [uuid!]!
            ) {

                users(
                    where: {
                        id: {
                            _in: $ids
                        }
                    }
                ) {

                    id
                    full_name
                    student_id
                    role

                }

            }

        `;


        try {

            const data =
                await adminGraphQL(
                    studentQuery,
                    {
                        ids: studentIds
                    }
                );


            allStudents =
                data?.users || [];


            allComplaints.forEach(
                complaint => {

                    const student =
                        allStudents.find(
                            item =>
                                item.id ===
                                complaint.student_id
                        );


                    complaint.student_name =
                        student?.full_name ||
                        student?.student_id ||
                        "Student";
                }
            );


        } catch (error) {

            console.error(
                "Student details error:",
                error
            );


            allComplaints.forEach(
                complaint => {

                    complaint.student_name =
                        "Student";
                }
            );
        }

    } else {

        allComplaints.forEach(
            complaint => {

                complaint.student_name =
                    "Student";
            }
        );
    }


    // =================================================
    // LOAD ROOMS
    // =================================================

    if (roomIds.length > 0) {

        const roomQuery = `

            query GetRooms(
                $ids: [uuid!]!
            ) {

                rooms(
                    where: {
                        id: {
                            _in: $ids
                        }
                    }
                ) {

                    id
                    room_number

                }

            }

        `;


        try {

            const data =
                await adminGraphQL(
                    roomQuery,
                    {
                        ids: roomIds
                    }
                );


            allRooms =
                data?.rooms || [];


            allComplaints.forEach(
                complaint => {

                    const room =
                        allRooms.find(
                            item =>
                                item.id ===
                                complaint.room_id
                        );


                    complaint.room_number =
                        room?.room_number ||
                        "Not Assigned";
                }
            );


        } catch (error) {

            console.error(
                "Room details error:",
                error
            );


            allComplaints.forEach(
                complaint => {

                    complaint.room_number =
                        "Not Assigned";
                }
            );
        }

    } else {

        allComplaints.forEach(
            complaint => {

                complaint.room_number =
                    "Not Assigned";
            }
        );
    }


    // =================================================
    // NO COMPLAINTS
    // =================================================

    if (complaintIds.length === 0) {

        allComplaints.forEach(
            complaint => {

                complaint.staff_name =
                    "Not Assigned";

                complaint.staff_id =
                    null;

                complaint.assignment_id =
                    null;
            }
        );

        return;
    }


    // =================================================
    // LOAD ASSIGNMENTS
    // =================================================

    const assignmentQuery = `

        query GetAssignments(
            $ids: [uuid!]!
        ) {

            complaint_assignment(
                where: {
                    complaint_id: {
                        _in: $ids
                    }
                }
            ) {

                id
                complaint_id
                staff_id
                assigned_at
                status

            }

        }

    `;


    try {

        const data =
            await adminGraphQL(
                assignmentQuery,
                {
                    ids: complaintIds
                }
            );


        allAssignments =
            data?.complaint_assignment || [];


        console.log(
            "Assignments:",
            allAssignments
        );


    } catch (error) {

        console.error(
            "Assignment loading error:",
            error
        );

        allAssignments = [];
    }


    // =================================================
    // STAFF IDS
    // =================================================

    const staffIds = [
        ...new Set(
            allAssignments
                .map(
                    assignment =>
                        assignment.staff_id
                )
                .filter(Boolean)
        )
    ];


    // =================================================
    // LOAD STAFF
    // =================================================

    if (staffIds.length > 0) {

        const staffQuery = `

            query GetStaff(
                $ids: [uuid!]!
            ) {

                users(
                    where: {
                        id: {
                            _in: $ids
                        }
                    }
                ) {

                    id
                    full_name
                    staff_id
                    role

                }

            }

        `;


        try {

            const staffData =
                await adminGraphQL(
                    staffQuery,
                    {
                        ids: staffIds
                    }
                );


            allStaff =
                staffData?.users || [];


            console.log(
                "Staff:",
                allStaff
            );


        } catch (error) {

            console.error(
                "Staff loading error:",
                error
            );

            allStaff = [];
        }
    }


    // =================================================
    // ATTACH STAFF TO COMPLAINT
    // =================================================

    allComplaints.forEach(
        complaint => {

            const assignment =
                allAssignments.find(
                    item =>
                        item.complaint_id ===
                        complaint.id
                );


            // -----------------------------------------
            // NOT ASSIGNED
            // -----------------------------------------

            if (!assignment) {

                complaint.staff_name =
                    "Not Assigned";

                complaint.staff_id =
                    null;

                complaint.assignment_id =
                    null;

                complaint.assignment_status =
                    null;

                return;
            }


            // -----------------------------------------
            // FIND STAFF
            // -----------------------------------------

            const staff =
                allStaff.find(
                    item =>
                        item.id ===
                        assignment.staff_id
                );


            complaint.staff_id =
                assignment.staff_id;


            complaint.assignment_id =
                assignment.id;


            complaint.assignment_status =
                assignment.status;


            complaint.staff_name =
                staff?.full_name ||
                staff?.staff_id ||
                "Assigned Staff";
        }
    );
}


// =====================================================
// STATISTICS
// =====================================================

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


    setText(
        "complaintTotal",
        total
    );
}


// =====================================================
// DISPLAY COMPLAINTS
// =====================================================

function displayComplaints(
    complaints
) {

    const table =
        document.getElementById(
            "complaintTable"
        );


    if (!table) return;


    if (!complaints.length) {

        table.innerHTML = `
            <tr>
                <td colspan="9" class="empty-message">
                    No complaints found.
                </td>
            </tr>
        `;

        return;
    }


    table.innerHTML =
        complaints
            .map(
                (complaint, index) => {

                    const status =
                        complaint.status ||
                        "Pending";


                    const priority =
                        complaint.priority ||
                        "Medium";


                    const staffName =
                        complaint.staff_name ||
                        "Not Assigned";


                    const isAssigned =
                        Boolean(
                            complaint.staff_id
                        );


                    const normalizedStatus =
                        normalizeStatus(
                            status
                        );


                    const statusClass =
                        getStatusClass(
                            status
                        );


                    const priorityClass =
                        getPriorityClass(
                            priority
                        );


                    // =================================
                    // ASSIGNED STAFF COLUMN
                    // =================================

                    let staffHTML;


                    if (isAssigned) {

                        /*
                         * IMPORTANT:
                         * Only staff name.
                         *
                         * No "Assigned"
                         * No button
                         * No Reassign here.
                         */

                        staffHTML = `
                            <div class="assigned-staff-name">
                                <span class="staff-icon">
                                    👨‍🔧
                                </span>

                                <span>
                                    ${escapeHtml(
                                        staffName
                                    )}
                                </span>
                            </div>
                        `;

                    } else {

                        staffHTML = `
                            <span class="staff-not-assigned">
                                Not Assigned
                            </span>
                        `;
                    }


                    // =================================
                    // ACTION COLUMN
                    // =================================

                    let actionHTML;


                    /*
                     * RESOLVED COMPLAINT
                     *
                     * Once resolved, don't show
                     * Assign/Reassign.
                     */

                    if (
                        normalizedStatus ===
                        "resolved"
                    ) {

                        actionHTML = `
                            <span class="action-completed">
                                ✓ Completed
                            </span>
                        `;

                    }

                    /*
                     * NOT ASSIGNED
                     */

                    else if (!isAssigned) {

                        actionHTML = `
                            <a
                                href="assign_staff.html?complaint_id=${encodeURIComponent(
                                    complaint.id
                                )}"
                                class="btn-assign"
                            >
                                Assign Staff
                            </a>
                        `;

                    }

                    /*
                     * ASSIGNED + NOT RESOLVED
                     */

                    else {

                        actionHTML = `
                            <a
                                href="assign_staff.html?complaint_id=${encodeURIComponent(
                                    complaint.id
                                )}"
                                class="btn-reassign"
                            >
                                Reassign
                            </a>
                        `;
                    }


                    // =================================
                    // RETURN ROW
                    // =================================

                    return `

                        <tr>

                            <!-- NUMBER -->

                            <td>
                                <strong>
                                    ${index + 1}
                                </strong>
                            </td>


                            <!-- STUDENT -->

                            <td>

                                <div class="student-cell">

                                    <strong>
                                        ${escapeHtml(
                                            complaint.student_name ||
                                            "Student"
                                        )}
                                    </strong>

                                </div>

                            </td>


                            <!-- ROOM -->

                            <td>

                                <span class="room-number">
                                    ${escapeHtml(
                                        complaint.room_number ||
                                        "Not Assigned"
                                    )}
                                </span>

                            </td>


                            <!-- TITLE -->

                            <td>

                                <strong>
                                    ${escapeHtml(
                                        complaint.title ||
                                        "Complaint"
                                    )}
                                </strong>

                            </td>


                            <!-- CATEGORY -->

                            <td>
                                ${escapeHtml(
                                    complaint.category ||
                                    "-"
                                )}
                            </td>


                            <!-- PRIORITY -->

                            <td>

                                <span
                                    class="priority-badge ${priorityClass}"
                                >
                                    ${escapeHtml(
                                        priority
                                    )}
                                </span>

                            </td>


                            <!-- STATUS -->

                            <td>

                                <select
                                    class="status-select ${statusClass}"
                                    onchange="
                                        updateComplaintStatus(
                                            '${complaint.id}',
                                            this.value
                                        )
                                    "
                                >

                                    <option
                                        value="Pending"
                                        ${
                                            normalizedStatus ===
                                            "pending"
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        Pending
                                    </option>


                                    <option
                                        value="In Progress"
                                        ${
                                            normalizedStatus ===
                                            "in progress"
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        In Progress
                                    </option>


                                    <option
                                        value="Resolved"
                                        ${
                                            normalizedStatus ===
                                            "resolved"
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        Resolved
                                    </option>

                                </select>

                            </td>


                            <!-- ASSIGNED STAFF -->

                            <td>
                                ${staffHTML}
                            </td>


                            <!-- ACTION -->

                            <td>

                                <div class="complaint-actions">
                                    ${actionHTML}
                                </div>

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");
}


// =====================================================
// UPDATE COMPLAINT STATUS
// =====================================================

async function updateComplaintStatus(
    complaintId,
    newStatus
) {

    if (!complaintId) return;


    const mutation = `

        mutation UpdateComplaintStatus(
            $id: uuid!
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


    try {

        const data =
            await adminGraphQL(
                mutation,
                {
                    id: complaintId,
                    status: newStatus
                }
            );


        const updated =
            data?.update_complaints_by_pk;


        const complaint =
            allComplaints.find(
                item =>
                    item.id ===
                    complaintId
            );


        if (complaint) {

            complaint.status =
                updated?.status ||
                newStatus;
        }


        updateStatistics();


        applyFilters();


        console.log(
            "Complaint status updated:",
            complaintId,
            newStatus
        );


    } catch (error) {

        console.error(
            "Status update error:",
            error
        );


        alert(
            "Failed to update complaint status."
        );


        await loadComplaints();
    }
}


// =====================================================
// SEARCH + FILTER
// =====================================================

function applyFilters() {

    const searchInput =
        document.getElementById(
            "complaintSearch"
        );


    const statusFilter =
        document.getElementById(
            "statusFilter"
        );


    const priorityFilter =
        document.getElementById(
            "priorityFilter"
        );


    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const selectedStatus =
        statusFilter
            ? statusFilter.value
            : "all";


    const selectedPriority =
        priorityFilter
            ? priorityFilter.value
            : "all";


    const filtered =
        allComplaints.filter(
            complaint => {

                const searchText = [

                    complaint.title,

                    complaint.category,

                    complaint.description,

                    complaint.student_name,

                    complaint.room_number,

                    complaint.staff_name,

                    complaint.priority,

                    complaint.status

                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();


                const matchesSearch =
                    !search ||
                    searchText.includes(
                        search
                    );


                const matchesStatus =
                    selectedStatus === "all" ||
                    normalizeStatus(
                        complaint.status
                    ) ===
                    normalizeStatus(
                        selectedStatus
                    );


                const matchesPriority =
                    selectedPriority === "all" ||
                    normalizeStatus(
                        complaint.priority
                    ) ===
                    normalizeStatus(
                        selectedPriority
                    );


                return (
                    matchesSearch &&
                    matchesStatus &&
                    matchesPriority
                );
            }
        );


    displayComplaints(
        filtered
    );


    setText(
        "complaintTotal",
        filtered.length
    );
}


// =====================================================
// NORMALIZE STATUS
// =====================================================

function normalizeStatus(value) {

    return String(
        value || ""
    )
        .trim()
        .toLowerCase()
        .replace(
            /[_-]/g,
            " "
        )
        .replace(
            /\s+/g,
            " "
        );
}


// =====================================================
// STATUS CLASS
// =====================================================

function getStatusClass(status) {

    const value =
        normalizeStatus(status);


    if (value === "pending") {

        return "status-pending";
    }


    if (value === "in progress") {

        return "status-progress";
    }


    if (value === "resolved") {

        return "status-resolved";
    }


    return "";
}


// =====================================================
// PRIORITY CLASS
// =====================================================

function getPriorityClass(priority) {

    return String(
        priority || "medium"
    )
        .trim()
        .toLowerCase()
        .replace(
            /\s+/g,
            "-"
        );
}


// =====================================================
// SET TEXT
// =====================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;
    }
}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;
}


// =====================================================
// PAGE INITIALIZATION
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "SmartStay Admin Complaints Loaded"
        );


        // =============================================
        // LOAD
        // =============================================

        loadComplaints();


        // =============================================
        // SEARCH
        // =============================================

        const search =
            document.getElementById(
                "complaintSearch"
            );


        if (search) {

            search.addEventListener(
                "input",
                applyFilters
            );
        }


        // =============================================
        // STATUS FILTER
        // =============================================

        const status =
            document.getElementById(
                "statusFilter"
            );


        if (status) {

            status.addEventListener(
                "change",
                applyFilters
            );
        }


        // =============================================
        // PRIORITY FILTER
        // =============================================

        const priority =
            document.getElementById(
                "priorityFilter"
            );


        if (priority) {

            priority.addEventListener(
                "change",
                applyFilters
            );
        }

    }
);