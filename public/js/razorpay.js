/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async tourId => {
  try {
    // Check if Razorpay is loaded
    if (!window.Razorpay) {
      showAlert(
        'error',
        'Razorpay SDK is not loaded. Please refresh the page.'
      );
      return;
    }

    // 1) Get checkout session (Razorpay Order) from API
    const res = await axios({
      method: 'GET',
      url: `/api/v1/bookings/checkout-session/${tourId}`,
      withCredentials: true // Include cookies for authentication
    });
    // In your controller, we sent back { status: 'success', data: { order, tour, user, keyId } }
    const { order, tour, user, keyId } = res.data.data;

    if (!order || !tour || !user || !keyId) {
      showAlert('error', 'Missing order, tour, user, or key data');
      return;
    }

    // 2) Configure Razorpay Options
    const options = {
      key: keyId, // Use the key from the backend response
      amount: order.amount,
      currency: order.currency,
      name: 'Natours',
      description: `${tour.name} Tour`,
      image: `/img/tours/${tour.imageCover}`, // Path to your tour image
      order_id: order.id, // This is the ID you generated in Postman/Backend

      // 3) This handler runs after the payment is successful
      handler: function(response) {
        // Here you can send the payment details to your server to create a booking
        // For now, we mimic your Stripe logic by redirecting to the success URL
        showAlert('success', 'Payment successful! Booking your tour...');

        window.setTimeout(() => {
          location.assign(
            `/my-tours/?tour=${tourId}&user=${user.id}&price=${order.amount /
              100}&paymentId=${response.razorpay_payment_id}`
          );
        }, 1500);
      },
      prefill: {
        name: user.name,
        email: user.email
      },
      theme: {
        color: '#55c57a' // The Natours green color
      },
      modal: {
        ondismiss: function() {
          showAlert('error', 'Payment cancelled.');
        }
      }
    };

    // 4) Open the Razorpay Modal
    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (err) {
    const errorMessage =
      err.response.data.message || err.message || 'Something went wrong';
    showAlert('error', errorMessage);
  }
};
