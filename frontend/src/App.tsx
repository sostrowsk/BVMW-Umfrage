import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./features/auth/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import SurveyList from "./pages/SurveyList";
import SurveyDetail from "./pages/SurveyDetail";
import SurveyEditor from "./pages/SurveyEditor";
import Members from "./pages/Members";
import Organizations from "./pages/Organizations";
import Analytics from "./pages/Analytics";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="surveys" element={<SurveyList />} />
              <Route path="surveys/new" element={<SurveyEditor />} />
              <Route path="surveys/:id" element={<SurveyDetail />} />
              <Route path="surveys/:id/edit" element={<SurveyEditor />} />
              <Route path="members" element={<Members />} />
              <Route path="organizations" element={<Organizations />} />
              <Route path="analytics" element={<Analytics />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}
export default App;
