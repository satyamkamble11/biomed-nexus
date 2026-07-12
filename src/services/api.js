// BioMed-Nexus API Services

// 1. Ensembl Gene Lookup
export async function fetchEnsemblGene(symbol) {
  try {
    const res = await fetch(`https://rest.ensembl.org/lookup/symbol/homo_sapiens/${symbol}?content-type=application/json`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Ensembl Gene Error:', err);
    return null;
  }
}

// 2. Ensembl/VEP Variant Lookup (for rsIDs)
export async function fetchEnsemblVariant(rsid) {
  try {
    const res = await fetch(`https://rest.ensembl.org/vep/human/id/${rsid}/consequence?content-type=application/json`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Ensembl Variant Error:', err);
    return null;
  }
}

// 3. ChEMBL Molecule Lookup
export async function fetchChEMBLMolecule(term) {
  try {
    // Try exact preferred name match first
    let res = await fetch(`https://www.ebi.ac.uk/chembl/api/data/molecule.json?pref_name__iexact=${encodeURIComponent(term)}`);
    if (!res.ok) throw new Error();
    let data = await res.json();
    
    // Fallback to broader text search
    if (!data.molecules || data.molecules.length === 0) {
      res = await fetch(`https://www.ebi.ac.uk/chembl/api/data/molecule/search.json?q=${encodeURIComponent(term)}&limit=1`);
      if (!res.ok) throw new Error();
      data = await res.json();
    }
    
    return data.molecules?.[0] || null;
  } catch (err) {
    console.error('ChEMBL Error:', err);
    return null;
  }
}

// 4. PubChem Compound Lookup (as fallback/supplement for molecule chemistry)
export async function fetchPubChemCompound(term) {
  try {
    const res = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(term)}/property/MolecularFormula,MolecularWeight,IUPACName,CanonicalSMILES/JSON`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.PropertyTable?.Properties?.[0] || null;
  } catch (err) {
    console.error('PubChem Error:', err);
    return null;
  }
}

// 5. ClinicalTrials.gov (v2) Search
export async function fetchClinicalTrials(term) {
  try {
    const res = await fetch(`https://clinicaltrials.gov/api/v2/studies?query.term=${encodeURIComponent(term)}&pageSize=15`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.studies || [];
  } catch (err) {
    console.error('ClinicalTrials Error:', err);
    return [];
  }
}

// 6. PubMed Literature Search & Summary
export async function fetchPubMedLiterature(term) {
  try {
    const searchRes = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(term)}&retmode=json&retmax=8`);
    if (!searchRes.ok) return [];
    
    const searchData = await searchRes.json();
    const ids = searchData.esearchresult?.idlist;
    if (!ids || ids.length === 0) return [];
    
    const summaryRes = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`);
    if (!summaryRes.ok) return [];
    
    const summaryData = await summaryRes.json();
    const results = summaryData.result || {};
    
    return ids.map(id => {
      const info = results[id] || {};
      return {
        id,
        title: info.title || 'Untitled Publication',
        journal: info.source || 'Unknown Journal',
        pubDate: info.pubdate || 'N/A',
        authors: info.authors ? info.authors.map(a => a.name).join(', ') : 'Unknown Authors'
      };
    });
  } catch (err) {
    console.error('PubMed Error:', err);
    return [];
  }
}
