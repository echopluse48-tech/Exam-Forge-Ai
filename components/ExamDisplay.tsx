
import React, { useState } from 'react';
import { Exam, Question } from '../types';

interface ExamDisplayProps {
  exam: Exam;
}

const ExamDisplay: React.FC<ExamDisplayProps> = ({ exam }) => {
  const [showAnswers, setShowAnswers] = useState(false);

  const downloadExam = () => {
    let content = `${exam.title}\n${exam.description}\n\n`;
    content += `Duration: ${exam.durationMinutes} Minutes | Total Marks: ${exam.totalMarks}\n\n`;
    
    exam.questions.forEach((q, idx) => {
      content += `Question ${idx + 1} [${q.marks} Marks] (${q.type.replace('_', ' ').toUpperCase()})\n`;
      content += `${q.text}\n`;
      
      if ((q.type === 'multiple_choice' || q.type === 'true_false') && q.options) {
        q.options.forEach((opt, i) => {
          content += `${String.fromCharCode(65 + i)}) ${opt}\n`;
        });
      }

      if (q.type === 'matching' && q.matchingPairs) {
        content += "\nColumn A          | Column B\n";
        content += "------------------|------------------\n";
        q.matchingPairs.forEach((pair, i) => {
          content += `${i + 1}. ${pair.left.padEnd(16)} | ${String.fromCharCode(65 + i)}. ${pair.right}\n`;
        });
      }

      if (q.type === 'ordering' && q.orderedItems) {
        content += "\nItems to order:\n";
        // Shuffle for the print version
        const jumbled = [...q.orderedItems].sort(() => Math.random() - 0.5);
        jumbled.forEach((item, i) => {
          content += `[ ] ${item}\n`;
        });
      }

      content += `\n`;
      if (showAnswers) {
        content += `Solution: ${q.correctAnswer}\n`;
        if (q.type === 'matching' && q.matchingPairs) {
           content += `Pairs: ${q.matchingPairs.map((p, i) => `${i+1}-${String.fromCharCode(65+i)}`).join(', ')}\n`;
        }
        if (q.type === 'ordering' && q.orderedItems) {
           content += `Correct Order: ${q.orderedItems.join(' → ')}\n`;
        }
        content += `Explanation: ${q.explanation}\n\n`;
      }
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exam.title.replace(/\s+/g, '_')}_Exam.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderQuestionSpecifics = (q: Question) => {
    switch (q.type) {
      case 'multiple_choice':
      case 'true_false':
        return q.options && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {q.options.map((opt, i) => (
              <div key={i} className="flex items-center p-4 border border-slate-200 rounded-xl hover:border-indigo-300 transition-colors cursor-pointer group">
                <span className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 text-xs flex items-center justify-center mr-3 font-bold group-hover:bg-indigo-50 group-hover:text-indigo-600 border border-slate-100">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-slate-700 text-sm">{opt}</span>
              </div>
            ))}
          </div>
        );
      case 'fill_blank':
        return (
          <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 italic text-slate-500">
            Write your answer in the space provided above.
          </div>
        );
      case 'matching':
        return q.matchingPairs && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-4">Column A</p>
              <div className="space-y-2">
                {q.matchingPairs.map((pair, i) => (
                  <div key={i} className="bg-white p-3 rounded-lg border border-slate-200 text-sm font-medium text-slate-700">
                    <span className="text-indigo-600 mr-2">{i + 1}.</span> {pair.left}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-4">Column B</p>
              <div className="space-y-2">
                {q.matchingPairs.map((pair, i) => (
                  <div key={i} className="bg-white p-3 rounded-lg border border-slate-200 text-sm font-medium text-slate-700">
                    <span className="text-emerald-600 mr-2">{String.fromCharCode(65 + i)}.</span> {pair.right}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'ordering':
        return q.orderedItems && (
          <div className="mb-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase mb-4 italic">Arrange these items in the correct order:</p>
            <div className="space-y-2">
              {[...q.orderedItems].sort(() => Math.random() - 0.5).map((item, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 flex items-center space-x-4">
                  <div className="w-6 h-6 border-2 border-slate-100 rounded-md"></div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-widest">
                Comprehensive Practice Exam
              </span>
              {exam.createdAt && (
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {new Date(exam.createdAt).toLocaleDateString()}
                 </span>
              )}
            </div>
            <h2 className="text-3xl font-bold text-slate-900">{exam.title}</h2>
            <p className="text-slate-500 mt-2">{exam.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-semibold border border-indigo-100 flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{exam.durationMinutes} min</span>
            </div>
            <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg text-sm font-semibold border border-emerald-100">
              {exam.totalMarks} Marks
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => setShowAnswers(!showAnswers)}
            className="flex-1 py-3 px-4 rounded-xl border-2 border-dashed border-indigo-200 text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors flex items-center justify-center space-x-2"
          >
            <span>{showAnswers ? "Hide Solutions" : "Reveal Solutions"}</span>
            <svg className={`w-4 h-4 transition-transform ${showAnswers ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button 
            onClick={downloadExam}
            className="py-3 px-6 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-slate-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Download .txt</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {exam.questions.map((q, idx) => (
          <div key={q.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 hover:border-indigo-100 transition-colors">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center space-x-3">
                <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                  Question {idx + 1}
                </span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                  {q.type.replace('_', ' ')}
                </span>
              </div>
              <span className="text-slate-500 text-sm font-bold bg-slate-50 px-3 py-1 rounded-lg">
                {q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}
              </span>
            </div>
            
            <p className="text-lg text-slate-800 font-medium mb-6 leading-relaxed">
              {q.text}
            </p>

            {renderQuestionSpecifics(q)}

            {showAnswers && (
              <div className="mt-8 pt-8 border-t border-slate-100 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center space-x-2 text-emerald-600 font-bold mb-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm uppercase tracking-wider">Solution Guide</span>
                </div>
                <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
                  <div className="flex flex-col space-y-2 mb-4">
                    <p className="text-emerald-900 font-bold">{q.correctAnswer}</p>
                    {q.type === 'matching' && q.matchingPairs && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold w-fit">
                        Pairs: {q.matchingPairs.map((_, i) => `${i+1}-${String.fromCharCode(65+i)}`).join(', ')}
                      </span>
                    )}
                    {q.type === 'ordering' && q.orderedItems && (
                      <div className="text-sm font-medium text-emerald-800 flex flex-wrap gap-2 items-center">
                        <span className="text-[10px] uppercase font-black text-emerald-600">Correct Sequence:</span>
                        {q.orderedItems.map((item, i) => (
                          <React.Fragment key={i}>
                            <span className="bg-emerald-200 px-2 py-1 rounded-md text-xs">{item}</span>
                            {i < q.orderedItems!.length - 1 && <span>→</span>}
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-emerald-700 text-sm italic leading-relaxed">{q.explanation}</p>
                  {q.sourceReference && (
                    <div className="mt-4 pt-3 border-t border-emerald-100 text-[10px] text-emerald-600 uppercase font-black tracking-widest flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      {q.sourceReference}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExamDisplay;
