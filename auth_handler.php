<?php
session_start();

// Import PHPMailer classes
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// Load PHPMailer files
require 'PHPMailer/src/Exception.php';
require 'PHPMailer/src/PHPMailer.php';
require 'PHPMailer/src/SMTP.php';

// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'code_with_stranger');

// Create database connection
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

// Check connection
if ($conn->connect_error) {
    die(json_encode(['success' => false, 'message' => 'Database connection failed']));
}

// Set charset to handle special characters
$conn->set_charset("utf8mb4");

// ============ CHOOSE ONE METHOD BELOW ============

// METHOD 1: PHPMailer with Gmail (For Production - Requires App Password)
function sendOTP($email, $otp, $purpose = 'registration') {
    $mail = new PHPMailer(true);
    
    try {
        // Server settings
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'nileshgale520@gmail.com';        // TODO: Replace with your Gmail
        $mail->Password   = 'msvl ybch kxsq oomb';      // TODO: Replace with Gmail App Password
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;
        
        // Uncomment below for debugging (shows detailed errors)
        // $mail->SMTPDebug = 2;
        // $mail->Debugoutput = 'html';
        
        // Recipients
        $mail->setFrom('your-email@gmail.com', 'Code with Stranger');  // TODO: Replace with your Gmail
        $mail->addAddress($email);
        $mail->addReplyTo('support@codewithstranger.com', 'Support');
        
        // Content
        $mail->isHTML(true);
        $subject = $purpose === 'registration' ? 'Email Verification OTP' : 'Password Reset OTP';
        $mail->Subject = $subject;
        
        // HTML email body
        $mail->Body    = "
            <html>
            <body style='font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;'>
                <div style='max-width: 600px; margin: 0 auto; background-color: #1a1a2e; padding: 30px; border-radius: 10px; border: 2px solid #00d4ff;'>
                    <h2 style='color: #00d4ff; text-align: center;'>Code with Stranger</h2>
                    <p style='color: #fff; font-size: 16px;'>Your verification code is:</p>
                    <div style='background-color: #0f3460; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;'>
                        <h1 style='color: #00d4ff; letter-spacing: 8px; margin: 0; font-size: 36px;'>$otp</h1>
                    </div>
                    <p style='color: #ccc; font-size: 14px;'>This OTP is valid for <strong style='color: #00d4ff;'>10 minutes</strong>.</p>
                    <p style='color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #00d4ff; padding-top: 20px;'>
                        If you didn't request this code, please ignore this email.
                    </p>
                </div>
            </body>
            </html>
        ";
        
        // Plain text alternative
        $mail->AltBody = "Your OTP is: $otp\n\nThis OTP is valid for 10 minutes.\n\nIf you didn't request this, please ignore this email.";
        
        $mail->send();
        return true;
    } catch (Exception $e) {
        // Log error for debugging
        error_log("PHPMailer Error: {$mail->ErrorInfo}");
        return false;
    }
}

// METHOD 2: Development Mode - OTP shown in browser console (No email needed)
// Uncomment this function and comment out METHOD 1 above if you can't setup Gmail
/*
function sendOTP($email, $otp, $purpose = 'registration') {
    // For development: Store OTP in a log file
    $log = date('Y-m-d H:i:s') . " - Email: $email - OTP: $otp - Purpose: $purpose\n";
    file_put_contents('otp_log.txt', $log, FILE_APPEND);
    
    // Always return true for testing
    return true;
}
*/

// Function to generate 6-digit OTP
function generateOTP() {
    return sprintf("%06d", mt_rand(0, 999999));
}

// Handle AJAX requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    
    switch ($action) {
        
        // ==================== REGISTRATION: SEND OTP ====================
        case 'send_registration_otp':
            $mobile = $conn->real_escape_string(trim($_POST['mobile']));
            $email = $conn->real_escape_string(trim($_POST['email']));
            
            // Validate input
            if (empty($mobile) || empty($email)) {
                echo json_encode(['success' => false, 'message' => 'All fields are required']);
                exit;
            }
            
            // Validate email format
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                echo json_encode(['success' => false, 'message' => 'Invalid email format']);
                exit;
            }
            
            // Check if mobile or email already exists
            $check_query = "SELECT * FROM users WHERE mobile = '$mobile' OR email = '$email'";
            $result = $conn->query($check_query);
            
            if ($result->num_rows > 0) {
                echo json_encode(['success' => false, 'message' => 'Mobile number or email already registered']);
                exit;
            }
            
            // Generate OTP
            $otp = generateOTP();
            $otp_expiry = date('Y-m-d H:i:s', strtotime('+10 minutes'));
            
            // Store OTP in session
            $_SESSION['registration_otp'] = $otp;
            $_SESSION['registration_otp_expiry'] = $otp_expiry;
            $_SESSION['registration_email'] = $email;
            
            // Send OTP via email
            if (sendOTP($email, $otp, 'registration')) {
                echo json_encode([
                    'success' => true, 
                    'message' => 'OTP sent to your email',
                    'otp' => $otp  // TODO: Remove this in production! Only for testing
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to send OTP. Please check email configuration.']);
            }
            break;
            
        // ==================== REGISTRATION: VERIFY OTP & CREATE USER ====================
        case 'verify_registration':
            $mobile = $conn->real_escape_string(trim($_POST['mobile']));
            $email = $conn->real_escape_string(trim($_POST['email']));
            $password = $_POST['password'];
            $otp = $_POST['otp'];
            
            // Verify OTP
            if (!isset($_SESSION['registration_otp']) || 
                $_SESSION['registration_otp'] !== $otp ||
                $_SESSION['registration_email'] !== $email) {
                echo json_encode(['success' => false, 'message' => 'Invalid OTP']);
                exit;
            }
            
            // Check OTP expiry
            if (strtotime($_SESSION['registration_otp_expiry']) < time()) {
                echo json_encode(['success' => false, 'message' => 'OTP has expired']);
                exit;
            }
            
            // Hash password
            $hashed_password = password_hash($password, PASSWORD_DEFAULT);
            
            // Insert user into database
            $insert_query = "INSERT INTO users (mobile, email, password, created_at) 
                            VALUES ('$mobile', '$email', '$hashed_password', NOW())";
            
            if ($conn->query($insert_query)) {
                // Clear OTP session data
                unset($_SESSION['registration_otp']);
                unset($_SESSION['registration_otp_expiry']);
                unset($_SESSION['registration_email']);
                
                // Set user session
                $_SESSION['user_id'] = $conn->insert_id;
                $_SESSION['user_email'] = $email;
                $_SESSION['user_mobile'] = $mobile;
                
                echo json_encode([
                    'success' => true, 
                    'message' => 'Registration successful!',
                    'redirect' => 'code-with-stranger-home.html'
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Registration failed. Please try again.']);
            }
            break;
            
        // ==================== LOGIN ====================
        case 'login':
            $identifier = $conn->real_escape_string(trim($_POST['identifier']));
            $password = $_POST['password'];
            
            if (empty($identifier) || empty($password)) {
                echo json_encode(['success' => false, 'message' => 'All fields are required']);
                exit;
            }
            
            // Check if identifier is email or mobile
            $query = "SELECT * FROM users WHERE email = '$identifier' OR mobile = '$identifier'";
            $result = $conn->query($query);
            
            if ($result->num_rows === 0) {
                echo json_encode(['success' => false, 'message' => 'User not found']);
                exit;
            }
            
            $user = $result->fetch_assoc();
            
            // Verify password
            if (password_verify($password, $user['password'])) {
                // Set session
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['user_email'] = $user['email'];
                $_SESSION['user_mobile'] = $user['mobile'];
                
                echo json_encode([
                    'success' => true, 
                    'message' => 'Login successful!',
                    'redirect' => 'code-with-stranger-home.html'
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Incorrect password']);
            }
            break;
            
        // ==================== FORGOT PASSWORD: SEND OTP ====================
        case 'send_reset_otp':
            $identifier = $conn->real_escape_string(trim($_POST['identifier']));
            
            if (empty($identifier)) {
                echo json_encode(['success' => false, 'message' => 'Email or mobile is required']);
                exit;
            }
            
            // Check if user exists
            $query = "SELECT * FROM users WHERE email = '$identifier' OR mobile = '$identifier'";
            $result = $conn->query($query);
            
            if ($result->num_rows === 0) {
                echo json_encode(['success' => false, 'message' => 'User not found']);
                exit;
            }
            
            $user = $result->fetch_assoc();
            $otp = generateOTP();
            $otp_expiry = date('Y-m-d H:i:s', strtotime('+10 minutes'));
            
            // Store OTP in session
            $_SESSION['reset_otp'] = $otp;
            $_SESSION['reset_otp_expiry'] = $otp_expiry;
            $_SESSION['reset_user_id'] = $user['id'];
            $_SESSION['reset_identifier'] = $identifier;
            
            // Send OTP via email
            if (sendOTP($user['email'], $otp, 'reset')) {
                echo json_encode([
                    'success' => true, 
                    'message' => 'OTP sent to your registered email',
                    'otp' => $otp  // TODO: Remove this in production! Only for testing
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to send OTP. Please try again.']);
            }
            break;
            
        // ==================== FORGOT PASSWORD: VERIFY OTP ====================
        case 'verify_reset_otp':
            $identifier = $_POST['identifier'];
            $otp = $_POST['otp'];
            
            // Verify OTP
            if (!isset($_SESSION['reset_otp']) || 
                $_SESSION['reset_otp'] !== $otp ||
                $_SESSION['reset_identifier'] !== $identifier) {
                echo json_encode(['success' => false, 'message' => 'Invalid OTP']);
                exit;
            }
            
            // Check OTP expiry
            if (strtotime($_SESSION['reset_otp_expiry']) < time()) {
                echo json_encode(['success' => false, 'message' => 'OTP has expired']);
                exit;
            }
            
            echo json_encode(['success' => true, 'message' => 'OTP verified successfully']);
            break;
            
        // ==================== RESET PASSWORD ====================
        case 'reset_password':
            $identifier = $_POST['identifier'];
            $new_password = $_POST['new_password'];
            $otp = $_POST['otp'];
            
            // Verify OTP again
            if (!isset($_SESSION['reset_otp']) || 
                $_SESSION['reset_otp'] !== $otp ||
                $_SESSION['reset_identifier'] !== $identifier) {
                echo json_encode(['success' => false, 'message' => 'Invalid session']);
                exit;
            }
            
            $user_id = $_SESSION['reset_user_id'];
            $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
            
            // Update password
            $update_query = "UPDATE users SET password = '$hashed_password' WHERE id = $user_id";
            
            if ($conn->query($update_query)) {
                // Clear reset session data
                unset($_SESSION['reset_otp']);
                unset($_SESSION['reset_otp_expiry']);
                unset($_SESSION['reset_user_id']);
                unset($_SESSION['reset_identifier']);
                
                echo json_encode([
                    'success' => true, 
                    'message' => 'Password reset successful!',
                    'redirect' => 'account.html'
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to reset password']);
            }
            break;
            
        // ==================== LOGOUT ====================
        case 'logout':
            session_destroy();
            echo json_encode([
                'success' => true, 
                'message' => 'Logged out successfully',
                'redirect' => 'account.html'
            ]);
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
            break;
    }
}

$conn->close();
?>