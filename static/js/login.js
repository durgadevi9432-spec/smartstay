// =====================================================
// SmartStay - Login JavaScript
// Admin + Staff + Student
// =====================================================

const HASURA_URL =
    "https://smarthostel.hasura.app/v1/graphql";


// =====================================================
// GRAPHQL HELPER
// =====================================================

async function sendLoginGraphQL(query, variables = {}) {

    try {

        const response = await fetch(HASURA_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                query: query,
                variables: variables
            })

        });


        const result =
            await response.json();


        console.log(
            "SmartStay Login GraphQL:",
            result
        );


        return result;


    } catch (error) {

        console.error(
            "GraphQL Request Failed:",
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

        const form =
            document.getElementById(
                "loginForm"
            );

        const password =
            document.getElementById(
                "password"
            );

        const toggle =
            document.getElementById(
                "togglePassword"
            );


        // =================================================
        // PASSWORD SHOW / HIDE
        // =================================================

        if (toggle && password) {

            toggle.addEventListener(
                "click",
                function () {

                    if (
                        password.type ===
                        "password"
                    ) {

                        password.type =
                            "text";

                        toggle.textContent =
                            "🙈";

                    } else {

                        password.type =
                            "password";

                        toggle.textContent =
                            "👁";

                    }

                }
            );

        }


        // =================================================
        // LOGIN FORM
        // =================================================

        if (form) {

            form.addEventListener(
                "submit",
                loginUser
            );

        }


        // =================================================
        // REMEMBER EMAIL
        // =================================================

        const savedEmail =
            localStorage.getItem(
                "smartstay_remember_email"
            );


        if (savedEmail) {

            const emailInput =
                document.getElementById(
                    "email"
                );

            const remember =
                document.getElementById(
                    "remember"
                );


            if (emailInput) {

                emailInput.value =
                    savedEmail;

            }


            if (remember) {

                remember.checked =
                    true;

            }

        }

    }
);


// =====================================================
// LOGIN USER
// =====================================================

async function loginUser(event) {

    event.preventDefault();


    // =================================================
    // GET VALUES
    // =================================================

    const role =
        document
            .getElementById("role")
            ?.value;


    const email =
        document
            .getElementById("email")
            ?.value
            .trim()
            .toLowerCase();


    const password =
        document
            .getElementById("password")
            ?.value;


    const loginButton =
        document.getElementById(
            "loginButton"
        );


    const buttonText =
        document.getElementById(
            "buttonText"
        );


    // =================================================
    // VALIDATION
    // =================================================

    if (
        !role ||
        !email ||
        !password
    ) {

        showLoginMessage(
            "Please enter role, email and password.",
            "error"
        );

        return;

    }


    // =================================================
    // LOADING
    // =================================================

    if (loginButton) {

        loginButton.disabled =
            true;

    }


    if (buttonText) {

        buttonText.textContent =
            "Signing in...";

    }


    // =================================================
    // LOGIN QUERY
    // =================================================

    const query = `

        query Login(
            $email: String!
            $password: String!
            $role: String!
        ) {

            users(
                where: {

                    email: {
                        _eq: $email
                    }

                    password: {
                        _eq: $password
                    }

                    role: {
                        _eq: $role
                    }

                }

                limit: 1
            ) {

                id
                full_name
                email
                role
                phone

                student_id
                course
                year

                employee_id
                staff_type

            }

        }

    `;


    try {

        const result =
            await sendLoginGraphQL(
                query,
                {
                    email: email,
                    password: password,
                    role: role
                }
            );


        // =================================================
        // GRAPHQL ERROR
        // =================================================

        if (result.errors) {

            console.error(
                "GraphQL Login Error:",
                result.errors
            );


            showLoginMessage(
                result.errors[0].message,
                "error"
            );


            resetLoginButton();

            return;

        }


        // =================================================
        // GET USER
        // =================================================

        const users =
            result.data?.users || [];


        if (users.length === 0) {

            showLoginMessage(
                "Invalid email, password or role.",
                "error"
            );


            resetLoginButton();

            return;

        }


        const user =
            users[0];


        console.log(
            "SmartStay Logged User:",
            user
        );


        // =================================================
        // CLEAR OLD LOGIN DATA
        // =================================================

        sessionStorage.clear();


        // =================================================
        // IMPORTANT
        // SAVE COMPLETE USER OBJECT
        // =================================================

        localStorage.setItem(
            "user",
            JSON.stringify({

                id:
                    user.id,

                full_name:
                    user.full_name || "",

                email:
                    user.email || "",

                phone:
                    user.phone || "",

                role:
                    user.role || "",

                student_id:
                    user.student_id || "",

                course:
                    user.course || "",

                year:
                    user.year || "",

                employee_id:
                    user.employee_id || "",

                staff_type:
                    user.staff_type || ""

            })
        );


        // =================================================
        // COMMON SESSION DATA
        // =================================================

        sessionStorage.setItem(
            "smartstay_user_id",
            user.id
        );


        sessionStorage.setItem(
            "smartstay_user_name",
            user.full_name || ""
        );


        sessionStorage.setItem(
            "smartstay_user_email",
            user.email || ""
        );


        sessionStorage.setItem(
            "smartstay_user_role",
            user.role || ""
        );


        // =================================================
        // STAFF
        // =================================================

        if (
            user.role ===
            "staff"
        ) {

            sessionStorage.setItem(
                "staff_id",
                user.id
            );


            sessionStorage.setItem(
                "staff_name",
                user.full_name || ""
            );


            sessionStorage.setItem(
                "staff_email",
                user.email || ""
            );


            sessionStorage.setItem(
                "staff_employee_id",
                user.employee_id || ""
            );


            sessionStorage.setItem(
                "staff_type",
                user.staff_type || ""
            );

        }


        // =================================================
        // STUDENT
        // =================================================

        if (
            user.role ===
            "student"
        ) {

            sessionStorage.setItem(
                "student_id",
                user.id
            );


            sessionStorage.setItem(
                "student_name",
                user.full_name || ""
            );


            sessionStorage.setItem(
                "student_email",
                user.email || ""
            );


            sessionStorage.setItem(
                "student_number",
                user.student_id || ""
            );


            sessionStorage.setItem(
                "student_course",
                user.course || ""
            );


            sessionStorage.setItem(
                "student_year",
                user.year || ""
            );

        }


        // =================================================
        // ADMIN
        // =================================================

        if (
            user.role ===
            "admin"
        ) {

            sessionStorage.setItem(
                "admin_id",
                user.id
            );


            sessionStorage.setItem(
                "admin_name",
                user.full_name || ""
            );


            sessionStorage.setItem(
                "admin_email",
                user.email || ""
            );

        }


        // =================================================
        // REMEMBER EMAIL
        // =================================================

        const remember =
            document
                .getElementById(
                    "remember"
                )
                ?.checked;


        if (remember) {

            localStorage.setItem(
                "smartstay_remember_email",
                email
            );

        } else {

            localStorage.removeItem(
                "smartstay_remember_email"
            );

        }


        // =================================================
        // VERIFY SAVED USER
        // =================================================

        console.log(
            "Saved SmartStay User:",
            JSON.parse(
                localStorage.getItem(
                    "user"
                )
            )
        );


        // =================================================
        // SUCCESS
        // =================================================

        showLoginMessage(
            "Login successful! Redirecting...",
            "success"
        );


        // =================================================
        // REDIRECT
        // =================================================

        setTimeout(
            function () {

                if (
                    user.role ===
                    "admin"
                ) {

                    window.location.href =
                        "../admin/dashboard.html";

                    return;

                }


                if (
                    user.role ===
                    "staff"
                ) {

                    window.location.href =
                        "../staff/dashboard.html";

                    return;

                }


                if (
                    user.role ===
                    "student"
                ) {

                    window.location.href =
                        "../student/dashboard.html";

                    return;

                }


                showLoginMessage(
                    "Unknown user role.",
                    "error"
                );


                resetLoginButton();

            },
            500
        );


    } catch (error) {

        console.error(
            "SmartStay Login Failed:",
            error
        );


        showLoginMessage(
            "Unable to connect to SmartStay.",
            "error"
        );


        resetLoginButton();

    }

}


// =====================================================
// RESET BUTTON
// =====================================================

function resetLoginButton() {

    const button =
        document.getElementById(
            "loginButton"
        );


    const text =
        document.getElementById(
            "buttonText"
        );


    if (button) {

        button.disabled =
            false;

    }


    if (text) {

        text.textContent =
            "Sign in";

    }

}


// =====================================================
// LOGIN MESSAGE
// =====================================================

function showLoginMessage(
    text,
    type
) {

    const message =
        document.getElementById(
            "message"
        );


    if (!message) {
        return;
    }


    message.textContent =
        text;


    message.className =
        "message";


    if (
        type ===
        "success"
    ) {

        message.classList.add(
            "success"
        );

    }


    if (
        type ===
        "error"
    ) {

        message.classList.add(
            "error"
        );

    }

}