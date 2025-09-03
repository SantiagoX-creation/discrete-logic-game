import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { ChevronRight, Trophy, Brain, Zap, Target, BookOpen, CheckCircle, XCircle, Lightbulb, RotateCcw, Star } from 'lucide-react';

const DiscreteLogicGame = () => {
  const [currentModule, setCurrentModule] = useState('home');
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [level, setLevel] = useState(1);
  const [progress, setProgress] = useState(0);
  const [showReward, setShowReward] = useState(false);

  const generateRandomExpression = (complexity) => {
    const operators = ['∧', '∨', '→', '↔'];
    const negations = ['', '¬'];
    const variables = ['P', 'Q', 'R'];
    let expr = '';
    const varCount = complexity > 2 ? 3 : 2;
    const opCount = complexity > 1 ? 2 : 1;

    expr += negations[Math.floor(Math.random() * negations.length)] + variables[0];
    for (let i = 0; i < opCount; i++) {
      expr += ` ${operators[Math.floor(Math.random() * operators.length)]} `;
      expr += negations[Math.floor(Math.random() * negations.length)] + variables[Math.min(i + 1, varCount - 1)];
    }
    return expr;
  };

  const generateRandomConditional = () => {
    const conditions = [
      { text: 'If it rains, then I will stay home', p: 'It rains', q: 'I stay home' },
      { text: 'If I study, then I will pass the exam', p: 'I study', q: 'I pass the exam' },
      { text: 'If the light is on, then the room is bright', p: 'The light is on', q: 'The room is bright' },
      { text: 'If I exercise, then I will be healthy', p: 'I exercise', q: 'I will be healthy' }
    ];
    return conditions[Math.floor(Math.random() * conditions.length)];
  };

  const TruthTableBuilder = () => {
    const [expression, setExpression] = useState(() => generateRandomExpression(level));
    const [userTable, setUserTable] = useState({});
    const [showSolution, setShowSolution] = useState(false);
    const [error, setError] = useState('');
    const [hintCount, setHintCount] = useState(0);

    const variables = Array.from(new Set(expression.match(/[PQR]/g) || []));
    if (variables.length === 0) variables.push('P');

    const generateTruthTable = (vars, expr) => {
      try {
        const rows = Math.pow(2, vars.length);
        const table = [];
        
        for (let i = 0; i < rows; i++) {
          const row = {};
          vars.forEach((v, index) => {
            row[v] = Boolean((i >> (vars.length - 1 - index)) & 1);
          });
          
          let result = expr;
          vars.forEach(v => {
            result = result.replace(new RegExp(v, 'g'), row[v] ? 'true' : 'false');
          });
          
          // Simplified evaluation logic
          result = result.replace(/¬true/g, 'false').replace(/¬false/g, 'true');
          result = result.replace(/true\s*∧\s*true/g, 'true').replace(/true\s*∧\s*false/g, 'false').replace(/false\s*∧\s*true/g, 'false').replace(/false\s*∧\s*false/g, 'false');
          result = result.replace(/true\s*∨\s*true/g, 'true').replace(/true\s*∨\s*false/g, 'true').replace(/false\s*∨\s*true/g, 'true').replace(/false\s*∨\s*false/g, 'false');
          result = result.replace(/true\s*→\s*false/g, 'false').replace(/true\s*→\s*true/g, 'true').replace(/false\s*→\s*true/g, 'true').replace(/false\s*→\s*false/g, 'true');
          result = result.replace(/true\s*↔\s*true/g, 'true').replace(/false\s*↔\s*false/g, 'true').replace(/true\s*↔\s*false/g, 'false').replace(/false\s*↔\s*true/g, 'false');

          if (!['true', 'false'].includes(result)) throw new Error('Invalid expression');
          
          row.result = result === 'true';
          table.push(row);
        }
        return table;
      } catch (e) {
        setError('Invalid logical expression. Please use P, Q, R, ∧, ∨, ¬, →, ↔.');
        return [];
      }
    };

    const correctTable = generateTruthTable(variables, expression);
    useEffect(() => {
      // Corrected: The dependency array for this useEffect was missing a variable.
      // This will ensure the variables array is correctly updated when the expression changes.
      setVariables(Array.from(new Set(expression.match(/[PQR]/g) || [])));
    }, [expression]);

    const checkAnswer = () => {
      if (error || correctTable.length === 0) return;
      let correct = 0;
      correctTable.forEach((row, index) => {
        if (userTable[index] === row.result) correct++;
      });
      const isCorrect = correct === correctTable.length;
      setScore(s => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
      setProgress(p => Math.min(p + 20, 100));
      setShowSolution(true);
      if (isCorrect) {
        setTimeout(() => {
          setExpression(generateRandomExpression(level));
          setUserTable({});
          setShowSolution(false);
          setError('');
          setHintCount(0);
        }, 2000);
      }
    };

    const provideHint = () => {
      if (hintCount < 2) {
        const firstIncorrect = correctTable.findIndex((row, i) => userTable[i] !== row.result);
        if (firstIncorrect !== -1) {
          setUserTable({ ...userTable, [firstIncorrect]: correctTable[firstIncorrect].result });
          setHintCount(h => h + 1);
        }
      }
    };

    return (
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-4 text-blue-800">Truth Table Builder (Level {level})</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Expression:</label>
            <input
              type="text"
              value={expression}
              onChange={(e) => {
                setExpression(e.target.value);
                setError('');
              }}
              className="w-full p-2 border rounded-md"
              placeholder="e.g., P ∧ Q, P ∨ ¬Q"
            />
          </div>
          {error && <div className="text-red-600 text-sm mb-4">{error}</div>}
          <div className="text-sm text-gray-600 mb-4">
            Use: ∧ (AND), ∨ (OR), ¬ (NOT), → (IMPLIES), ↔ (BICONDITIONAL)
          </div>
        </div>

        {correctTable.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-blue-50">
                  {variables.map(v => (
                    <th key={v} className="border border-gray-300 p-2 text-center font-semibold">{v}</th>
                  ))}
                  <th className="border border-gray-300 p-2 text-center font-semibold bg-blue-100">{expression}</th>
                </tr>
              </thead>
              <tbody>
                {correctTable.map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    {variables.map(v => (
                      <td key={v} className="border border-gray-300 p-2 text-center">
                        {row[v] ? 'T' : 'F'}
                      </td>
                    ))}
                    <td className="border border-gray-300 p-2 text-center">
                      <select
                        value={userTable[index] === undefined ? '' : (userTable[index] ? 'T' : 'F')}
                        onChange={(e) => setUserTable({ ...userTable, [index]: e.target.value === 'T' })}
                        className="w-full p-1 border rounded"
                      >
                        <option value="">?</option>
                        <option value="T">T</option>
                        <option value="F">F</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            onClick={checkAnswer}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={error || Object.keys(userTable).length !== correctTable.length}
          >
            Check Answer
          </button>
          <button
            onClick={() => {
              setExpression(generateRandomExpression(level));
              setUserTable({});
              setShowSolution(false);
              setHintCount(0);
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            <RotateCcw className="inline w-4 h-4 mr-1" />
            New Problem
          </button>
          <button
            onClick={provideHint}
            className={`px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 ${hintCount >= 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={hintCount >= 2}
          >
            <Lightbulb className="inline w-4 h-4 mr-1" />
            Hint ({2 - hintCount} left)
          </button>
          <button
            onClick={() => setShowSolution(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Lightbulb className="inline w-4 h-4 mr-1" />
            Show Solution
          </button>
        </div>

        {showSolution && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <h4 className="font-semibold text-green-800 mb-2">Solution:</h4>
            <div className="text-sm">
              {Object.keys(userTable).length === correctTable.length && correctTable.every((row, i) => userTable[i] === row.result) ? (
                <div className="flex items-center text-green-700">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Correct! Well done! New problem loaded.
                </div>
              ) : (
                <div className="text-green-700">
                  The correct answers are: {correctTable.map((row, i) => `Row ${i + 1}: ${row.result ? 'T' : 'F'}`).join(', ')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const PropositionEvaluator = () => {
    const [proposition, setProposition] = useState(() => generateRandomExpression(level));
    const [pValue, setPValue] = useState(Math.random() > 0.5);
    const [qValue, setQValue] = useState(Math.random() > 0.5);
    const [result, setResult] = useState(null);
    const [steps, setSteps] = useState([]);
    const [error, setError] = useState('');
    const [userAnswer, setUserAnswer] = useState(null);

    const evaluateProposition = () => {
      try {
        let expr = proposition.toLowerCase();
        const originalExpr = expr;
        const evalSteps = [`Original: ${proposition}`];

        expr = expr.replace(/p/g, pValue ? 'T' : 'F');
        expr = expr.replace(/q/g, qValue ? 'T' : 'F');
        evalSteps.push(`Substitute values: ${expr}`);

        // Correcting evaluation logic with proper operator precedence
        let prevExpr = '';
        while (expr !== prevExpr && (expr.includes('T') || expr.includes('F'))) {
          prevExpr = expr;
          
          // Negation
          expr = expr.replace(/¬t/g, 'F').replace(/¬f/g, 'T');
          // And/Or
          expr = expr.replace(/t\s*∧\s*t/g, 'T').replace(/t\s*∧\s*f/g, 'F').replace(/f\s*∧\s*t/g, 'F').replace(/f\s*∧\s*f/g, 'F');
          expr = expr.replace(/t\s*∨\s*t/g, 'T').replace(/t\s*∨\s*f/g, 'T').replace(/f\s*∨\s*t/g, 'T').replace(/f\s*∨\s*f/g, 'F');
          // Implication
          expr = expr.replace(/t\s*→\s*t/g, 'T').replace(/t\s*→\s*f/g, 'F').replace(/f\s*→\s*t/g, 'T').replace(/f\s*→\s*f/g, 'T');
          // Biconditional
          expr = expr.replace(/t\s*↔\s*t/g, 'T').replace(/f\s*↔\s*f/g, 'T').replace(/t\s*↔\s*f/g, 'F').replace(/f\s*↔\s*t/g, 'F');

          if (!['T', 'F'].includes(expr)) throw new Error('Invalid expression');
          
          const finalResult = expr.toUpperCase() === 'T';
          setResult(finalResult);
          setSteps(evalSteps);
        }
        
        const finalResult = expr.toUpperCase() === 'T';
        setResult(finalResult);
        setSteps(evalSteps);
        return finalResult;
      } catch (e) {
        setError('Invalid proposition. Use P, Q, ∧, ∨, ¬, →, ↔.');
        return false;
      }
    };
    
    const handleCheck = () => {
      const correctResult = evaluateProposition();
      const isCorrect = (userAnswer === 'true') === correctResult;

      if (isCorrect) {
        setScore(s => ({ correct: s.correct + 1, total: s.total + 1 }));
        setProgress(p => Math.min(p + 20, 100));
      } else {
        setScore(s => ({ correct: s.correct, total: s.total + 1 }));
      }
    };

    return (
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-purple-800">Proposition Evaluator (Level {level})</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Proposition:</label>
          <input
            type="text"
            value={proposition}
            onChange={(e) => {
              setProposition(e.target.value);
              setError('');
            }}
            className="w-full p-2 border rounded-md"
            placeholder="e.g., P ∧ (Q ∨ ¬P)"
          />
          {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">P value:</label>
            <select
              value={pValue}
              onChange={(e) => setPValue(e.target.value === 'true')}
              className="w-full p-2 border rounded-md"
            >
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Q value:</label>
            <select
              value={qValue}
              onChange={(e) => setQValue(e.target.value === 'true')}
              className="w-full p-2 border rounded-md"
            >
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setUserAnswer('true')}
            className={`px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 ${userAnswer === 'true' ? 'ring-2 ring-green-400' : ''}`}
          >
            True
          </button>
          <button
            onClick={() => setUserAnswer('false')}
            className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 ${userAnswer === 'false' ? 'ring-2 ring-red-400' : ''}`}
          >
            False
          </button>
        </div>

        <button
          onClick={handleCheck}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 mb-4 mt-4"
          disabled={!proposition || error || userAnswer === null}
        >
          Check Answer
        </button>
      </div>
    );
  };

  const ConditionalWorkshop = () => {
    const [statement, setStatement] = useState(() => generateRandomConditional());
    const [userAnswers, setUserAnswers] = useState({
      converse: [],
      inverse: [],
      contrapositive: []
    });
    const [showAnswers, setShowAnswers] = useState(false);
    const [scoreIncremented, setScoreIncremented] = useState(false);

    const statements = {
      'If it rains, then I will stay home': {
        original: 'P → Q',
        converse: 'Q → P',
        inverse: '¬P → ¬Q',
        contrapositive: '¬Q → ¬P',
        p: 'It rains',
        q: 'I stay home'
      },
      'If I study, then I will pass the exam': {
        original: 'P → Q',
        converse: 'Q → P',
        inverse: '¬P → ¬Q',
        contrapositive: '¬Q → ¬P',
        p: 'I study',
        q: 'I pass the exam'
      },
      'If the light is on, then the room is bright': {
        original: 'P → Q',
        converse: 'Q → P',
        inverse: '¬P → ¬Q',
        contrapositive: '¬Q → ¬P',
        p: 'The light is on',
        q: 'The room is bright'
      },
      'If I exercise, then I will be healthy': {
        original: 'P → Q',
        converse: 'Q → P',
        inverse: '¬P → ¬Q',
        contrapositive: '¬Q → ¬P',
        p: 'I exercise',
        q: 'I will be healthy'
      }
    };

    const currentStatements = statements[statement.text];

    const blocks = [
      { id: 'P', text: `P (${statement.p})`, symbol: 'P' },
      { id: 'Q', text: `Q (${statement.q})`, symbol: 'Q' },
      { id: '¬P', text: `¬P (Not ${statement.p})`, symbol: '¬P' },
      { id: '¬Q', text: `¬Q (Not ${statement.q})`, symbol: '¬Q' },
      { id: '→', text: '→ (Implies)', symbol: '→' }
    ];

    const onDragEnd = (result) => {
      const { source, destination } = result;
      if (!destination) return;

      const sourceId = source.droppableId;
      const destId = destination.droppableId;
      const draggableId = result.draggableId;
      const draggedItem = blocks.find(b => b.id === draggableId.replace(/^(converse|inverse|contrapositive)-/, ''));

      if (sourceId === destId) {
        // Reorder within the same droppable
        if (sourceId !== 'blocks') {
          const items = Array.from(userAnswers[destId]);
          const [reorderedItem] = items.splice(source.index, 1);
          items.splice(destination.index, 0, reorderedItem);
          setUserAnswers({ ...userAnswers, [destId]: items });
        }
      } else {
        // Move from source to destination
        const sourceItems = sourceId === 'blocks' ? blocks : Array.from(userAnswers[sourceId]);
        const destItems = destId === 'blocks' ? blocks : Array.from(userAnswers[destId]);
        const [movedItem] = sourceItems.splice(source.index, 1);
        destItems.splice(destination.index, 0, movedItem);

        setUserAnswers({
          ...userAnswers,
          [sourceId]: sourceId !== 'blocks' ? sourceItems : userAnswers[sourceId],
          [destId]: destId !== 'blocks' ? destItems : userAnswers[destId]
        });
      }
    };

    const checkAnswers = () => {
      const correctAnswers = {
        converse: ['Q', '→', 'P'],
        inverse: ['¬P', '→', '¬Q'],
        contrapositive: ['¬Q', '→', '¬P']
      };
      const isCorrect = Object.keys(correctAnswers).every(
        key => userAnswers[key].map(block => block.symbol).join(' ') === correctAnswers[key].join(' ')
      );
      if (!scoreIncremented) {
        setScore(s => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
        setProgress(p => Math.min(p + 20, 100));
        setScoreIncremented(true);
      }
      if (isCorrect) {
        setTimeout(() => {
          setStatement(generateRandomConditional());
          setUserAnswers({ converse: [], inverse: [], contrapositive: [] });
          setShowAnswers(false);
          setScoreIncremented(false);
        }, 2000);
      }
    };

    return (
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="p-6 bg-white rounded-lg shadow-lg">
          <h3 className="text-xl font-bold mb-4 text-green-800">Conditional Statement Workshop (Level {level})</h3>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Original Statement:</label>
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              {statement.text}
            </div>
          </div>

          <Droppable droppableId="blocks" direction="horizontal">
            {(provided) => (
              <div
                className="mb-6 p-4 bg-gray-100 rounded-md flex gap-2 flex-wrap"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                <h4 className="w-full text-sm font-medium mb-2">Available Blocks:</h4>
                {blocks.map((block, index) => (
                  <Draggable key={block.id} draggableId={block.id} index={index}>
                    {(provided) => (
                      <div
                        className="px-3 py-1 bg-blue-200 text-blue-800 rounded-md text-sm font-mono cursor-move"
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        ref={provided.innerRef}
                        title={block.text}
                      >
                        {block.symbol}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          <div className="space-y-4">
            {['converse', 'inverse', 'contrapositive'].map(type => (
              <Droppable droppableId={type} direction="horizontal" key={type}>
                {(provided) => (
                  <div>
                    <label className="block text-sm font-medium mb-2 capitalize">{type}:</label>
                    <div
                      className="p-3 bg-gray-50 border border-gray-200 rounded-md flex gap-2 min-h-[48px]"
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                      {userAnswers[type].map((block, index) => (
                        <Draggable key={`${type}-${block.id}`} draggableId={`${type}-${block.id}`} index={index}>
                          {(provided) => (
                            <div
                              className="px-3 py-1 bg-blue-200 text-blue-800 rounded-md text-sm font-mono cursor-move"
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              ref={provided.innerRef}
                              title={block.text}
                            >
                              {block.symbol}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={checkAnswers}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              disabled={Object.values(userAnswers).some(arr => arr.length !== 3)}
            >
              Check Answers
            </button>
            <button
              onClick={() => setShowAnswers(!showAnswers)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {showAnswers ? 'Hide' : 'Show'} Answers
            </button>
            <button
              onClick={() => {
                setStatement(generateRandomConditional());
                setUserAnswers({ converse: [], inverse: [], contrapositive: [] });
                setShowAnswers(false);
                setScoreIncremented(false);
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <RotateCcw className="inline w-4 h-4 mr-1" />
              Reset
            </button>
          </div>

          {showAnswers && currentStatements && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <h4 className="font-semibold text-green-800 mb-3">Correct Answers:</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Original:</strong> {currentStatements.original}</div>
                <div><strong>Converse:</strong> {currentStatements.converse}</div>
                <div><strong>Inverse:</strong> {currentStatements.inverse}</div>
                <div><strong>Contrapositive:</strong> {currentStatements.contrapositive}</div>
              </div>
            </div>
          )}
        </div>
      </DragDropContext>
    );
  };

  const EquivalenceChallenge = () => {
    const [currentPair, setCurrentPair] = useState(0);
    const [userAnswer, setUserAnswer] = useState(null);
    const [feedback, setFeedback] = useState('');
    
    const equivalencePairs = [
      { left: 'P ∧ Q', right: 'Q ∧ P', equivalent: true, law: 'Commutative Law' },
      { left: '¬(P ∨ Q)', right: '¬P ∧ ¬Q', equivalent: true, law: "De Morgan's Law" },
      { left: 'P → Q', right: '¬P ∨ Q', equivalent: true, law: 'Implication Equivalence' },
      { left: 'P ∧ (Q ∨ R)', right: '(P ∧ Q) ∨ (P ∧ R)', equivalent: true, law: 'Distributive Law' },
      { left: 'P ∨ P', right: 'P', equivalent: true, law: 'Idempotent Law' },
      { left: 'P ∧ ¬P', right: 'F', equivalent: true, law: 'Contradiction' },
      { left: 'P → Q', right: 'Q → P', equivalent: false, law: 'These are converses, not equivalent' },
      { left: generateRandomExpression(level), right: generateRandomExpression(level), equivalent: Math.random() > 0.5, law: 'Random Challenge' }
    ];

    const current = equivalencePairs[currentPair];

    const checkEquivalence = (answer) => {
      setUserAnswer(answer);
      const correct = (answer === 'yes') === current.equivalent;
      if (correct) {
        setFeedback(`✓ Correct! ${current.law}`);
        setScore(s => ({ correct: s.correct + 1, total: s.total + 1 }));
        setProgress(p => Math.min(p + 20, 100));
      } else {
        setFeedback(`✗ Incorrect. ${current.law}`);
        setScore(s => ({ correct: s.correct, total: s.total + 1 }));
      }
      
      setTimeout(() => {
        setCurrentPair((currentPair + 1) % equivalencePairs.length);
        setUserAnswer(null);
        setFeedback('');
      }, 2000);
    };

    return (
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-orange-800">Logical Equivalence Challenge (Level {level})</h3>
        
        <div className="text-center mb-6">
          <div className="text-sm text-gray-600 mb-2">Question {currentPair + 1} of {equivalencePairs.length}</div>
          <div className="text-lg mb-4">
            Are these expressions logically equivalent?
          </div>
          
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="p-3 bg-blue-100 rounded-lg font-mono text-lg">
              {current.left}
            </div>
            <div className="text-2xl">≡?</div>
            <div className="p-3 bg-blue-100 rounded-lg font-mono text-lg">
              {current.right}
            </div>
          </div>
        </div>

        {!userAnswer && (
          <div className="flex justify-center gap-4">
            <button
              onClick={() => checkEquivalence('yes')}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 text-lg"
            >
              Yes, Equivalent
            </button>
            <button
              onClick={() => checkEquivalence('no')}
              className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 text-lg"
            >
              No, Not Equivalent
            </button>
          </div>
        )}

        {feedback && (
          <div className={`mt-4 p-3 rounded-md text-center ${
            feedback.startsWith('✓') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {feedback}
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (progress >= 100) {
      setLevel(l => l + 1);
      setProgress(0);
      setShowReward(true);
      setTimeout(() => setShowReward(false), 3000);
    }
  }, [progress]);

  const modules = [
    { id: 'truthTable', name: 'Truth Table Builder', icon: Target, color: 'blue' },
    { id: 'evaluator', name: 'Proposition Evaluator', icon: Brain, color: 'purple' },
    { id: 'conditional', name: 'Conditional Workshop', icon: BookOpen, color: 'green' },
    { id: 'challenge', name: 'Equivalence Challenge', icon: Zap, color: 'orange' }
  ];

  const renderModule = () => {
    switch (currentModule) {
      case 'truthTable': return <TruthTableBuilder />;
      case 'evaluator': return <PropositionEvaluator />;
      case 'conditional': return <ConditionalWorkshop />;
      case 'challenge': return <EquivalenceChallenge />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Discrete Logic Master</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
                <Trophy className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium">
                  Score: {score.correct}/{score.total} ({score.total > 0 ? Math.round((score.correct/score.total)*100) : 0}%)
                </span>
              </div>
              <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full">
                <Star className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Level: {level}</span>
              </div>
            </div>
          </div>
          <div className="mt-2">
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-600 text-center mt-1">
              Progress to Level {level + 1}: {progress}%
            </div>
          </div>
        </div>
      </header>

      {showReward && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center animate-bounce">
            <Star className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800">Level Up!</h2>
            <p className="text-gray-600">Congratulations, you've reached Level {level}!</p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-6">
        {currentModule === 'home' ? (
          <div className="text-center">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Master Discrete Logic</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Interactive learning modules to master propositions, truth tables, logical operations, 
                and equivalences. Build your discrete mathematics foundation through hands-on practice!
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {modules.map((module) => (
                <button
                  key={module.id}
                  onClick={() => setCurrentModule(module.id)}
                  className={`p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow border-t-4 border-${module.color}-500 transform hover:-translate-y-1`}
                >
                  <module.icon className={`w-12 h-12 mx-auto mb-4 text-${module.color}-600`} />
                  <h3 className="text-lg font-semibold mb-2">{module.name}</h3>
                  <div className="flex items-center justify-center text-sm text-gray-600">
                    Start Learning <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-12 p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
              <h3 className="text-xl font-bold mb-4">Quick Reference</h3>
              <div className="grid md:grid-cols-2 gap-6 text-left">
                  <div>
                    <h4 className="font-semibold mb-2 text-blue-800">Logical Operators:</h4>
                    <div className="text-sm space-y-1">
                      <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">∧</span> Conjunction (AND)</div>
                      <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">∨</span> Disjunction (OR)</div>
                      <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">¬</span> Negation (NOT)</div>
                      <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">→</span> Implication (IF-THEN)</div>
                      <div><span className="font-mono bg-gray-100 px-2 py-1 rounded">↔</span> Biconditional (IF AND ONLY IF)</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-green-800">Key Laws:</h4>
                    <div className="text-sm space-y-1">
                      <div>De Morgan's: ¬(P ∨ Q) ≡ ¬P ∧ ¬Q</div>
                      <div>Commutative: P ∧ Q ≡ Q ∧ P</div>
                      <div>Distributive: P ∧ (Q ∨ R) ≡ (P ∧ Q) ∨ (P ∧ R)</div>
                      <div>Implication: P → Q ≡ ¬P ∨ Q</div>
                      <div>Contrapositive: P → Q ≡ ¬Q → ¬P</div>
                    </div>
                  </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <button
                onClick={() => setCurrentModule('home')}
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
                Back to Modules
              </button>
            </div>
            {renderModule()}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscreteLogicGame;
