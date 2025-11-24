// Handle form submission with redirect to success page
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form[action="/register"]');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault(); // Prevent default form submission
            
            // Get form data
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Convert dd/mm/yyyy to yyyy-mm-dd for backend
            if (data.dob) {
                const dobParts = data.dob.split('/');
                if (dobParts.length === 3) {
                    data.dob = `${dobParts[2]}-${dobParts[1]}-${dobParts[0]}`;
                }
            }
            
            // Submit form via fetch
            fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(data => {
                        throw new Error(data.error || 'Lỗi đăng ký');
                    });
                }
                return response.json();
            })
            .then(result => {
                console.log('Registration result:', result);
                
                if (result.success && result.id) {
                    // Redirect to success page
                    window.location.href = '/success.html';
                } else if (result.error) {
                    // Show error message
                    alert('Lỗi đăng ký: ' + result.error);
                }
            })
            .catch(error => {
                console.error('Registration error:', error);
                alert(error.message || 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại sau.');
            });
        });
    }
});
