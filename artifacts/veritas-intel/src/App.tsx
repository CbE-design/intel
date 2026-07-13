import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import HomePage from '@/app/page';
import SubjectsPage from '@/app/subjects/page';
import NewSubjectPage from '@/app/subjects/new/page';
import SubjectDetailPage from '@/app/subjects/[id]/page';
import ResearchPage from '@/app/research/page';
import IntegrationsPage from '@/app/integrations/page';
import MapPage from '@/app/map/page';
import WatchlistPage from '@/app/watchlist/page';
import CompanyPage from '@/app/company/page';
import OsintPage from '@/app/osint/page';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/subjects/new" component={NewSubjectPage} />
      <Route path="/subjects/:id" component={SubjectDetailPage} />
      <Route path="/subjects" component={SubjectsPage} />
      <Route path="/research" component={ResearchPage} />
      <Route path="/integrations" component={IntegrationsPage} />
      <Route path="/map" component={MapPage} />
      <Route path="/watchlist" component={WatchlistPage} />
      <Route path="/company" component={CompanyPage} />
      <Route path="/osint" component={OsintPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
