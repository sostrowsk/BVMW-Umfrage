import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Users,
  FileText,
  CheckCircle,
  Clock,
  Building,
  Activity,
  Star,
  ArrowUp,
  ArrowDown,
  Calendar,
} from "lucide-react";
import { getAnalyticsData } from "../api/analytics";
export default function Analytics() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: getAnalyticsData,
  });
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
        <p className="mt-4 text-sm text-gray-500">Lade Analytics-Daten...</p>
      </div>
    );
  }
  const stats = analytics?.stats || {
    totalSurveys: 0,
    totalResponses: 0,
    averageResponseRate: 0,
    totalMembers: 0,
    totalOrganizations: 0,
    averageCompletionTime: 0,
  };
  const responsesTrend = analytics?.responsesTrend || [];
  const surveyPerformance = analytics?.surveyPerformance || [];
  const organizationParticipation = analytics?.organizationParticipation || [];
  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
  const statCards = [
    {
      title: "Umfragen",
      value: stats.totalSurveys,
      icon: FileText,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
      trend: "+12%",
      trendUp: true,
    },
    {
      title: "Antworten",
      value: stats.totalResponses,
      icon: CheckCircle,
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
      trend: "+23%",
      trendUp: true,
    },
    {
      title: "Antwortrate",
      value: `${Math.round(stats.averageResponseRate * 100)}%`,
      icon: TrendingUp,
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
      trend: "+5%",
      trendUp: true,
    },
    {
      title: "Mitglieder",
      value: stats.totalMembers,
      icon: Users,
      bgColor: "bg-orange-100",
      iconColor: "text-orange-600",
      trend: "+18%",
      trendUp: true,
    },
    {
      title: "Organisationen",
      value: stats.totalOrganizations,
      icon: Building,
      bgColor: "bg-indigo-100",
      iconColor: "text-indigo-600",
      trend: "+8%",
      trendUp: true,
    },
    {
      title: "Ø Zeit",
      value: `${Math.round(stats.averageCompletionTime / 60)}m`,
      icon: Clock,
      bgColor: "bg-red-100",
      iconColor: "text-red-600",
      trend: "-15%",
      trendUp: false,
    },
  ];
  return (
    <div className="px-4 sm:px-0">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Analytics Dashboard
        </h1>
        <p className="mt-2 text-gray-600">
          Überwachen Sie die Umfrageleistung und Engagement-Metriken
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="card p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 ${stat.bgColor} rounded-lg`}>
                  <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
                <div
                  className={`flex items-center gap-1 text-xs font-semibold ${stat.trendUp ? "text-green-600" : "text-red-600"}`}
                >
                  {stat.trendUp ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                  {stat.trend}
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-gray-600">{stat.title}</p>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Antwort-Trend
            </h2>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="h-3 w-3" />
              Letzte 30 Tage
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={responsesTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="responses"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ fill: "#3B82F6", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Umfrage-Performance
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={surveyPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="title" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar
                dataKey="responses"
                fill="url(#colorGradient1)"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="completionRate"
                fill="url(#colorGradient2)"
                radius={[8, 8, 0, 0]}
              />
              <defs>
                <linearGradient id="colorGradient1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                </linearGradient>
                <linearGradient id="colorGradient2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity={1} />
                  <stop offset="100%" stopColor="#D97706" stopOpacity={1} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Organisationsbeteiligung
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={organizationParticipation}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {organizationParticipation.map((_entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-6 lg:col-span-2">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Aktuelle Aktivitäten
            </h2>
          </div>
          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {analytics?.recentActivity?.map((activity: any, index: number) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all"
              >
                <div
                  className={`w-2 h-10 rounded-full ${
                    activity.type === "response"
                      ? "bg-green-500"
                      : activity.type === "survey"
                        ? "bg-blue-500"
                        : "bg-gray-400"
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {activity.timestamp}
                  </p>
                </div>
              </div>
            )) || (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
                  <Activity className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">
                  Keine aktuellen Aktivitäten
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Top-Umfragen</h2>
          <span className="text-sm text-gray-500">Nach Performance</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Umfrage
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Antworten
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Abschlussrate
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Ø Zeit
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Zufriedenheit
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {analytics?.topSurveys?.map((survey: any) => (
                <tr key={survey.id} className="hover:bg-gray-50 transition-all">
                  <td className="px-4 py-4">
                    <span className="font-medium text-gray-800">
                      {survey.title}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {survey.responses}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-700">
                        {Math.round(survey.completionRate * 100)}%
                      </span>
                      <div className="flex-1 max-w-[100px] h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all duration-500"
                          style={{ width: `${survey.completionRate * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>{Math.round(survey.avgTime / 60)} min</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 transition-colors ${
                            i < Math.round(survey.satisfaction)
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-600">
                        {survey.satisfaction?.toFixed(1)}
                      </span>
                    </div>
                  </td>
                </tr>
              )) || (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
                      <FileText className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500">
                      Keine Umfragedaten verfügbar
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
