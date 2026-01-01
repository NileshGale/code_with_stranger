let selectedLanguage = { name: '', id: 0 };

function selectLanguage(name, id) {
    selectedLanguage = { name, id };
    document.getElementById('selectedLanguageTitle').textContent = `Select Difficulty - ${name}`;
    document.getElementById('languageSection').style.display = 'none';
    document.getElementById('difficultySection').classList.add('active');
}

function backToLanguages() {
    document.getElementById('languageSection').style.display = 'block';
    document.getElementById('difficultySection').classList.remove('active');
}

function selectDifficulty(level) {
    window.location.href = `questions.php?lang=${selectedLanguage.id}&difficulty=${level}`;
}

function showHome() {
    document.getElementById('languageSection').style.display = 'block';
    document.getElementById('difficultySection').classList.remove('active');
}

function openFeedbackModal() {
    document.getElementById('feedbackModal').classList.add('active');
}

function closeFeedbackModal() {
    document.getElementById('feedbackModal').classList.remove('active');
}

document.getElementById('feedbackForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('action', 'submit_feedback');
    formData.append('name', document.getElementById('feedbackName').value);
    formData.append('email', document.getElementById('feedbackEmail').value);
    formData.append('message', document.getElementById('feedbackMessage').value);
    
    try {
        const response = await fetch('feedback_handler.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Thank you for your valuable feedback! 🎉');
            closeFeedbackModal();
            document.getElementById('feedbackForm').reset();
        } else {
            alert('Failed to submit feedback. Please try again.');
        }
    } catch (error) {
        alert('Network error. Please try again.');
    }
});

async function logout() {
    const formData = new FormData();
    formData.append('action', 'logout');
    
    try {
        const response = await fetch('auth_handler.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            window.location.href = data.redirect;
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('feedbackModal');
    if (event.target == modal) {
        closeFeedbackModal();
    }
}