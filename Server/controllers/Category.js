const { Mongoose } = require("mongoose");
const Category = require("../models/Category");
function getRandomInt(max) {
    return Math.floor(Math.random() * max)
  }

exports.createCategory = async (req, res) => {
	try {
		const { name, description } = req.body;
		if (!name) {
			return res
				.status(400)
				.json({ success: false, message: "All fields are required" });
		}
		const CategorysDetails = await Category.create({
			name: name,
			description: description,
		});
		console.log(CategorysDetails);
		return res.status(200).json({
			success: true,
			message: "Categorys Created Successfully",
		});
	} catch (error) {
		return res.status(500).json({
			success: true,
			message: error.message,
		});
	}
};

exports.showAllCategories = async (req, res) => {
	try {
        console.log("INSIDE SHOW ALL CATEGORIES");
		const allCategorys = await Category.find({});
		res.status(200).json({
			success: true,
			data: allCategorys,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

//categoryPageDetails 

exports.categoryPageDetails = async (req, res) => {
  try {
    const { categoryId } = req.body;
    
    if (!categoryId) {
      return res.status(400).json({ success: false, message: "Category ID is required" });
    }
  
    const selectedCategory = await Category.findById(categoryId)
      .populate({
        path: "courses",
        match: { status: "Published" },
        populate: "ratingAndReviews",
      })
      .exec();

      console.log("Category ID:", selectedCategory);
      console.log("Category ID courses:", selectedCategory.courses);

    if (!selectedCategory) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    if (!selectedCategory.courses || selectedCategory.courses.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No courses found for the selected category.",
      });
    }

    const categoriesExceptSelected = await Category.find({ _id: { $ne: categoryId } });
    let differentCategory = null;
    if (categoriesExceptSelected.length > 0) {
      const randomCategory = categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)];
      differentCategory = await Category.findById(randomCategory._id)
        .populate({
          path: "courses",
          match: { status: "Published" },
        })
        .exec();
    }

    const allCategories = await Category.find()
      .populate({
        path: "courses",
        match: { status: "Published" },
        populate: { path: "instructor" },
      })
      .exec();
    const allCourses = allCategories.flatMap((category) => category.courses || []);
    const mostSellingCourses = allCourses
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 10);

    function removeDuplicateCourses(courses) {
      const seen = new Set();
      return courses.filter(course => {
        if (seen.has(course._id.toString())) return false;
        seen.add(course._id.toString());
        return true;
      });
    }

    const uniqueSelectedCourses = removeDuplicateCourses(selectedCategory.courses || []);
    const uniqueDifferentCourses = removeDuplicateCourses(differentCategory?.courses || []);
    const uniqueMostSellingCourses = removeDuplicateCourses(mostSellingCourses || []);

    res.status(200).json({
      success: true,
      data: {
        selectedCategory: { ...selectedCategory._doc, courses: uniqueSelectedCourses },
        differentCategory: differentCategory ? { ...differentCategory._doc, courses: uniqueDifferentCourses } : null,
        mostSellingCourses: uniqueMostSellingCourses,
      },
    });
  } catch (error) {
    console.error("Error in categoryPageDetails:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}