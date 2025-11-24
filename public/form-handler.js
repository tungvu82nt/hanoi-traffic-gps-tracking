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
            // Note: With type="date", format is already yyyy-mm-dd, so this block is safe to keep (won't run)
            if (data.dob && data.dob.includes('/')) {
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
            .then(async response => {
                // Check if response is JSON
                const contentType = response.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                    // If server returns HTML/Text (error page), read it to debug
                    const text = await response.text();
                    console.error("Server Error Response:", text);
                    // Extract title or body text if it's HTML
                    let errorMsg = "Server lỗi (không phải JSON).";
                    if (text.includes("<title>")) {
                    if (text.includes("<title>")) {
                        const match = text.match(/<title>(.*?)<\/title>/);
                        if (match && match[1]) {
                            errorMsg += ` Title: ${match[1]}`;
                        } else {
                            errorMsg += ` Nội dung: ${text.substring(0, 100)}...`;
                        }
                    }                    } else {
                        errorMsg += ` Nội dung: ${text.substring(0, 100)}...`;
                    }
                    throw new Error(errorMsg);
                }

                const result = await response.json();
                
                if (!response.ok) {
                    throw new Error(result.error || 'Lỗi đăng ký từ server');
                }
                
                return result;
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
