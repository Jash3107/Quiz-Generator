import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, Brain, CheckCircle, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

export default function DynamicQuiz() {
  const [currentTab, setCurrentTab] = useState("featured");
  const navigate = useNavigate();

  const quizCategories = [
    { name: "Featured", id: "featured", icon: <Trophy className="mr-2 h-4 w-4" /> },
    { name: "Technology", id: "tech", icon: <Brain className="mr-2 h-4 w-4" /> },
    { name: "Science", id: "science", icon: <CheckCircle className="mr-2 h-4 w-4" /> }
  ];

  const featuredQuizzes = [
    { 
      title: "Modern Web Development", 
      description: "Test your knowledge of React, Next.js and modern frontend tools", 
      difficulty: "Intermediate",
      questions: 15,
      time: "10 min" 
    },
    { 
      title: "AI Fundamentals", 
      description: "Explore the core concepts of artificial intelligence and machine learning", 
      difficulty: "Advanced",
      questions: 20,
      time: "15 min" 
    },
    { 
      title: "Tailwind CSS Mastery", 
      description: "Challenge yourself with utility-first CSS frameworks", 
      difficulty: "Beginner",
      questions: 10,
      time: "8 min" 
    }
  ];

  const handleTryQuiz = () => {
    navigate("/");
  };

  return (
    <div className="bg-black min-h-screen text-purple-300">
      {/* Header */}
      <header className="bg-black border-b border-purple-900/20">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-purple-400">Dynamic Quiz</h1>
            <div className="ml-12 hidden md:flex space-x-6">
              <button className="text-purple-300 hover:text-purple-100">Features</button>
              <button className="text-purple-300 hover:text-purple-100">Pricing</button>
              <button className="text-purple-300 hover:text-purple-100">Docs</button>
              <button className="text-purple-300 hover:text-purple-100">About</button>
            </div>
          </div>
          <div className="flex space-x-4">
            <Link to='/'><button className="px-4 py-2 border border-purple-600 rounded-md text-purple-300 hover:bg-purple-900 hover:text-purple-100">Sign In</button></Link>
            <button className="px-4 py-2 bg-purple-600 rounded-md text-white hover:bg-purple-700">Get Started</button>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-900/30 border border-purple-700 text-sm">
                <span className="text-purple-400 font-medium">Interactive Assessments 2.0</span>
                <ArrowRight className="ml-2 h-3 w-3 text-purple-400" />
              </div>

              <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-purple-300">
                Quizzes for developers
              </h2>

              <p className="text-xl text-purple-400">
                The best way to test knowledge and improve skills.
                Create, share, and master technical concepts at scale.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleTryQuiz}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium"
                >
                  Try a Quiz
                </button>
                <button className="px-6 py-3 border border-purple-600 text-purple-300 hover:bg-purple-900 hover:text-purple-100 rounded-md font-medium">
                  View Documentation
                </button>
              </div>
            </div>

            <div className="flex-1 flex justify-center">
              <div className="w-full max-w-md aspect-square relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-transparent rounded-lg transform rotate-3"></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-800/20 to-transparent rounded-lg transform -rotate-3"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3/4 h-3/4 bg-purple-900/20 backdrop-blur-sm rounded-lg border border-purple-700/50 flex items-center justify-center">
                    <span className="text-purple-300 text-lg">Interactive Quiz Experience</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured quizzes */}
      <section className="py-16 px-4 bg-black/40">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-purple-300 mb-2">Browse Quizzes</h3>
            <p className="text-purple-400">Select from our curated collection of developer-focused assessments</p>
          </div>

          <div className="flex overflow-x-auto mb-8 pb-2 gap-2">
            {quizCategories.map(category => (
              <button
                key={category.id}
                className={`flex items-center px-4 py-2 rounded-full whitespace-nowrap ${
                  currentTab === category.id 
                    ? "bg-purple-700 text-white" 
                    : "bg-purple-900/20 text-purple-300 hover:bg-purple-900/40"
                }`}
                onClick={() => setCurrentTab(category.id)}
              >
                {category.icon}
                {category.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredQuizzes.map((quiz, index) => (
              <div key={index} className="bg-black border border-purple-800/50 hover:border-purple-500 transition-all rounded-lg overflow-hidden">
                <div className="p-5 border-b border-purple-800/30">
                  <div className="flex justify-between items-start">
                    <h4 className="text-lg font-medium text-purple-300">{quiz.title}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      quiz.difficulty === "Beginner" ? "bg-green-900/20 text-green-400" :
                      quiz.difficulty === "Intermediate" ? "bg-blue-900/20 text-blue-400" :
                      "bg-red-900/20 text-red-400"
                    }`}>
                      {quiz.difficulty}
                    </span>
                  </div>
                  <p className="text-purple-400 mt-2 text-sm">{quiz.description}</p>
                </div>
                <div className="px-5 py-4">
                  <div className="flex justify-between text-sm text-purple-400">
                    <span>{quiz.questions} questions</span>
                    <span>{quiz.time}</span>
                  </div>
                </div>
                <div className="px-5 pb-5 pt-2">
                  <button className="w-full py-2 bg-purple-800/50 hover:bg-purple-700 text-purple-200 rounded flex items-center justify-center">
                    Start Quiz <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Info alert */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="bg-purple-900/20 border border-purple-700 text-purple-300 rounded-lg p-4 flex">
            <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium mb-1">Attention developers!</h4>
              <p className="text-purple-300/90">
                Create your own quizzes and share them with the community. 
                Sign up today to access our quiz creation tools and analytics dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
