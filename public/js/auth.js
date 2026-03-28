let googleClient;

// Initialize Google Sign-In
function initializeGoogleSignIn() {
    google.accounts.id.initialize({
        client_id: '833150744015-ct1m070cei42uomjo4e0r5r2f83feush.apps.googleusercontent.com',
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true
    });
}

// Handle Google Sign-In button click
function handleGoogleSignIn() {
    google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Handle errors or skipped moments
            console.error('Google Sign-In failed:', notification);
        }
    });
}

// Handle Google Sign-In response
async function handleGoogleCredentialResponse(response) {
    try {
        // Show loading
        const loadingAlert = Swal.fire({
            title: 'Signing in with Google...',
            html: 'Please wait',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const result = await fetch('/api/google-login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                credential: response.credential
            })
        });

        const data = await result.json();
        loadingAlert.close();

        if (data.success) {
            // Success animation
            await Swal.fire({
                icon: 'success',
                title: 'Welcome!',
                text: 'Google Sign-In successful',
                timer: 1500,
                showConfirmButton: false,
                background: '#fff',
                customClass: {
                    popup: 'animated fadeInDown'
                }
            });

            // Store user data
            localStorage.setItem('userEmail', data.userData.email);
            localStorage.setItem('username', data.userData.username);
            localStorage.setItem('profilePic', data.userData.profilePic);

            // Redirect
            if (window.vitNavigate) {
                window.vitNavigate(data.redirectPath);
            } else {
                document.body.style.opacity = '0';
                setTimeout(() => {
                    window.location.href = data.redirectPath;
                }, 500);
            }
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Login Failed',
                text: data.message || 'Failed to sign in with Google',
                confirmButtonColor: '#6200ea'
            });
        }
    } catch (error) {
        console.error('Google Sign-In error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An error occurred during Google Sign-In',
            confirmButtonColor: '#6200ea'
        });
    }
}

// Initialize Google Sign-In when the page loads
document.addEventListener('DOMContentLoaded', initializeGoogleSignIn);

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Show loading
    const loadingAlert = Swal.fire({
        title: 'Logging in...',
        html: 'Please wait',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (data.success) {
            loadingAlert.close();
            // Success animation
            await Swal.fire({
                icon: 'success',
                title: 'Welcome back!',
                text: 'Login successful',
                timer: 1500,
                showConfirmButton: false,
                background: '#fff',
                customClass: {
                    popup: 'animated fadeInDown'
                }
            });
            
            // Smooth transition
            if (window.vitNavigate) {
                window.vitNavigate(data.redirectPath);
            } else {
                document.body.style.opacity = '0';
                setTimeout(() => {
                    window.location.href = data.redirectPath;
                }, 500);
            }

            // Store all user data in localStorage
            localStorage.setItem('userEmail', data.userData.email);
            localStorage.setItem('username', data.userData.username);
            localStorage.setItem('profilePic', data.userData.profilePic);
        } else {
            loadingAlert.close();
            Swal.fire({
                icon: 'error',
                title: 'Login Failed',
                text: data.message,
                confirmButtonColor: '#6200ea'
            });
        }
    } catch (error) {
        console.error('Error:', error);
        loadingAlert.close();
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An error occurred during login',
            confirmButtonColor: '#6200ea'
        });
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const username = document.querySelector('input[name="username"]').value;
    const email = document.querySelector('input[name="email"]').value;
    const password = document.querySelector('input[name="password"]').value;
    const confirmPassword = document.querySelector('input[placeholder="Confirm Password"]').value;

    if (password !== confirmPassword) {
        Swal.fire({
            icon: 'warning',
            title: 'Password Mismatch',
            text: "Passwords don't match!",
            confirmButtonColor: '#6200ea'
        });
        return;
    }

    // Show loading
    const loadingAlert = Swal.fire({
        title: 'Creating Account',
        html: 'Please wait while we set up your account...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();
        loadingAlert.close();
        
        if (data.success) {
            // Store username in localStorage
            localStorage.setItem('username', username);
            localStorage.setItem('userEmail', email);
            
            // Celebration animation
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });

            await Swal.fire({
                icon: 'success',
                title: 'Welcome to VIConnect!',
                text: 'Registration successful! You can now login.',
                confirmButtonColor: '#6200ea',
                timer: 3000,
                timerProgressBar: true
            });
            
            event.target.reset();
            
            // Highlight login form
            document.querySelector('.sign-in').style.animation = 'highlight 1s ease';
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Registration Failed',
                text: data.message,
                confirmButtonColor: '#6200ea'
            });
        }
    } catch (error) {
        console.error('Error:', error);
        loadingAlert.close();
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An error occurred during registration',
            confirmButtonColor: '#6200ea'
        });
    }
}

// Add form animations
document.addEventListener('DOMContentLoaded', () => {
    // Add input focus effects
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.style.transform = 'scale(1.02)';
            input.style.transition = 'all 0.3s ease';
        });
        
        input.addEventListener('blur', () => {
            input.style.transform = 'scale(1)';
        });
    });

    // Add button hover effects
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('mouseover', () => {
            button.style.transform = 'translateY(-2px)';
        });
        
        button.addEventListener('mouseout', () => {
            button.style.transform = 'translateY(0)';
        });
    });
});

async function handleForgotPassword(event) {
    event.preventDefault();
    
    const { value: email } = await Swal.fire({
        title: 'Password Recovery',
        html: `
            <div class="forgot-password-form">
                <p>Enter your email address and we'll send you instructions to reset your password.</p>
                <input type="email" id="recovery-email" class="swal2-input" placeholder="Enter your email">
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Send Reset Link',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#6200ea',
        cancelButtonColor: '#888',
        showLoaderOnConfirm: true,
        preConfirm: () => {
            const email = document.getElementById('recovery-email').value;
            if (!email) {
                Swal.showValidationMessage('Please enter your email address');
                return false;
            }
            return email;
        }
    });

    if (email) {
        try {
            const response = await fetch('/api/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (data.success) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Reset Link Sent!',
                    html: `
                        <div class="reset-success">
                            <p>We've sent password reset instructions to:</p>
                            <strong>${email}</strong>
                            <p>Please check your email and follow the instructions.</p>
                        </div>
                    `,
                    confirmButtonColor: '#6200ea'
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: data.message,
                    confirmButtonColor: '#6200ea'
                });
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to process your request. Please try again.',
                confirmButtonColor: '#6200ea'
            });
        }
    }
}