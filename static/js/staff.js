// =====================================================
// SmartStay - Staff JavaScript
// Staff + Add + View + Assign
// =====================================================


// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "SmartStay Staff JS Loaded"
        );


        // STAFF LIST

        if (
            document.getElementById(
                "staffTable"
            )
        ) {

            loadStaff();

            setupStaffSearch();

        }


        // ADD STAFF

        if (
            document.getElementById(
                "addStaffForm"
            )
        ) {

            setupAddStaffForm();

        }


        // VIEW STAFF

        if (
            document.getElementById(
                "viewStaffId"
            )
        ) {

            loadStaffForView();

        }


        // ASSIGN STAFF

        if (
            document.getElementById(
                "assignStaffForm"
            )
        ) {

            setupAssignStaffForm();

        }

    }
);


// =====================================================
// STAFF DATA
// =====================================================

let allStaff = [];


// =====================================================
// LOAD STAFF
// =====================================================

async function loadStaff() {

    const table =
        document.getElementById(
            "staffTable"
        );


    if (!table) {

        return;

    }


    table.innerHTML = `

        <tr>

            <td colspan="7">
                Loading staff...
            </td>

        </tr>

    `;


    const query = `

        query GetStaff {

            users {

                id
                full_name
                email
                phone
                staff_type
                gender
                role

            }

        }

    `;


    try {

        const result =
            await sendGraphQL(query);


        if (result.errors) {

            table.innerHTML = `

                <tr>

                    <td colspan="7">
                        ${result.errors[0].message}
                    </td>

                </tr>

            `;

            return;

        }


        const users =
            result.data?.users || [];


        allStaff =
            users.filter(
                user =>
                    String(
                        user.role || ""
                    )
                    .trim()
                    .toLowerCase() ===
                    "staff"
            );


        displayStaff(
            allStaff
        );

    }

    catch (error) {

        console.error(
            "Staff loading error:",
            error
        );


        table.innerHTML = `

            <tr>

                <td colspan="7">
                    Unable to load staff.
                </td>

            </tr>

        `;

    }

}


// =====================================================
// DISPLAY STAFF
// =====================================================

function displayStaff(staff) {

    const table =
        document.getElementById(
            "staffTable"
        );


    const total =
        document.getElementById(
            "staffTotal"
        );


    if (!table) {

        return;

    }


    if (total) {

        total.textContent =
            staff.length;

    }


    table.innerHTML = "";


    if (staff.length === 0) {

        table.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="empty-message"
                >
                    No staff found.
                </td>

            </tr>

        `;

        return;

    }


    staff.forEach(
        function (person, index) {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${index + 1}
                </td>

                <td>
                    ${person.full_name || "-"}
                </td>

                <td>
                    ${person.email || "-"}
                </td>

                <td>
                    ${person.phone || "-"}
                </td>

                <td>
                    ${person.staff_type || "-"}
                </td>

                <td>
                    ${person.gender || "-"}
                </td>

                <td class="action-buttons">

                    <button
                        type="button"
                        class="btn-secondary"
                        onclick="viewStaff('${person.id}')"
                    >
                        👁️ View
                    </button>

                    <button
                        type="button"
                        class="btn-delete"
                        onclick="deleteStaff('${person.id}')"
                    >
                        🗑️ Delete
                    </button>

                </td>

            `;


            table.appendChild(row);

        }
    );

}


// =====================================================
// STAFF SEARCH
// =====================================================

function setupStaffSearch() {

    const searchInput =
        document.getElementById(
            "staffSearch"
        );


    if (!searchInput) {

        return;

    }


    searchInput.addEventListener(
        "input",
        function () {

            const search =
                this.value
                    .trim()
                    .toLowerCase();


            if (!search) {

                displayStaff(
                    allStaff
                );

                return;

            }


            const filtered =
                allStaff.filter(
                    person =>

                        String(
                            person.full_name || ""
                        )
                        .toLowerCase()
                        .includes(search)

                        ||

                        String(
                            person.email || ""
                        )
                        .toLowerCase()
                        .includes(search)

                        ||

                        String(
                            person.phone || ""
                        )
                        .toLowerCase()
                        .includes(search)

                        ||

                        String(
                            person.staff_type || ""
                        )
                        .toLowerCase()
                        .includes(search)
                );


            displayStaff(
                filtered
            );

        }
    );

}


// =====================================================
// VIEW STAFF
// =====================================================

function viewStaff(id) {

    window.location.href =
        "view_staff.html?id=" +
        encodeURIComponent(id);

}


// =====================================================
// DELETE STAFF
// =====================================================

async function deleteStaff(id) {

    if (!id) {

        alert(
            "Staff ID not found."
        );

        return;

    }


    if (
        !confirm(
            "Are you sure you want to delete this staff member?"
        )
    ) {

        return;

    }


    const mutation = `

        mutation DeleteStaff(
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


        if (result.errors) {

            alert(
                result.errors[0].message
            );

            return;

        }


        alert(
            "Staff deleted successfully!"
        );


        loadStaff();

    }

    catch (error) {

        console.error(
            "Delete staff failed:",
            error
        );


        alert(
            "Unable to delete staff."
        );

    }

}


// =====================================================
// ADD STAFF
// =====================================================

function setupAddStaffForm() {

    const form =
        document.getElementById(
            "addStaffForm"
        );


    if (!form) {

        return;

    }


    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const message =
                document.getElementById(
                    "staffFormMessage"
                );


            const fullName =
                document.getElementById(
                    "staffFullName"
                )?.value.trim();


            const email =
                document.getElementById(
                    "staffEmail"
                )?.value.trim();


            const password =
                document.getElementById(
                    "staffPassword"
                )?.value;


            const phone =
                document.getElementById(
                    "staffPhone"
                )?.value.trim();


            const staffType =
                document.getElementById(
                    "staffType"
                )?.value;


            const gender =
                document.getElementById(
                    "staffGender"
                )?.value;


            const address =
                document.getElementById(
                    "staffAddress"
                )?.value.trim();


            if (
                !fullName ||
                !email ||
                !password ||
                !phone ||
                !staffType ||
                !gender ||
                !address
            ) {

                showStaffMessage(
                    message,
                    "Please fill all required fields.",
                    "error"
                );

                return;

            }


            if (password.length < 6) {

                showStaffMessage(
                    message,
                    "Password must contain at least 6 characters.",
                    "error"
                );

                return;

            }


            const mutation = `

                mutation AddStaff(

                    $full_name: String!
                    $email: String!
                    $password: String!
                    $phone: String!
                    $gender: String!
                    $staff_type: String!
                    $address: String!
                    $role: String!

                ) {

                    insert_users_one(

                        object: {

                            full_name: $full_name
                            email: $email
                            password: $password
                            phone: $phone
                            gender: $gender
                            staff_type: $staff_type
                            address: $address
                            role: $role

                        }

                    ) {

                        id
                        full_name
                        email
                        phone
                        gender
                        staff_type
                        address
                        role

                    }

                }

            `;


            try {

                const result =
                    await sendGraphQL(
                        mutation,
                        {
                            full_name: fullName,
                            email: email,
                            password: password,
                            phone: phone,
                            gender: gender,
                            staff_type: staffType,
                            address: address,
                            role: "staff"
                        }
                    );


                if (result.errors) {

                    showStaffMessage(
                        message,
                        result.errors[0].message,
                        "error"
                    );

                    return;

                }


                showStaffMessage(
                    message,
                    "Staff added successfully!",
                    "success"
                );


                form.reset();


                setTimeout(
                    function () {

                        window.location.href =
                            "staff.html";

                    },
                    800
                );

            }

            catch (error) {

                console.error(error);

                showStaffMessage(
                    message,
                    "Unable to connect to Hasura.",
                    "error"
                );

            }

        }
    );

}


// =====================================================
// VIEW STAFF
// =====================================================

async function loadStaffForView() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const id =
        params.get("id");


    if (!id) {

        showStaffMessage(
            document.getElementById(
                "viewStaffMessage"
            ),
            "Staff ID not found.",
            "error"
        );

        return;

    }


    const query = `

        query GetStaff(
            $id: uuid!
        ) {

            users_by_pk(
                id: $id
            ) {

                id
                full_name
                email
                phone
                staff_type
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


        if (result.errors) {

            showStaffMessage(
                document.getElementById(
                    "viewStaffMessage"
                ),
                result.errors[0].message,
                "error"
            );

            return;

        }


        const staff =
            result.data?.users_by_pk;


        if (!staff) {

            showStaffMessage(
                document.getElementById(
                    "viewStaffMessage"
                ),
                "Staff member not found.",
                "error"
            );

            return;

        }


        setValue(
            "viewStaffId",
            staff.id
        );

        setValue(
            "viewStaffName",
            staff.full_name
        );

        setValue(
            "viewStaffEmail",
            staff.email
        );

        setValue(
            "viewStaffPhone",
            staff.phone
        );

        setValue(
            "viewStaffType",
            staff.staff_type
        );

        setValue(
            "viewStaffGender",
            staff.gender
        );

        setValue(
            "viewStaffRole",
            staff.role
        );

        setValue(
            "viewStaffAddress",
            staff.address
        );

    }

    catch (error) {

        console.error(
            "View staff failed:",
            error
        );

    }

}


// =====================================================
// ASSIGN STAFF
// =====================================================

function setupAssignStaffForm() {

    console.log(
        "Assign Staff page loaded"
    );

    // Assignment functionality
    // can be connected to complaint_assignment
    // when the assignment schema is ready.

}


// =====================================================
// HELPERS
// =====================================================

function setValue(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.value =
            value || "";

    }

}


function showStaffMessage(
    element,
    text,
    type
) {

    if (!element) {

        return;

    }


    element.textContent =
        text;


    if (type === "success") {

        element.className =
            "form-message success";

    }

    else if (type === "error") {

        element.className =
            "form-message error";

    }

    else {

        element.className =
            "form-message";

    }

}