// controllers/payment.js
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const Course = require("../models/Course");
const User = require("../models/User");
const CourseProgress = require("../models/CourseProgress");
const mailSender = require("../utils/mailSender");
const { courseEnrollmentEmail } = require("../Mail/Templates/CourseEnrollmentEmail");
const { paymentSuccessEmail } = require("../Mail/Templates/paymentSuccessEmail");

// ========== CREATE CHECKOUT SESSION ==========
exports.capturePayment = async (req, res) => {
  console.log("Stripe Key used:", process.env.STRIPE_SECRET_KEY);

  const { courses } = req.body;
  const userId = req.user.id;

  console.log("Courses to be purchased:", courses);

  if (!courses || courses.length === 0) {
    return res.status(400).json({ success: false, message: "Please Provide Course IDs" });
  }

  let line_items = [];
  let totalAmount = 0;

  for (const courseId of courses) {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    if (course.studentsEnrolled.includes(userId)) {
      return res.status(400).json({ success: false, message: `Already enrolled in ${course.courseName}` });
    }

    totalAmount += course.price;

    line_items.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: course.courseName,
        },
        unit_amount: course.price * 100,
      },
      quantity: 1,
    });
  }

try {
  console.log("🟡 Creating Stripe Checkout session...");

  // Debug inputs
  console.log("Locale:", 'en');
  console.log("User ID:", userId);
  console.log("Courses:", courses);
  console.log("Total Amount (₹):", totalAmount);
  console.log("Line Items:", JSON.stringify(line_items, null, 2));

  // Construct URLs
  const frontendBaseUrl = process.env.FRONTEND_URL?.startsWith('http')
    ? process.env.FRONTEND_URL
    : 'https://' + process.env.FRONTEND_URL;

 const success_url = `${frontendBaseUrl}/payment-success?userId=${userId}&courses=${courses.join(",")}&amount=${totalAmount * 100}`;

  const cancel_url = `${frontendBaseUrl}/payment-failed`;

  console.log("Success URL:", success_url);
  console.log("Cancel URL:", cancel_url);

  // Create session
  const session = await stripe.checkout.sessions.create({
    locale: 'en',
    payment_method_types: ["card"],
    line_items,
    mode: "payment",
    success_url,
    cancel_url,
  });

  console.log("✅ Stripe Checkout session created:", session.id);

  res.status(200).json({ success: true, sessionId: session.id });
} catch (error) {
  console.error("❌ Stripe session creation error:", error);
  res.status(500).json({ success: false, message: "Could not create checkout session" });
}

};

// ========== HANDLE PAYMENT SUCCESS ==========
exports.handleStripeSuccess = async (req, res) => {
  const { courses, amount } = req.body;
  const userId = req.user.id;

  try {
    await enrollStudents(courses, userId); // directly use array

    const student = await User.findById(userId);

    await mailSender(
      student.email,
      "Payment Received",
      paymentSuccessEmail(
        `${student.firstName} ${student.lastName}`,
        amount / 100,
        "N/A",
        "N/A"
      )
    );

    res.status(200).json({
      success: true,
      message: "Enrolled successfully and email sent",
    });
  } catch (error) {
    console.error("❌ Payment success error:", error);
    res.status(500).json({
      success: false,
      message: "Error enrolling student",
    });
  }
};


// ========== ENROLL STUDENT FUNCTION ==========
const enrollStudents = async (courses, userId) => {
  for (const courseId of courses) {
    const enrolledCourse = await Course.findOneAndUpdate(
      { _id: courseId },
      { $addToSet: { studentsEnrolled: userId } },
      { new: true }
    );

    const courseProgress = await CourseProgress.create({
      courseID: courseId,
      userId,
      completedVideos: [],
    });

    const enrolledStudent = await User.findByIdAndUpdate(
      userId,
      {
        $addToSet: {
          courses: courseId,
          courseProgress: courseProgress._id,
        },
      },
      { new: true }
    );

    console.log("Updated user after enrollment:", enrolledStudent);

    await mailSender(
      enrolledStudent.email,
      `Successfully Enrolled into ${enrolledCourse.courseName}`,
      courseEnrollmentEmail(
        enrolledCourse.courseName,
        `${enrolledStudent.firstName} ${enrolledStudent.lastName}`
      )
    );
  }
};
