// =====================================================
// SmartStay - Student Module
// static/js/student.js
// =====================================================

const HASURA_URL =
    "https://smarthostel.hasura.app/v1/graphql";


// =====================================================
// GRAPHQL HELPER
// =====================================================

async function studentGraphQL(query, variables = {}) {

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


        const result =
            await response.json();


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
                result.errors[0].message
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
// SESSION - STUDENT ID
// =====================================================

function getStudentId() {

    const id =
        sessionStorage.getItem(
            "student_id"
        ) ||
        sessionStorage.getItem(
            "smartstay_user_id"
        );

    console.log(
        "Student ID:",
        id
    );

    return id;
}


// =====================================================
// SESSION - STUDENT NAME
// =====================================================

function getStudentName() {

    return (
        sessionStorage.getItem(
            "student_name"
        ) ||
        sessionStorage.getItem(
            "smartstay_user_name"
        ) ||
        "Student"
    );
}


// =====================================================
// TEXT HELPER
// =====================================================

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            value ?? "";
    }
}


// =====================================================
// DATE FORMAT
// =====================================================

function formatDate(date) {

    if (!date) {
        return "Not Available";
    }


    const d =
        new Date(date);


    if (isNaN(d.getTime())) {
        return date;
    }


    return d.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


// =====================================================
// HTML ESCAPE
// =====================================================

function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        String(value ?? "");

    return div.innerHTML;
}


// =====================================================
// LOGOUT
// =====================================================

function logoutStudent(event) {

    if (event) {
        event.preventDefault();
    }


    sessionStorage.clear();


    window.location.href =
        "../login.html";
}


// =====================================================
// DASHBOARD
// =====================================================

async function loadStudentDashboard() {

    console.log(
        "========== STUDENT DASHBOARD =========="
    );


    const studentId =
        getStudentId();


    // -------------------------------------------------
    // LOGIN CHECK
    // -------------------------------------------------

    if (!studentId) {

        setText(
            "welcomeName",
            "Student account not found. Please login again."
        );

        setText(
            "totalComplaints",
            "0"
        );

        setText(
            "pendingComplaints",
            "0"
        );

        setText(
            "resolvedComplaints",
            "0"
        );

        showNoRoom();

        return;
    }


    // -------------------------------------------------
    // STUDENT NAME
    // -------------------------------------------------

    setText(
        "welcomeName",
        getStudentName()
    );


    // -------------------------------------------------
    // COMPLAINT QUERY
    // -------------------------------------------------

    const query = `

        query StudentDashboard(
            $studentId: uuid!
        ) {

            complaints(

                where: {

                    student_id: {
                        _eq: $studentId
                    }

                }

                order_by: {
                    created_at: desc
                }

            ) {

                id
                title
                description
                category
                priority
                status
                created_at

            }

        }

    `;


    try {

        const data =
            await studentGraphQL(
                query,
                {
                    studentId:
                        studentId
                }
            );


        console.log(
            "Student Complaints:",
            data
        );


        const complaints =
            data?.complaints || [];


        // -------------------------------------------------
        // COUNTS
        // -------------------------------------------------

        const total =
            complaints.length;


        const pending =
            complaints.filter(
                complaint => {

                    const status =
                        String(
                            complaint.status || ""
                        ).toLowerCase();

                    return (
                        status === "pending"
                    );
                }
            ).length;


        const resolved =
            complaints.filter(
                complaint => {

                    const status =
                        String(
                            complaint.status || ""
                        ).toLowerCase();

                    return (
                        status === "resolved"
                    );
                }
            ).length;


        // -------------------------------------------------
        // DISPLAY COUNTS
        // -------------------------------------------------

        setText(
            "totalComplaints",
            total
        );


        setText(
            "pendingComplaints",
            pending
        );


        setText(
            "resolvedComplaints",
            resolved
        );


        // -------------------------------------------------
        // RECENT COMPLAINTS
        // -------------------------------------------------

        displayRecentComplaints(
            complaints
        );

    } catch (error) {

        console.error(
            "Dashboard Complaint Error:",
            error
        );


        setText(
            "totalComplaints",
            "0"
        );


        setText(
            "pendingComplaints",
            "0"
        );


        setText(
            "resolvedComplaints",
            "0"
        );


        const container =
            document.getElementById(
                "recentComplaints"
            );


        if (container) {

            container.innerHTML = `

                <div class="empty-state">

                    <p>
                        Unable to load complaints.
                    </p>

                </div>

            `;
        }
    }


    // -------------------------------------------------
    // LOAD ROOM
    // -------------------------------------------------

    await loadStudentRoom(
        studentId
    );
}


// =====================================================
// RECENT COMPLAINTS
// =====================================================

function displayRecentComplaints(
    complaints
) {

    const container =
        document.getElementById(
            "recentComplaints"
        );


    if (!container) {
        return;
    }


    // -------------------------------------------------
    // EMPTY
    // -------------------------------------------------

    if (
        !complaints ||
        complaints.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-state">

                <p>
                    No complaints found.
                </p>

            </div>

        `;

        return;
    }


    // -------------------------------------------------
    // LATEST 5
    // -------------------------------------------------

    const recent =
        complaints.slice(0, 5);


    container.innerHTML =
        recent.map(
            complaint => {

                return `

                    <div class="complaint-item">

                        <div>

                            <h4>
                                ${escapeHtml(
                                    complaint.title ||
                                    "Complaint"
                                )}
                            </h4>

                            <p>
                                ${escapeHtml(
                                    complaint.category ||
                                    "General"
                                )}
                            </p>

                        </div>

                        <span class="status">

                            ${escapeHtml(
                                complaint.status ||
                                "Pending"
                            )}

                        </span>

                    </div>

                `;
            }
        ).join("");
}


// =====================================================
// LOAD STUDENT ROOM
// =====================================================

async function loadStudentRoom(
    studentId
) {

    console.log(
        "Loading room..."
    );


    // -------------------------------------------------
    // STEP 1
    // GET ASSIGNMENT
    // -------------------------------------------------

    const assignmentQuery = `

        query GetStudentRoom(
            $studentId: uuid!
        ) {

            student_room(

                where: {

                    student_id: {
                        _eq: $studentId
                    }

                }

                order_by: {
                    assigned_at: desc
                }

                limit: 1

            ) {

                room_id
                assigned_at

            }

        }

    `;


    try {

        const assignmentData =
            await studentGraphQL(
                assignmentQuery,
                {
                    studentId:
                        studentId
                }
            );


        console.log(
            "Room Assignment:",
            assignmentData
        );


        const assignments =
            assignmentData?.student_room || [];


        if (
            assignments.length === 0
        ) {

            showNoRoom();

            return;
        }


        const assignment =
            assignments[0];


        const roomId =
            assignment.room_id;


        if (!roomId) {

            showNoRoom();

            return;
        }


        // -------------------------------------------------
        // STEP 2
        // GET ROOM DIRECTLY
        // -------------------------------------------------

        const roomQuery = `

            query GetRoom(
                $roomId: uuid!
            ) {

                rooms_by_pk(
                    id: $roomId
                ) {

                    id
                    room_number
                    room_type
                    floor
                    status

                }

            }

        `;


        const roomData =
            await studentGraphQL(
                roomQuery,
                {
                    roomId:
                        roomId
                }
            );


        console.log(
            "Room Details:",
            roomData
        );


        const room =
            roomData?.rooms_by_pk;


        if (!room) {

            showNoRoom();

            return;
        }


        // -------------------------------------------------
        // DISPLAY ROOM
        // -------------------------------------------------

        setText(
            "roomNumber",
            room.room_number ||
                "Not Available"
        );


        setText(
            "roomType",
            room.room_type ||
                "Not Available"
        );


        setText(
            "floor",
            room.floor ??
                "Not Available"
        );


        setText(
            "roomStatus",
            room.status ||
                "Available"
        );


        setText(
            "assignedDate",
            formatDate(
                assignment.assigned_at
            )
        );


    } catch (error) {

        console.error(
            "Room Loading Error:",
            error
        );


        showNoRoom();
    }
}


// =====================================================
// NO ROOM
// =====================================================

function showNoRoom() {

    setText(
        "roomNumber",
        "Not Assigned"
    );


    setText(
        "roomType",
        "Not Assigned"
    );


    setText(
        "floor",
        "Not Assigned"
    );


    setText(
        "roomStatus",
        "Not Assigned"
    );


    setText(
        "assignedDate",
        "Not Assigned"
    );
}


// =====================================================
// STUDENT PROFILE
// =====================================================

async function loadStudentProfile() {

    console.log(
        "Loading Student Profile..."
    );


    const studentId =
        getStudentId();


    if (!studentId) {

        setText(
            "profileName",
            "Student account not found"
        );

        setText(
            "profileRole",
            "Please login again"
        );

        return;
    }


    const query = `

        query StudentProfile(
            $id: uuid!
        ) {

            users_by_pk(
                id: $id
            ) {

                id
                full_name
                email
                role
                phone
                student_id
                course
                year

            }

        }

    `;


    try {

        const data =
            await studentGraphQL(
                query,
                {
                    id:
                        studentId
                }
            );


        const student =
            data?.users_by_pk;


        if (!student) {

            setText(
                "profileName",
                "Student not found"
            );

            return;
        }


        // -------------------------------------------------
        // HEADER
        // -------------------------------------------------

        setText(
            "profileName",
            student.full_name ||
                "Student"
        );


        setText(
            "profileRole",
            student.role ||
                "student"
        );


        // -------------------------------------------------
        // PERSONAL
        // -------------------------------------------------

        setText(
            "fullName",
            student.full_name ||
                "Not provided"
        );


        setText(
            "email",
            student.email ||
                "Not provided"
        );


        setText(
            "phone",
            student.phone ||
                "Not provided"
        );


        setText(
            "role",
            student.role ||
                "student"
        );


        setText(
            "studentId",
            student.student_id ||
                student.id
        );


        setText(
            "course",
            student.course ||
                "Not provided"
        );


        setText(
            "year",
            student.year ||
                "Not provided"
        );


        // -------------------------------------------------
        // ACCOUNT
        // -------------------------------------------------

        setText(
            "accountStatus",
            "Active"
        );


        setText(
            "userRole",
            student.role ||
                "student"
        );


        // -------------------------------------------------
        // ROOM
        // -------------------------------------------------

        await loadStudentRoom(
            student.id
        );


    } catch (error) {

        console.error(
            "Profile Error:",
            error
        );
    }
}


// =====================================================
// MY COMPLAINTS
// =====================================================

async function loadMyComplaints() {

    console.log(
        "Loading My Complaints..."
    );


    const studentId =
        getStudentId();


    if (!studentId) {

        return;
    }


    const query = `

        query MyComplaints(
            $studentId: uuid!
        ) {

            complaints(

                where: {

                    student_id: {
                        _eq: $studentId
                    }

                }

                order_by: {
                    created_at: desc
                }

            ) {

                id
                title
                description
                category
                priority
                status
                created_at

            }

        }

    `;


    try {

        const data =
            await studentGraphQL(
                query,
                {
                    studentId:
                        studentId
                }
            );


        displayMyComplaints(
            data?.complaints || []
        );


    } catch (error) {

        console.error(
            "My Complaints Error:",
            error
        );
    }
}


// =====================================================
// DISPLAY MY COMPLAINTS
// =====================================================

function displayMyComplaints(
    complaints
) {

    const container =
        document.getElementById(
            "complaintsList"
        );


    if (!container) {
        return;
    }


    if (
        !complaints ||
        complaints.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-state">

                <h3>
                    No Complaints
                </h3>

                <p>
                    You have not submitted
                    any complaints yet.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML =
        complaints.map(
            complaint => {

                return `

                    <div class="complaint-card">

                        <h3>
                            ${escapeHtml(
                                complaint.title ||
                                "Complaint"
                            )}
                        </h3>


                        <p>
                            ${escapeHtml(
                                complaint.description ||
                                ""
                            )}
                        </p>


                        <div class="complaint-meta">

                            <span>
                                Category:
                                ${escapeHtml(
                                    complaint.category ||
                                    "-"
                                )}
                            </span>


                            <span>
                                Priority:
                                ${escapeHtml(
                                    complaint.priority ||
                                    "-"
                                )}
                            </span>


                            <span>
                                Status:
                                ${escapeHtml(
                                    complaint.status ||
                                    "-"
                                )}
                            </span>


                            <span>
                                ${formatDate(
                                    complaint.created_at
                                )}
                            </span>

                        </div>

                    </div>

                `;
            }
        ).join("");
}


// =====================================================
// ADD COMPLAINT
// =====================================================

async function addComplaint(event) {

    event.preventDefault();


    const studentId =
        getStudentId();


    if (!studentId) {

        alert(
            "Please login again."
        );

        return;
    }


    const category =
        document.getElementById(
            "category"
        )?.value.trim();


    const title =
        document.getElementById(
            "title"
        )?.value.trim();


    const description =
        document.getElementById(
            "description"
        )?.value.trim();


    const priority =
        document.getElementById(
            "priority"
        )?.value.trim();


    if (
        !category ||
        !title ||
        !description ||
        !priority
    ) {

        alert(
            "Please fill all required fields."
        );

        return;
    }


    // -------------------------------------------------
    // GET ROOM
    // -------------------------------------------------

    const roomQuery = `

        query StudentRoom(
            $studentId: uuid!
        ) {

            student_room(

                where: {

                    student_id: {
                        _eq: $studentId
                    }

                }

                order_by: {
                    assigned_at: desc
                }

                limit: 1

            ) {

                room_id

            }

        }

    `;


    try {

        const roomData =
            await studentGraphQL(
                roomQuery,
                {
                    studentId:
                        studentId
                }
            );


        const assignments =
            roomData?.student_room || [];


        if (
            assignments.length === 0
        ) {

            alert(
                "You have not been assigned a room yet."
            );

            return;
        }


        const roomId =
            assignments[0].room_id;


        // -------------------------------------------------
        // INSERT COMPLAINT
        // -------------------------------------------------

        const mutation = `

            mutation AddComplaint(

                $studentId: uuid!
                $roomId: uuid!
                $category: String!
                $title: String!
                $description: String!
                $priority: String!

            ) {

                insert_complaints_one(

                    object: {

                        student_id: $studentId
                        room_id: $roomId
                        category: $category
                        title: $title
                        description: $description
                        priority: $priority
                        status: "Pending"

                    }

                ) {

                    id
                    title
                    status

                }

            }

        `;


        await studentGraphQL(
            mutation,
            {
                studentId:
                    studentId,

                roomId:
                    roomId,

                category:
                    category,

                title:
                    title,

                description:
                    description,

                priority:
                    priority
            }
        );


        alert(
            "Complaint submitted successfully."
        );


        window.location.href =
            "my_complaints.html";


    } catch (error) {

        console.error(
            "Add Complaint Error:",
            error
        );


        alert(
            "Failed to submit complaint: " +
            error.message
        );
    }
}


// =====================================================
// PAGE INITIALIZATION
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "SmartStay Student JS Loaded"
        );


        const page =
            document.body.dataset.page;


        console.log(
            "Current Student Page:",
            page
        );


        // -------------------------------------------------
        // DASHBOARD
        // -------------------------------------------------

        if (
            page === "dashboard"
        ) {

            loadStudentDashboard();
        }


        // -------------------------------------------------
        // PROFILE
        // -------------------------------------------------

        if (
            page === "profile"
        ) {

            loadStudentProfile();
        }


        // -------------------------------------------------
        // MY COMPLAINTS
        // -------------------------------------------------

        if (
            page === "complaints"
        ) {

            loadMyComplaints();
        }


        // -------------------------------------------------
        // ADD COMPLAINT
        // -------------------------------------------------

        const form =
            document.getElementById(
                "complaintForm"
            );


        if (form) {

            form.addEventListener(
                "submit",
                addComplaint
            );
        }


        // -------------------------------------------------
        // LOGOUT
        // -------------------------------------------------

        document
            .querySelectorAll(
                ".logout-btn"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        logoutStudent
                    );

                }
            );

    }
);