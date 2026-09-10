import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from './contexts/AuthContext';
import { UserSettingsProvider } from './contexts/UserSettingsContext';
import { UserProfileProvider } from './contexts/UserProfileContext';
import { ProgressProvider } from './contexts/ProgressContext';
import { RoadmapsProvider } from './contexts/RoadmapsContext';
import { TeamProvider } from './contexts/TeamContext';
import { RequestProvider } from './contexts/RequestContext';
import { ChatProvider } from './contexts/ChatContext';
import { GamificationProvider } from './contexts/GamificationContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Teams from './pages/Teams';
import Connect from './pages/Connect';
import Courses from './pages/Courses';
import Premium from './pages/Premium';
import TeamSpace from './pages/TeamSpace';
import TeamRoadmap from './pages/TeamRoadmap';
import TeamLeaderboard from "./pages/TeamLeaderboard";
import EkkyAI from "./pages/EkkyAI";
import TeamSettings from './pages/TeamSettings';
import TeamRequest from "./pages/TeamRequest";
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Inbox from './pages/Inbox';
import DirectMessage from './pages/DirectMessage';
import DirectMessagePage from './pages/DirectMessagePage';
import CollaborationPreview from './pages/CollaborationPreview';
import PersonalRoadmap from './pages/PersonalRoadmap';
import UnitPage from './pages/UnitPage';
import RoadmapEditor from './pages/RoadmapEditor';
import TeamRoadmapEditor from './pages/TeamRoadmapEditor';
import UserProfilePage from './pages/UserProfilePage';
import TeamProfilePage from './pages/TeamProfilePage';
import TeamLayout from './layouts/TeamLayout';
import { Toaster } from 'sonner';

const queryClient = new QueryClient();

// Provider hierarchy: 
// - TeamProvider must wrap RoadmapsProvider (RoadmapsContext uses useTeamContext)
// - TeamProvider must wrap RequestProvider (RequestContext uses useTeamContext)
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UserSettingsProvider>
          <UserProfileProvider>
            <GamificationProvider>
              <ProgressProvider>
                <TeamProvider>
                  <RoadmapsProvider>
                    <RequestProvider>
                      <ChatProvider>
                        <NotificationProvider>
                          <Router>
                          <Toaster />
                          <Routes>
                            <Route path="/" element={<Landing />} />
                            <Route path="/auth" element={<Auth />} />
                            <Route path="/onboarding" element={
                              <ProtectedRoute>
                                <Onboarding />
                              </ProtectedRoute>
                            } />
                            <Route path="/dashboard" element={
                              <ProtectedRoute>
                                <Dashboard />
                              </ProtectedRoute>
                            } />
                            <Route path="/teams" element={
                              <ProtectedRoute>
                                <Teams />
                              </ProtectedRoute>
                            } />
                            <Route path="/connect" element={
                              <ProtectedRoute>
                                <Connect />
                              </ProtectedRoute>
                            } />
                            <Route path="/courses" element={
                              <ProtectedRoute>
                                <Courses />
                              </ProtectedRoute>
                            } />
                            <Route path="/roadmap/new" element={
                              <ProtectedRoute>
                                <RoadmapEditor />
                              </ProtectedRoute>
                            } />
                            <Route path="/roadmap/:roadmapId/edit" element={
                              <ProtectedRoute>
                                <RoadmapEditor />
                              </ProtectedRoute>
                            } />
                            <Route path="/roadmap/:roadmapId" element={
                              <ProtectedRoute>
                                <PersonalRoadmap />
                              </ProtectedRoute>
                            } />
                            <Route path="/roadmap/:roadmapId/unit/:unitId" element={
                              <ProtectedRoute>
                                <UnitPage />
                              </ProtectedRoute>
                            } />
                            <Route path="/roadmap/:roadmapId/unit/:unitId/locked" element={
                              <ProtectedRoute>
                                <UnitPage />
                              </ProtectedRoute>
                            } />
                            <Route path="/premium" element={
                              <ProtectedRoute>
                                <Premium />
                              </ProtectedRoute>
                            } />
                            <Route path="/profile" element={
                              <ProtectedRoute>
                                <Profile />
                              </ProtectedRoute>
                            } />
                            <Route path="/profile/:userId" element={
                              <ProtectedRoute>
                                <UserProfilePage />
                              </ProtectedRoute>
                            } />
                            <Route path="/team/profile/:teamId" element={
                              <ProtectedRoute>
                                <TeamProfilePage />
                              </ProtectedRoute>
                            } />
                            <Route path="/settings" element={
                              <ProtectedRoute>
                                <Settings />
                              </ProtectedRoute>
                            } />
                            <Route path="/inbox" element={
                              <ProtectedRoute>
                                <Inbox />
                              </ProtectedRoute>
                            } />
                            <Route path="/direct-message/:messageId" element={
                              <ProtectedRoute>
                                <DirectMessage />
                              </ProtectedRoute>
                            } />
                            <Route path="/collaboration-preview/:id" element={
                              <ProtectedRoute>
                                <CollaborationPreview />
                              </ProtectedRoute>
                            } />
                            <Route path="/team/:teamId" element={
                              <ProtectedRoute>
                                <TeamLayout />
                              </ProtectedRoute>
                            }>
                              <Route index element={<TeamSpace />} />
                              <Route path="leaderboard" element={<TeamLeaderboard />} />
                              <Route path="roadmap" element={<TeamRoadmap />} />
                              <Route path="roadmap/:roadmapId/edit" element={<TeamRoadmapEditor />} />
                              <Route path="roadmap/:roadmapId/unit/:unitId" element={<UnitPage />} />
                              <Route path="ekky-ai" element={<EkkyAI />} />
                              <Route path="settings" element={<TeamSettings />} />
                            </Route>
                            <Route path="/team/:teamId/dm/:otherUserId" element={
                              <ProtectedRoute>
                                <DirectMessagePage />
                              </ProtectedRoute>
                            } />
                            <Route path="/team-request" element={
                              <ProtectedRoute>
                                <TeamRequest />
                              </ProtectedRoute>
                            } />
                            <Route path="/request-team-up/:receiverId" element={
                              <ProtectedRoute>
                                <TeamRequest />
                              </ProtectedRoute>
                            } />
                          </Routes>
                          </Router>
                        </NotificationProvider>
                      </ChatProvider>
                    </RequestProvider>
                  </RoadmapsProvider>
                </TeamProvider>
              </ProgressProvider>
            </GamificationProvider>
          </UserProfileProvider>
        </UserSettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
