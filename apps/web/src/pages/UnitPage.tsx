import { useParams, useNavigate, useLocation, useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Layout from "@/components/Layout";
import UnitView from "@/components/views/UnitView";
import { TeamLayoutContext } from "@/layouts/TeamLayout";

const UnitPage = () => {
  const { teamId, roadmapId, unitId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Detect context from TeamLayout's outlet context
  const teamContext = useOutletContext<TeamLayoutContext | null>();
  const isTeamContext = !!teamContext || location.pathname.includes('/team/');
  const context: 'page' | 'team' = isTeamContext ? 'team' : 'page';
  
  // Back navigation - context-aware
  const handleBack = () => {
    if (isTeamContext) {
      navigate(`/team/${teamId}/roadmap`);
    } else {
      navigate(`/roadmap/${roadmapId}`);
    }
  };

  // Team context: no wrapper, no extra header (UnitView has its own header)
  if (isTeamContext) {
    return <UnitView context={context} />;
  }

  // Page context: wrap with Layout, UnitView handles header
  return (
    <Layout>
      <UnitView context={context} />
    </Layout>
  );
};

export default UnitPage;