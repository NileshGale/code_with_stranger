// Panel navigation
        const panels = {
            login: document.getElementById('loginPanel'),
            register: document.getElementById('registerPanel'),
            otp: document.getElementById('otpPanel'),
            forgot: document.getElementById('forgotPanel'),
            resetOtp: document.getElementById('resetOtpPanel'),
            newPassword: document.getElementById('newPasswordPanel')
        };

        let registrationData = {};
        let resetData = {};
        let currentOtp = '';

        // Function to handle input content state
        function updateInputState(input) {
            if (input.value.trim() !== '') {
                input.classList.add('has-content');
            } else {
                input.classList.remove('has-content');
            }
        }

        // Add event listeners to all inputs for content tracking
        document.querySelectorAll('.field-wrapper input').forEach(input => {
            // Check on page load
            updateInputState(input);
            
            // Check on input
            input.addEventListener('input', function() {
                updateInputState(this);
            });
            
            // Check on blur (when user leaves the field)
            input.addEventListener('blur', function() {
                updateInputState(this);
            });
        });

        function showPanel(panelName) {
            Object.values(panels).forEach(p => p.classList.remove('active'));
            panels[panelName].classList.add('active');
            
            // Update all inputs in the new panel
            setTimeout(() => {
                panels[panelName].querySelectorAll('.field-wrapper input').forEach(input => {
                    updateInputState(input);
                });
            }, 100);
        }

        document.getElementById('goToRegister').addEventListener('click', () => showPanel('register'));
        document.getElementById('goToLogin').addEventListener('click', () => showPanel('login'));
        document.getElementById('goToLoginFromSignup').addEventListener('click', () => showPanel('login'));
        document.getElementById('goToLoginFromForgot').addEventListener('click', () => showPanel('login'));
        document.getElementById('goToForgot').addEventListener('click', () => showPanel('forgot'));
        document.getElementById('backToRegister').addEventListener('click', () => showPanel('register'));
        document.getElementById('backToLogin').addEventListener('click', () => showPanel('login'));
        document.getElementById('backToForgot').addEventListener('click', () => showPanel('forgot'));

        function showAlert(elementId, message, type) {
            const alertDiv = document.getElementById(elementId);
            alertDiv.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
            setTimeout(() => alertDiv.innerHTML = '', 5000);
        }

        // OTP Input handling
        const otpInputs = document.querySelectorAll('.otp-input:not(.reset-otp)');
        const resetOtpInputs = document.querySelectorAll('.reset-otp');

        function setupOtpInputs(inputs) {
            inputs.forEach((input, index) => {
                input.addEventListener('input', (e) => {
                    if (e.target.value.length === 1 && index < inputs.length - 1) {
                        inputs[index + 1].focus();
                    }
                });

                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Backspace' && !e.target.value && index > 0) {
                        inputs[index - 1].focus();
                    }
                });
            });
        }

        setupOtpInputs(otpInputs);
        setupOtpInputs(resetOtpInputs);

        // Timer for resend OTP
        function startResendTimer(timerElement, btnElement, callback) {
            let timeLeft = 60;
            btnElement.classList.add('disabled');
            
            const interval = setInterval(() => {
                timeLeft--;
                timerElement.textContent = timeLeft;
                
                if (timeLeft <= 0) {
                    clearInterval(interval);
                    btnElement.classList.remove('disabled');
                    btnElement.innerHTML = 'Resend OTP';
                    btnElement.addEventListener('click', callback);
                }
            }, 1000);
        }

        // Register Form
        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const mobile = document.getElementById('registerMobile').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            
            const formData = new FormData();
            formData.append('action', 'send_registration_otp');
            formData.append('mobile', mobile);
            formData.append('email', email);
            
            try {
                const response = await fetch('auth_handler.php', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success) {
                    registrationData = { mobile, email, password };
                    currentOtp = data.otp;
                    showAlert('registerAlert', data.message, 'success');
                    setTimeout(() => {
                        showPanel('otp');
                        startResendTimer(
                            document.getElementById('timer'),
                            document.getElementById('resendBtn'),
                            () => document.getElementById('registerForm').dispatchEvent(new Event('submit'))
                        );
                    }, 1000);
                } else {
                    showAlert('registerAlert', data.message, 'error');
                }
            } catch (error) {
                showAlert('registerAlert', 'Network error. Please try again.', 'error');
            }
        });

        // Verify OTP and Register
        document.getElementById('verifyOtpBtn').addEventListener('click', async () => {
            const otp = Array.from(otpInputs).map(input => input.value).join('');
            
            if (otp.length !== 6) {
                showAlert('otpAlert', 'Please enter all 6 digits', 'error');
                return;
            }
            
            const formData = new FormData();
            formData.append('action', 'verify_registration');
            formData.append('mobile', registrationData.mobile);
            formData.append('email', registrationData.email);
            formData.append('password', registrationData.password);
            formData.append('otp', otp);
            
            try {
                const response = await fetch('auth_handler.php', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showAlert('otpAlert', data.message, 'success');
                    setTimeout(() => window.location.href = data.redirect, 1500);
                } else {
                    showAlert('otpAlert', data.message, 'error');
                }
            } catch (error) {
                showAlert('otpAlert', 'Network error. Please try again.', 'error');
            }
        });

        // Login Form
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const identifier = document.getElementById('loginIdentifier').value;
            const password = document.getElementById('loginPassword').value;
            
            const formData = new FormData();
            formData.append('action', 'login');
            formData.append('identifier', identifier);
            formData.append('password', password);
            
            try {
                const response = await fetch('auth_handler.php', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showAlert('loginAlert', data.message, 'success');
                    setTimeout(() => window.location.href = data.redirect, 1500);
                } else {
                    showAlert('loginAlert', data.message, 'error');
                }
            } catch (error) {
                showAlert('loginAlert', 'Network error. Please try again.', 'error');
            }
        });

        // Forgot Password
        document.getElementById('forgotForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const identifier = document.getElementById('forgotIdentifier').value;
            resetData.identifier = identifier;
            
            const formData = new FormData();
            formData.append('action', 'send_reset_otp');
            formData.append('identifier', identifier);
            
            try {
                const response = await fetch('auth_handler.php', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showAlert('forgotAlert', data.message, 'success');
                    setTimeout(() => {
                        showPanel('resetOtp');
                        startResendTimer(
                            document.getElementById('resetTimer'),
                            document.getElementById('resendResetBtn'),
                            () => document.getElementById('forgotForm').dispatchEvent(new Event('submit'))
                        );
                    }, 1000);
                } else {
                    showAlert('forgotAlert', data.message, 'error');
                }
            } catch (error) {
                showAlert('forgotAlert', 'Network error. Please try again.', 'error');
            }
        });

        // Verify Reset OTP
        document.getElementById('verifyResetOtpBtn').addEventListener('click', async () => {
            const otp = Array.from(resetOtpInputs).map(input => input.value).join('');
            
            if (otp.length !== 6) {
                showAlert('resetOtpAlert', 'Please enter all 6 digits', 'error');
                return;
            }
            
            resetData.otp = otp;
            
            const formData = new FormData();
            formData.append('action', 'verify_reset_otp');
            formData.append('identifier', resetData.identifier);
            formData.append('otp', otp);
            
            try {
                const response = await fetch('auth_handler.php', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showAlert('resetOtpAlert', data.message, 'success');
                    setTimeout(() => showPanel('newPassword'), 1000);
                } else {
                    showAlert('resetOtpAlert', data.message, 'error');
                }
            } catch (error) {
                showAlert('resetOtpAlert', 'Network error. Please try again.', 'error');
            }
        });

        // Reset Password
        document.getElementById('newPasswordForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (newPassword !== confirmPassword) {
                showAlert('newPasswordAlert', 'Passwords do not match', 'error');
                return;
            }
            
            const formData = new FormData();
            formData.append('action', 'reset_password');
            formData.append('identifier', resetData.identifier);
            formData.append('new_password', newPassword);
            formData.append('otp', resetData.otp);
            
            try {
                const response = await fetch('auth_handler.php', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showAlert('newPasswordAlert', data.message, 'success');
                    setTimeout(() => window.location.href = data.redirect, 1500);
                } else {
                    showAlert('newPasswordAlert', data.message, 'error');
                }
            } catch (error) {
                showAlert('newPasswordAlert', 'Network error. Please try again.', 'error');
            }
        });