import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Sparkles, Brain, BookOpen, Send, Clock, CheckCircle, AlertCircle,
  ChevronRight, ArrowRight, Award, BarChart, Home, Book, PieChart as PieChartIcon, ChevronDown,
  Target, BarChart2, Award as AwardIcon, Clock as ClockIcon,
  ThumbsUp, User, Settings, LogOut, ChevronLeft, Activity,
  TrendingUp, CheckSquare, X, HelpCircle, RefreshCw, Calendar,
  Code as CodeIcon,
  FlaskConical as FlaskIcon,
  Globe as GlobeIcon,
  Palette as PaletteIcon,
  Calculator as CalculatorIcon,
  ArrowUp, ArrowDown, // Keep for Ordering buttons
  Shuffle // Keep for Matching visual cue (optional)
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// REMOVED: react-beautiful-dnd imports

// --- Mock Icon Components (Assuming lucide-react is used) ---
const Code = (props) => <CodeIcon {...props} />;
const Flask = (props) => <FlaskIcon {...props} />;
const Globe = (props) => <GlobeIcon {...props} />;
const Palette = (props) => <PaletteIcon {...props} />;
const Calculator = (props) => <CalculatorIcon {...props} />;

// --- Mock Chart Components (Keep as they are) ---
const CustomPieChart = ({ data, size = 150 }) => {
  const total = Object.values(data).reduce((sum, val) => sum + val, 0);
  let startAngle = -90;
  const radius = size / 2;
  const innerRadius = radius * 0.5;
  const colors = ['#4f46e5', '#3b82f6', '#10b981', '#8b5cf6', '#f97316', '#ef4444', '#f59e0b'];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`translate(${radius}, ${radius})`}>
        {Object.entries(data).map(([key, value], i) => {
          const percentage = total === 0 ? 0 : (value / total);
          if (percentage === 0) return null;

          const angle = percentage * 360;
          const endAngle = startAngle + angle;
          const startRadians = (startAngle * Math.PI) / 180;
          const endRadians = (endAngle * Math.PI) / 180;
          const x1_outer = Math.cos(startRadians) * radius;
          const y1_outer = Math.sin(startRadians) * radius;
          const x2_outer = Math.cos(endRadians) * radius;
          const y2_outer = Math.sin(endRadians) * radius;
          const x1_inner = Math.cos(startRadians) * innerRadius;
          const y1_inner = Math.sin(startRadians) * innerRadius;
          const x2_inner = Math.cos(endRadians) * innerRadius;
          const y2_inner = Math.sin(endRadians) * innerRadius;
          const largeArcFlag = angle > 180 ? 1 : 0;
          const pathData = `M ${x1_outer} ${y1_outer} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2_outer} ${y2_outer} L ${x2_inner} ${y2_inner} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x1_inner} ${y1_inner} Z`;
          const color = colors[i % colors.length];
          startAngle = endAngle;

          return (
            <motion.path
              key={key} d={pathData} fill={color} stroke="#fff" strokeWidth="1"
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, duration: 0.5 }} whileHover={{ opacity: 0.8 }}
            />
          );
        })}
      </g>
    </svg>
  );
};

const HorizontalBarChart = ({ data, height = 200, maxWidth = 400 }) => {
    if (!data || Object.keys(data).length === 0) return <div className="text-sm text-gray-500 text-center py-4">No difficulty data available.</div>;

    const validEntries = Object.entries(data)
                                .filter(([key, value]) => value && typeof value.percentage === 'number' && value.total >= 0)
                                .sort(([, a], [, b]) => (a.total === 0 ? 1 : -1));


    if (validEntries.every(([,v]) => v.total === 0)) return <div className="text-sm text-gray-500 text-center py-4">No questions found for these difficulty levels.</div>;


    const barHeight = 25;
    const gap = 10;
    const totalHeight = (barHeight + gap) * validEntries.length;
    const labelWidth = 70;
    const valueLabelWidth = 40;
    const chartWidth = maxWidth - labelWidth - valueLabelWidth - 16;
    const colors = ['#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9'];

    return (
        <svg width="100%" height={totalHeight} style={{ maxWidth }}>
        {validEntries.map(([key, value], i) => {
            const percentage = value.percentage ?? 0;
            const barWidth = Math.max(0, (percentage / 100) * chartWidth);
            const yPos = i * (barHeight + gap);
            const barColor = colors[i % colors.length];

            return (
            <g key={key} transform={`translate(0, ${yPos})`}>
                <text x="0" y={barHeight / 2 + 4} fontSize="12" fill="#4b5563" fontWeight="500" textAnchor="start" className="capitalize">
                {key}:
                </text>
                <rect x={labelWidth} y="0" width={chartWidth} height={barHeight} rx="4" fill="#e5e7eb" />
                <motion.rect
                    x={labelWidth} y="0" height={barHeight} rx="4" fill={barColor}
                    initial={{ width: 0 }} animate={{ width: barWidth }}
                    transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
                />
                <motion.text
                    x={labelWidth + barWidth + 8} y={barHeight / 2 + 4} fontSize="12" fill="#374151" fontWeight="500"
                    initial={{ opacity: 0, x: labelWidth + 8 }} animate={{ opacity: 1, x: labelWidth + barWidth + 8 }}
                    transition={{ duration: 0.6, delay: i * 0.1 + 0.3, ease: "easeOut" }}
                >
                {percentage}%
                </motion.text>
            </g>
            );
        })}
        </svg>
    );
};


const TimelineChart = ({ data, width = 600, height = 150 }) => {
  if (!data || data.length < 2) return <div className="text-sm text-gray-500 text-center py-4">Not enough data for a timeline.</div>;

  const maxTime = Math.max(1, ...data.map(d => d.time));
  const maxQuestions = Math.max(1, ...data.map(d => d.questionsAnswered));
  const padding = { top: 20, right: 30, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const getX = (time) => padding.left + (time / maxTime) * chartWidth;
  const getY = (questions) => padding.top + chartHeight - (questions / maxQuestions) * chartHeight;
  const pathData = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(d.time).toFixed(2)} ${getY(d.questionsAnswered).toFixed(2)}`).join(' ');
  const areaData = `${pathData} L ${getX(maxTime)} ${padding.top + chartHeight} L ${getX(data[0].time)} ${padding.top + chartHeight} Z`;

  return (
    <svg width="100%" height={height} style={{ maxWidth: width }} aria-label="Quiz progress timeline chart">
      <defs>
        <linearGradient id="timelineGradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#8b5cf6" /></linearGradient>
        <linearGradient id="timelineAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.5" /><stop offset="100%" stopColor="#c4b5fd" stopOpacity="0.1" /></linearGradient>
      </defs>
      {[...Array(Math.min(6, maxQuestions + 1)).keys()].slice(1).map(q => <line key={`y-grid-${q}`} x1={padding.left} y1={getY(q)} x2={width - padding.right} y2={getY(q)} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="2,3" />)}
      {[0, 0.5, 1].map(factor => <line key={`x-grid-${factor}`} x1={getX(maxTime * factor)} y1={padding.top} x2={getX(maxTime * factor)} y2={height - padding.bottom} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="2,3" />)}
      <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#cbd5e1" strokeWidth="1.5" />
      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="#cbd5e1" strokeWidth="1.5" />
      {areaData && <motion.path d={areaData} fill="url(#timelineAreaGradient)" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }} />}
      {pathData && <motion.path d={pathData} fill="none" stroke="url(#timelineGradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeInOut" }} />}
      {data.map((d, i) => (
        <motion.circle key={`dot-${i}`} cx={getX(d.time)} cy={getY(d.questionsAnswered)} r="4" fill="#fff" stroke="#6366f1" strokeWidth="2" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * (1.5 / data.length), duration: 0.3 }} whileHover={{ r: 6, fill: "#a5b4fc" }}>
          <title>{`Time: ${d.time}s, Answered: ${d.questionsAnswered}`}</title>
        </motion.circle>
      ))}
      <text x={padding.left + chartWidth / 2} y={height - 10} textAnchor="middle" fontSize="12" fill="#6b7280" fontWeight="500">Time (seconds)</text>
      <text x={padding.left - 35} y={padding.top + chartHeight / 2} textAnchor="middle" fontSize="12" fill="#6b7280" fontWeight="500" transform={`rotate(-90, ${padding.left - 35}, ${padding.top + chartHeight / 2})`}>Questions Answered</text>
      <text x={padding.left} y={height - padding.bottom + 15} fontSize="10" fill="#6b7280" textAnchor="middle">0</text>
      <text x={width - padding.right} y={height - padding.bottom + 15} textAnchor="end" fontSize="10" fill="#6b7280">{maxTime}</text>
      <text x={padding.left - 10} y={height - padding.bottom + 3} textAnchor="end" fontSize="10" fill="#6b7280">0</text>
      <text x={padding.left - 10} y={padding.top + 5} textAnchor="end" fontSize="10" fill="#6b7280">{maxQuestions}</text>
    </svg>
  );
};
// --- End Chart Components ---

const QuizDashboard = ({ token }) => {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [topic, setTopic] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [categories] = useState([
    { name: 'Programming', icon: <Code className="h-4 w-4" /> },
    { name: 'Science', icon: <Flask className="h-4 w-4" /> },
    { name: 'History', icon: <BookOpen className="h-4 w-4" /> },
    { name: 'Geography', icon: <Globe className="h-4 w-4" /> },
    { name: 'Arts', icon: <Palette className="h-4 w-4" /> },
    { name: 'Mathematics', icon: <Calculator className="h-4 w-4" /> },
  ]);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [questionStats, setQuestionStats] = useState([]);
  const [difficultyDistribution, setDifficultyDistribution] = useState({});
  const [progressHistory, setProgressHistory] = useState([]);
  const [userProfile] = useState({
    name: "Alex Johnson",
    level: 5,
    totalQuizzes: 12,
    avgScore: 78,
    streak: 3
  });
  const confettiRef = useRef(null);

  // --- Effects ---

  // Progress timeline simulation
  useEffect(() => {
    let progressInterval;
    if (quiz && !submitted && startTime) {
       progressInterval = setInterval(() => {
         const currentAnswersCount = Object.keys(answers).length;
         const currentTime = Math.floor((Date.now() - startTime) / 1000);
         setProgressHistory(prev => {
              const newPoint = { time: currentTime, questionsAnswered: currentAnswersCount };
              if (prev.length === 0 || prev[prev.length - 1].time < currentTime) {
                return [...prev, newPoint];
              }
              return prev;
         });
       }, 10000);
    }
    return () => clearInterval(progressInterval);
  }, [quiz, submitted, startTime, answers]);

  // Timer effect for quiz tracking
  useEffect(() => {
    let timerInterval;
    if (quiz && !submitted && startTime) {
      timerInterval = setInterval(() => {
        setTimeSpent(prevTime => prevTime + 1);
      }, 1000);
    }
    return () => clearInterval(timerInterval);
  }, [quiz, submitted, startTime]);

  // Analyze difficulty distribution when quiz is loaded
  useEffect(() => {
    if (quiz?.questions) {
      const distribution = quiz.questions.reduce((acc, q) => {
        const difficulty = q.difficulty || 'unknown';
        acc[difficulty] = (acc[difficulty] || 0) + 1;
        return acc;
      }, {});
      setDifficultyDistribution(distribution);
    }
  }, [quiz]);

  // Generate question stats when answers change
  useEffect(() => {
    if (quiz?.questions) {
      const stats = quiz.questions.map((q, index) => ({
        number: index + 1,
        // Updated check for meaningful answers including ordering/matching
        answered: answers[index] !== undefined && answers[index] !== null &&
                   (typeof answers[index] !== 'object' ||
                   (Array.isArray(answers[index]) && answers[index].length > 0) ||
                   (!Array.isArray(answers[index]) && Object.keys(answers[index]).length > 0)),
        difficulty: q.difficulty || 'unknown',
        points: q.points || 1
      }));
      setQuestionStats(stats);
    }
  }, [quiz, answers]);


  // Celebration effect
  useEffect(() => {
    if (submitted && result) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [submitted, result]);

  // --- Core Functions ---

  const fetchQuiz = async (selectedTopic) => {
    setLoading(true);
    setError('');
    setQuiz(null);
    setAnswers({});
    setSubmitted(false);
    setResult(null);
    setCurrentQuestion(0);
    setTimeSpent(0);
    setStartTime(null);
    setProgressHistory([]);

    try {
      // --- ACTUAL AXIOS CALL ---
      console.log(`Fetching quiz for topic: ${selectedTopic}`);
      const res = await axios.post(
        'http://localhost:5000/generate-quiz',
        { topic: selectedTopic },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const fetchedQuizData = res.data;
      console.log("Quiz data received:", fetchedQuizData);
      // --- End ACTUAL AXIOS CALL ---

      if (fetchedQuizData && fetchedQuizData.questions && fetchedQuizData.questions.length > 0) {
        const processedQuiz = {
            ...fetchedQuizData,
            questions: fetchedQuizData.questions.map((q) => {
                let processedQ = { ...q };

                if (processedQ.type === 'mcq' && Array.isArray(processedQ.options)) {
                    processedQ.options = [...processedQ.options].sort(() => Math.random() - 0.5);
                }
                if (processedQ.type === 'mcq') {
                    processedQ.type = 'multiple_choice';
                }
                if (processedQ.type === 'ordering' && Array.isArray(processedQ.items)) {
                    // Store the initially shuffled order for the user to see
                    processedQ.initialItems = [...processedQ.items].sort(() => Math.random() - 0.5);
                    // The actual answer (user's order) will start as null/undefined in `answers` state
                }
                if (processedQ.type === 'matching' && typeof processedQ.pairs === 'object') {
                     processedQ.matchItems = Object.keys(processedQ.pairs);
                     processedQ.matchOptions = Object.values(processedQ.pairs).sort(() => Math.random() - 0.5);
                     // The actual answer (user's matches) will start as null/undefined in `answers` state
                }

                return processedQ;
            })
        };
        console.log("Processed Quiz Data:", processedQuiz);

        setQuiz(processedQuiz);
        setStartTime(Date.now());
        setProgressHistory([{ time: 0, questionsAnswered: 0 }]);
      } else {
        console.error('Fetched quiz data is invalid:', fetchedQuizData);
        setError('Failed to generate a valid quiz. The received data might be empty or incorrectly formatted. Please try a different topic.');
      }
    } catch (error) {
      console.error('Error fetching quiz:', error);
      setError(error.response?.data?.error || `Failed to generate quiz. ${error.message || 'Check server connection and topic.'}`);
    } finally {
      setLoading(false);
    }
  };


  const handleTopicSubmit = (e) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }
    setError('');
    fetchQuiz(topic);
  };

  // Generic change handler for most input types
  const handleChange = (index, value) => {
    setAnswers((prev) => ({ ...prev, [index]: value }));
  };

  // --- REMOVED: handleOrderChange (dnd specific) ---

  // NEW: Handler for moving items in 'ordering' question using buttons
  const handleMoveOrderItem = (itemIndex, direction) => {
    const questionIndex = currentQuestion;
    const currentOrder = answers[questionIndex] || quiz.questions[questionIndex].initialItems;

    if (!currentOrder) return; // Should not happen if initialItems is set

    const newOrder = Array.from(currentOrder);
    const targetIndex = itemIndex + direction;

    // Check bounds
    if (targetIndex < 0 || targetIndex >= newOrder.length) {
      return;
    }

    // Swap items
    [newOrder[itemIndex], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[itemIndex]];

    setAnswers((prev) => ({ ...prev, [questionIndex]: newOrder }));
  };


  // Handler for matching questions (remains the same)
  const handleMatchChange = (questionIndex, itemKey, selectedValue) => {
     setAnswers((prev) => {
         const currentMatches = prev[questionIndex] || {};
         return {
             ...prev,
             [questionIndex]: {
                 ...currentMatches,
                 [itemKey]: selectedValue || null
             }
         };
     });
  };


  const handleCategorySelect = (categoryName) => {
    setSelectedCategory(categoryName);
    setTopic(categoryName);
    setError('');
  };

  const handleSubmit = async () => {
    if (!quiz || !quiz.questions) {
        setError("Cannot submit: Quiz data is missing.");
        return;
    }

    const formattedAnswers = quiz.questions.map((q, i) => {
        if (q.type === 'ordering') {
            // If user hasn't interacted, submit the initial shuffled order? Or empty?
            // Let's submit the current order shown, even if it's the initial one.
            return answers[i] || q.initialItems || [];
        }
        if (q.type === 'matching') {
            return answers[i] || {};
        }
        return answers[i] ?? null;
    });

    const answeredQuestionsCount = formattedAnswers.filter(ans => ans !== null && ans !== undefined && (typeof ans !== 'object' || Object.keys(ans).length > 0 || (Array.isArray(ans) && ans.length > 0))).length;
    const completionRate = quiz.questions.length > 0
        ? Math.round((answeredQuestionsCount / quiz.questions.length) * 100)
        : 0;
    const timePerQuestion = answeredQuestionsCount > 0 ? (timeSpent / answeredQuestionsCount) : 0;

    const finalProgressPoint = { time: timeSpent, questionsAnswered: answeredQuestionsCount };
    if (progressHistory.length === 0 || progressHistory[progressHistory.length - 1].time < timeSpent) {
       setProgressHistory(prev => [...prev, finalProgressPoint]);
    }

    setLoading(true);
    setError('');

    try {
       console.log("Submitting answers:", formattedAnswers);
       console.log("Submitting quiz data:", {
           quizId: quiz.quizId, answers: formattedAnswers, questions: quiz.questions, timeSpent, completionRate,
       });

      const res = await axios.post(
        'http://localhost:5000/submit-quiz',
        {
          quizId: quiz.quizId,
          answers: formattedAnswers,
          questions: quiz.questions,
          timeSpent,
          completionRate,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Submission response:", res.data);
      const backendResult = res.data;

      const userScore = res.data.userScore ?? 0;
      const totalQuestions = quiz.questions.length;
      const percentile = backendResult.percentile ?? Math.round((userScore / (totalQuestions || 1)) * 100);
      const subtopicPerformance = backendResult.subtopicPerformance || generateSubtopicPerformance(quiz, formattedAnswers, backendResult.scoreDetails);
      const strengthsAndWeaknesses = backendResult.strengthsAndWeaknesses || analyzeStrengthsAndWeaknesses(quiz, formattedAnswers, backendResult.scoreDetails, userScore, timeSpent);
      const difficultyPerformance = backendResult.difficultyPerformance || analyzeDifficultyPerformance(quiz, formattedAnswers, backendResult.scoreDetails);

      const enhancedResult = {
        userScore, totalQuestions, percentile,
        answeredQuestions: answeredQuestionsCount, completionRate,
        timePerQuestion: timePerQuestion.toFixed(1), totalTimeSpent: formatTime(timeSpent),
        subtopicPerformance, strengthsAndWeaknesses,
        difficulty: difficultyPerformance,
        timelineData: progressHistory, // Use the finalized history
        rawBackendData: backendResult,
      };

      setResult(enhancedResult);
      setSubmitted(true);

    } catch (error) {
      console.error('Error submitting quiz:', error);
      setError(error.response?.data?.error || `Failed to submit quiz. ${error.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };


  // --- Helper Functions (Keep as they are) ---
  const generateSubtopicPerformance = (quiz, answers, scoreDetails) => {
    if (scoreDetails?.subtopics) {
        return Object.entries(scoreDetails.subtopics).reduce((acc, [subtopic, data]) => {
            acc[subtopic] = { correct: data.correct ?? 0, total: data.total ?? 0, percentage: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0 }; return acc; }, {});
    }
    const subtopics = {};
    quiz.questions.forEach((q) => {
        const tags = q.tags && q.tags.length > 0 ? q.tags : ['General'];
        tags.forEach(tag => { if (!subtopics[tag]) subtopics[tag] = { correct: 0, total: 0 }; subtopics[tag].total++; });
    });
    Object.keys(subtopics).forEach(tag => { const total = subtopics[tag].total; subtopics[tag].correct = Math.floor(Math.random() * (total + 1)); subtopics[tag].percentage = total > 0 ? Math.round((subtopics[tag].correct / total) * 100) : 0; });
    return subtopics;
  };

  const analyzeStrengthsAndWeaknesses = (quiz, answers, scoreDetails, userScore, timeSpent) => {
    if (scoreDetails?.strengths && scoreDetails?.weaknesses) { return { strengths: scoreDetails.strengths, weaknesses: scoreDetails.weaknesses }; }
    const totalCount = quiz.questions.length; const scorePercent = totalCount > 0 ? Math.round((userScore / totalCount) * 100) : 0; const avgTime = totalCount > 0 ? (timeSpent / totalCount) : 0; let strengths = []; let weaknesses = [];
    if (scorePercent >= 80) strengths.push("Excellent overall accuracy"); else if (scorePercent >= 60) strengths.push("Good overall accuracy"); else if (scorePercent < 40) weaknesses.push("Overall accuracy needs improvement");
    if (avgTime < 20 && totalCount > 0) strengths.push("Quick response time"); else if (avgTime > 90 && totalCount > 0) weaknesses.push("Response time could be faster");
    if (Math.random() > 0.6) strengths.push("Strong grasp of core concepts (estimated)"); else if (Math.random() > 0.6) weaknesses.push("Review fundamental definitions (estimated)");
    return { strengths, weaknesses };
  };

   const analyzeDifficultyPerformance = (quiz, answers, scoreDetails) => {
      if (scoreDetails?.difficulty) { return Object.entries(scoreDetails.difficulty).reduce((acc, [level, data]) => { acc[level] = { correct: data.correct ?? 0, total: data.total ?? 0, percentage: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0 }; return acc; }, {}); }
      const performance = {}; const difficulties = ['easy', 'medium', 'hard', 'unknown'];
      quiz.questions.forEach((q) => { const difficulty = q.difficulty || 'unknown'; if (!performance[difficulty]) performance[difficulty] = { correct: 0, total: 0 }; performance[difficulty].total++; });
      Object.keys(performance).forEach(diff => { const total = performance[diff].total; performance[diff].correct = Math.floor(Math.random() * (total + 1)); performance[diff].percentage = total > 0 ? Math.round((performance[diff].correct / total) * 100) : 0; });
      difficulties.forEach(diff => { if (!performance[diff]) { performance[diff] = { correct: 0, total: 0, percentage: 0 }; } });
      return performance;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const moveToQuestion = (direction) => {
    if (!quiz?.questions) return;
    const newIndex = currentQuestion + direction;
    if (newIndex >= 0 && newIndex < quiz.questions.length) {
      setCurrentQuestion(newIndex);
      setError('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const jumpToQuestion = (index) => {
    if (!quiz?.questions || index < 0 || index >= quiz.questions.length) return;
    setCurrentQuestion(index);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- UI Components ---

  const renderSidebar = () => (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: showSidebar ? 0 : -300, opacity: showSidebar ? 1 : 0 }}
      transition={{ duration: 0.3 }}
      className={`fixed left-0 top-0 bottom-0 bg-gradient-to-b from-indigo-900 to-purple-900 text-white w-64 p-6 z-30 shadow-xl overflow-y-auto`}
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2"> <Brain className="h-8 w-8 text-purple-300" /> <h1 className="text-xl font-bold">QuizPortal</h1> </div>
        <button onClick={() => setShowSidebar(false)} className="p-1 rounded-full hover:bg-purple-800 transition-colors lg:hidden" aria-label="Close sidebar"> <ChevronLeft className="h-5 w-5" /> </button>
      </div>
       <div className="bg-purple-800/50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full p-2"> <User className="h-5 w-5 text-white" /> </div>
            <div> <h3 className="font-semibold">{userProfile.name}</h3> <p className="text-xs text-purple-300">Quiz Master Level {userProfile.level}</p> </div>
          </div>
          <div className="flex justify-between text-center text-xs">
            <div><div className="font-bold text-lg">{userProfile.totalQuizzes}</div><div className="text-purple-300">Quizzes</div></div>
            <div><div className="font-bold text-lg">{userProfile.avgScore}%</div><div className="text-purple-300">Avg Score</div></div>
            <div><div className="font-bold text-lg">{userProfile.streak}</div><div className="text-purple-300">Streak</div></div>
          </div>
        </div>
      <nav className="space-y-1">
        <button className="flex items-center gap-3 w-full p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"> <Home className="h-5 w-5" /> <span>Dashboard</span> </button>
        <button className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-white/10 transition-colors"> <Book className="h-5 w-5" /> <span>My Quizzes</span> </button>
        <button className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-white/10 transition-colors"> <BarChart className="h-5 w-5" /> <span>Progress</span> </button>
         <button className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-white/10 transition-colors"> <Settings className="h-5 w-5" /> <span>Settings</span> </button>
      </nav>
      <div className="mt-auto pt-6">
        <button className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-white/10 transition-colors text-purple-300"> <LogOut className="h-5 w-5" /> <span>Logout</span> </button>
      </div>
    </motion.div>
  );

  const renderHeader = () => (
    <motion.div
      initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1, duration: 0.4 }}
      className="bg-gradient-to-r from-indigo-700 to-purple-800 p-4 text-white shadow-md sticky top-0 z-20"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          {!showSidebar && (
            <button onClick={() => setShowSidebar(true)} className="p-2 rounded-full hover:bg-white/10 transition-colors lg:hidden" aria-label="Open sidebar">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          )}
           <div>
                <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2"> <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-indigo-300" /> {quiz ? `${quiz.topic || 'Custom'} Quiz` : 'Interactive Quiz Portal'} </h1>
                {quiz && quiz.subtopics && quiz.subtopics.length > 0 && ( <p className="text-indigo-200 text-xs md:text-sm truncate max-w-xs md:max-w-md"> {quiz.subtopics.join(' • ')} </p> )}
            </div>
        </div>
         <div className="flex items-center gap-4">
            {quiz && !submitted && ( <div className="hidden sm:flex items-center gap-2 bg-white/10 p-2 px-3 rounded-lg"> <Clock className="h-4 w-4 md:h-5 md:w-5 text-indigo-300" /> <div className="text-lg md:text-xl font-mono">{formatTime(timeSpent)}</div> </div> )}
            {quiz && !submitted && ( <button onClick={() => { setQuiz(null); setTopic(''); setSelectedCategory(null); setError(''); setAnswers({}); setCurrentQuestion(0); setTimeSpent(0); setStartTime(null); setProgressHistory([]); setSubmitted(false); setResult(null); }} className="text-sm text-indigo-200 hover:text-white transition-colors flex items-center gap-1" title="Back to Topic Selection"> <ChevronLeft className="h-4 w-4"/> <span className="hidden md:inline">Change Topic</span> </button> )}
         </div>
      </div>
    </motion.div>
  );

  const renderQuizGenerator = () => (
    <motion.div
      key="generator-view" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}
      className="bg-white rounded-xl p-6 md:p-8 shadow-xl border border-gray-100 max-w-3xl mx-auto my-8"
    >
      <div className="flex items-center gap-2 mb-8"> <Brain className="h-7 w-7 text-indigo-500" /> <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Generate Your Quiz</h2> </div>
      <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="mb-6 overflow-hidden">
                 <div className="p-4 bg-red-50 rounded-lg border border-red-200 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" /> <p className="text-sm text-red-700 flex-1">{error}</p>
                      <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700 p-1" aria-label="Close error message"> <X className="h-4 w-4"/> </button>
                 </div>
            </motion.div>
          )}
      </AnimatePresence>
       <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Choose a Category</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {categories.map(category => (
            <motion.button key={category.name} whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => handleCategorySelect(category.name)}
              className={`p-3 md:p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all text-xs md:text-sm ${ selectedCategory === category.name ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-lg ring-2 ring-offset-2 ring-indigo-500' : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 border border-gray-200 hover:shadow-md hover:border-gray-300'}`}>
              <div className={`p-1.5 md:p-2 rounded-full ${selectedCategory === category.name ? 'bg-white/20' : 'bg-indigo-100'}`}> {React.cloneElement(category.icon, { className: "h-4 w-4 md:h-5 md:w-5" })} </div>
              <span className="font-medium text-center">{category.name}</span>
            </motion.button>
          ))}
        </div>
      </div>
       <form onSubmit={handleTopicSubmit} className="space-y-6">
        <div>
          <label htmlFor="topicInput" className="block text-gray-700 mb-2 font-medium">Or Enter a Specific Topic</label>
          <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"> <BookOpen className="h-5 w-5 text-gray-400" /> </div>
            <input id="topicInput" type="text" value={topic} onChange={(e) => { setTopic(e.target.value); setSelectedCategory(null); setError(''); }} placeholder="e.g., JavaScript closures, WW2 Pacific Theatre" className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm disabled:bg-gray-100" disabled={loading} aria-label="Quiz topic input" />
          </div>
          <p className="mt-2 text-xs text-gray-500">Be specific for better results. Overrides category selection.</p>
        </div>
        <motion.button whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }} type="submit" className={`w-full flex items-center justify-center gap-2 px-4 py-3 md:py-4 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-lg hover:shadow-lg hover:shadow-indigo-300/50 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed font-semibold text-base ${loading ? 'opacity-60 cursor-wait' : ''}`} disabled={loading || !topic.trim()}>
          {loading ? ( <> <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" /> <span>Crafting Your Quiz...</span> </> ) : ( <> <Sparkles className="h-5 w-5" /> <span>Generate Quiz</span> </> )}
        </motion.button>
      </form>
      {loading && !quiz && (
         <div className="mt-12 space-y-8 opacity-60 animate-pulse">
          <div className="flex items-center justify-between mb-4"><div className="bg-gray-200 h-7 w-48 rounded"></div><div className="bg-gray-200 h-6 w-20 rounded"></div></div>
          <div className="space-y-6"> {[1, 2].map(i => ( <div key={i} className="border border-gray-100 rounded-xl p-5 space-y-3 shadow-sm"> <div className="flex justify-between items-start"> <div className="h-6 bg-gray-200 rounded w-3/4"></div> <div className="h-6 w-6 rounded-full bg-gray-200"></div> </div> <div className="h-4 bg-gray-200 rounded w-1/2"></div> <div className="space-y-2 mt-4"> {[1, 2, 3].map(j => ( <div key={j} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg"> <div className="h-4 w-4 rounded-full bg-gray-200"></div> <div className="h-4 bg-gray-200 rounded w-full"></div> </div> ))} </div> <div className="flex justify-between items-center pt-3"> <div className="h-5 bg-gray-200 rounded w-20"></div> <div className="h-5 bg-gray-200 rounded w-16"></div> </div> </div> ))} </div>
        </div>
      )}
    </motion.div>
  );


  const renderQuizQuestion = () => {
    if (!quiz || !quiz.questions || quiz.questions.length === 0) return null;

    const currentQ = quiz.questions[currentQuestion];
    const currentAnswer = answers[currentQuestion];
    const isAnswered = currentAnswer !== undefined && currentAnswer !== null &&
                       (typeof currentAnswer !== 'object' ||
                       (Array.isArray(currentAnswer) && currentAnswer.length > 0) ||
                       (!Array.isArray(currentAnswer) && Object.keys(currentAnswer).length > 0));

    const progress = Math.round(((currentQuestion + 1) / quiz.questions.length) * 100);
    const questionType = currentQ.type;

    return (
      <motion.div
        key={`question-view-${currentQuestion}`}
        initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden max-w-4xl mx-auto my-8"
      >
         {/* Question Header */}
        <div className="border-b p-5 md:p-6 bg-gradient-to-r from-gray-50 to-indigo-50">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 mb-4">
             <div className="flex items-center gap-2 flex-wrap">
               <div className="flex-shrink-0 bg-indigo-600 text-white rounded-full p-1 w-8 h-8 flex items-center justify-center font-bold text-sm"> {currentQuestion + 1} </div>
               {currentQ.difficulty && <span className="text-xs font-medium text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full capitalize">{currentQ.difficulty}</span>}
               {currentQ.points && <span className="text-xs font-medium text-gray-500">• {currentQ.points} {currentQ.points === 1 ? 'point' : 'points'}</span>}
             </div>
             <span className="text-xs font-medium text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full capitalize hidden md:inline-block"> {questionType.replace('_', ' ')} </span>
          </div>
          <div className="space-y-1">
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden"> <motion.div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2.5 rounded-full" initial={{ width: `${((currentQuestion) / quiz.questions.length) * 100}%` }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5, ease: "easeOut" }} /> </div>
            <div className="flex justify-between items-center mt-1 text-xs text-gray-500"> <span>Question {currentQuestion + 1} of {quiz.questions.length} ({progress}% Complete)</span> <div className="flex items-center gap-1 text-gray-700 bg-white px-2 py-0.5 rounded-full shadow-sm border border-gray-200"> <ClockIcon className="h-3 w-3 text-indigo-500" /> <span className="font-mono font-medium">{formatTime(timeSpent)}</span> </div> </div>
          </div>
        </div>

        {/* Question Body */}
        <div className="p-5 md:p-8">
           <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
                     <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-sm text-red-600"> <AlertCircle className="h-4 w-4 flex-shrink-0" /> <span>{error}</span> <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700 p-0.5" aria-label="Clear error"> <X className="h-4 w-4"/> </button> </div>
                </motion.div>
              )}
           </AnimatePresence>
          <div className="mb-6">
            <motion.h3 className="text-lg md:text-xl font-semibold mb-3 text-gray-800 leading-snug" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} dangerouslySetInnerHTML={{ __html: currentQ.question }} />
            {currentQ.tags && currentQ.tags.length > 0 && ( <div className="flex flex-wrap gap-1.5 mt-3"> {currentQ.tags.map(tag => ( <span key={tag} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium border border-indigo-100"> #{tag} </span> ))} </div> )}
          </div>

            {/* Answer Input Area */}
            <div className="space-y-4 mt-6">
              {/* Multiple Choice */}
              {questionType === 'multiple_choice' && currentQ.options?.map((opt, idx) => (
                <motion.label key={idx} className={`flex items-center p-3 md:p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-400 has-[:checked]:shadow-md has-[:checked]:ring-1 has-[:checked]:ring-indigo-300 hover:bg-gray-50 border-gray-200 hover:border-indigo-300`} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + idx * 0.05 }} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                   <input type="radio" id={`option-${currentQuestion}-${idx}`} name={`question-${currentQuestion}`} value={opt} checked={currentAnswer === opt} onChange={() => handleChange(currentQuestion, opt)} className="sr-only" />
                  <div className={`flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center mr-3 transition-colors duration-200 ${ currentAnswer === opt ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300 group-hover:border-indigo-400' }`}> {currentAnswer === opt && <motion.div className="h-2 w-2 rounded-full bg-white" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.15 }} />} </div>
                  <span className={`text-sm md:text-base flex-1 ${currentAnswer === opt ? 'font-medium text-indigo-900' : 'text-gray-700'}`}>{opt}</span>
                </motion.label>
              ))}
               {/* True/False */}
              {questionType === 'true_false' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[true, false].map((value, idx) => (
                     <motion.button key={value.toString()} type="button" className={`p-3 md:p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 text-base font-medium ${ currentAnswer === value ? 'bg-indigo-50 border-indigo-400 shadow-md ring-1 ring-indigo-300 text-indigo-900' : 'hover:bg-gray-50 border-gray-200 hover:border-indigo-300 text-gray-700' }`} onClick={() => handleChange(currentQuestion, value)} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + idx * 0.1 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        {value ? <CheckCircle className={`h-5 w-5 ${currentAnswer === true ? 'text-indigo-500' : 'text-gray-400'}`} /> : <X className={`h-5 w-5 ${currentAnswer === false ? 'text-indigo-500' : 'text-gray-400'}`} /> }
                        <span>{value ? 'True' : 'False'}</span>
                      </motion.button>
                   ))}
                </div>
              )}
              {/* Fill in the Blank */}
              {questionType === 'fill_blank' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                  <input type="text" value={currentAnswer || ''} onChange={(e) => handleChange(currentQuestion, e.target.value)} placeholder="Type your answer here" className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm text-base" aria-label={`Answer for question ${currentQuestion + 1}`} />
                </motion.div>
              )}
              {/* Numeric */}
              {questionType === 'numeric' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                  <input type="number" step="any" value={currentAnswer ?? ''} onChange={(e) => handleChange(currentQuestion, e.target.value === '' ? null : parseFloat(e.target.value))} placeholder="Enter a number" className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm text-base" aria-label={`Numeric answer for question ${currentQuestion + 1}`} />
                </motion.div>
              )}

              {/* Ordering (Using Buttons) */}
              {questionType === 'ordering' && currentQ.initialItems && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <p className="text-sm text-gray-600 mb-3">Use the buttons to arrange the items in the correct order.</p>
                    <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                       {(currentAnswer || currentQ.initialItems).map((item, index, arr) => (
                           <div key={item} // Using item as key assumes unique items
                                className="p-3 bg-white rounded-md shadow-sm border border-gray-200 flex items-center justify-between gap-3"
                           >
                               <span className="text-sm md:text-base text-gray-800 flex-1">{item}</span>
                               <div className="flex gap-1">
                                   <button
                                       type="button"
                                       onClick={() => handleMoveOrderItem(index, -1)}
                                       disabled={index === 0}
                                       className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600 hover:text-indigo-600"
                                       aria-label={`Move ${item} up`}
                                    >
                                       <ArrowUp className="h-4 w-4" />
                                   </button>
                                   <button
                                       type="button"
                                       onClick={() => handleMoveOrderItem(index, 1)}
                                       disabled={index === arr.length - 1}
                                       className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600 hover:text-indigo-600"
                                       aria-label={`Move ${item} down`}
                                   >
                                       <ArrowDown className="h-4 w-4" />
                                   </button>
                               </div>
                           </div>
                       ))}
                    </div>
                </motion.div>
               )}


              {/* Matching */}
              {questionType === 'matching' && currentQ.matchItems && currentQ.matchOptions && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                     <p className="text-sm text-gray-600 mb-3">Match each item on the left with the correct option on the right.</p>
                     <div className="space-y-4">
                         {currentQ.matchItems.map((itemKey, idx) => (
                            <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center p-3 border border-gray-200 rounded-lg bg-gray-50/50">
                                <div className="font-medium text-gray-800 text-sm md:text-base pr-2">{itemKey}</div>
                                <div className="relative">
                                    <select value={currentAnswer?.[itemKey] || ''} onChange={(e) => handleMatchChange(currentQuestion, itemKey, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm appearance-none text-sm bg-white" aria-label={`Select match for ${itemKey}`}>
                                        <option value="" disabled>Select an option...</option>
                                        {currentQ.matchOptions.map((optionValue, optIdx) => ( <option key={optIdx} value={optionValue}>{optionValue}</option> ))}
                                    </select>
                                     <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"> <ChevronDown className="h-4 w-4 text-gray-400" /> </div>
                                </div>
                            </div>
                         ))}
                     </div>
                  </motion.div>
              )}
            </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center p-4 md:p-6 border-t border-gray-100 mt-8 bg-gray-50/50">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" onClick={() => moveToQuestion(-1)} className={`px-4 py-2 rounded-lg border-2 flex items-center gap-2 text-sm font-medium transition-colors duration-200 ${ currentQuestion === 0 ? 'opacity-50 cursor-not-allowed border-gray-200 text-gray-400 bg-gray-100' : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700' }`} disabled={currentQuestion === 0}> <ChevronLeft className="h-4 w-4" /> Previous </motion.button>
          {currentQuestion < quiz.questions.length - 1 ? (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" onClick={() => moveToQuestion(1)} className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:shadow-md transition flex items-center gap-2 font-medium text-sm"> Next <ChevronRight className="h-4 w-4" /> </motion.button>
          ) : (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" onClick={handleSubmit} className={`px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition flex items-center gap-2 font-medium text-sm ${loading ? 'opacity-70 cursor-wait' : ''}`} disabled={loading}>
               {loading ? 'Submitting...' : 'Submit Quiz'}
               {!loading && <Send className="h-4 w-4" />}
               {loading && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-1"></div> }
            </motion.button>
          )}
        </div>

        {/* Question Navigator Footer */}
        <div className="border-t p-4 md:p-6 bg-gradient-to-r from-gray-50 to-indigo-50">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Question Navigator</h4>
          <div className="flex flex-wrap gap-2">
            {questionStats.map((stat, idx) => (
              <motion.button key={idx} whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.95 }} onClick={() => jumpToQuestion(idx)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-200 border ${ currentQuestion === idx ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md border-transparent ring-2 ring-offset-1 ring-indigo-400' : stat.answered ? 'bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200 hover:border-gray-300' }`}
                 aria-label={`Go to question ${idx + 1}${stat.answered ? ' (answered)' : ''}`}> {idx + 1} </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderResults = () => {
    if (!submitted || !result) return null;

    const { userScore, percentile, totalQuestions, completionRate, timePerQuestion, totalTimeSpent, subtopicPerformance, difficulty, strengthsAndWeaknesses, timelineData } = result;
    const scorePercentage = totalQuestions > 0 ? Math.round((userScore / totalQuestions) * 100) : 0;

    return (
       <motion.div
        key="results-view" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}
        className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden max-w-5xl mx-auto my-8"
      >
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-6 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4"> <AwardIcon className="h-8 w-8 text-indigo-200" /> <h2 className="text-2xl md:text-3xl font-bold">Quiz Results</h2> </div>
            <p className="opacity-90 text-sm md:text-base">Congratulations on completing the quiz on "{quiz?.topic || 'this topic'}"!</p>
          </div>
          <div className="absolute top-0 left-0 w-full h-full opacity-10 z-0"> <div className="absolute -top-5 -left-5 w-20 h-20 rounded-full bg-white/30 animate-pulse"></div> <div className="absolute bottom-5 right-5 w-32 h-32 rounded-lg bg-white/20 animate-pulse transform rotate-45" style={{ animationDelay: '0.5s' }}></div> <div className="absolute top-1/2 left-1/4 w-16 h-16 rounded-full bg-white/25 animate-pulse" style={{ animationDelay: '1s' }}></div> </div>
        </div>
        <div className="p-6 md:p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 150 }} className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 flex flex-col items-center justify-center shadow-sm border border-indigo-100 text-center">
               <div className="relative mb-3"> <span className="text-4xl md:text-5xl font-bold text-indigo-700">{userScore}</span> <span className="text-xl font-semibold text-gray-500 absolute -right-6 top-1 md:top-2">/ {totalQuestions}</span> </div>
              <div className="text-sm font-medium text-indigo-600 mb-3">Your Score</div>
              <div className="mt-2 w-full max-w-xs bg-white/50 rounded-full h-2.5"><motion.div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2.5 rounded-full" initial={{ width: 0 }} animate={{ width: `${scorePercentage}%` }} transition={{ duration: 1.5, delay: 0.5, ease: "circOut" }} /></div>
              <div className="w-full max-w-xs text-right mt-1"><span className="text-xs text-indigo-600 font-medium">{scorePercentage}% Correct</span></div>
            </motion.div>
             <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, type: "spring", stiffness: 150 }} className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 flex flex-col items-center justify-center shadow-sm border border-purple-100">
                <div className="relative w-28 h-28">
                    <svg viewBox="0 0 36 36" className="w-full h-full block transform -rotate-90"><path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e9ecef" strokeWidth="3" /><motion.path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="url(#percentileGradient)" strokeWidth="3" strokeDasharray="100, 100" initial={{ strokeDashoffset: 100 }} animate={{ strokeDashoffset: 100 - percentile }} transition={{ duration: 1.5, delay: 0.7, ease: "circOut" }} strokeLinecap="round" /><defs><linearGradient id="percentileGradient" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#8b5cf6" /><stop offset="100%" stopColor="#6366f1" /></linearGradient></defs></svg>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center"><div className="text-3xl font-bold text-indigo-700">{percentile}<span className="text-xl">%</span></div><div className="text-xs text-indigo-600">Percentile</div></div>
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center">You scored better than {percentile}% of participants.</p>
            </motion.div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            {[ { icon: ClockIcon, label: "Total Time", value: totalTimeSpent, delay: 0.4 }, { icon: Activity, label: "Avg. Time / Q", value: `${timePerQuestion}s`, delay: 0.5 }, { icon: CheckSquare, label: "Completion", value: `${completionRate}%`, delay: 0.6 }, ].map(stat => ( <motion.div key={stat.label} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: stat.delay }} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center"> <stat.icon className="h-6 w-6 text-indigo-500 mb-2" /> <div className="text-xl md:text-2xl font-semibold text-gray-800">{stat.value}</div> <div className="text-xs text-gray-500 mt-1">{stat.label}</div> </motion.div> ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {difficulty && Object.keys(difficulty).length > 0 && ( <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }} className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100"> <h3 className="text-base md:text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2"> <BarChart2 className="h-5 w-5 text-indigo-500"/> Performance by Difficulty </h3> <HorizontalBarChart data={difficulty} /> </motion.div> )}
            {subtopicPerformance && Object.keys(subtopicPerformance).length > 0 && (
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }} className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 flex flex-col items-center">
                     <h3 className="text-base md:text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2 self-start"> <PieChartIcon className="h-5 w-5 text-indigo-500"/> Subtopic Performance </h3>
                     <CustomPieChart data={Object.fromEntries(Object.entries(subtopicPerformance).map(([key, val]) => [key, val.percentage || 0]))} size={160}/>
                    <div className="mt-4 text-xs flex flex-wrap justify-center gap-x-4 gap-y-1 w-full">
                       {Object.entries(subtopicPerformance).slice(0, 7).map(([key, val], i) => { const colors = ['#4f46e5', '#3b82f6', '#10b981', '#8b5cf6', '#f97316', '#ef4444', '#f59e0b']; return ( <div key={key} className="flex items-center"> <span className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: colors[i % colors.length] }}></span> <span>{key}: {val.percentage}%</span> </div> ); })}
                        {Object.keys(subtopicPerformance).length > 7 && <span className="text-gray-500">...</span>}
                    </div>
                 </motion.div>
            )}
          </div>
           {timelineData && timelineData.length > 1 && ( <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.85 }} className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100"> <h3 className="text-base md:text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2"> <TrendingUp className="h-5 w-5 text-indigo-500"/> Progress Timeline </h3> <TimelineChart data={timelineData} width={700} height={150} /> </motion.div> )}
          {strengthsAndWeaknesses && (strengthsAndWeaknesses.strengths?.length > 0 || strengthsAndWeaknesses.weaknesses?.length > 0) && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.9 }} className="bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 rounded-xl p-6 shadow-sm border border-indigo-100">
              <h3 className="text-base md:text-lg font-semibold mb-4 text-gray-800">Analysis & Feedback</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div> <h4 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-2"> <ThumbsUp className="h-4 w-4" /> Strengths </h4> {strengthsAndWeaknesses.strengths?.length > 0 ? ( <ul className="space-y-2 list-none pl-0"> {strengthsAndWeaknesses.strengths.map((strength, i) => ( <li key={i} className="text-sm flex items-start gap-2 text-gray-700"> <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" /> <span>{strength}</span> </li> ))} </ul> ) : ( <p className="text-sm text-gray-500 italic">Keep practicing to identify key strengths!</p> )} </div>
                <div> <h4 className="text-sm font-medium text-amber-700 mb-2 flex items-center gap-2"> <HelpCircle className="h-4 w-4" /> Areas for Improvement </h4> {strengthsAndWeaknesses.weaknesses?.length > 0 ? ( <ul className="space-y-2 list-none pl-0"> {strengthsAndWeaknesses.weaknesses.map((weakness, i) => ( <li key={i} className="text-sm flex items-start gap-2 text-gray-700"> <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" /> <span>{weakness}</span> </li> ))} </ul> ) : ( <p className="text-sm text-gray-500 italic">No specific areas highlighted for improvement. Great job!</p> )} </div>
              </div>
            </motion.div>
           )}
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="flex justify-center mt-6">
               <button onClick={() => { setQuiz(null); setTopic(''); setSelectedCategory(null); setError(''); setAnswers({}); setCurrentQuestion(0); setTimeSpent(0); setStartTime(null); setProgressHistory([]); setSubmitted(false); setResult(null); }} className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-lg hover:shadow-lg transition flex items-center gap-2 font-medium text-base"> <RefreshCw className="h-5 w-5" /> Start New Quiz </button>
           </motion.div>
        </div>
      </motion.div>
    );
  };


   const renderCelebration = () => (
    <AnimatePresence>
      {showCelebration && result && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="absolute inset-0 bg-black/10 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.5, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.5, opacity: 0, y: 50 }} transition={{ type: "spring", stiffness: 300, damping: 20, duration: 0.5 }} className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white p-8 rounded-xl shadow-2xl flex flex-col items-center text-center z-10 max-w-sm mx-4 pointer-events-auto">
            <motion.div initial={{ scale: 0 }} animate={{ scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] }} transition={{ delay: 0.2, duration: 0.6 }} className="text-5xl mb-4"> 🎉 </motion.div>
            <h3 className="text-xl font-bold mb-2">Quiz Completed!</h3>
            <p className="text-indigo-100">Great job! You scored {result.userScore} out of {result.totalQuestions}.</p>
          </motion.div>
          <div ref={confettiRef} className="absolute inset-0"> {/* Confetti library integration point */} </div>
        </div>
      )}
    </AnimatePresence>
  );

  // --- Main Render ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 flex relative">
      {renderSidebar()}
       {showSidebar && ( <div onClick={() => setShowSidebar(false)} className="fixed inset-0 bg-black/30 z-20 lg:hidden" aria-hidden="true" /> )}
      <div className={`flex-1 min-h-screen transition-all duration-300 ${showSidebar ? 'lg:ml-64' : 'ml-0'}`}>
        {renderHeader()}
        <main className="flex flex-col items-center justify-start p-4 md:p-6 lg:p-8 min-h-[calc(100vh-theme(spacing.16))]">
          <AnimatePresence mode="wait">
            {!quiz && !submitted && renderQuizGenerator()}
            {quiz && !submitted && renderQuizQuestion()}
            {submitted && result && renderResults()}
          </AnimatePresence>
        </main>
      </div>
      {renderCelebration()}
    </div>
  );
};

export default QuizDashboard;