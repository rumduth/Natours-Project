const stripe = Stripe(
  "pk_test_51QMqZ1DV7BKCr8428RDiloue1PEOL1QvVQpOrV22s1MdjYsMOiouSVvvCa5168l8sAhjIYZDUtuGyMUsxMwgz9db00t9l3Ln7Y"
);
async function handleBookingTour(tourID) {
  try {
    //   1. Get checkout session from API
    const res = await axios({
      method: "get",
      url: `http://localhost:3000/api/v1/bookings/checkout-session/${tourID}`,
    });
    await stripe.redirectToCheckout({
      sessionId: res.data.session.id,
    });
  } catch (err) {
    showAlert("error", "Please book tour at the later time.");
  }
}

const bookingBtn = document.querySelector("#book-tour");
if (bookingBtn) {
  bookingBtn.addEventListener("click", async (e) => {
    e.target.textContent = "Processing...";
    await handleBookingTour(
      document.getElementById("book-tour").dataset.tourId
    );
  });
}
