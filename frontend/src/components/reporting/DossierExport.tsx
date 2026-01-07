// Digital Dossier Export Component
export const DigitalDossierGenerator = ({ caseId }: { caseId?: string }) => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Digital Dossier Generator</h2>
      <p className="text-sm text-muted-foreground">Case ID: {caseId || 'Not specified'}</p>
      <p className="text-sm text-muted-foreground">Generate comprehensive financial dossiers from case data</p>
      <p className="text-xs text-muted-foreground">Create, download, and manage multiple dossiers</p>
    </div>
  );
};

export default DigitalDossierGenerator;
