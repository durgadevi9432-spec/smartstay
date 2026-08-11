// =====================================================
// SmartStay - Admin JavaScript
// Dashboard + Student Management
// =====================================================

// =====================================================
// HASURA
// =====================================================

const HASURA_URL =
    "https://smarthostel.hasura.app/v1/graphql";


// =====================================================
// GLOBAL
// =====================================================

let allStudents = [];


// =====================================================
// GRAPHQL HELPER
// =====================================================

async function sendGraphQL(query, variables = {}) {

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
            "GraphQL Response:",
            result
        );


        return result;


    } catch (error) {

        console.error(
            "GraphQL connection error:",
            error
        );

        throw error;

    }
}


// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "SmartStay Admin JS Loaded"
        );


        // =================================================
        // DATE
        // =================================================

        setCurrentDate();


        // =================================================
        // DASHBOARD
        // =================================================

        if (
            document.getElementById("totalStudents") ||
            document.getElementById("totalStaff") ||
            document.getElementById("totalRooms") ||
            document.getElementById("totalComplaints")
        ) {

            loadDashboardCounts();

        }


        // =================================================
        // STUDENTS
        // =================================================

        if (
            document.getElementById("studentTable")
        ) {

            loadStudents();

            setupSearch();

        }


        // =================================================
        // ADD STUDENT
        // =================================================

        if (
            document.getElementById("addStudentForm")
        ) {

            setupAddStudent();

        }


        // =================================================
        // EDIT STUDENT
        // =================================================

        if (
            document.getElementById("editStudentForm")
        ) {

            setupEditStudent();

        }


        // =================================================
        // VIEW STUDENT
        // =================================================

        if (
            document.getElementById("viewStudentId")
        ) {

            loadStudentView();

        }

    }
);


// =====================================================
// CURRENT DATE
// =====================================================

function setCurrentDate() {

    const dateElement =
        document.getElementById(
            "currentDate"
        );


    if (!dateElement) return;


    const today = new Date();


    dateElement.textContent =
        today.toLocaleDateString(
            "en-IN",
            {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        );

}


// =====================================================
// DASHBOARD COUNTS
// =====================================================

async function loadDashboardCounts() {

    console.log(
        "Loading SmartStay dashboard..."
    );


    /*
    =====================================================
    FETCH REAL TABLE DATA
    =====================================================

    We fetch rows directly instead of relying on
    aggregate permissions.

    Dashboard uses:

    users       -> Students + Staff
    rooms       -> Total Rooms
    complaints  -> Total + Status counts

    complaint_assignment is NOT used for dashboard
    complaint status counts.
    =====================================================
    */


    const query = `

        query {

            users {

                id
                role

            }


            rooms {

                id

            }


            complaints {

                id
                status

            }

        }

    `;


    try {

        const result =
            await sendGraphQL(query);


        // =================================================
        // GRAPHQL ERROR
        // =================================================

        if (
            result.errors &&
            result.errors.length > 0
        ) {

            console.error(
                "Dashboard GraphQL Error:",
                result.errors
            );


            showDashboardError(
                result.errors[0]?.message ||
                "GraphQL error"
            );


            return;

        }


        // =================================================
        // DATA
        // =================================================

        const users =
            result.data?.users || [];


        const rooms =
            result.data?.rooms || [];


        const complaints =
            result.data?.complaints || [];


        console.log(
            "Dashboard Users:",
            users
        );


        console.log(
            "Dashboard Rooms:",
            rooms
        );


        console.log(
            "Dashboard Complaints:",
            complaints
        );


        // =================================================
        // STUDENTS
        // =================================================

        const students =
            users.filter(
                function (user) {

                    const role =
                        normalizeText(
                            user.role
                        );


                    return (
                        role === "student"
                    );

                }
            );


        // =================================================
        // STAFF
        // =================================================

        const staff =
            users.filter(
                function (user) {

                    const role =
                        normalizeText(
                            user.role
                        );


                    return (
                        role === "staff" ||
                        role === "warden" ||
                        role === "maintenance"
                    );

                }
            );


        // =================================================
        // COMPLAINT STATUS
        // =================================================

        const pending =
            complaints.filter(
                function (complaint) {

                    const status =
                        normalizeText(
                            complaint.status
                        );


                    return (
                        status === "pending"
                    );

                }
            );


        const progress =
            complaints.filter(
                function (complaint) {

                    const status =
                        normalizeText(
                            complaint.status
                        );


                    return (
                        status === "in progress" ||
                        status === "in_progress" ||
                        status === "in-progress" ||
                        status === "processing"
                    );

                }
            );


        const resolved =
            complaints.filter(
                function (complaint) {

                    const status =
                        normalizeText(
                            complaint.status
                        );


                    return (
                        status === "resolved" ||
                        status === "complete" ||
                        status === "completed"
                    );

                }
            );


        // =================================================
        // MAIN STAT CARDS
        // =================================================

        setText(
            "totalStudents",
            students.length
        );


        setText(
            "totalStaff",
            staff.length
        );


        setText(
            "totalRooms",
            rooms.length
        );


        setText(
            "totalComplaints",
            complaints.length
        );


        // =================================================
        // COMPLAINT OVERVIEW
        // =================================================

        setText(
            "pendingComplaints",
            pending.length
        );


        setText(
            "progressComplaints",
            progress.length
        );


        setText(
            "resolvedComplaints",
            resolved.length
        );


        // =================================================
        // DEBUG
        // =================================================

        console.log(
            "===================================="
        );


        console.log(
            "SMARTSTAY DASHBOARD"
        );


        console.log(
            "Students:",
            students.length
        );


        console.log(
            "Staff:",
            staff.length
        );


        console.log(
            "Rooms:",
            rooms.length
        );


        console.log(
            "Total Complaints:",
            complaints.length
        );


        console.log(
            "Pending:",
            pending.length
        );


        console.log(
            "In Progress:",
            progress.length
        );


        console.log(
            "Resolved:",
            resolved.length
        );


        console.log(
            "===================================="
        );


    } catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );


        showDashboardError(
            "Unable to connect to Hasura"
        );

    }

}


// =====================================================
// NORMALIZE TEXT
// =====================================================

function normalizeText(value) {

    return String(
        value ?? ""
    )
    .trim()
    .toLowerCase()
    .replace(
        /\s+/g,
        " "
    );

}


// =====================================================
// DASHBOARD ERROR
// =====================================================

function showDashboardError(
    message = "Dashboard error"
) {

    console.error(
        message
    );


    setText(
        "totalStudents",
        "!"
    );


    setText(
        "totalStaff",
        "!"
    );


    setText(
        "totalRooms",
        "!"
    );


    setText(
        "totalComplaints",
        "!"
    );


    setText(
        "pendingComplaints",
        "!"
    );


    setText(
        "progressComplaints",
        "!"
    );


    setText(
        "resolvedComplaints",
        "!"
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
        document.getElementById(id);


    if (!element) {

        console.warn(
            "Element not found:",
            id
        );


        return;

    }


    element.textContent =
        value;

}


// =====================================================
// LOAD STUDENTS
// =====================================================

async function loadStudents() {

    const table =
        document.getElementById(
            "studentTable"
        );


    if (!table) return;


    table.innerHTML = `

        <tr>

            <td
                colspan="5"
                class="empty-message"
            >
                Loading students...
            </td>

        </tr>

    `;


    const query = `

        query {

            users {

                id
                full_name
                email
                phone
                role

            }

        }

    `;


    try {

        const result =
            await sendGraphQL(query);


        if (
            result.errors &&
            result.errors.length > 0
        ) {

            console.error(
                "Student GraphQL Error:",
                result.errors
            );


            table.innerHTML = `

                <tr>

                    <td
                        colspan="5"
                        class="empty-message"
                    >
                        ${escapeHTML(
                            result.errors[0]?.message ||
                            "GraphQL error"
                        )}
                    </td>

                </tr>

            `;


            return;

        }


        allStudents =
            (
                result.data?.users ||
                []
            )
            .filter(
                function (user) {

                    return (
                        normalizeText(
                            user.role
                        ) === "student"
                    );

                }
            );


        displayStudents(
            allStudents
        );


    } catch (error) {

        console.error(
            "Load students error:",
            error
        );


        table.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    class="empty-message"
                >
                    Unable to load students.
                </td>

            </tr>

        `;

    }

}


// =====================================================
// DISPLAY STUDENTS
// =====================================================

function displayStudents(
    students
) {

    const table =
        document.getElementById(
            "studentTable"
        );


    const total =
        document.getElementById(
            "studentTotal"
        );


    if (!table) return;


    if (total) {

        total.textContent =
            students.length;

    }


    if (
        !students ||
        students.length === 0
    ) {

        table.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    class="empty-message"
                >
                    No students found.
                </td>

            </tr>

        `;


        return;

    }


    table.innerHTML =
        students
        .map(
            function (
                student,
                index
            ) {

                return `

                    <tr>

                        <td>
                            ${index + 1}
                        </td>


                        <td>
                            ${escapeHTML(
                                student.full_name ||
                                "-"
                            )}
                        </td>


                        <td>
                            ${escapeHTML(
                                student.email ||
                                "-"
                            )}
                        </td>


                        <td>

                            <span
                                class="status-badge active"
                            >
                                ${escapeHTML(
                                    student.role ||
                                    "student"
                                )}
                            </span>

                        </td>


                        <td
                            class="action-buttons"
                        >

                            <button
                                type="button"
                                class="btn-secondary"
                                onclick="viewStudent('${student.id}')"
                            >
                                👁️ View
                            </button>


                            <button
                                type="button"
                                class="btn-edit"
                                onclick="editStudent('${student.id}')"
                            >
                                ✏️ Edit
                            </button>


                            <button
                                type="button"
                                class="btn-delete"
                                onclick="deleteStudent('${student.id}')"
                            >
                                🗑️ Delete
                            </button>

                        </td>

                    </tr>

                `;

            }
        )
        .join("");

}


// =====================================================
// SEARCH STUDENTS
// =====================================================

function setupSearch() {

    const input =
        document.getElementById(
            "studentSearch"
        );


    if (!input) return;


    input.addEventListener(
        "input",
        function () {

            const value =
                input.value
                .trim()
                .toLowerCase();


            const filtered =
                allStudents.filter(
                    function (student) {

                        const text = [

                            student.full_name,
                            student.email,
                            student.phone

                        ]
                        .join(" ")
                        .toLowerCase();


                        return text.includes(
                            value
                        );

                    }
                );


            displayStudents(
                filtered
            );

        }
    );

}


// =====================================================
// VIEW STUDENT
// =====================================================

function viewStudent(
    id
) {

    if (!id) return;


    window.location.href =
        `view_student.html?id=${encodeURIComponent(id)}`;

}


// =====================================================
// EDIT STUDENT
// =====================================================

function editStudent(
    id
) {

    if (!id) return;


    window.location.href =
        `edit_student.html?id=${encodeURIComponent(id)}`;

}


// =====================================================
// DELETE STUDENT
// =====================================================

async function deleteStudent(
    id
) {

    if (!id) {

        alert(
            "Student ID not found."
        );


        return;

    }


    const confirmed =
        confirm(
            "Are you sure you want to delete this student?"
        );


    if (!confirmed) return;


    const mutation = `

        mutation(
            $id: uuid!
        ) {

            delete_users_by_pk(
                id: $id
            ) {

                id

            }

        }

    `;


    try {

        const result =
            await sendGraphQL(
                mutation,
                {
                    id: id
                }
            );


        if (
            result.errors &&
            result.errors.length > 0
        ) {

            console.error(
                "Delete error:",
                result.errors
            );


            alert(
                result.errors[0]?.message ||
                "Delete failed."
            );


            return;

        }


        alert(
            "Student deleted successfully!"
        );


        loadStudents();


    } catch (error) {

        console.error(
            "Delete student error:",
            error
        );


        alert(
            "Unable to delete student."
        );

    }

}


// =====================================================
// ADD STUDENT
// =====================================================

function setupAddStudent() {

    const form =
        document.getElementById(
            "addStudentForm"
        );


    if (!form) return;


    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const get = function (id) {

                return document
                    .getElementById(id)
                    ?.value
                    .trim();

            };


            const full_name =
                get("fullName");


            const email =
                get("email");


            const password =
                document.getElementById(
                    "password"
                )?.value;


            const phone =
                get("phone");


            const dob =
                get("dob");


            const gender =
                get("gender");


            const address =
                get("address");


            const message =
                document.getElementById(
                    "formMessage"
                );


            if (
                !full_name ||
                !email ||
                !password ||
                !phone ||
                !dob ||
                !gender ||
                !address
            ) {

                showStudentMessage(
                    message,
                    "Please fill all required fields.",
                    "error"
                );


                return;

            }


            if (
                password.length < 6
            ) {

                showStudentMessage(
                    message,
                    "Password must contain at least 6 characters.",
                    "error"
                );


                return;

            }


            const mutation = `

                mutation(
                    $full_name: String!
                    $email: String!
                    $password: String!
                    $phone: String!
                    $dob: date!
                    $gender: String!
                    $address: String!
                ) {

                    insert_users_one(
                        object: {

                            full_name: $full_name
                            email: $email
                            password: $password
                            phone: $phone
                            dob: $dob
                            gender: $gender
                            address: $address
                            role: "student"

                        }
                    ) {

                        id
                        full_name

                    }

                }

            `;


            try {

                const result =
                    await sendGraphQL(
                        mutation,
                        {
                            full_name,
                            email,
                            password,
                            phone,
                            dob,
                            gender,
                            address
                        }
                    );


                if (
                    result.errors &&
                    result.errors.length > 0
                ) {

                    showStudentMessage(
                        message,
                        result.errors[0]?.message ||
                        "Unable to add student.",
                        "error"
                    );


                    return;

                }


                showStudentMessage(
                    message,
                    "Student added successfully!",
                    "success"
                );


                form.reset();


                setTimeout(
                    function () {

                        window.location.href =
                            "students.html";

                    },
                    800
                );


            } catch (error) {

                console.error(
                    "Add student error:",
                    error
                );


                showStudentMessage(
                    message,
                    "Unable to connect to Hasura.",
                    "error"
                );

            }

        }
    );

}


// =====================================================
// LOAD EDIT STUDENT
// =====================================================

async function loadStudentEdit() {

    const id =
        new URLSearchParams(
            window.location.search
        ).get("id");


    if (!id) {

        console.error(
            "Student ID missing."
        );


        return;

    }


    const query = `

        query(
            $id: uuid!
        ) {

            users_by_pk(
                id: $id
            ) {

                id
                full_name
                email
                phone
                dob
                gender
                address
                role

            }

        }

    `;


    try {

        const result =
            await sendGraphQL(
                query,
                {
                    id: id
                }
            );


        if (
            result.errors &&
            result.errors.length > 0
        ) {

            console.error(
                "Load edit error:",
                result.errors
            );


            return;

        }


        const student =
            result.data?.users_by_pk;


        if (!student) {

            console.error(
                "Student not found."
            );


            return;

        }


        setValue(
            "studentId",
            student.id
        );


        setValue(
            "editFullName",
            student.full_name
        );


        setValue(
            "editEmail",
            student.email
        );


        setValue(
            "editPhone",
            student.phone
        );


        setValue(
            "editDob",
            student.dob
        );


        setValue(
            "editGender",
            student.gender
        );


        setValue(
            "editAddress",
            student.address
        );


    } catch (error) {

        console.error(
            "Edit student loading error:",
            error
        );

    }

}


// =====================================================
// EDIT STUDENT
// =====================================================

function setupEditStudent() {

    const form =
        document.getElementById(
            "editStudentForm"
        );


    if (!form) return;


    // Load existing student
    loadStudentEdit();


    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const get = function (id) {

                return document
                    .getElementById(id)
                    ?.value
                    .trim();

            };


            const id =
                get("studentId");


            const full_name =
                get("editFullName");


            const email =
                get("editEmail");


            const password =
                document.getElementById(
                    "editPassword"
                )?.value
                ?.trim();


            const phone =
                get("editPhone");


            const dob =
                get("editDob");


            const gender =
                get("editGender");


            const address =
                get("editAddress");


            const message =
                document.getElementById(
                    "editStudentMessage"
                );


            // =================================================
            // VALIDATION
            // =================================================

            if (
                !id ||
                !full_name ||
                !email ||
                !phone ||
                !dob ||
                !gender ||
                !address
            ) {

                showStudentMessage(
                    message,
                    "Please fill all required fields.",
                    "error"
                );


                return;

            }


            let mutation;

            let variables;


            // =================================================
            // WITH PASSWORD
            // =================================================

            if (password) {

                mutation = `

                    mutation(
                        $id: uuid!
                        $full_name: String!
                        $email: String!
                        $password: String!
                        $phone: String!
                        $dob: date!
                        $gender: String!
                        $address: String!
                    ) {

                        update_users_by_pk(

                            pk_columns: {
                                id: $id
                            }

                            _set: {

                                full_name: $full_name
                                email: $email
                                password: $password
                                phone: $phone
                                dob: $dob
                                gender: $gender
                                address: $address

                            }

                        ) {

                            id
                            full_name
                            email

                        }

                    }

                `;


                variables = {

                    id,
                    full_name,
                    email,
                    password,
                    phone,
                    dob,
                    gender,
                    address

                };


            } else {

                // =================================================
                // WITHOUT PASSWORD
                // =================================================

                mutation = `

                    mutation(
                        $id: uuid!
                        $full_name: String!
                        $email: String!
                        $phone: String!
                        $dob: date!
                        $gender: String!
                        $address: String!
                    ) {

                        update_users_by_pk(

                            pk_columns: {
                                id: $id
                            }

                            _set: {

                                full_name: $full_name
                                email: $email
                                phone: $phone
                                dob: $dob
                                gender: $gender
                                address: $address

                            }

                        ) {

                            id
                            full_name
                            email

                        }

                    }

                `;


                variables = {

                    id,
                    full_name,
                    email,
                    phone,
                    dob,
                    gender,
                    address

                };

            }


            console.log(
                "Updating student:",
                variables
            );


            try {

                const result =
                    await sendGraphQL(
                        mutation,
                        variables
                    );


                if (
                    result.errors &&
                    result.errors.length > 0
                ) {

                    console.error(
                        "UPDATE ERROR:",
                        result.errors
                    );


                    showStudentMessage(
                        message,
                        result.errors[0]?.message ||
                        "Student update failed.",
                        "error"
                    );


                    return;

                }


                const updated =
                    result.data
                    ?.update_users_by_pk;


                if (!updated) {

                    showStudentMessage(
                        message,
                        "Student was not updated.",
                        "error"
                    );


                    return;

                }


                console.log(
                    "Student updated successfully:",
                    updated
                );


                showStudentMessage(
                    message,
                    "Student updated successfully!",
                    "success"
                );


                setTimeout(
                    function () {

                        window.location.href =
                            "students.html";

                    },
                    800
                );


            } catch (error) {

                console.error(
                    "Update student error:",
                    error
                );


                showStudentMessage(
                    message,
                    "Unable to update student.",
                    "error"
                );

            }

        }
    );

}


// =====================================================
// VIEW STUDENT
// =====================================================

async function loadStudentView() {

    const id =
        new URLSearchParams(
            window.location.search
        ).get("id");


    if (!id) return;


    const query = `

        query(
            $id: uuid!
        ) {

            users_by_pk(
                id: $id
            ) {

                id
                full_name
                email
                phone
                dob
                gender
                address
                role

            }

        }

    `;


    try {

        const result =
            await sendGraphQL(
                query,
                {
                    id: id
                }
            );


        if (
            result.errors &&
            result.errors.length > 0
        ) {

            console.error(
                "View student error:",
                result.errors
            );


            return;

        }


        const student =
            result.data?.users_by_pk;


        if (!student) return;


        setValue(
            "viewStudentId",
            student.id
        );


        setValue(
            "viewStudentName",
            student.full_name
        );


        setValue(
            "viewStudentEmail",
            student.email
        );


        setValue(
            "viewStudentPhone",
            student.phone
        );


        setValue(
            "viewStudentDob",
            student.dob
        );


        setValue(
            "viewStudentGender",
            student.gender
        );


        setValue(
            "viewStudentAddress",
            student.address
        );


        setValue(
            "viewStudentRole",
            student.role
        );


    } catch (error) {

        console.error(
            "View student error:",
            error
        );

    }

}


// =====================================================
// SET VALUE
// =====================================================

function setValue(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (!element) return;


    element.value =
        value ?? "";

}


// =====================================================
// STUDENT MESSAGE
// =====================================================

function showStudentMessage(
    element,
    text,
    type
) {

    if (!element) {

        alert(text);

        return;

    }


    element.textContent =
        text;


    element.className =
        `form-message ${type}`;

}


// =====================================================
// HTML ESCAPE
// =====================================================

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}


// =====================================================
// LOGOUT
// =====================================================

function logout() {

    sessionStorage.clear();


    localStorage.removeItem(
        "admin"
    );


    localStorage.removeItem(
        "user"
    );


    window.location.href =
        "../login.html";

}