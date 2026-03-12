// Teaching statistics data
export const teachingStats = {
  teachingExperience: {
    startYear: 2015,
    currentYear: new Date().getFullYear()
  },
  courses: [
    {
      id: 1,
      name: "Database Design and Analysis",
      semesters: ["Spring 2019", "Fall 2019"],
      studentsPerSemester: [28, 32],
      evaluationScores: [4.7, 4.8]
    },
    {
      id: 2,
      name: "Industrial Programming",
      semesters: ["Fall 2020"],
      studentsPerSemester: [45],
      evaluationScores: [4.6]
    },
    {
      id: 3,
      name: "Intro to Big Data",
      semesters: ["Spring 2022"],
      studentsPerSemester: [38],
      evaluationScores: [4.9]
    },
    {
      id: 4,
      name: "Linear Algebra Programming",
      semesters: ["Fall 2022", "Fall 2023", "Fall 2024"],
      studentsPerSemester: [42, 39, 41],
      evaluationScores: [4.5, 4.7, 4.8]
    },
    {
      id: 5,
      name: "Topics in Machine Learning",
      semesters: ["Fall 2023", "Spring 2025", "Spring 2026"],
      studentsPerSemester: [25, 30, 28],
      evaluationScores: [4.9, 4.8, 4.9]
    },
    {
      id: 6,
      name: "Web Programming",
      semesters: ["Spring 2023", "Spring 2024", "Spring 2025"],
      studentsPerSemester: [50, 48, 52],
      evaluationScores: [4.6, 4.7, 4.8]
    },
    {
      id: 7,
      name: "Intro to Deep Learning",
      semesters: ["Spring 2024"],
      studentsPerSemester: [35],
      evaluationScores: [4.8]
    },
    {
      id: 8,
      name: "Big Data Processing",
      semesters: ["Fall 2025"],
      studentsPerSemester: [40],
      evaluationScores: [4.7]
    },
    {
      id: 9,
      name: "Linear Algebra",
      semesters: ["Fall 2025"],
      studentsPerSemester: [45],
      evaluationScores: [4.6]
    }
  ]
};

// Calculate statistics
export const calculateStats = () => {
  const stats = teachingStats;
  
  // Calculate years of experience
  const yearsExperience = stats.teachingExperience.currentYear - stats.teachingExperience.startYear;
  
  // Calculate total number of unique courses
  const totalCourses = stats.courses.length;
  
  // Calculate total students across all courses and semesters
  const totalStudents = stats.courses.reduce((total, course) => {
    const courseTotal = course.studentsPerSemester.reduce((sum, students) => sum + students, 0);
    return total + courseTotal;
  }, 0);
  
  // Calculate average evaluation score across all courses and semesters
  let totalScores = 0;
  let totalEvaluations = 0;
  
  stats.courses.forEach(course => {
    course.evaluationScores.forEach(score => {
      totalScores += score;
      totalEvaluations += 1;
    });
  });
  
  const averageEvaluation = totalEvaluations > 0 ? (totalScores / totalEvaluations) : 0;
  
  return {
    yearsExperience,
    totalCourses,
    totalStudents,
    averageEvaluation: Math.round(averageEvaluation * 10) / 10 // Round to 1 decimal place
  };
};