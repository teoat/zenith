/**
 * MensReaAnalyzer - Phase 6F Collaborative Evidence Building
 * Intent pattern recognition for establishing criminal intent
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card.tsx";
import { Button } from "@/components/ui/Button.tsx";
import { Badge } from "@/components/ui/Badge.tsx";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/Tabs.tsx";
import { ScrollArea } from "@/components/ui/ScrollArea.tsx";
import {
  Brain,
  Target,
  CheckCircle,
  XCircle,
  HelpCircle,
  Scale,
  Book,
  MessageSquare,
  TrendingUp,
  Clock,
  FileText,
  Eye,
  ThumbsUp,
  Lightbulb,
  Shield,
} from "lucide-react";
import "./MensReaAnalyzer.css";

// Types
interface IntentIndicator {
  id: string;
  category:
    | "knowledge"
    | "premeditation"
    | "concealment"
    | "pattern"
    | "communication";
  title: string;
  description: string;
  strength: "weak" | "moderate" | "strong";
  confidence: number;
  evidence: string[];
  suggestedQuestions: string[];
}

interface IntentTimeline {
  date: Date;
  event: string;
  significance: "low" | "medium" | "high";
  category: string;
}

interface LegalElement {
  element: string;
  satisfied: boolean;
  evidence: string[];
  notes?: string;
}

interface MensReaAnalyzerProps {
  caseId?: string;
  indicators?: IntentIndicator[];
  timeline?: IntentTimeline[];
  onIndicatorClick?: (indicator: IntentIndicator) => void;
}

// Mock data
const generateMockData = () => {
  const indicators: IntentIndicator[] = [
    {
      id: "ind1",
      category: "knowledge",
      title: "Prior Knowledge of Regulations",
      description:
        "Subject attended multiple compliance training sessions and acknowledged understanding.",
      strength: "strong",
      confidence: 92,
      evidence: [
        "Training records",
        "Signed acknowledgments",
        "Email confirmations",
      ],
      suggestedQuestions: [
        "When was the last training attended?",
        "Were there compliance reminders?",
      ],
    },
    {
      id: "ind2",
      category: "premeditation",
      title: "Advance Planning",
      description:
        "Evidence shows structured planning over 3+ months including entity creation.",
      strength: "strong",
      confidence: 88,
      evidence: [
        "Entity registration dates",
        "Pre-arranged account openings",
        "Calendar entries",
      ],
      suggestedQuestions: [
        "What was the timeline for entity setup?",
        "Were there consultants involved?",
      ],
    },
    {
      id: "ind3",
      category: "concealment",
      title: "Active Concealment Efforts",
      description:
        "Multiple shell companies used to obscure beneficial ownership.",
      strength: "strong",
      confidence: 95,
      evidence: [
        "Corporate structure",
        "Nominee directors",
        "PO Box addresses",
      ],
      suggestedQuestions: [
        "Who are the ultimate beneficial owners?",
        "Why use nominee directors?",
      ],
    },
    {
      id: "ind4",
      category: "pattern",
      title: "Repeated Conduct",
      description:
        "Similar transaction patterns observed across multiple quarters.",
      strength: "moderate",
      confidence: 75,
      evidence: ["Transaction analysis", "Quarterly reports"],
      suggestedQuestions: [
        "Is this consistent with business operations?",
        "Were there legitimate explanations?",
      ],
    },
    {
      id: "ind5",
      category: "communication",
      title: "Incriminating Communications",
      description:
        'Emails discussing "keeping things off the books" and using code words.',
      strength: "strong",
      confidence: 98,
      evidence: ["Email thread #A234", "Chat logs", "Voice recordings"],
      suggestedQuestions: [
        "What is the context of these communications?",
        "Who were the recipients?",
      ],
    },
  ];

  const timeline: IntentTimeline[] = [
    {
      date: new Date("2024-01-15"),
      event: "First shell company registered",
      significance: "high",
      category: "premeditation",
    },
    {
      date: new Date("2024-02-20"),
      event: "Offshore account opened",
      significance: "high",
      category: "concealment",
    },
    {
      date: new Date("2024-03-10"),
      event: "First suspicious transfer",
      significance: "medium",
      category: "pattern",
    },
    {
      date: new Date("2024-04-05"),
      event: "Compliance inquiry received",
      significance: "medium",
      category: "knowledge",
    },
    {
      date: new Date("2024-04-12"),
      event: "Evasive response to inquiry",
      significance: "high",
      category: "concealment",
    },
    {
      date: new Date("2024-05-20"),
      event: 'Internal email about "keeping quiet"',
      significance: "high",
      category: "communication",
    },
  ];

  return { indicators, timeline };
};

// Intent Indicator Card Component
const IndicatorCard: React.FC<{
  indicator: IntentIndicator;
  onClick: () => void;
}> = ({ indicator, onClick }) => {
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      knowledge: <Book className="w-4 h-4" />,
      premeditation: <Clock className="w-4 h-4" />,
      concealment: <Eye className="w-4 h-4" />,
      pattern: <TrendingUp className="w-4 h-4" />,
      communication: <MessageSquare className="w-4 h-4" />,
    };
    return icons[category] || <Target className="w-4 h-4" />;
  };

  const getStrengthColor = (strength: string) => {
    const colors: Record<string, string> = {
      strong: "text-emerald-400 bg-emerald-500/20",
      moderate: "text-amber-400 bg-amber-500/20",
      weak: "text-slate-400 bg-slate-500/20",
    };
    return colors[strength];
  };

  return (
    <div
      className="indicator-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick();
        }
      }}
    >
      <div className="indicator-header">
        <div className={`indicator-icon ${indicator.category}`}>
          {getCategoryIcon(indicator.category)}
        </div>
        <div className="indicator-info">
          <h4 className="indicator-title">{indicator.title}</h4>
          <Badge className={getStrengthColor(indicator.strength)}>
            {indicator.strength}
          </Badge>
        </div>
        <div className="confidence-ring">
          <svg viewBox="0 0 36 36">
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="rgba(100, 116, 139, 0.3)"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke={
                indicator.confidence >= 80
                  ? "#22c55e"
                  : indicator.confidence >= 60
                    ? "#f59e0b"
                    : "#64748b"
              }
              strokeWidth="3"
              strokeDasharray={`${indicator.confidence}, 100`}
            />
          </svg>
          <span className="confidence-value">{indicator.confidence}%</span>
        </div>
      </div>

      <p className="indicator-description">{indicator.description}</p>

      <div className="indicator-evidence">
        <span className="evidence-label">Supporting Evidence:</span>
        <div className="evidence-tags">
          {indicator.evidence.map((ev, i) => (
            <Badge key={i} variant="outline" className="evidence-tag">
              {ev}
            </Badge>
          ))}
        </div>
      </div>

      <div className="indicator-questions">
        <Lightbulb className="w-3 h-3" />
        <span className="questions-label">Suggested question:</span>
        <span className="question-text">{indicator.suggestedQuestions[0]}</span>
      </div>
    </div>
  );
};

export const MensReaAnalyzer: React.FC<MensReaAnalyzerProps> = ({
  caseId: _caseId,
  indicators: propIndicators,
  timeline: propTimeline,
  onIndicatorClick,
}) => {
  const mockData = useMemo(() => generateMockData(), []);
  const indicators = propIndicators || mockData.indicators;
  const timeline = propTimeline || mockData.timeline;

  const [activeTab, setActiveTab] = useState("indicators");
  const [_selectedIndicator, setSelectedIndicator] =
    useState<IntentIndicator | null>(null);

  // Calculate overall intent score
  const intentScore = useMemo(() => {
    const weights = { strong: 3, moderate: 2, weak: 1 };
    const totalWeight = indicators.reduce(
      (sum, ind) => sum + weights[ind.strength] * (ind.confidence / 100),
      0,
    );
    const maxWeight = indicators.length * 3;
    return Math.round((totalWeight / maxWeight) * 100);
  }, [indicators]);

  // Legal elements (simplified for demonstration)
  const legalElements: LegalElement[] = useMemo(
    () => [
      {
        element: "Willful Intent",
        satisfied: indicators.some(
          (i) => i.category === "knowledge" && i.strength === "strong",
        ),
        evidence: indicators
          .filter((i) => i.category === "knowledge")
          .flatMap((i) => i.evidence),
      },
      {
        element: "Knowledge of Wrongdoing",
        satisfied: indicators.some(
          (i) =>
            (i.category === "knowledge" || i.category === "communication") &&
            i.confidence >= 80,
        ),
        evidence: indicators
          .filter(
            (i) => i.category === "knowledge" || i.category === "communication",
          )
          .flatMap((i) => i.evidence),
      },
      {
        element: "Deliberate Action",
        satisfied: indicators.some(
          (i) => i.category === "premeditation" && i.strength !== "weak",
        ),
        evidence: indicators
          .filter((i) => i.category === "premeditation")
          .flatMap((i) => i.evidence),
      },
      {
        element: "Attempt to Conceal",
        satisfied: indicators.some((i) => i.category === "concealment"),
        evidence: indicators
          .filter((i) => i.category === "concealment")
          .flatMap((i) => i.evidence),
      },
    ],
    [indicators],
  );

  const handleIndicatorClick = useCallback(
    (indicator: IntentIndicator) => {
      setSelectedIndicator(indicator);
      onIndicatorClick?.(indicator);
    },
    [onIndicatorClick],
  );

  return (
    <Card className="mens-rea-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="mens-rea-icon">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Mens Rea Analyzer</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Intent pattern recognition & legal element analysis
              </p>
            </div>
          </div>
          <div className="intent-meter">
            <div className="intent-score-ring">
              <svg viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="rgba(100, 116, 139, 0.2)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={
                    intentScore >= 70
                      ? "#ef4444"
                      : intentScore >= 50
                        ? "#f59e0b"
                        : "#22c55e"
                  }
                  strokeWidth="8"
                  strokeDasharray={`${intentScore * 2.51} 251`}
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="intent-score-label">
                <span className="score-value">{intentScore}</span>
                <span className="score-text">Intent Score</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
            <TabsTrigger value="indicators" className="gap-2">
              <Target className="w-4 h-4" />
              Indicators
            </TabsTrigger>
            <TabsTrigger value="legal" className="gap-2">
              <Scale className="w-4 h-4" />
              Legal Elements
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2">
              <Clock className="w-4 h-4" />
              Timeline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="indicators" className="mt-4">
            <ScrollArea className="h-[400px]">
              <div className="indicators-grid">
                {indicators.map((indicator) => (
                  <IndicatorCard
                    key={indicator.id}
                    indicator={indicator}
                    onClick={() => handleIndicatorClick(indicator)}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="legal" className="mt-4">
            <div className="legal-elements">
              {legalElements.map((element, idx) => (
                <div
                  key={idx}
                  className={`legal-element ${element.satisfied ? "satisfied" : "unsatisfied"}`}
                >
                  <div className="element-status">
                    {element.satisfied ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div className="element-content">
                    <h4 className="element-title">{element.element}</h4>
                    <div className="element-evidence">
                      {element.evidence.slice(0, 3).map((ev, i) => (
                        <Badge key={i} variant="outline">
                          {ev}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Badge
                    variant={element.satisfied ? "default" : "destructive"}
                  >
                    {element.satisfied ? "Established" : "Needs Evidence"}
                  </Badge>
                </div>
              ))}

              <div className="legal-summary">
                <Shield className="w-5 h-5" />
                <div className="summary-content">
                  <h4>Prosecutorial Assessment</h4>
                  <p>
                    {legalElements.filter((e) => e.satisfied).length} of{" "}
                    {legalElements.length} elements established.
                    {legalElements.every((e) => e.satisfied)
                      ? " Strong case for establishing criminal intent."
                      : " Additional evidence may be needed."}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            <div className="intent-timeline">
              {timeline
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .map((event, idx) => (
                  <div
                    key={idx}
                    className={`timeline-item ${event.significance}`}
                  >
                    <div className="timeline-marker" />
                    <div className="timeline-content">
                      <span className="timeline-date">
                        {event.date.toLocaleDateString()}
                      </span>
                      <p className="timeline-event">{event.event}</p>
                      <Badge variant="outline" className="timeline-category">
                        {event.category}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="quick-actions">
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-1" />
            Generate Report
          </Button>
          <Button variant="outline" size="sm">
            <ThumbsUp className="w-4 h-4 mr-1" />
            Validate Findings
          </Button>
          <Button variant="outline" size="sm">
            <HelpCircle className="w-4 h-4 mr-1" />
            Request Review
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MensReaAnalyzer;
