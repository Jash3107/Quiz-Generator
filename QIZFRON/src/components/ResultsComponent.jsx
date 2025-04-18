import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ResultsComponent = ({ token }) => {
  const [results, setResults] = useState([]);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await axios.get('http://localhost:5000/user/results', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setResults(res.data.submissions);
      } catch (err) {
        console.error('Failed to load results:', err);
      }
    };

    fetchResults();
  }, [token]);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Quiz Results</h2>
      {results.length === 0 ? (
        <p className="text-gray-600">No results yet.</p>
      ) : (
        <ul className="space-y-4">
          {results.map((r, i) => (
            <li key={i} className="p-4 bg-gray-100 rounded-lg">
              Quiz ID: {r.quizId} – Score: {r.score}, Percentile: {r.percentile.toFixed(2)}%
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ResultsComponent;