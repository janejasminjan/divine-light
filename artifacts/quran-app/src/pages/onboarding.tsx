import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useCompleteOnboarding, OnboardingBodyGoal, OnboardingBodyLevel, getGetUserProfileQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Book, Brain, Target, Globe } from "lucide-react";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    displayName: "",
    goal: OnboardingBodyGoal.all,
    level: OnboardingBodyLevel.beginner,
    dailyDurationMinutes: 15,
  });

  const completeOnboarding = useCompleteOnboarding();

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    if (completeOnboarding.isPending) return;
    completeOnboarding.mutate(
      { data: formData },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey() });
          setLocation("/dashboard");
        },
      }
    );
  };

  const goals = [
    { id: OnboardingBodyGoal.recite, title: "Learn to Recite", icon: Book, desc: "Improve reading fluency and tajweed" },
    { id: OnboardingBodyGoal.memorize, title: "Memorize (Hifz)", icon: Brain, desc: "Commit verses to heart with SRS" },
    { id: OnboardingBodyGoal.understand, title: "Understand Meanings", icon: Globe, desc: "Focus on translation and tafsir" },
    { id: OnboardingBodyGoal.all, title: "All of the Above", icon: Target, desc: "A comprehensive learning journey" },
  ];

  const levels = [
    { id: OnboardingBodyLevel.beginner, title: "Beginner", desc: "Just starting to read Arabic letters" },
    { id: OnboardingBodyLevel.intermediate, title: "Intermediate", desc: "Can read with some hesitation" },
    { id: OnboardingBodyLevel.advanced, title: "Advanced", desc: "Fluent reader, want to focus on memorization/meaning" },
  ];

  const durations = [5, 10, 15, 30, 60];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-serif text-primary mb-2">Welcome to Qiyam</h1>
          <p className="text-muted-foreground">Let's set up your personal space.</p>
        </div>

        <div className="relative overflow-hidden bg-card p-6 shadow-xl shadow-primary/5 rounded-2xl border border-border">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-xl font-medium">What is your primary goal?</h2>
                  <p className="text-sm text-muted-foreground">You can always change this later.</p>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  {goals.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setFormData({ ...formData, goal: g.id })}
                      className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all ${
                        formData.goal === g.id
                          ? "border-primary bg-secondary/10 shadow-sm"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <g.icon className={`h-6 w-6 ${formData.goal === g.id ? "text-primary" : "text-muted-foreground"}`} />
                      <div>
                        <div className="font-medium">{g.title}</div>
                        <div className="text-xs text-muted-foreground">{g.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-xl font-medium">What is your current level?</h2>
                  <p className="text-sm text-muted-foreground">This helps us tailor your starting point.</p>
                </div>
                
                <div className="space-y-3">
                  {levels.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setFormData({ ...formData, level: l.id })}
                      className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all ${
                        formData.level === l.id
                          ? "border-primary bg-secondary/10 shadow-sm"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div>
                        <div className="font-medium">{l.title}</div>
                        <div className="text-sm text-muted-foreground">{l.desc}</div>
                      </div>
                      <div className={`h-4 w-4 rounded-full border ${formData.level === l.id ? "border-4 border-primary" : "border-muted-foreground"}`} />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-xl font-medium">Set your daily target</h2>
                  <p className="text-sm text-muted-foreground">Consistency is more important than quantity.</p>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label>How many minutes per day?</Label>
                    <div className="flex flex-wrap gap-2">
                      {durations.map((d) => (
                        <button
                          key={d}
                          onClick={() => setFormData({ ...formData, dailyDurationMinutes: d })}
                          className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                            formData.dailyDurationMinutes === d
                              ? "bg-primary text-primary-foreground shadow-md"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {d} min
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="name">Display Name (Optional)</Label>
                    <Input 
                      id="name" 
                      placeholder="How should we address you?" 
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      className="bg-background"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 flex justify-between pt-4 border-t border-border/50">
            <Button variant="ghost" onClick={handleBack} disabled={step === 1}>
              Back
            </Button>
            
            <div className="flex space-x-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`h-1.5 w-8 rounded-full ${step >= i ? "bg-primary" : "bg-primary/20"}`} />
              ))}
            </div>

            {step < 3 ? (
              <Button onClick={handleNext}>Next</Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={completeOnboarding.isPending}
              >
                {completeOnboarding.isPending ? "Setting up..." : "Complete Setup"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
