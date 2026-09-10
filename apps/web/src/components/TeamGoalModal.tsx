import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Check, AlertTriangle, Clock, Trophy } from "lucide-react";
import { useTeamContext } from "@/contexts/TeamContext";
import { useRoadmapsContext } from "@/contexts/RoadmapsContext";
import { TeamGoal } from "@/lib/mockData";
import rewardIcon from "@/assets/icons/reward.png";
import roadmapIcon from "@/assets/icons/roadmap.png";

interface TeamGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
}

const TeamGoalModal = ({ isOpen, onClose, teamId }: TeamGoalModalProps) => {
  const navigate = useNavigate();
  const { teams, getTeamGoals, addGoal, deleteGoal } = useTeamContext();
  const { roadmaps, units } = useRoadmapsContext();
  const goals = getTeamGoals(teamId);
  
  // Get team and its roadmap to determine max units
  const team = teams.find(t => t.id === teamId);
  const teamRoadmap = team?.currentRoadmapId 
    ? roadmaps.find(r => r.id.toString() === team.currentRoadmapId)
    : null;
  const totalUnitsInRoadmap = teamRoadmap 
    ? units.filter(u => u.roadmapId.toString() === teamRoadmap.id.toString()).length
    : 20; // fallback to 20 if no roadmap found
  
  const [goalType, setGoalType] = useState("units");
  const [goalAmount, setGoalAmount] = useState("");
  const [goalWeeks, setGoalWeeks] = useState("1");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'add' | 'remove' | 'replace' | null>(null);
  const [confirmStep, setConfirmStep] = useState<'confirm' | 'success'>('confirm');
  const [goalToRemove, setGoalToRemove] = useState<string | null>(null);
  const [showReplaceWarning, setShowReplaceWarning] = useState(false);

  // Calculate minimum based on goal type and amount
  const calculateMinimum = (type: string, amount: number): number => {
    if (type === "units") {
      if (amount === 1) return 1;
      if (amount <= 9) return Math.max(1, amount - 2);
      return Math.ceil(amount * 0.6);
    } else {
      // Points
      return Math.ceil(amount * 0.6);
    }
  };

  // Calculate badges based on goal type and amount
  const calculateBadges = (type: string, amount: number): number => {
    if (type === "units") {
      if (amount === 2) return 1;
      if (amount >= 3 && amount <= 4) return 2;
      if (amount >= 5) return 3;
      return 0;
    } else {
      // Points
      if (amount < 1000) return 1;
      if (amount >= 1000 && amount < 2000) return 2;
      if (amount >= 2000 && amount < 3000) return 3;
      if (amount >= 3000) return 4;
      return 0;
    }
  };

  // Handle goal type change and clear amount
  const handleGoalTypeChange = (newType: string) => {
    setGoalType(newType);
    setGoalAmount(""); // Clear the amount when switching types
  };

  // Validate and format points input
  const handlePointsInput = (value: string) => {
    const numValue = parseInt(value);
    if (isNaN(numValue)) {
      setGoalAmount("");
      return;
    }
    
    // Ensure it's between 200 and 20000 and multiple of 100
    const clampedValue = Math.max(200, Math.min(20000, numValue));
    const roundedValue = Math.round(clampedValue / 100) * 100;
    setGoalAmount(roundedValue.toString());
  };

  // Handle units input
  const handleUnitsInput = (value: string) => {
    const numValue = parseInt(value);
    if (isNaN(numValue)) {
      setGoalAmount("");
      return;
    }
    
    // Ensure it's between 1 and the total number of units in the roadmap
    const clampedValue = Math.max(1, Math.min(totalUnitsInRoadmap, numValue));
    setGoalAmount(clampedValue.toString());
  };

  const handleRemoveGoal = (goalId: string) => {
    setGoalToRemove(goalId);
    setConfirmAction('remove');
    setConfirmStep('confirm');
    setShowConfirmModal(true);
  };

  const handleAddGoal = () => {
    if (goalAmount && goalWeeks) {
      // Check if there's already a goal (only one goal allowed)
      if (goals.length > 0) {
        setShowReplaceWarning(true);
      } else {
        setConfirmAction('add');
        setConfirmStep('confirm');
        setShowConfirmModal(true);
      }
    }
  };

  const handleReplaceGoal = () => {
    setShowReplaceWarning(false);
    setConfirmAction('replace');
    setConfirmStep('confirm');
    setShowConfirmModal(true);
  };

  const confirmRemoveGoal = () => {
    if (goalToRemove !== null) {
      deleteGoal(goalToRemove);
      setConfirmStep('success');
      setTimeout(() => {
        setShowConfirmModal(false);
        setGoalToRemove(null);
        setConfirmAction(null);
        setConfirmStep('confirm');
      }, 2000);
    }
  };

  const confirmAddGoal = () => {
    const amount = parseInt(goalAmount);
    const minimum = calculateMinimum(goalType, amount);
    const badges = calculateBadges(goalType, amount);
    
    const newGoalData: Omit<TeamGoal, 'id'> = {
      teamId,
      type: goalType as "units" | "points",
      amount: amount,
      weeks: parseInt(goalWeeks),
      badges: badges,
      description: `${amount} ${goalType}${goalType === "points" ? ` (${minimum} each minimum)` : ""} ${goalWeeks === "1" ? "weekly" : `in ${goalWeeks} weeks`} for ${badges} badge${badges > 1 ? 's' : ''}.`,
      startDate: new Date().toISOString()
    };
    
    addGoal(newGoalData);
    setGoalAmount("");
    setGoalWeeks("1");
    setConfirmStep('success');
    setTimeout(() => {
      setShowConfirmModal(false);
      setConfirmAction(null);
      setConfirmStep('confirm');
      onClose();
      navigate(`/team/${teamId}`);
    }, 2000);
  };

  const confirmReplaceGoal = () => {
    const amount = parseInt(goalAmount);
    const minimum = calculateMinimum(goalType, amount);
    const badges = calculateBadges(goalType, amount);
    
    // Delete the existing goal first
    if (goals.length > 0) {
      deleteGoal(goals[0].id);
    }
    
    const newGoalData: Omit<TeamGoal, 'id'> = {
      teamId,
      type: goalType as "units" | "points",
      amount: amount,
      weeks: parseInt(goalWeeks),
      badges: badges,
      description: `${amount} ${goalType}${goalType === "points" ? ` (${minimum} each minimum)` : ""} ${goalWeeks === "1" ? "weekly" : `in ${goalWeeks} weeks`} for ${badges} badge${badges > 1 ? 's' : ''}.`,
      startDate: new Date().toISOString()
    };
    
    addGoal(newGoalData);
    setGoalAmount("");
    setGoalWeeks("1");
    setConfirmStep('success');
    setTimeout(() => {
      setShowConfirmModal(false);
      setConfirmAction(null);
      setConfirmStep('confirm');
      onClose();
      navigate(`/team/${teamId}`);
    }, 2000);
  };

  const handleConfirmAction = () => {
    if (confirmAction === 'remove') {
      confirmRemoveGoal();
    } else if (confirmAction === 'add') {
      confirmAddGoal();
    } else if (confirmAction === 'replace') {
      confirmReplaceGoal();
    }
  };

  const currentAmount = parseInt(goalAmount) || 0;
  const calculatedMinimum = currentAmount > 0 && goalType === "points" ? calculateMinimum(goalType, currentAmount) : 0;
  const calculatedBadges = currentAmount > 0 ? calculateBadges(goalType, currentAmount) : 0;

  return (
    <>
      {/* Replace Warning Modal */}
      <Dialog open={showReplaceWarning} onOpenChange={setShowReplaceWarning}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span>Replace Current Goal?</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-center">
            <p className="text-sm text-gray-600">
              Your team already has a goal. Only one goal is allowed per team. 
              Setting a new goal will replace the current one.
            </p>
            <div className="flex space-x-3 justify-center">
              <Button variant="outline" onClick={() => setShowReplaceWarning(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleReplaceGoal}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Replace Goal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-md min-w-[100px] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center space-x-2">
              {confirmStep === 'confirm' ? (
                <>
                  {confirmAction === 'remove' ? (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  ) : (
                    <Plus className="h-5 w-5 text-green-500" />
                  )}
                  <span>
                    {confirmAction === 'remove' ? 'Remove Goal?' : confirmAction === 'replace' ? 'Replace Goal?' : 'Add Goal?'}
                  </span>
                </>
              ) : (
                <>
                  <Check className="h-5 w-5 text-green-500" />
                  <span>
                    {confirmAction === 'remove' ? 'Goal Removed!' : 'Goal Set!'}
                  </span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {confirmStep === 'confirm' ? (
            <div className="space-y-4">
              <p className="text-center text-gray-600">
                {confirmAction === 'remove' 
                  ? 'Are you sure you want to remove this goal? This action cannot be undone.'
                  : confirmAction === 'replace'
                  ? 'This will replace your current team goal. Continue?'
                  : 'Set this as your team goal? All team members will be notified.'}
              </p>
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleConfirmAction}
                  className={`flex-1 ${
                    confirmAction === 'remove' 
                      ? 'bg-red-500 hover:bg-red-600' 
                      : 'bg-green-500 hover:bg-green-600'
                  } text-white`}
                >
                  Confirm
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                {confirmAction === 'remove' 
                  ? 'The team goal has been removed.'
                  : 'Your team goal has been set successfully!'}
              </p>
              <div className="animate-bounce text-4xl">
                {confirmAction === 'remove' ? '🗑️' : '🎯'}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Main Goal Modal */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl bg-ekana-white-bg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="p-1 hover:bg-gray-100"
                onClick={onClose}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span>Team Goal</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Current Goals Section */}
            {goals.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Current Goal</h3>
                {goals.map((goal) => (
                  <Card key={goal.id} className="bg-ekana-green-dark border-none">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="bg-ekana-white/10 p-2 rounded-lg">
                            {goal.type === "units" ? (
                              <img 
                                src={roadmapIcon} 
                                alt="Units" 
                                className="h-5 w-5"
                              />
                            ) : (
                              <img 
                                src={rewardIcon} 
                                alt="Points" 
                                className="h-5 w-5"
                              />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-ekana-white font-medium">{goal.description}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Clock className="h-3 w-3 text-ekana-white/70" />
                              <span className="text-xs text-ekana-white/70">
                                Started {new Date(goal.startDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveGoal(goal.id)}
                          className="text-red-300 hover:text-red-100 hover:bg-red-500/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Set New Goal Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">
                {goals.length > 0 ? 'Replace with New Goal' : 'Set Team Goal'}
              </h3>
              
              {/* Goal Type Selection */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleGoalTypeChange("units")}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    goalType === "units"
                      ? "border-ekana-green-dark bg-ekana-green-light/10"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <img 
                    src={roadmapIcon} 
                    alt="Units" 
                    className="h-8 w-8 mx-auto mb-2"
                  />
                  <p className={`font-medium ${
                    goalType === "units" ? "text-ekana-green-dark" : "text-gray-600"
                  }`}>
                    Units
                  </p>
                </button>
                
                <button
                  onClick={() => handleGoalTypeChange("points")}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    goalType === "points"
                      ? "border-ekana-green-dark bg-ekana-green-light/10"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <img 
                    src={rewardIcon} 
                    alt="Points" 
                    className="h-8 w-8 mx-auto mb-2"
                  />
                  <p className={`font-medium ${
                    goalType === "points" ? "text-ekana-green-dark" : "text-gray-600"
                  }`}>
                    Points
                  </p>
                </button>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {goalType === "units" ? "Number of Units" : "Total Points"}
                </label>
                <Input
                  type="number"
                  value={goalAmount}
                  onChange={(e) => {
                    if (goalType === "points") {
                      handlePointsInput(e.target.value);
                    } else {
                      handleUnitsInput(e.target.value);
                    }
                  }}
                  placeholder={goalType === "units" ? `1-${totalUnitsInRoadmap} units` : "200-20000 points (multiples of 100)"}
                  min={goalType === "units" ? 1 : 200}
                  max={goalType === "units" ? totalUnitsInRoadmap : 20000}
                  step={goalType === "points" ? 100 : 1}
                  className="text-center text-lg font-semibold"
                />
                <p className="text-xs text-gray-500 text-center">
                  {goalType === "units" 
                    ? `Set between 1-${totalUnitsInRoadmap} units for your team goal`
                    : "Set between 200-20,000 points (in increments of 100)"
                  }
                </p>
              </div>

              {/* Duration Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Duration</label>
                <Select value={goalWeeks} onValueChange={setGoalWeeks}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Week</SelectItem>
                    <SelectItem value="2">2 Weeks</SelectItem>
                    <SelectItem value="3">3 Weeks</SelectItem>
                    <SelectItem value="4">4 Weeks</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Goal Preview */}
              {currentAmount > 0 && (
                <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Goal Preview</span>
                        <div className="flex items-center space-x-1">
                          <Trophy className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-semibold text-gray-900">
                            {calculatedBadges} Badge{calculatedBadges > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      
                      <div className="bg-white/70 rounded-lg p-3">
                        <p className="text-sm text-gray-800 font-medium">
                          {currentAmount} {goalType}
                          {goalType === "points" && calculatedMinimum > 0 && (
                            <span className="text-gray-600"> ({calculatedMinimum} each minimum)</span>
                          )}
                          {" "}
                          {goalWeeks === "1" ? "weekly" : `in ${goalWeeks} weeks`}
                        </p>
                      </div>

                      <div className="text-xs text-gray-600 space-y-1">
                        <p>• Team members will work together to reach this goal</p>
                        {goalType === "points" && calculatedMinimum > 0 && (
                          <p>• Each member should contribute at least {calculatedMinimum} points</p>
                        )}
                        <p>• Earn {calculatedBadges} badge{calculatedBadges > 1 ? 's' : ''} when completed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Add Goal Button */}
              <Button
                onClick={handleAddGoal}
                disabled={!goalAmount || currentAmount === 0}
                className="w-full bg-ekana-green-dark hover:bg-ekana-green-light text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                {goals.length > 0 ? 'Replace Goal' : 'Set Goal'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TeamGoalModal;
