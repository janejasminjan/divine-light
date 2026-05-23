import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useGetUserProfile } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Loader2 } from "lucide-react";

import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Onboarding from "@/pages/onboarding";
import QuranList from "@/pages/quran-list";
import QuranReading from "@/pages/quran-reading";
import Practice from "@/pages/practice";
import Memorize from "@/pages/memorize";
import Review from "@/pages/review";
import ProgressPage from "@/pages/progress-page";
import Settings from "@/pages/settings";
import Reminders from "@/pages/reminders";
import BookmarksPage from "@/pages/bookmarks";
import Dhikr from "@/pages/dhikr";
import DhikrReader from "@/pages/dhikr-reader";
import HadithHome from "@/pages/hadith";
import HadithBook from "@/pages/hadith-book";
import HadithReader from "@/pages/hadith-reader";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function AppContent() {
  const { data: profile, isLoading, error } = useGetUserProfile();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50 mb-4" />
        <p className="text-muted-foreground animate-pulse text-sm">Loading your space...</p>
      </div>
    );
  }

  if (!profile?.onboardingCompleted) {
    return <Onboarding />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/">
          <Redirect to="/dashboard" />
        </Route>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/quran" component={QuranList} />
        <Route path="/quran/:surahId" component={QuranReading} />
        <Route path="/practice" component={Practice} />
        <Route path="/memorize" component={Memorize} />
        <Route path="/review" component={Review} />
        <Route path="/progress" component={ProgressPage} />
        <Route path="/settings" component={Settings} />
        <Route path="/reminders" component={Reminders} />
        <Route path="/bookmarks" component={BookmarksPage} />
        <Route path="/dhikr" component={Dhikr} />
        <Route path="/dhikr/:collectionId" component={DhikrReader} />
        <Route path="/hadith" component={HadithHome} />
        <Route path="/hadith/:bookId" component={HadithBook} />
        <Route path="/hadith/:bookId/:sectionId" component={HadithReader} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppContent />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
