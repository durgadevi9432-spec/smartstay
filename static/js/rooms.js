// =====================================================
// SmartStay - Complete Rooms JavaScript
// static/js/rooms.js
// =====================================================

const HASURA_URL =
    "https://smarthostel.hasura.app/v1/graphql";


// =====================================================
// GRAPHQL HELPER
// =====================================================

async function roomGraphQL(query, variables = {}) {

    try {

        const response = await fetch(HASURA_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                query,
                variables
            })

        });

        const result = await response.json();

        if (result.errors && result.errors.length) {

            console.error("GraphQL Error:", result.errors);

            throw new Error(
                result.errors.map(e => e.message).join(", ")
            );
        }

        return result.data;

    } catch (error) {

        console.error("GraphQL Request Error:", error);

        throw error;
    }
}


// =====================================================
// LOAD ALL ROOMS
// =====================================================

async function loadRooms() {

    const femaleTable =
        document.getElementById("femaleRoomTable");

    const maleTable =
        document.getElementById("maleRoomTable");

    if (!femaleTable && !maleTable) {
        return;
    }

    try {

        const query = `
            query GetRooms {

                rooms(
                    order_by: {
                        room_number: asc
                    }
                ) {

                    id
                    room_number
                    floor
                    room_type
                    capacity
                    status

                    student_rooms {
                        student_id
                    }
                }
            }
        `;

        const data = await roomGraphQL(query);

        const rooms = data.rooms || [];

        renderRooms(rooms);

    } catch (error) {

        console.error(error);

        const message = `
            <tr>
                <td colspan="9" class="empty-message">
                    Failed to load rooms
                </td>
            </tr>
        `;

        if (femaleTable) {
            femaleTable.innerHTML = message;
        }

        if (maleTable) {
            maleTable.innerHTML = message;
        }
    }
}


// =====================================================
// CALCULATE ROOM INFORMATION
// =====================================================

function getRoomInfo(room) {

    const assignedStudents =
        room.student_rooms || [];

    const occupied =
        assignedStudents.length;

    const capacity =
        Number(room.capacity) || 0;

    const available =
        Math.max(capacity - occupied, 0);

    let status = "Available";

    if (room.status === "Maintenance") {

        status = "Maintenance";

    } else if (occupied >= capacity && capacity > 0) {

        status = "Occupied";

    } else {

        status = "Available";
    }

    return {
        occupied,
        available,
        status
    };
}


// =====================================================
// RENDER ROOMS
// =====================================================

function renderRooms(rooms) {

    const femaleTable =
        document.getElementById("femaleRoomTable");

    const maleTable =
        document.getElementById("maleRoomTable");

    if (!femaleTable && !maleTable) {
        return;
    }

    const femaleRooms = [];

    const maleRooms = [];

    rooms.forEach(room => {

        const number =
            String(room.room_number || "").toUpperCase();

        if (number.startsWith("A")) {

            femaleRooms.push(room);

        } else if (number.startsWith("B")) {

            maleRooms.push(room);

        } else {

            // Default unknown rooms to male section
            maleRooms.push(room);
        }
    });


    // =================================================
    // FEMALE
    // =================================================

    if (femaleTable) {

        if (!femaleRooms.length) {

            femaleTable.innerHTML = `
                <tr>
                    <td colspan="9" class="empty-message">
                        No female rooms found
                    </td>
                </tr>
            `;

        } else {

            femaleTable.innerHTML =
                femaleRooms.map((room, index) =>
                    createRoomRow(room, index + 1)
                ).join("");
        }
    }


    // =================================================
    // MALE
    // =================================================

    if (maleTable) {

        if (!maleRooms.length) {

            maleTable.innerHTML = `
                <tr>
                    <td colspan="9" class="empty-message">
                        No male rooms found
                    </td>
                </tr>
            `;

        } else {

            maleTable.innerHTML =
                maleRooms.map((room, index) =>
                    createRoomRow(room, index + 1)
                ).join("");
        }
    }


    setupRoomSearch();
}


// =====================================================
// CREATE ROOM ROW
// =====================================================

function createRoomRow(room, index) {

    const info =
        getRoomInfo(room);

    let statusClass =
        "status-available";

    if (info.status === "Occupied") {

        statusClass =
            "status-occupied";

    } else if (info.status === "Maintenance") {

        statusClass =
            "status-maintenance";
    }

    return `
        <tr>

            <td>${index}</td>

            <td>
                <strong>
                    ${escapeHTML(room.room_number || "-")}
                </strong>
            </td>

            <td>
                ${escapeHTML(String(room.floor ?? "-"))}
            </td>

            <td>
                ${escapeHTML(room.room_type || "-")}
            </td>

            <td>
                ${room.capacity ?? "-"}
            </td>

            <td>
                ${info.occupied}
            </td>

            <td>
                ${info.available}
            </td>

            <td>
                <span class="status-badge ${statusClass}">
                    ${info.status}
                </span>
            </td>

            <td>

                <a
                    href="room_details.html?id=${encodeURIComponent(room.id)}"
                    class="btn btn-secondary"
                >
                    View
                </a>

            </td>

        </tr>
    `;
}


// =====================================================
// SEARCH ROOMS
// =====================================================

function setupRoomSearch() {

    const search =
        document.getElementById("roomSearch");

    if (!search) {
        return;
    }

    search.oninput = function () {

        const value =
            this.value.trim().toLowerCase();

        document
            .querySelectorAll(
                "#femaleRoomTable tr, #maleRoomTable tr"
            )
            .forEach(row => {

                if (
                    row.querySelector("td") &&
                    !row.querySelector(".empty-message")
                ) {

                    row.style.display =
                        row.innerText
                            .toLowerCase()
                            .includes(value)
                            ? ""
                            : "none";
                }
            });
    };
}


// =====================================================
// ADD ROOM
// =====================================================

async function addRoom(event) {

    if (event) {
        event.preventDefault();
    }

    const message =
        document.getElementById("roomFormMessage");

    const roomNumber =
        document.getElementById("roomNumber")?.value.trim();

    const roomType =
        document.getElementById("roomType")?.value;

    const capacity =
        Number(
            document.getElementById("roomCapacity")?.value
        );

    const floor =
        Number(
            document.getElementById("roomFloor")?.value
        );

    const status =
        document.getElementById("roomStatus")?.value ||
        "Available";


    if (
        !roomNumber ||
        !roomType ||
        !capacity ||
        floor < 0
    ) {

        showMessage(
            message,
            "Please fill all room details.",
            "error"
        );

        return;
    }


    try {

        const mutation = `
            mutation AddRoom(
                $room_number: String!,
                $room_type: String!,
                $capacity: Int!,
                $floor: Int!,
                $status: String!
            ) {

                insert_rooms_one(
                    object: {
                        room_number: $room_number
                        room_type: $room_type
                        capacity: $capacity
                        floor: $floor
                        status: $status
                    }
                ) {

                    id
                    room_number
                }
            }
        `;

        await roomGraphQL(
            mutation,
            {
                room_number: roomNumber,
                room_type: roomType,
                capacity: capacity,
                floor: floor,
                status: status
            }
        );


        showMessage(
            message,
            "Room added successfully.",
            "success"
        );


        setTimeout(() => {

            window.location.href =
                "rooms.html";

        }, 800);


    } catch (error) {

        showMessage(
            message,
            error.message,
            "error"
        );
    }
}


// =====================================================
// LOAD ROOM DETAILS
// =====================================================

async function loadRoomDetails() {

    const params =
        new URLSearchParams(window.location.search);

    const roomId =
        params.get("id");

    if (!roomId) {

        showRoomError(
            "Room ID is missing."
        );

        return;
    }


    try {

        const query = `
            query GetRoom($id: uuid!) {

                rooms_by_pk(id: $id) {

                    id
                    room_number
                    floor
                    room_type
                    capacity
                    status

                    student_rooms {

                        id
                        student_id
                        assigned_at
                    }
                }
            }
        `;

        const data =
            await roomGraphQL(
                query,
                {
                    id: roomId
                }
            );


        const room =
            data.rooms_by_pk;


        if (!room) {

            throw new Error(
                "Room not found."
            );
        }


        displayRoomDetails(room);

        await loadRoomStudents(
            room
        );


    } catch (error) {

        console.error(error);

        showRoomError(
            error.message
        );
    }
}


// =====================================================
// DISPLAY ROOM DETAILS
// =====================================================

function displayRoomDetails(room) {

    const info =
        getRoomInfo(room);


    setText(
        "roomPageTitle",
        `Room ${room.room_number}`
    );

    setText(
        "roomNumberTitle",
        room.room_number
    );

    setText(
        "detailRoomNumber",
        room.room_number
    );

    setText(
        "detailRoomType",
        room.room_type
    );

    setText(
        "detailCapacity",
        room.capacity
    );

    setText(
        "detailFloor",
        room.floor
    );

    setText(
        "detailStatus",
        info.status
    );

    setText(
        "detailRoomId",
        room.id
    );


    const badge =
        document.getElementById(
            "roomStatusBadge"
        );

    if (badge) {

        badge.textContent =
            info.status;

        badge.className =
            "status-badge " +
            (
                info.status === "Occupied"
                    ? "status-occupied"
                    : info.status === "Maintenance"
                        ? "status-maintenance"
                        : "status-available"
            );
    }


    hideElement("viewRoomLoading");

    showElement("roomDetailsContent");
}


// =====================================================
// LOAD STUDENTS IN ROOM
// =====================================================

async function loadRoomStudents(room) {

    const loading =
        document.getElementById(
            "assignedStudentsLoading"
        );

    const empty =
        document.getElementById(
            "assignedStudentsEmpty"
        );

    const table =
        document.getElementById(
            "assignedStudentsTable"
        );

    const body =
        document.getElementById(
            "assignedStudentsBody"
        );


    if (!body) {
        return;
    }


    try {

        const assignments =
            room.student_rooms || [];


        if (!assignments.length) {

            hideElement(loading);

            showElement(empty);

            hideElement(table);

            return;
        }


        const ids =
            assignments.map(
                item => item.student_id
            );


        const query = `
            query GetStudents(
                $ids: [uuid!]!
            ) {

                users(
                    where: {
                        id: {
                            _in: $ids
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


        const data =
            await roomGraphQL(
                query,
                {
                    ids
                }
            );


        const students =
            data.users || [];


        body.innerHTML =
            assignments.map(
                (assignment, index) => {

                    const student =
                        students.find(
                            s =>
                                s.id ===
                                assignment.student_id
                        );


                    return `
                        <tr>

                            <td>
                                ${index + 1}
                            </td>

                            <td>
                                ${escapeHTML(
                                    student?.full_name || "Unknown"
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    student?.email || "-"
                                )}
                            </td>

                            <td>
                                ${
                                    assignment.assigned_at
                                        ? new Date(
                                            assignment.assigned_at
                                        ).toLocaleString()
                                        : "-"
                                }
                            </td>

                        </tr>
                    `;
                }
            ).join("");


        hideElement(loading);

        hideElement(empty);

        showElement(table);


    } catch (error) {

        console.error(error);

        hideElement(loading);

        showElement(empty);

        empty.innerHTML = `
            <div class="empty-icon">⚠️</div>
            <h3>Unable to load students</h3>
            <p>${escapeHTML(error.message)}</p>
        `;
    }
}


// =====================================================
// LOAD STUDENTS FOR ASSIGNMENT
// =====================================================

async function loadStudentsForAssignment() {

    const select =
        document.getElementById("studentId");

    if (!select) {
        return;
    }


    try {

        const query = `
            query GetStudents {

                users(
                    where: {
                        role: {
                            _eq: "student"
                        }
                    }
                    order_by: {
                        full_name: asc
                    }
                ) {

                    id
                    full_name
                    email

                    student_rooms {

                        id
                        room_id
                    }
                }
            }
        `;


        const data =
            await roomGraphQL(query);


        const students =
            data.users || [];


        select.innerHTML =
            `<option value="">
                Select Student
            </option>`;


        students.forEach(student => {

            const option =
                document.createElement("option");

            option.value =
                student.id;

            const hasRoom =
                student.student_rooms &&
                student.student_rooms.length > 0;


            option.textContent =
                `${student.full_name || "Unnamed"} - ${student.email || ""}` +
                (hasRoom ? " (Current Room)" : "");


            select.appendChild(option);
        });


    } catch (error) {

        console.error(error);

        select.innerHTML =
            `<option value="">
                Failed to load students
            </option>`;
    }
}


// =====================================================
// LOAD AVAILABLE ROOMS
// =====================================================

async function loadAvailableRooms() {

    const select =
        document.getElementById("assignRoomId");

    if (!select) {
        return;
    }


    try {

        const query = `
            query GetRooms {

                rooms(
                    order_by: {
                        room_number: asc
                    }
                ) {

                    id
                    room_number
                    floor
                    room_type
                    capacity
                    status

                    student_rooms {
                        student_id
                    }
                }
            }
        `;


        const data =
            await roomGraphQL(query);


        const rooms =
            data.rooms || [];


        select.innerHTML =
            `<option value="">
                Select Room
            </option>`;


        rooms.forEach(room => {

            const info =
                getRoomInfo(room);


            if (
                info.status === "Maintenance" ||
                info.available <= 0
            ) {
                return;
            }


            const option =
                document.createElement("option");


            option.value =
                room.id;


            option.textContent =
                `${room.room_number} - Floor ${room.floor} - ` +
                `${room.room_type} - Capacity ${room.capacity} - ` +
                `${info.available} Available`;


            select.appendChild(option);
        });


    } catch (error) {

        console.error(error);

        select.innerHTML =
            `<option value="">
                Failed to load rooms
            </option>`;
    }
}


// =====================================================
// ASSIGN / REPLACE ROOM
// =====================================================

async function assignRoom(event) {

    if (event) {
        event.preventDefault();
    }


    const studentSelect =
        document.getElementById("studentId");

    const roomSelect =
        document.getElementById("assignRoomId");

    const message =
        document.getElementById(
            "assignRoomMessage"
        );


    const studentId =
        studentSelect?.value;

    const roomId =
        roomSelect?.value;


    if (!studentId || !roomId) {

        showMessage(
            message,
            "Please select a student and room.",
            "error"
        );

        return;
    }


    try {

        // ---------------------------------------------
        // CHECK CURRENT ASSIGNMENT
        // ---------------------------------------------

        const checkQuery = `
            query CheckAssignment(
                $student_id: uuid!
            ) {

                student_room(
                    where: {
                        student_id: {
                            _eq: $student_id
                        }
                    }
                    limit: 1
                ) {

                    id
                    room_id
                }
            }
        `;


        const checkData =
            await roomGraphQL(
                checkQuery,
                {
                    student_id: studentId
                }
            );


        const existing =
            checkData.student_room?.[0];


        // ---------------------------------------------
        // REPLACE EXISTING ASSIGNMENT
        // ---------------------------------------------

        if (existing) {

            const updateMutation = `
                mutation UpdateAssignment(
                    $id: uuid!,
                    $room_id: uuid!
                ) {

                    update_student_room_by_pk(
                        pk_columns: {
                            id: $id
                        }
                        _set: {
                            room_id: $room_id
                            assigned_at: "now()"
                        }
                    ) {

                        id
                        student_id
                        room_id
                    }
                }
            `;


            await roomGraphQL(
                updateMutation,
                {
                    id: existing.id,
                    room_id: roomId
                }
            );


            showMessage(
                message,
                "Room assignment replaced successfully.",
                "success"
            );


        } else {

            // -----------------------------------------
            // NEW ASSIGNMENT
            // -----------------------------------------

            const insertMutation = `
                mutation AssignRoom(
                    $student_id: uuid!,
                    $room_id: uuid!
                ) {

                    insert_student_room_one(
                        object: {
                            student_id: $student_id
                            room_id: $room_id
                        }
                    ) {

                        id
                        student_id
                        room_id
                    }
                }
            `;


            await roomGraphQL(
                insertMutation,
                {
                    student_id: studentId,
                    room_id: roomId
                }
            );


            showMessage(
                message,
                "Room assigned successfully.",
                "success"
            );
        }


        // ---------------------------------------------
        // REFRESH AFTER ASSIGNMENT
        // ---------------------------------------------

        setTimeout(() => {

            window.location.href =
                "rooms.html";

        }, 800);


    } catch (error) {

        console.error(error);

        showMessage(
            message,
            error.message,
            "error"
        );
    }
}


// =====================================================
// EDIT ROOM
// =====================================================

async function updateRoom(event) {

    if (event) {
        event.preventDefault();
    }


    const params =
        new URLSearchParams(
            window.location.search
        );


    const roomId =
        params.get("id");


    if (!roomId) {

        alert("Room ID missing.");

        return;
    }


    const message =
        document.getElementById(
            "editRoomMessage"
        );


    try {

        const roomNumber =
            document.getElementById(
                "roomNumber"
            )?.value.trim();


        const roomType =
            document.getElementById(
                "roomType"
            )?.value;


        const capacity =
            Number(
                document.getElementById(
                    "roomCapacity"
                )?.value
            );


        const floor =
            Number(
                document.getElementById(
                    "roomFloor"
                )?.value
            );


        const status =
            document.getElementById(
                "roomStatus"
            )?.value;


        const mutation = `
            mutation UpdateRoom(
                $id: uuid!,
                $room_number: String!,
                $room_type: String!,
                $capacity: Int!,
                $floor: Int!,
                $status: String!
            ) {

                update_rooms_by_pk(
                    pk_columns: {
                        id: $id
                    }

                    _set: {
                        room_number: $room_number
                        room_type: $room_type
                        capacity: $capacity
                        floor: $floor
                        status: $status
                    }
                ) {

                    id
                    room_number
                }
            }
        `;


        await roomGraphQL(
            mutation,
            {
                id: roomId,
                room_number: roomNumber,
                room_type: roomType,
                capacity: capacity,
                floor: floor,
                status: status
            }
        );


        showMessage(
            message,
            "Room updated successfully.",
            "success"
        );


        setTimeout(() => {

            window.location.href =
                `room_details.html?id=${roomId}`;

        }, 800);


    } catch (error) {

        showMessage(
            message,
            error.message,
            "error"
        );
    }
}


// =====================================================
// MESSAGE
// =====================================================

function showMessage(
    element,
    text,
    type = "success"
) {

    if (!element) {
        alert(text);
        return;
    }


    element.textContent =
        text;

    element.className =
        `message ${type}`;

    element.style.display =
        "block";
}


// =====================================================
// ROOM ERROR
// =====================================================

function showRoomError(text) {

    const error =
        document.getElementById(
            "viewRoomError"
        );

    if (error) {

        error.textContent =
            text;

        error.style.display =
            "block";
    }

    hideElement(
        document.getElementById(
            "viewRoomLoading"
        )
    );
}


// =====================================================
// DOM HELPERS
// =====================================================

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            value ?? "-";
    }
}


function showElement(element) {

    if (typeof element === "string") {

        element =
            document.getElementById(element);
    }

    if (element) {

        element.style.display =
            "";
    }
}


function hideElement(element) {

    if (typeof element === "string") {

        element =
            document.getElementById(element);
    }

    if (element) {

        element.style.display =
            "none";
    }
}


// =====================================================
// HTML ESCAPE
// =====================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =====================================================
// AUTO INITIALIZATION
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        // Rooms page
        if (
            document.getElementById(
                "femaleRoomTable"
            ) ||
            document.getElementById(
                "maleRoomTable"
            )
        ) {

            loadRooms();
        }


        // Add room
        const addForm =
            document.getElementById(
                "addRoomForm"
            );

        if (addForm) {

            addForm.addEventListener(
                "submit",
                addRoom
            );
        }


        // Edit room
        const editForm =
            document.getElementById(
                "editRoomForm"
            );

        if (editForm) {

            editForm.addEventListener(
                "submit",
                updateRoom
            );
        }


        // Assign room
        const assignForm =
            document.getElementById(
                "assignRoomForm"
            );

        if (assignForm) {

            loadStudentsForAssignment();

            loadAvailableRooms();

            assignForm.addEventListener(
                "submit",
                assignRoom
            );
        }


        // Room details
        if (
            document.getElementById(
                "roomDetailsContent"
            )
        ) {

            loadRoomDetails();
        }
    }
);