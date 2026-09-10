import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import RoadmapEditor from "./RoadmapEditor";
import { TeamLayoutContext } from "@/layouts/TeamLayout";
import { Button } from "@/components/ui/button";

const TeamRoadmapEditor = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { team, user } = useOutletContext<TeamLayoutContext>();

  // Security check: Only team admins can edit the roadmap
  const isUserAdmin = team.members.find(m => 
    m.id === user?.id || m.name === user?.name
  )?.isAdmin;

  if (!isUserAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <h2 className="text-xl font-bold text-gray-800">Access Denied</h2>
        <p className="text-gray-600 mt-2">Only Team Admins can edit the roadmap.</p>
        <Button onClick={() => navigate(`/team/${team.id}/roadmap`)} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return <RoadmapEditor context="team" teamId={teamId} />;
};

export default TeamRoadmapEditor;

