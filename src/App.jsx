import React, { useState, useEffect } from 'react';
import KnowledgeGraph from './components/KnowledgeGraph';
import {
  fetchEnsemblGene,
  fetchEnsemblVariant,
  fetchChEMBLMolecule,
  fetchPubChemCompound,
  fetchClinicalTrials,
  fetchPubMedLiterature
} from './services/api';

export default function App() {
  const [searchTerm, setSearchTerm] = useState('Imatinib');
  const [activeTerm, setActiveTerm] = useState('Imatinib');
  const [loading, setLoading] = useState({});
  const [focusedCard, setFocusedCard] = useState(null);

  // Entities state
  const [geneData, setGeneData] = useState(null);
  const [variantData, setVariantData] = useState(null);
  const [chemblData, setChemblData] = useState(null);
  const [pubchemData, setPubchemData] = useState(null);
  const [trials, setTrials] = useState([]);
  const [literature, setLiterature] = useState([]);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerContent, setDrawerContent] = useState(null);

  // Search Filter state
  const [phaseFilter, setPhaseFilter] = useState('ALL');
  const [trialSearch, setTrialSearch] = useState('');

  const quickTags = ['Diabetes', 'BRCA1', 'Imatinib', 'Aspirin', 'Alzheimer', 'COVID-19', 'EGFR', 'rs1229984'];

  const handleSearch = async (term) => {
    if (!term.trim()) return;
    setActiveTerm(term);
    setFocusedCard(null);

    // Initialize loading states
    setLoading({ gene: true, chembl: true, trials: true, lit: true });

    // 1. Ensembl / Variant check
    if (term.toLowerCase().startsWith('rs')) {
      // It's a variant rsID
      setGeneData(null);
      fetchEnsemblVariant(term).then(data => {
        setVariantData(data?.[0] || null);
        setLoading(prev => ({ ...prev, gene: false }));
      });
    } else {
      setVariantData(null);
      fetchEnsemblGene(term).then(data => {
        setGeneData(data);
        setLoading(prev => ({ ...prev, gene: false }));
      });
    }

    // 2. ChEMBL & PubChem Molecular
    fetchChEMBLMolecule(term).then(chembl => {
      setChemblData(chembl);
      if (chembl) {
        fetchPubChemCompound(chembl.pref_name || term).then(setPubchemData);
      } else {
        fetchPubChemCompound(term).then(setPubchemData);
      }
      setLoading(prev => ({ ...prev, chembl: false }));
    });

    // 3. Clinical Trials
    fetchClinicalTrials(term).then(data => {
      setTrials(data);
      setLoading(prev => ({ ...prev, trials: false }));
    });

    // 4. PubMed Literature
    fetchPubMedLiterature(term).then(data => {
      setLiterature(data);
      setLoading(prev => ({ ...prev, lit: false }));
    });
  };

  useEffect(() => {
    handleSearch('Imatinib');
  }, []);

  const openDrawer = (type, item) => {
    setDrawerContent({ type, item });
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  // Filter clinical trials
  const filteredTrials = trials.filter(study => {
    const protocol = study.protocolSection;
    if (!protocol) return false;
    const phase = protocol.designModule?.phases?.join(', ') || 'N/A';
    const title = protocol.identificationModule?.officialTitle || protocol.identificationModule?.briefTitle || '';
    const sponsor = protocol.sponsorCollaboratorsModule?.leadSponsor?.name || '';
    
    const matchesPhase = phaseFilter === 'ALL' || phase.toUpperCase().includes(phaseFilter);
    const matchesSearch = title.toLowerCase().includes(trialSearch.toLowerCase()) || 
                          sponsor.toLowerCase().includes(trialSearch.toLowerCase());
    return matchesPhase && matchesSearch;
  });

  return (
    <div className="app-container">
      <header>
        <div className="logo-container">
          <div className="logo-icon">B</div>
          <h1>BioMed-Nexus</h1>
        </div>
        <p>Clinical & Genomic Data Intelligence Explorer</p>
      </header>

      {/* Search Input */}
      <section className="search-section" aria-label="Search Box">
        <div className="search-bar-wrapper">
          <div className="search-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <input
            type="text"
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchTerm)}
            placeholder="Search gene, variant, or drug (e.g. BRCA1, rs1229984, Imatinib)..."
          />
          <button className="search-button" onClick={() => handleSearch(searchTerm)}>Search</button>
        </div>

        <div className="quick-tags">
          <span>Suggested searches:</span>
          {quickTags.map(tag => (
            <button
              key={tag}
              className="tag-btn"
              onClick={() => {
                setSearchTerm(tag);
                handleSearch(tag);
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      {/* Main Grid */}
      <main className="dashboard-grid">
        
        {/* Left Column: Knowledge Graph and Genomic/Molecule Info */}
        <div className="sidebar-panel">
          {/* Knowledge Graph Card */}
          <div className="glass-card">
            <h2 className="card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
              Nexus Knowledge Graph
            </h2>
            <KnowledgeGraph
              term={activeTerm}
              hasGene={!!geneData || !!variantData}
              hasCompound={!!chemblData || !!pubchemData}
              trialsCount={trials.length}
              litCount={literature.length}
              onNodeClick={(id) => {
                if (id === 'gene') setFocusedCard('genomic');
                else if (id === 'compound') setFocusedCard('molecular');
                else if (id === 'trials') setFocusedCard('trials');
                else if (id === 'lit') setFocusedCard('lit');
                else setFocusedCard(null);
              }}
            />
          </div>

          {/* Genomic Lookup Card (Ensembl / dbSNP) */}
          <div className={`glass-card ${focusedCard === 'genomic' ? 'focused-card' : ''}`}>
            <h2 className="card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 12h8"></path></svg>
              Genomic Mapping (Ensembl / dbSNP)
            </h2>
            {loading.gene ? (
              <div className="loading-spinner"><div className="spinner"></div></div>
            ) : geneData ? (
              <div className="gene-detail-section">
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{geneData.display_name}</h3>
                <div style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 'bold' }}>{geneData.biotype?.toUpperCase()} • {geneData.id}</div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{geneData.description?.split('[')[0]}</p>
                <div className="gene-coord-badge" style={{ marginTop: '0.85rem' }}>
                  Chr {geneData.seq_region_name}: {geneData.start.toLocaleString()} - {geneData.end.toLocaleString()} (Strand: {geneData.strand > 0 ? '+' : '-'})
                </div>
              </div>
            ) : variantData ? (
              <div className="gene-detail-section">
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{variantData.id}</h3>
                <div style={{ color: 'var(--accent-purple)', fontSize: '0.85rem', fontWeight: 'bold' }}>VARIANT / CONSEQUENCE</div>
                <div className="gene-coord-badge" style={{ marginTop: '0.85rem' }}>
                  Consequences: {variantData.most_severe_consequence?.replace(/_/g, ' ')}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Gene association: {variantData.transcript_consequences?.[0]?.gene_symbol || 'N/A'}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <p>No associated human gene or variant sequence mapped for "{activeTerm}".</p>
              </div>
            )}
          </div>

          {/* Bioactive Molecule Card (ChEMBL / PubChem) */}
          <div className={`glass-card ${focusedCard === 'molecular' ? 'focused-card' : ''}`}>
            <h2 className="card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
              Molecular Discovery
            </h2>
            {loading.chembl ? (
              <div className="loading-spinner"><div className="spinner"></div></div>
            ) : chemblData || pubchemData ? (
              <div className="chembl-details">
                <div className="chembl-title">
                  {chemblData?.pref_name?.toUpperCase() || pubchemData?.IUPACName?.substring(0, 20).toUpperCase() || 'UNKNOWN'}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--accent-secondary)', fontWeight: 'bold' }}>
                  {chemblData?.molecule_type || 'Chemical'} • Approval Phase {chemblData?.max_phase || 'N/A'}
                </div>
                
                <div className="chembl-prop-grid" style={{ marginTop: '1rem' }}>
                  <div className="chembl-prop-card">
                    <div className="prop-label">Mol Weight</div>
                    <div className="prop-val">{chemblData?.molecule_properties?.full_mwt || pubchemData?.MolecularWeight || 'N/A'}</div>
                  </div>
                  <div className="chembl-prop-card">
                    <div className="prop-label">Formula</div>
                    <div className="prop-val">{chemblData?.molecule_properties?.empirical_formula || pubchemData?.MolecularFormula || 'N/A'}</div>
                  </div>
                </div>

                {pubchemData?.CanonicalSMILES && (
                  <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    <div className="prop-label">SMILES Representation</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all', color: 'var(--text-secondary)' }}>
                      {pubchemData.CanonicalSMILES}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-state">
                <p>No chemical compounds resolved for "{activeTerm}".</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Grid Modules */}
        <div className="main-panels">
          
          {/* Clinical Trials Finder */}
          <section className={`glass-card ${focusedCard === 'trials' ? 'focused-card' : ''}`}>
            <h2 className="card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              Clinical Trials Finder
            </h2>
            
            {/* Filters panel */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search trial text..."
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  outline: 'none',
                  flexGrow: 1
                }}
                value={trialSearch}
                onChange={(e) => setTrialSearch(e.target.value)}
              />
              <select
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
                value={phaseFilter}
                onChange={(e) => setPhaseFilter(e.target.value)}
              >
                <option value="ALL">All Phases</option>
                <option value="PHASE1">Phase 1</option>
                <option value="PHASE2">Phase 2</option>
                <option value="PHASE3">Phase 3</option>
                <option value="PHASE4">Phase 4</option>
              </select>
            </div>

            {loading.trials ? (
              <div className="loading-spinner"><div className="spinner"></div></div>
            ) : filteredTrials.length > 0 ? (
              <div className="data-list">
                {filteredTrials.map((study, idx) => {
                  const protocol = study.protocolSection;
                  const nctId = protocol.identificationModule?.nctId || 'N/A';
                  const title = protocol.identificationModule?.officialTitle || protocol.identificationModule?.briefTitle || 'Untitled Study';
                  const status = protocol.statusModule?.overallStatus || 'Unknown';
                  const sponsor = protocol.sponsorCollaboratorsModule?.leadSponsor?.name || 'N/A';
                  const phase = protocol.designModule?.phases?.join(', ') || 'N/A';

                  return (
                    <div key={nctId} className="list-item" onClick={() => openDrawer('trial', study)}>
                      <div className="item-header">
                        <span className="item-badge badge-trial">{phase}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--accent-secondary)' }}>{status}</span>
                      </div>
                      <div className="item-title">{title}</div>
                      <div className="item-snippet">{sponsor}</div>
                      <div className="item-meta">
                        <span>{nctId}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <p>No matching clinical trials found.</p>
              </div>
            )}
          </section>

          {/* PubMed Scientific Literature */}
          <section className={`glass-card ${focusedCard === 'lit' ? 'focused-card' : ''}`}>
            <h2 className="card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
              PubMed Literature Index
            </h2>
            {loading.lit ? (
              <div className="loading-spinner"><div className="spinner"></div></div>
            ) : literature.length > 0 ? (
              <div className="data-list">
                {literature.map((art, idx) => (
                  <div key={art.id} className="list-item" onClick={() => openDrawer('lit', art)}>
                    <div className="item-header">
                      <span className="item-badge badge-literature">PMID: {art.id}</span>
                    </div>
                    <div className="item-title">{art.title}</div>
                    <div className="item-snippet">{art.authors}</div>
                    <div className="item-meta">
                      <span>{art.journal}</span>
                      <span>{art.pubDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No literature findings mapped.</p>
              </div>
            )}
          </section>

        </div>
      </main>

      {/* Slide Drawer */}
      <div className={`drawer-backdrop ${drawerOpen ? 'active' : ''}`} onClick={closeDrawer}></div>
      <aside className={`detail-drawer ${drawerOpen ? 'open' : ''}`} aria-label="Details Panel">
        <div className="drawer-header">
          <span className="item-badge" style={{ background: 'rgba(255,255,255,0.06)', color: '#fff' }}>
            {drawerContent?.type?.toUpperCase()} DETAILS
          </span>
          <button className="drawer-close" onClick={closeDrawer}>&times;</button>
        </div>
        
        <div className="drawer-body">
          {drawerContent?.type === 'trial' && (() => {
            const protocol = drawerContent.item.protocolSection;
            const nctId = protocol.identificationModule?.nctId;
            return (
              <>
                <h3 className="drawer-title">{protocol.identificationModule?.officialTitle || protocol.identificationModule?.briefTitle}</h3>
                <div className="drawer-section">
                  <div className="drawer-section-title">Lead Sponsor</div>
                  <div className="drawer-content">{protocol.sponsorCollaboratorsModule?.leadSponsor?.name}</div>
                </div>
                <div className="drawer-section">
                  <div className="drawer-section-title">Brief Summary</div>
                  <div className="drawer-content">{protocol.descriptionModule?.briefSummary}</div>
                </div>
                {protocol.descriptionModule?.detailedDescription && (
                  <div className="drawer-section">
                    <div className="drawer-section-title">Detailed Description</div>
                    <div className="drawer-content" style={{ whiteSpace: 'pre-line' }}>{protocol.descriptionModule.detailedDescription}</div>
                  </div>
                )}
                <div className="drawer-section">
                  <div className="drawer-section-title">Eligibility Criteria</div>
                  <pre className="drawer-content" style={{ whiteSpace: 'pre-line', fontFamily: 'monospace', fontSize: '0.85rem', background: 'rgba(0,0,0,0.15)', padding: '0.75rem', borderRadius: '8px' }}>
                    {protocol.eligibilityModule?.eligibilityCriteria}
                  </pre>
                </div>
                <a href={`https://clinicaltrials.gov/study/${nctId}`} target="_blank" rel="noreferrer" className="drawer-link-btn">
                  View Study on ClinicalTrials.gov
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </a>
              </>
            );
          })()}

          {drawerContent?.type === 'lit' && (
            <>
              <h3 className="drawer-title">{drawerContent.item.title}</h3>
              <div className="drawer-section">
                <div className="drawer-section-title">Authors</div>
                <div className="drawer-content">{drawerContent.item.authors}</div>
              </div>
              <div className="drawer-section">
                <div className="drawer-section-title">Publication Journal</div>
                <div className="drawer-content">{drawerContent.item.journal} ({drawerContent.item.pubDate})</div>
              </div>
              <div className="drawer-section">
                <div className="drawer-section-title">Summary & Index Info</div>
                <div className="drawer-content">
                  This publication abstract is indexed in the NCBI PubMed database under the accession reference <strong>PMID: {drawerContent.item.id}</strong>.
                </div>
              </div>
              <a href={`https://pubmed.ncbi.nlm.nih.gov/${drawerContent.item.id}/`} target="_blank" rel="noreferrer" className="drawer-link-btn">
                Read Publication on PubMed
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
              </a>
            </>
          )}
        </div>
      </aside>

      <footer>
        <p>&copy; 2026 BioMed-Nexus. Querying Ensembl, ChEMBL, PubChem, ClinicalTrials.gov, and PubMed.</p>
      </footer>
    </div>
  );
}
