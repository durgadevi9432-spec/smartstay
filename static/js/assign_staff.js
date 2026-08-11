// =====================================================
// SmartStay - Assign Staff
// static/js/assign_staff.js
// =====================================================

// =====================================================
// HASURA
// =====================================================

const HASURA_URL =
    "https://smarthostel.hasura.app/v1/graphql";


// =====================================================
// ELEMENTS
// =====================================================

const complaintSelect =
    document.getElementById("assignComplaint");

const staffSelect =
    document.getElementById("assignStaff");

const form =
    document.getElementById("assignStaffForm");

const messageBox =
    document.getElementById("assignStaffMessage");

const assignButton =
    document.getElementById("assignButton");


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


        if (!response.ok) {

            throw new Error(
                `HTTP Error: ${response.status}`
            );
        }


        const result =
            await response.json();


        console.log(
            "HASURA RESPONSE:",
            result
        );


        if (result.errors) {

            console.error(
                "HASURA GRAPHQL ERROR:",
                result.errors
            );


            throw new Error(
                result.errors[0].message
            );
        }


        return result.data;

    } catch (error) {

        console.error(
            "GRAPHQL REQUEST ERROR:",
            error
        );

        throw error;
    }
}


// =====================================================
// SHOW MESSAGE
// =====================================================

function showMessage(
    text,
    type = ""
) {

    if (!messageBox) {
        return;
    }


    messageBox.textContent =
        text;


    messageBox.className =
        "form-message";


    if (type) {

        messageBox.classList.add(
            type
        );
    }
}


// =====================================================
// LOAD COMPLAINTS
// =====================================================

async function loadComplaints() {

    if (!complaintSelect) {
        return;
    }


    complaintSelect.innerHTML = `
        <option value="">
            Loading complaints...
        </option>
    `;


    const query = `
        query GetComplaints {

            complaints(
                order_by: {
                    created_at: desc
                }
            ) {

                id
                category
                title
                status

            }

        }
    `;


    try {

        const data =
            await sendGraphQL(query);


        const complaints =
            data?.complaints || [];


        complaintSelect.innerHTML = `
            <option value="">
                Select complaint
            </option>
        `;


        if (complaints.length === 0) {

            complaintSelect.innerHTML = `
                <option value="">
                    No complaints available
                </option>
            `;

            return;
        }


        complaints.forEach(
            complaint => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    complaint.id;


                const category =
                    complaint.category ||
                    "Complaint";


                const title =
                    complaint.title ||
                    "Untitled";


                const status =
                    complaint.status ||
                    "Pending";


                option.textContent =
                    `${category} - ${title} - ${status}`;


                complaintSelect.appendChild(
                    option
                );

            }
        );


    } catch (error) {

        console.error(
            "LOAD COMPLAINTS ERROR:",
            error
        );


        complaintSelect.innerHTML = `
            <option value="">
                Error loading complaints
            </option>
        `;


        showMessage(
            "Unable to load complaints: " +
            error.message,
            "error"
        );
    }
}


// =====================================================
// LOAD STAFF
// =====================================================

async function loadStaff() {

    if (!staffSelect) {
        return;
    }


    staffSelect.innerHTML = `
        <option value="">
            Loading staff...
        </option>
    `;


    const query = `
        query GetStaff {

            users(
                where: {
                    role: {
                        _eq: "staff"
                    }
                }

                order_by: {
                    full_name: asc
                }
            ) {

                id
                full_name
                email

            }

        }
    `;


    try {

        const data =
            await sendGraphQL(query);


        const staff =
            data?.users || [];


        staffSelect.innerHTML = `
            <option value="">
                Select staff
            </option>
        `;


        if (staff.length === 0) {

            staffSelect.innerHTML = `
                <option value="">
                    No staff available
                </option>
            `;

            return;
        }


        staff.forEach(
            person => {

                const option =
                    document.createElement(
                        "option"
                    );


                // IMPORTANT
                // This is the STAFF UUID.
                // It will be inserted into staff_id.

                option.value =
                    person.id;


                option.textContent =
                    person.full_name ||
                    person.email ||
                    "Staff";


                staffSelect.appendChild(
                    option
                );

            }
        );


    } catch (error) {

        console.error(
            "LOAD STAFF ERROR:",
            error
        );


        staffSelect.innerHTML = `
            <option value="">
                Error loading staff
            </option>
        `;


        showMessage(
            "Unable to load staff: " +
            error.message,
            "error"
        );
    }
}


// =====================================================
// SELECT COMPLAINT FROM URL
// =====================================================

function selectComplaintFromURL() {

    if (!complaintSelect) {
        return;
    }


    const params =
        new URLSearchParams(
            window.location.search
        );


    const complaintId =
        params.get("complaint_id");


    console.log(
        "URL complaint_id:",
        complaintId
    );


    if (!complaintId) {
        return;
    }


    const option =
        Array.from(
            complaintSelect.options
        ).find(
            option =>
                option.value === complaintId
        );


    if (option) {

        complaintSelect.value =
            complaintId;


        console.log(
            "Complaint automatically selected:",
            complaintId
        );
    }
}


// =====================================================
// CHECK EXISTING ASSIGNMENT
// =====================================================

async function checkExistingAssignment(
    complaintId
) {

    const query = `
        query CheckAssignment(
            $complaint_id: uuid!
        ) {

            complaint_assignment(
                where: {
                    complaint_id: {
                        _eq: $complaint_id
                    }
                }

                limit: 1
            ) {

                id
                complaint_id
                staff_id

            }

        }
    `;


    try {

        const data =
            await sendGraphQL(
                query,
                {
                    complaint_id:
                        complaintId
                }
            );


        return (
            data?.complaint_assignment?.length > 0
        );


    } catch (error) {

        console.error(
            "CHECK ASSIGNMENT ERROR:",
            error
        );


        // Don't block assignment if
        // checking is not available.

        return false;
    }
}


// =====================================================
// ASSIGN STAFF
// =====================================================

async function assignStaff() {

    if (!complaintSelect ||
        !staffSelect ||
        !assignButton) {

        console.error(
            "Required form elements are missing."
        );

        return;
    }


    const complaintId =
        complaintSelect.value;


    const staffId =
        staffSelect.value;


    // -------------------------------------------------
    // VALIDATE COMPLAINT
    // -------------------------------------------------

    if (!complaintId) {

        showMessage(
            "Please select a complaint.",
            "error"
        );

        complaintSelect.focus();

        return;
    }


    // -------------------------------------------------
    // VALIDATE STAFF
    // -------------------------------------------------

    if (!staffId) {

        showMessage(
            "Please select a staff member.",
            "error"
        );

        staffSelect.focus();

        return;
    }


    // -------------------------------------------------
    // PREVENT DUPLICATE ASSIGNMENT
    // -------------------------------------------------

    const alreadyAssigned =
        await checkExistingAssignment(
            complaintId
        );


    if (alreadyAssigned) {

        showMessage(
            "This complaint is already assigned to a staff member.",
            "error"
        );

        return;
    }


    // -------------------------------------------------
    // MUTATION
    // -------------------------------------------------

    const mutation = `
        mutation AssignStaff(
            $complaint_id: uuid!
            $staff_id: uuid!
        ) {

            insert_complaint_assignment_one(
                object: {

                    complaint_id:
                        $complaint_id

                    staff_id:
                        $staff_id

                }
            ) {

                id
                complaint_id
                staff_id

            }

        }
    `;


    try {

        // -------------------------------------------------
        // DISABLE BUTTON
        // -------------------------------------------------

        assignButton.disabled =
            true;


        assignButton.textContent =
            "Assigning...";


        showMessage(
            "Assigning staff...",
            ""
        );


        // -------------------------------------------------
        // SEND MUTATION
        // -------------------------------------------------

        const data =
            await sendGraphQL(
                mutation,
                {
                    complaint_id:
                        complaintId,

                    staff_id:
                        staffId
                }
            );


        console.log(
            "STAFF ASSIGNMENT SUCCESS:",
            data
        );


        // -------------------------------------------------
        // SUCCESS
        // -------------------------------------------------

        showMessage(
            "Staff assigned successfully!",
            "success"
        );


        assignButton.textContent =
            "Assigned";


        // -------------------------------------------------
        // REDIRECT
        // -------------------------------------------------

        setTimeout(
            function() {

                window.location.href =
                    "complaints.html";

            },
            1000
        );


    } catch (error) {

        console.error(
            "ASSIGN STAFF ERROR:",
            error
        );


        showMessage(
            "Assignment failed: " +
            error.message,
            "error"
        );


        assignButton.disabled =
            false;


        assignButton.textContent =
            "Assign Staff";
    }
}


// =====================================================
// FORM SUBMIT
// =====================================================

if (form) {

    form.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();

            assignStaff();

        }
    );
}


// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        console.log(
            "======================================"
        );

        console.log(
            "SmartStay - Assign Staff"
        );

        console.log(
            "Loading complaints and staff..."
        );

        console.log(
            "======================================"
        );


        // Load both lists

        await Promise.all([
            loadComplaints(),
            loadStaff()
        ]);


        // Select complaint from URL

        selectComplaintFromURL();


        console.log(
            "Assign Staff page ready."
        );

    }
);