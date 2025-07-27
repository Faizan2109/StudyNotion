import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";

import IconBtn from "../../../common/IconBtn";
import { studentEndpoints } from "../../../../../src/services/apis";

// Stripe public key (test mode)
const stripePromise = loadStripe("pk_test_51RaCSs2Y3a12XFy2Wiz2Ip5nMUFJ8MSvKtHL8TX5fULNXNqfD9RwcNMl9QyPZi6ckWrlSmBoUfZqgIop40W9TJTQ00xDzcKCda");

// Removed locale option to avoid missing module error

export default function RenderTotalAmount() {
  const { total, cart } = useSelector((state) => state.cart);
  const { token } = useSelector((state) => state.auth);
  const { user } = useSelector((state) => state.profile);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleBuyCourse = async () => {
    const stripe = await stripePromise;
    const courses = cart.map((course) => course._id);

    try {
      const response = await fetch(studentEndpoints.COURSE_PAYMENT_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Pass token if auth is used
        },
        body: JSON.stringify({ courses }),
      });

      const data = await response.json();

      if (data.success) {
        await stripe.redirectToCheckout({ sessionId: data.sessionId });
      } else {
        alert("Error starting payment: " + data.message);
      }
    } catch (error) {
      console.error("Stripe payment error:", error);
      alert("Something went wrong while processing payment.");
    }
  };

  return (
    <div className="min-w-[280px] rounded-md border-[1px] border-richblack-700 bg-richblack-800 p-6">
      <p className="mb-1 text-sm font-medium text-richblack-300">Total:</p>
      <p className="mb-6 text-3xl font-medium text-yellow-100">₹ {total}</p>
      <IconBtn
        text="Buy Now"
        onclick={handleBuyCourse}
        customClasses="w-full justify-center"
      />
    </div>
  );
}
