
import { authService } from './auth';
import { caseService } from './cases';
import { graphService } from './graph';
import { evidenceService } from './evidence';
import { monitoringService } from './monitoring';

const api = {
  ...authService,
  ...caseService,
  ...graphService,
  ...evidenceService, // Be careful of name collisions? 
  // Better to expose namespaces or specific methods expected by test
  // Test expects: login, getCases, getGraphData
  login: authService.login,
  getCases: caseService.getCases,
  getGraphData: graphService.getGraphData,
  
  // Expose services as well
  auth: authService,
  cases: caseService,
  graph: graphService,
  evidence: evidenceService,
  monitoring: monitoringService
};

export default api;
