import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { apiConnector } from "../services/apiconnector"; // adjust path if needed
import { studentEndpoints } from "../services/apis"; // adjust path if needed

const { COURSE_SUCCESS_API } = studentEndpoints;

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const { token } = useSelector((state) => state.auth); // get token from redux

  useEffect(() => {
    const verifyPayment = async () => {
      const courses = searchParams.get("courses")?.split(",");
      const amount = searchParams.get("amount");

      try {
        const response = await apiConnector(
          "POST",
          COURSE_SUCCESS_API,
          {
            courses: courses,
            amount: amount,
          },
          {
            Authorization: `Bearer ${token}`,
          }
        );

        console.log("✅ Payment Verified:", response.data);
      } catch (error) {
        console.error("❌ Payment verification failed:", error);
      }
    };

    verifyPayment();
  }, []);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center text-white">
      <h1 className="text-3xl font-bold">🎉 Payment Successful</h1>
      <p className="mt-4 text-xl">You are now enrolled in your course!</p>
    </div>
  );
};

export default PaymentSuccess;
