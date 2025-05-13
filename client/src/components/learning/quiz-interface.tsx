
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
}

interface QuizProps {
  title: string;
  questions: Question[];
}

export default function QuizInterface({ title, questions }: QuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const calculateScore = () => {
    return questions.reduce((score, question, index) => {
      return score + (selectedAnswers[index] === question.correctAnswer ? 1 : 0);
    }, 0);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {!showResults ? (
          <div className="space-y-6">
            <div className="text-sm text-light-base/70">
              Question {currentQuestion + 1} of {questions.length}
            </div>
            
            <h3 className="text-xl font-medium">
              {questions[currentQuestion].text}
            </h3>
            
            <RadioGroup
              value={selectedAnswers[currentQuestion]?.toString()}
              onValueChange={(value) => handleAnswer(parseInt(value))}
            >
              {questions[currentQuestion].options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
            
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(curr => curr - 1)}
                disabled={currentQuestion === 0}
              >
                Previous
              </Button>
              
              {currentQuestion === questions.length - 1 ? (
                <Button onClick={() => setShowResults(true)}>
                  Finish Quiz
                </Button>
              ) : (
                <Button onClick={() => setCurrentQuestion(curr => curr + 1)}>
                  Next
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">
              Quiz Complete!
            </h3>
            <p className="text-xl mb-6">
              Your score: {calculateScore()} out of {questions.length}
            </p>
            <Button onClick={() => {
              setShowResults(false);
              setCurrentQuestion(0);
              setSelectedAnswers([]);
            }}>
              Retake Quiz
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
