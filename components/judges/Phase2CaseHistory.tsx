'use client';

// Phase 2 Case History Component for Judge Profiles
// @ui sub-agent implementation

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line
} from 'recharts';
import { 
    Calendar,
    Scale,
    TrendingUp,
    Users,
    DollarSign,
    FileText,
    Filter,
    Download,
    Eye
} from 'lucide-react';

interface CaseData {
    id: string;
    case_number: string;
    case_name: string;
    practice_area: string;
    filing_date: string;
    decision_date?: string;
    status: string;
    case_value?: number;
    outcome?: string;
    attorneys: {
        name: string;
        firm?: string;
        role: string;
    }[];
    parties: {
        plaintiff?: string;
        defendant?: string;
    };
}

interface JudgeAnalytics {
    practice_area: string;
    total_cases: number;
    plaintiff_wins: number;
    defendant_wins: number;
    settlements: number;
    average_case_duration: number;
    average_case_value: number;
}

interface Phase2CaseHistoryProps {
    judgeId: string;
    judgeName: string;
    courtName: string;
}

export default function Phase2CaseHistory({ judgeId, judgeName, courtName }: Phase2CaseHistoryProps) {
    const [cases, setCases] = useState<CaseData[]>([]);
    const [analytics, setAnalytics] = useState<JudgeAnalytics[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPracticeArea, setSelectedPracticeArea] = useState<string>('All');
    const [timeRange, setTimeRange] = useState<string>('2-years');

    const practiceAreaColors: Record<string, string> = {
        'Personal Injury': '#ef4444',
        'Family Law': '#3b82f6',
        'Real Estate': '#10b981',
        'Business Litigation': '#f59e0b',
        'Estate Planning': '#8b5cf6',
        'Criminal Defense': '#ef4444',
        'Employment Law': '#06b6d4',
        'Immigration': '#84cc16',
        'Bankruptcy': '#f97316',
        'General Civil': '#6b7280'
    };

    const fetchCaseHistory = useCallback(async () => {
        try {
            const params = new URLSearchParams({
                practice_area: selectedPracticeArea !== 'All' ? selectedPracticeArea : '',
                time_range: timeRange
            });

            const response = await fetch(`/api/judges/${judgeId}/case-history?${params}`);
            if (response.ok) {
                const data = await response.json();
                setCases(data.cases || []);
            }
        } catch (error) {
            console.error('Error fetching case history:', error);
            // Use sample data for demonstration
            setCases(generateSampleCases());
        } finally {
            setLoading(false);
        }
    }, [judgeId, selectedPracticeArea, timeRange]);

    const fetchJudgeAnalytics = useCallback(async () => {
        try {
            const response = await fetch(`/api/judges/${judgeId}/analytics`);
            if (response.ok) {
                const data = await response.json();
                setAnalytics(data.analytics || []);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
            // Use sample analytics for demonstration
            setAnalytics(generateSampleAnalytics());
        }
    }, [judgeId]);

    useEffect(() => {
        fetchCaseHistory();
        fetchJudgeAnalytics();
    }, [judgeId, selectedPracticeArea, timeRange, fetchCaseHistory, fetchJudgeAnalytics]);

    const generateSampleCases = (): CaseData[] => {
        return [
            {
                id: '1',
                case_number: '23-CV-12345',
                case_name: 'Smith v. Newport Medical Center',
                practice_area: 'Personal Injury',
                filing_date: '2023-03-15',
                decision_date: '2023-09-22',
                status: 'decided',
                case_value: 850000,
                outcome: 'Plaintiff verdict',
                attorneys: [
                    { name: 'Michael Johnson', firm: 'Newport Beach Personal Injury Group', role: 'plaintiff' },
                    { name: 'Sarah Davis', firm: 'Medical Defense Associates', role: 'defendant' }
                ],
                parties: {
                    plaintiff: 'John Smith',
                    defendant: 'Newport Medical Center'
                }
            },
            {
                id: '2',
                case_number: '23-FL-67890',
                case_name: 'In re Marriage of Anderson',
                practice_area: 'Family Law',
                filing_date: '2023-06-10',
                decision_date: '2023-11-15',
                status: 'decided',
                case_value: 125000,
                outcome: 'Custody to petitioner',
                attorneys: [
                    { name: 'Lisa Chen', firm: 'Orange County Family Law Associates', role: 'petitioner' },
                    { name: 'Robert Wilson', firm: 'Family Law Defense Group', role: 'respondent' }
                ],
                parties: {
                    plaintiff: 'Jennifer Anderson',
                    defendant: 'Mark Anderson'
                }
            },
            {
                id: '3',
                case_number: '24-BC-11111',
                case_name: 'TechCorp v. Innovation Solutions',
                practice_area: 'Business Litigation',
                filing_date: '2024-01-20',
                status: 'pending',
                case_value: 2500000,
                attorneys: [
                    { name: 'David Park', firm: 'Dana Point Business Litigation Firm', role: 'plaintiff' },
                    { name: 'Amanda Torres', firm: 'Corporate Defense Partners', role: 'defendant' }
                ],
                parties: {
                    plaintiff: 'TechCorp Inc.',
                    defendant: 'Innovation Solutions LLC'
                }
            }
        ];
    };

    const generateSampleAnalytics = (): JudgeAnalytics[] => {
        return [
            {
                practice_area: 'Personal Injury',
                total_cases: 45,
                plaintiff_wins: 28,
                defendant_wins: 12,
                settlements: 5,
                average_case_duration: 189,
                average_case_value: 750000
            },
            {
                practice_area: 'Family Law',
                total_cases: 78,
                plaintiff_wins: 35,
                defendant_wins: 25,
                settlements: 18,
                average_case_duration: 145,
                average_case_value: 85000
            },
            {
                practice_area: 'Business Litigation',
                total_cases: 23,
                plaintiff_wins: 12,
                defendant_wins: 8,
                settlements: 3,
                average_case_duration: 267,
                average_case_value: 1250000
            },
            {
                practice_area: 'Real Estate',
                total_cases: 34,
                plaintiff_wins: 18,
                defendant_wins: 11,
                settlements: 5,
                average_case_duration: 156,
                average_case_value: 450000
            }
        ];
    };

    const practiceAreas = ['All', ...Array.from(new Set(analytics.map(a => a.practice_area)))];

    const filteredCases = selectedPracticeArea === 'All' 
        ? cases 
        : cases.filter(c => c.practice_area === selectedPracticeArea);

    const totalCases = analytics.reduce((sum, a) => sum + a.total_cases, 0);
    const totalValue = cases.reduce((sum, c) => sum + (c.case_value || 0), 0);
    const avgDuration = analytics.length > 0 
        ? Math.round(analytics.reduce((sum, a) => sum + a.average_case_duration, 0) / analytics.length)
        : 0;

    if (loading) {
        return (
            <Card className="w-full">
                <CardContent className="p-6">
                    <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Filters */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-xl font-bold">
                                📊 Phase 2: Case History & Analytics
                            </CardTitle>
                            <p className="text-gray-600 mt-1">
                                2-year case patterns for Judge {judgeName} • {courtName}
                            </p>
                        </div>
                        <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </Button>
                            <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-2" />
                                Full Report
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex space-x-4 mb-4">
                        <div className="flex items-center space-x-2">
                            <Filter className="h-4 w-4" />
                            <label className="text-sm font-medium">Practice Area:</label>
                            <select 
                                value={selectedPracticeArea}
                                onChange={(e) => setSelectedPracticeArea(e.target.value)}
                                className="border rounded px-3 py-1 text-sm"
                            >
                                {practiceAreas.map(area => (
                                    <option key={area} value={area}>{area}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <label className="text-sm font-medium">Time Range:</label>
                            <select 
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                                className="border rounded px-3 py-1 text-sm"
                            >
                                <option value="6-months">Last 6 Months</option>
                                <option value="1-year">Last Year</option>
                                <option value="2-years">Last 2 Years</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <FileText className="h-8 w-8 text-blue-600 mr-3" />
                            <div>
                                <p className="text-sm text-gray-600">Total Cases</p>
                                <p className="text-2xl font-bold">{totalCases}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <DollarSign className="h-8 w-8 text-green-600 mr-3" />
                            <div>
                                <p className="text-sm text-gray-600">Total Case Value</p>
                                <p className="text-2xl font-bold">
                                    ${(totalValue / 1000000).toFixed(1)}M
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <Calendar className="h-8 w-8 text-orange-600 mr-3" />
                            <div>
                                <p className="text-sm text-gray-600">Avg Duration</p>
                                <p className="text-2xl font-bold">{avgDuration} days</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center">
                            <Users className="h-8 w-8 text-purple-600 mr-3" />
                            <div>
                                <p className="text-sm text-gray-600">Active Attorneys</p>
                                <p className="text-2xl font-bold">
                                    {Array.from(new Set(cases.flatMap(c => c.attorneys.map(a => a.name)))).length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Practice Area Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Cases by Practice Area</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={analytics}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ practice_area, percent }) => `${practice_area} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="total_cases"
                                >
                                    {analytics.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={practiceAreaColors[entry.practice_area] || '#6b7280'} 
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Outcome Patterns */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Ruling Patterns by Practice Area</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={analytics}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="practice_area" 
                                    angle={-45}
                                    textAnchor="end"
                                    height={100}
                                    fontSize={12}
                                />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="plaintiff_wins" stackId="a" fill="#10b981" name="Plaintiff Wins" />
                                <Bar dataKey="defendant_wins" stackId="a" fill="#ef4444" name="Defendant Wins" />
                                <Bar dataKey="settlements" stackId="a" fill="#f59e0b" name="Settlements" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Cases List */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Recent Cases</CardTitle>
                    <p className="text-sm text-gray-600">
                        {filteredCases.length} cases {selectedPracticeArea !== 'All' && `in ${selectedPracticeArea}`}
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {filteredCases.slice(0, 10).map((case_item) => (
                            <div key={case_item.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-lg">{case_item.case_name}</h4>
                                        <p className="text-sm text-gray-600">
                                            Case #{case_item.case_number} • Filed {new Date(case_item.filing_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Badge 
                                            variant="secondary"
                                            style={{ 
                                                backgroundColor: (practiceAreaColors[case_item.practice_area] || '#6b7280') + '20',
                                                color: practiceAreaColors[case_item.practice_area] || '#6b7280'
                                            }}
                                        >
                                            {case_item.practice_area}
                                        </Badge>
                                        <Badge variant={case_item.status === 'decided' ? 'default' : 'outline'}>
                                            {case_item.status}
                                        </Badge>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">Parties</p>
                                        <p className="text-sm text-gray-600">
                                            {case_item.parties.plaintiff} v. {case_item.parties.defendant}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">Attorneys</p>
                                        <div className="text-sm text-gray-600">
                                            {case_item.attorneys.map((attorney, idx) => (
                                                <div key={idx}>
                                                    {attorney.name} ({attorney.firm})
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">Details</p>
                                        <div className="text-sm text-gray-600">
                                            {case_item.case_value && (
                                                <div>Value: ${(case_item.case_value / 1000).toFixed(0)}K</div>
                                            )}
                                            {case_item.outcome && (
                                                <div>Outcome: {case_item.outcome}</div>
                                            )}
                                            {case_item.decision_date && (
                                                <div>Decided: {new Date(case_item.decision_date).toLocaleDateString()}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {filteredCases.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No cases found for the selected criteria.</p>
                            <p className="text-sm mt-2">Try adjusting the practice area or time range filters.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Attorney Intelligence */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">💼 Attorney Marketing Intelligence</CardTitle>
                    <p className="text-sm text-gray-600">
                        Active attorneys in this judge's cases - potential advertising targets
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from(
                            new Map(
                                cases.flatMap(c => c.attorneys.map(a => [a.firm || a.name, a]))
                            ).values()
                        ).slice(0, 6).map((attorney, idx) => (
                            <div key={idx} className="border rounded-lg p-4">
                                <h4 className="font-semibold">{attorney.name}</h4>
                                <p className="text-sm text-gray-600">{attorney.firm}</p>
                                <div className="mt-2">
                                    <Badge variant="outline" className="text-xs">
                                        🎯 Advertising Target
                                    </Badge>
                                </div>
                                <div className="mt-2 text-xs text-gray-500">
                                    Cases: {cases.filter(c => 
                                        c.attorneys.some(a => a.name === attorney.name)
                                    ).length}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

