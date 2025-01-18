
$(document).ready(function() {
  // Load header and footer with cache-busting to prevent loading old cached versions
  $("#header").load("header.html?" + new Date().getTime());
  $("#footer").load("footer.html?" + new Date().getTime());
});

//img 
document.addEventListener('dragstart', function(e) {
 if (e.target.tagName === 'IMG') {
   e.preventDefault();
 }
});
document.addEventListener('contextmenu', function(e) {
 if (e.target.tagName === 'IMG') {
   e.preventDefault();
 }
});

document.getElementById("myForm").addEventListener("submit", function (event) {
  event.preventDefault(); // Prevent the form from submitting normally
  // Get form data
  var formData = new FormData(this);
  var name = formData.get("name");
  formData.append("subject", "New inquiry from " + name);
  // Send form data asynchronously using fetch
  fetch("https://api.web3forms.com/submit", {
    method: "POST",
    body: formData,
  })
    .then((response) => {
      if (response.ok) {
        // Form submission successful, show success message with SweetAlert
        Swal.fire({
          icon: "success",
          title: "Thank you for your submission!",
          text: "We have received your form and will get back to you as soon as possible.",
          timer: 9000, // Auto close timer in milliseconds
          showConfirmButton: true, // Hide the "OK" button
        });
        // Reset the form fields (optional)
        this.reset();
      } else {
        // Form submission failed, handle error
        console.error("Form submission failed:", response.statusText);
        alert("Form submission failed. Please try again later.");
      }
    })
    .catch((error) => {
      console.error("Error occurred during form submission:", error);
      alert(
        "An error occurred during form submission. Please try again later."
      );
    });
});
